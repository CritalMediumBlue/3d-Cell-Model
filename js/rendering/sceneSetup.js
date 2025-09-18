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
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.0001, 3000);
    this.camera.position.set(20, 20, 20);
    this.camera.lookAt(0, 0, 0);

    this.scene.fog = new THREE.FogExp2(0xffffff, 0.02);


    this.renderer = new THREE.WebGLRenderer({ 
      antialias: false, // true means smoother edges, but may impact performance
      alpha: true // Transparent background for AR
    });
    const ratio = 0.7; //this could be adjusted based on performance needs
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth*ratio, window.innerHeight*ratio, false);
    // Stretch the output to fill the screen
    this.renderer.domElement.style.width = '100vw';
    this.renderer.domElement.style.height = '100vh';
    this.renderer.domElement.style.display = 'block';

    this.renderer.xr.enabled = true; // Enable WebXR
    
    // Apply the same 0.7 ratio to XR rendering for consistent performance
    this.renderer.xr.setReferenceSpaceType('local');
    
    // Set XR frame buffer scale to match our performance ratio
    this.renderer.xr.setFramebufferScaleFactor(ratio);

    document.body.appendChild(this.renderer.domElement);
  }

  setupLighting() {
    this.lightGroup = new THREE.Group();
    this.scene.add(this.lightGroup);
    
    const lights = [
      { color: 0xFFFF00, intensity: 2.0, position: [10, 20, 0] },
      { color: 0x00FFFF, intensity: 2.0, position: [20, 0, 10] },
      { color: 0xFF00FF, intensity: 2.0, position: [0, 10, 20] },
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
    const ratio = 0.7; // Same performance ratio
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth * ratio, window.innerHeight * ratio, false);
    // Maintain screen stretching
    this.renderer.domElement.style.width = '100vw';
    this.renderer.domElement.style.height = '100vh';
  }
}