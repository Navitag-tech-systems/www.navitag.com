<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="bg-gray-950 text-gray-300 py-16 mt-16 border-t border-gray-800">
    <div class="container mx-auto px-6 grid md:grid-cols-4 gap-12">
      <div class="md:col-span-1 space-y-4">
        <NuxtLink to="/" class="flex items-center gap-3">
          <img src="/logo-sm.png" alt="Navitag Logo" class="h-10 w-auto">
          <span class="text-2xl font-bold text-white">Navitag</span>
        </NuxtLink>
        <p class="text-sm">Global Brand. Local Presence</p>
      </div>

      <div class="md:col-span-1 space-y-4 text-sm">
        <h4 class="font-semibold text-white mb-5">Navitag Global</h4>
        <a href="#global" class="block hover:text-navitag-orange">Our Footprint</a>
        <NuxtLink to="/ph" class="block hover:text-navitag-orange">Southeast Asia Portal</NuxtLink>
        <a href="#contact" class="block hover:text-navitag-orange">Contact Us</a>
      </div>
    </div>
    <div class="container mx-auto px-6 mt-16 text-center text-xs text-gray-600 border-t border-gray-800 pt-8">
      &copy; {{ year }} Navitag Digital Innovations LLC. All rights reserved. Registered US LLC.
    </div>
  </footer>
</template>
