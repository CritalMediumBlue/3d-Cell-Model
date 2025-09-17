import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export class DimensionHelpers {
  constructor(rotatableGroup, staticGroup, cellGroup, cellRadius) {
    this.rotatableGroup = rotatableGroup;
    this.staticGroup = staticGroup;
    this.cellGroup = cellGroup;
    this.cellRadius = cellRadius;
  }

  createTextLabel(text, color = 0xffffff, size = 0.4) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
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
    const gridHelperBig = new THREE.GridHelper(30, 6, 0xff0000, 0xff0000);
    gridHelperBig.position.y = -this.cellRadius; // Position it at the bottom of the cell
    this.staticGroup.add(gridHelperBig); 

    // Store references for TouchHandler compatibility
    this.cellGroup.gridHelperSmall = gridHelperSmall;
    this.cellGroup.gridHelperBig = gridHelperBig;

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
    
    const axesHelper = new THREE.AxesHelper(20);
    this.staticGroup.add(axesHelper);
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
