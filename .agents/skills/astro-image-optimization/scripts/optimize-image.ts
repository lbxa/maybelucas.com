#!/usr/bin/env bun
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { rgbaToThumbHash } from "thumbhash";

type Options = {
  input?: string;
  out?: string;
  width?: number;
  quality: number;
  thumbSize: number;
  json: boolean;
};

function usage() {
  console.log(`Usage: bun .cursor/skills/astro-image-optimization/scripts/optimize-image.ts <input> [options]

Options:
  --out <path>        Output WebP path. Defaults to input path with .webp extension.
  --width <number>    Resize to this max width without upscaling.
  --quality <number>  WebP quality, 1-100. Defaults to 82.
  --thumb-size <num>  ThumbHash source max size. Defaults to 100.
  --json              Print compact JSON only.
  --help              Show this help message.`);
}

function readNumber(value: string | undefined, name: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }
  return parsed;
}

function parseArgs(argv: string[]): Options {
  const options: Options = {
    quality: 82,
    thumbSize: 100,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    }

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--out") {
      options.out = argv[++index];
      continue;
    }

    if (arg === "--width") {
      options.width = readNumber(argv[++index], "--width");
      continue;
    }

    if (arg === "--quality") {
      options.quality = readNumber(argv[++index], "--quality");
      continue;
    }

    if (arg === "--thumb-size") {
      options.thumbSize = readNumber(argv[++index], "--thumb-size");
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (options.input) {
      throw new Error(`Unexpected extra input: ${arg}`);
    }

    options.input = arg;
  }

  if (!options.input) {
    usage();
    process.exit(1);
  }

  if (options.quality > 100) {
    throw new Error("--quality must be between 1 and 100.");
  }

  return options;
}

function defaultOutputPath(inputPath: string) {
  const parsed = path.parse(inputPath);
  return path.join(parsed.dir, `${parsed.name}.webp`);
}

const options = parseArgs(process.argv.slice(2));
const inputPath = path.resolve(options.input!);
const outputPath = path.resolve(options.out ?? defaultOutputPath(inputPath));

await mkdir(path.dirname(outputPath), { recursive: true });

const pipeline = sharp(inputPath).rotate();
if (options.width) {
  pipeline.resize({ width: options.width, withoutEnlargement: true });
}

const info = await pipeline
  .webp({ quality: options.quality, effort: 6 })
  .toFile(outputPath);

const { data, info: thumbInfo } = await sharp(outputPath)
  .ensureAlpha()
  .resize(options.thumbSize, options.thumbSize, {
    fit: "inside",
    withoutEnlargement: true,
  })
  .raw()
  .toBuffer({ resolveWithObject: true });

const thumbhash = rgbaToThumbHash(
  thumbInfo.width,
  thumbInfo.height,
  new Uint8Array(data),
);

const result = {
  input: inputPath,
  output: outputPath,
  width: info.width,
  height: info.height,
  format: "webp",
  quality: options.quality,
  sizeBytes: info.size,
  thumbhashHex: Buffer.from(thumbhash).toString("hex"),
};

if (options.json) {
  console.log(JSON.stringify(result));
} else {
  console.log(JSON.stringify(result, null, 2));
}
