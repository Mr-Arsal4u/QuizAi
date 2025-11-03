import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const svgPath = resolve(__dirname, '../src/assets/QuizKar.svg');
const outputDir = resolve(__dirname, '../public/icons');
const sizes = [16, 48, 128];

async function generateIcons() {
  try {
    // Ensure output directory exists
    await mkdir(outputDir, { recursive: true });

    // Read SVG file
    const svgBuffer = readFileSync(svgPath);

    // Generate PNG icons for each size
    for (const size of sizes) {
      const outputPath = resolve(outputDir, `icon${size}.png`);
      
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated icon${size}.png`);
    }

    console.log('\n✓ All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();

