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

interface MobiusStripOptions {
  interactive?: boolean;
  inline?: boolean;
}

export type PlaygroundColorTheme = 'default' | 'cool' | 'violet';

export interface PlaygroundSettings {
  roughness?: number;
  clearcoat?: number;
  envMapIntensity?: number;
  iridescence?: number;
  colorTheme?: PlaygroundColorTheme;
  exposure?: number;
  shimmerAmplitude?: number;
  shimmerFrequency?: number;
  tintTemperature?: number;
  highContrast?: boolean;
}

interface PlaygroundColorProfile {
  color: number;
  sheenColor: number;
  specularColor: number;
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

const PLAYGROUND_COLOR_PROFILES: Record<'cool' | 'violet', PlaygroundColorProfile> = {
  cool: {
    color: 0xc2d9ff,
    sheenColor: 0xbcdcff,
    specularColor: 0xdeecff,
  },
  violet: {
    color: 0xd6c5ff,
    sheenColor: 0xcbb1ff,
    specularColor: 0xe3d8ff,
  },
};

export class MobiusStrip {
  private static readonly geometryCache = new Map<string, THREE.BufferGeometry>();

  private readonly canvas: HTMLCanvasElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private mesh: THREE.Mesh;
  private geometry: THREE.BufferGeometry;
  private material: THREE.MeshPhysicalMaterial;
  private animationId: number = 0;
  private resizeHandler: () => void;
  private resizeObserver: ResizeObserver | null = null;
  private viewportObserver: IntersectionObserver | null = null;
  private themeObserver: MutationObserver | null = null;
  private pmremTarget: THREE.WebGLRenderTarget | null = null;
  private sourceEnvironmentTexture: THREE.DataTexture | null = null;
  private reducedMotionQuery: MediaQueryList;
  private reducedMotionHandler: (event: MediaQueryListEvent) => void;
  private visibilityHandler: () => void;
  private isDisposed = false;
  private isReducedMotion = false;
  private isPageHidden = false;
  private isInViewport = true;
  private viewportWidth = 0;
  private viewportHeight = 0;
  private motionScale = 1;
  private readonly animationStartTime = performance.now();
  private chromeProfile: ChromeProfile = LIGHT_CHROME_PROFILE;
  private readonly geometryCacheKey: string;
  private readonly isInteractive: boolean;
  private readonly isInline: boolean;
  private playgroundSettings: PlaygroundSettings = {};
  private dynamicEnvMapBase = LIGHT_CHROME_PROFILE.envMapIntensity;
  private dynamicIridescenceBase = LIGHT_CHROME_PROFILE.iridescence;
  private dynamicShimmerAmplitude = LIGHT_CHROME_PROFILE.shimmerAmplitude;
  private dynamicShimmerFrequency = LIGHT_CHROME_PROFILE.shimmerFrequency;
  private activePointerId: number | null = null;
  private isDragging = false;
  private dragLastX = 0;
  private dragLastY = 0;
  private readonly dragSensitivity = 0.0042;

  private readonly radius = 2.3;
  private readonly stripWidth = 1.05;
  private readonly stripThickness = 0.16;

  constructor(canvas: HTMLCanvasElement, options: MobiusStripOptions = {}) {
    this.canvas = canvas;
    this.isInteractive = options.interactive ?? false;
    this.isInline = options.inline ?? false;
    this.scene = new THREE.Scene();

    const { width: w, height: h } = this.getViewportSize();
    this.viewportWidth = w;
    this.viewportHeight = h;

    this.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 100);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
    this.renderer.setSize(w, h, false);
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
        this.startAnimation();
      }
    };
    this.bindMotionSignals();
    this.updateMotionScale();

    this.updateThemeMaterial();

    this.resizeHandler = () => this.onResize();
    this.bindResizeSignals();
    this.observeThemeChanges();
    this.observeViewport();
    this.bindPointerInteraction();

    this.loadEnvironmentMap();
    this.startAnimation();
  }

  private bindPointerInteraction(): void {
    if (!this.isInteractive) {
      return;
    }

    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUpOrCancel);
    this.canvas.addEventListener('pointercancel', this.handlePointerUpOrCancel);
  }

  private unbindPointerInteraction(): void {
    if (!this.isInteractive) {
      return;
    }

    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUpOrCancel);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUpOrCancel);
  }

  private handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || this.activePointerId !== null) {
      return;
    }

    event.preventDefault();
    this.isDragging = true;
    this.activePointerId = event.pointerId;
    this.dragLastX = event.clientX;
    this.dragLastY = event.clientY;
    this.canvas.style.cursor = 'grabbing';
    this.canvas.setPointerCapture(event.pointerId);
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (!this.isDragging || this.activePointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - this.dragLastX;
    const deltaY = event.clientY - this.dragLastY;
    this.dragLastX = event.clientX;
    this.dragLastY = event.clientY;

    this.mesh.rotation.y += deltaX * this.dragSensitivity;
    this.mesh.rotation.x += deltaY * this.dragSensitivity;
  };

  private handlePointerUpOrCancel = (event: PointerEvent): void => {
    if (this.activePointerId !== event.pointerId) {
      return;
    }

    this.isDragging = false;
    this.activePointerId = null;
    this.canvas.style.cursor = 'grab';

    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
  };

  private clampRange(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private applyTintTemperature(colorHex: number, tintTemperature: number): number {
    const color = new THREE.Color(colorHex);
    const clampedTemperature = this.clampRange(tintTemperature, -1, 1);
    const warmStrength = Math.max(0, clampedTemperature);
    const coolStrength = Math.max(0, -clampedTemperature);

    const red = this.clampRange(color.r + (warmStrength * 0.14) - (coolStrength * 0.06), 0, 1);
    const green = this.clampRange(color.g + (warmStrength * 0.03) - (coolStrength * 0.01), 0, 1);
    const blue = this.clampRange(color.b + (coolStrength * 0.14) - (warmStrength * 0.09), 0, 1);

    color.setRGB(red, green, blue);
    return color.getHex();
  }

  private getThemeColorProfile(baseProfile: ChromeProfile): PlaygroundColorProfile {
    const colorTheme = this.playgroundSettings.colorTheme ?? 'default';
    if (colorTheme === 'default') {
      return {
        color: baseProfile.color,
        sheenColor: baseProfile.sheenColor,
        specularColor: baseProfile.specularColor,
      };
    }

    return PLAYGROUND_COLOR_PROFILES[colorTheme];
  }

  private applyThemeMaterial(): void {
    const profile = this.chromeProfile;
    const themeColorProfile = this.getThemeColorProfile(profile);
    const roughness = this.playgroundSettings.roughness === undefined
      ? profile.roughness
      : this.clampRange(this.playgroundSettings.roughness, 0.02, 0.8);
    const clearcoat = this.playgroundSettings.clearcoat === undefined
      ? profile.clearcoat
      : this.clampRange(this.playgroundSettings.clearcoat, 0, 1);
    const envMapIntensity = this.playgroundSettings.envMapIntensity === undefined
      ? profile.envMapIntensity
      : this.clampRange(this.playgroundSettings.envMapIntensity, 0.4, 2.4);
    const iridescence = this.playgroundSettings.iridescence === undefined
      ? profile.iridescence
      : this.clampRange(this.playgroundSettings.iridescence, 0, 1);
    const toneMappingExposure = this.playgroundSettings.exposure === undefined
      ? profile.toneMappingExposure
      : this.clampRange(this.playgroundSettings.exposure, 0.55, 1.8);
    const shimmerAmplitude = this.playgroundSettings.shimmerAmplitude === undefined
      ? profile.shimmerAmplitude
      : this.clampRange(this.playgroundSettings.shimmerAmplitude, 0, 0.25);
    const shimmerFrequency = this.playgroundSettings.shimmerFrequency === undefined
      ? profile.shimmerFrequency
      : this.clampRange(this.playgroundSettings.shimmerFrequency, 0.15, 2.2);
    const tintTemperature = this.playgroundSettings.tintTemperature === undefined
      ? 0
      : this.clampRange(this.playgroundSettings.tintTemperature, -1, 1);
    const isHighContrast = this.playgroundSettings.highContrast ?? false;
    const contrastedRoughness = isHighContrast ? Math.max(0.04, roughness * 0.68) : roughness;
    const contrastedClearcoat = isHighContrast ? this.clampRange(clearcoat + 0.08, 0, 1) : clearcoat;
    const contrastedEnvMapIntensity = isHighContrast
      ? this.clampRange(envMapIntensity * 1.14, 0.4, 2.4)
      : envMapIntensity;
    const contrastedIridescence = isHighContrast
      ? this.clampRange(iridescence * 0.92, 0, 1)
      : iridescence;
    const colorHex = this.applyTintTemperature(themeColorProfile.color, tintTemperature);
    const sheenColorHex = this.applyTintTemperature(themeColorProfile.sheenColor, tintTemperature);
    const specularColorHex = this.applyTintTemperature(themeColorProfile.specularColor, tintTemperature);
    const specularIntensity = isHighContrast
      ? this.clampRange(profile.specularIntensity + 0.1, 0, 1.2)
      : profile.specularIntensity;

    this.material.color.set(colorHex);
    this.material.roughness = contrastedRoughness;
    this.material.clearcoat = contrastedClearcoat;
    this.material.clearcoatRoughness = profile.clearcoatRoughness;
    this.material.envMapIntensity = contrastedEnvMapIntensity;
    this.material.iridescence = contrastedIridescence;
    this.material.iridescenceIOR = profile.iridescenceIOR;
    this.material.iridescenceThicknessRange = profile.iridescenceThicknessRange;
    this.material.sheen = profile.sheen;
    this.material.sheenRoughness = profile.sheenRoughness;
    this.material.sheenColor.set(sheenColorHex);
    this.material.specularIntensity = specularIntensity;
    this.material.specularColor.set(specularColorHex);

    this.dynamicEnvMapBase = contrastedEnvMapIntensity;
    this.dynamicIridescenceBase = contrastedIridescence;
    this.dynamicShimmerAmplitude = shimmerAmplitude;
    this.dynamicShimmerFrequency = shimmerFrequency;
    this.renderer.toneMappingExposure = toneMappingExposure;
  }

  private updateThemeMaterial(): void {
    const isDarkMode = document.documentElement.classList.contains('dark');
    this.chromeProfile = isDarkMode ? DARK_CHROME_PROFILE : LIGHT_CHROME_PROFILE;
    this.applyThemeMaterial();
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
    if (!this.isInline && this.viewportWidth <= 768 && widthDelta < 2 && heightDelta < 120) {
      return;
    }

    this.viewportWidth = w;
    this.viewportHeight = h;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
    this.updateMotionScale();
  }

  private getViewportSize(): { width: number; height: number } {
    if (this.isInline) {
      const bounds = this.canvas.getBoundingClientRect();
      return {
        width: Math.max(1, Math.round(bounds.width || this.canvas.clientWidth)),
        height: Math.max(1, Math.round(bounds.height || this.canvas.clientHeight)),
      };
    }

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

  private bindResizeSignals(): void {
    if (this.isInline && 'ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => this.onResize());
      this.resizeObserver.observe(this.canvas);
      return;
    }

    window.addEventListener('resize', this.resizeHandler);
  }

  private observeViewport(): void {
    if (!this.isInline || !('IntersectionObserver' in window)) {
      return;
    }

    this.viewportObserver = new IntersectionObserver(
      (entries) => {
        this.isInViewport = entries.some((entry) => entry.isIntersecting);
        if (this.isInViewport) {
          this.startAnimation();
        }
      },
      { rootMargin: '160px 0px' },
    );
    this.viewportObserver.observe(this.canvas);
  }

  private updateMotionScale(): void {
    const isNarrowViewport = this.viewportWidth < 768;
    const densityScale = Math.min(window.devicePixelRatio, 1.35) > 1.2 ? 0.92 : 1;
    const viewportScale = isNarrowViewport ? 0.72 : 1;
    this.motionScale = viewportScale * densityScale;
  }

  private applyDynamicChrome(elapsedSeconds: number): void {
    if (this.isReducedMotion || this.isPageHidden) {
      this.material.envMapIntensity = this.dynamicEnvMapBase;
      this.material.iridescence = this.dynamicIridescenceBase;
      return;
    }

    const shimmerWave = Math.sin(elapsedSeconds * this.dynamicShimmerFrequency);
    const shimmer = 1 + shimmerWave * this.dynamicShimmerAmplitude;

    this.material.envMapIntensity = this.dynamicEnvMapBase * shimmer;
    this.material.iridescence = this.dynamicIridescenceBase + shimmerWave * 0.025;
  }

  private startAnimation(): void {
    if (this.animationId !== 0 || this.isDisposed || this.isPageHidden || !this.isInViewport) {
      return;
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private animate(): void {
    this.animationId = 0;
    if (this.isDisposed || this.isPageHidden || !this.isInViewport) {
      return;
    }

    const elapsedMs = performance.now() - this.animationStartTime;
    const elapsedSeconds = elapsedMs * 0.001;
    this.applyDynamicChrome(elapsedSeconds);

    const animationScale = this.isReducedMotion ? this.motionScale * 0.3 : this.motionScale;

    this.mesh.rotation.x += (0.00056 + Math.sin(elapsedSeconds * 0.21) * 0.00004) * animationScale;
    this.mesh.rotation.y += (0.00106 + Math.sin(elapsedSeconds * 0.31) * 0.00006) * animationScale;
    this.mesh.rotation.z += (0.0033 + Math.sin(elapsedSeconds * 0.43) * 0.00016) * animationScale;

    this.renderer.render(this.scene, this.camera);
    this.startAnimation();
  }

  public dispose(): void {
    this.isDisposed = true;

    cancelAnimationFrame(this.animationId);
    this.animationId = 0;
    window.removeEventListener('resize', this.resizeHandler);
    this.resizeObserver?.disconnect();
    this.viewportObserver?.disconnect();
    this.resizeObserver = null;
    this.viewportObserver = null;
    this.unbindPointerInteraction();
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

  public applyPlaygroundSettings(settings: PlaygroundSettings): void {
    this.playgroundSettings = {
      ...this.playgroundSettings,
      ...settings,
    };

    this.applyThemeMaterial();
  }
}
