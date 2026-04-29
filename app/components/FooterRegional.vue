<script setup lang="ts">
import type { RegionConfig } from '~/config/regions'

defineProps<{ region: RegionConfig }>()

const year = new Date().getFullYear()
</script>

<template>
  <footer class="bg-navitag-bg border-t border-gray-200/70">
    <div class="max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-10">
      <!-- Brand block -->
      <div class="grid gap-12 md:grid-cols-4">
        <div class="md:col-span-2 flex flex-col items-start gap-3">
          <NuxtLink :to="region.homePath" class="flex items-center gap-2.5">
            <img src="/logo-sm.png" alt="Navitag" class="h-8 w-auto" loading="lazy">
            <span class="text-xl font-semibold tracking-tight text-gray-950">{{ region.brandLabel }}</span>
          </NuxtLink>
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-navitag-blue">
            {{ region.regionShort }}
          </p>
          <p v-if="region.regionSub" class="text-[13.5px] text-gray-500">
            {{ region.regionSub }}
          </p>
          <NuxtLink
            :to="region.globalLinkTo"
            class="mt-3 inline-flex items-center gap-2 text-[13px] font-medium text-gray-500 hover:text-navitag-blue transition-colors"
          >
            <i class="fas fa-globe text-[11px]"></i>
            Global Site
          </NuxtLink>
        </div>

        <!-- Link groups -->
        <div
          v-for="group in region.footerGroups"
          :key="group.heading"
          class="space-y-4 text-sm"
        >
          <h4 class="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            {{ group.heading }}
          </h4>
          <ul class="space-y-3">
            <li v-for="link in group.links" :key="link.label">
              <a
                v-if="link.external"
                :href="link.href"
                target="_blank"
                rel="noopener noreferrer"
                class="text-gray-600 hover:text-navitag-blue transition-colors"
                :data-pixel-event="link.pixel?.event"
                :data-pixel-custom-name="link.pixel?.customName"
                :data-pixel-content-name="link.pixel?.contentName"
                :data-pixel-content-category="link.pixel?.contentCategory"
                :data-pixel-audience="link.pixel?.audience"
                :data-pixel-lead-type="link.pixel?.leadType"
              >
                {{ link.label }}
                <i class="fas fa-arrow-up-right-from-square text-[10px] ml-1 opacity-60"></i>
              </a>
              <NuxtLink
                v-else-if="link.to"
                :to="link.to"
                class="text-gray-600 hover:text-navitag-blue transition-colors"
                :data-pixel-event="link.pixel?.event"
                :data-pixel-custom-name="link.pixel?.customName"
                :data-pixel-content-name="link.pixel?.contentName"
                :data-pixel-content-category="link.pixel?.contentCategory"
                :data-pixel-audience="link.pixel?.audience"
                :data-pixel-lead-type="link.pixel?.leadType"
              >
                {{ link.label }}
              </NuxtLink>
              <a
                v-else-if="link.href"
                :href="link.href"
                class="text-gray-600 hover:text-navitag-blue transition-colors"
                :data-pixel-event="link.pixel?.event"
                :data-pixel-custom-name="link.pixel?.customName"
                :data-pixel-content-name="link.pixel?.contentName"
                :data-pixel-content-category="link.pixel?.contentCategory"
                :data-pixel-audience="link.pixel?.audience"
                :data-pixel-lead-type="link.pixel?.leadType"
              >
                {{ link.label }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Shared utility links -->
      <div class="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13.5px] font-medium text-gray-600">
        <NuxtLink to="/privacy-policy" class="hover:text-navitag-blue transition-colors">
          Privacy Policy
        </NuxtLink>
        <span class="hidden sm:inline-block w-px h-3 bg-gray-300"></span>
        <NuxtLink :to="`${region.basePath}/contact`" class="hover:text-navitag-blue transition-colors">
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
        &copy; {{ year }} {{ region.entity }}
        <template v-if="region.entitySecondary">
          <br>&copy; {{ year }} {{ region.entitySecondary }}
        </template>
      </div>
    </div>
  </footer>
</template>
