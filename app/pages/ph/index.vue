<script setup lang="ts">
definePageMeta({ layout: 'ph' })

useSeoMeta({
  title: 'Navitag - Southeast Asia | Global Tech. Local Fulfillment.',
  description: 'Navitag GPS trackers and dashcams available in the Philippines and Southeast Asia. Fast regional shipping from our Metro Manila hub.',
  ogTitle: 'Navitag Southeast Asia - Global Tech. Local Fulfillment.',
  ogDescription: 'Navitag GPS trackers and dashcams available in the Philippines and Southeast Asia. Fast regional shipping from our Metro Manila hub.',
  ogUrl: 'https://www.navitag.com/ph',
})
</script>

<template>
  <!-- Hero -->
  <section id="hero" class="relative bg-gray-50 py-24 md:py-32">
    <div class="container mx-auto px-6 grid md:grid-cols-12 gap-12 items-center">
      <div class="md:col-span-6 text-center md:text-left">
        <div class="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-navitag-orange bg-opacity-10 text-navitag-orange font-semibold text-xs border border-navitag-orange border-opacity-20 mb-6">
          <i class="fas fa-map-marker-alt"></i> Official APAC Regional Hub
        </div>
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-gray-950 mb-8">
          Global Technology.<br> <span class="text-navitag-blue">Local Fulfillment.</span>
        </h1>
        <p class="text-lg text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto md:mx-0">
          Direct from our Metro Manila hub to your fleet. Experience Navitag's advanced US-engineered M2M ecosystem with the speed, compliance, and support of a dedicated Southeast Asian headquarters.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
          <NuxtLink to="/ph/distribution" class="px-8 py-3.5 rounded-full bg-navitag-blue text-white font-semibold hover:bg-opacity-90 transition text-center shadow-lg shadow-navitag-blue/20">
            Where to Buy<i class="fas fa-shopping-cart ml-2"></i>
          </NuxtLink>
          <a href="#contact" class="px-8 py-3.5 rounded-full bg-white text-gray-950 font-semibold border border-gray-200 hover:border-gray-300 transition text-center">
            Contact Fleet Sales
          </a>
        </div>
      </div>
      <div class="md:col-span-6 flex justify-center">
        <div class="relative w-full aspect-video bg-white p-8 rounded-3xl shadow-2xl shadow-gray-200/50 flex flex-col justify-between border border-gray-100">
          <div class="flex justify-between items-center">
            <div class="flex gap-2">
              <img src="/logo-sm.png" alt="Navitag Logo" class="h-6 w-auto">
              <span class="font-bold text-gray-900">Navitag Technology Systems OPC</span>
            </div>
          </div>
          <div class="w-full h-px bg-gray-100"></div>
          <div class="text-center font-extrabold text-4xl lg:text-5xl tracking-tighter text-navitag-blue uppercase">
            Manila &bull; SEA Hub
          </div>
          <div class="w-full h-px bg-gray-100"></div>
          <div class="flex justify-between items-center text-xs text-gray-500 font-mono uppercase">
            <div>GMT+8 Support</div>
            <div>Fast Regional Shipping</div>
            <div>Local Compliance</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- SEA Advantage -->
  <section id="sea-advantage" class="py-24 bg-white">
    <div class="container mx-auto px-6">
      <div class="text-center mb-20 max-w-3xl mx-auto">
        <h2 class="text-4xl font-extrabold tracking-tight text-gray-950 mb-6">The Southeast Asia Advantage</h2>
        <p class="text-lg text-gray-600 leading-relaxed">
          We eliminate the friction of deploying global technology. By ordering through our regional hub, you bypass international red tape and get your assets secured faster.
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div class="bg-gray-50 p-8 rounded-3xl border border-gray-100">
          <div class="w-14 h-14 rounded-full bg-navitag-blue bg-opacity-10 flex items-center justify-center mb-6">
            <i class="fas fa-shipping-fast text-navitag-blue fa-xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-950 mb-3">Rapid Regional Logistics</h3>
          <p class="text-sm text-gray-600 leading-relaxed">
            Orders are dispatched directly from our Metro Manila fulfillment center, ensuring fast shipping across the Philippines, Singapore, Malaysia, and the wider SEA region.
          </p>
        </div>

        <div class="bg-gray-50 p-8 rounded-3xl border border-gray-100">
          <div class="w-14 h-14 rounded-full bg-navitag-orange bg-opacity-10 flex items-center justify-center mb-6">
            <i class="fas fa-box-open text-navitag-orange fa-xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-950 mb-3">Zero Import Hassles</h3>
          <p class="text-sm text-gray-600 leading-relaxed">
            Avoid complex customs delays and heavy international import taxes. We handle the cross-border compliance so your tech arrives ready to deploy.
          </p>
        </div>

        <div class="bg-gray-50 p-8 rounded-3xl border border-gray-100">
          <div class="w-14 h-14 rounded-full bg-gray-900 bg-opacity-10 flex items-center justify-center mb-6">
            <i class="fas fa-headset text-gray-900 fa-xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-950 mb-3">In-Timezone Support</h3>
          <p class="text-sm text-gray-600 leading-relaxed">
            Dedicated technical and sales support teams operating in GMT+8. Get fast answers and troubleshooting when your business is actually awake.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Products -->
  <section id="products" class="py-24 bg-gray-50">
    <div class="container mx-auto px-6">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-extrabold tracking-tight text-gray-950 mb-4">One Unified Ecosystem</h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Access Navitag's complete suite of hardware directly from our regional distribution network. All devices connect seamlessly to the global Navitag App.
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto mb-12">
        <div class="bg-white p-6 rounded-2xl border border-gray-200 text-center hover:shadow-lg transition">
          <i class="fas fa-map-marker-alt text-navitag-blue fa-2x mb-4"></i>
          <h4 class="font-bold text-gray-900 text-sm">Fleet GPS Tracker</h4>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-gray-200 text-center hover:shadow-lg transition">
          <i class="fas fa-video text-navitag-orange fa-2x mb-4"></i>
          <h4 class="font-bold text-gray-900 text-sm">Live Dashcam</h4>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-gray-200 text-center hover:shadow-lg transition">
          <i class="fas fa-user-shield text-navitag-blue fa-2x mb-4"></i>
          <h4 class="font-bold text-gray-900 text-sm">Smart Wearable</h4>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-gray-200 text-center hover:shadow-lg transition">
          <i class="fas fa-paw text-navitag-orange fa-2x mb-4"></i>
          <h4 class="font-bold text-gray-900 text-sm">Pet Tracker</h4>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-gray-200 text-center hover:shadow-lg transition">
          <i class="fas fa-suitcase text-gray-800 fa-2x mb-4"></i>
          <h4 class="font-bold text-gray-900 text-sm">Stealth Tracker</h4>
        </div>
      </div>

      <div class="text-center">
        <NuxtLink to="/ph/distribution" class="inline-block px-10 py-4 rounded-full bg-navitag-blue text-white font-semibold hover:bg-opacity-90 transition shadow-lg text-lg">
          Find Official Stores &amp; Retailers <i class="fas fa-arrow-right ml-2"></i>
        </NuxtLink>
      </div>
    </div>
  </section>

  <!-- Backed by Global Innovation -->
  <section class="py-24 bg-white border-t border-gray-100">
    <div class="container mx-auto px-6 max-w-4xl text-center">
      <i class="fas fa-handshake fa-3x text-gray-300 mb-6"></i>
      <h2 class="text-3xl font-extrabold tracking-tight text-gray-950 mb-6">Backed by Global Innovation</h2>
      <p class="text-lg text-gray-600 leading-relaxed">
        <strong>Navitag Technology Systems OPC</strong> is the exclusive regional operator for <strong>Navitag Digital Innovations LLC (USA)</strong>. This strategic structure allows us to bring world-class, US-engineered M2M security directly to the Southeast Asian market with unmatched local expertise and compliance.
      </p>
    </div>
  </section>

  <!-- Contact -->
  <section id="contact" class="py-24 bg-gray-50">
    <div class="container mx-auto px-6 max-w-4xl">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-extrabold tracking-tight text-gray-950 mb-6">Connect with Regional Sales</h2>
        <p class="text-lg text-gray-600">For enterprise fleet pricing, B2B volume orders, or local partnership inquiries across Southeast Asia.</p>
      </div>

      <div class="bg-white p-12 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 text-center max-w-2xl mx-auto">
        <div class="w-20 h-20 mx-auto bg-navitag-blue bg-opacity-10 rounded-full flex items-center justify-center mb-6">
          <i class="fas fa-envelope-open-text fa-3x text-navitag-blue"></i>
        </div>
        <h3 class="text-2xl font-bold text-gray-950 mb-2">APAC Fleet &amp; Enterprise Inquiries</h3>
        <p class="text-gray-500 text-sm mb-8 font-mono uppercase">Operating in GMT+8 (Metro Manila)</p>
        <p class="text-gray-600 mb-8 leading-relaxed">
          Our local team is ready to assist with deployment strategies and bulk pricing for your regional operations.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="mailto:phsales@navitag.com" class="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-navitag-blue text-white font-semibold hover:bg-opacity-90 transition shadow-lg shadow-navitag-blue/20 text-lg">
            phsales@navitag.com
          </a>
          <a href="mailto:info@navitag.com" class="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-white text-gray-900 border border-gray-200 font-semibold hover:bg-gray-50 transition text-lg">
            Local Support
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
