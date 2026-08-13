/**
 * Generate JobAZ favicons and PWA icons from logo.png + jaz-eye.png.
 *
 * Usage:
 *   npx tsx scripts/generate-favicons.ts
 */

import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'

const BG = { r: 2, g: 6, b: 23, alpha: 1 } // #020617

async function squareCanvas(size: number) {
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
}

async function compositeCentered(
  size: number,
  input: Buffer
): Promise<Buffer> {
  return (await squareCanvas(size))
    .composite([{ input, gravity: 'center' }])
    .png()
    .toBuffer()
}

/** Wordmark icon — JobAZ logo centered on dark square (install / "any"). */
async function wordmarkIcon(logoPath: string, size: number): Promise<Buffer> {
  const maxW = Math.round(size * 0.86)
  const maxH = Math.round(size * 0.38)
  const resized = await sharp(logoPath)
    .resize(maxW, maxH, {
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
  return compositeCentered(size, resized)
}

/** Eye mark with padding — maskable / small favicons. */
async function eyeIcon(
  eyePath: string,
  size: number,
  contentRatio: number
): Promise<Buffer> {
  const inner = Math.max(16, Math.round(size * contentRatio))
  const resized = await sharp(eyePath)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
  return compositeCentered(size, resized)
}

async function generateFavicons() {
  const publicDir = path.join(process.cwd(), 'public')
  const iconsDir = path.join(publicDir, 'icons')
  const logoPath = path.join(publicDir, 'logo.png')
  const eyePath = path.join(publicDir, 'jaz', 'jaz-eye.png')
  const svgPath = path.join(publicDir, 'favicon.svg')

  await fs.mkdir(iconsDir, { recursive: true })

  console.log('Generating JobAZ favicon and PWA icons...')

  const svgBuffer = await fs.readFile(svgPath)

  const png16 = await sharp(svgBuffer)
    .resize(16, 16, { fit: 'contain', background: BG })
    .png()
    .toBuffer()
  await fs.writeFile(path.join(publicDir, 'favicon-16x16.png'), png16)
  console.log('  favicon-16x16.png')

  const png32 = await sharp(svgBuffer)
    .resize(32, 32, { fit: 'contain', background: BG })
    .png()
    .toBuffer()
  await fs.writeFile(path.join(publicDir, 'favicon-32x32.png'), png32)
  await fs.writeFile(path.join(publicDir, 'favicon.ico'), png32)
  console.log('  favicon-32x32.png / favicon.ico')

  const apple = await wordmarkIcon(logoPath, 180)
  await fs.writeFile(path.join(publicDir, 'apple-touch-icon.png'), apple)
  console.log('  apple-touch-icon.png')

  const icon192 = await wordmarkIcon(logoPath, 192)
  const icon512 = await wordmarkIcon(logoPath, 512)
  await fs.writeFile(path.join(iconsDir, 'icon-192x192.png'), icon192)
  await fs.writeFile(path.join(iconsDir, 'icon-512x512.png'), icon512)
  console.log('  /icons/icon-192x192.png')
  console.log('  /icons/icon-512x512.png')

  const mask192 = await eyeIcon(eyePath, 192, 0.62)
  const mask512 = await eyeIcon(eyePath, 512, 0.62)
  await fs.writeFile(path.join(iconsDir, 'maskable-192x192.png'), mask192)
  await fs.writeFile(path.join(iconsDir, 'maskable-512x512.png'), mask512)
  console.log('  /icons/maskable-192x192.png')
  console.log('  /icons/maskable-512x512.png')

  console.log('Done.')
}

generateFavicons().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error('Error generating favicons:', message)
  process.exit(1)
})
