// Генерирует все размеры иконок из одного источника 1024x1024.
// npm i -D sharp png-to-ico
// node scripts/generate-icons.mjs ./assets/icon-source.png

import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const SRC = process.argv[2]
if (!SRC) throw new Error('Укажи путь к исходнику 1024x1024: node scripts/generate-icons.mjs ./assets/icon-source.png')

const OUT = 'public/icons'
mkdirSync(OUT, { recursive: true })

const PNG_SIZES = [16, 32, 48, 72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512, 1024]

for (const size of PNG_SIZES) {
  await sharp(SRC).resize(size, size).png({ compressionLevel: 9 }).toFile(resolve(OUT, `icon-${size}.png`))
  console.log(`icon-${size}.png`)
}

// maskable: тот же кадр, но с отступом 20% — безопасная зона для обрезки в Android
const inner = 640
const pad = (1024 - inner) / 2
await sharp({
  create: { width: 1024, height: 1024, channels: 4, background: '#0F766E' },
})
  .composite([{ input: await sharp(SRC).resize(inner, inner).toBuffer(), top: pad, left: pad }])
  .png()
  .toFile(resolve(OUT, 'icon-maskable-512.png'))

// монохром для Android 13 themed icons
await sharp(SRC).resize(512, 512).grayscale().png().toFile(resolve(OUT, 'icon-monochrome-512.png'))

// favicon.ico (16/32/48)
const ico = await pngToIco([
  await sharp(SRC).resize(16, 16).png().toBuffer(),
  await sharp(SRC).resize(32, 32).png().toBuffer(),
  await sharp(SRC).resize(48, 48).png().toBuffer(),
])
writeFileSync(resolve('public', 'favicon.ico'), ico)

// apple-touch-icon
await sharp(SRC).resize(180, 180).flatten({ background: '#0F766E' }).png().toFile(resolve('public', 'apple-touch-icon.png'))

// og:image 1200x630
await sharp({ create: { width: 1200, height: 630, channels: 4, background: '#0F766E' } })
  .composite([{ input: await sharp(SRC).resize(420, 420).toBuffer(), top: 105, left: 390 }])
  .png()
  .toFile(resolve('public', 'og.png'))

// сплэши для iOS
const SPLASH = [
  [1170, 2532], [1284, 2778], [1179, 2556], [1290, 2796], [1125, 2436],
  [828, 1792], [1242, 2688], [1536, 2048], [1668, 2388], [2048, 2732],
]
mkdirSync('public/splash', { recursive: true })
for (const [w, h] of SPLASH) {
  await sharp({ create: { width: w, height: h, channels: 4, background: '#0F766E' } })
    .composite([{ input: await sharp(SRC).resize(Math.round(w * 0.32), Math.round(w * 0.32)).toBuffer(), gravity: 'center' }])
    .png()
    .toFile(resolve('public/splash', `splash-${w}x${h}.png`))
}

console.log('Готово: public/icons, public/favicon.ico, public/apple-touch-icon.png, public/og.png, public/splash')
