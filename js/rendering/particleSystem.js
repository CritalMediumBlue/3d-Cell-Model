import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export class ParticleSystem {
  constructor(cellGroup, brownianMotion = null) {
    this.cellGroup = cellGroup;
    this.brownianMotion = brownianMotion;
    
    // Create separate groups for different transformation behaviors
    this.rotatableGroup = new THREE.Group(); // For particles, membrane, cell model
    this.staticGroup = new THREE.Group();    // For helper grids (rotation-resistant)
    
    // Add both groups to the main cellGroup
    this.cellGroup.add(this.rotatableGroup);
    this.cellGroup.add(this.staticGroup);
    
    this.proteins = [];
    this.viralParticles = [];
    this.bacteria = [];
    this.cellRadius = 7.7; //15.4 micrometers in diameter
    
    // Trail configuration
    this.trailLength = 3; // Number of trail points per particle
    this.particleTrails = new Map(); // Store trail data for each particle
  }

  createParticles(size, segments, color, number, particleGroup, minRadius, maxRadius) {
    const geometry = new THREE.SphereGeometry(size, segments, segments);
    const material = new THREE.MeshStandardMaterial({ 
            color: color,
        });

    for (let i = 0; i < number; i++) {
      const particle = new THREE.Mesh(geometry, material);
      const randomUnitVector = () => new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();  // Added parentheses here
      const randomPosition = () => randomUnitVector().multiplyScalar(
        Math.random() * (maxRadius - minRadius) + minRadius
      );
      particle.position.set(
        randomPosition().x,
        randomPosition().y,
        randomPosition().z
      );
      // Add particles to the rotatable group instead of cellGroup
      this.rotatableGroup.add(particle);
      particleGroup.push(particle);
      
      // Initialize trail for this particle
      this.initializeParticleTrail(particle, color);
    }
  }

  initializeParticleTrail(particle, baseColor) {
    const trailData = {
      positions: [],
      trailMeshes: [],
      trailLines: []
    };
    
    // Create trail points (smaller spheres with decreasing opacity)
    for (let i = 0; i < this.trailLength; i++) {
      const trailGeometry = new THREE.SphereGeometry(particle.geometry.parameters.radius , 6, 6);
      const opacity = (this.trailLength - i) / (this.trailLength + 1); // Decreasing opacity
      const trailMaterial = new THREE.MeshStandardMaterial({
        color: baseColor,
        transparent: true,
        opacity: opacity * 0.6
      });
      
      const trailMesh = new THREE.Mesh(trailGeometry, trailMaterial);
      trailMesh.visible = false; // Initially hidden
      this.rotatableGroup.add(trailMesh);
      
      trailData.trailMeshes.push(trailMesh);
    }
    
    // Create connecting lines between trail points
    for (let i = 0; i < this.trailLength; i++) {
      const lineGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(6); // 2 points × 3 coordinates
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const lineMaterial = new THREE.LineBasicMaterial({
        color: baseColor,
      });
      
      const line = new THREE.Line(lineGeometry, lineMaterial);
      line.visible = false; // Initially hidden
      this.rotatableGroup.add(line);
      
      trailData.trailLines.push(line);
    }
    
    // Store initial position
    trailData.positions.push(particle.position.clone());
    
    this.particleTrails.set(particle, trailData);
  }

  createTextLabel(text, color = 0xffffff, size = 0.4) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    // Clear canvas with transparent background
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.font = '80px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true,
      alphaTest: 0
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(size * 4, size, 1);
    
    return sprite;
  }

  updateParticleTrails() {
    // Update trails for all particles
    this.particleTrails.forEach((trailData, particle) => {
      // Add current position to trail history
      trailData.positions.push(particle.position.clone());
      
      // Remove oldest position if trail is too long
      if (trailData.positions.length > this.trailLength + 1) {
        trailData.positions.shift();
      }
      
      // Update trail mesh positions and visibility
      for (let i = 0; i < trailData.trailMeshes.length; i++) {
        const trailMesh = trailData.trailMeshes[i];
        const positionIndex = trailData.positions.length - 2 - i; // -2 to skip current position
        
        if (positionIndex >= 0 && positionIndex < trailData.positions.length) {
          const trailPosition = trailData.positions[positionIndex];
          trailMesh.position.copy(trailPosition);
          trailMesh.visible = true;
        } else {
          trailMesh.visible = false;
        }
      }
      
      // Update connecting lines
      for (let i = 0; i < trailData.trailLines.length; i++) {
        const line = trailData.trailLines[i];
        const startPosIndex = trailData.positions.length - 1 - i; // Start from current/previous position
        const endPosIndex = trailData.positions.length - 2 - i;   // End at next trail point
        
        if (startPosIndex >= 0 && endPosIndex >= 0 && 
            startPosIndex < trailData.positions.length && 
            endPosIndex < trailData.positions.length) {
          
          const startPos = trailData.positions[startPosIndex];
          const endPos = trailData.positions[endPosIndex];
          
          // Update line geometry
          const positions = line.geometry.attributes.position.array;
          positions[0] = startPos.x;
          positions[1] = startPos.y;
          positions[2] = startPos.z;
          positions[3] = endPos.x;
          positions[4] = endPos.y;
          positions[5] = endPos.z;
          
          line.geometry.attributes.position.needsUpdate = true;
          line.visible = true;
        } else {
          line.visible = false;
        }
      }
    });
  }

  createCellMembrane() {
    const geometry = new THREE.SphereGeometry(this.cellRadius, 60, 60);
    const material = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      wireframe: false,
      transparent: true, 
      opacity: 0.2
    });
    const membrane = new THREE.Mesh(geometry, material);
    membrane.position.set(0, 0, 0); // Center the membrane
    // Add membrane to rotatable group
    this.rotatableGroup.add(membrane);
  }

  createHelperGrid(){
   // Add a plane grid helper to represent the 1 μm scale
    const gridHelperSmall = new THREE.GridHelper(30, 30, 0xff0000, 0x00ffff);
    gridHelperSmall.position.y = -this.cellRadius; // Position it at the bottom of the cell
    // Add grids to static group (won't rotate)
    this.staticGroup.add(gridHelperSmall);

    // Add a larger grid helper to represent the 10 μm scale
    const gridHelperBig = new THREE.GridHelper(30, 6, 0xff0000, 0xff0000);
    gridHelperBig.position.y = -this.cellRadius ; // Position it at the bottom of the cell
    this.staticGroup.add(gridHelperBig); 

    // Store references for TouchHandler compatibility
    this.cellGroup.gridHelperSmall = gridHelperSmall;
    this.cellGroup.gridHelperBig = gridHelperBig;

 
    
    // Add labels to the grid helpers to indicate 1 μm steps and 10 μm steps
    for (let i = -15; i <= 15; i += 5) {
        
        const label = i;
        const label1um = this.createTextLabel(
          label + " μm", 0x000000
        );
        label1um.position.set(
          i, -this.cellRadius , 0
        );
        this.staticGroup.add(label1um);
        if (i !== 0) { // Avoid duplicating the zero label
          const labelNeg = this.createTextLabel(
            (-i) + " μm", 0x000000
          );
          labelNeg.position.set(
            0, -this.cellRadius , i
          );
          this.staticGroup.add(labelNeg);
        }

    }
    const axesHelper = new THREE.AxesHelper(20);
    this.staticGroup.add(axesHelper);

  }

  loadCellModel() {
    const gltfLoader = new GLTFLoader();
    
    // Set up DRACO loader for compressed models
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    gltfLoader.setDRACOLoader(dracoLoader);
    
    // Set current path
    gltfLoader.setPath('./');
    gltfLoader.load("./cellModel/output.glb", (gltf) => {
        const object = gltf.scene;
        object.scale.set(0.15, 0.15, 0.15);
        object.position.set(0.2, -7.95, 0.2);
        // Add cell model to rotatable group
        this.rotatableGroup.add(object);
        
        // Clean up DRACO loader
        dracoLoader.dispose();
    }, undefined, (error) => {
        console.error('Error loading cell model:', error);
    });
  }

  initializeAllParticles() {
    // Use radii from BrownianMotion class if available, otherwise use fallback values
    const viralRadius = this.brownianMotion.viralRadius ;
    const proteinRadius = this.brownianMotion.proteinRadius 
    const bacteriaRadius = this.brownianMotion.bacteriaRadius ;

    this.createParticles(viralRadius, 5, 0x00ffff, 10, this.viralParticles, this.cellRadius, this.cellRadius*3); // Viral particles
    this.createParticles(proteinRadius, 5, 0xffffff, 10, this.proteins, this.cellRadius/3, this.cellRadius); // Proteins
    this.createParticles(bacteriaRadius, 8, 0xff00ff, 10, this.bacteria, this.cellRadius, this.cellRadius*3); // Extra cellular molecules
    
    this.createCellMembrane();
    this.createHelperGrid();
    this.loadCellModel();
  }
}