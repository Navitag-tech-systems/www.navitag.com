<script setup lang="ts">
useHead({
  title: 'Navitag - Globally Ready. Locally Supported',
  link: [{ rel: 'icon', href: '/logo-sm.png', type: 'image/x-icon' }],
})
</script>

<template>
  <!-- Hero -->
  <section id="hero" class="relative bg-gray-50 py-24 md:py-32">
    <div class="container mx-auto px-6 grid md:grid-cols-12 gap-12 items-center">
      <div class="md:col-span-6 text-center md:text-left">
        <div class="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-navitag-blue bg-opacity-10 text-navitag-blue font-semibold text-xs border border-navitag-blue border-opacity-20 mb-6">
          <i class="fas fa-globe"></i> Globally Ready, Locally Supported
        </div>
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-gray-950 mb-8">
          Borderless Security.<br> <span class="text-navitag-blue">Plug &amp; Play.</span>
        </h1>
        <p class="text-lg text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto md:mx-0">
          Ditch the hassle. Navitag provides an entire ecosystem of GPS Trackers, Wearables, and Live Dashcams with global M2M connectivity, working in over 100 countries from Day One.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
          <a href="#products" class="px-8 py-3.5 rounded-full bg-navitag-blue text-white font-semibold hover:bg-opacity-90 transition text-center shadow-lg shadow-navitag-blue/20">
            Explore Our Products <i class="fas fa-arrow-right ml-2"></i>
          </a>
          <a href="#connectivity" class="px-8 py-3.5 rounded-full bg-white text-gray-950 font-semibold border border-gray-200 hover:border-gray-300 transition text-center">
            How M2M eSIM Works
          </a>
        </div>
      </div>
      <div class="md:col-span-6 flex justify-center">
        <div class="relative w-full aspect-video bg-white p-8 rounded-3xl shadow-2xl shadow-gray-200/50 flex flex-col justify-between border border-gray-100">
          <div class="flex justify-between items-center">
            <div class="flex gap-2">
              <img src="/logo-sm.png" alt="" class="h-6 w-auto">
              <span class="font-bold text-gray-900">Navitag US, APAC, LATIN AMERICA</span>
            </div>
          </div>
          <div class="w-full h-px bg-gray-100"></div>
          <div class="text-center font-extrabold text-5xl tracking-tighter text-navitag-blue">GLOBAL CONNECTIVITY</div>
          <div class="w-full h-px bg-gray-100"></div>
          <div class="flex justify-between items-center text-xs text-gray-500 font-mono">
            <div>GPS / VIDEO / WEARABLES</div>
            <div>WORKS IN 100+ COUNTRIES</div>
            <div>M2M eSIM Technology</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- The M2M Edge -->
  <section id="connectivity" class="py-24 bg-white">
    <div class="container mx-auto px-6">
      <div class="text-center mb-20 max-w-3xl mx-auto">
        <i class="fas fa-satellite-dish fa-3x text-navitag-orange mb-6"></i>
        <h2 class="text-4xl font-extrabold tracking-tight text-gray-950 mb-6">The Global Navitag Edge</h2>
        <p class="text-lg text-gray-600 leading-relaxed">
          Stop worrying about maintenance and safety of your devices. Navitag devices arrive with dedicated M2M eSIM technology, activated upon use, and ready to transmit globally.
        </p>
      </div>

      <div class="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
        <div class="bg-gray-50 p-10 rounded-3xl border border-gray-100">
          <i class="fas fa-times-circle fa-2x text-red-500 mb-6"></i>
          <h3 class="text-xl font-bold text-gray-950 mb-4">The Traditional Way</h3>
          <ul class="space-y-4 text-gray-600 list-disc list-inside">
            <li>Purchase device.</li>
            <li>Search for suitable network provider.</li>
            <li>Register &amp; Activate new SIM locally.</li>
            <li>Configure complex APN settings.</li>
            <li>Manage <em>another</em> monthly data plan.</li>
            <li>Lose signal when crossing borders.</li>
          </ul>
        </div>
        <div class="bg-white p-10 rounded-3xl border-2 border-navitag-blue shadow-lg shadow-navitag-blue/10">
          <i class="fas fa-check-circle fa-2x text-navitag-blue mb-6"></i>
          <h3 class="text-xl font-bold text-navitag-blue mb-4">Navitag Global Devices</h3>
          <ul class="space-y-4 text-gray-600 list-disc list-inside font-medium">
            <li>Purchase Navitag device.</li>
            <li>Activate with the App</li>
            <li class="font-bold text-navitag-blue">Instant Global Location Tracking</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- Products -->
  <section id="products" class="py-24 bg-gray-50">
    <div class="container mx-auto px-6">
      <div class="text-center mb-20">
        <h2 class="text-4xl font-extrabold tracking-tight text-gray-950">Secure Your World, Globally.</h2>
        <p class="text-lg text-gray-600 mt-4">From enterprise fleets to your family members. One global M2M standard.</p>
      </div>

      <div class="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto mb-12">
        <!-- GPS Tracker -->
        <div class="bg-white p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col justify-between">
          <div>
            <div class="inline-block px-3 py-1.5 rounded-full bg-navitag-blue bg-opacity-10 text-navitag-blue font-semibold text-xs border border-navitag-blue border-opacity-20 mb-6">
              FLEET &amp; ASSET TRACKING
            </div>
            <h3 class="text-3xl font-extrabold tracking-tight text-gray-950 mb-6">Global GPS Tracker</h3>
            <p class="text-gray-600 leading-relaxed mb-8">
              Our ultra-accurate, compact GPS trackers offer unparalleled visibility into your vehicles, assets, or shipments, with global coverage and multi-year battery options.
            </p>
            <div class="space-y-5 text-gray-700">
              <div class="flex gap-4 items-center"><i class="fas fa-map-marker-alt text-navitag-blue fa-lg w-6"></i> True Global Real-Time Location</div>
              <div class="flex gap-4 items-center"><i class="fas fa-battery-full text-navitag-blue fa-lg w-6"></i> Heavy Duty Device (up to 5 Years)</div>
              <div class="flex gap-4 items-center"><i class="fas fa-lock text-navitag-blue fa-lg w-6"></i> Geofencing &amp; Theft Alerts</div>
              <div class="flex gap-4 items-center"><i class="fas fa-mobile-alt text-navitag-blue fa-lg w-6"></i> Seamless Multi-Network M2M Coverage</div>
            </div>
          </div>
        </div>

        <!-- Dashcam -->
        <div class="bg-white p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col justify-between">
          <div>
            <div class="inline-block px-3 py-1.5 rounded-full bg-navitag-orange bg-opacity-10 text-navitag-orange font-semibold text-xs border border-navitag-orange border-opacity-20 mb-6">
              LIVE STREAMING VIDEO
            </div>
            <h3 class="text-3xl font-extrabold tracking-tight text-gray-950 mb-6">Live-Stream Dashcam</h3>
            <p class="text-gray-600 leading-relaxed mb-8">
              Get real-time visual situational awareness. Our dashcams leverage the M2M SIM to provide seamless live-video streaming and remote view from anywhere in the world.
            </p>
            <div class="space-y-5 text-gray-700">
              <div class="flex gap-4 items-center"><i class="fas fa-video text-navitag-orange fa-lg w-6"></i> Cloud Recording</div>
              <div class="flex gap-4 items-center"><i class="fas fa-satellite-dish text-navitag-orange fa-lg w-6"></i> Multi-Network Streaming SIM</div>
              <div class="flex gap-4 items-center"><i class="fas fa-shield-alt text-navitag-orange fa-lg w-6"></i> AI-Powered Collision &amp; Theft Recording</div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <!-- Smart Wearable -->
        <div class="bg-white p-8 rounded-3xl shadow-lg shadow-gray-200/40 border border-gray-100">
          <div class="w-14 h-14 rounded-full bg-navitag-blue bg-opacity-10 flex items-center justify-center mb-6">
            <i class="fas fa-user-shield text-navitag-blue fa-xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-950 mb-3">Smart Wearable</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-4">
            Complete peace of mind for your most precious family members. Designed for safety and simplicity, this lightweight tracker can be worn comfortably on the wrist or as a discreet necklace.
          </p>
          <ul class="text-sm text-gray-700 space-y-2 font-medium">
            <li><i class="fas fa-check text-navitag-blue mr-2"></i> Instant SOS Button</li>
            <li><i class="fas fa-check text-navitag-blue mr-2"></i> Safe-Zone Alerts</li>
          </ul>
        </div>

        <!-- Pet Tracker -->
        <div class="bg-white p-8 rounded-3xl shadow-lg shadow-gray-200/40 border border-gray-100">
          <div class="w-14 h-14 rounded-full bg-navitag-orange bg-opacity-10 flex items-center justify-center mb-6">
            <i class="fas fa-paw text-navitag-orange fa-xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-950 mb-3">Rugged Pet Tracker</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-4">
            Because pets are family, too. Built to withstand active lifestyles, this water-resistant tracker attaches easily to any standard collar.
          </p>
          <ul class="text-sm text-gray-700 space-y-2 font-medium mt-auto">
            <li><i class="fas fa-check text-navitag-orange mr-2"></i> Universal Collar Fit</li>
            <li><i class="fas fa-check text-navitag-orange mr-2"></i> Escape Mobile Alerts</li>
          </ul>
        </div>

        <!-- Stealth Tracker -->
        <div class="bg-white p-8 rounded-3xl shadow-lg shadow-gray-200/40 border border-gray-100">
          <div class="w-14 h-14 rounded-full bg-gray-900 bg-opacity-5 flex items-center justify-center mb-6 border border-gray-200">
            <i class="fas fa-suitcase text-gray-800 fa-xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-950 mb-3">Universal Stealth Tracker</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-4">
            Zero installation. Endless possibilities. Drop this ultra-compact tracker into luggage, backpacks, toolboxes, or the glovebox for months of continuous tracking.
          </p>
          <ul class="text-sm text-gray-700 space-y-2 font-medium">
            <li><i class="fas fa-check text-gray-800 mr-2"></i> Drop-and-Go Design</li>
            <li><i class="fas fa-check text-gray-800 mr-2"></i> Ultra-Long Battery Life</li>
          </ul>
        </div>
      </div>

      <div class="text-center mt-12">
        <a href="#contact" class="inline-block px-10 py-4 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-800 transition shadow-lg text-lg">
          Request Pricing &amp; Distribution Info
        </a>
      </div>
    </div>
  </section>

  <!-- The App -->
  <section id="the-app" class="py-24 bg-white">
    <div class="container mx-auto px-6 grid md:grid-cols-12 gap-12 items-center">
      <div class="md:col-span-6 flex justify-center order-last md:order-first">
        <div class="w-full h-96 aspect-auto relative">
          <div class="absolute -left-6 bottom-0 w-40 h-80 bg-navitag-blue rounded-3xl shadow-xl shadow-navitag-blue/10 border-4 border-white flex flex-col items-center justify-center text-white text-xs font-mono p-4 text-center">
            <i class="fas fa-mobile-alt fa-3x mb-4"></i>
            iOS APP
          </div>
          <div class="absolute top-10 left-1/2 -translate-x-1/2 w-48 h-96 bg-navitag-orange rounded-3xl shadow-xl shadow-navitag-orange/10 border-4 border-white flex flex-col items-center justify-center text-white text-xs font-mono p-4 text-center">
            <i class="fas fa-map-marked-alt fa-3x mb-4"></i>
            LIVE MAP (WEB)
          </div>
          <div class="absolute right-0 bottom-10 w-44 h-72 bg-gray-900 rounded-3xl shadow-xl shadow-gray-200 border-4 border-white flex flex-col items-center justify-center text-white text-xs font-mono p-4 text-center">
            <i class="fas fa-play fa-2x mb-4"></i>
            VIDEO PLAYBACK
          </div>
        </div>
      </div>
      <div class="md:col-span-6">
        <div class="flex items-center gap-4 mb-6">
          <img src="/logo-sm.png" alt="" class="h-10 w-auto">
          <span class="text-2xl font-bold text-gray-900">Navitag Ecosystem</span>
        </div>
        <h2 class="text-4xl font-extrabold tracking-tight text-gray-950 mb-8">One App. Your Entire World, Secured.</h2>
        <p class="text-lg text-gray-600 leading-relaxed mb-10">
          No more juggling different apps for your vehicles, assets, and family members. The Navitag Ecosystem brings everything under one roof. Monitor your live dashcams, check your fleet's trip history, and ensure your child made it home safely—all from a single, unified dashboard available seamlessly across iOS, Android, and Web.
        </p>
        <div class="flex gap-6 text-gray-700">
          <div class="flex items-center gap-3">
            <i class="fas fa-globe text-navitag-blue fa-2x"></i> Web Dashboard
          </div>
          <div class="flex items-center gap-3">
            <i class="fab fa-apple text-navitag-orange fa-2x"></i> iOS App
          </div>
          <div class="flex items-center gap-3">
            <i class="fab fa-android text-navitag-blue fa-2x"></i> Android App
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Global Footprint -->
  <section id="global" class="py-24 bg-gray-50 border-t border-gray-100">
    <div class="container mx-auto px-6">
      <div class="text-center mb-16 max-w-3xl mx-auto">
        <i class="fas fa-globe-asia fa-3x text-navitag-blue mb-6"></i>
        <h2 class="text-4xl font-extrabold tracking-tight text-gray-950 mb-6">A Global Brand, Locally Supported.</h2>
        <p class="text-lg text-gray-600 leading-relaxed">
          Navitag is strategically headquartered for global operations, with dedicated local support to provide personalized service and fast logistics.
        </p>
      </div>

      <div class="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
        <div class="bg-white p-8 rounded-3xl border border-gray-100 flex items-center gap-6">
          <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200">
            <i class="fas fa-flag-usa fa-2x"></i>
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-950">Global Headquarters (USA)</h3>
            <p class="text-sm text-gray-600">Headquartered in the USA (LLC Registered) for worldwide operations, technology innovation, and global M2M partner management.</p>
          </div>
        </div>
        <div class="bg-white p-8 rounded-3xl border border-gray-100 flex items-center gap-6">
          <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200">
            <i class="fas fa-map-marked-alt fa-2x"></i>
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-950">APAC Regional Hub (Philippines)</h3>
            <p class="text-sm text-gray-600">Local Navitag entity to handle logistics, localized support, and distribution for Southeast Asia.</p>
          </div>
        </div>
      </div>
      <div class="text-center mt-12">
        <NuxtLink to="/ph" class="inline-flex items-center gap-2 text-navitag-blue font-bold hover:underline">
          Visit our Southeast Asia Regional Portal <i class="fas fa-arrow-right"></i>
        </NuxtLink>
      </div>
    </div>
  </section>

  <!-- Contact -->
  <section id="contact" class="py-24 bg-white">
    <div class="container mx-auto px-6 max-w-4xl">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-extrabold tracking-tight text-gray-950 mb-6">Let's Secure Your Assets</h2>
        <p class="text-lg text-gray-600">Our experts are ready to help you deploy global tracking and streaming solutions. Reach out to our teams, wherever you are.</p>
      </div>

      <div class="bg-gray-50 p-12 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 text-center max-w-2xl mx-auto">
        <div class="w-20 h-20 mx-auto bg-navitag-blue bg-opacity-10 rounded-full flex items-center justify-center mb-6">
          <i class="fas fa-envelope-open-text fa-3x text-navitag-blue"></i>
        </div>
        <h3 class="text-2xl font-bold text-gray-950 mb-4">Get in Touch</h3>
        <p class="text-gray-600 mb-8 leading-relaxed">
          For enterprise sales, bulk pricing, or technical support, drop us a line. We aim to respond to all global inquiries within 24 hours.
        </p>
        <a href="mailto:team@navitag.com" class="inline-flex items-center justify-center px-10 py-4 rounded-full bg-navitag-blue text-white font-semibold hover:bg-opacity-90 transition shadow-lg shadow-navitag-blue/20 text-lg w-full sm:w-auto">
          team@navitag.com
        </a>
      </div>
    </div>
  </section>
</template>
