import * as THREE from 'three';

export class ParticleSystem {
  constructor(wholeSceneGroup, brownianMotion = null, mode) {
    this.mode = mode;
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
    this.ATPmolecules = [];
    this.transportins = [];
    this.cargoProteins = [];

    this.cellRadius = 7.7; //15.4 micrometers in diameter

    
    // Trail configuration
    this.trailLength = 10; // Number of trail points per particle
    this.particleTrails = new Map(); // Store trail data for each particle
  }

  centerATPMolecules() {
    if (this.mode !== "atp") return; // Only center in ATP mode

    const center = new THREE.Vector3(0, 0, 0);
    this.ATPmolecules.forEach(molecule => {
      molecule.position.set(
        (Math.random() - 0.5) * this.cellRadius / 2,
        (Math.random() - 0.5) * this.cellRadius / 2,
        (Math.random() - 0.5) * this.cellRadius / 2
      );
      
      // Reset trail data for the molecule
      const trailData = this.particleTrails.get(molecule);
      if (trailData) {
        trailData.positions = [molecule.position.clone()]; // Start new trail from current position
        trailData.trailLines.forEach(line => line.visible = false); // Hide existing trail lines
      }
    });
  }

  createParticles(size, segments, color, number, particleGroup, minRadius, maxRadius,xCoord, yCoord, zCoord) {
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
      if (xCoord !== undefined && yCoord !== undefined && zCoord !== undefined) {
        particle.position.set(xCoord, yCoord, zCoord);
      } else {
        particle.position.set(
          randomPosition().x,
          randomPosition().y,
          randomPosition().z
        );
      }
      particle.bound = false; // Initialize bound property
      particle.visible = true; // Ensure particle is visible
      // Add particles to the rotatable group instead of wholeSceneGroup
      this.rotatableGroup.add(particle);
      particleGroup.push(particle);
      
      // Initialize trail for this particle
      this.initializeParticleTrail(particle, color);
    console.log(`Created ${number} particles of size ${size} and color ${color.toString(16)} at position (${particle.position.x}, ${particle.position.y}, ${particle.position.z})`);

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
      line.visible = false;
      
      // Fix: Disable frustum culling to prevent lines from disappearing
      line.frustumCulled = false;
      
      this.rotatableGroup.add(line);
      
      trailData.trailLines.push(line);
    }
    
    // Store initial position
    trailData.positions.push(particle.position.clone());
    
    this.particleTrails.set(particle, trailData);
  }

  calculateMSD(particles) {
    particles.forEach(particle => {
      const trailData = this.particleTrails.get(particle);
      let msd = 0;

      if (trailData && trailData.positions.length > 1) {
        const trailLength = trailData.positions.length;
        for (let i = 1; i < trailLength; i++) {
          const startPos = trailData.positions[trailLength - 1 - i];
          const endPos = trailData.positions[trailLength - i];
          const displacement = new THREE.Vector3().subVectors(endPos, startPos);
          const squaredDisplacement = displacement.lengthSq();
          msd += squaredDisplacement;
        }
        msd /= (trailLength - 1);
      }

      particle.msd = msd; // Store MSD value in the particle for external access
    });

    let averageMSD = 0;
    averageMSD = particles.reduce((sum, p) => sum + p.msd, 0) / particles.length;
    console.log("Average MSD:", averageMSD);
  
  }

  restartSimulation() {

    // Remove all existing particles, their trails, and clear arrays
    this.removeAllParticles();

    // Re-initialize particles
    this.initializeAllParticles(this.mode);

    console.log("Simulation and particles restarted");

  }

  removeAllParticles() {
  //This function removes all particles, their trails, and clears all the related arrays.
    const allParticleGroups = [this.proteins, this.viralParticles, this.bacteria, this.ATPmolecules, this.transportins, this.cargoProteins];
    
    allParticleGroups.forEach(particleGroup => {
      particleGroup.forEach(particle => {
        // Remove particle from the scene
        this.rotatableGroup.remove(particle);
        particle.geometry.dispose();
        particle.material.dispose();
        
        // Remove and dispose of trail lines
        const trailData = this.particleTrails.get(particle);
        if (trailData) {
          trailData.trailLines.forEach(line => {
            this.rotatableGroup.remove(line);
            line.geometry.dispose();
            line.material.dispose();
          });
          this.particleTrails.delete(particle);
        }
      });
      // Clear the particle array
      particleGroup.length = 0;
    });
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
      for (let i = 0; i < trailData.trailLines.length-1; i++) {
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
          
 
          if (particle.visible) {
            line.visible = true;
          } else {
            line.visible = false;
          }
        }
      }



    });
  }

  initializeAllParticles(mode) {
    let viralRadius, proteinRadius, bacteriaRadius, atpRadius;
    
    if (mode === "cell") {
      viralRadius = this.brownianMotion.viralRadius;
      proteinRadius = this.brownianMotion.proteinRadius;
      bacteriaRadius = this.brownianMotion.bacteriaRadius;
    } else if (mode === "atp") {
      atpRadius = this.brownianMotion.ATPRadius;
    } else if (mode === "nucleus") {
      proteinRadius = this.brownianMotion.proteinRadius;
    }

    // Only create particles that are defined for the current mode
    if (mode === "cell") {
      this.createParticles(viralRadius, 5, 0x00ffff, 10, this.viralParticles, this.cellRadius, this.cellRadius*2); // Viral particles
      this.createParticles(proteinRadius, 4, 0xffffff, 5, this.proteins, this.cellRadius/4, this.cellRadius); // Proteins
      this.createParticles(bacteriaRadius, 7, 0xff00ff, 10, this.bacteria, this.cellRadius, this.cellRadius*2); // Extra cellular molecules
    } else if (mode === "atp") {
      this.createParticles(atpRadius, 3, 0x00ff00, 100, this.ATPmolecules, 0, this.cellRadius/100); // ATP molecules
    } else if (mode === "nucleus") {
      this.createParticles(proteinRadius, 4, 0x00ffff, 10, this.transportins, this.cellRadius/4, this.cellRadius); // Protein molecules
      this.createParticles(proteinRadius, 4, 0xffa500, 10, this.cargoProteins, this.cellRadius/4, this.cellRadius); // Cargo proteins
    }

  }
}