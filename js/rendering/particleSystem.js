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
    this.loadCellModel();
  }
}