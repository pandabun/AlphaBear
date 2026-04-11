#!/usr/bin/env node
/**
 * generate-icons.mjs
 * Jalankan sekali: node generate-icons.mjs
 * Requires: npm install sharp
 *
 * Script ini generate semua ukuran PWA icon dari SVG sumber.
 * Output di: public/icons/
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// ── SVG Sumber (AlphaBear logo — bear face dengan gradient pink-purple) ─────
const SVG_SOURCE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B9D"/>
      <stop offset="50%" style="stop-color:#C44DFF"/>
      <stop offset="100%" style="stop-color:#8B5CF6"/>
    </linearGradient>
    <linearGradient id="bear" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:0.95"/>
      <stop offset="100%" style="stop-color:#F5E6FF;stop-opacity:0.95"/>
    </linearGradient>
  </defs>

  <!-- Background rounded rect (maskable safe zone = 80% center) -->
  <rect width="512" height="512" rx="115" fill="url(#bg)"/>

  <!-- Subtle inner glow -->
  <rect width="512" height="512" rx="115" fill="white" opacity="0.08"/>

  <!-- Bear ears (left) -->
  <circle cx="152" cy="168" r="68" fill="url(#bear)" opacity="0.9"/>
  <circle cx="152" cy="168" r="44" fill="#FFB3D1" opacity="0.6"/>

  <!-- Bear ears (right) -->
  <circle cx="360" cy="168" r="68" fill="url(#bear)" opacity="0.9"/>
  <circle cx="360" cy="168" r="44" fill="#FFB3D1" opacity="0.6"/>

  <!-- Bear head -->
  <ellipse cx="256" cy="288" rx="148" ry="136" fill="url(#bear)"/>

  <!-- Eyes -->
  <circle cx="210" cy="258" r="22" fill="#3D1A6E"/>
  <circle cx="302" cy="258" r="22" fill="#3D1A6E"/>
  <!-- Eye shine -->
  <circle cx="218" cy="250" r="7" fill="white"/>
  <circle cx="310" cy="250" r="7" fill="white"/>

  <!-- Muzzle -->
  <ellipse cx="256" cy="316" rx="58" ry="44" fill="#FFD4E8" opacity="0.85"/>

  <!-- Nose -->
  <ellipse cx="256" cy="302" rx="20" ry="13" fill="#C44DFF"/>

  <!-- Smile -->
  <path d="M 228 328 Q 256 352 284 328" stroke="#8B5CF6" stroke-width="5" fill="none" stroke-linecap="round"/>

  <!-- Small alpha symbol (α) di bawah muzzle -->
  <text x="256" y="385" text-anchor="middle" font-family="Georgia,serif" font-size="38" font-weight="bold" fill="#8B5CF6" opacity="0.7">α</text>
</svg>`;

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Tulis SVG sumber
fs.writeFileSync(path.join(OUTPUT_DIR, 'icon.svg'), SVG_SOURCE);

// Generate tiap ukuran
const svgBuffer = Buffer.from(SVG_SOURCE);

for (const size of SIZES) {
  const outPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`✅ Generated: icon-${size}x${size}.png`);
}

// Shortcut icons (96x96, sederhana)
const ADD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="20" fill="#FF6B9D"/>
  <line x1="48" y1="24" x2="48" y2="72" stroke="white" stroke-width="8" stroke-linecap="round"/>
  <line x1="24" y1="48" x2="72" y2="48" stroke="white" stroke-width="8" stroke-linecap="round"/>
</svg>`;

const SCAN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="20" fill="#C44DFF"/>
  <rect x="20" y="30" width="56" height="36" rx="4" fill="none" stroke="white" stroke-width="5"/>
  <line x1="20" y1="48" x2="76" y2="48" stroke="white" stroke-width="3" stroke-dasharray="6,4"/>
  <rect x="36" y="18" width="8" height="12" rx="2" fill="white"/>
  <rect x="52" y="18" width="8" height="12" rx="2" fill="white"/>
  <rect x="36" y="66" width="8" height="12" rx="2" fill="white"/>
  <rect x="52" y="66" width="8" height="12" rx="2" fill="white"/>
</svg>`;

await sharp(Buffer.from(ADD_SVG)).resize(96, 96).png().toFile(path.join(OUTPUT_DIR, 'shortcut-add.png'));
console.log('✅ Generated: shortcut-add.png');

await sharp(Buffer.from(SCAN_SVG)).resize(96, 96).png().toFile(path.join(OUTPUT_DIR, 'shortcut-scan.png'));
console.log('✅ Generated: shortcut-scan.png');

console.log('\n🐻 Semua icon AlphaBear berhasil di-generate!');
console.log(`📁 Output: ${OUTPUT_DIR}`);
