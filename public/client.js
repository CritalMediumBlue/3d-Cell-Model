import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class CellViewer {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);    
    this.camera.position.set(40, 40, 40);
    this.camera.lookAt(0, 0, 0);
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    keyLight.position.set(3, 10, 3).normalize();
    const fillLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
    fillLight.position.set(0, -5, -1).normalize();
    const backLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    backLight.position.set(-10, 0, 0).normalize();
    const fogColor = new THREE.Color(0x0F0000);  // Light gray fog
    this.scene.fog = new THREE.Fog(fogColor, 10, 120);
    this.scene.background = fogColor;
    this.scene.add(keyLight, fillLight, backLight);   
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.proteins = []; // Array to store proteins
    this.waterMolecules = []; // Array to store water molecules
    this.proteinSpeed = 0.1; // Controls the speed of Brownian motion
    this.waterSpeed = 1; // Controls the speed of Brownian motion
    this.cellRadius = 25; // Radius of the cell membrane

    this.loadCellModel();
    this.createParticles(); // Add proteins to the scene
    //this.createCellMembrane(); // Add cell membrane to the scene
    this.animate();
  }
  
  loadCellModel() {
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath('./cellModel/');
    mtlLoader.load("CellAnatomy.mtl", (materials) => {
      materials.preload();
      const objLoader = new OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.setPath("./cellModel/");
      objLoader.load("CellAnatomy.obj", (object) => {
        object.scale.set(0.5, 0.5, 0.5);
        object.position.set(1, -26, 0);
        this.scene.add(object);
      });
    });
  }

  createParticles() {
    const proteinGeometry = new THREE.SphereGeometry(0.5, 4, 4);
    const waterGeometry = new THREE.SphereGeometry(0.1, 1, 1);
    
    const proteinColor=0x00ff00;
    const waterColor=0x0000ff;

    
    for (let i = 0; i < 300; i++) {
      const proteinMaterial = new THREE.MeshPhongMaterial({ 
        emissive: proteinColor,
        emissiveIntensity: 1,
      });
      
      const protein = new THREE.Mesh(proteinGeometry, proteinMaterial);
      
    
      protein.position.set(
        (Math.random() - 0.5)*50,
        (Math.random() - 0.5)*50,
        (Math.random() - 0.5)*50
      );
      
      this.scene.add(protein);
      this.proteins.push(protein);
    }

    for (let i = 0; i < 200; i++) {
        const waterMaterial = new THREE.MeshPhongMaterial({ 
            emissive: waterColor,
            emissiveIntensity: 1,
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.position.set(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50
        );
        this.scene.add(water);
        this.waterMolecules.push(water);
        }
  }

  createCellMembrane() {
    const segments = 64; // Number of segments
    const geometry = new THREE.SphereGeometry(this.cellRadius, segments, segments);
    const material = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(0, 0, 0);
    this.scene.add(sphere);
  }
  
  animate() {
    // Update protein positions with Brownian motion
    this.proteins.forEach(protein => {
      // Random movement in each direction
      protein.position.x += (Math.random() - 0.5) * this.proteinSpeed;
      protein.position.y += (Math.random() - 0.5) * this.proteinSpeed;
      protein.position.z += (Math.random() - 0.5) * this.proteinSpeed;

    //if the position is outside the bounds of the cell membrane, reflect the protein back into the cell
    const radius = this.cellRadius;
    if (protein.position.length() > radius) {
            protein.position.setLength(radius);
           }
      
    });

    // Update water molecule positions with Brownian motion
    this.waterMolecules.forEach(water => {
      // Random movement in each direction
      water.position.x += (Math.random() - 0.5) * this.waterSpeed;
      water.position.y += (Math.random() - 0.5) * this.waterSpeed;
      water.position.z += (Math.random() - 0.5) * this.waterSpeed;

        //if the position is outside the bounds of the cell membrane, reflect the protein back into the cell
        const radius = this.cellRadius;
        if (water.position.length() > radius) {
            water.position.setLength(radius);
        }
    }
    );
    
    requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

document.addEventListener('DOMContentLoaded', () => new CellViewer());