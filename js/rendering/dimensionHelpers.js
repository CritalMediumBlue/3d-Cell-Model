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

  updateShells(particles, diffusionCoefficientATP, currentTime) {
    // Calculate both statistics in a single loop
    let MSD = 0;
    let meanDistance = 0;
    const allDistances = [];
    
    particles.forEach(particle => {
      const distanceFromCenter = particle.position.length();
      MSD += distanceFromCenter * distanceFromCenter;
      meanDistance += distanceFromCenter;
      allDistances.push(distanceFromCenter);
    });
    
    MSD /= particles.length;
    meanDistance /= particles.length;
    const medianDistance = allDistances.sort((a, b) => a - b)[Math.floor(allDistances.length / 2)];
    
    const RMSD = Math.sqrt(MSD);

    const expectedRMSD = Math.sqrt(6 * diffusionCoefficientATP * 1e6 * 1e6 * currentTime); // in micrometers
    
    
    
  /*   // Dispose of existing shells
    if (this.shell) {
      this.rotatableGroup.remove(this.shell);
      if (this.shell.geometry) this.shell.geometry.dispose();
      if (this.shell.material) this.shell.material.dispose();
      this.shell = null;
    } */

    if (this.reticle) {
      this.rotatableGroup.remove(this.reticle);
      if (this.reticle.geometry) this.reticle.geometry.dispose();
      if (this.reticle.material) this.reticle.material.dispose();
      this.reticle = null;
    }

    if (this.shell2) {
      this.rotatableGroup.remove(this.shell2);
      if (this.shell2.geometry) this.shell2.geometry.dispose();
      if (this.shell2.material) this.shell2.material.dispose();
      this.shell2 = null;
    }

    if (this.reticleMean) {
      this.rotatableGroup.remove(this.reticleMean);
      if (this.reticleMean.geometry) this.reticleMean.geometry.dispose();
      if (this.reticleMean.material) this.reticleMean.material.dispose();
      this.reticleMean = null;
    }



/* 
    if (this.expectedRMSShell) {
      this.rotatableGroup.remove(this.expectedRMSShell);
      if (this.expectedRMSShell.geometry) this.expectedRMSShell.geometry.dispose();
      if (this.expectedRMSShell.material) this.expectedRMSShell.material.dispose();
      this.expectedRMSShell = null;
    } */
    if (this.reticleExpectedRMSD) {
      this.rotatableGroup.remove(this.reticleExpectedRMSD);
      if (this.reticleExpectedRMSD.geometry) this.reticleExpectedRMSD.geometry.dispose();
      if (this.reticleExpectedRMSD.material) this.reticleExpectedRMSD.material.dispose();
      this.reticleExpectedRMSD = null;
    }

    const Height=15;
    
    const  angleRMSD = Height<RMSD ? Math.PI-Math.acos(Height/RMSD) : 0;

    // Create reticle (pink)
    const reticleGeometry = new THREE.RingGeometry(RMSD - 0.601, RMSD + 0.601, 40);
    const reticleMaterial = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      side: THREE.DoubleSide
    });
    const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    this.rotatableGroup.add(reticle);
    this.reticle = reticle;
    this.reticle.rotation.x = -Math.PI / 2;

/*     // Create RMSD shell (pink)
    const shellGeometry = new THREE.SphereGeometry(RMSD, 10, 11, 0, 2 * Math.PI,0, angleRMSD);
    const shellMaterial = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    this.rotatableGroup.add(shell);
    this.shell = shell; */
    

    const angleMean = Height<meanDistance ? Math.PI-Math.acos(Height/meanDistance) : 0;
    const reticleMeanGeometry = new THREE.RingGeometry(meanDistance - 0.601, meanDistance + 0.601, 40);
    const reticleMeanMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      side: THREE.DoubleSide
    });
    const reticleMean = new THREE.Mesh(reticleMeanGeometry, reticleMeanMaterial);
    this.rotatableGroup.add(reticleMean);
    this.reticleMean = reticleMean;
    this.reticleMean.rotation.x = -Math.PI / 2;
    // Create mean distance shell (black)
    const shell2Geometry = new THREE.SphereGeometry(meanDistance, 10, 11, 0, 2 * Math.PI,0, angleMean);
    const shell2Material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const shell2 = new THREE.Mesh(shell2Geometry, shell2Material);
    this.rotatableGroup.add(shell2);
    this.shell2 = shell2;


    const angleExpectedRMSD = Height<expectedRMSD ? Math.PI-Math.acos(Height/expectedRMSD) : 0;

    const reticleExpectedRMSDGeometry = new THREE.RingGeometry(expectedRMSD - 0.601, expectedRMSD + 0.601, 40);
    const reticleExpectedRMSDMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide
    });
    const reticleExpectedRMSD = new THREE.Mesh(reticleExpectedRMSDGeometry, reticleExpectedRMSDMaterial);
    this.rotatableGroup.add(reticleExpectedRMSD);
    this.reticleExpectedRMSD = reticleExpectedRMSD;
    this.reticleExpectedRMSD.rotation.x = -Math.PI / 2;

/* 
    // Create expected RMSD shell (cyan)
    const expectedRMSShellGeometry = new THREE.SphereGeometry(expectedRMSD, 10, 11, 0, 2 * Math.PI,0, angleExpectedRMSD);
    const expectedRMSShellMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const expectedRMSShell = new THREE.Mesh(expectedRMSShellGeometry, expectedRMSShellMaterial);
    this.rotatableGroup.add(expectedRMSShell);
    this.expectedRMSShell = expectedRMSShell; 
 */
    return {
      shells: [this.shell2],
      reticles: [this.reticle, this.reticleMean, this.reticleExpectedRMSD]
    };
  }

  createTextLabel(text, color = 0xffffff, size = 1, width = 256*2, height = 64*2, centered = true, removable=false) {
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

 
  createCellMembrane(radius, xOffset=0, yOffset=0, zOffset=0, wireframe=false, color=0x0000ff) {
 
    const geometry = new THREE.SphereGeometry(radius, 20, 20);
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.2,
      color: color,
      wireframe: wireframe,
    });
    const membrane = new THREE.Mesh(geometry, material);
    membrane.position.set(xOffset, yOffset, zOffset);
    // Add membrane to rotatable group
    membrane.visible = true; // Hide the membrane by default
    this.rotatableGroup.add(membrane);
    return membrane;
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
    const gridHelperSmall = new THREE.GridHelper(30, 30, 0xffff00, 0x000000); // from -15 to +15 in 1um steps
    gridHelperSmall.position.set(0, -15, 0); // Position it at the bottom of the cell
    // Add grids to static group (won't rotate)
    this.staticGroup.add(gridHelperSmall);

    // Add a larger grid helper to represent the 5 μm scale
    const gridHelperBig = new THREE.GridHelper(30, 6, 0xffff00, 0xffff00); // from -15 to +15 in 5um steps
    gridHelperBig.position.set(0, -15, 0); // Position it at the bottom of the cell
    this.staticGroup.add(gridHelperBig); 



    const gridHelperHugeFine = new THREE.GridHelper(1000, 20, 0x00ffff, 0x000000); // from -500 to +500 in 10um steps
    gridHelperHugeFine.position.set(0, -15, 0); // Position it at the bottom of the cell
    this.staticGroup.add(gridHelperHugeFine);

        // Add an even larger grid helper to represent the 100 μm scale
    const gridHelperHuge = new THREE.GridHelper(1000, 10, 0x00ffff, 0x00ffff); // from -500 to +500 in 100um steps
    gridHelperHuge.position.set(0, -15, 0); // Position it at the bottom of the cell
    this.staticGroup.add(gridHelperHuge);

    // Store references for TouchHandler compatibility
    this.wholeSceneGroup.gridHelperSmall = gridHelperSmall;
    this.wholeSceneGroup.gridHelperBig = gridHelperBig;
    this.wholeSceneGroup.gridHelperHuge = gridHelperHuge;
    this.wholeSceneGroup.gridHelperHugeFine = gridHelperHugeFine;

      // Initialize hugeLabels array if it doesn't exist
  if (!this.wholeSceneGroup.hugeLabels) {
    this.wholeSceneGroup.hugeLabels = [];
  }
  
    // Add labels to the grid helpers to indicate 1 μm steps and 5 μm steps
    for (let i = -15; i <= 15; i += 5) {
      const label = i;
      const label1um = this.createTextLabel(
        label + " μm", 0x000000
      );
      label1um.position.set(
        i, -14.5, 0
      );
   

      this.staticGroup.add(label1um);
      if (i !== 0) { // Avoid duplicating the zero label
        const label1um2 = this.createTextLabel(
          (-i) + " μm", 0x000000
        );
      
        label1um2.position.set(
          0, -14.5, i
        );
        this.staticGroup.add(label1um2);
    
      }
    }

    // Add labels to the huge helper grid to indicate 100 μm steps
    for (let i = -400; i <= 400; i += 100) {
      if (i === 0) continue; // Skip the center label
      const label100um = this.createTextLabel(
        i + " μm", 0x000000, 18
      );
      label100um.position.set(
        i, -15, 0
      );
      this.staticGroup.add(label100um);

      const label100um2 = this.createTextLabel(
        (-i) + " μm", 0x000000, 18
      );
      label100um2.position.set(
        0, -15, i
      );
      this.staticGroup.add(label100um2);
      this.wholeSceneGroup.hugeLabels.push(label100um, label100um2);
    }

    // add four labels to indicate 0.5 milimiters (500 μm) in each direction
    const label500umPosX = this.createTextLabel("0.5 mm", 0x000000, 60);
    label500umPosX.position.set(500, -15, 0);
    this.staticGroup.add(label500umPosX);

    const label500umNegX = this.createTextLabel("-0.5 mm", 0x000000, 60);
    label500umNegX.position.set(-500, -15, 0);
    this.staticGroup.add(label500umNegX);

    const label500umPosZ = this.createTextLabel("0.5 mm", 0x000000, 60);
    label500umPosZ.position.set(0, -15, 500);
    this.staticGroup.add(label500umPosZ);

    const label500umNegZ = this.createTextLabel("-0.5 mm", 0x000000, 60);
    label500umNegZ.position.set(0, -15, -500);
    this.staticGroup.add(label500umNegZ);

    this.wholeSceneGroup.hugeLabels.push(label500umPosX, label500umNegX, label500umPosZ, label500umNegZ);

    const planeGeometry = new THREE.PlaneGeometry(30, 30);
    const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide, transparent: false });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = Math.PI / 2; // Rotate to be horizontal
    plane.position.set(0, -15.2, 0); // Position it at the bottom of the cell
    this.staticGroup.add(plane);



    
  }

  updateTimeLabels(frameRate, simulationTimeStep, currentSimulationtimeSinceStart) {
    // Dispose of all existing labels
    this.disposeLabel(this.currentTimeLabel);
    this.disposeLabel(this.currentTimeStepLabel);
    this.disposeLabel(this.currentFPSLabel);
    this.disposeLabel(this.frameLengthLabel);
    this.disposeLabel(this.currentSimulationTimeLabel);

    // Calculate frame length in milliseconds
    const frameLength = (1 / frameRate) ; // in s

     // Create new FPS label
    this.currentFPSLabel = this.createTextLabel("    Bilder pro Sekunde: " + frameRate.toFixed(2) + " Bilder", 0x000000, 5, 8 * 256, 8 * 64, false);
    this.currentFPSLabel.position.set(0, 20, 0);
    this.staticGroup.add(this.currentFPSLabel);

    // Create new frame length label
    this.frameLengthLabel = this.createTextLabel("    Dauer des Animationsbildes: " + frameLength.toFixed(5) + " s", 0x000000, 5, 8 * 256, 8 * 64, false);
    this.frameLengthLabel.position.set(0,19, 0);
    this.staticGroup.add(this.frameLengthLabel);

   

    const deltaTime = 1 / frameRate;
    const timeRate = (simulationTimeStep / deltaTime).toFixed(5);

    // Create new time label
    this.currentTimeLabel = this.createTextLabel("    Simulationsgeschwindigkeit: " + timeRate + "x Echtzeit", 0x000000, 5, 8 * 256, 8 * 64, false);
    this.currentTimeLabel.position.set(0, 17, 0);
    this.currentTimeStepLabel = this.createTextLabel("    Simulationszeitschritt: " + simulationTimeStep.toFixed(5) + "s", 0x000000, 5, 8 * 256, 8 * 64, false);
    this.currentTimeStepLabel.position.set(0, 16, 0);

    this.currentSimulationTimeLabel = this.createTextLabel("    Verstrichene Simulationszeit: " + currentSimulationtimeSinceStart.toFixed(2) + "s", 0x000000, 5, 8 * 256, 8 * 64, false);
    this.currentSimulationTimeLabel.position.set(0, 15, 0);
    this.staticGroup.add(this.currentSimulationTimeLabel);

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

  initializeAllDimensions(mode) {

  let hidableMesh1 = null;
  let hidableMesh2 = null;
    if (mode === "cell"){
      this.createCellMembrane(7.7,0,0,0);
      this.createHelperGrid();
      this.loadCellModel();
    }
    if (mode === "nucleus"){
      hidableMesh1 = this.createCellMembrane(7.7,0,0,0, true, 0x000000);
      hidableMesh2 = this.createCellMembrane(7.7/3, 0,0,0, true, 0xffffff);
      this.createHelperGrid();

    }
    if (mode === "atp"){
    this.createHelperGrid();
    this.loadCellModel();
    }

    // Return references to the hidable meshes for external control
    return { hidableMesh1, hidableMesh2 };
   
  }
}
