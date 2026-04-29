<script setup lang="ts">
type Slide = { wide: string; narrow: string; alt: string }

const BASE = 'https://photos.navitag.net/dump/banners'

const slides: Slide[] = Array.from({ length: 6 }, (_, i) => {
  const n = i + 1
  return {
    wide: `${BASE}/navitag-store-banner-${n}.webp`,
    narrow: `${BASE}/navitag-store-banner-${n}-narrow.webp`,
    alt: `Navitag tracker scene ${n}`,
  }
})

const route = useRoute()
const isPh = computed(() => route.path === '/ph' || route.path.startsWith('/ph/'))
const dataPlansHref = computed(() => (isPh.value ? '/ph/data-plans' : '/data-plans'))
const businessHref = computed(() => (isPh.value ? '/ph/business' : '/business'))

const current = ref(0)
const isPaused = ref(false)
const AUTOPLAY_MS = 6000
// Autoplay temporarily disabled — flip to true to resume.
const AUTOPLAY_ENABLED = false
let timer: ReturnType<typeof setInterval> | null = null

function go(idx: number) {
  current.value = (idx + slides.length) % slides.length
}

function scrollToCoverage(e: Event) {
  e.preventDefault()
  if (typeof document === 'undefined') return
  const target = document.getElementById('coverage')
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function next() {
  go(current.value + 1)
}

function start() {
  stop()
  if (!AUTOPLAY_ENABLED) return
  timer = setInterval(() => {
    if (!isPaused.value && typeof document !== 'undefined' && !document.hidden) next()
  }, AUTOPLAY_MS)
}

function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onMounted(start)
onBeforeUnmount(stop)
</script>

<template>
  <section
    class="relative w-full overflow-hidden bg-gray-900"
    aria-roledescription="carousel"
    aria-label="Navitag highlights"
    @mouseenter="isPaused = true"
    @mouseleave="isPaused = false"
  >
    <!-- Aspect ratio matches the source images per breakpoint so they
         resize without being cropped. Narrow set: 852/446. Wide set: 1587/446. -->
    <div class="relative w-full aspect-[852/446] md:aspect-[1587/446]">
      <div
        v-for="(slide, idx) in slides"
        :key="idx"
        class="absolute inset-0 transition-opacity duration-700 ease-out"
        :class="idx === current ? 'opacity-100' : 'opacity-0 pointer-events-none'"
        :aria-hidden="idx !== current"
      >
        <picture class="block w-full h-full">
          <source media="(min-width: 768px)" :srcset="slide.wide">
          <img
            :src="slide.narrow"
            :alt="slide.alt"
            class="w-full h-full object-cover select-none"
            :loading="idx === 0 ? 'eager' : 'lazy'"
            :fetchpriority="idx === 0 ? 'high' : 'auto'"
            decoding="async"
            draggable="false"
          >
        </picture>

        <!-- Per-slide overlays -->
        <template v-if="idx === 3">
          <!-- Right-side legibility scrim -->
          <div
            class="absolute inset-y-0 right-0 w-3/4 sm:w-2/3 md:w-1/2 bg-gradient-to-l from-black/70 via-black/40 to-transparent"
            aria-hidden="true"
          />
          <div class="absolute inset-0 flex items-center">
            <div class="w-full max-w-7xl mx-auto px-4 sm:px-8">
              <div class="ml-auto max-w-[65%] md:max-w-md text-right text-white">
                <h2 class="text-base sm:text-xl md:text-3xl font-semibold tracking-tight leading-[1.1]">
                  Go Beyond with built-in<br>Multi-Network Coverage.
                </h2>
                <a
                  href="#coverage"
                  class="mt-3 sm:mt-4 md:mt-5 inline-flex items-center gap-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full bg-navitag-blue text-white text-xs sm:text-sm font-semibold hover:brightness-110 transition shadow-lg shadow-black/20"
                  data-pixel-event="Custom"
                  data-pixel-custom-name="HeroCTAClick"
                  data-pixel-audience="b2c"
                  data-pixel-content-name="hero_see_coverage"
                  @click="scrollToCoverage"
                >
                  See Coverage
                  <i class="fas fa-arrow-down text-[11px] sm:text-xs"></i>
                </a>
              </div>
            </div>
          </div>
        </template>

        <template v-if="idx === 5">
          <!-- Right-side legibility scrim -->
          <div
            class="absolute inset-y-0 right-0 w-3/4 sm:w-2/3 md:w-1/2 bg-gradient-to-l from-black/70 via-black/40 to-transparent"
            aria-hidden="true"
          />
          <div class="absolute inset-0 flex items-center">
            <div class="w-full max-w-7xl mx-auto px-4 sm:px-8">
              <div class="ml-auto max-w-[70%] md:max-w-md xl:max-w-xl text-right text-white">
                <h2 class="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight leading-[1.05] xl:whitespace-nowrap">
                  History Replay<br class="xl:hidden">
                  <span class="xl:ml-2">on demand.</span>
                </h2>
                <ul class="mt-2 sm:mt-3 md:mt-4 space-y-1 sm:space-y-1.5 text-sm sm:text-base md:text-base text-white/90">
                  <li class="flex items-center justify-end gap-2">
                    <span>Traveled route</span>
                    <i class="fas fa-route text-navitag-orange w-4 text-center" aria-hidden="true"></i>
                  </li>
                  <li class="flex items-center justify-end gap-2">
                    <span>Road events</span>
                    <i class="fas fa-triangle-exclamation text-navitag-orange w-4 text-center" aria-hidden="true"></i>
                  </li>
                  <li class="flex items-center justify-end gap-2">
                    <span>Shareable links</span>
                    <i class="fas fa-share-nodes text-navitag-orange w-4 text-center" aria-hidden="true"></i>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </template>

        <template v-if="idx === 4">
          <!-- Narrow: right-side scrim -->
          <div
            class="md:hidden absolute inset-y-0 right-0 w-3/4 sm:w-2/3 bg-gradient-to-l from-black/70 via-black/40 to-transparent"
            aria-hidden="true"
          />
          <!-- md+: left-side scrim -->
          <div
            class="hidden md:block absolute inset-y-0 left-0 md:w-1/2 bg-gradient-to-r from-black/70 via-black/40 to-transparent"
            aria-hidden="true"
          />
          <div class="absolute inset-0 flex items-start md:items-center">
            <div class="w-full max-w-7xl mx-auto px-4 sm:px-8 pt-3 sm:pt-5 md:pt-0">
              <div class="ml-auto md:ml-0 max-w-[70%] md:max-w-md text-right md:text-left text-white">
                <h2 class="text-[1.35rem] sm:text-[1.8rem] md:text-3xl font-semibold tracking-tight leading-[1.1]">
                  Fleet Monitoring<br>for Business<br class="md:hidden"> &amp; Enterprises.
                </h2>
                <NuxtLink
                  :to="businessHref"
                  class="mt-3 sm:mt-4 md:mt-5 inline-flex items-center gap-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full bg-navitag-blue text-white text-xs sm:text-sm font-semibold hover:brightness-110 transition shadow-lg shadow-black/20"
                  data-pixel-event="Custom"
                  data-pixel-custom-name="HeroCTAClick"
                  data-pixel-audience="b2b"
                  data-pixel-content-name="hero_explore_business"
                  data-pixel-lead-type="business_intent"
                >
                  <i class="fas fa-arrow-left md:hidden text-[11px] sm:text-xs" aria-hidden="true"></i>
                  Explore Business
                  <i class="fas fa-arrow-right hidden md:inline md:text-xs" aria-hidden="true"></i>
                </NuxtLink>
              </div>
            </div>
          </div>
        </template>

        <template v-if="idx === 2">
          <!-- Left-side legibility scrim -->
          <div
            class="absolute inset-y-0 left-0 w-3/4 sm:w-2/3 md:w-1/2 bg-gradient-to-r from-black/65 via-black/35 to-transparent"
            aria-hidden="true"
          />
          <div class="absolute inset-0 flex items-center">
            <div class="w-full max-w-7xl mx-auto px-4 sm:px-8">
              <div class="max-w-[60%] md:max-w-md text-white">
                <h2 class="font-semibold tracking-tight leading-[1.05]">
                  <span class="flex items-center gap-2 sm:gap-3 text-2xl sm:text-4xl md:text-6xl text-navitag-orange">
                    <i class="fas fa-clock text-[0.85em]" aria-hidden="true"></i>
                    24/7 Streaming
                  </span>
                  <span class="block mt-1 sm:mt-1.5 md:mt-2 md:pl-[4.25rem] text-base sm:text-xl md:text-3xl">
                    Real-time Live Tracking
                  </span>
                </h2>
                <div class="mt-3 sm:mt-4 md:mt-5 md:ml-[4.25rem] flex flex-wrap items-center gap-2 sm:gap-3">
                  <NuxtLink
                    :to="dataPlansHref"
                    class="inline-flex items-center gap-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full bg-white text-navitag-orange text-xs sm:text-sm font-semibold hover:bg-white/90 transition shadow-lg shadow-black/20"
                    data-pixel-event="Custom"
                    data-pixel-custom-name="HeroCTAClick"
                    data-pixel-audience="b2c"
                    data-pixel-content-name="hero_streaming_learn_more"
                  >
                    Learn More
                    <i class="fas fa-arrow-right text-[11px] sm:text-xs"></i>
                  </NuxtLink>
                  <span
                    v-for="ic in ['fa-apple', 'fa-android']"
                    :key="ic"
                    class="inline-flex items-center justify-center rounded-full bg-navitag-orange text-white shadow-md shadow-black/30 w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11"
                    aria-hidden="true"
                  >
                    <i :class="['fab', ic, 'text-[12px] sm:text-sm md:text-base']" aria-hidden="true"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-if="idx === 1">
          <!-- Right-side legibility scrim -->
          <div
            class="absolute inset-y-0 right-0 w-3/4 sm:w-2/3 md:w-1/2 bg-gradient-to-l from-black/65 via-black/35 to-transparent"
            aria-hidden="true"
          />
          <div class="absolute inset-0 flex items-start md:items-center">
            <div class="w-full max-w-7xl mx-auto px-4 sm:px-8 pt-3 sm:pt-5 md:pt-0">
              <div class="ml-auto max-w-[75%] md:max-w-lg text-right text-white">
                <h2 class="text-[26px] sm:text-[40px] md:text-5xl font-bold tracking-tight leading-[1] uppercase">
                  Track-1
                </h2>
                <p class="mt-1 sm:mt-1.5 md:mt-2 text-[15px] sm:text-xl md:text-xl font-semibold tracking-[0.08em] uppercase text-white/95 leading-tight">
                  Universal Auto Tracker
                </p>
                <p class="mt-1.5 sm:mt-2 md:mt-3 text-sm sm:text-[18px] md:text-base text-white/85 leading-snug">
                  Works in all types of vehicles and EVs.
                </p>
                <div class="mt-2 sm:mt-3 md:mt-4 flex justify-end items-center gap-1.5 sm:gap-2 md:gap-2.5">
                  <span
                    v-for="ic in ['fa-bolt', 'fa-car', 'fa-truck', 'fa-motorcycle']"
                    :key="ic"
                    class="inline-flex items-center justify-center rounded-full bg-navitag-blue text-white shadow-md shadow-black/30 w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11"
                  >
                    <i :class="['fas', ic, 'text-[12px] sm:text-sm md:text-base']" aria-hidden="true"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-if="idx === 0">
          <!-- Left-side legibility scrim -->
          <div
            class="absolute inset-y-0 left-0 w-3/4 sm:w-2/3 md:w-1/2 bg-gradient-to-r from-black/65 via-black/35 to-transparent"
            aria-hidden="true"
          />
          <div class="absolute inset-0 flex items-center md:items-start">
            <div class="w-full max-w-7xl mx-auto px-4 sm:px-8 md:pt-10 lg:pt-14">
              <div class="max-w-[65%] md:max-w-xl text-white">
                <h2 class="text-2xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
                  Never Lose<br class="md:hidden">
                  <span class="md:ml-2">What Matters.</span>
                </h2>
                <div class="mt-3 sm:mt-4 md:mt-5 flex flex-col items-start gap-2 sm:gap-2.5">
                  <NuxtLink
                    to="/shop"
                    class="inline-flex items-center gap-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full bg-navitag-blue text-white text-xs sm:text-sm font-semibold hover:brightness-110 transition shadow-lg shadow-black/20"
                    data-pixel-event="Custom"
                    data-pixel-custom-name="HeroCTAClick"
                    data-pixel-audience="b2c"
                    data-pixel-content-name="hero_shop_now"
                  >
                    Shop Now
                    <i class="fas fa-arrow-right text-[11px] sm:text-xs"></i>
                  </NuxtLink>
                  <NuxtLink
                    :to="dataPlansHref"
                    class="inline-flex items-center gap-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full bg-navitag-orange text-white text-xs sm:text-sm font-semibold hover:brightness-110 transition shadow-lg shadow-black/20"
                    data-pixel-event="Custom"
                    data-pixel-custom-name="HeroCTAClick"
                    data-pixel-audience="b2c"
                    data-pixel-content-name="hero_data_plans"
                  >
                    Data Plans
                    <i class="fas fa-arrow-right text-[11px] sm:text-xs"></i>
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Dot navigation: minimal, centered, bottom -->
      <div
        class="absolute inset-x-0 bottom-3 sm:bottom-5 flex justify-center"
        role="tablist"
        aria-label="Slide selector"
      >
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm">
          <button
            v-for="(_, idx) in slides"
            :key="idx"
            type="button"
            role="tab"
            :aria-selected="idx === current"
            :aria-label="`Show slide ${idx + 1}`"
            class="rounded-full transition-all duration-300"
            :class="idx === current
              ? 'w-5 h-1.5 bg-white'
              : 'w-1.5 h-1.5 bg-white/55 hover:bg-white/80'"
            @click="go(idx)"
          />
        </div>
      </div>
    </div>
  </section>
</template>
