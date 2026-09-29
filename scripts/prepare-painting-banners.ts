#!/usr/bin/env bun
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";

const sourceDirectory = process.argv[2];
if (!sourceDirectory) {
  throw new Error("Usage: bun scripts/prepare-painting-banners.ts <source-directory> [painting-name ...]");
}

// Crop coordinates refer to the original files, before resizing.
const paintings = [
  {
    name: "orion",
    file: "Blind Orion Searching for the Rising Sun.avif",
    crop: { left: 0, top: 0, width: 3200, height: 800 },
  },
  {
    name: "apollo",
    file: "Apollo_by_Giovanni_Antonio_Pellegrini_Mauritshuis_1135.jpg",
    crop: { left: 0, top: 0, width: 1920, height: 480 },
  },
  {
    name: "minerva",
    file: "Combat de Minerve contre Mars.JPG",
    crop: { left: 0, top: 150, width: 1464, height: 366 },
  },
  {
    name: "harbour",
    file: "N-0014-00-000066-wpu.jpg",
    crop: { left: 0, top: 235, width: 800, height: 200 },
  },
  {
    name: "last-supper",
    file: "last supper.jpg",
    crop: { left: 0, top: 1150, width: 9600, height: 2400 },
  },
  {
    name: "diogenes",
    file: "0000399948_OG.JPG",
    crop: { left: 20, top: 695, width: 1464, height: 366 },
  },
  {
    name: "ulysses-and-the-sirens",
    file: "JohnWilliamWATERHOUSE-Ulyssesand-Fd101526.jpg",
    crop: { left: 12, top: 180, width: 2976, height: 744 },
  },
  {
    name: "ulysses-and-polyphemus",
    file: "N-0508-00-000028-wpu.jpg",
    crop: { left: 0, top: 255, width: 800, height: 200 },
  },
  {
    name: "odysseus-and-nausicaa",
    file: "Odysseus_en_Nausikaä_Rijksmuseum_SK-A-4278.jpeg",
    crop: { left: 0, top: 260, width: 2500, height: 625 },
  },
  {
    name: "funeral-of-patroclus",
    file: "P1188.jpg",
    crop: { left: 0, top: 260, width: 2480, height: 620 },
  },
];

const selectedNames = process.argv.slice(3);
for (const name of selectedNames) {
  if (!paintings.some((painting) => painting.name === name)) {
    throw new Error(`Unknown painting: ${name}`);
  }
}
const selectedPaintings = paintings.filter(
  (painting) => selectedNames.length === 0 || selectedNames.includes(painting.name),
);

const projectDirectory = path.resolve(import.meta.dir, "..");
const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "painting-banners-"));

try {
  for (const painting of selectedPaintings) {
    const preparedImage = path.join(temporaryDirectory, `${painting.name}.png`);
    const source = path.join(sourceDirectory, painting.file);
    await sharp(source)
      .rotate()
      .extract(painting.crop)
      // Smaller sources are resampled to match the shared resolution.
      .resize(1400, 350)
      .png()
      .toFile(preparedImage);

    const result = Bun.spawnSync([
      "bun",
      path.join(projectDirectory, ".agents/skills/astro-image-optimization/scripts/optimize-image.ts"),
      preparedImage,
      "--out",
      path.join(projectDirectory, "src/assets/images/banners", `${painting.name}.webp`),
      "--json",
    ]);

    if (result.exitCode !== 0) {
      throw new Error(result.stderr.toString());
    }
    process.stdout.write(result.stdout);
  }
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
