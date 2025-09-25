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
    this.frameLengthLabel = null; // Store reference to frame length label
  }

  createTextLabel(text, color = 0xffffff, size = 0.8, width = 256*2, height = 64*2, centered = true) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    // Clear canvas with transparent background
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.font = '80px Arial';
    
    context.textAlign = centered ? 'center' : 'left';
    context.textBaseline = 'middle';
    const xPos = centered ? canvas.width / 2+100 : 100; // 10px padding if not centered
    context.fillText(text, xPos, canvas.height / 2);

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

  // Helper method to dispose of a label and remove it from the scene
  disposeLabel(label) {
    if (label) {
      this.staticGroup.remove(label);
      // Dispose of the material and texture to free memory
      if (label.material.map) {
        label.material.map.dispose();
      }
      label.material.dispose();
    }
  }

  createHelperGrid() {
    // Add a plane grid helper to represent the 1 μm scale
    const gridHelperSmall = new THREE.GridHelper(30, 30, 0x000000, 0xffff00);
    gridHelperSmall.position.y = -this.cellRadius; // Position it at the bottom of the cell
    gridHelperSmall.position.set(0, -15, 0); // Position it at the bottom of the cell
    // Add grids to static group (won't rotate)
    this.staticGroup.add(gridHelperSmall);

    // Add a larger grid helper to represent the 10 μm scale
    const gridHelperBig = new THREE.GridHelper(30, 6, 0x000000, 0xff00ff);
    gridHelperBig.position.y = -this.cellRadius; // Position it at the bottom of the cell
    gridHelperBig.position.set(0, -15, 0); // Position it at the bottom of the cell
    this.staticGroup.add(gridHelperBig); 

    // Add a small-grid vertical grid helper on the back. We can copy the small grid and rotate it.
    const gridHelperSmallVertical = gridHelperSmall.clone();
    gridHelperSmallVertical.rotation.x = Math.PI / 2; // Rotate to vertical\
    gridHelperSmallVertical.position.set(0, 0, -15); // Position it at the back
    this.staticGroup.add(gridHelperSmallVertical);

    // Add a larger vertical grid helper to represent the 10 μm scale
    const gridHelperBigVertical = gridHelperBig.clone();
    gridHelperBigVertical.rotation.x = Math.PI / 2; // Rotate to vertical
    gridHelperBigVertical.position.set(0, 0, -15); // Position it at the back
    this.staticGroup.add(gridHelperBigVertical);

    // Store references for TouchHandler compatibility
    this.wholeSceneGroup.gridHelperSmall = gridHelperSmall;
    this.wholeSceneGroup.gridHelperBig = gridHelperBig;
    this.wholeSceneGroup.gridHelperSmallVertical = gridHelperSmallVertical;
    this.wholeSceneGroup.gridHelperBigVertical = gridHelperBigVertical;

    // Add labels to the grid helpers to indicate 1 μm steps and 10 μm steps
    for (let i = -15; i <= 15; i += 5) {
      const label = i;
      const label1um = this.createTextLabel(
        label + " μm", 0x000000
      );
      const label1umVertical = label1um.clone();
      label1um.position.set(
        i, -15, 0
      );
      label1umVertical.position.set(
        i, 0, -15
      );

      this.staticGroup.add(label1um);
      this.staticGroup.add(label1umVertical);
      if (i !== 0) { // Avoid duplicating the zero label
        const label1um2 = this.createTextLabel(
          (-i) + " μm", 0x000000
        );
        const label1umVertical2 = label1um2.clone();
        label1umVertical2.position.set(
          0, -15, i
        );
        this.staticGroup.add(label1umVertical2);
        label1um2.position.set(
          0, -15, i
        );
        this.staticGroup.add(label1um2);
        const labelNegVertical = label1um2.clone();
        labelNegVertical.position.set(
         0, -i, -15
        );
        this.staticGroup.add(labelNegVertical);
      }
    }
    
    const axesHelper = new THREE.AxesHelper(this.cellRadius + 1/2);
    this.staticGroup.add(axesHelper);
  }

  updateTimeLabels(frameRate, simulationTimeStep) {
    // Dispose of all existing labels
    this.disposeLabel(this.currentTimeLabel);
    this.disposeLabel(this.currentTimeStepLabel);
    this.disposeLabel(this.currentFPSLabel);
    this.disposeLabel(this.frameLengthLabel);

    // Calculate frame length in milliseconds
    const frameLength = (1 / frameRate) ; // in s

     // Create new FPS label
    this.currentFPSLabel = this.createTextLabel("Frames per second: " + frameRate.toFixed(2) + " frames", 0x000000, 2, 6 * 256, 6 * 64, false);
    this.currentFPSLabel.position.set(0, this.cellRadius + 3.0, 0);
    this.staticGroup.add(this.currentFPSLabel);

    // Create new frame length label
    this.frameLengthLabel = this.createTextLabel("Duration of animation frame: " + frameLength.toFixed(5) + " s", 0x000000, 2, 6 * 256, 6 * 64, false);
    this.frameLengthLabel.position.set(0, this.cellRadius + 2.5, 0);
    this.staticGroup.add(this.frameLengthLabel);

   

    const deltaTime = 1 / frameRate;
    const timeRate = (simulationTimeStep / deltaTime).toFixed(5);

    // Create new time label
    this.currentTimeLabel = this.createTextLabel("Simulation speed: " + timeRate + "x real-time", 0x000000, 2,6 * 256, 6 * 64, false);
    this.currentTimeLabel.position.set(0, this.cellRadius + 1.0, 0);
    this.currentTimeStepLabel = this.createTextLabel("Simulation time step: " + simulationTimeStep.toFixed(5) + "s", 0x000000, 2, 6* 256, 6 * 64, false);
    this.currentTimeStepLabel.position.set(0, this.cellRadius + 1.5, 0);

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
