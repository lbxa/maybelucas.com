/// <reference lib="webworker" />

import * as THREE from "three";
import { VRMLLoader } from "three/addons/loaders/VRMLLoader.js";
import type {
  VrmlCadGeometryData,
  VrmlCadMaterialData,
  VrmlCadStartMessage,
  VrmlCadWorkerMessage,
} from "./VrmlCadModel.types";

interface SourceMesh {
  key: string;
  mesh: THREE.Mesh;
  partOffset: THREE.Vector3;
}

interface GeometryPlan {
  hasColors: boolean;
  hasNormals: boolean;
  material: VrmlCadMaterialData;
  vertexCount: number;
}

interface GeometryBuffer extends VrmlCadGeometryData {
  offset: number;
}

const workerScope = self;
let loadingStarted = false;
const EXPLODE_OFFSET_SCALE = 0.34;

const postStatus = (message: string): void => {
  const payload: VrmlCadWorkerMessage = { type: "status", message };
  workerScope.postMessage(payload);
};

const readStartMessage = (value: unknown): VrmlCadStartMessage | null => {
  if (typeof value !== "object" || value === null) return null;

  const modelUrl = Reflect.get(value, "modelUrl");
  const basePath = Reflect.get(value, "basePath");
  if (typeof modelUrl !== "string" || typeof basePath !== "string") return null;

  return { modelUrl, basePath };
};

const fetchVrmlSource = async (modelUrl: string): Promise<string> => {
  const response = await fetch(modelUrl);
  if (!response.ok) {
    throw new Error(`The CAD asset request failed with status ${response.status}.`);
  }

  const isCompressedAsset = new URL(modelUrl, workerScope.location.href).pathname.endsWith(
    ".gz",
  );
  const serverDecompressesResponse = response.headers
    .get("content-encoding")
    ?.toLowerCase()
    .includes("gzip");
  if (!isCompressedAsset || serverDecompressesResponse) {
    return response.text();
  }

  if (!response.body || !("DecompressionStream" in workerScope)) {
    throw new Error("This browser cannot decompress the CAD asset.");
  }

  const decompressed = response.body.pipeThrough(new DecompressionStream("gzip"));
  return new Response(decompressed).text();
};

const describeMaterial = (material: THREE.Material): VrmlCadMaterialData => {
  if (material instanceof THREE.MeshPhongMaterial) {
    return {
      kind: "phong",
      color: material.color.getHex(),
      emissive: material.emissive.getHex(),
      opacity: material.opacity,
      shininess: material.shininess,
      side: material.side,
      specular: material.specular.getHex(),
      transparent: material.transparent,
      vertexColors: material.vertexColors,
    };
  }

  if (material instanceof THREE.MeshBasicMaterial) {
    return {
      kind: "basic",
      color: material.color.getHex(),
      emissive: 0x000000,
      opacity: material.opacity,
      shininess: 0,
      side: material.side,
      specular: 0x000000,
      transparent: material.transparent,
      vertexColors: material.vertexColors,
    };
  }

  throw new Error(`Unsupported VRML material type: ${material.type}.`);
};

const materialKey = (material: VrmlCadMaterialData): string =>
  [
    material.kind,
    material.color,
    material.emissive,
    material.opacity,
    material.shininess,
    material.side,
    material.specular,
    material.transparent,
    material.vertexColors,
  ].join(":");

const planGeometry = (
  scene: THREE.Scene,
): { plans: Map<string, GeometryPlan>; sources: SourceMesh[] } => {
  const plans = new Map<string, GeometryPlan>();
  const sources: SourceMesh[] = [];

  scene.updateMatrixWorld(true);
  const assemblyBounds = new THREE.Box3().setFromObject(scene);
  if (assemblyBounds.isEmpty()) {
    throw new Error("The VRML file did not contain any mesh geometry.");
  }
  const assemblyCenter = assemblyBounds.getCenter(new THREE.Vector3());

  for (const part of scene.children) {
    const partBounds = new THREE.Box3().setFromObject(part);
    if (partBounds.isEmpty()) continue;

    const partOffset = partBounds
      .getCenter(new THREE.Vector3())
      .sub(assemblyCenter)
      .multiplyScalar(EXPLODE_OFFSET_SCALE);

    part.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      if (Array.isArray(object.material)) {
        throw new Error("Multi-material VRML meshes are not supported.");
      }

      const position = object.geometry.getAttribute("position");
      if (!position) return;

      const material = describeMaterial(object.material);
      const key = materialKey(material);
      const vertexCount = object.geometry.index?.count ?? position.count;
      const normal = object.geometry.getAttribute("normal");
      const color = object.geometry.getAttribute("color");
      const current = plans.get(key);

      if (current) {
        current.vertexCount += vertexCount;
        current.hasNormals = current.hasNormals && normal !== undefined;
        current.hasColors = current.hasColors && color !== undefined;
      } else {
        plans.set(key, {
          hasColors: color !== undefined,
          hasNormals: normal !== undefined,
          material,
          vertexCount,
        });
      }

      sources.push({ key, mesh: object, partOffset });
    });
  }

  if (sources.length === 0) {
    throw new Error("The VRML file did not contain any mesh geometry.");
  }

  return { plans, sources };
};

const allocateGeometryBuffers = (
  plans: Map<string, GeometryPlan>,
): Map<string, GeometryBuffer> => {
  const buffers = new Map<string, GeometryBuffer>();
  for (const [key, plan] of plans) {
    buffers.set(key, {
      colors: plan.hasColors ? new Float32Array(plan.vertexCount * 3) : null,
      material: plan.material,
      normals: plan.hasNormals ? new Float32Array(plan.vertexCount * 3) : null,
      offset: 0,
      partOffsets: new Float32Array(plan.vertexCount * 3),
      positions: new Float32Array(plan.vertexCount * 3),
    });
  }
  return buffers;
};

const copyGeometry = (
  sources: SourceMesh[],
  buffers: Map<string, GeometryBuffer>,
): void => {
  const positionVector = new THREE.Vector3();
  const normalVector = new THREE.Vector3();
  const normalMatrix = new THREE.Matrix3();

  for (const { key, mesh, partOffset } of sources) {
    const target = buffers.get(key);
    if (!target) continue;

    const geometry = mesh.geometry;
    const position = geometry.getAttribute("position");
    const normal = geometry.getAttribute("normal");
    const color = geometry.getAttribute("color");
    const index = geometry.index;
    const vertexCount = index?.count ?? position.count;
    normalMatrix.getNormalMatrix(mesh.matrixWorld);

    for (let vertex = 0; vertex < vertexCount; vertex += 1) {
      const sourceIndex = index ? index.getX(vertex) : vertex;
      const targetIndex = (target.offset + vertex) * 3;

      positionVector.fromBufferAttribute(position, sourceIndex).applyMatrix4(mesh.matrixWorld);
      target.positions[targetIndex] = positionVector.x;
      target.positions[targetIndex + 1] = positionVector.y;
      target.positions[targetIndex + 2] = positionVector.z;
      target.partOffsets[targetIndex] = partOffset.x;
      target.partOffsets[targetIndex + 1] = partOffset.y;
      target.partOffsets[targetIndex + 2] = partOffset.z;

      if (target.normals && normal) {
        normalVector.fromBufferAttribute(normal, sourceIndex).applyNormalMatrix(normalMatrix);
        target.normals[targetIndex] = normalVector.x;
        target.normals[targetIndex + 1] = normalVector.y;
        target.normals[targetIndex + 2] = normalVector.z;
      }

      if (target.colors && color) {
        target.colors[targetIndex] = color.getX(sourceIndex);
        target.colors[targetIndex + 1] = color.getY(sourceIndex);
        target.colors[targetIndex + 2] = color.getZ(sourceIndex);
      }
    }

    target.offset += vertexCount;
  }
};

const disposeParsedScene = (scene: THREE.Scene): void => {
  const materials = new Set<THREE.Material>();
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    if (Array.isArray(object.material)) {
      for (const material of object.material) materials.add(material);
    } else {
      materials.add(object.material);
    }
  });
  for (const material of materials) material.dispose();
};

const buildGeometryData = (scene: THREE.Scene): VrmlCadGeometryData[] => {
  const { plans, sources } = planGeometry(scene);
  const buffers = allocateGeometryBuffers(plans);
  copyGeometry(sources, buffers);
  disposeParsedScene(scene);

  return Array.from(buffers.values(), ({ offset: _offset, ...geometry }) => geometry);
};

const collectTransferables = (geometries: VrmlCadGeometryData[]): Transferable[] => {
  const transferables: Transferable[] = [];
  for (const geometry of geometries) {
    if (geometry.positions.buffer instanceof ArrayBuffer) {
      transferables.push(geometry.positions.buffer);
    }
    if (geometry.normals?.buffer instanceof ArrayBuffer) {
      transferables.push(geometry.normals.buffer);
    }
    if (geometry.colors?.buffer instanceof ArrayBuffer) {
      transferables.push(geometry.colors.buffer);
    }
    if (geometry.partOffsets.buffer instanceof ArrayBuffer) {
      transferables.push(geometry.partOffsets.buffer);
    }
  }
  return transferables;
};

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "The CAD asset could not be processed.";

const loadModel = async ({ modelUrl, basePath }: VrmlCadStartMessage): Promise<void> => {
  try {
    postStatus("Downloading CAD model…");
    const source = await fetchVrmlSource(modelUrl);

    postStatus("Parsing CAD model…");
    const scene = new VRMLLoader().parse(source, basePath);

    postStatus("Preparing CAD geometry…");
    const geometries = buildGeometryData(scene);
    const payload: VrmlCadWorkerMessage = { type: "ready", geometries };
    workerScope.postMessage(payload, collectTransferables(geometries));
  } catch (error) {
    const payload: VrmlCadWorkerMessage = {
      type: "error",
      message: toErrorMessage(error),
    };
    workerScope.postMessage(payload);
  }
};

workerScope.addEventListener("message", (event: MessageEvent<unknown>) => {
  const message = readStartMessage(event.data);
  if (!message || loadingStarted) return;

  loadingStarted = true;
  void loadModel(message);
});
