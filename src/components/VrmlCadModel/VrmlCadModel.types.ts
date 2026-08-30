import type { Side } from "three";

export interface VrmlCadMaterialData {
  kind: "basic" | "phong";
  color: number;
  emissive: number;
  opacity: number;
  shininess: number;
  side: Side;
  specular: number;
  transparent: boolean;
  vertexColors: boolean;
}

export interface VrmlCadGeometryData {
  colors: Float32Array | null;
  material: VrmlCadMaterialData;
  normals: Float32Array | null;
  partOffsets: Float32Array;
  positions: Float32Array;
}

export interface VrmlCadStartMessage {
  basePath: string;
  modelUrl: string;
}

export type VrmlCadWorkerMessage =
  | { type: "error"; message: string }
  | { type: "ready"; geometries: VrmlCadGeometryData[] }
  | { type: "status"; message: string };
