import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

interface SurfaceSample {
  center: THREE.Vector3;
  normal: THREE.Vector3;
  halfThickness: number;
}

export class MobiusStrip {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private mesh: THREE.Mesh;
  private geometry: THREE.BufferGeometry;
  private material: THREE.MeshPhysicalMaterial;
  private animationId: number = 0;
  private resizeHandler: () => void;
  private themeObserver: MutationObserver | null = null;
  private pmremTarget: THREE.WebGLRenderTarget | null = null;
  private sourceEnvironmentTexture: THREE.DataTexture | null = null;
  private isDisposed = false;

  private readonly radius = 2.3;
  private readonly stripWidth = 1.05;
  private readonly stripThickness = 0.16;
  private readonly segments = 88;
  private readonly widthSegments = 18;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    const w = window.innerWidth;
    const h = window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 100);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
    this.renderer.setSize(w, h);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;

    this.geometry = this.buildGeometry();
    this.material = new THREE.MeshPhysicalMaterial({
      color: 0x6f7885,
      side: THREE.DoubleSide,
      metalness: 1.0,
      roughness: 0.24,
      clearcoat: 0.55,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.15,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    this.updateThemeMaterial();

    this.resizeHandler = () => this.onResize();
    window.addEventListener('resize', this.resizeHandler);
    this.observeThemeChanges();

    this.loadEnvironmentMap();
    this.animate();
  }

  private updateThemeMaterial(): void {
    const isDarkMode = document.documentElement.classList.contains('dark');

    // Keep dark mode crisp, while making light mode brighter and less muddy.
    this.material.color.set(isDarkMode ? 0xd8deea : 0xc4ccd8);
    this.material.roughness = isDarkMode ? 0.16 : 0.22;
    this.material.clearcoat = isDarkMode ? 0.62 : 0.58;
    this.material.clearcoatRoughness = isDarkMode ? 0.08 : 0.1;
    this.material.envMapIntensity = isDarkMode ? 1.35 : 1.2;

    this.renderer.toneMappingExposure = isDarkMode ? 0.98 : 1.08;
  }

  private observeThemeChanges(): void {
    this.themeObserver = new MutationObserver(() => this.updateThemeMaterial());
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  private async loadEnvironmentMap(): Promise<void> {
    const loader = new RGBELoader();

    try {
      const hdrTexture = await loader.loadAsync('/textures/studio_small_03_1k.hdr');

      if (this.isDisposed) {
        hdrTexture.dispose();
        return;
      }

      hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
      this.sourceEnvironmentTexture = hdrTexture;

      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      pmremGenerator.compileEquirectangularShader();
      this.pmremTarget = pmremGenerator.fromEquirectangular(hdrTexture);
      pmremGenerator.dispose();

      this.scene.environment = this.pmremTarget.texture;
      this.updateThemeMaterial();
    } catch {
      // Keep rendering without IBL if the HDR fails to load.
    }
  }

  private buildGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const indices: number[] = [];

    const cols = this.segments;
    const rows = this.widthSegments;
    const rowStride = rows + 1;

    const frontVertices: THREE.Vector3[] = [];
    const backVertices: THREE.Vector3[] = [];

    for (let i = 0; i <= cols; i++) {
      const t = (i / cols) * Math.PI * 2;

      for (let j = 0; j <= rows; j++) {
        const widthT = j / rows;
        const sample = this.sampleSurface(t, widthT);

        frontVertices.push(sample.center.clone().addScaledVector(sample.normal, sample.halfThickness));
        backVertices.push(sample.center.clone().addScaledVector(sample.normal, -sample.halfThickness));
      }
    }

    for (const v of frontVertices) {
      positions.push(v.x, v.y, v.z);
    }

    for (const v of backVertices) {
      positions.push(v.x, v.y, v.z);
    }

    const frontOffset = 0;
    const backOffset = frontVertices.length;

    const frontIndex = (i: number, j: number) => frontOffset + i * rowStride + j;
    const backIndex = (i: number, j: number) => backOffset + i * rowStride + j;

    // Front and back shells.
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const a = frontIndex(i, j);
        const b = frontIndex(i + 1, j);
        const c = frontIndex(i, j + 1);
        const d = frontIndex(i + 1, j + 1);
        indices.push(a, b, c);
        indices.push(c, b, d);

        const ba = backIndex(i, j);
        const bb = backIndex(i + 1, j);
        const bc = backIndex(i, j + 1);
        const bd = backIndex(i + 1, j + 1);
        indices.push(ba, bc, bb);
        indices.push(bc, bd, bb);
      }
    }

    // Boundary wall to make the strip physically thick.
    const boundary: Array<{ i: number; j: number }> = [];
    for (let i = 0; i <= cols; i++) {
      boundary.push({ i, j: 0 });
    }
    for (let i = 0; i <= cols; i++) {
      boundary.push({ i, j: rows });
    }

    for (let k = 0; k < boundary.length - 1; k++) {
      const current = boundary[k];
      const next = boundary[k + 1];

      const fa = frontIndex(current.i, current.j);
      const fb = frontIndex(next.i, next.j);
      const ba = backIndex(current.i, current.j);
      const bb = backIndex(next.i, next.j);

      indices.push(fa, ba, fb);
      indices.push(fb, ba, bb);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    return geometry;
  }

  private sampleSurface(t: number, widthT: number): SurfaceSample {
    const s = (widthT - 0.5) * this.stripWidth;
    const center = new THREE.Vector3(
      (this.radius + s * Math.cos(t / 2)) * Math.cos(t),
      (this.radius + s * Math.cos(t / 2)) * Math.sin(t),
      s * Math.sin(t / 2),
    );

    const du = new THREE.Vector3(
      -0.5 * s * Math.sin(t / 2) * Math.cos(t) - (this.radius + s * Math.cos(t / 2)) * Math.sin(t),
      -0.5 * s * Math.sin(t / 2) * Math.sin(t) + (this.radius + s * Math.cos(t / 2)) * Math.cos(t),
      0.5 * s * Math.cos(t / 2),
    );

    const dv = new THREE.Vector3(
      Math.cos(t / 2) * Math.cos(t),
      Math.cos(t / 2) * Math.sin(t),
      Math.sin(t / 2),
    );

    const normal = new THREE.Vector3().crossVectors(du, dv).normalize();

    const centerBias = 1 - Math.abs(widthT - 0.5) * 2;
    const roundedProfile = 0.56 + 0.44 * Math.max(0, centerBias);
    const halfThickness = this.stripThickness * roundedProfile;

    return { center, normal, halfThickness };
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    this.mesh.rotation.x += 0.0008;
    this.mesh.rotation.y += 0.0012;
    this.mesh.rotation.z += 0.004;

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.isDisposed = true;

    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.resizeHandler);
    this.themeObserver?.disconnect();
    this.themeObserver = null;

    this.scene.environment = null;
    this.pmremTarget?.dispose();
    this.pmremTarget = null;

    this.sourceEnvironmentTexture?.dispose();
    this.sourceEnvironmentTexture = null;

    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }
}
