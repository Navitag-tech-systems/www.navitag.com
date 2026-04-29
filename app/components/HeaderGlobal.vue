<script setup lang="ts">
const basic = useBasicStore()
const mobileMenuOpen = ref(false)
const isLoggedIn = computed(() => basic.isLoggedIn)

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

interface NavLink {
  label: string
  to: string
  audience: 'b2c' | 'b2b'
  pixelName: string
}
const navLinks: NavLink[] = [
  { label: 'Where to Buy', to: '/distribution', audience: 'b2c', pixelName: 'nav_distribution' },
  { label: 'Data Plans', to: '/data-plans', audience: 'b2c', pixelName: 'nav_data_plans' },
  { label: 'For Business', to: '/business', audience: 'b2b', pixelName: 'nav_business' },
]
</script>

<template>
  <header
    class="sticky z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100"
    style="top: var(--region-banner-h, 0px);"
  >
    <nav class="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center gap-2.5 shrink-0" @click="closeMobileMenu">
        <img src="/logo-sm.png" alt="Navitag" class="h-7 w-auto">
        <span class="text-[17px] font-semibold tracking-tight text-gray-950">NAVITAG</span>
      </NuxtLink>

      <!-- Desktop nav -->
      <div class="hidden md:flex items-center gap-1">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="px-4 py-2 text-[13.5px] font-medium text-gray-700 hover:text-navitag-blue transition-colors rounded-full"
          data-pixel-event="Custom"
          data-pixel-custom-name="NavClick"
          :data-pixel-audience="link.audience"
          :data-pixel-content-name="link.pixelName"
        >
          {{ link.label }}
        </NuxtLink>
      </div>

      <!-- Right side: account / login -->
      <div class="hidden md:flex items-center gap-2 shrink-0">
        <ClientOnly>
          <template v-if="isLoggedIn">
            <NuxtLink
              to="/my-account"
              class="inline-flex items-center gap-2 px-4 py-2 text-[13.5px] font-medium text-gray-950 rounded-full hover:bg-gray-100 transition-colors"
            >
              <i class="far fa-user-circle"></i>
              My Account
            </NuxtLink>
          </template>
          <template v-else>
            <NuxtLink
              to="/login"
              class="inline-flex items-center gap-2 px-5 py-2 text-[13.5px] font-semibold text-white bg-navitag-blue rounded-full hover:bg-[#006ADB] transition-colors shadow-sm shadow-navitag-blue/20"
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
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="py-3.5 text-lg font-medium text-gray-950 border-b border-gray-100 flex items-center justify-between"
            data-pixel-event="Custom"
            data-pixel-custom-name="NavClick"
            :data-pixel-audience="link.audience"
            :data-pixel-content-name="link.pixelName"
            @click="closeMobileMenu"
          >
            {{ link.label }}
            <i class="fas fa-chevron-right text-xs text-gray-300"></i>
          </NuxtLink>

          <ClientOnly>
            <template v-if="isLoggedIn">
              <NuxtLink
                to="/my-account"
                class="py-3.5 text-lg font-medium text-gray-950 border-b border-gray-100 flex items-center justify-between"
                @click="closeMobileMenu"
              >
                <span class="flex items-center gap-3">
                  <i class="far fa-user-circle text-navitag-blue"></i>
                  My Account
                </span>
                <i class="fas fa-chevron-right text-xs text-gray-300"></i>
              </NuxtLink>
            </template>
            <template v-else>
              <NuxtLink
                to="/login"
                class="mt-6 py-3.5 text-center text-base font-semibold text-white bg-navitag-blue rounded-full"
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
