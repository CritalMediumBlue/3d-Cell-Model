import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


let WIDTH = window.innerWidth;
let HEIGHT = window.innerHeight;

var keyLight, fillLight, backLight;
var scene, camera, renderer, cameraControls;

var cellParts = new Array();

// Function in charge to create and set up imporant components of the scene.
function init(){


    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, WIDTH / HEIGHT, 1, 1000);
    renderer = new THREE.WebGLRenderer({antialias: true});

    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize(WIDTH, HEIGHT);
    renderer.setClearColor(0x000000, 1);
    document.body.appendChild(renderer.domElement);

    loadObject();
    lightingSetUp();

    camera.position.set(40, 40, 40);
    camera.lookAt(new THREE.Vector3(0,0,0));

    renderer.render(scene, camera);
}

// It loads major components of the cell object.
function loadObject(){

    var objLoader = new OBJLoader();
    var mtlLoader = new MTLLoader();

    mtlLoader.setPath('./cellModel/');
    mtlLoader.load("CellAnatomy.mtl", function (mtls){

    mtls.preload();

    objLoader.setMaterials(mtls);
    objLoader.setPath("./cellModel/");

    objLoader.load("CellAnatomy.obj", function (obj){

        obj.scale.set(0.5,0.5,0.5);
        obj.name = "cellObject";

    
        scene.add(obj);

        // Stores all of the objects from the scene in an array that will be used later
        // for interactions.
        scene.traverse(function(children){
            cellParts.push(children);
        });

        renderer.render(scene, camera);
        },
        function (xhr){

        if (xhr.lengthComputable) {

            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log( 'cell ' + Math.round( percentComplete, 2 ) + '% downloaded' );

            if (Math.round( percentComplete, 2 ) == 100)
            {
                var test = document.getElementsByClassName("loader")[0];
                test.style.visibility = "hidden";
            }
            
        }
        }, function (){});
    });
}

// Set ups the lighting in the scene.
function lightingSetUp(){

    keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    keyLight.position.set(3, 10, 3).normalize();
    keyLight.name = "Light1";

    fillLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
    fillLight.position.set(0, -5, -1).normalize();
    fillLight.name = "Light2";

    backLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    backLight.position.set(-10, 0, 0).normalize();
    backLight.name = "Light3";

    scene.add(keyLight);
    scene.add(fillLight);
    scene.add(backLight);
}



// Event listener for window resize.
function handleResize(){

    window.addEventListener("resize", function (){

    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;

    renderer.setSize(WIDTH, HEIGHT);
    camera.apsect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();


    renderer.render(scene, camera);
    });
}

// Enables orbital control.
function orbitalControl(){

    cameraControls = new OrbitControls(camera, renderer.domElement);
    cameraControls.addEventListener("change", function(){

    camera.updateProjectionMatrix();
    renderer.render(scene, camera);

    });
}


function animate(){

    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

init();
orbitalControl();
handleResize();
animate();

//document.addEventListener("click", onDocumentMouseDown, false);