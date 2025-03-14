import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

class CellViewer {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
    document.head.appendChild(meta);
    // Enable WebXR
    this.renderer.xr.enabled = true;
    document.body.appendChild(this.renderer.domElement);
    
    // Add VR button to the page
    document.body.appendChild(VRButton.createButton(this.renderer));  
    this.camera.position.set(40, 40, 40);
    this.camera.lookAt(0, 0, 0);
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 3);
    keyLight.position.set(3, 10, 3).normalize();
    const fogColor = new THREE.Color(0x0F000F);  // Light gray fog
    this.scene.fog = new THREE.Fog(fogColor, 2, 90);
    this.scene.background = fogColor;
    this.scene.add(keyLight);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.proteins = []; 
    this.waterMolecules = []; 
    this.proteinSpeed = 0.1; 
    this.waterSpeed = 1; 
    this.cellRadius = 25; 

    this.loadCellModel();
    this.createParticles(); 
    this.animate();
 
    window.addEventListener('resize', this.onWindowResize.bind(this));
    const isDesktop = !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
if (isDesktop) {
  const infoDiv = document.createElement('div');
  infoDiv.style = "position:fixed; bottom:10px; width:100%; text-align:center; color:white; background:rgba(0,0,0,0.5); padding:10px;";
  infoDiv.innerHTML = "For VR experience, please open this page on a mobile device using Chrome";
  document.body.appendChild(infoDiv);
}
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
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
    const proteinMaterial = new THREE.MeshPhongMaterial({ 
      emissive: proteinColor,
      emissiveIntensity: 1,
    });
    
    for (let i = 0; i < 300; i++) {
     
      const protein = new THREE.Mesh(proteinGeometry, proteinMaterial);
      
      protein.position.set(
        (Math.random() - 0.5)*50,
        (Math.random() - 0.5)*50,
        (Math.random() - 0.5)*50
      );
      
      this.scene.add(protein);
      this.proteins.push(protein);
    }
    const waterMaterial = new THREE.MeshPhongMaterial({ 
      emissive: waterColor,
      emissiveIntensity: 1,
      });

    for (let i = 0; i < 200; i++) {
        
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
    
    this.renderer.setAnimationLoop(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

document.addEventListener('DOMContentLoaded', () => new CellViewer());