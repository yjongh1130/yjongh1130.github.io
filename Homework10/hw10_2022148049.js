// 05-both-cameras.js
// - PerspectiveCamera vs OrthographicCamera
// - OrbitControl change when camera changes

import * as THREE from 'three';  
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const scene = new THREE.Scene();

// Camera를 perspective와 orthographic 두 가지로 switching 해야 해서 const가 아닌 let으로 선언
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 120;
camera.position.y = 60;
camera.position.z = 180;
camera.lookAt(scene.position);
scene.add(camera);

const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(new THREE.Color(0x000000));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const stats = new Stats();
document.body.appendChild(stats.dom);

// Camera가 바뀔 때 orbitControls도 바뀌어야 해서 let으로 선언
let orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

const sunGeometry = new THREE.SphereGeometry(10);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

const mercuryGeometry = new THREE.SphereGeometry(1.5);
const mercuryMaterial = new THREE.MeshBasicMaterial({ color: 0xa6a6a6 });
const mercuryTexture = new THREE.TextureLoader().load('Mercury.jpg');
mercuryMaterial.map = mercuryTexture;
const mercury = new THREE.Mesh(mercuryGeometry, mercuryMaterial);
mercury.position.set(20, 0, 20);
scene.add(mercury);

const venusGeometry = new THREE.SphereGeometry(3);
const venusMaterial = new THREE.MeshBasicMaterial({ color: 0xe39e1c });
const venusTexture = new THREE.TextureLoader().load('Venus.jpg');
venusMaterial.map = venusTexture;
const venus = new THREE.Mesh(venusGeometry, venusMaterial);
venus.position.set(35, 0, 35);
scene.add(venus);

const earthGeometry = new THREE.SphereGeometry(3.5);
const earthMaterial = new THREE.MeshBasicMaterial({ color: 0x3498db });
const earthTexture = new THREE.TextureLoader().load('Earth.jpg');
earthMaterial.map = earthTexture;
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.position.set(50, 0, 50);
scene.add(earth);

const marsGeometry = new THREE.SphereGeometry(2.5);
const marsMaterial = new THREE.MeshBasicMaterial({ color: 0xc0392b });
const marsTexture = new THREE.TextureLoader().load('Mars.jpg');
marsMaterial.map = marsTexture;
const mars = new THREE.Mesh(marsGeometry, marsMaterial);
mars.position.set(65, 0, 65);
scene.add(mars);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
directionalLight.position.set(-20, 40, 60);
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x292929);
scene.add(ambientLight);

let step = 0;

// GUI
const gui = new GUI();
const folder1 = gui.addFolder('Camera');
const folder1Params = {
    perspective : "Perspective",
    "Switch Camera Type": function () {
        if (camera instanceof THREE.PerspectiveCamera) {
            scene.remove(camera);
            camera = null; // 기존의 camera 제거    
            // OrthographicCamera(left, right, top, bottom, near, far)
            camera = new THREE.OrthographicCamera(window.innerWidth / -16, 
                window.innerWidth / 16, window.innerHeight / 16, window.innerHeight / -16, -200, 500);
            camera.position.x = 120;
            camera.position.y = 60;
            camera.position.z = 180;
            camera.lookAt(scene.position);
            orbitControls.dispose(); // 기존의 orbitControls 제거
            orbitControls = null;
            orbitControls = new OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            this.perspective = "Orthographic";
        } else {
            scene.remove(camera);
            camera = null; 
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.x = 120;
            camera.position.y = 60;
            camera.position.z = 180;
            camera.lookAt(scene.position);
            orbitControls.dispose(); // 기존의 orbitControls 제거
            orbitControls = null;
            orbitControls = new OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            this.perspective = "Perspective";
        }
    }
};
folder1.add(folder1Params, 'Switch Camera Type');
folder1.add(folder1Params, 'perspective').listen();

const folder2 = gui.addFolder('Mercury');
const folder2Params = {
    "Rotation Speed": 0.02,
    "Orbit Speed": 0.02
};
folder2.add(folder2Params, 'Rotation Speed', 0, 0.1);
folder2.add(folder2Params, 'Orbit Speed', 0, 0.1);

const folder3 = gui.addFolder('Venus');
const folder3Params = {
    "Rotation Speed": 0.015,
    "Orbit Speed": 0.015
};
folder3.add(folder3Params, 'Rotation Speed', 0, 0.1);
folder3.add(folder3Params, 'Orbit Speed', 0, 0.1);

const folder4 = gui.addFolder('Earth');
const folder4Params = {
    "Rotation Speed": 0.01,
    "Orbit Speed": 0.01
};
folder4.add(folder4Params, 'Rotation Speed', 0, 0.1);
folder4.add(folder4Params, 'Orbit Speed', 0, 0.1);

const folder5 = gui.addFolder('Mars');
const folder5Params = {
    "Rotation Speed": 0.008,
    "Orbit Speed": 0.008
};
folder5.add(folder5Params, 'Rotation Speed', 0, 0.1);
folder5.add(folder5Params, 'Orbit Speed', 0, 0.1);

let mercuryangle = 0;
let venusangle = 0;
let earthangle = 0;
let marsangle = 0;

//const clock = new THREE.Clock();

render();

function render() {
    orbitControls.update();
    stats.update();

    mercury.rotation.y += folder2Params["Rotation Speed"];
    venus.rotation.y += folder3Params["Rotation Speed"];
    earth.rotation.y += folder4Params["Rotation Speed"];
    mars.rotation.y += folder5Params["Rotation Speed"];

    mercuryangle += folder2Params["Orbit Speed"];
    venusangle += folder3Params["Orbit Speed"];
    earthangle += folder4Params["Orbit Speed"];
    marsangle += folder5Params["Orbit Speed"];

    mercury.position.x = 20 * Math.cos(mercuryangle);
    mercury.position.z = 20 * Math.sin(mercuryangle);
    
    venus.position.x = 35 * Math.cos(venusangle);
    venus.position.z = 35 * Math.sin(venusangle);

    earth.position.x = 50 * Math.cos(earthangle);
    earth.position.z = 50 * Math.sin(earthangle);

    mars.position.x = 65 * Math.cos(marsangle);
    mars.position.z = 65 * Math.sin(marsangle);

    // render using requestAnimationFrame
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
