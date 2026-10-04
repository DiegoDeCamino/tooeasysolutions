// Generates PWA icons, the favicon and a high-res PNG logo from the vector logos in public/images.
// Usage: node scripts/make-icons.mjs
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const MARK = "public/images/logo-mark.svg";
const LOGO = "public/images/logo.svg";
const OUT = "public/icons";
const CREAM = { r: 247, g: 243, b: 233, alpha: 1 };

await mkdir(OUT, { recursive: true });

const render = (src, width) => sharp(src, { density: 300 }).resize({ width }).png().toBuffer();

async function tile(size, scale, background = CREAM) {
  const inner = Math.round(size * scale);
  const art = await sharp(MARK, { density: 300 }).resize({ width: inner, height: inner, fit: "inside" }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: art, gravity: "center" }])
    .png()
    .toBuffer();
}

async function icon(size, scale, file) {
  await writeFile(`${OUT}/${file}`, await tile(size, scale));
  console.log("wrote", file);
}

await icon(192, 0.8, "icon-192.png");
await icon(512, 0.8, "icon-512.png");
// Maskable icons need the art inside the central 80% safe zone.
await icon(512, 0.62, "maskable-512.png");
await icon(180, 0.76, "apple-touch-icon.png");
await icon(96, 0.84, "badge-96.png");

// favicon.ico holding 16/32/48 PNGs (PNG-in-ICO is supported by every current browser).
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((s) => tile(s, 0.96, { r: 0, g: 0, b: 0, alpha: 0 })));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(s, e);
  header.writeUInt8(s, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(pngs[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += pngs[i].length;
});
await writeFile("src/app/favicon.ico", Buffer.concat([header, ...pngs]));
console.log("wrote favicon.ico");

// Raster logo for emails, social posts and anywhere SVG isn't accepted.
await writeFile("public/images/logo.png", await render(LOGO, 1200));
console.log("wrote logo.png");
