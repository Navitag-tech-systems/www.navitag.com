<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="bg-gray-950 text-gray-300 py-12 mt-16 border-t border-gray-800">
    <div class="container mx-auto px-6 flex flex-col items-center text-center space-y-3">
      <div class="flex items-center gap-3">
        <img src="/logo-sm.png" alt="Navitag Logo" class="h-10 w-auto" loading="lazy">
        <span class="text-2xl font-bold text-white">NAVITAG</span>
      </div>
      <p class="text-sm">Never Lose What Matters</p>
    </div>
    <div class="container mx-auto px-6 mt-10 text-center text-xs text-gray-600 border-t border-gray-800 pt-6">
      &copy; {{ year }} Navitag Digital Innovations LLC. All rights reserved. Registered US LLC.
    </div>
  </footer>
</template>
