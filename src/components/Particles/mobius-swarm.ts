import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

/** -----------------------------------------------------------------
 *  (B) Sizing
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/** -----------------------------------------------------------------
 *  (1) Geometries
 */
let particleCount = 1000; 
let positions = new Float32Array(particleCount * 3); 

const radius = 2.5; 
const stripWidth = 0.9;

const geometry = new THREE.BufferGeometry();
const material = new THREE.PointsMaterial({
  color: 0xffffff, 
  size: 0.05, 
  sizeAttenuation: true, // Make particle size relative to distance
});

let particleSystem = new THREE.Points(geometry, material);
scene.add(particleSystem);

function createParticlePositions(count: number) {
  particleCount = count;
  positions = new Float32Array(particleCount * 3); 

  for (let i = 0; i < particleCount; i++) {
    // Parameter along the Möbius strip
    const t = (i / particleCount) * Math.PI * 2; 
    const s = (Math.random() - 0.5) * stripWidth; 

    // Möbius strip parametric equations
    const x = (radius + s * Math.cos(t / 2)) * Math.cos(t);
    const y = (radius + s * Math.cos(t / 2)) * Math.sin(t);
    const z = s * Math.sin(t / 2);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  updateParticleSystem();
}

function updateParticleSystem() {
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.attributes.position.needsUpdate = true;
  geometry.computeBoundingSphere();
}

createParticlePositions(particleCount);

/** -----------------------------------------------------------------
 *  (2) Rendering
 */
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#webgl")!,
  alpha: true,
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

function animate() {
  requestAnimationFrame(animate);
  particleSystem.rotation.x += 0.005; // Rotate around X-axis
  particleSystem.rotation.y += 0.005; // Rotate around Y-axis
  particleSystem.rotation.z += 0.008; // Rotate around Z-axis for slant
  renderer.render(scene, camera);
}

animate();

/** -----------------------------------------------------------------
 *  (3) Event Listener for Input
 */
const slider = document.getElementById('particle-density-slider');
slider?.addEventListener('input', (event: Event) => {
  const target = event.target as HTMLInputElement;
  createParticlePositions(Number(target.value)); 
});
