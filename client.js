import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';

class CellViewer {
  constructor() {
    this.initScene();
    this.initLights();
    this.initControls();
    this.initProperties();
    this.createSceneGroup();

    this.loadCellModel();
    this.createParticles(0.05, 1, 0x0000ff, 500, this.waterMolecules, 0, this.cellRadius); // Water molecules
    this.createParticles(0.1, 4, 0x00ff00, 200, this.proteins, this.cellRadius/4, this.cellRadius); // Proteins
    this.createParticles(1, 5, 0xff0000, 20, this.extraCellularMolecules, this.cellRadius*1.5, this.cellRadius*3); // Extra cellular molecules
    this.createCellMembrane();
    this.setupAR();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.001, 3000);
    this.camera.position.set(10, 10, 10);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true // Transparent background for AR
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true; // Enable WebXR
    document.body.appendChild(this.renderer.domElement);
    
    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  initLights() {
    // Create a light group to manage lights
    this.lightGroup = new THREE.Group();
    this.scene.add(this.lightGroup);
    
    // Standard lights for 3D mode
    const lights = [
      { color: 0xFFFFFF, intensity: 1.0, position: [3, 10, 3] },
      { color: 0xFFFFFF, intensity: 1.2, position: [0, -5, -1] },
      { color: 0xFFFFFF, intensity: 0.5, position: [-10, 0, 0] }
    ];
    
    lights.forEach(({ color, intensity, position }) => {
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(...position).normalize();
      this.lightGroup.add(light);
    });
    
    // Add ambient light for better visibility in AR
    this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    this.lightGroup.add(this.ambientLight);
    
    // Add a hemisphere light for AR mode (better for outdoor environments)
    this.hemisphereLight = new THREE.HemisphereLight(0xFFFFFF, 0x444444, 0.8);
    this.hemisphereLight.visible = false;
    this.lightGroup.add(this.hemisphereLight);
  }
  
 

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  initProperties() {
    this.proteins = [];
    this.waterMolecules = [];
    this.extraCellularMolecules = [];
    this.proteinSpeed = 0.1;
    this.waterSpeed = 1;
    this.extraCellularSpeed = 0.05;
    this.cellRadius = 7.8;
    this.isARMode = false;
    this.reticle = null;
    this.hitTestSource = null;
    this.hitTestSourceRequested = false;
    this.modelPlaced = false;
    
    // Touch interaction properties
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartDistance = 0;
    
    // Handle device orientation changes
    window.addEventListener('orientationchange', this.onOrientationChange.bind(this), false);
    
    // Add touch event listeners for AR interaction
    this.setupTouchInteraction();
  }
  
  setupTouchInteraction() {
    // Touch events for rotating and scaling the model in AR mode
    document.addEventListener('touchstart', (event) => {
      if (this.isARMode && this.modelPlaced && event.touches.length > 0) {
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
      }
    });
    
    document.addEventListener('touchmove', (event) => {
      if (this.isARMode && this.modelPlaced && event.touches.length > 0) {
        // Prevent default to avoid scrolling the page
        event.preventDefault();
        
        // Single touch for rotation
        if (event.touches.length === 1) {
          const touchX = event.touches[0].clientX;
          const touchY = event.touches[0].clientY;
          
          // Calculate the rotation based on horizontal movement
          const deltaX = touchX - this.touchStartX;
          this.cellGroup.rotation.y += deltaX * 0.01;
          
          // Update the starting position
          this.touchStartX = touchX;
          this.touchStartY = touchY;
        }
      }
    }, { passive: false });
  }
  
  onOrientationChange() {
    // Short timeout to allow the screen to resize before updating
    setTimeout(() => {
      this.onWindowResize();
      
      // If in AR mode, update the AR session
      if (this.isARMode) {
        const session = this.renderer.xr.getSession();
        if (session) {
          // Reset hit test source to adapt to new orientation
          this.hitTestSourceRequested = false;
          if (this.hitTestSource) {
            this.hitTestSource.cancel();
            this.hitTestSource = null;
          }
        }
      }
    }, 100);
  }
  
  createSceneGroup() {
    // Create a group to hold all cell-related objects for easier manipulation in AR
    this.cellGroup = new THREE.Group();
    this.scene.add(this.cellGroup);
  }
  
  setupAR() {
    // Create AR button
    const arButton = ARButton.createButton(this.renderer, {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: document.body }
    });
    
    document.body.appendChild(arButton);
    
    // Create reticle for AR placement
    const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
    const reticleMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    this.reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    this.reticle.matrixAutoUpdate = false;
    this.reticle.visible = false;
    this.scene.add(this.reticle);
    
  
    
    // Set up controller for AR interaction
    this.controller = this.renderer.xr.getController(0);
    this.controller.addEventListener('select', this.onSelect.bind(this));
    this.scene.add(this.controller);
    
    // Listen for session start/end to toggle between AR and 3D modes
    this.renderer.xr.addEventListener('sessionstart', () => {
      this.isARMode = true;
      this.cellGroup.visible = false; // Hide until placed
      this.modelPlaced = false;
      
      // Disable OrbitControls in AR mode
      if (this.controls) {
        this.controls.enabled = false;
      }
    });
    
    this.renderer.xr.addEventListener('sessionend', () => {
      this.isARMode = false;
      this.modelPlaced = false;
      this.cellGroup.visible = true;
      this.cellGroup.position.set(0, 0, 0);
      this.cellGroup.rotation.set(0, 0, 0);
      this.cellGroup.scale.set(1, 1, 1);
      
      // Re-enable OrbitControls in 3D mode
      if (this.controls) {
        this.controls.enabled = true;
      }
      
      // Remove any instruction elements that might still be visible
      if (this.instructionElement) {
        document.body.removeChild(this.instructionElement);
        this.instructionElement = null;
      }
    });
  }
  
  onSelect() {
    if (this.reticle.visible && !this.modelPlaced) {
      // Place the cell group at the reticle position
      this.cellGroup.position.setFromMatrixPosition(this.reticle.matrix);
      this.cellGroup.position.y += this.cellRadius;

      this.cellGroup.scale.set(0.05, 0.05, 0.05);
      //hide the reticle after placing the model
      this.reticle.visible = false;
      this.cellGroup.visible = true;
      this.modelPlaced = true;
    }
  }

  
  loadCellModel() {
      const gltfLoader = new GLTFLoader();
      //set current path
      gltfLoader.setPath('./');
      gltfLoader.load("cell.glb", (gltf) => { // Use the .glb file instead of .gltf
          const object = gltf.scene; // Access the loaded 3D scene
          object.scale.set(0.15, 0.15, 0.15); // Scale the model
          object.position.set(0.2, -7.95, 0.2); // Position the model
          this.cellGroup.add(object); // Add the model to the cell group
      }, undefined, (error) => {
          console.error("An error occurred while loading the GLB model:", error);
      });
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

  brownianMotion(speed, molecules, minRadius, maxRadius) {
    molecules.forEach(molecule => {
      molecule.position.add(new THREE.Vector3(
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed
      ));
      if (molecule.position.length() > maxRadius) {
        molecule.position.setLength(maxRadius);
      }
      if (molecule.position.length() < minRadius) {
        molecule.position.setLength(minRadius);
      }
    });
  }

  animate() {
    this.brownianMotion(this.waterSpeed, this.waterMolecules, 0, this.cellRadius);
    this.brownianMotion(this.proteinSpeed, this.proteins, this.cellRadius/4, this.cellRadius);
    this.brownianMotion(this.extraCellularSpeed, this.extraCellularMolecules, this.cellRadius, this.cellRadius*3);
    
    // AR hit testing
    if (this.isARMode) {
      this.handleARHitTest();
    }
    
    this.renderer.setAnimationLoop(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
  
  handleARHitTest() {
    if (!this.hitTestSourceRequested) {
      const session = this.renderer.xr.getSession();
      
      if (session) {
        session.requestReferenceSpace('viewer').then((referenceSpace) => {
          session.requestHitTestSource({ space: referenceSpace }).then((source) => {
            this.hitTestSource = source;
          });
        });
        
        session.addEventListener('end', () => {
          this.hitTestSourceRequested = false;
          this.hitTestSource = null;
        });
        
        this.hitTestSourceRequested = true;
      }
    }
    
    if (this.hitTestSource) {
      const referenceSpace = this.renderer.xr.getReferenceSpace();
      const frame = this.renderer.xr.getFrame();
      
      if (frame) {
        const hitTestResults = frame.getHitTestResults(this.hitTestSource);
        
        if (hitTestResults.length && !this.modelPlaced) { // Only show the reticle if the model is not placed
          const hit = hitTestResults[0];
          const pose = hit.getPose(referenceSpace);
          
          if (pose) {
            this.reticle.visible = true;
            this.reticle.matrix.fromArray(pose.transform.matrix);
          }
        } else {
          this.reticle.visible = false;
        }
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new CellViewer());
