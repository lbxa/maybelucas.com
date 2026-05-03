import { thumbHashToDataURL } from "thumbhash";

/** Decode a ThumbHash from lowercase hex (from `bun run gen-thumbhash <image>`). */
export function thumbhashHexToDataUrl(hex: string): string {
  const clean = hex.trim().replace(/^0x/i, "");
  if (clean.length % 2 !== 0) {
    throw new Error(`Invalid ThumbHash hex length: ${clean.length}`);
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return thumbHashToDataURL(bytes);
}
