<script setup lang="ts">
import { REGIONS as CONFIG_REGIONS, GLOBAL_REGION_META } from '~/config/regions'
import { useBasicStore } from '~/stores/basicStore'

interface Region {
  code: string
  name: string
  /** ISO 3166-1 alpha-2 codes that map to this region. */
  countries: string[]
  /** Destination path when the user switches to this region. */
  path: string
}

// Derived from the single region registry in `app/config/regions.ts`.
// Global ("/") is the implicit fallback for any country without a dedicated site.
const REGIONS: Region[] = [
  { code: GLOBAL_REGION_META.code, name: GLOBAL_REGION_META.displayName, countries: [], path: GLOBAL_REGION_META.basePath },
  ...Object.values(CONFIG_REGIONS).map(r => ({
    code: r.code.toLowerCase(),
    name: r.displayName,
    countries: r.countries,
    path: r.basePath,
  })),
]

const FALLBACK_REGION = REGIONS[0]!

const route = useRoute()

const { hasEquivalent, toRegionalPath } = useRegionRoutes()
const basic = useBasicStore()
const visible = ref(false)

const currentRegion = computed<Region>(() => {
  // Match the longest path prefix first so nested routes are handled correctly.
  const sorted = [...REGIONS].sort((a, b) => b.path.length - a.path.length)
  for (const r of sorted) {
    if (r.path !== '/' && (route.path === r.path || route.path.startsWith(`${r.path}/`))) {
      return r
    }
  }
  return FALLBACK_REGION
})

const suggestedRegion = computed<Region | null>(() => {
  if (!basic.country) return null
  const match = REGIONS.find(r => r.countries.includes(basic.country!))
  return match || FALLBACK_REGION
})

const shouldShow = computed(() => {
  if (!suggestedRegion.value) return false
  if (suggestedRegion.value.code === currentRegion.value.code) return false
  // Only suggest a region that actually has an equivalent page for the current route.
  return hasEquivalent(route.path, suggestedRegion.value.path)
})

// Target the specific equivalent page in the suggested region (not just its root).
const suggestedHref = computed(() =>
  suggestedRegion.value ? toRegionalPath(route.path, suggestedRegion.value.path) : '/',
)

// Kick off country resolution once (idempotent via useState).
onMounted(() => { basic.resolveCountry() })

// React to both initial state and subsequent route/country changes so that
// when the user navigates from a matching region into a mismatching one,
// the banner re-appears — and hides again when they navigate back.
// Dismissal state lives in the Pinia store, which resets on every SPA boot.
let showTimer: ReturnType<typeof setTimeout> | null = null

watch(
  [shouldShow, () => basic.bannerDismissed],
  ([now, dismissed]) => {
    if (showTimer) { clearTimeout(showTimer); showTimer = null }
    if (!now || dismissed) { visible.value = false; return }
    showTimer = setTimeout(() => {
      if (shouldShow.value && !basic.bannerDismissed) visible.value = true
    }, 450)
  },
  { immediate: true },
)

function dismiss() {
  basic.dismissBanner()
  visible.value = false
}

// Publish the banner's live height as a CSS variable so full-bleed sections
// (e.g. hero cover) can compensate their max-height when the banner is visible.
const BANNER_HEIGHT_PX = 44
watchEffect(() => {
  if (typeof document === 'undefined') return
  const active = visible.value && shouldShow.value
  document.documentElement.style.setProperty(
    '--region-banner-h',
    active ? `${BANNER_HEIGHT_PX}px` : '0px',
  )
})

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.documentElement.style.removeProperty('--region-banner-h')
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-400 ease-out"
    enter-from-class="-translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-250 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="-translate-y-full opacity-0"
  >
    <div
      v-if="visible && shouldShow"
      class="sticky top-0 z-[60] bg-gray-950 text-white h-11 flex items-center"
      role="region"
      aria-label="Region suggestion"
    >
      <div class="relative w-full max-w-7xl mx-auto px-12 sm:px-14">
        <!-- Centered message with inline link -->
        <p class="text-center text-[12.5px] sm:text-[13px] leading-snug text-white/90">
          You're on the <span class="font-semibold text-white">{{ currentRegion.name }}</span> website.
          Go to
          <NuxtLink
            :to="suggestedHref"
            class="font-semibold text-white underline underline-offset-2 decoration-white/40 hover:decoration-white transition"
            @click="visible = false"
          >
            {{ suggestedRegion?.name }}
          </NuxtLink>.
        </p>

        <!-- Dismiss -->
        <button
          type="button"
          class="absolute top-1/2 right-3 sm:right-5 -translate-y-1/2 w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center transition"
          aria-label="Dismiss"
          @click="dismiss"
        >
          <i class="fas fa-xmark text-[11px] text-white/70"></i>
        </button>
      </div>
    </div>
  </Transition>
</template>
