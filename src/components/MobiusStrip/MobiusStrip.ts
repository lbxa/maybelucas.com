import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

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

interface GeometryDetail {
  cacheKey: string;
  columns: number;
  rows: number;
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
  private static readonly geometryCache = new Map<string, THREE.BufferGeometry>();

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
  private readonly introDurationMs = 1750;
  private readonly introBezier: [number, number, number, number] = [0.22, 0.72, 0.2, 1];
  private readonly introOrbitX = 0.62;
  private readonly introOrbitZ = -0.38;
  private readonly introStartYOffset: number;
  private readonly geometryCacheKey: string;

  private readonly radius = 2.3;
  private readonly stripWidth = 1.05;
  private readonly stripThickness = 0.16;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    const { width: w, height: h } = this.getViewportSize();
    this.viewportWidth = w;
    this.viewportHeight = h;

    this.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 100);
    this.camera.position.z = 5;
    this.introStartYOffset = this.computeIntroStartYOffset();

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

    this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.isReducedMotion = this.reducedMotionQuery.matches;
    const geometryDetail = this.resolveGeometryDetail(this.viewportWidth, window.devicePixelRatio, this.isReducedMotion);
    this.geometryCacheKey = geometryDetail.cacheKey;
    this.geometry = this.getOrCreateGeometry(geometryDetail);

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

  private resolveGeometryDetail(viewportWidth: number, devicePixelRatio: number, prefersReducedMotion: boolean): GeometryDetail {
    if (viewportWidth < 640) {
      if (prefersReducedMotion) {
        return { cacheKey: 'mobile-compact-reduced', columns: 44, rows: 9 };
      }
      return { cacheKey: 'mobile-compact', columns: 48, rows: 10 };
    }

    if (viewportWidth < 900 || devicePixelRatio > 1.8) {
      if (prefersReducedMotion) {
        return { cacheKey: 'mobile-balanced-reduced', columns: 52, rows: 11 };
      }
      return { cacheKey: 'mobile-balanced', columns: 56, rows: 12 };
    }

    if (prefersReducedMotion) {
      return { cacheKey: 'desktop-reduced', columns: 72, rows: 15 };
    }

    return { cacheKey: 'desktop-full', columns: 88, rows: 18 };
  }

  private getOrCreateGeometry(detail: GeometryDetail): THREE.BufferGeometry {
    const cached = MobiusStrip.geometryCache.get(detail.cacheKey);
    if (cached) {
      return cached;
    }

    const geometry = this.buildGeometry(detail.columns, detail.rows);
    MobiusStrip.geometryCache.set(detail.cacheKey, geometry);
    return geometry;
  }

  private buildGeometry(cols: number, rows: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const rowStride = rows + 1;
    const vertexCountPerSide = (cols + 1) * rowStride;
    const totalVertexCount = vertexCountPerSide * 2;
    const positions = new Float32Array(totalVertexCount * 3);
    const tau = Math.PI * 2;

    for (let i = 0; i <= cols; i++) {
      const t = (i / cols) * tau;
      const halfT = t * 0.5;
      const sinT = Math.sin(t);
      const cosT = Math.cos(t);
      const sinHalfT = Math.sin(halfT);
      const cosHalfT = Math.cos(halfT);

      for (let j = 0; j <= rows; j++) {
        const widthT = j / rows;
        const s = (widthT - 0.5) * this.stripWidth;
        const radiusComponent = this.radius + s * cosHalfT;

        const centerX = radiusComponent * cosT;
        const centerY = radiusComponent * sinT;
        const centerZ = s * sinHalfT;

        const duX = (-0.5 * s * sinHalfT * cosT) - (radiusComponent * sinT);
        const duY = (-0.5 * s * sinHalfT * sinT) + (radiusComponent * cosT);
        const duZ = 0.5 * s * cosHalfT;

        const dvX = cosHalfT * cosT;
        const dvY = cosHalfT * sinT;
        const dvZ = sinHalfT;

        const crossX = duY * dvZ - duZ * dvY;
        const crossY = duZ * dvX - duX * dvZ;
        const crossZ = duX * dvY - duY * dvX;
        const crossLength = Math.sqrt((crossX * crossX) + (crossY * crossY) + (crossZ * crossZ));
        const normalScale = crossLength > 1e-8 ? 1 / crossLength : 0;

        const normalX = crossX * normalScale;
        const normalY = crossY * normalScale;
        const normalZ = crossZ * normalScale;

        const centerBias = 1 - Math.abs(widthT - 0.5) * 2;
        const roundedProfile = 0.78 + 0.22 * Math.sqrt(Math.max(0, centerBias));
        const halfThickness = this.stripThickness * roundedProfile;

        const frontVertexIndex = i * rowStride + j;
        const backVertexIndex = frontVertexIndex + vertexCountPerSide;
        const frontOffset = frontVertexIndex * 3;
        const backOffset = backVertexIndex * 3;

        positions[frontOffset] = centerX + normalX * halfThickness;
        positions[frontOffset + 1] = centerY + normalY * halfThickness;
        positions[frontOffset + 2] = centerZ + normalZ * halfThickness;

        positions[backOffset] = centerX - normalX * halfThickness;
        positions[backOffset + 1] = centerY - normalY * halfThickness;
        positions[backOffset + 2] = centerZ - normalZ * halfThickness;
      }
    }

    const frontOffset = 0;
    const backOffset = vertexCountPerSide;

    const frontIndex = (i: number, j: number) => frontOffset + i * rowStride + j;
    const backIndex = (i: number, j: number) => backOffset + i * rowStride + j;
    const shellQuadCount = cols * rows;
    const boundaryLength = 2 * (cols + 1);
    const shellIndexCount = shellQuadCount * 12;
    const boundaryIndexCount = (boundaryLength - 1) * 6;
    const indices = new Uint16Array(shellIndexCount + boundaryIndexCount);
    let indexCursor = 0;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const a = frontIndex(i, j);
        const b = frontIndex(i + 1, j);
        const c = frontIndex(i, j + 1);
        const d = frontIndex(i + 1, j + 1);
        indices[indexCursor++] = a;
        indices[indexCursor++] = b;
        indices[indexCursor++] = c;
        indices[indexCursor++] = c;
        indices[indexCursor++] = b;
        indices[indexCursor++] = d;

        const ba = backIndex(i, j);
        const bb = backIndex(i + 1, j);
        const bc = backIndex(i, j + 1);
        const bd = backIndex(i + 1, j + 1);
        indices[indexCursor++] = ba;
        indices[indexCursor++] = bc;
        indices[indexCursor++] = bb;
        indices[indexCursor++] = bc;
        indices[indexCursor++] = bd;
        indices[indexCursor++] = bb;
      }
    }

    for (let k = 0; k < boundaryLength - 1; k++) {
      const currentI = k <= cols ? k : k - (cols + 1);
      const currentJ = k <= cols ? 0 : rows;
      const nextK = k + 1;
      const nextI = nextK <= cols ? nextK : nextK - (cols + 1);
      const nextJ = nextK <= cols ? 0 : rows;

      const fa = frontIndex(currentI, currentJ);
      const fb = frontIndex(nextI, nextJ);
      const ba = backIndex(currentI, currentJ);
      const bb = backIndex(nextI, nextJ);

      indices[indexCursor++] = fa;
      indices[indexCursor++] = ba;
      indices[indexCursor++] = fb;
      indices[indexCursor++] = fb;
      indices[indexCursor++] = ba;
      indices[indexCursor++] = bb;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    return geometry;
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

  private computeIntroStartYOffset(): number {
    const halfVerticalFovRad = THREE.MathUtils.degToRad(this.camera.fov * 0.5);
    const halfVisibleHeight = Math.tan(halfVerticalFovRad) * this.camera.position.z;
    const stripHalfExtent = this.radius + this.stripWidth * 0.5 + this.stripThickness;
    return -(halfVisibleHeight + stripHalfExtent + 0.75);
  }

  private sampleCubicBezier(controlPoint1: number, controlPoint2: number, t: number): number {
    const oneMinusT = 1 - t;
    return (3 * oneMinusT * oneMinusT * t * controlPoint1) + (3 * oneMinusT * t * t * controlPoint2) + (t * t * t);
  }

  private sampleCubicBezierDerivative(controlPoint1: number, controlPoint2: number, t: number): number {
    const oneMinusT = 1 - t;
    return (3 * oneMinusT * oneMinusT * controlPoint1) + (6 * oneMinusT * t * (controlPoint2 - controlPoint1)) + (3 * t * t * (1 - controlPoint2));
  }

  private evaluateCubicBezier(progress: number, p1x: number, p1y: number, p2x: number, p2y: number): number {
    const clamped = THREE.MathUtils.clamp(progress, 0, 1);
    if (clamped === 0 || clamped === 1) {
      return clamped;
    }

    let t = clamped;
    for (let i = 0; i < 5; i++) {
      const xEstimate = this.sampleCubicBezier(p1x, p2x, t) - clamped;
      const slope = this.sampleCubicBezierDerivative(p1x, p2x, t);
      if (Math.abs(slope) < 1e-6) {
        break;
      }
      t -= xEstimate / slope;
      t = THREE.MathUtils.clamp(t, 0, 1);
    }

    let lower = 0;
    let upper = 1;
    for (let i = 0; i < 8; i++) {
      const xEstimate = this.sampleCubicBezier(p1x, p2x, t);
      if (xEstimate < clamped) {
        lower = t;
      } else {
        upper = t;
      }
      t = (lower + upper) * 0.5;
    }

    return this.sampleCubicBezier(p1y, p2y, t);
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

    const elapsedMs = performance.now() - this.animationStartTime;
    const elapsedSeconds = elapsedMs * 0.001;
    this.applyDynamicChrome(elapsedSeconds);

    const animationScale = this.isReducedMotion ? this.motionScale * 0.3 : this.motionScale;
    if (this.isReducedMotion) {
      this.mesh.position.set(0, 0, 0);
    } else {
      const linearIntroProgress = Math.min(elapsedMs / this.introDurationMs, 1);
      const [p1x, p1y, p2x, p2y] = this.introBezier;
      const easedIntroProgress = this.evaluateCubicBezier(linearIntroProgress, p1x, p1y, p2x, p2y);
      const introRemaining = 1 - easedIntroProgress;
      const orbitalArc = Math.sin(easedIntroProgress * Math.PI);
      const orbitalSway = Math.sin(easedIntroProgress * Math.PI * 2);

      this.mesh.position.set(
        (this.introOrbitX * orbitalArc) + (this.introOrbitX * 0.2 * orbitalSway),
        this.introStartYOffset * introRemaining,
        (this.introOrbitZ * orbitalArc) - (this.introOrbitZ * 0.2 * orbitalSway),
      );

      const introSpinScale = introRemaining * introRemaining;
      this.mesh.rotation.x += 0.0007 * introSpinScale * animationScale;
      this.mesh.rotation.z += 0.0009 * introSpinScale * animationScale;
    }

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

    const cachedGeometry = MobiusStrip.geometryCache.get(this.geometryCacheKey);
    if (cachedGeometry !== this.geometry) {
      this.geometry.dispose();
    }
    this.material.dispose();
    this.renderer.dispose();
  }
}
