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
 
    this.loadCellModel();
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
        this.scene.add(object);
      });
    });
  }
  
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

document.addEventListener('DOMContentLoaded', () => new CellViewer());