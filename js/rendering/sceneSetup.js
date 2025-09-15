import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneSetup {
  constructor() {
    this.initScene();
    this.setupLighting();
    this.setupControls();
    this.setupWindowResize();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.001, 3000);
    this.camera.position.set(20, 20, 20);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ 
      antialias: false, // true means smoother edges, but may impact performance
      alpha: true // Transparent background for AR
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true; // Enable WebXR
    document.body.appendChild(this.renderer.domElement);
  }

  setupLighting() {
    this.lightGroup = new THREE.Group();
    this.scene.add(this.lightGroup);
    
    const lights = [
      { color: 0xFFFFFF, intensity: 2.0, position: [3, 10, 3] },
      { color: 0xFFFFFF, intensity: 2.0, position: [0, -5, -1] },
      { color: 0xFFFFFF, intensity: 2.0, position: [-10, 0, 0] }
    ];
    
    lights.forEach(({ color, intensity, position }) => {
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(...position).normalize();
      this.lightGroup.add(light);
    });
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  setupWindowResize() {
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}