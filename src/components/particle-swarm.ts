import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  canvas: document.querySelector("#webgl")!,
  alpha: true,
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);

// Particle setup
const particleCount = 1000; 
const positions = new Float32Array(particleCount * 3); 

const radius = 2; 
const stripWidth = 0.9

for (let i = 0; i < particleCount; i++) {
  const t = i / particleCount * Math.PI * 2; // Parameter along the Möbius strip
  const s = (Math.random() - 0.5) * stripWidth; 

  // Möbius strip parametric equations
  const x = (radius + s * Math.cos(t / 2)) * Math.cos(t);
  const y = (radius + s * Math.cos(t / 2)) * Math.sin(t);
  const z = s * Math.sin(t / 2);

  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
  color: 0xffffff, 
  size: 0.05, 
  sizeAttenuation: true, // Make particle size relative to distance
});

const particleSystem = new THREE.Points(geometry, material);
scene.add(particleSystem);

function animate() {
  requestAnimationFrame(animate);
  particleSystem.rotation.x += 0.01; // Rotate around X-axis
  particleSystem.rotation.y += 0.01; // Rotate around Y-axis
  particleSystem.rotation.z += 0.005; // Rotate around Z-axis for slant
  renderer.render(scene, camera);
}

animate();
