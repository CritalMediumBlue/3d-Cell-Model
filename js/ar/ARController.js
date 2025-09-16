import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';

export class ARController {
  constructor(renderer, scene, cellGroup) {
    this.renderer = renderer;
    this.scene = scene;
    this.cellGroup = cellGroup;
    this.isARMode = false;
    this.reticle = null;
    this.hitTestSource = null;
    this.hitTestSourceRequested = false;
    this.modelPlaced = false;
    this.controller = null;
    this.onModelPlaced = null; // Callback function for when model is placed
    
    // Store original fog settings to preserve them during AR
    this.originalFog = this.scene.fog;
    
    this.setupAR();
  }

  setupAR() {
    // Create AR button
    const arButton = ARButton.createButton(this.renderer, {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: document.body }
    });
    
    // Apply custom styling to make the button bigger
    arButton.style.padding = '20px 25px';
    arButton.style.fontSize = '24px';
    arButton.style.width = 'auto';
    arButton.style.fontWeight = 'bold';
    arButton.style.borderRadius = '8px';
    arButton.style.minWidth = '180px';  // Ensure minimum width
    arButton.style.opacity = '0.9';
    document.body.appendChild(arButton);
    
    // Create reticle for AR placement
    const reticleGeometry = new THREE.RingGeometry(0.18, 0.25, 32).rotateX(-Math.PI / 2); //0.25 are 0.25 meters in the real world
    const reticleMaterial = new THREE.MeshBasicMaterial({color: 0x0000ff,transparent: true, opacity: 0.5, side: THREE.DoubleSide});
    this.reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    this.reticle.matrixAutoUpdate = false;
    this.reticle.visible = false;
    this.scene.add(this.reticle);
  
    // Set up controller for AR interaction
    this.controller = this.renderer.xr.getController(0);
    this.controller.addEventListener('select', this.onSelect.bind(this));
    this.scene.add(this.controller);
    
    // Add event listeners to preserve fog during AR sessions
    this.renderer.xr.addEventListener('sessionstart', this.onARSessionStart.bind(this));
    this.renderer.xr.addEventListener('sessionend', this.onARSessionEnd.bind(this));
  }

  onARSessionStart() {
    this.isARMode = true;
    this.cellGroup.visible = false; // Hide until placed
    this.modelPlaced = false;
    // Ensure fog is preserved when entering AR mode
    if (this.originalFog && !this.scene.fog) {
      this.scene.fog = this.originalFog;
    }
  }

  onARSessionEnd() {
    this.isARMode = false;
    // Restore fog when exiting AR mode
    if (this.originalFog) {
      this.scene.fog = this.originalFog;
    } 
  }

  onSelect() {
    if (this.reticle.visible && !this.modelPlaced) {
      // Place the cell group at the reticle position
      this.cellGroup.position.setFromMatrixPosition(this.reticle.matrix);
      this.cellGroup.position.y += 0.77
      this.cellGroup.scale.set(0.1, 0.1, 0.1);
      //hide the reticle after placing the model
      this.reticle.visible = true;
      this.cellGroup.visible = true;
      this.modelPlaced = true;
      
      // Trigger the callback if it exists
      if (this.onModelPlaced && typeof this.onModelPlaced === 'function') {
        this.onModelPlaced();
      }
    }
  }

  handleARHitTest() {
    // Ensure fog is maintained during AR session
    if (this.isARMode && this.originalFog && !this.scene.fog) {
      this.scene.fog = this.originalFog;
    }
    
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
        }
      }
    }
  }
}