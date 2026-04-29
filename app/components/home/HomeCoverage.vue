<script setup lang="ts">
import type { Topology } from 'topojson-specification'
import { feature } from 'topojson-client'
import worldTopo from 'world-atlas/countries-110m.json'

interface Country {
  code: string
  numeric: number // ISO 3166-1 numeric
  name: string
  lat: number
  lng: number
}

// Simbase Global+ plan coverage (approximate). Verify against
// Simbase's current published country list before production.
const COUNTRIES: Country[] = [
  // North America
  { code: 'CA', numeric: 124, name: 'Canada', lat: 56.1, lng: -106.3 },
  { code: 'MX', numeric: 484, name: 'Mexico', lat: 23.6, lng: -102.6 },
  { code: 'US', numeric: 840, name: 'United States', lat: 37.1, lng: -95.7 },

  // Latin America & Caribbean
  { code: 'AR', numeric: 32, name: 'Argentina', lat: -38.4, lng: -63.6 },
  { code: 'BO', numeric: 68, name: 'Bolivia', lat: -16.3, lng: -63.6 },
  { code: 'BR', numeric: 76, name: 'Brazil', lat: -14.2, lng: -51.9 },
  { code: 'CL', numeric: 152, name: 'Chile', lat: -35.7, lng: -71.5 },
  { code: 'CO', numeric: 170, name: 'Colombia', lat: 4.6, lng: -74.3 },
  { code: 'CR', numeric: 188, name: 'Costa Rica', lat: 9.7, lng: -83.8 },
  { code: 'DO', numeric: 214, name: 'Dominican Republic', lat: 18.7, lng: -70.2 },
  { code: 'EC', numeric: 218, name: 'Ecuador', lat: -1.8, lng: -78.2 },
  { code: 'GT', numeric: 320, name: 'Guatemala', lat: 15.8, lng: -90.2 },
  { code: 'HN', numeric: 340, name: 'Honduras', lat: 15.2, lng: -86.2 },
  { code: 'JM', numeric: 388, name: 'Jamaica', lat: 18.1, lng: -77.3 },
  { code: 'NI', numeric: 558, name: 'Nicaragua', lat: 12.9, lng: -85.2 },
  { code: 'PA', numeric: 591, name: 'Panama', lat: 8.5, lng: -80.8 },
  { code: 'PE', numeric: 604, name: 'Peru', lat: -9.2, lng: -75.0 },
  { code: 'PR', numeric: 630, name: 'Puerto Rico', lat: 18.2, lng: -66.6 },
  { code: 'PY', numeric: 600, name: 'Paraguay', lat: -23.4, lng: -58.4 },
  { code: 'SV', numeric: 222, name: 'El Salvador', lat: 13.8, lng: -88.9 },
  { code: 'UY', numeric: 858, name: 'Uruguay', lat: -32.5, lng: -55.8 },
  { code: 'VE', numeric: 862, name: 'Venezuela', lat: 6.4, lng: -66.6 },

  // Europe
  { code: 'AL', numeric: 8, name: 'Albania', lat: 41.2, lng: 20.2 },
  { code: 'AT', numeric: 40, name: 'Austria', lat: 47.5, lng: 14.5 },
  { code: 'BA', numeric: 70, name: 'Bosnia and Herzegovina', lat: 43.9, lng: 17.7 },
  { code: 'BE', numeric: 56, name: 'Belgium', lat: 50.5, lng: 4.5 },
  { code: 'BG', numeric: 100, name: 'Bulgaria', lat: 42.7, lng: 25.5 },
  { code: 'BY', numeric: 112, name: 'Belarus', lat: 53.7, lng: 27.9 },
  { code: 'CH', numeric: 756, name: 'Switzerland', lat: 46.8, lng: 8.2 },
  { code: 'CY', numeric: 196, name: 'Cyprus', lat: 35.1, lng: 33.4 },
  { code: 'CZ', numeric: 203, name: 'Czechia', lat: 49.8, lng: 15.5 },
  { code: 'DE', numeric: 276, name: 'Germany', lat: 51.2, lng: 10.5 },
  { code: 'DK', numeric: 208, name: 'Denmark', lat: 56.3, lng: 9.5 },
  { code: 'EE', numeric: 233, name: 'Estonia', lat: 58.6, lng: 25.0 },
  { code: 'ES', numeric: 724, name: 'Spain', lat: 40.5, lng: -3.7 },
  { code: 'FI', numeric: 246, name: 'Finland', lat: 61.9, lng: 25.7 },
  { code: 'FR', numeric: 250, name: 'France', lat: 46.2, lng: 2.2 },
  { code: 'GB', numeric: 826, name: 'United Kingdom', lat: 55.4, lng: -3.4 },
  { code: 'GR', numeric: 300, name: 'Greece', lat: 39.1, lng: 21.8 },
  { code: 'HR', numeric: 191, name: 'Croatia', lat: 45.1, lng: 15.2 },
  { code: 'HU', numeric: 348, name: 'Hungary', lat: 47.2, lng: 19.5 },
  { code: 'IE', numeric: 372, name: 'Ireland', lat: 53.4, lng: -8.2 },
  { code: 'IS', numeric: 352, name: 'Iceland', lat: 64.96, lng: -19.02 },
  { code: 'IT', numeric: 380, name: 'Italy', lat: 41.9, lng: 12.6 },
  { code: 'LT', numeric: 440, name: 'Lithuania', lat: 55.2, lng: 23.9 },
  { code: 'LU', numeric: 442, name: 'Luxembourg', lat: 49.8, lng: 6.1 },
  { code: 'LV', numeric: 428, name: 'Latvia', lat: 56.9, lng: 24.6 },
  { code: 'MD', numeric: 498, name: 'Moldova', lat: 47.4, lng: 28.4 },
  { code: 'ME', numeric: 499, name: 'Montenegro', lat: 42.7, lng: 19.4 },
  { code: 'MK', numeric: 807, name: 'North Macedonia', lat: 41.6, lng: 21.7 },
  { code: 'MT', numeric: 470, name: 'Malta', lat: 35.9, lng: 14.4 },
  { code: 'NL', numeric: 528, name: 'Netherlands', lat: 52.1, lng: 5.3 },
  { code: 'NO', numeric: 578, name: 'Norway', lat: 60.5, lng: 8.5 },
  { code: 'PL', numeric: 616, name: 'Poland', lat: 51.9, lng: 19.1 },
  { code: 'PT', numeric: 620, name: 'Portugal', lat: 39.4, lng: -8.2 },
  { code: 'RO', numeric: 642, name: 'Romania', lat: 45.9, lng: 24.97 },
  { code: 'RS', numeric: 688, name: 'Serbia', lat: 44.02, lng: 21.0 },
  { code: 'SE', numeric: 752, name: 'Sweden', lat: 60.1, lng: 18.6 },
  { code: 'SI', numeric: 705, name: 'Slovenia', lat: 46.2, lng: 14.99 },
  { code: 'SK', numeric: 703, name: 'Slovakia', lat: 48.7, lng: 19.7 },
  { code: 'UA', numeric: 804, name: 'Ukraine', lat: 48.4, lng: 31.2 },

  // Caucasus & Middle East
  { code: 'AE', numeric: 784, name: 'United Arab Emirates', lat: 24.0, lng: 54.0 },
  { code: 'AM', numeric: 51, name: 'Armenia', lat: 40.1, lng: 45.04 },
  { code: 'AZ', numeric: 31, name: 'Azerbaijan', lat: 40.1, lng: 47.6 },
  { code: 'BH', numeric: 48, name: 'Bahrain', lat: 26.07, lng: 50.6 },
  { code: 'GE', numeric: 268, name: 'Georgia', lat: 42.3, lng: 43.4 },
  { code: 'IL', numeric: 376, name: 'Israel', lat: 31.0, lng: 34.9 },
  { code: 'JO', numeric: 400, name: 'Jordan', lat: 30.6, lng: 36.2 },
  { code: 'KW', numeric: 414, name: 'Kuwait', lat: 29.3, lng: 47.5 },
  { code: 'LB', numeric: 422, name: 'Lebanon', lat: 33.9, lng: 35.9 },
  { code: 'OM', numeric: 512, name: 'Oman', lat: 21.5, lng: 55.9 },
  { code: 'QA', numeric: 634, name: 'Qatar', lat: 25.4, lng: 51.2 },
  { code: 'SA', numeric: 682, name: 'Saudi Arabia', lat: 23.9, lng: 45.1 },
  { code: 'TR', numeric: 792, name: 'Turkey', lat: 38.96, lng: 35.2 },

  // Africa
  { code: 'AO', numeric: 24, name: 'Angola', lat: -11.2, lng: 17.9 },
  { code: 'CI', numeric: 384, name: "Côte d'Ivoire", lat: 7.5, lng: -5.5 },
  { code: 'CM', numeric: 120, name: 'Cameroon', lat: 7.4, lng: 12.3 },
  { code: 'DZ', numeric: 12, name: 'Algeria', lat: 28.03, lng: 1.6 },
  { code: 'EG', numeric: 818, name: 'Egypt', lat: 26.8, lng: 30.8 },
  { code: 'GH', numeric: 288, name: 'Ghana', lat: 7.9, lng: -1.02 },
  { code: 'KE', numeric: 404, name: 'Kenya', lat: -0.02, lng: 37.9 },
  { code: 'MA', numeric: 504, name: 'Morocco', lat: 31.8, lng: -7.09 },
  { code: 'MU', numeric: 480, name: 'Mauritius', lat: -20.3, lng: 57.5 },
  { code: 'MZ', numeric: 508, name: 'Mozambique', lat: -18.7, lng: 35.5 },
  { code: 'NG', numeric: 566, name: 'Nigeria', lat: 9.08, lng: 8.7 },
  { code: 'SN', numeric: 686, name: 'Senegal', lat: 14.5, lng: -14.5 },
  { code: 'TN', numeric: 788, name: 'Tunisia', lat: 33.9, lng: 9.5 },
  { code: 'TZ', numeric: 834, name: 'Tanzania', lat: -6.4, lng: 34.9 },
  { code: 'UG', numeric: 800, name: 'Uganda', lat: 1.4, lng: 32.3 },
  { code: 'ZA', numeric: 710, name: 'South Africa', lat: -30.6, lng: 22.9 },
  { code: 'ZM', numeric: 894, name: 'Zambia', lat: -13.1, lng: 27.8 },
  { code: 'ZW', numeric: 716, name: 'Zimbabwe', lat: -19.02, lng: 29.2 },

  // Asia
  { code: 'BD', numeric: 50, name: 'Bangladesh', lat: 23.7, lng: 90.4 },
  { code: 'CN', numeric: 156, name: 'China', lat: 35.9, lng: 104.2 },
  { code: 'HK', numeric: 344, name: 'Hong Kong', lat: 22.3, lng: 114.2 },
  { code: 'ID', numeric: 360, name: 'Indonesia', lat: -0.8, lng: 113.9 },
  { code: 'IN', numeric: 356, name: 'India', lat: 20.6, lng: 78.96 },
  { code: 'JP', numeric: 392, name: 'Japan', lat: 36.2, lng: 138.3 },
  { code: 'KG', numeric: 417, name: 'Kyrgyzstan', lat: 41.2, lng: 74.8 },
  { code: 'KH', numeric: 116, name: 'Cambodia', lat: 12.6, lng: 104.99 },
  { code: 'KR', numeric: 410, name: 'South Korea', lat: 35.9, lng: 127.8 },
  { code: 'KZ', numeric: 398, name: 'Kazakhstan', lat: 48.0, lng: 66.9 },
  { code: 'LA', numeric: 418, name: 'Laos', lat: 19.9, lng: 102.5 },
  { code: 'LK', numeric: 144, name: 'Sri Lanka', lat: 7.9, lng: 80.8 },
  { code: 'MM', numeric: 104, name: 'Myanmar', lat: 21.9, lng: 95.96 },
  { code: 'MY', numeric: 458, name: 'Malaysia', lat: 4.2, lng: 101.9 },
  { code: 'NP', numeric: 524, name: 'Nepal', lat: 28.4, lng: 84.1 },
  { code: 'PH', numeric: 608, name: 'Philippines', lat: 12.9, lng: 121.8 },
  { code: 'PK', numeric: 586, name: 'Pakistan', lat: 30.4, lng: 69.3 },
  { code: 'SG', numeric: 702, name: 'Singapore', lat: 1.4, lng: 103.8 },
  { code: 'TH', numeric: 764, name: 'Thailand', lat: 15.9, lng: 100.99 },
  { code: 'TW', numeric: 158, name: 'Taiwan', lat: 23.7, lng: 121.0 },
  { code: 'UZ', numeric: 860, name: 'Uzbekistan', lat: 41.4, lng: 64.6 },
  { code: 'VN', numeric: 704, name: 'Vietnam', lat: 14.06, lng: 108.3 },

  // Oceania
  { code: 'AU', numeric: 36, name: 'Australia', lat: -25.3, lng: 133.8 },
  { code: 'FJ', numeric: 242, name: 'Fiji', lat: -17.7, lng: 178.07 },
  { code: 'NZ', numeric: 554, name: 'New Zealand', lat: -40.9, lng: 174.9 },
  { code: 'PG', numeric: 598, name: 'Papua New Guinea', lat: -6.3, lng: 143.96 },
]

const coveredIds = new Set(COUNTRIES.map(c => c.numeric))

// SVG viewBox — equirectangular world projection.
// Full world coordinates: x ∈ [0, VB_W], y ∈ [0, VB_H]
// We clip the displayed viewBox tightly to inhabited latitudes
// (~72°N to ~56°S) so empty polar ocean doesn't create dead space.
const VB_W = 1000
const VB_H = 500
const VB_Y_TOP = ((90 - 72) / 180) * VB_H // lat 72°N
const VB_Y_BOT = ((90 - -56) / 180) * VB_H // lat 56°S
const VB_H_VISIBLE = VB_Y_BOT - VB_Y_TOP

function projectPoint(lng: number, lat: number): [number, number] {
  return [((lng + 180) / 360) * VB_W, ((90 - lat) / 180) * VB_H]
}

function project(lat: number, lng: number) {
  const [x, y] = projectPoint(lng, lat)
  return { x, y }
}

function ringToPath(ring: number[][]): string {
  if (!ring.length) return ''
  // Split the ring at antimeridian crossings (lng jumps > 180°) to avoid
  // horizontal lines stretching across the map for countries like Russia/Fiji.
  const segments: string[] = []
  let current = ''
  let prevLng: number | null = null

  for (let i = 0; i < ring.length; i++) {
    const lng = ring[i]![0]!
    const lat = ring[i]![1]!
    if (prevLng !== null && Math.abs(lng - prevLng) > 180) {
      if (current) segments.push(current + 'Z')
      current = ''
    }
    const [x, y] = projectPoint(lng, lat)
    current += (current ? 'L' : 'M') + `${x.toFixed(2)},${y.toFixed(2)}`
    prevLng = lng
  }
  if (current) segments.push(current + 'Z')
  return segments.join(' ')
}

interface GeomPolygon {
  type: 'Polygon'
  coordinates: number[][][]
}
interface GeomMultiPolygon {
  type: 'MultiPolygon'
  coordinates: number[][][][]
}
type AnyGeom = GeomPolygon | GeomMultiPolygon

function geometryToPath(geom: AnyGeom): string {
  if (geom.type === 'Polygon') {
    return geom.coordinates.map(ring => ringToPath(ring)).join(' ')
  }
  if (geom.type === 'MultiPolygon') {
    return geom.coordinates.flatMap(poly => poly.map(ring => ringToPath(ring))).join(' ')
  }
  return ''
}

// Convert TopoJSON → feature array once (static).
interface MapCountry {
  id: number
  name: string
  d: string
  covered: boolean
}

const mapCountries: MapCountry[] = (() => {
  const topo = worldTopo as unknown as Topology
  const fc = feature(topo, topo.objects.countries as never) as unknown as {
    features: { id: number | string; properties?: { name?: string }; geometry: AnyGeom }[]
  }
  return fc.features.map((f) => {
    const id = typeof f.id === 'string' ? parseInt(f.id, 10) : f.id
    return {
      id,
      name: f.properties?.name || '',
      d: geometryToPath(f.geometry),
      covered: coveredIds.has(id),
    }
  })
})()

// Search state
const query = ref('')
const selectedCode = ref<string | null>(null)
const showDropdown = ref(false)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return COUNTRIES.slice().sort((a, b) => a.name.localeCompare(b.name)).slice(0, 8)
  return COUNTRIES
    .filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q)
    .sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1
      const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1
      return aStarts - bStarts || a.name.localeCompare(b.name)
    })
    .slice(0, 8)
})

const selected = computed(() =>
  COUNTRIES.find(c => c.code === selectedCode.value) || null,
)

const selectedCountryPath = computed(() => {
  if (!selected.value) return null
  const match = mapCountries.find(c => c.id === selected.value!.numeric)
  return match?.d || null
})

function selectCountry(c: Country) {
  selectedCode.value = c.code
  query.value = c.name
  showDropdown.value = false
  ;(document.activeElement as HTMLElement)?.blur()
}

function clearSelection() {
  selectedCode.value = null
  query.value = ''
}

function onInput() {
  selectedCode.value = null
  showDropdown.value = true
}

function onFocus() {
  showDropdown.value = true
}

function onBlur() {
  setTimeout(() => {
    showDropdown.value = false
  }, 150)
}
</script>

<template>
  <section id="coverage" class="relative bg-white py-20 sm:py-28 lg:py-32 scroll-mt-20">
    <div class="max-w-7xl mx-auto px-6 sm:px-8">
      <!-- Heading -->
      <div class="max-w-3xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navitag-blue/10 text-navitag-blue text-[11px] font-semibold tracking-[0.15em] uppercase">
          Global coverage
        </div>
        <h2 class="mt-5 text-4xl sm:text-5xl lg:text-[56px] font-semibold tracking-tight leading-[1.05] text-gray-950">
          Works in <span class="text-navitag-blue">100+ countries</span>, <br class="hidden sm:block">out of the box.
        </h2>
        <p class="mt-5 text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
          Search for a country to confirm coverage. Your Navitag device will automatically connect to the strongest local network on arrival.
        </p>
      </div>

      <!-- Search + Map card -->
      <div class="mt-12 lg:mt-16 relative">
        <!-- Search bar (sits above the map) -->
        <div class="relative z-20 max-w-lg mx-auto lg:mx-0">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
              <i class="fas fa-search text-[13px]"></i>
            </div>
            <input
              v-model="query"
              type="text"
              placeholder="Search a country…"
              autocomplete="off"
              aria-label="Search for a country"
              class="w-full pl-12 pr-10 py-3.5 rounded-full bg-white border border-gray-200 shadow-lg shadow-gray-200/60 text-[15px] text-gray-950 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navitag-blue/30 focus:border-navitag-blue transition"
              @input="onInput"
              @focus="onFocus"
              @blur="onBlur"
            >
            <button
              v-if="query"
              class="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-gray-700 transition"
              aria-label="Clear"
              @mousedown.prevent="clearSelection"
            >
              <i class="fas fa-xmark text-[13px]"></i>
            </button>
          </div>

          <!-- Suggestions dropdown -->
          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1"
          >
            <div
              v-if="showDropdown && filtered.length"
              class="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-gray-300/50 overflow-hidden"
            >
              <div class="px-5 py-2.5 text-[10px] uppercase tracking-[0.18em] font-semibold text-gray-400 border-b border-gray-100">
                {{ query ? 'Matches' : 'Popular' }}
              </div>
              <ul class="max-h-72 overflow-y-auto">
                <li
                  v-for="c in filtered"
                  :key="c.code"
                >
                  <button
                    class="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 transition-colors"
                    @mousedown.prevent="selectCountry(c)"
                  >
                    <span class="w-7 h-7 rounded-md bg-navitag-blue/10 text-navitag-blue text-[10px] font-semibold tracking-wider flex items-center justify-center">
                      {{ c.code }}
                    </span>
                    <span class="text-[14.5px] text-gray-950 font-medium flex-1">{{ c.name }}</span>
                    <span class="text-[11px] text-green-600 font-semibold">
                      <i class="fas fa-circle-check mr-1"></i>Covered
                    </span>
                  </button>
                </li>
              </ul>
            </div>
          </Transition>
        </div>

        <!-- Map canvas -->
        <div class="relative mt-5 rounded-3xl overflow-hidden border border-gray-100 bg-gradient-to-br from-[#F7F8FA] via-white to-[#F7F4EF]">
          <div class="relative aspect-[1000/355]">
            <svg
              :viewBox="`0 ${VB_Y_TOP} ${VB_W} ${VB_H_VISIBLE}`"
              class="absolute inset-0 w-full h-full"
              role="img"
              aria-label="World coverage map"
              preserveAspectRatio="xMidYMid meet"
            >
              <!-- Uncovered countries -->
              <g>
                <path
                  v-for="c in mapCountries"
                  v-show="!c.covered"
                  :key="`u-${c.id}`"
                  :d="c.d"
                  class="fill-gray-200/90"
                  stroke="white"
                  stroke-width="0.4"
                  stroke-linejoin="round"
                />
              </g>

              <!-- Covered countries -->
              <g>
                <path
                  v-for="c in mapCountries"
                  v-show="c.covered"
                  :key="`c-${c.id}`"
                  :d="c.d"
                  class="fill-navitag-blue"
                  stroke="white"
                  stroke-width="0.5"
                  stroke-linejoin="round"
                />
              </g>

              <!-- Selected country highlight (stroke glow) -->
              <path
                v-if="selectedCountryPath"
                :d="selectedCountryPath"
                class="fill-navitag-orange"
                stroke="#fff"
                stroke-width="1"
                stroke-linejoin="round"
              />

              <!-- Selected pulse marker -->
              <g
                v-if="selected"
                :transform="`translate(${project(selected.lat, selected.lng).x}, ${project(selected.lat, selected.lng).y})`"
              >
                <circle cx="0" cy="0" r="14" class="coverage-pulse fill-navitag-orange/40" />
                <circle
                  cx="0"
                  cy="0"
                  r="5"
                  class="fill-navitag-orange"
                  stroke="white"
                  stroke-width="1.5"
                />
              </g>
            </svg>

            <!-- Legend -->
            <div class="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full border border-gray-100 px-4 py-2 flex items-center gap-4 text-[11px] font-medium text-gray-600 shadow-sm">
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-sm bg-navitag-blue"></span>Covered
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-sm bg-gray-200 border border-gray-300"></span>Not included
              </span>
            </div>
          </div>

          <!-- Selection info card -->
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-2"
          >
            <div
              v-if="selected"
              class="absolute bottom-4 left-4 max-w-xs bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-300/40 p-4"
            >
              <div class="flex items-start gap-3">
                <span class="w-10 h-10 shrink-0 rounded-lg bg-navitag-blue/10 text-navitag-blue text-[11px] font-bold tracking-wider flex items-center justify-center">
                  {{ selected.code }}
                </span>
                <div class="min-w-0">
                  <div class="text-[11px] uppercase tracking-[0.15em] text-green-600 font-semibold">
                    <i class="fas fa-circle-check mr-1"></i>Covered
                  </div>
                  <div class="mt-0.5 text-[15px] font-semibold text-gray-950 tracking-tight truncate">
                    {{ selected.name }}
                  </div>
                  <div class="mt-1 text-[12.5px] text-gray-500">
                    Multi-carrier M2M · 2G / 3G / 4G / 5G
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Counters -->
        <div class="mt-6 grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl">
          <div class="text-center sm:text-left">
            <div class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-950">100+</div>
            <div class="text-[12px] uppercase tracking-[0.15em] text-gray-400 font-semibold mt-1">Countries</div>
          </div>
          <div class="text-center sm:text-left">
            <div class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-950">600+</div>
            <div class="text-[12px] uppercase tracking-[0.15em] text-gray-400 font-semibold mt-1">Carriers</div>
          </div>
          <div class="text-center sm:text-left">
            <div class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-950">2G–5G</div>
            <div class="text-[12px] uppercase tracking-[0.15em] text-gray-400 font-semibold mt-1">Multi-gen</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.coverage-pulse {
  transform-origin: 0 0;
  transform-box: fill-box;
  animation: coverage-ping 1.8s ease-out infinite;
}
@keyframes coverage-ping {
  0% {
    transform: scale(0.6);
    opacity: 0.6;
  }
  80%,
  100% {
    transform: scale(2.6);
    opacity: 0;
  }
}
</style>
