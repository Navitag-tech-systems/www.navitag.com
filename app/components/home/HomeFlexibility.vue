<script setup lang="ts">
// Retail pricing model: one-time device purchase with data included, then
// top up only when the starter plan runs out. No subscriptions by default —
// pairs with the rest of the retail-first homepage messaging.
</script>

<template>
  <section class="relative bg-navitag-bg py-20 sm:py-28 lg:py-32 border-t border-gray-100 overflow-hidden">
    <!-- Ambient glow -->
    <div
      class="absolute -top-40 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-navitag-blue/[0.07] blur-3xl pointer-events-none"
      aria-hidden="true"
    ></div>

    <div class="relative max-w-7xl mx-auto px-6 sm:px-8">
      <!-- Heading -->
      <div class="max-w-3xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navitag-orange/10 text-navitag-orange text-[11px] font-semibold tracking-[0.15em] uppercase">
          <span class="w-1.5 h-1.5 rounded-full bg-navitag-orange"></span>
          Flexible pricing
        </div>
        <h2 class="mt-5 text-4xl sm:text-5xl lg:text-[56px] font-semibold tracking-tight leading-[1.02] text-gray-950">
          Buy once. <br>
          <span class="text-gray-400">Top up as you go.</span>
        </h2>
        <p class="mt-6 text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
          One-time purchase. Your device ships with a free starter data plan built in —
          so it works the moment it's unboxed. When that runs out, top up only when you
          need it. No subscriptions. No surprises. Mix and match to your needs.
        </p>
      </div>

      <!-- Two-step cards -->
      <div class="mt-14 sm:mt-16 grid gap-5 sm:gap-6 md:grid-cols-2">
        <!-- Step 1: device -->
        <article class="relative overflow-hidden rounded-3xl bg-white border border-gray-200/70 p-8 sm:p-10 shadow-sm">
          <div class="absolute top-6 right-6 text-[11px] font-semibold tracking-[0.18em] uppercase text-gray-400">
            Step 1
          </div>
          <div class="w-12 h-12 rounded-2xl bg-navitag-blue/10 text-navitag-blue flex items-center justify-center">
            <i class="fas fa-box-open text-lg"></i>
          </div>
          <h3 class="mt-6 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-950">
            Buy the device
          </h3>
          <p class="mt-3 text-[15px] text-gray-600 leading-relaxed">
            A single one-time purchase. No monthly fee. No activation charges. Free starter data is included so your tracker works from day one.
          </p>
          <ul class="mt-6 space-y-2.5 text-[14.5px] text-gray-700">
            <li class="flex items-start gap-2.5">
              <i class="fas fa-check text-navitag-blue text-[12px] mt-[5px]"></i>
              One-time hardware cost
            </li>
            <li class="flex items-start gap-2.5">
              <i class="fas fa-check text-navitag-blue text-[12px] mt-[5px]"></i>
              Free starter data plan included
            </li>
            <li class="flex items-start gap-2.5">
              <i class="fas fa-check text-navitag-blue text-[12px] mt-[5px]"></i>
              Works in 100+ countries out of the box
            </li>
          </ul>
          <div class="mt-8">
            <NuxtLink
              to="/shop"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-navitag-blue text-white text-[13.5px] font-semibold hover:bg-[#006ADB] transition-colors shadow-lg shadow-navitag-blue/20"
              data-pixel-event="Custom"
              data-pixel-custom-name="HomeSectionCTA"
              data-pixel-audience="b2c"
              data-pixel-content-name="flexibility_buy_now"
            >
              Buy now
              <i class="fas fa-arrow-right text-[11px]"></i>
            </NuxtLink>
          </div>
        </article>

        <!-- Step 2: top-up -->
        <article class="relative overflow-hidden rounded-3xl bg-gray-950 text-white p-8 sm:p-10 shadow-xl shadow-gray-950/10">
          <div class="absolute -top-24 -right-16 w-56 h-56 rounded-full bg-navitag-orange/20 blur-3xl pointer-events-none"></div>
          <div class="absolute top-6 right-6 text-[11px] font-semibold tracking-[0.18em] uppercase text-white/50">
            Step 2
          </div>
          <div class="relative w-12 h-12 rounded-2xl bg-navitag-orange/20 text-navitag-orange flex items-center justify-center">
            <i class="fas fa-bolt text-lg"></i>
          </div>
          <h3 class="relative mt-6 text-2xl sm:text-3xl font-semibold tracking-tight">
            Top up only as needed
          </h3>
          <p class="relative mt-3 text-[15px] text-white/70 leading-relaxed">
            When your starter plan runs out, grab a prepaid top-up in the length that fits your trip or season. Pay only for what you actually use.
          </p>
          <ul class="relative mt-6 space-y-2.5 text-[14.5px] text-white/85">
            <li class="flex items-start gap-2.5">
              <i class="fas fa-check text-navitag-orange text-[12px] mt-[5px]"></i>
              Prepaid 3, 6, or 12-month plans
            </li>
            <li class="flex items-start gap-2.5">
              <i class="fas fa-check text-navitag-orange text-[12px] mt-[5px]"></i>
              No auto-renewal, cancel anytime by doing nothing
            </li>
            <li class="flex items-start gap-2.5">
              <i class="fas fa-check text-navitag-orange text-[12px] mt-[5px]"></i>
              Priced in your local currency
            </li>
          </ul>
          <div class="relative mt-8">
            <NuxtLink
              to="/data-plans"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-gray-950 text-[13.5px] font-semibold hover:bg-white/90 transition-colors"
              data-pixel-event="Custom"
              data-pixel-custom-name="HomeSectionCTA"
              data-pixel-audience="b2c"
              data-pixel-content-name="flexibility_see_plans"
            >
              See data plans
              <i class="fas fa-arrow-right text-[11px]"></i>
            </NuxtLink>
          </div>
        </article>
      </div>

      <!-- Bottom reassurance strip -->
      <div class="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] font-medium text-gray-500">
        <span class="inline-flex items-center gap-2">
          <i class="fas fa-xmark text-[10px] text-gray-400"></i>
          No subscriptions
        </span>
        <span class="hidden sm:inline-block w-px h-3 bg-gray-300"></span>
        <span class="inline-flex items-center gap-2">
          <i class="fas fa-xmark text-[10px] text-gray-400"></i>
          No contracts
        </span>
        <span class="hidden sm:inline-block w-px h-3 bg-gray-300"></span>
        <span class="inline-flex items-center gap-2">
          <i class="fas fa-xmark text-[10px] text-gray-400"></i>
          No hidden fees
        </span>
      </div>
    </div>
  </section>
</template>
