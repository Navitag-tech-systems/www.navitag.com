<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="bg-navitag-bg border-t border-gray-200/70">
    <div class="max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-10">
      <!-- Brand block -->
      <div class="flex flex-col items-center text-center">
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <img src="/logo-sm.png" alt="Navitag" class="h-8 w-auto" loading="lazy">
          <span class="text-xl font-semibold tracking-tight text-gray-950">NAVITAG</span>
        </NuxtLink>
        <p class="mt-4 text-[15px] text-gray-600 tracking-tight">
          Never Lose What Matters.
        </p>
      </div>

      <!-- Links -->
      <div class="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13.5px] font-medium text-gray-600">
        <NuxtLink to="/privacy-policy" class="hover:text-navitag-blue transition-colors">
          Privacy Policy
        </NuxtLink>
        <span class="hidden sm:inline-block w-px h-3 bg-gray-300"></span>
        <NuxtLink
          to="/contact"
          class="hover:text-navitag-blue transition-colors"
        >
          Contact us
        </NuxtLink>
      </div>

      <!-- Payment strip -->
      <div class="mt-10 flex flex-col items-center gap-3">
        <span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
          Secure Payments
        </span>
        <div class="flex items-center gap-3 text-gray-400">
          <i class="fab fa-cc-visa text-3xl" aria-label="Visa"></i>
          <i class="fab fa-cc-mastercard text-3xl" aria-label="Mastercard"></i>
          <i class="fab fa-cc-amex text-3xl" aria-label="American Express"></i>
          <i class="fab fa-cc-discover text-3xl" aria-label="Discover"></i>
          <i class="fab fa-cc-paypal text-3xl" aria-label="PayPal"></i>
        </div>
      </div>

      <!-- Copyright -->
      <div class="mt-12 pt-6 border-t border-gray-200/70 text-center text-[12px] text-gray-500 leading-relaxed">
        &copy; {{ year }} Navitag Digital Innovations LLC. All rights reserved.
      </div>
    </div>
  </footer>
</template>
