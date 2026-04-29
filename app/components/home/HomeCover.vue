<script setup lang="ts">
// Cover images are responsive. Drop files into /public/covers/ to replace placeholder:
//  - /covers/home-16x9.jpg  (desktop, 16:9)
//  - /covers/home-4x3.jpg   (tablet, 4:3)
//  - /covers/home-9x16.jpg  (mobile, 9:16)
// Then flip showPlaceholder to false to render real images.
const showPlaceholder = true
const coverLg = '/covers/home-16x9.jpg'
const coverMd = '/covers/home-4x3.jpg'
const coverSm = '/covers/home-9x16.jpg'
</script>

<template>
  <section class="relative w-full overflow-hidden bg-gray-900">
    <!-- Aspect-ratio frame per breakpoint.
         max-h accounts for header (4rem) + optional region banner (--region-banner-h)
         so the hero's bottom CTAs stay above the fold when the banner is visible. -->
    <div
      class="relative w-full aspect-[9/16] sm:aspect-[4/3] lg:aspect-[16/9]"
      style="max-height: calc(100svh - 4rem - var(--region-banner-h, 0px));"
    >
      <!-- Real image (when ready) -->
      <picture v-if="!showPlaceholder" class="absolute inset-0 w-full h-full">
        <source media="(min-width: 1024px)" :srcset="coverLg">
        <source media="(min-width: 640px)" :srcset="coverMd">
        <img
          :src="coverSm"
          alt=""
          class="absolute inset-0 w-full h-full object-cover"
        >
      </picture>

      <!-- Placeholder: stylized brand backdrop -->
      <div
        v-else
        class="absolute inset-0"
        aria-hidden="true"
      >
        <!-- Base gradient -->
        <div class="absolute inset-0 bg-gradient-to-br from-[#0076F5] via-[#0A60C8] to-[#071C34]"></div>
        <!-- Diagonal highlight -->
        <div class="absolute inset-0 bg-gradient-to-tl from-[#F28C38]/25 via-transparent to-transparent"></div>
        <!-- Grain / dot pattern -->
        <div
          class="absolute inset-0 opacity-30 mix-blend-soft-light"
          style="background-image: radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px); background-size: 22px 22px;"
        ></div>
        <!-- Vignette -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>

        <!-- Placeholder label (corner) -->
        <div class="absolute top-5 right-5 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold text-white/60 bg-white/10 backdrop-blur-sm rounded-full border border-white/15">
          Cover · 9:16 / 4:3 / 16:9
        </div>
      </div>

      <!-- Content overlay -->
      <div class="absolute inset-0 flex flex-col justify-end">
        <div class="max-w-7xl mx-auto w-full px-6 sm:px-8 pb-10 sm:pb-14 lg:pb-20">
          <div class="max-w-3xl">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white/90 text-[11px] font-medium tracking-wide uppercase">
              <span class="w-1.5 h-1.5 rounded-full bg-navitag-orange"></span>
              Built for life on the move
            </div>
            <h1 class="mt-5 text-[36px] leading-[1.02] sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-white">
              Never Lose<br class="sm:hidden">
              <span class="sm:ml-3">What Matters.</span>
            </h1>
            <p class="mt-5 text-base sm:text-lg text-white/80 max-w-xl leading-relaxed">
              Trackers that just work — in over 100 countries, out of the box. No SIM. No contracts. No borders.
            </p>
            <div class="mt-8 flex flex-col sm:flex-row gap-3">
              <NuxtLink
                to="/distribution"
                class="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white text-gray-950 text-sm font-semibold hover:bg-white/90 transition shadow-lg shadow-black/20"
              >
                Shop Navitag
                <i class="fas fa-arrow-right text-xs"></i>
              </NuxtLink>
              <NuxtLink
                to="/data-plans"
                class="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white/10 backdrop-blur-md border border-white/25 text-white text-sm font-semibold hover:bg-white/15 transition"
              >
                View Data Plans
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
