import * as THREE from 'three';
import { SceneSetup } from './rendering/sceneSetup.js';
import { ParticleSystem } from './rendering/particleSystem.js';
import { BrownianMotion } from './physics/brownianMotion.js';
import { ARController } from './ar/ARController.js';
import { TouchHandler } from './interaction/touchHandler.js';

export class CellViewer {
  constructor() {
    this.start();
  }

  start(){
    this.initScene();
    this.initComponents();
    this.setupPhysics();
    this.setupParticles();
    this.setupInteractions();
    this.animate();
  }

  initScene() {
    // Initialize the scene setup
    this.sceneSetup = new SceneSetup();
    this.scene = this.sceneSetup.scene;
    this.camera = this.sceneSetup.camera;
    this.renderer = this.sceneSetup.renderer;
    this.controls = this.sceneSetup.controls;

    // Create a group to hold all cell-related objects for easier manipulation in AR
    this.cellGroup = new THREE.Group();
    this.scene.add(this.cellGroup);
  }

  initComponents() {
    this.brownianMotion = new BrownianMotion();
    
    this.particleSystem = new ParticleSystem(this.cellGroup, this.brownianMotion);
    
    this.arController = new ARController(this.renderer, this.scene, this.cellGroup);
    
    this.touchHandler = new TouchHandler(this.cellGroup, this.arController);
    
    // Pass the rotatable group reference to TouchHandler
    this.touchHandler.rotatableGroup = this.particleSystem.rotatableGroup;
  }

  setupPhysics() {
    // Get physics properties from brownian motion module
    this.proteinSD = this.brownianMotion.proteinSD;
    this.virusSD = this.brownianMotion.virusSD;
    this.bacteriaSD = this.brownianMotion.bacteriaSD;
    this.cellRadius = this.particleSystem.cellRadius;
  }

  setupParticles() {
    // Initialize all particles
    this.particleSystem.initializeAllParticles();
    
    this.proteins = this.particleSystem.proteins;
    this.viralParticles = this.particleSystem.viralParticles;
    this.bacteria = this.particleSystem.bacteria;
  }

  setupInteractions() {
    // Set up AR mode change listener
    this.renderer.xr.addEventListener('sessionstart', () => {
      this.touchHandler.setARMode(true);
      // Disable OrbitControls in AR mode
      if (this.controls) {
        this.controls.enabled = false;
      }
    });

    this.renderer.xr.addEventListener('sessionend', () => {
      this.touchHandler.setARMode(false);
      // Re-enable OrbitControls when exiting AR mode
      if (this.controls) {
        this.controls.enabled = true;
      }
    });

    // Listen for model placement in AR
    this.arController.onModelPlaced = () => {
      this.touchHandler.setModelPlaced(true);
    };
  }

  animate() {
    
    this.brownianMotion.applyBrownianMotion(this.virusSD, this.viralParticles, this.cellRadius, this.cellRadius*3);
    this.brownianMotion.applyBrownianMotion(this.proteinSD, this.proteins, this.cellRadius/3, this.cellRadius, 0, 0);
    this.brownianMotion.applyBrownianMotion(this.bacteriaSD, this.bacteria, this.cellRadius, this.cellRadius*3);
    
    if (this.arController.isARMode) {
      this.arController.handleARHitTest();
    }
    
    this.renderer.setAnimationLoop(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}