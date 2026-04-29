<script setup lang="ts">
import type { RegionConfig } from '~/config/regions'

const props = defineProps<{ region: RegionConfig }>()

const basic = useBasicStore()
const mobileMenuOpen = ref(false)
const isLoggedIn = computed(() => basic.isLoggedIn)
const route = useRoute()

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

function isActive(to: string) {
  const [path] = to.split('#')
  return path && path !== '' && route.path === path
}

function navAudience(to: string): 'b2b' | 'b2c' {
  return /\/business(\/|$)/.test(to) ? 'b2b' : 'b2c'
}

function navPixelName(label: string) {
  return `nav_${label.toLowerCase().replace(/\s+/g, '_')}`
}
</script>

<template>
  <header
    class="sticky z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100"
    style="top: var(--region-banner-h, 0px);"
  >
    <nav class="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-6">
      <!-- Logo + region badge -->
      <NuxtLink :to="region.homePath" class="flex items-center gap-2.5 shrink-0" @click="closeMobileMenu">
        <img src="/logo-sm.png" alt="Navitag" class="h-7 w-auto">
        <div class="flex flex-col leading-none">
          <span class="text-[17px] font-semibold tracking-tight text-gray-950">{{ region.brandLabel }}</span>
          <span class="text-[9.5px] font-bold text-navitag-blue tracking-[0.14em] uppercase mt-0.5">
            {{ region.regionLabel }}
          </span>
        </div>
      </NuxtLink>

      <!-- Desktop nav -->
      <div class="hidden md:flex items-center gap-1">
        <NuxtLink
          v-for="link in region.navLinks"
          :key="link.to"
          :to="link.to"
          class="px-3.5 py-2 text-[13.5px] font-medium transition-colors rounded-full"
          :class="isActive(link.to) ? 'text-navitag-blue' : 'text-gray-700 hover:text-navitag-blue'"
          data-pixel-event="Custom"
          data-pixel-custom-name="NavClick"
          :data-pixel-audience="navAudience(link.to)"
          :data-pixel-content-name="navPixelName(link.label)"
        >
          {{ link.label }}
        </NuxtLink>
        <NuxtLink
          :to="region.globalLinkTo"
          class="ml-1 px-3 py-2 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors rounded-full inline-flex items-center gap-1.5"
          title="Return to global site"
        >
          <i class="fas fa-globe text-[11px]"></i>
          Global
        </NuxtLink>
      </div>

      <!-- Right side: CTA + account -->
      <div class="hidden md:flex items-center gap-2 shrink-0">
        <a
          v-if="region.cta"
          :href="region.cta.href"
          class="inline-flex items-center gap-2 px-5 py-2 text-[13.5px] font-semibold text-white bg-navitag-blue rounded-full hover:bg-[#006ADB] transition-colors shadow-sm shadow-navitag-blue/20"
        >
          {{ region.cta.label }}
        </a>
        <ClientOnly>
          <template v-if="isLoggedIn">
            <NuxtLink
              to="/my-account"
              class="inline-flex items-center gap-2 px-3 py-2 text-[13.5px] font-medium text-gray-950 rounded-full hover:bg-gray-100 transition-colors"
              title="My Account"
            >
              <i class="far fa-user-circle"></i>
            </NuxtLink>
          </template>
          <template v-else>
            <NuxtLink
              to="/login"
              class="inline-flex items-center gap-2 px-4 py-2 text-[13.5px] font-medium text-gray-700 hover:text-navitag-blue rounded-full transition-colors"
            >
              Login
            </NuxtLink>
          </template>
        </ClientOnly>
      </div>

      <!-- Mobile burger -->
      <button
        class="md:hidden inline-flex items-center justify-center w-10 h-10 -mr-2 text-gray-950"
        :aria-expanded="mobileMenuOpen"
        aria-label="Toggle menu"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <span class="relative block w-5 h-[18px]">
          <span
            class="absolute left-0 w-5 h-[1.5px] bg-current rounded-full transition-all duration-300"
            :class="mobileMenuOpen ? 'top-[8px] rotate-45' : 'top-[2px]'"
          ></span>
          <span
            class="absolute left-0 top-[8px] w-5 h-[1.5px] bg-current rounded-full transition-all duration-200"
            :class="mobileMenuOpen ? 'opacity-0' : 'opacity-100'"
          ></span>
          <span
            class="absolute left-0 w-5 h-[1.5px] bg-current rounded-full transition-all duration-300"
            :class="mobileMenuOpen ? 'top-[8px] -rotate-45' : 'top-[14px]'"
          ></span>
        </span>
      </button>
    </nav>

    <!-- Mobile panel -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-show="mobileMenuOpen"
        class="md:hidden absolute inset-x-0 top-16 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm"
      >
        <div class="px-5 py-6 flex flex-col">
          <NuxtLink
            v-for="link in region.navLinks"
            :key="link.to"
            :to="link.to"
            class="py-3.5 text-lg font-medium border-b border-gray-100 flex items-center justify-between"
            :class="isActive(link.to) ? 'text-navitag-blue' : 'text-gray-950'"
            data-pixel-event="Custom"
            data-pixel-custom-name="NavClick"
            :data-pixel-audience="navAudience(link.to)"
            :data-pixel-content-name="navPixelName(link.label)"
            @click="closeMobileMenu"
          >
            {{ link.label }}
            <i class="fas fa-chevron-right text-xs text-gray-300"></i>
          </NuxtLink>

          <NuxtLink
            :to="region.globalLinkTo"
            class="py-3.5 text-base font-medium text-gray-500 border-b border-gray-100 flex items-center justify-between"
            @click="closeMobileMenu"
          >
            <span class="flex items-center gap-3">
              <i class="fas fa-globe text-gray-400"></i>
              Return to Global Site
            </span>
            <i class="fas fa-chevron-right text-xs text-gray-300"></i>
          </NuxtLink>

          <a
            v-if="region.cta"
            :href="region.cta.href"
            class="mt-6 py-3.5 text-center text-base font-semibold text-white bg-navitag-blue rounded-full"
            @click="closeMobileMenu"
          >
            {{ region.cta.label }}
          </a>

          <ClientOnly>
            <template v-if="isLoggedIn">
              <NuxtLink
                to="/my-account"
                class="mt-3 py-3.5 text-center text-base font-medium text-gray-950 border border-gray-200 rounded-full inline-flex items-center justify-center gap-2"
                @click="closeMobileMenu"
              >
                <i class="far fa-user-circle"></i>
                My Account
              </NuxtLink>
            </template>
            <template v-else>
              <NuxtLink
                to="/login"
                class="mt-3 py-3.5 text-center text-base font-medium text-gray-950 border border-gray-200 rounded-full"
                @click="closeMobileMenu"
              >
                Login
              </NuxtLink>
            </template>
          </ClientOnly>
        </div>
      </div>
    </Transition>
  </header>
</template>
