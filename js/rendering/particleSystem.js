import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export class ParticleSystem {
  constructor(cellGroup, brownianMotion = null) {
    this.cellGroup = cellGroup;
    this.brownianMotion = brownianMotion;
    this.proteins = [];
    this.viralParticles = [];
    this.bacteria = [];
    this.cellRadius = 7.7; //15.4 micrometers in diameter
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
      this.cellGroup.add(particle);
      particleGroup.push(particle);
    }
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
    this.cellGroup.add(membrane);

 
  }

  createHelperGrid(){
   // Add a plane grid helper to represent the 1 μm scale
    const gridHelperSmall = new THREE.GridHelper(40, 40, 0xff0000, 0x00ffff);
    gridHelperSmall.position.y = -this.cellRadius - 1; // Position it at the bottom of the cell
    this.cellGroup.add(gridHelperSmall);

    // Add a larger grid helper to represent the 10 μm scale
    const gridHelperBig = new THREE.GridHelper(40, 4, 0xff0000, 0xff0000);
    gridHelperBig.position.y = -this.cellRadius - 1; // Position it at the bottom of the cell
    this.cellGroup.add(gridHelperBig); 

    // Add labels to the grid helpers to indicate 1 μm steps and 10 μm steps
    for (let i = -20; i <= 20; i += 1) {
        if (i % 10 === 0) continue; // Skip every 10 to avoid overlap with larger grid labels
        const label = i;
        const label1um = this.createTextLabel(
          label , 0x000000, 0.2
        );
        label1um.position.set(
          i, -this.cellRadius - 1, 0
        );
        this.cellGroup.add(label1um);
        if (i !== 0) { // Avoid duplicating the zero label
          const labelNeg = this.createTextLabel(
            (-i) , 0x000000, 0.2
          );
          labelNeg.position.set(
            0, -this.cellRadius - 1, i
          );
          this.cellGroup.add(labelNeg);
        }

    }
    
    // Add labels to the grid helpers to indicate 1 μm steps and 10 μm steps
    for (let i = -20; i <= 20; i += 10) {
        
        const label = i;
        const label1um = this.createTextLabel(
          label + " μm", 0x000000
        );
        label1um.position.set(
          i, -this.cellRadius - 1, 0
        );
        this.cellGroup.add(label1um);
        if (i !== 0) { // Avoid duplicating the zero label
          const labelNeg = this.createTextLabel(
            (-i) + " μm", 0x000000
          );
          labelNeg.position.set(
            0, -this.cellRadius - 1, i
          );
          this.cellGroup.add(labelNeg);
        }

    }
    const axesHelper = new THREE.AxesHelper(20);
    this.cellGroup.add(axesHelper);

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
        this.cellGroup.add(object);
        
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

    this.createParticles(viralRadius, 5, 0x00ffff, 50, this.viralParticles, this.cellRadius, this.cellRadius*4); // Viral particles
    this.createParticles(proteinRadius, 5, 0xffffff, 200, this.proteins, this.cellRadius/3, this.cellRadius); // Proteins
    this.createParticles(bacteriaRadius, 8, 0xff00ff, 20, this.bacteria, this.cellRadius, this.cellRadius*4); // Extra cellular molecules
    
    this.createCellMembrane();
    this.createHelperGrid();
    this.loadCellModel();
  }
}