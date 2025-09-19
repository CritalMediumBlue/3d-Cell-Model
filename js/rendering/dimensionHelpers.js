import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export class DimensionHelpers {
  constructor(rotatableGroup, staticGroup, wholeSceneGroup, cellRadius) {
    this.rotatableGroup = rotatableGroup;
    this.staticGroup = staticGroup;
    this.wholeSceneGroup = wholeSceneGroup;
    this.cellRadius = cellRadius;
    this.currentTimeLabel = null; // Store reference to current time label
    this.currentTimeStepLabel = null; // Store reference to current time step label
    this.currentFPSLabel = null; // Store reference to current FPS label
  }

  createTextLabel(text, color = 0xffffff, size = 0.4, width = 256, height = 64) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    // Clear canvas with transparent background
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.font = '80px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true,
      alphaTest: 0
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(size * 4, size, 1);
    
    return sprite;
  }

  createCellMembrane() {
    const geometry = new THREE.SphereGeometry(this.cellRadius, 60, 60);
    const material = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      wireframe: false,
      transparent: true, 
      side: THREE.DoubleSide,
      opacity: 0.2
    });
    const membrane = new THREE.Mesh(geometry, material);
    membrane.position.set(0, 0, 0); // Center the membrane
    // Add membrane to rotatable group
    this.rotatableGroup.add(membrane);
  }

  createHelperGrid() {
    // Add a plane grid helper to represent the 1 μm scale
    const gridHelperSmall = new THREE.GridHelper(30, 30, 0xff0000, 0x00ffff);
    gridHelperSmall.position.y = -this.cellRadius; // Position it at the bottom of the cell
    // Add grids to static group (won't rotate)
    this.staticGroup.add(gridHelperSmall);

    // Add a larger grid helper to represent the 10 μm scale
    const gridHelperBig = new THREE.GridHelper(30, 6, 0xff0000, 0xff00ff);
    gridHelperBig.position.y = -this.cellRadius; // Position it at the bottom of the cell
    this.staticGroup.add(gridHelperBig); 

    // Store references for TouchHandler compatibility
    this.wholeSceneGroup.gridHelperSmall = gridHelperSmall;
    this.wholeSceneGroup.gridHelperBig = gridHelperBig;

    // Add labels to the grid helpers to indicate 1 μm steps and 10 μm steps
    for (let i = -15; i <= 15; i += 5) {
      const label = i;
      const label1um = this.createTextLabel(
        label + " μm", 0x000000
      );
      label1um.position.set(
        i, -this.cellRadius, 0
      );
      this.staticGroup.add(label1um);
      if (i !== 0) { // Avoid duplicating the zero label
        const labelNeg = this.createTextLabel(
          (-i) + " μm", 0x000000
        );
        labelNeg.position.set(
          0, -this.cellRadius, i
        );
        this.staticGroup.add(labelNeg);
      }
    }
    
    const axesHelper = new THREE.AxesHelper(this.cellRadius +1/2);
    this.staticGroup.add(axesHelper);
  }

  updateTimeLabels(frameRate, simulationTimeStep) {
    // Remove previous time label if it exists
    if (this.currentTimeLabel) {
      this.staticGroup.remove(this.currentTimeLabel);
      // Dispose of the material and texture to free memory
      if (this.currentTimeLabel.material.map) {
        this.currentTimeLabel.material.map.dispose();
      }
      this.currentTimeLabel.material.dispose();
    }

    if (this.currentTimeStepLabel) {
      this.staticGroup.remove(this.currentTimeStepLabel);
      // Dispose of the material and texture to free memory
      if (this.currentTimeStepLabel.material.map) {
        this.currentTimeStepLabel.material.map.dispose();
      }
      this.currentTimeStepLabel.material.dispose();
    }

    if (this.currentFPSLabel) {
      this.staticGroup.remove(this.currentFPSLabel);
      // Dispose of the material and texture to free memory
      if (this.currentFPSLabel.material.map) {
        this.currentFPSLabel.material.map.dispose();
      }
      this.currentFPSLabel.material.dispose();
    }

    // Create new FPS label
    this.currentFPSLabel = this.createTextLabel("FPS: " + frameRate.toFixed(2), 0x000000, 1, 3 * 256, 3 * 64);
    this.currentFPSLabel.position.set(0, this.cellRadius + 1.5, 0);
    this.staticGroup.add(this.currentFPSLabel);

    const deltaTime = 1 / frameRate;
    const timeRate = (simulationTimeStep / deltaTime).toFixed(5);

    // Create new time label
    this.currentTimeLabel = this.createTextLabel("Simulation speed: " + timeRate + "x real-time", 0x000000, 1.5,7 * 256, 7 * 64);
    this.currentTimeLabel.position.set(0, this.cellRadius + 1, 0);
    this.currentTimeStepLabel = this.createTextLabel("Simulation Step: " + simulationTimeStep.toFixed(5) + "s", 0x000000, 1, 5 * 256, 5 * 64);
    this.currentTimeStepLabel.position.set(0, this.cellRadius + 0.5, 0);

    this.staticGroup.add(this.currentTimeLabel);
    this.staticGroup.add(this.currentTimeStepLabel);
  }

  loadCellModel() {
    const gltfLoader = new GLTFLoader();
    
    // Set up DRACO loader for compressed models
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    gltfLoader.setDRACOLoader(dracoLoader);
    
    // Set current path
    gltfLoader.setPath('./');
    gltfLoader.load("./cellModel/output.glb", (gltf) => {
      const object = gltf.scene;
      object.scale.set(0.15, 0.15, 0.15);
      object.position.set(0.2, -7.95, 0.2);
      // Add cell model to rotatable group
      this.rotatableGroup.add(object);
      
      // Clean up DRACO loader
      dracoLoader.dispose();
    }, undefined, (error) => {
      console.error('Error loading cell model:', error);
    });
  }

  initializeAllDimensions() {
    this.createCellMembrane();
    this.createHelperGrid();
    this.loadCellModel();
  }
}
