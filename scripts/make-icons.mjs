// Generates PWA icons from the truck mark in public/images/logo.png.
// Usage: node scripts/make-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC = "public/images/logo.png";
const OUT = "public/icons";
const CREAM = { r: 247, g: 243, b: 233, alpha: 1 };

await mkdir(OUT, { recursive: true });

// The truck sits roughly at x 120-370, y 108-258 in the 500x500 logo.
const mark = await sharp(SRC).extract({ left: 118, top: 104, width: 254, height: 156 }).png().toBuffer();

async function icon(size, scale, file) {
  const inner = Math.round(size * scale);
  const resized = await sharp(mark).resize({ width: inner, height: inner, fit: "inside" }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: CREAM } })
    .composite([{ input: resized, gravity: "center" }])
    .png()
    .toFile(`${OUT}/${file}`);
  console.log("wrote", file);
}

await icon(192, 0.78, "icon-192.png");
await icon(512, 0.78, "icon-512.png");
// Maskable icons need the art inside the central 80% safe zone.
await icon(512, 0.6, "maskable-512.png");
await icon(180, 0.74, "apple-touch-icon.png");
await icon(96, 0.8, "badge-96.png");
