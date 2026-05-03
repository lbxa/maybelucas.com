#!/usr/bin/env bun
/**
 * Encode an image as ThumbHash — compact hex you can pass to Image `thumbhash`.
 * ThumbHash previews usually look clearer than BlurHash for the same footprint.
 * Usage: bun scripts/gen-thumbhash.ts <path-to-image>
 */
import { rgbaToThumbHash } from "thumbhash";
import sharp from "sharp";

const pathArg = process.argv[2];
if (!pathArg) {
  console.error("Usage: bun scripts/gen-thumbhash.ts <path-to-image>");
  process.exit(1);
}

const { data, info } = await sharp(pathArg)
  .ensureAlpha()
  .resize(100, 100, { fit: "cover" })
  .raw()
  .toBuffer({ resolveWithObject: true });

const hash = rgbaToThumbHash(info.width, info.height, new Uint8Array(data));

console.log(Buffer.from(hash).toString("hex"));
