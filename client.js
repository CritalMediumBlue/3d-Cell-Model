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
    
    // Create a group to contain all objects for easier manipulation in AR
    this.sceneGroup = new THREE.Group();
    this.scene.add(this.sceneGroup);
    
    // Camera setup
    this.camera.position.set(40, 40, 40);
    this.camera.lookAt(0, 0, 0);
    
    // Lighting
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 3);
    keyLight.position.set(3, 10, 3).normalize();
    this.sceneGroup.add(keyLight);
    
    // Add ambient light to better see the model in AR
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    this.sceneGroup.add(ambientLight);
    
    // Environment setup
    const fogColor = new THREE.Color(0x0F000F);
    this.scene.fog = new THREE.Fog(fogColor, 2, 90);
    this.scene.background = fogColor;
    
    // Controls for non-AR mode
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.dampingFactor = 0.25;
    this.controls.enableDamping = true;

    // Particle system properties
    this.proteins = []; 
    this.waterMolecules = []; 
    this.proteinSpeed = 0.5; 
    this.waterSpeed = this.proteinSpeed * 20; 
    this.cellRadius = 25; 
    
    // Store original scale for switching between AR and non-AR
    this.originalScale = new THREE.Vector3(1, 1, 1);
    // AR scale will be much smaller, in meters
    this.arScale = new THREE.Vector3(0.02, 0.02, 0.02);
    
    // Handle window resizing
    window.addEventListener('resize', this.onWindowResize.bind(this), false);

    // Initialize content
    this.loadCellModel();
    this.createParticles(); 
    
    // Set up AR button and functionality
    document.body.appendChild(ARButton.createButton(this.renderer, {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: document.body }
    }));

    // Set up AR session events
    this.hitTestSourceRequested = false;
    this.hitTestSource = null;
    
    this.renderer.xr.addEventListener('sessionstart', this.onSessionStart.bind(this));
    this.renderer.xr.addEventListener('sessionend', this.onSessionEnd.bind(this));
    
    // Start animation loop
    this.renderer.setAnimationLoop(this.render.bind(this));
  }
  
  onSessionStart() {
    // Apply AR scaling - make the cell much smaller to look appropriate in real world
    this.sceneGroup.scale.copy(this.arScale);
    
    this.hitTestSourceRequested = false;
    this.hitTestSource = null;
    
    // Set up AR session controller
    this.controller = this.renderer.xr.getController(0);
    this.controller.addEventListener('select', this.onSelect.bind(this));
    this.sceneGroup.add(this.controller);
    
    // Create a reset button in AR to make the cell return to origin if needed
    this.createARResetButton();
  }
  
  onSessionEnd() {
    // Return to original scale for non-AR mode
    this.sceneGroup.scale.copy(this.originalScale);
    
    if (this.hitTestSource) {
      this.hitTestSource.cancel();
      this.hitTestSource = null;
    }
    this.hitTestSourceRequested = false;
    
    // Remove the reset button when exiting AR
    this.removeARResetButton();
  }
  
  createARResetButton() {
    // Create a button to reset cell position
    const resetButton = document.createElement('button');
    resetButton.id = 'ar-reset-button';
    resetButton.style.position = 'absolute';
    resetButton.style.bottom = '20px';
    resetButton.style.left = '50%';
    resetButton.style.transform = 'translateX(-50%)';
    resetButton.style.padding = '12px 24px';
    resetButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    resetButton.style.color = 'white';
    resetButton.style.border = 'none';
    resetButton.style.borderRadius = '4px';
    resetButton.style.fontWeight = 'bold';
    resetButton.style.zIndex = '100';
    resetButton.textContent = 'Reset Position';
    resetButton.addEventListener('click', () => {
      // Reset the scene group position
      this.sceneGroup.position.set(0, 0, 0);
    });
    document.body.appendChild(resetButton);
  }
  
  removeARResetButton() {
    const resetButton = document.getElementById('ar-reset-button');
    if (resetButton) {
      resetButton.remove();
    }
  }
  
  onSelect() {
    // This gets called when user taps in AR mode
    if (this.reticle && this.reticle.visible) {
      // Move the cell model to the selected position
      this.sceneGroup.position.setFromMatrixPosition(this.reticle.matrix);
    }
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
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
        
        // Add some reflections to make it look better in AR
        object.traverse((child) => {
          if (child.isMesh) {
            child.material.needsUpdate = true;
            child.material.shininess = 30;
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        this.sceneGroup.add(object);
      });
    });
    
    // Add a reticle for AR hit testing
    const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32);
    reticleGeometry.rotateX(-Math.PI / 2);
    const reticleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.8,
      transparent: true
    });
    this.reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    this.reticle.matrixAutoUpdate = false;
    this.reticle.visible = false;
    this.scene.add(this.reticle);
  }

  createParticles() {
    const proteinGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const waterGeometry = new THREE.SphereGeometry(0.1, 6, 6);
    
    const proteinColor = 0x00ff00;
    const waterColor = 0x0000ff;
    const proteinMaterial = new THREE.MeshPhongMaterial({ 
      emissive: proteinColor,
      emissiveIntensity: 1,
    });
    
    // Create proteins
    for (let i = 0; i < 300; i++) {
      const protein = new THREE.Mesh(proteinGeometry, proteinMaterial);
      
      // Distribute proteins within cell radius
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = Math.cbrt(Math.random()) * this.cellRadius; // Better distribution
      
      protein.position.x = radius * Math.sin(phi) * Math.cos(theta);
      protein.position.y = radius * Math.sin(phi) * Math.sin(theta);
      protein.position.z = radius * Math.cos(phi);
      
      this.sceneGroup.add(protein);
      this.proteins.push(protein);
    }
    
    // Create water molecules
    const waterMaterial = new THREE.MeshPhongMaterial({ 
      emissive: waterColor,
      emissiveIntensity: 1,
    });

    for (let i = 0; i < 200; i++) {
      const water = new THREE.Mesh(waterGeometry, waterMaterial);
      
      // Distribute water molecules within cell radius
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = Math.cbrt(Math.random()) * this.cellRadius;
      
      water.position.x = radius * Math.sin(phi) * Math.cos(theta);
      water.position.y = radius * Math.sin(phi) * Math.sin(theta);
      water.position.z = radius * Math.cos(phi);
      
      this.sceneGroup.add(water);
      this.waterMolecules.push(water);
    }
  }

  render(timestamp, frame) {
    // Handle AR hit testing
    if (frame) {
      const referenceSpace = this.renderer.xr.getReferenceSpace();
      const session = this.renderer.xr.getSession();
      
      if (!this.hitTestSourceRequested) {
        session.requestReferenceSpace('viewer').then((referenceSpace) => {
          session.requestHitTestSource({ space: referenceSpace }).then((source) => {
            this.hitTestSource = source;
          });
        });
        
        this.hitTestSourceRequested = true;
      }
      
      if (this.hitTestSource) {
        const hitTestResults = frame.getHitTestResults(this.hitTestSource);
        
        if (hitTestResults.length > 0) {
          const hit = hitTestResults[0];
          const pose = hit.getPose(referenceSpace);
          
          this.reticle.visible = true;
          this.reticle.matrix.fromArray(pose.transform.matrix);
        } else {
          this.reticle.visible = false;
        }
      }
    }
    
    // Update protein positions with Brownian motion
    const radius = this.cellRadius;
    this.proteins.forEach(protein => {
      // Random movement in each direction
      protein.position.x += (Math.random() - 0.5) * this.proteinSpeed;
      protein.position.y += (Math.random() - 0.5) * this.proteinSpeed;
      protein.position.z += (Math.random() - 0.5) * this.proteinSpeed;
      
      // Keep protein within cell boundary
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
      
      // Keep water within cell boundary
      if (water.position.length() > radius) {
        water.position.setLength(radius);
      }
    });
    
    // Update controls if not in VR/AR mode
    if (!this.renderer.xr.isPresenting) {
      this.controls.update();
    }
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
}

document.addEventListener('DOMContentLoaded', () => new CellViewer());