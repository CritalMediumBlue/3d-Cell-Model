import * as THREE from 'three';
import { SceneSetup } from './rendering/sceneSetup.js';
import { ParticleSystem } from './rendering/particleSystem.js';
import { DimensionHelpers } from './rendering/dimensionHelpers.js';
import { BrownianMotion } from './physics/brownianMotion.js';
import { ARController } from './interaction/ARController.js';
import { TouchHandler } from './interaction/touchHandler.js';
import { ChemicalReactions } from './physics/chemicalReactions.js';

export class CellViewer {
  constructor(mode) {
    this.mode = mode;
    this.start();
  }

  start(){
    this.isPaused = true;
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
    this.currentFPS = 0;
    this.frameTimeHistory = [];
    
    this.brownianMotion = new BrownianMotion(this.simulationTimeStep);
    this.particleSystem = new ParticleSystem(this.wholeSceneGroup, this.brownianMotion, this.mode);
    this.chemicalReactions = new ChemicalReactions(this.particleSystem);

    this.dimensionHelpers = new DimensionHelpers(
      this.particleSystem.rotatableGroup, 
      this.particleSystem.staticGroup, 
      this.wholeSceneGroup, 
      this.particleSystem.cellRadius
    );
    
    this.arController = new ARController(this.renderer, this.scene, this.wholeSceneGroup);

    this.touchHandler = new TouchHandler(
      this.wholeSceneGroup, 
      this.particleSystem.rotatableGroup, 
      this.arController, 
      this.simulationTimeStep,
      (newTimeStep) => {
        // Callback to update simulation time step
        this.simulationTimeStep = newTimeStep;
        // Also update physics properties when time step changes
        this.setupPhysics();

      },
      () => {
        // Callback for pause events
        this.isPaused = true;
        this.particleSystem.showEndToEndTrails();
        if (this.mode === "nucleus") {
          this.hidableMesh1.visible = false;
          this.hidableMesh2.visible = false;
        }
      },
      () => {
        // Callback for pause events
        this.isPaused = false;
        this.particleSystem.hideEndToEndTrails();
        if (this.mode === "nucleus") {
          this.hidableMesh1.visible = true;
          this.hidableMesh2.visible = true;
        }
      },
      () => {
        return this.isPaused;
      },
      this.mode,
      () => {
        this.particleSystem.restartSimulation();
        console.log("Simulation restarted");
      }
    );

    //add event listener for play/pausing the simulation with spacebar
    window.addEventListener('keydown', (event) => {
      if (event.code === 'Space') {
        if (this.isPaused) {
          this.touchHandler.unpause();
        } else {
          this.touchHandler.pause();
        }
      }
    });

    //add event listener for 'r' key to restart the simulation in nucleus and atp mode
    window.addEventListener('keydown', (event) => {
      if (event.key === 'r' && (this.mode === "nucleus" || this.mode === "atp")) {
        console.log("Restarting simulation");
        this.touchHandler.restartSimulation();
      }
    });

  }

  setupPhysics() {
    this.brownianMotion.simulationTimeStep = this.simulationTimeStep;  // this.simulationTimeStep will be dynamically adjustable by user through finger gestures in AR mode
    this.brownianMotion.updatePhysicsProperties(this.simulationTimeStep);
    this.proteinSD = this.brownianMotion.proteinSD;
    this.transportinSD = this.brownianMotion.proteinSD;
    this.cargoProteinSD = this.brownianMotion.proteinSD;
    this.virusSD = this.brownianMotion.virusSD;
    this.bacteriaSD = this.brownianMotion.bacteriaSD;
    this.ATPSD = this.brownianMotion.ATPSD;
    this.cellRadius = this.particleSystem.cellRadius;
  }

  setupParticlesAndDimensions() {
    // Initialize all particles
    this.particleSystem.initializeAllParticles(this.mode);
    
    // Initialize dimension helpers (grids, membrane, 3D model)
    const { hidableMesh1, hidableMesh2 } = this.dimensionHelpers.initializeAllDimensions(this.mode);
    
    this.proteins = this.particleSystem.proteins;
    this.viralParticles = this.particleSystem.viralParticles;
    this.bacteria = this.particleSystem.bacteria;
    this.atpMolecules = this.particleSystem.ATPmolecules;
    this.transportins = this.particleSystem.transportins;
    this.cargoProteins = this.particleSystem.cargoProteins;
    this.hidableMesh1 = hidableMesh1;
    this.hidableMesh2 = hidableMesh2;
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
  calculateFPS() {
    this.frameCount++;
    const currentTime = performance.now(); // current runtime in milliseconds
    const deltaTime = currentTime - this.lastFrameTime; // un
    this.lastFrameTime = currentTime;
    
    // Store frame time for average calculation
    this.frameTimeHistory.push(deltaTime);
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift(); // Keep only last 60 frames
    }

    // Update FPS display every 1000ms
    if(this.frameCount % 60 === 0) {
      
      const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
      const avgFPS = 1000 / avgFrameTime;
      
      this.currentFPS = avgFPS;
      
      
    }
    
  }

  animate() {
    
    
    this.calculateFPS();
    
    if (!this.isPaused) {
      if(this.mode === "atp"){
      this.brownianMotion.applyBrownianMotion(this.ATPSD, this.atpMolecules, 0, this.cellRadius*100, -100000,-15);
      }
      if(this.mode === "cell"){
      this.brownianMotion.applyBrownianMotion(this.virusSD, this.viralParticles, this.cellRadius, this.cellRadius*2);
      this.brownianMotion.applyBrownianMotion(this.proteinSD, this.proteins, this.cellRadius/4, this.cellRadius, 0, 0);
      this.brownianMotion.applyBrownianMotion(this.bacteriaSD, this.bacteria, this.cellRadius, this.cellRadius*2);
      }
      if(this.mode === "nucleus"){
      this.brownianMotion.applyBrownianMotion(this.transportinSD, this.transportins, this.cellRadius/4, this.cellRadius);
      this.brownianMotion.applyBrownianMotion(this.cargoProteinSD, this.cargoProteins, this.cellRadius/4, this.cellRadius);
      this.brownianMotion.applyBrownianMotion(this.proteinSD, this.proteins, this.cellRadius/4, this.cellRadius);
      this.chemicalReactions.bindParticles(this.cargoProteins, this.transportins);
    }
      this.particleSystem.updateParticleTrails();
      this.currentSimulationtime += this.simulationTimeStep;

    }
    
    if (this.arController.isARMode) {
      this.arController.handleARHitTest();
    }
    
    this.renderer.setAnimationLoop(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);

    if(this.frameCount % 60 === 0) {
      this.dimensionHelpers.updateTimeLabels(this.currentFPS, this.simulationTimeStep);

    }
  }
}