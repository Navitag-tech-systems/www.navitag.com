<script setup lang="ts">
import type { Topology } from 'topojson-specification'
import { feature } from 'topojson-client'
// Pre-extracted PH-region topology from world-atlas 1:10M (see
// scripts/extract-ph-geo.mjs). 77KB instead of the full 3.6MB world
// dataset, with country-scale geographic accuracy for the entire
// Philippine archipelago + Sabah/Brunei/Taiwan visual context.
import phTopo from '~/assets/ph-coverage.topo.json'

// Tight bounding box around the Philippine archipelago (lng 116°E–127°E,
// lat 4°N–22°N). Equirectangular projection means we can map directly.
const LNG_MIN = 116
const LNG_MAX = 127
const LAT_MIN = 4
const LAT_MAX = 22

const VB_W = 1000
const VB_H = Math.round((VB_W * (LAT_MAX - LAT_MIN)) / (LNG_MAX - LNG_MIN))

function project(lng: number, lat: number): [number, number] {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * VB_W
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * VB_H
  return [x, y]
}

function ringToPath(ring: number[][]): string {
  if (!ring.length) return ''
  let d = ''
  for (let i = 0; i < ring.length; i++) {
    const [x, y] = project(ring[i]![0]!, ring[i]![1]!)
    d += (i === 0 ? 'M' : 'L') + `${x.toFixed(2)},${y.toFixed(2)}`
  }
  return d + 'Z'
}

interface GeomPolygon { type: 'Polygon', coordinates: number[][][] }
interface GeomMultiPolygon { type: 'MultiPolygon', coordinates: number[][][][] }
type AnyGeom = GeomPolygon | GeomMultiPolygon

function geometryToPath(geom: AnyGeom): string {
  if (geom.type === 'Polygon') return geom.coordinates.map(ringToPath).join(' ')
  if (geom.type === 'MultiPolygon') return geom.coordinates.flatMap(p => p.map(ringToPath)).join(' ')
  return ''
}

// Pick out the Philippines feature (ISO 3166-1 numeric: 608); everything
// else in the pre-extracted topology is rendered as neighbor context
// (Sabah/Sarawak, Brunei, southern Taiwan).
interface MapShape { id: number, name: string, d: string }

const phPath = ref<string>('')
const neighborPaths = ref<MapShape[]>([])

;(() => {
  const topo = phTopo as unknown as Topology
  const fc = feature(topo, topo.objects.countries as never) as unknown as {
    features: { id: number | string, properties?: { name?: string }, geometry: AnyGeom }[]
  }
  for (const f of fc.features) {
    const id = typeof f.id === 'string' ? parseInt(f.id, 10) : f.id
    if (id === 608) {
      phPath.value = geometryToPath(f.geometry)
    }
    else {
      neighborPaths.value.push({ id, name: f.properties?.name || '', d: geometryToPath(f.geometry) })
    }
  }
})()

// Major cities for visual anchors — coordinates in (lng, lat).
const CITIES: { name: string, lng: number, lat: number }[] = [
  { name: 'Manila', lng: 120.98, lat: 14.6 },
  { name: 'Cebu', lng: 123.89, lat: 10.32 },
  { name: 'Davao', lng: 125.61, lat: 7.07 },
  { name: 'Baguio', lng: 120.59, lat: 16.41 },
]

const carriers = [
  {
    name: 'Globe Telecom',
    logo: '/partners/globe.svg',
    desc: '4G LTE / 5G nationwide coverage',
  },
  {
    name: 'Smart Communications',
    logo: '/partners/smart.svg',
    desc: '4G LTE / 5G nationwide coverage',
  },
]
</script>

<template>
  <section id="coverage" class="relative bg-white py-20 sm:py-28 lg:py-32 scroll-mt-20">
    <div class="max-w-7xl mx-auto px-6 sm:px-8">
      <!-- Heading -->
      <div class="max-w-3xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navitag-blue/10 text-navitag-blue text-[11px] font-semibold tracking-[0.15em] uppercase">
          Local network partners
        </div>
        <h2 class="mt-5 text-4xl sm:text-5xl lg:text-[56px] font-semibold tracking-tight leading-[1.05] text-gray-950">
          Built on the <span class="text-navitag-blue">Philippines'</span><br class="hidden sm:block">
          strongest networks.
        </h2>
        <p class="mt-5 text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
          Your Navitag device automatically connects to whichever carrier is
          strongest at your location — covering Luzon, Visayas, and Mindanao
          across both Globe and Smart's 4G LTE and 5G networks.
        </p>
      </div>

      <!-- Map + Carriers grid -->
      <div class="mt-12 lg:mt-16 grid lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
        <!-- Map -->
        <div class="lg:col-span-5">
          <div class="relative rounded-3xl overflow-hidden border border-gray-100 bg-gradient-to-br from-[#F7F8FA] via-white to-[#F7F4EF] max-w-sm mx-auto lg:max-w-none">
            <div class="relative" :style="{ aspectRatio: `${VB_W} / ${VB_H}` }">
              <svg
                :viewBox="`0 0 ${VB_W} ${VB_H}`"
                class="absolute inset-0 w-full h-full"
                role="img"
                aria-label="Philippines coverage map"
                preserveAspectRatio="xMidYMid meet"
              >
                <!-- Neighboring landmasses (greyed for context) -->
                <g>
                  <path
                    v-for="n in neighborPaths"
                    :key="`n-${n.id}`"
                    :d="n.d"
                    class="fill-gray-200/80"
                    stroke="white"
                    stroke-width="0.5"
                  />
                </g>

                <!-- Philippines (highlighted) -->
                <path
                  v-if="phPath"
                  :d="phPath"
                  class="fill-navitag-blue"
                  stroke="white"
                  stroke-width="0.6"
                  stroke-linejoin="round"
                />

                <!-- City markers -->
                <g v-for="city in CITIES" :key="city.name">
                  <g :transform="`translate(${project(city.lng, city.lat)[0]}, ${project(city.lng, city.lat)[1]})`">
                    <circle r="11" class="ph-pulse fill-navitag-orange/30" />
                    <circle r="4" class="fill-navitag-orange" stroke="white" stroke-width="1.2" />
                    <text
                      x="8"
                      y="-6"
                      class="fill-gray-900 text-[10px] font-semibold"
                      style="font-family: system-ui, -apple-system, sans-serif;"
                    >
                      {{ city.name }}
                    </text>
                  </g>
                </g>
              </svg>
            </div>
          </div>
        </div>

        <!-- Carrier partners -->
        <div class="lg:col-span-7 flex flex-col gap-4">
          <div
            v-for="c in carriers"
            :key="c.name"
            class="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 flex flex-col justify-between"
          >
            <div class="h-16 sm:h-20 flex items-center">
              <img
                :src="c.logo"
                :alt="c.name"
                class="h-full max-h-16 sm:max-h-20 w-auto object-contain"
              />
            </div>
            <div class="mt-6">
              <div class="text-[11px] uppercase tracking-[0.18em] text-navitag-blue font-semibold mb-2">
                Network Partner
              </div>
              <h3 class="text-xl font-semibold text-gray-950 tracking-tight">
                {{ c.name }}
              </h3>
              <p class="mt-1.5 text-sm text-gray-500 leading-relaxed">
                {{ c.desc }}
              </p>
            </div>
          </div>

          <div class="bg-gray-50 rounded-3xl border border-gray-100 px-6 py-5 flex items-start gap-4">
            <div class="w-10 h-10 shrink-0 rounded-full bg-navitag-blue/10 text-navitag-blue flex items-center justify-center">
              <i class="fas fa-tower-cell text-sm"></i>
            </div>
            <div class="text-[13.5px] text-gray-600 leading-relaxed">
              <strong class="text-gray-950">Multi-carrier roaming.</strong>
              Your device switches automatically to the strongest available
              signal — no SIM swap, no settings to change.
            </div>
          </div>
        </div>
      </div>

      <!-- Counters -->
      <div class="mt-10 grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl">
        <div class="text-center sm:text-left">
          <div class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-950">7,641</div>
          <div class="text-[12px] uppercase tracking-[0.15em] text-gray-400 font-semibold mt-1">Islands covered</div>
        </div>
        <div class="text-center sm:text-left">
          <div class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-950">2</div>
          <div class="text-[12px] uppercase tracking-[0.15em] text-gray-400 font-semibold mt-1">Major carriers</div>
        </div>
        <div class="text-center sm:text-left">
          <div class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-950">4G – 5G</div>
          <div class="text-[12px] uppercase tracking-[0.15em] text-gray-400 font-semibold mt-1">Multi-gen</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ph-pulse {
  transform-origin: center;
  transform-box: fill-box;
  animation: ph-ping 1.8s ease-out infinite;
}
@keyframes ph-ping {
  0% {
    transform: scale(0.6);
    opacity: 0.6;
  }
  80%, 100% {
    transform: scale(2.4);
    opacity: 0;
  }
}
</style>
