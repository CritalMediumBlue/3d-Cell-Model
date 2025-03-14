import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';

class CellViewer {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;
    document.body.appendChild(this.renderer.domElement);
    
        // Add to constructor
    this.sceneGroup = new THREE.Group();
    this.scene.add(this.sceneGroup);
    // Add objects to this.sceneGroup instead of this.scene
    this.camera.position.set(40, 40, 40);
    this.camera.lookAt(0, 0, 0);
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 3);
    keyLight.position.set(3, 10, 3).normalize();
    const fogColor = new THREE.Color(0x0F000F);  // Light gray fog
    this.scene.fog = new THREE.Fog(fogColor, 2, 90);
    this.scene.background = fogColor;
    this.scene.add(keyLight);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.proteins = []; 
    this.waterMolecules = []; 
    this.proteinSpeed = 0.5; 
    this.waterSpeed = this.proteinSpeed * 20; 
    this.cellRadius = 25; 

    this.loadCellModel();
    this.createParticles(); 
    this.animate();
    document.body.appendChild(ARButton.createButton(this.renderer, {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: document.body }
    }));
    // Add to your constructor
if (window.DeviceOrientationEvent) {
  window.addEventListener('deviceorientation', (event) => {
    // Only use device orientation when not in VR mode
    if (!this.renderer.xr.isPresenting) {
      // Use device orientation to control camera when not in VR mode
      // This gives a more immersive experience even without entering VR
    }
  });
}
this.renderer.xr.addEventListener('sessionstart', () => {
  // Set up AR session controller
  this.controller = this.renderer.xr.getController(0);
  this.controller.addEventListener('select', (event) => {
    // When user taps, position content at the hit point
    if (this.hitTestSource && this.hitTestSourceRequested) {
      // Position the sceneGroup at hit point
    }
  });
  this.scene.add(this.controller);
});
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
        object.scale.set(0.5, 0.5, 0.5);
        object.position.set(1, -26, 0);
        this.scene.add(object);
      });
    });
  }

  createParticles() {
    const proteinGeometry = new THREE.SphereGeometry(0.5, 4, 4);
    const waterGeometry = new THREE.SphereGeometry(0.1, 1, 1);
    
    const proteinColor=0x00ff00;
    const waterColor=0x0000ff;
    const proteinMaterial = new THREE.MeshPhongMaterial({ 
      emissive: proteinColor,
      emissiveIntensity: 1,
    });
    
    for (let i = 0; i < 300; i++) {
     
      
      const protein = new THREE.Mesh(proteinGeometry, proteinMaterial);
      
    
      protein.position.set(
        (Math.random() - 0.5)*50,
        (Math.random() - 0.5)*50,
        (Math.random() - 0.5)*50
      );
      
      this.scene.add(protein);
      this.proteins.push(protein);
    }
    const waterMaterial = new THREE.MeshPhongMaterial({ 
      emissive: waterColor,
      emissiveIntensity: 1,
      });

    for (let i = 0; i < 200; i++) {
        
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.position.set(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50
        );
        this.scene.add(water);
        this.waterMolecules.push(water);
        }
  }


  
  animate() {
    // Update protein positions with Brownian motion
    this.proteins.forEach(protein => {
      // Random movement in each direction
      protein.position.x += (Math.random() - 0.5) * this.proteinSpeed;
      protein.position.y += (Math.random() - 0.5) * this.proteinSpeed;
      protein.position.z += (Math.random() - 0.5) * this.proteinSpeed;

    //if the position is outside the bounds of the cell membrane, reflect the protein back into the cell
    const radius = this.cellRadius;
    if (protein.position.length() > radius) {
            protein.position.setLength(radius);
           }
      
    });

    // Update water molecule positions with Brownian motion
    this.waterMolecules.forEach(water => {
      // Random movement in each direction
      water.position.x += (Math.random() - 0.5) * this.waterSpeed;
      water.position.y += (Math.random() - 0.5) * this.waterSpeed;
      water.position.z += (Math.random() - 0.5) * this.waterSpeed;

        //if the position is outside the bounds of the cell membrane, reflect the protein back into the cell
        const radius = this.cellRadius;
        if (water.position.length() > radius) {
            water.position.setLength(radius);
        }
    }
    );
    
    requestAnimationFrame(this.animate.bind(this));
    this.renderer.setAnimationLoop(this.render.bind(this));
  }
  render() {
    // Move your animation logic here
    // Update protein positions with Brownian motion
    const radius = this.cellRadius;

    this.proteins.forEach(protein => {
      // Random movement in each direction
      protein.position.x += (Math.random() - 0.5) * this.proteinSpeed;
      protein.position.y += (Math.random() - 0.5) * this.proteinSpeed;
      protein.position.z += (Math.random() - 0.5) * this.proteinSpeed;

      //if the position is outside the bounds of the cell membrane, reflect the protein back into the cell
      if (protein.position.length() > radius) {
        protein.position.setLength(radius);
      }
    });

    // Update water molecule positions with Brownian motion
    this.waterMolecules.forEach(water => {
      // Random movement in each direction
      water.position.x += (Math.random() - 0.5) * this.waterSpeed;
      water.position.y += (Math.random() - 0.5) * this.waterSpeed;
      water.position.z += (Math.random() - 0.5) * this.waterSpeed;

      //if the position is outside the bounds of the cell membrane, reflect the protein back into the cell
      if (water.position.length() > radius) {
        water.position.setLength(radius);
      }
    });
    
    this.renderer.render(this.scene, this.camera);
  }


}

document.addEventListener('DOMContentLoaded', () => new CellViewer());