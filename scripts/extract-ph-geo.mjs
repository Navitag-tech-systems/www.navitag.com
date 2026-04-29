/**
 * One-shot extractor: pulls Philippines + visual-context neighbors (Malaysia,
 * Indonesia, Taiwan, Vietnam, Brunei) out of world-atlas `countries-10m.json`
 * (1:10M scale, ~3.6MB) and writes a slim TopoJSON with only those features.
 * Result lands in `app/assets/ph-coverage.topo.json` and is imported by
 * `HomeCoveragePh.vue` so we get country-scale geographic accuracy without
 * shipping the full 3.6MB world dataset to every visitor.
 *
 * Re-run any time you need to refresh the source data:
 *   node scripts/extract-ph-geo.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(ROOT, 'node_modules/world-atlas/countries-10m.json')
const OUT = resolve(ROOT, 'app/assets/ph-coverage.topo.json')

// ISO 3166-1 numeric country codes to retain. Trimmed aggressively for
// bundle size — Indonesia and Vietnam are mostly outside the viewport
// (we only show ~116°–127°E, 4°–22°N) so their contribution is not worth
// the geometry weight. Malaysia covers Sabah/Sarawak on Borneo's north
// coast which sits at our southwestern edge.
const KEEP_IDS = new Set([
  608, // Philippines (primary)
  458, // Malaysia (Sabah / Sarawak — visual anchor on Borneo north coast)
  158, // Taiwan (southern tip peeks in north of Batanes)
  96,  // Brunei (small but visually present off Sabah)
])

const topo = JSON.parse(readFileSync(SRC, 'utf8'))
const countries = topo.objects.countries

const keptGeometries = countries.geometries.filter((g) => {
  const id = typeof g.id === 'string' ? parseInt(g.id, 10) : g.id
  return KEEP_IDS.has(id)
})

// Collect every arc index referenced by the kept geometries so we can prune
// the (huge) shared arcs array down to only the ones we actually use.
const usedArcIndexes = new Set()
function collectArcs(node) {
  if (Array.isArray(node)) {
    if (node.length && typeof node[0] === 'number') {
      // Leaf: a list of arc indexes (TopoJSON encodes negation for direction
      // — index = arc < 0 ? ~arc : arc).
      for (const i of node) usedArcIndexes.add(i < 0 ? ~i : i)
    }
    else {
      for (const child of node) collectArcs(child)
    }
  }
}
for (const g of keptGeometries) collectArcs(g.arcs)

// Build a remap from old arc index → new compact index. Re-emit arcs in
// ascending order so the new index space is contiguous.
const sortedUsed = [...usedArcIndexes].sort((a, b) => a - b)
const remap = new Map(sortedUsed.map((oldIdx, newIdx) => [oldIdx, newIdx]))
const newArcs = sortedUsed.map(i => topo.arcs[i])

function rewriteArcs(node) {
  if (Array.isArray(node)) {
    if (node.length && typeof node[0] === 'number') {
      return node.map((i) => {
        const positive = i < 0 ? ~i : i
        const mapped = remap.get(positive)
        if (mapped === undefined) {
          throw new Error(`Missing arc remap for index ${positive}`)
        }
        return i < 0 ? ~mapped : mapped
      })
    }
    return node.map(rewriteArcs)
  }
  return node
}

const out = {
  type: 'Topology',
  arcs: newArcs,
  transform: topo.transform,
  bbox: topo.bbox,
  objects: {
    countries: {
      type: 'GeometryCollection',
      geometries: keptGeometries.map(g => ({
        ...g,
        arcs: rewriteArcs(g.arcs),
      })),
    },
  },
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(out))

const srcKB = (readFileSync(SRC).length / 1024).toFixed(0)
const outKB = (readFileSync(OUT).length / 1024).toFixed(0)
console.log(`✓ Extracted ${keptGeometries.length} countries (ids: ${[...KEEP_IDS].join(', ')})`)
console.log(`  ${srcKB} KB → ${outKB} KB (${((1 - outKB / srcKB) * 100).toFixed(1)}% reduction)`)
console.log(`  Wrote ${OUT}`)
