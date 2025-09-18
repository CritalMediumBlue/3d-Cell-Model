import * as THREE from 'three';
import { SceneSetup } from './rendering/sceneSetup.js';
import { ParticleSystem } from './rendering/particleSystem.js';
import { DimensionHelpers } from './rendering/dimensionHelpers.js';
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
    this.setupParticlesAndDimensions();
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
    this.wholeSceneGroup = new THREE.Group();
    this.scene.add(this.wholeSceneGroup);
  }

  initComponents() {
    this.simulationTimeStep = 0.01666; // Approx 60 FPS
    this.currentSimulationtime = 0;
    
    // Frame rate monitoring variables
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.lastFPSUpdate = performance.now();
    this.currentFPS = 0;
    this.frameTimeHistory = [];
    
    this.brownianMotion = new BrownianMotion(this.simulationTimeStep);

    this.particleSystem = new ParticleSystem(this.wholeSceneGroup, this.brownianMotion);
    
    this.dimensionHelpers = new DimensionHelpers(
      this.particleSystem.rotatableGroup, 
      this.particleSystem.staticGroup, 
      this.wholeSceneGroup, 
      this.particleSystem.cellRadius
    );
    
    this.arController = new ARController(this.renderer, this.scene, this.wholeSceneGroup);
    
    this.touchHandler = new TouchHandler(this.wholeSceneGroup, this.arController);
    
    // Pass the rotatable group reference to TouchHandler
    this.touchHandler.rotatableGroup = this.particleSystem.rotatableGroup;
  }

  setupPhysics() {
    // Get physics properties from brownian motion module
    const timeStep = 0.01666; // Approx 60 FPS
    this.simulationTimeStep = timeStep;
    this.brownianMotion.simulationTimeStep = timeStep;
    this.brownianMotion.updatePhysicsProperties(timeStep);
    this.proteinSD = this.brownianMotion.proteinSD;
    this.virusSD = this.brownianMotion.virusSD;
    this.bacteriaSD = this.brownianMotion.bacteriaSD;
    this.cellRadius = this.particleSystem.cellRadius;
  }

  setupParticlesAndDimensions() {
    // Initialize all particles
    this.particleSystem.initializeAllParticles();
    
    // Initialize dimension helpers (grids, membrane, 3D model)
    this.dimensionHelpers.initializeAllDimensions();
    
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

  // Frame rate monitoring methods
  calculateFPS(currentTime) {
    this.frameCount++;
    const deltaTime = currentTime - this.lastFrameTime; // un
    this.lastFrameTime = currentTime;
    
    // Store frame time for average calculation
    this.frameTimeHistory.push(deltaTime);
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift(); // Keep only last 60 frames
    }

    // Update FPS display every 1000ms
    if (currentTime - this.lastFPSUpdate > 2000) {
      // Instantaneous FPS
      const instantFPS = 1000 / deltaTime;
      
      // Average FPS over last 60 frames
      const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
      const avgFPS = 1000 / avgFrameTime;
      
      this.currentFPS = avgFPS;
      
      console.log(`📊 Frame Rate Analysis:
      🎯 Current FPS: ${instantFPS.toFixed(1)}
      📈 Average FPS: ${avgFPS.toFixed(1)} 
      ⏱️  Frame Time: ${deltaTime.toFixed(2)}ms
      📊 Avg Frame Time: ${avgFrameTime.toFixed(2)}ms
      🎬 Total Frames: ${this.frameCount}
      ⏰ Runtime: ${(currentTime / 1000).toFixed(1)}s`);
      
      this.lastFPSUpdate = currentTime;
    }
    
    return this.currentFPS;
  }

  animate() {
    
    const currentFrameTime = performance.now(); // current runtime in milliseconds
    
    // Calculate and monitor frame rate
    this.calculateFPS(currentFrameTime);
    
    this.brownianMotion.applyBrownianMotion(this.virusSD, this.viralParticles, this.cellRadius, this.cellRadius*2);
    this.brownianMotion.applyBrownianMotion(this.proteinSD, this.proteins, this.cellRadius/3, this.cellRadius, 0, 0);
    this.brownianMotion.applyBrownianMotion(this.bacteriaSD, this.bacteria, this.cellRadius, this.cellRadius*2);
    
    // Update particle trails after movement
    this.particleSystem.updateParticleTrails();
    
    if (this.arController.isARMode) {
      this.arController.handleARHitTest();
    }
    
    this.renderer.setAnimationLoop(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
    this.currentSimulationtime += this.simulationTimeStep;
    this.setupPhysics();

    if(this.frameCount % 120 === 0) {
      this.dimensionHelpers.updateTimeLabels(this.currentFPS);
    }
  }
}