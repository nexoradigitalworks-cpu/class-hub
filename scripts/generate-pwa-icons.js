import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

async function generateIcons() {
  const svgBuffer = fs.readFileSync(path.join(publicDir, 'favicon.svg'));

  // 1. Standard 192x192 icon (with brand background)
  const svg192 = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
      <rect width="192" height="192" rx="36" fill="#0047BA" />
      <g transform="translate(16, 16) scale(0.8)">
        <circle cx="100" cy="42" r="23" fill="#FFFFFF" />
        <circle cx="48" cy="76" r="23" fill="#FFFFFF" />
        <circle cx="152" cy="76" r="23" fill="#FFFFFF" />
        <path d="M 68 76 C 76 60, 124 60, 132 76 C 120 84, 80 84, 68 76 Z" fill="#FFFFFF" />
        <path d="M 37 98 C 37 98, 62 82, 95 90 C 96 90, 96 94, 96 96 C 80 96, 68 102, 68 110 L 68 156 C 68 166, 78 174, 90 174 L 110 174 C 122 174, 132 166, 132 156 L 132 110 C 132 102, 120 96, 104 96 C 104 94, 104 90, 105 90 C 138 82, 163 98, 163 98 C 165 128, 148 162, 128 174 C 114 182, 86 182, 72 174 C 52 162, 35 128, 37 98 Z" fill="#FFFFFF" />
        <rect x="68" y="90" width="64" height="78" rx="14" fill="#0047BA" />
        <rect x="77" y="105" width="46" height="8" rx="4" fill="#4C9AFF" />
        <rect x="77" y="123" width="46" height="8" rx="4" fill="#4C9AFF" />
        <rect x="77" y="141" width="46" height="8" rx="4" fill="#4C9AFF" />
      </g>
    </svg>
  `;

  // 2. Standard 512x512 icon
  const svg512 = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
      <rect width="512" height="512" rx="96" fill="#0047BA" />
      <g transform="translate(56, 56) scale(2)">
        <circle cx="100" cy="42" r="23" fill="#FFFFFF" />
        <circle cx="48" cy="76" r="23" fill="#FFFFFF" />
        <circle cx="152" cy="76" r="23" fill="#FFFFFF" />
        <path d="M 68 76 C 76 60, 124 60, 132 76 C 120 84, 80 84, 68 76 Z" fill="#FFFFFF" />
        <path d="M 37 98 C 37 98, 62 82, 95 90 C 96 90, 96 94, 96 96 C 80 96, 68 102, 68 110 L 68 156 C 68 166, 78 174, 90 174 L 110 174 C 122 174, 132 166, 132 156 L 132 110 C 132 102, 120 96, 104 96 C 104 94, 104 90, 105 90 C 138 82, 163 98, 163 98 C 165 128, 148 162, 128 174 C 114 182, 86 182, 72 174 C 52 162, 35 128, 37 98 Z" fill="#FFFFFF" />
        <rect x="68" y="90" width="64" height="78" rx="14" fill="#0047BA" />
        <rect x="77" y="105" width="46" height="8" rx="4" fill="#4C9AFF" />
        <rect x="77" y="123" width="46" height="8" rx="4" fill="#4C9AFF" />
        <rect x="77" y="141" width="46" height="8" rx="4" fill="#4C9AFF" />
      </g>
    </svg>
  `;

  // 3. Maskable 512x512 icon (with full bleed background and safe zone padding)
  const svgMaskable512 = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
      <rect width="512" height="512" fill="#0047BA" />
      <g transform="translate(86, 86) scale(1.7)">
        <circle cx="100" cy="42" r="23" fill="#FFFFFF" />
        <circle cx="48" cy="76" r="23" fill="#FFFFFF" />
        <circle cx="152" cy="76" r="23" fill="#FFFFFF" />
        <path d="M 68 76 C 76 60, 124 60, 132 76 C 120 84, 80 84, 68 76 Z" fill="#FFFFFF" />
        <path d="M 37 98 C 37 98, 62 82, 95 90 C 96 90, 96 94, 96 96 C 80 96, 68 102, 68 110 L 68 156 C 68 166, 78 174, 90 174 L 110 174 C 122 174, 132 166, 132 156 L 132 110 C 132 102, 120 96, 104 96 C 104 94, 104 90, 105 90 C 138 82, 163 98, 163 98 C 165 128, 148 162, 128 174 C 114 182, 86 182, 72 174 C 52 162, 35 128, 37 98 Z" fill="#FFFFFF" />
        <rect x="68" y="90" width="64" height="78" rx="14" fill="#0047BA" />
        <rect x="77" y="105" width="46" height="8" rx="4" fill="#4C9AFF" />
        <rect x="77" y="123" width="46" height="8" rx="4" fill="#4C9AFF" />
        <rect x="77" y="141" width="46" height="8" rx="4" fill="#4C9AFF" />
      </g>
    </svg>
  `;

  // 4. Apple Touch Icon 180x180
  const svgApple180 = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
      <rect width="180" height="180" fill="#0047BA" />
      <g transform="translate(18, 18) scale(0.72)">
        <circle cx="100" cy="42" r="23" fill="#FFFFFF" />
        <circle cx="48" cy="76" r="23" fill="#FFFFFF" />
        <circle cx="152" cy="76" r="23" fill="#FFFFFF" />
        <path d="M 68 76 C 76 60, 124 60, 132 76 C 120 84, 80 84, 68 76 Z" fill="#FFFFFF" />
        <path d="M 37 98 C 37 98, 62 82, 95 90 C 96 90, 96 94, 96 96 C 80 96, 68 102, 68 110 L 68 156 C 68 166, 78 174, 90 174 L 110 174 C 122 174, 132 166, 132 156 L 132 110 C 132 102, 120 96, 104 96 C 104 94, 104 90, 105 90 C 138 82, 163 98, 163 98 C 165 128, 148 162, 128 174 C 114 182, 86 182, 72 174 C 52 162, 35 128, 37 98 Z" fill="#FFFFFF" />
        <rect x="68" y="90" width="64" height="78" rx="14" fill="#0047BA" />
        <rect x="77" y="105" width="46" height="8" rx="4" fill="#4C9AFF" />
        <rect x="77" y="123" width="46" height="8" rx="4" fill="#4C9AFF" />
        <rect x="77" y="141" width="46" height="8" rx="4" fill="#4C9AFF" />
      </g>
    </svg>
  `;

  await sharp(Buffer.from(svg192)).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✓ Generated pwa-192x192.png');

  await sharp(Buffer.from(svg512)).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✓ Generated pwa-512x512.png');

  await sharp(Buffer.from(svgMaskable512)).png().toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✓ Generated pwa-maskable-512x512.png');

  await sharp(Buffer.from(svgApple180)).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Generated apple-touch-icon.png');
}

generateIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
