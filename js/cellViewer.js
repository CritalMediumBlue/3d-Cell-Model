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
    // Initialize physics first
    this.brownianMotion = new BrownianMotion();
    
    // Initialize particle system with brownian motion reference
    this.particleSystem = new ParticleSystem(this.cellGroup, this.brownianMotion);
    
    // Initialize AR controller
    this.arController = new ARController(this.renderer, this.scene, this.cellGroup);
    
    // Initialize touch handler
    this.touchHandler = new TouchHandler(this.cellGroup);
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
    
    // Get references to particle arrays for physics simulation
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
    // Apply Brownian motion to different particle types
    // Note how each particle type has its own standard deviation (SD) based on its size and environment
    
    // Viral particles: Larger SD than proteins but smaller than bacteria
    // Move in extracellular space (between cellRadius and cellRadius*3)
    this.brownianMotion.applyBrownianMotion(this.virusSD, this.viralParticles, this.cellRadius, this.cellRadius*3);
    
    // Proteins: Smallest particles, highest diffusion coefficient, but in viscous cytoplasm
    // Move within the cell (between cellRadius/3 and cellRadius)
    this.brownianMotion.applyBrownianMotion(this.proteinSD, this.proteins, this.cellRadius/3, this.cellRadius, 0, 0);
    
    // Bacteria: Largest particles, lowest diffusion coefficient
    // Move in extracellular space (between cellRadius and cellRadius*3)
    this.brownianMotion.applyBrownianMotion(this.bacteriaSD, this.bacteria, this.cellRadius, this.cellRadius*3);
    
    // AR hit testing
    if (this.arController.isARMode) {
      this.arController.handleARHitTest();
    }
    
    this.renderer.setAnimationLoop(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}