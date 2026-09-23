<script setup lang="ts">
/**
 * Store location picker — Google Places search + a draggable map pin.
 *
 * WHY THE PIN IS THE MAP CENTRE AND NOT A MARKER OBJECT
 * The pin is a fixed SVG sitting over the middle of the map; panning the map
 * moves the pin. No marker instance is created at all. `google.maps.Marker` is
 * deprecated, and its replacement (`AdvancedMarkerElement`) refuses to render
 * without a cloud-configured Map ID — a second setup step, for a control that
 * is worse on a phone anyway. Centre-pin is also what every ride-hailing and
 * delivery app does, so a retailer pinning their shop on a phone already knows
 * this gesture.
 *
 * WHY THE LEGACY AUTOCOMPLETE WIDGET IS NOT USED
 * `google.maps.places.Autocomplete` is unavailable to Google Cloud projects
 * created after March 2025, which is every project this will ever run under.
 * `PlaceAutocompleteElement` (Places API New) is the only option. Its select
 * event was renamed mid-2025, so both names are bound — an unbound rename is
 * a silently dead search box, which is exactly the failure a visitor cannot
 * report usefully.
 *
 * NO KEY -> NO DEAD PAGE
 * With `GOOGLE_API_NAVITAG_COM_PUBLIC` unset the whole Google path is skipped
 * and the field degrades to a plain "paste your Google Maps link" input. The
 * API parses coordinates out of a pasted link where it can, so a submission
 * made before the key exists is not a lost submission.
 */
import type { MapPinValue } from '~/utils/partnerForm'

const model = defineModel<MapPinValue>({ required: true })

interface Props {
  /** ISO alpha-2 — biases search results to the visitor's country. */
  countryCode?: string | null
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), { countryCode: null, disabled: false })

const config = useRuntimeConfig()
const apiKey = computed(() => String(config.public.googleMapsKey || ''))
const hasKey = computed(() => apiKey.value.length > 0)

const mapEl = ref<HTMLElement | null>(null)
const searchEl = ref<HTMLElement | null>(null)
const status = ref<'idle' | 'loading' | 'ready' | 'failed'>('idle')
const locating = ref(false)
const notice = ref('')

// Metro Manila. Only ever the opening view — a visitor whose country resolved
// elsewhere gets recentred by the geolocate button or by their first search.
const DEFAULT_CENTRE = { lat: 14.5547, lng: 121.0244 }
const DEFAULT_ZOOM = 12
const PINNED_ZOOM = 17

let map: any = null
let geocoder: any = null
let centreDebounce: ReturnType<typeof setTimeout> | null = null

const hasPin = computed(() => model.value.lat !== null && model.value.lng !== null)
const prettyCoords = computed(() =>
  hasPin.value ? `${model.value.lat!.toFixed(6)}, ${model.value.lng!.toFixed(6)}` : '',
)

/* ── Google Maps bootstrap ──────────────────────────────────────────── */

let loaderPromise: Promise<void> | null = null

function loadMapsApi(): Promise<void> {
  if (loaderPromise) return loaderPromise
  loaderPromise = new Promise<void>((resolve, reject) => {
    const w = window as any
    if (w.google?.maps) { resolve(); return }

    const callbackName = '__navitagMapsReady'
    w[callbackName] = () => resolve()

    const script = document.createElement('script')
    const params = new URLSearchParams({
      key: apiKey.value,
      v: 'weekly',
      libraries: 'places,geocoding',
      loading: 'async',
      callback: callbackName,
    })
    // Region + language bias the geocoder's interpretation of ambiguous names
    // ("Santa Rosa" resolves very differently in PH and in the US).
    if (props.countryCode) params.set('region', props.countryCode)
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`
    script.async = true
    script.onerror = () => reject(new Error('maps script failed to load'))
    document.head.appendChild(script)
  })
  return loaderPromise
}

async function initMap() {
  if (!hasKey.value || !mapEl.value) return
  status.value = 'loading'
  try {
    await loadMapsApi()
    const g = (window as any).google

    const centre = hasPin.value
      ? { lat: model.value.lat!, lng: model.value.lng! }
      : DEFAULT_CENTRE

    map = new g.maps.Map(mapEl.value, {
      center: centre,
      zoom: hasPin.value ? PINNED_ZOOM : DEFAULT_ZOOM,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      clickableIcons: false,
    })
    geocoder = new g.maps.Geocoder()

    // Panning is continuous; only the settled centre is worth a reverse
    // geocode, so the write is debounced rather than fired per frame.
    map.addListener('center_changed', () => {
      if (centreDebounce) clearTimeout(centreDebounce)
      centreDebounce = setTimeout(commitCentre, 450)
    })

    mountAutocomplete(g)
    status.value = 'ready'
  }
  catch (err) {
    console.error('[partner-listing] map init failed', err)
    status.value = 'failed'
  }
}

function mountAutocomplete(g: any) {
  const PlaceAutocompleteElement = g.maps.places?.PlaceAutocompleteElement
  if (!PlaceAutocompleteElement || !searchEl.value) return

  const el: any = new PlaceAutocompleteElement(
    props.countryCode
      ? { includedRegionCodes: [props.countryCode.toLowerCase()] }
      : {},
  )
  el.style.width = '100%'
  searchEl.value.replaceChildren(el)

  // Google renamed this event from `gmp-placeselect` to `gmp-select` in 2025.
  // Both are bound; whichever the loaded weekly build emits is the one that
  // fires, and a future rename degrades to "search does nothing" rather than
  // throwing.
  const onSelect = async (event: any) => {
    try {
      const place = event?.placePrediction?.toPlace?.() ?? event?.place
      if (!place) return
      await place.fetchFields({ fields: ['location', 'formattedAddress', 'id', 'displayName'] })
      const loc = place.location
      if (!loc) return
      setPin(
        typeof loc.lat === 'function' ? loc.lat() : loc.lat,
        typeof loc.lng === 'function' ? loc.lng() : loc.lng,
        { placeId: place.id ?? '', address: place.formattedAddress ?? '' },
      )
      map?.setCenter({ lat: model.value.lat!, lng: model.value.lng! })
      map?.setZoom(PINNED_ZOOM)
    }
    catch (err) {
      console.error('[partner-listing] place select failed', err)
    }
  }
  el.addEventListener('gmp-select', onSelect)
  el.addEventListener('gmp-placeselect', onSelect)
}

/* ── Pin state ──────────────────────────────────────────────────────── */

function setPin(lat: number, lng: number, extra: { placeId?: string, address?: string } = {}) {
  model.value = {
    lat,
    lng,
    link: `https://www.google.com/maps?q=${lat},${lng}`,
    place_id: extra.placeId ?? '',
    formatted_address: extra.address ?? '',
  }
  notice.value = ''
}

/**
 * Take the map's settled centre as the pin, then ask the geocoder what is
 * there. A reverse-geocode failure is silent: the coordinates are the answer
 * that matters and a missing street string must not block the submission.
 */
function commitCentre() {
  if (!map) return
  const c = map.getCenter()
  if (!c) return
  const lat = c.lat()
  const lng = c.lng()

  // Panning by hand invalidates the place we matched earlier — the pin is no
  // longer that Place, so the id is cleared rather than left pointing at a
  // location the retailer has moved away from.
  model.value = {
    lat,
    lng,
    link: `https://www.google.com/maps?q=${lat},${lng}`,
    place_id: '',
    formatted_address: model.value.formatted_address,
  }

  geocoder?.geocode({ location: { lat, lng } }, (results: any[], resultStatus: string) => {
    if (resultStatus === 'OK' && results?.[0]) {
      model.value = { ...model.value, formatted_address: results[0].formatted_address ?? '' }
    }
  })
}

function useMyLocation() {
  if (!navigator.geolocation || locating.value) return
  locating.value = true
  notice.value = ''
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      locating.value = false
      const { latitude, longitude } = pos.coords
      setPin(latitude, longitude)
      if (map) {
        map.setCenter({ lat: latitude, lng: longitude })
        map.setZoom(PINNED_ZOOM)
      }
      commitCentre()
    },
    () => {
      locating.value = false
      notice.value = 'Could not read your location. Check the browser permission, or pan the map to your shop.'
    },
    { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
  )
}

/**
 * Fallback path: parse coordinates out of a pasted Google Maps URL so a pin
 * exists even without the JS API. Mirrors PartnerListing::coordsFromMapUrl —
 * the server re-parses independently and does not trust what arrives here.
 * Shortened maps.app.goo.gl links carry no coordinates and resolve only by
 * following a redirect, which neither side does; the link is still stored.
 */
function parsePastedLink(url: string) {
  const patterns = [
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /[?&](?:q|ll|query|destination|center)=(-?\d+\.\d+)(?:%2C|,)\s*(-?\d+\.\d+)/i,
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
  ]
  for (const re of patterns) {
    const m = url.match(re)
    if (m) {
      const lat = Number(m[1])
      const lng = Number(m[2])
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        model.value = { ...model.value, lat, lng }
        return
      }
    }
  }
  model.value = { ...model.value, lat: null, lng: null }
}

watch(() => model.value.link, (link) => {
  if (status.value !== 'ready' && link) parsePastedLink(link)
})

onMounted(() => { if (hasKey.value) initMap() })
onBeforeUnmount(() => { if (centreDebounce) clearTimeout(centreDebounce) })
</script>

<template>
  <div class="mt-2.5">
    <!-- ── Google path ─────────────────────────────────────────────── -->
    <template v-if="hasKey && status !== 'failed'">
      <p class="mb-2 text-[12.5px] text-gray-500">
        Search for your shop, then drag the map so the pin sits on your door.
      </p>
      <div ref="searchEl" class="partner-map-search mb-2"></div>

      <div class="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
        <div ref="mapEl" class="w-full h-[260px] sm:h-[320px]"></div>

        <!-- Fixed centre pin. pointer-events-none so every gesture reaches the
             map underneath; the -translate-y puts the point of the pin, not its
             middle, on the map centre. -->
        <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
          <svg
            width="34" height="44" viewBox="0 0 34 44"
            class="-translate-y-[18px] drop-shadow-lg"
            aria-hidden="true"
          >
            <path
              d="M17 1C8.7 1 2 7.7 2 16c0 10.5 13.3 25.2 13.9 25.8a1.5 1.5 0 0 0 2.2 0C18.7 41.2 32 26.5 32 16 32 7.7 25.3 1 17 1z"
              fill="#0076F5" stroke="#fff" stroke-width="2"
            />
            <circle cx="17" cy="16" r="5.5" fill="#fff" />
          </svg>
        </div>

        <div
          v-if="status === 'loading'"
          class="absolute inset-0 flex items-center justify-center bg-gray-100 text-[13px] text-gray-500"
        >
          <i class="fas fa-circle-notch fa-spin mr-2"></i>Loading map…
        </div>
      </div>

      <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          :disabled="disabled || locating || status !== 'ready'"
          class="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-navitag-blue hover:text-[#006ADB] disabled:text-gray-300 transition"
          @click="useMyLocation"
        >
          <i :class="locating ? 'fas fa-circle-notch fa-spin' : 'fas fa-location-crosshairs'" class="text-[11px]"></i>
          {{ locating ? 'Locating…' : 'Use my current location' }}
        </button>
        <span v-if="hasPin" class="text-[12px] text-gray-500 font-mono">{{ prettyCoords }}</span>
      </div>

      <p v-if="model.formatted_address" class="mt-1.5 text-[12.5px] text-gray-500">
        <i class="fas fa-map-pin text-[11px] mr-1"></i>{{ model.formatted_address }}
      </p>
      <p v-if="notice" class="mt-1.5 text-[12.5px] text-amber-700">{{ notice }}</p>
    </template>

    <!-- ── No-key fallback ─────────────────────────────────────────── -->
    <template v-else>
      <input
        v-model="model.link"
        type="url"
        inputmode="url"
        autocomplete="off"
        :disabled="disabled"
        aria-label="Google Maps link to your store"
        class="block w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] text-gray-950 focus:outline-none focus:ring-2 focus:ring-navitag-blue/30 focus:border-navitag-blue transition disabled:bg-gray-50"
      >
      <p class="mt-1.5 text-[12.5px] text-gray-500">
        Open Google Maps, find your store, tap <strong>Share</strong> → <strong>Copy link</strong>, and paste it here.
      </p>
      <p v-if="hasPin" class="mt-1 text-[12px] text-green-700">
        <i class="fas fa-check text-[11px] mr-1"></i>Location read from the link — {{ prettyCoords }}
      </p>
    </template>
  </div>
</template>

<style scoped>
/* PlaceAutocompleteElement renders its own input in shadow DOM. Only the host
   element is reachable from here, so the field's chrome is drawn on the
   wrapper and the widget is told to fill it. */
.partner-map-search :deep(gmp-place-autocomplete) {
  width: 100%;
  --gmp-place-autocomplete-input-border-radius: 0.75rem;
}
</style>
