<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="bg-gray-950 text-gray-300 py-16 border-t border-gray-800">
    <div class="container mx-auto px-6 grid md:grid-cols-4 gap-12">
      <div class="md:col-span-1 space-y-4">
        <NuxtLink to="/ph" class="flex items-center gap-3">
          <img src="/logo-sm.png" alt="Navitag Logo" class="h-10 w-auto">
          <span class="text-2xl font-bold text-white">Navitag</span>
        </NuxtLink>
        <p class="text-sm text-navitag-blue font-bold uppercase tracking-wide">Southeast Asia</p>
        <p class="text-sm text-gray-400">Metro Manila Regional Hub</p>
      </div>

      <div class="md:col-span-1 space-y-4 text-sm">
        <h4 class="font-semibold text-white mb-5">Shopping</h4>
        <a href="https://shopee.ph/ahw7ln8f3c" target="_blank" rel="noopener noreferrer" class="block hover:text-navitag-orange">Shopee</a>
        <a href="https://www.lazada.com.ph/shop/navitag-tech?path=index.htm&lang=en" target="_blank" rel="noopener noreferrer" class="block hover:text-navitag-orange">Lazada</a>
        <a href="/ph#contact" class="block hover:text-navitag-orange">Enterprise Volume Orders</a>
      </div>

      <div class="md:col-span-1 space-y-4 text-sm">
        <h4 class="font-semibold text-white mb-5">Company</h4>
        <NuxtLink to="/" class="block hover:text-navitag-orange">Global Headquarters (USA)</NuxtLink>
        <a href="/ph#sea-advantage" class="block hover:text-navitag-orange">The Regional Advantage</a>
        <a href="/ph#contact" class="block hover:text-navitag-orange">Contact Local Team</a>
      </div>
    </div>
    <div class="container mx-auto px-6 mt-16 text-center text-xs text-gray-600 border-t border-gray-800 pt-8">
      &copy; {{ year }} Navitag Technology Systems OPC. Registered Philippine Corporation for APAC Region.
      <br>&copy; {{ year }} Navitag Digital Innovations LLC. All rights reserved. Registered US LLC.
    </div>
  </footer>
</template>
