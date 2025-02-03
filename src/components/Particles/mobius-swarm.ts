import { $C } from '@/utils';
import * as THREE from 'three';

class MobiusSwarm {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particleSystem: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private positions: Float32Array;
  private particleCount: number;
  private sizes: { width: number; height: number };
  private readonly radius = 2.5;
  private readonly stripWidth = 0.9;

  constructor(canvas: HTMLCanvasElement, initialParticleCount = $C.MIN_PARTICLES) {
    this.particleCount = initialParticleCount;
    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // Initialize scene, camera, renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.1, 1000);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    this.setupRenderer();

    // Initialize particle system
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      sizeAttenuation: true,
    });
    
    this.positions = new Float32Array(this.particleCount * 3);
    this.particleSystem = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particleSystem);

    // Setup
    this.createParticlePositions(this.particleCount);
    this.setupEventListeners();
    this.animate();
  }

  private setupRenderer(): void {
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.sizes.width, this.sizes.height);
  }

  private createParticlePositions(count: number): void {
    this.particleCount = count;
    this.positions = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      const t = (i / this.particleCount) * Math.PI * 2;
      const s = (Math.random() - 0.5) * this.stripWidth;

      const x = (this.radius + s * Math.cos(t / 2)) * Math.cos(t);
      const y = (this.radius + s * Math.cos(t / 2)) * Math.sin(t);
      const z = s * Math.sin(t / 2);

      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;
    }

    this.updateParticleSystem();
  }

  private updateParticleSystem(): void {
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeBoundingSphere();
  }

  private setupEventListeners(): void {
    window.addEventListener("resize", () => {
      this.sizes.width = window.innerWidth;
      this.sizes.height = window.innerHeight;

      this.camera.aspect = this.sizes.width / this.sizes.height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(this.sizes.width, this.sizes.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    const slider = document.getElementById('particle-density-slider');
    slider?.addEventListener('input', (event: Event) => {
      const target = event.target as HTMLInputElement;
      this.createParticlePositions(Number(target.value));
    });
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    this.particleSystem.rotation.x += 0.001;
    this.particleSystem.rotation.y += 0.001;
    this.particleSystem.rotation.z += 0.006;
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize
const canvas = document.querySelector("#webgl") as HTMLCanvasElement;
if (canvas) {
  new MobiusSwarm(canvas);
}
