<script setup lang="ts">
const pillars = [
  {
    icon: 'fa-sim-card',
    title: 'Built-in M2M eSIM',
    body: 'Every device ships with a machine-to-machine eSIM pre-provisioned. Nothing to insert, nothing to swap.',
  },
  {
    icon: 'fa-tower-broadcast',
    title: 'Multi-carrier by default',
    body: 'Your device picks the strongest local network automatically — across hundreds of mobile operators.',
  },
  {
    icon: 'fa-globe',
    title: 'Flexible management',
    body: 'Centralized portal for easy management of devices and plans.',
  },
]
</script>

<template>
  <section class="relative bg-navitag-bg py-20 sm:py-28 lg:py-32 overflow-hidden">
    <!-- Subtle ambient orb -->
    <div
      class="absolute -top-40 -right-32 w-[480px] h-[480px] rounded-full bg-navitag-blue/10 blur-3xl pointer-events-none"
      aria-hidden="true"
    ></div>
    <div
      class="absolute -bottom-48 -left-20 w-[420px] h-[420px] rounded-full bg-navitag-orange/10 blur-3xl pointer-events-none"
      aria-hidden="true"
    ></div>

    <div class="relative max-w-7xl mx-auto px-6 sm:px-8">
      <div class="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <!-- Copy side -->
        <div class="lg:col-span-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navitag-orange/15 text-navitag-orange text-[11px] font-semibold tracking-[0.15em] uppercase">
            Connectivity, solved
          </div>
          <h2 class="mt-5 text-4xl sm:text-5xl lg:text-[56px] font-semibold tracking-tight leading-[1.02] text-gray-950">
            No SIM card.<br>
            <span class="text-navitag-blue">No contracts.</span><br>
            <span class="text-gray-500">No borders.</span>
          </h2>
          <p class="mt-6 text-base sm:text-lg text-gray-600 max-w-xl leading-relaxed">
            We built our own global telco layer so you don't have to think about it. Navitag devices connect the moment they power on — whether you're in Manila, Madrid, or Montana.
          </p>

          <!-- Pillars -->
          <dl class="mt-10 space-y-6">
            <div
              v-for="p in pillars"
              :key="p.title"
              class="flex gap-5"
            >
              <div class="shrink-0 w-11 h-11 rounded-xl bg-white border border-gray-200/70 shadow-sm flex items-center justify-center text-navitag-blue">
                <i :class="['fas', p.icon, 'text-[15px]']"></i>
              </div>
              <div>
                <dt class="text-[15px] font-semibold text-gray-950 tracking-tight">
                  {{ p.title }}
                </dt>
                <dd class="mt-1 text-[14.5px] text-gray-600 leading-relaxed">
                  {{ p.body }}
                </dd>
              </div>
            </div>
          </dl>

          <div class="mt-10 flex flex-col sm:flex-row gap-3">
            <NuxtLink
              to="/data-plans"
              class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gray-950 text-white text-sm font-semibold hover:bg-gray-800 transition"
              data-pixel-event="Custom"
              data-pixel-custom-name="HomeSectionCTA"
              data-pixel-audience="b2c"
              data-pixel-content-name="nosim_explore_plans"
            >
              Explore data plans
              <i class="fas fa-arrow-right text-xs"></i>
            </NuxtLink>
            <NuxtLink
              to="/shop"
              class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white border border-gray-200 text-gray-950 text-sm font-semibold hover:border-gray-300 transition"
              data-pixel-event="Custom"
              data-pixel-custom-name="HomeSectionCTA"
              data-pixel-audience="b2c"
              data-pixel-content-name="nosim_shop_devices"
            >
              Shop devices
            </NuxtLink>
          </div>
        </div>

        <!-- Visual side -->
        <div class="lg:col-span-6">
          <div class="relative mx-auto max-w-md lg:max-w-none">
            <!-- Main visual card -->
            <div class="relative aspect-square rounded-[32px] bg-white border border-gray-200/70 shadow-2xl shadow-gray-300/40 overflow-hidden">
              <!-- Product placeholder -->
              <div class="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100">
                <!-- Grid pattern -->
                <div
                  class="absolute inset-0 opacity-50"
                  style="background-image: linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px); background-size: 32px 32px;"
                ></div>
                <!-- Placeholder label -->
                <div class="absolute top-5 left-5 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-400 bg-white rounded-full border border-gray-200">
                  Product · 1:1
                </div>

                <!-- Center composed visual -->
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="relative">
                    <!-- Radar pulses -->
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div class="w-56 h-56 rounded-full border border-navitag-blue/20 animate-[ping_3s_ease-out_infinite]"></div>
                    </div>
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div class="w-40 h-40 rounded-full border border-navitag-blue/30 animate-[ping_3s_ease-out_0.6s_infinite]"></div>
                    </div>
                    <!-- Center chip -->
                    <div class="relative z-10 w-28 h-28 rounded-2xl bg-gradient-to-br from-navitag-blue to-[#0A60C8] shadow-xl shadow-navitag-blue/30 flex items-center justify-center">
                      <i class="fas fa-sim-card text-white text-4xl"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Floating spec cards -->
            <div class="absolute -left-4 sm:-left-6 bottom-10 bg-white rounded-2xl shadow-xl shadow-gray-300/50 border border-gray-100 px-4 py-3 flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              </div>
              <div>
                <div class="text-[11px] uppercase tracking-widest text-gray-400 font-semibold">
                  Status
                </div>
                <div class="text-sm font-semibold text-gray-950">
                  Connected · 2G / 3G / 4G / 5G
                </div>
              </div>
            </div>

            <div class="absolute -right-4 sm:-right-6 top-10 bg-white rounded-2xl shadow-xl shadow-gray-300/50 border border-gray-100 px-4 py-3">
              <div class="text-[11px] uppercase tracking-widest text-gray-400 font-semibold">
                Network
              </div>
              <div class="text-sm font-semibold text-gray-950">
                Multi-IMSI · 600+ carriers
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
