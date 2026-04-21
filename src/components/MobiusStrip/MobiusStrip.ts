import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

interface SurfaceSample {
  center: THREE.Vector3;
  normal: THREE.Vector3;
  halfThickness: number;
}

interface ChromeProfile {
  color: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  envMapIntensity: number;
  toneMappingExposure: number;
  iridescence: number;
  iridescenceIOR: number;
  iridescenceThicknessRange: [number, number];
  sheen: number;
  sheenRoughness: number;
  sheenColor: number;
  specularIntensity: number;
  specularColor: number;
  shimmerAmplitude: number;
  shimmerFrequency: number;
}

const LIGHT_CHROME_PROFILE: ChromeProfile = {
  color: 0xc6d0df,
  roughness: 0.2,
  clearcoat: 0.66,
  clearcoatRoughness: 0.09,
  envMapIntensity: 1.25,
  toneMappingExposure: 1.06,
  iridescence: 0.5,
  iridescenceIOR: 1.32,
  iridescenceThicknessRange: [170, 470],
  sheen: 0.17,
  sheenRoughness: 0.48,
  sheenColor: 0xb8cdfd,
  specularIntensity: 0.96,
  specularColor: 0xffffff,
  shimmerAmplitude: 0.085,
  shimmerFrequency: 0.55,
};

const DARK_CHROME_PROFILE: ChromeProfile = {
  color: 0xdbe5f7,
  roughness: 0.14,
  clearcoat: 0.72,
  clearcoatRoughness: 0.07,
  envMapIntensity: 1.42,
  toneMappingExposure: 0.97,
  iridescence: 0.58,
  iridescenceIOR: 1.35,
  iridescenceThicknessRange: [200, 550],
  sheen: 0.22,
  sheenRoughness: 0.4,
  sheenColor: 0xc3ceff,
  specularIntensity: 1,
  specularColor: 0xcfe0ff,
  shimmerAmplitude: 0.11,
  shimmerFrequency: 0.68,
};

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
  private reducedMotionQuery: MediaQueryList;
  private reducedMotionHandler: (event: MediaQueryListEvent) => void;
  private visibilityHandler: () => void;
  private isDisposed = false;
  private isReducedMotion = false;
  private isPageHidden = false;
  private viewportWidth = 0;
  private viewportHeight = 0;
  private motionScale = 1;
  private readonly animationStartTime = performance.now();
  private chromeProfile: ChromeProfile = LIGHT_CHROME_PROFILE;

  private readonly radius = 2.3;
  private readonly stripWidth = 1.05;
  private readonly stripThickness = 0.16;
  private readonly segments = 88;
  private readonly widthSegments = 18;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    const { width: w, height: h } = this.getViewportSize();
    this.viewportWidth = w;
    this.viewportHeight = h;

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
      iridescence: 0.45,
      iridescenceIOR: 1.32,
      iridescenceThicknessRange: [170, 470],
      sheen: 0.16,
      sheenRoughness: 0.48,
      sheenColor: new THREE.Color(0xb8cdfd),
      specularIntensity: 0.95,
      specularColor: new THREE.Color(0xffffff),
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotionHandler = (event: MediaQueryListEvent) => {
      this.isReducedMotion = event.matches;
      this.updateMotionScale();
      this.updateThemeMaterial();
    };
    this.visibilityHandler = () => {
      this.isPageHidden = document.hidden;
      if (!this.isPageHidden) {
        this.updateThemeMaterial();
      }
    };
    this.isReducedMotion = this.reducedMotionQuery.matches;
    this.bindMotionSignals();
    this.updateMotionScale();

    this.updateThemeMaterial();

    this.resizeHandler = () => this.onResize();
    window.addEventListener('resize', this.resizeHandler);
    this.observeThemeChanges();

    this.loadEnvironmentMap();
    this.animate();
  }

  private updateThemeMaterial(): void {
    const isDarkMode = document.documentElement.classList.contains('dark');
    this.chromeProfile = isDarkMode ? DARK_CHROME_PROFILE : LIGHT_CHROME_PROFILE;
    const profile = this.chromeProfile;

    this.material.color.set(profile.color);
    this.material.roughness = profile.roughness;
    this.material.clearcoat = profile.clearcoat;
    this.material.clearcoatRoughness = profile.clearcoatRoughness;
    this.material.envMapIntensity = profile.envMapIntensity;
    this.material.iridescence = profile.iridescence;
    this.material.iridescenceIOR = profile.iridescenceIOR;
    this.material.iridescenceThicknessRange = profile.iridescenceThicknessRange;
    this.material.sheen = profile.sheen;
    this.material.sheenRoughness = profile.sheenRoughness;
    this.material.sheenColor.set(profile.sheenColor);
    this.material.specularIntensity = profile.specularIntensity;
    this.material.specularColor.set(profile.specularColor);

    this.renderer.toneMappingExposure = profile.toneMappingExposure;
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
    const roundedProfile = 0.78 + 0.22 * Math.sqrt(Math.max(0, centerBias));
    const halfThickness = this.stripThickness * roundedProfile;

    return { center, normal, halfThickness };
  }

  private onResize(): void {
    const { width: w, height: h } = this.getViewportSize();
    const widthDelta = Math.abs(w - this.viewportWidth);
    const heightDelta = Math.abs(h - this.viewportHeight);

    // Ignore mobile address-bar collapse/expand resize noise while scrolling.
    if (this.viewportWidth <= 768 && widthDelta < 2 && heightDelta < 120) {
      return;
    }

    this.viewportWidth = w;
    this.viewportHeight = h;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
    this.updateMotionScale();
  }

  private getViewportSize(): { width: number; height: number } {
    const width = document.documentElement.clientWidth || window.innerWidth;
    const height = document.documentElement.clientHeight || window.innerHeight;
    return { width, height };
  }

  private bindMotionSignals(): void {
    this.reducedMotionQuery.addEventListener('change', this.reducedMotionHandler);
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private unbindMotionSignals(): void {
    this.reducedMotionQuery.removeEventListener('change', this.reducedMotionHandler);
    document.removeEventListener('visibilitychange', this.visibilityHandler);
  }

  private updateMotionScale(): void {
    const isNarrowViewport = this.viewportWidth < 768;
    const densityScale = Math.min(window.devicePixelRatio, 1.35) > 1.2 ? 0.92 : 1;
    const viewportScale = isNarrowViewport ? 0.72 : 1;
    this.motionScale = viewportScale * densityScale;
  }

  private applyDynamicChrome(elapsedSeconds: number): void {
    if (this.isReducedMotion || this.isPageHidden) {
      this.material.envMapIntensity = this.chromeProfile.envMapIntensity;
      this.material.iridescence = this.chromeProfile.iridescence;
      return;
    }

    const shimmerWave = Math.sin(elapsedSeconds * this.chromeProfile.shimmerFrequency);
    const shimmer = 1 + shimmerWave * this.chromeProfile.shimmerAmplitude;

    this.material.envMapIntensity = this.chromeProfile.envMapIntensity * shimmer;
    this.material.iridescence = this.chromeProfile.iridescence + shimmerWave * 0.025;
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    if (this.isPageHidden) {
      return;
    }

    const elapsedSeconds = (performance.now() - this.animationStartTime) * 0.001;
    this.applyDynamicChrome(elapsedSeconds);

    const animationScale = this.isReducedMotion ? this.motionScale * 0.3 : this.motionScale;
    this.mesh.rotation.x += (0.00056 + Math.sin(elapsedSeconds * 0.21) * 0.00004) * animationScale;
    this.mesh.rotation.y += (0.00106 + Math.sin(elapsedSeconds * 0.31) * 0.00006) * animationScale;
    this.mesh.rotation.z += (0.0033 + Math.sin(elapsedSeconds * 0.43) * 0.00016) * animationScale;

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.isDisposed = true;

    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.resizeHandler);
    this.themeObserver?.disconnect();
    this.unbindMotionSignals();
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
