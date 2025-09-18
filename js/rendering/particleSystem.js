import * as THREE from 'three';

export class ParticleSystem {
  constructor(wholeSceneGroup, brownianMotion = null) {
    this.wholeSceneGroup = wholeSceneGroup;
    this.brownianMotion = brownianMotion;
    
    // Create separate groups for different transformation behaviors
    this.rotatableGroup = new THREE.Group(); // For particles, membrane, cell model
    this.staticGroup = new THREE.Group();    // For helper grids (rotation-resistant)
    
    // Add both groups to the main wholeSceneGroup
    this.wholeSceneGroup.add(this.rotatableGroup);
    this.wholeSceneGroup.add(this.staticGroup);
    
    this.proteins = [];
    this.viralParticles = [];
    this.bacteria = [];
    this.cellRadius = 7.7; //15.4 micrometers in diameter
    
    // Trail configuration
    this.trailLength = 7; // Number of trail points per particle
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
      // Add particles to the rotatable group instead of wholeSceneGroup
      this.rotatableGroup.add(particle);
      particleGroup.push(particle);
      
      // Initialize trail for this particle
      this.initializeParticleTrail(particle, color);
    }
  }

  initializeParticleTrail(particle, baseColor) {
    const trailData = {
      positions: [],
      trailLines: []
    };
    

    
    // Create connecting lines between trail points
    for (let i = 0; i < this.trailLength; i++) {
      const lineGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(6); // 2 points (start and end) * 3 coordinates
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const lineMaterial = new THREE.LineBasicMaterial({
        color: baseColor,
      });
      
      const line = new THREE.Line(lineGeometry, lineMaterial);
      line.visible = true; 
      this.rotatableGroup.add(line);
      
      trailData.trailLines.push(line);
    }
    
    // Store initial position
    trailData.positions.push(particle.position.clone());
    
    this.particleTrails.set(particle, trailData);
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
        }
      }
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
  }
}