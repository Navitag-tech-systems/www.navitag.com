<script setup lang="ts">
interface Props {
  /** Chip label at the top. */
  eyebrow?: string
  /** Primary headline (first line). */
  heading?: string
  /** Accent-colored tail of the heading. */
  headingAccent?: string
  /** Body copy under the heading. Supports plain text. */
  body?: string
  /** Product name shown in the retailer card. */
  productName?: string
  /** Retailer card caption. */
  retailerNote?: string
  /** Fill the viewport (true on /distribution route, false when embedded). */
  fullViewport?: boolean
}

withDefaults(defineProps<Props>(), {
  eyebrow: 'Store maintenance',
  heading: 'Our online store is',
  headingAccent: 'briefly down.',
  body: 'You can still grab the Navitag Track-1 at all major retailers while we get things back up.',
  productName: 'Navitag Track-1 · at major retailers',
  retailerNote: 'Electronics chains, auto accessory shops, and select online marketplaces carry the Track-1. Need help finding a store near you? Drop us a line.',
  fullViewport: false,
})
</script>

<template>
  <section
    class="relative bg-navitag-bg overflow-hidden"
    :class="fullViewport ? 'min-h-[calc(100svh-4rem-var(--region-banner-h,0px))] flex items-center' : ''"
  >
    <!-- Ambient glows -->
    <div
      class="absolute -top-40 -right-32 w-[520px] h-[520px] rounded-full bg-navitag-blue/10 blur-3xl pointer-events-none"
      aria-hidden="true"
    ></div>
    <div
      class="absolute -bottom-40 -left-32 w-[420px] h-[420px] rounded-full bg-navitag-orange/10 blur-3xl pointer-events-none"
      aria-hidden="true"
    ></div>

    <div class="relative max-w-3xl mx-auto px-6 sm:px-8 py-20 sm:py-28 text-center w-full">
      <!-- Status chip -->
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700 text-[11px] font-semibold tracking-[0.15em] uppercase">
        <span class="relative flex w-2 h-2">
          <span class="absolute inset-0 rounded-full bg-navitag-orange opacity-60 animate-ping"></span>
          <span class="relative w-2 h-2 rounded-full bg-navitag-orange"></span>
        </span>
        {{ eyebrow }}
      </div>

      <h1 class="mt-5 text-3xl sm:text-4xl lg:text-[52px] font-semibold tracking-tight leading-[1.05] text-gray-950">
        {{ heading }} <span class="text-navitag-blue">{{ headingAccent }}</span>
      </h1>

      <p class="mt-5 text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
        {{ body }}
      </p>

      <!-- Retailer card -->
      <div class="mt-10 mx-auto max-w-xl rounded-3xl bg-white border border-gray-200/70 shadow-sm p-6 sm:p-7 text-left">
        <div class="flex items-start gap-4">
          <div class="shrink-0 w-12 h-12 rounded-xl bg-navitag-blue/10 text-navitag-blue flex items-center justify-center">
            <i class="fas fa-store text-[17px]"></i>
          </div>
          <div class="min-w-0">
            <div class="text-[11px] uppercase tracking-[0.2em] font-semibold text-gray-400">
              Available now
            </div>
            <div class="mt-1 text-[17px] font-semibold tracking-tight text-gray-950">
              {{ productName }}
            </div>
            <p class="mt-2 text-[13.5px] text-gray-600 leading-relaxed">
              {{ retailerNote }}
            </p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <NuxtLink
          to="/contact?subject=Where%20to%20buy%20Navitag%20Track-1"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gray-950 text-white text-sm font-semibold hover:bg-gray-800 transition"
        >
          <i class="fas fa-envelope text-[12px]"></i>
          Ask where to buy
        </NuxtLink>
        <NuxtLink
          to="/"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white border border-gray-200 text-gray-950 text-sm font-semibold hover:border-gray-300 transition"
        >
          <i class="fas fa-arrow-left text-[11px]"></i>
          Back to home
        </NuxtLink>
      </div>

      <p class="mt-10 text-[12.5px] text-gray-500">
        Questions? <NuxtLink to="/contact" class="text-navitag-blue font-medium hover:underline">Contact us</NuxtLink>
      </p>
    </div>
  </section>
</template>
