<script setup lang="ts">
const mobileMenuOpen = ref(false)
const route = useRoute()

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

const isDistribution = computed(() => route.path === '/ph/distribution')
</script>

<template>
  <header class="bg-white border-b border-gray-100 sticky top-0 z-50">
    <nav class="container mx-auto px-6 py-4 flex items-center justify-between">
      <NuxtLink to="/ph" class="flex items-center gap-3">
        <img src="/logo-sm.png" alt="Navitag Logo" class="h-10 w-auto">
        <div class="flex flex-col">
          <span class="text-xl font-bold text-gray-900 leading-none">Navitag</span>
          <span class="text-[10px] font-bold text-navitag-blue tracking-wider uppercase">Southeast Asia - Philippines</span>
        </div>
      </NuxtLink>

      <div class="hidden md:flex items-center gap-8 text-sm font-medium">
        <NuxtLink to="/ph#sea-advantage" class="hover:text-navitag-blue transition">The Local Advantage</NuxtLink>
        <NuxtLink to="/ph#products" class="hover:text-navitag-blue transition">Regional Products</NuxtLink>
        <NuxtLink to="/ph/distribution" :class="isDistribution ? 'text-navitag-blue font-bold' : 'hover:text-navitag-blue'" class="transition">Where to Buy</NuxtLink>
        <NuxtLink to="/" class="text-gray-500 hover:text-gray-900 transition"><i class="fas fa-globe mr-1"></i> Global Site</NuxtLink>
        <a href="#contact" class="px-5 py-2.5 rounded-full bg-navitag-blue text-white text-sm font-semibold hover:bg-opacity-90 transition">Contact Local Sales</a>
      </div>

      <button class="md:hidden text-gray-900" @click="mobileMenuOpen = !mobileMenuOpen">
        <i class="fas fa-bars fa-lg"></i>
      </button>
    </nav>

    <div v-show="mobileMenuOpen" class="md:hidden bg-white border-t border-gray-100">
      <div class="px-6 py-6 flex flex-col gap-6 text-sm font-medium">
        <NuxtLink to="/ph#sea-advantage" class="block" @click="closeMobileMenu">The Local Advantage</NuxtLink>
        <NuxtLink to="/ph#products" class="block" @click="closeMobileMenu">Regional Products</NuxtLink>
        <NuxtLink to="/ph/distribution" class="block" :class="isDistribution ? 'text-navitag-blue font-bold' : ''" @click="closeMobileMenu">Where to Buy</NuxtLink>
        <NuxtLink to="/" class="block text-gray-500" @click="closeMobileMenu"><i class="fas fa-globe mr-1"></i> Return to Global Site</NuxtLink>
        <a href="#contact" class="block px-5 py-2.5 text-center rounded-full bg-navitag-blue text-white text-sm font-semibold hover:bg-opacity-90 transition" @click="closeMobileMenu">Contact Local Sales</a>
      </div>
    </div>
  </header>
</template>
