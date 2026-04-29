// Fetches the 6 home-banner narrow webps and renders OG-spec (1200x630) JPGs
// into og_proposed/. Run with: node scripts/og/generate-og-options.mjs
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', '..', 'og_proposed')
const SRC_BASE = 'https://photos.navitag.net/dump/banners'
const COUNT = 6
const W = 1200
const H = 630

await mkdir(OUT_DIR, { recursive: true })

const results = []
for (let i = 1; i <= COUNT; i++) {
  const url = `${SRC_BASE}/navitag-store-banner-${i}-narrow.webp`
  const wideUrl = `${SRC_BASE}/navitag-store-banner-${i}.webp`

  // Variant A — narrow banner cover-fit to 1200x630 (slight crop, full-bleed)
  const narrowBuf = Buffer.from(await (await fetch(url)).arrayBuffer())
  const aOut = join(OUT_DIR, `og-option-${i}a-narrow-cover.jpg`)
  await sharp(narrowBuf)
    .resize(W, H, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(aOut)
  results.push(aOut)

  // Variant B — wide banner contained on a centered black canvas (letterboxed,
  // no crop — preserves the full composition)
  const wideBuf = Buffer.from(await (await fetch(wideUrl)).arrayBuffer())
  const bOut = join(OUT_DIR, `og-option-${i}b-wide-letterbox.jpg`)
  await sharp({
    create: { width: W, height: H, channels: 3, background: { r: 17, g: 24, b: 39 } },
  })
    .composite([{
      input: await sharp(wideBuf)
        .resize(W, H, { fit: 'inside' })
        .toBuffer(),
      gravity: 'center',
    }])
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(bOut)
  results.push(bOut)
}

console.log(`\nGenerated ${results.length} OG options in ${OUT_DIR}:\n`)
for (const r of results) console.log('  -', r.split(/[\\/]/).slice(-2).join('/'))
