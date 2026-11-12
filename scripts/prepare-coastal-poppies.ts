#!/usr/bin/env bun
import { mkdtemp, open, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { gzipSync, inflateRawSync } from "node:zlib";
import sharp from "sharp";

const projectDirectory = path.resolve(import.meta.dir, "..");
const sourcePath = path.join(projectDirectory, "src/assets/animations/coastal-poppies.html");
const videoPath = path.join(projectDirectory, "src/assets/animations/coastal-poppies.mp4");
const posterPath = path.join(projectDirectory, "src/assets/images/coastal-poppies-poster.webp");

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isColour(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === 3 && value.every(
    (channel: unknown) => typeof channel === "number" && Number.isInteger(channel) && channel >= 0 && channel <= 255,
  );
}

function readAnimation(html: string) {
  const metadataText = html.match(/<script type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  const encodedFrames = html.match(/<script type="text\/plain">([\s\S]*?)<\/script>/)?.[1];
  if (!metadataText || !encodedFrames) throw new Error("Missing Lumen animation data.");

  const metadata: unknown = JSON.parse(metadataText);
  if (
    !metadata || typeof metadata !== "object" ||
    !("w" in metadata) || !isPositiveInteger(metadata.w) ||
    !("h" in metadata) || !isPositiveInteger(metadata.h) ||
    !("fps" in metadata) || !isPositiveInteger(metadata.fps) ||
    !("frames" in metadata) || !isPositiveInteger(metadata.frames) ||
    !("bits" in metadata) || metadata.bits !== 4 ||
    !("palette" in metadata) || !Array.isArray(metadata.palette) ||
    metadata.palette.length !== 16 || !metadata.palette.every(isColour) ||
    "look" in metadata || "glow" in metadata || "tw" in metadata
  ) {
    throw new Error("Expected the original 4-bit coastal poppy animation without rendering effects.");
  }

  const frames = inflateRawSync(Buffer.from(encodedFrames.trim(), "base64"));
  const packedFrameSize = Math.ceil(metadata.w * metadata.h / 2);
  if (frames.length !== packedFrameSize * metadata.frames) {
    throw new Error("Animation frame data does not match its metadata.");
  }

  return {
    width: metadata.w,
    height: metadata.h,
    fps: metadata.fps,
    count: metadata.frames,
    palette: metadata.palette,
    packedFrameSize,
    frames,
  };
}

async function run(command: string[]) {
  const process = Bun.spawn(command, { stdout: "inherit", stderr: "inherit" });
  if (await process.exited !== 0) throw new Error(`Failed: ${command[0]}`);
}

const source = await readFile(sourcePath, "utf8");
const animation = readAnimation(source);
const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "coastal-poppies-"));

try {
  const rawPath = path.join(temporaryDirectory, "frames.rgb");
  const posterPngPath = path.join(temporaryDirectory, "poster.png");
  const packed = Buffer.alloc(animation.packedFrameSize);
  const pixels = animation.width * animation.height;
  const rgb = Buffer.alloc(pixels * 3);
  const rawFile = await open(rawPath, "w");

  try {
    for (let frame = 0; frame < animation.count; frame++) {
      for (let i = 0; i < packed.length; i++) {
        packed[i] ^= animation.frames[frame * packed.length + i];
      }
      for (let pixel = 0; pixel < pixels; pixel++) {
        const index = (packed[pixel >> 1] >> ((pixel & 1) * 4)) & 15;
        const colour = animation.palette[index];
        rgb[pixel * 3] = colour[0];
        rgb[pixel * 3 + 1] = colour[1];
        rgb[pixel * 3 + 2] = colour[2];
      }
      if (frame === 0) {
        await sharp(rgb, { raw: { width: animation.width, height: animation.height, channels: 3 } })
          .png().toFile(posterPngPath);
      }
      await rawFile.writeFile(rgb);
    }
  } finally {
    await rawFile.close();
  }

  await run([
    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
    "-f", "rawvideo", "-pixel_format", "rgb24",
    "-video_size", `${animation.width}x${animation.height}`,
    "-framerate", String(animation.fps), "-i", rawPath,
    "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "26",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", videoPath,
  ]);
  await run([
    process.execPath,
    path.join(projectDirectory, ".agents/skills/astro-image-optimization/scripts/optimize-image.ts"),
    posterPngPath, "--out", posterPath, "--quality", "82", "--json",
  ]);

  console.log(JSON.stringify({
    sourceBytes: Buffer.byteLength(source),
    sourceGzipBytes: gzipSync(source).byteLength,
    videoBytes: (await stat(videoPath)).size,
    posterBytes: (await stat(posterPath)).size,
    width: animation.width,
    height: animation.height,
    frames: animation.count,
    seconds: animation.count / animation.fps,
  }, null, 2));
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
