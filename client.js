import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class CellViewer {
  constructor() {
    this.initScene();
    this.initLights();
    this.initControls();
    this.initProperties();

    this.loadCellModel();
    this.createParticles(0.05, 1, 0x0000ff, 500, this.waterMolecules); // Water molecules
    this.createParticles(0.1, 4, 0x00ff00, 200, this.proteins); // Proteins
    this.createCellMembrane();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.001, 3000);
    this.camera.position.set(10, 10, 10);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
  }

  initLights() {
    const lights = [
      { color: 0xFFFFFF, intensity: 1.0, position: [3, 10, 3] },
      { color: 0xFFFFFF, intensity: 1.2, position: [0, -5, -1] },
      { color: 0xFFFFFF, intensity: 0.5, position: [-10, 0, 0] }
    ];
    lights.forEach(({ color, intensity, position }) => {
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(...position).normalize();
      this.scene.add(light);
    });
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  initProperties() {
    this.proteins = [];
    this.waterMolecules = [];
    this.proteinSpeed = 0.1;
    this.waterSpeed = 1;
    this.cellRadius = 7.8;
  }

  loadCellModel() {
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath('./cellModel/');
    mtlLoader.load("CellAnatomy.mtl", (materials) => {
      materials.preload();
      const objLoader = new OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.setPath("./cellModel/");
      objLoader.load("CellAnatomy.obj", (object) => {
        object.scale.set(0.15, 0.15, 0.15);
        object.position.set(0.2, -7.95, 0.2);
        this.scene.add(object);
      });
    });
  }

  createParticles(size, segments, color, number, particleGroup) {
    const geometry = new THREE.SphereGeometry(size, segments, segments);
    const material = new THREE.MeshPhongMaterial({ emissive: color, emissiveIntensity: 1 });
    const radius = this.cellRadius;

    for (let i = 0; i < number; i++) {
      const particle = new THREE.Mesh(geometry, material);
      particle.position.set(
        (Math.random() - 0.5) * radius * 2,
        (Math.random() - 0.5) * radius * 2,
        (Math.random() - 0.5) * radius * 2
      );
      this.scene.add(particle);
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
    this.scene.add(new THREE.Mesh(geometry, material));
  }

  brownianMotion(speed, molecules) {
    molecules.forEach(molecule => {
      molecule.position.add(new THREE.Vector3(
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed
      ));
      if (molecule.position.length() > this.cellRadius) {
        molecule.position.setLength(this.cellRadius);
      }
    });
  }

  animate() {
    this.brownianMotion(this.waterSpeed, this.waterMolecules);
    this.brownianMotion(this.proteinSpeed, this.proteins);

    requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

document.addEventListener('DOMContentLoaded', () => new CellViewer());