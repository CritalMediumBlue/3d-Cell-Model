import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class ParticleSystem {
  constructor(cellGroup) {
    this.cellGroup = cellGroup;
    this.proteins = [];
    this.viralParticles = [];
    this.bacteria = [];
    this.cellRadius = 5/0.641; //10 micrometers in diameter
  }

  createParticles(size, segments, color, number, particleGroup, minRadius, maxRadius) {
    const geometry = new THREE.SphereGeometry(size, segments, segments);
    const material = new THREE.MeshPhongMaterial({ emissive: color, emissiveIntensity: 1 });

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
    const geometry = new THREE.SphereGeometry(this.cellRadius, 64, 64);
    const material = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      wireframe: true,
      transparent: true,
      opacity: 0.2
    });
    this.cellGroup.add(new THREE.Mesh(geometry, material));
  }

  loadCellModel() {
    const gltfLoader = new GLTFLoader();
    //set current path
    gltfLoader.setPath('./');
    gltfLoader.load("./cellModel/cell.glb", (gltf) => { // Use the .glb file instead of .gltf
        const object = gltf.scene; // Access the loaded 3D scene
        object.scale.set(0.15, 0.15, 0.15); // Scale the model
        object.position.set(0.2, -7.95, 0.2); // Position the model
        this.cellGroup.add(object); // Add the model to the cell group
    });
  }

  initializeAllParticles() {
    // Create different types of particles based on physics properties
    const viralRadius = 0.05;
    const proteinRadius = 0.006;
    const bacteriaRadius = 0.5;

    this.createParticles(viralRadius, 1, 0x0000ff, 50, this.viralParticles, this.cellRadius, this.cellRadius*3); // Viral particles
    this.createParticles(proteinRadius, 1, 0x00ff00, 500, this.proteins, this.cellRadius/3, this.cellRadius); // Proteins
    this.createParticles(bacteriaRadius, 8, 0xff0000, 20, this.bacteria, this.cellRadius, this.cellRadius*3); // Extra cellular molecules
    
    this.createCellMembrane();
    this.loadCellModel();
  }
}