import { $C } from '@/utils';
import * as THREE from 'three';

interface LoadingCallbacks {
  onLoadingStart?: () => void;
  onLoadingProgress?: (progress: number) => void;
  onLoadingComplete?: () => void;
}

class MobiusSwarm {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private particleSystem!: THREE.Points;
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.PointsMaterial;
  private positions!: Float32Array;
  private particleCount!: number;
  private sizes!: { width: number; height: number };
  private readonly radius = 2.5;
  private readonly stripWidth = 0.9;
  
  // Loading state properties
  private isLoading: boolean = true;
  private loadingCallbacks: LoadingCallbacks = {};

  constructor(canvas: HTMLCanvasElement, initialParticleCount = $C.MIN_PARTICLES, callbacks?: LoadingCallbacks) {
    this.loadingCallbacks = callbacks || {};
    this.emitLoadingStart();
    
    this.particleCount = initialParticleCount;
    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // Initialize scene, camera, renderer
    this.emitLoadingProgress(10);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.1, 1000);
    this.camera.position.z = 5;

    this.emitLoadingProgress(30);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    this.setupRenderer();

    // Initialize particle system
    this.emitLoadingProgress(50);
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      sizeAttenuation: true,
    });
    
    this.emitLoadingProgress(70);
    this.positions = new Float32Array(this.particleCount * 3);
    this.particleSystem = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particleSystem);

    // Setup
    this.emitLoadingProgress(85);
    this.createParticlePositions(this.particleCount);
    this.setupEventListeners();
    
    this.emitLoadingProgress(95);
    
    // Use requestAnimationFrame to ensure first render before marking as loaded
    requestAnimationFrame(() => {
      this.emitLoadingProgress(100);
      this.finishLoading();
      this.animate();
    });
  }

  private emitLoadingStart(): void {
    this.loadingCallbacks.onLoadingStart?.();
  }

  private emitLoadingProgress(progress: number): void {
    this.loadingCallbacks.onLoadingProgress?.(progress);
  }

  private finishLoading(): void {
    this.isLoading = false;
    this.loadingCallbacks.onLoadingComplete?.();
  }

  public getLoadingState(): boolean {
    return this.isLoading;
  }

  public setLoadingCallbacks(callbacks: LoadingCallbacks): void {
    this.loadingCallbacks = { ...this.loadingCallbacks, ...callbacks };
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

// Initialize with loading callbacks
const canvas = document.querySelector("#webgl") as HTMLCanvasElement;
if (canvas) {
  // Optional: Add loading UI elements
  const loadingElement = document.createElement('div');
  loadingElement.id = 'particle-loading';
  loadingElement.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 100;
      color: #f5f5f5;
      font-family: ui-monospace, monospace;
      text-align: center;
      pointer-events: none;
      background: rgba(18, 18, 18, 0.8);
      backdrop-filter: blur(8px);
      padding: 24px 32px;
      border-radius: 16px;
      border: 1px solid rgba(245, 245, 245, 0.1);
    ">
      <div id="loading-text" style="font-size: 16px; margin-bottom: 12px;">Loading Particles</div>
      <div id="loading-progress" style="font-size: 12px; color: #888;">0%</div>
      <div style="
        width: 200px;
        height: 2px;
        background: rgba(245, 245, 245, 0.1);
        border-radius: 1px;
        margin: 12px auto 0;
        overflow: hidden;
      ">
        <div id="loading-bar" style="
          height: 100%;
          background: #f5f5f5;
          width: 0%;
          transition: width 0.3s ease;
        "></div>
      </div>
    </div>
  `;
  document.body.appendChild(loadingElement);

  const loadingText = document.getElementById('loading-text');
  const loadingProgress = document.getElementById('loading-progress');
  const loadingBar = document.getElementById('loading-bar');

  new MobiusSwarm(canvas, $C.MIN_PARTICLES, {
    onLoadingStart: () => {
      console.log('🌌 Mobius particle system loading started');
      if (loadingElement) loadingElement.style.display = 'block';
    },
    onLoadingProgress: (progress: number) => {
      console.log(`🔄 Loading progress: ${progress}%`);
      if (loadingProgress) loadingProgress.textContent = `${progress}%`;
      if (loadingBar) loadingBar.style.width = `${progress}%`;
    },
    onLoadingComplete: () => {
      console.log('✨ Mobius particle system loaded successfully');
      if (loadingElement) {
        // Small delay to show 100% completion
        setTimeout(() => {
          loadingElement.style.opacity = '0';
          loadingElement.style.transition = 'opacity 0.5s ease-out';
          setTimeout(() => {
            loadingElement.remove();
          }, 500);
        }, 300);
      }
    }
  });
}
