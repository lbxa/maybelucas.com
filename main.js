import "./style.css";
import "./index.css";

import * as THREE from "three";

// DEBUG
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// import * as dat from "dat.gui";
// const gui = new dat.GUI();

/** -----------------------------------------------------------------
 *  (A) Presets
 */

const scene = new THREE.Scene();
const group = new THREE.Group();
scene.add(group);

const textureLoader = new THREE.TextureLoader();
const particleTexture = textureLoader.load("/img/particle.png");

/** -----------------------------------------------------------------
 *  (B) Sizing
 */

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/** -----------------------------------------------------------------
 *  (1) Geometries
 */

const geometry = new THREE.SphereBufferGeometry(0.5, 64, 64);
// const material = new THREE.MeshStandardMaterial({
//   color: 0x292929,
//   roughness: 0.25,
//   metalness: 0.5,
// });

// const material = new THREE.MeshPhongMaterial({
//   shininess: 100,
//   color: 0x292929,
//   specular: 0xffffff,
//   transparent: true,
//   side: THREE.BackSide,
//   blending: THREE.AdditiveBlending,
//   depthWrite: false,
// });

const material = new THREE.PointsMaterial({
  size: 0.000001,
});

const sphere = new THREE.Points(geometry, material);
sphere.castShadow = true;
sphere.receiveShadow = true;
group.add(sphere);

const addParticle = () => {
  const geometry = new THREE.SphereGeometry(0.05, 24, 24);
  // const material = new THREE.MeshStandardMaterial({
  //   color: 0xffffff,
  //   roughness: 0.25,
  //   metalness: 0.5,
  //   emissive: 1,
  // });

  const material = new THREE.MeshPhongMaterial({
    shininess: 100,
    color: 0x393939,
    specular: 0xffffff,
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    map: particleTexture,
    depthWrite: false,
  });

  const particle = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(100));

  particle.position.set(x, y, z);
  particle.castShadow = true;
  particle.receiveShadow = true;
  group.add(particle);
};

Array(4000).fill().forEach(addParticle);

/** -----------------------------------------------------------------
 *  (2) Lights
 */

const pointLight = new THREE.PointLight(0xffffff, 0.1);

pointLight.intensity = 1.48;

group.add(pointLight);

// GUI CONTROLS (DEBUG) ------------------------------------
// const light1 = gui.addFolder("Light 1");

// light1.add(pointLight.position, "x").min(-6).max(6).step(0.01);
// light1.add(pointLight.position, "y").min(-6).max(6).step(0.01);
// light1.add(pointLight.position, "z").min(-6).max(6).step(0.01);
// light1.add(pointLight, "intensity").min(0).max(10).step(0.01);

// const light1Helper = new THREE.PointLightHelper(pointLight, 1);
// group.add(light1Helper);

// const gridHelper = new THREE.GridHelper(200, 50);
// scene.add(gridHelper);

/** -----------------------------------------------------------------
 *  (3) Camera
 */

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 2;
scene.add(camera);

/** -----------------------------------------------------------------
 *  (4) Rendering
 */
let mouseX = 0;
let mouseY = 0;

let targetX = 0;
let targetY = 0;

document.addEventListener("scroll", (e) => {
  // camera.position.y = window.scrollY * 0.0009;
  group.position.z = window.scrollY * 0.001;
});

document.addEventListener("mousemove", (e) => {
  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;

  mouseX = e.clientX - windowHalfX;
  mouseY = e.clientY - windowHalfY;
});

const clock = new THREE.Clock();
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#webgl"),
  alpha: true,
  antialias: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// const controls = new OrbitControls(camera, renderer.domElement);

const animate = () => {
  targetX = mouseX * 0.001;
  targetY = mouseY * 0.001;

  const elapsedTime = clock.getElapsedTime();
  const factor = 0.8 * elapsedTime;

  // Update objects for elliptical orbit using parametric conic sections
  const a = 10;
  const b = 4;
  pointLight.position.x = a * Math.cos(factor);
  pointLight.position.z = b * Math.sin(factor);

  group.rotation.y = -factor * 0.05;

  group.rotation.y += 0.5 * (targetX - group.rotation.y);
  group.rotation.x += 0.05 * (targetY - group.rotation.x);
  group.position.z += -0.05 * (targetY - group.rotation.x);

  // Update Orbital Controls
  // controls.update();

  // Render
  renderer.render(scene, camera);

  // Call animate again on the next frame
  window.requestAnimationFrame(animate);
};

animate();
