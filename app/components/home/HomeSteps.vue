<script setup lang="ts">
const steps = [
  {
    n: '01',
    title: 'Create your account',
    body: 'Sign up in under a minute. One account powers every Navitag device, plan, and region.',
    icon: 'fa-user-plus',
  },
  {
    n: '02',
    title: 'Scan QR to activate',
    body: 'Open the box, scan the QR on the device. Your M2M eSIM activates automatically — no SIM swap, no carrier setup.',
    icon: 'fa-qrcode',
  },
  {
    n: '03',
    title: 'Set up on your vehicle',
    body: 'Mount it, plug it in, or drop it in. Takes minutes on cars, motorbikes, fleets, or assets.',
    icon: 'fa-car',
  },
  {
    n: '04',
    title: 'Track online or in-app',
    body: 'Live location, trip history, geofences, and alerts — on the web dashboard or the Navitag app.',
    icon: 'fa-location-crosshairs',
  },
]
</script>

<template>
  <section class="relative bg-white py-20 sm:py-28 lg:py-32">
    <div class="max-w-7xl mx-auto px-6 sm:px-8">
      <!-- Eyebrow + heading -->
      <div class="max-w-3xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navitag-blue/10 text-navitag-blue text-[11px] font-semibold tracking-[0.15em] uppercase">
          Ease of use
        </div>
        <h2 class="mt-5 text-4xl sm:text-5xl lg:text-[56px] font-semibold tracking-tight leading-[1.05] text-gray-950">
          From unboxing to live tracking <span class="text-gray-400">— in minutes.</span>
        </h2>
        <p class="mt-5 text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
          Every Navitag device is designed around one rule: it has to work the moment you open the box. No carriers to call. No apps to configure.
        </p>
      </div>

      <!-- Steps grid -->
      <div class="relative mt-16 lg:mt-20">
        <!-- Connector line (desktop only) -->
        <div
          class="hidden lg:block absolute left-0 right-0 top-[72px] h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"
          aria-hidden="true"
        ></div>

        <ol class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <li
            v-for="step in steps"
            :key="step.n"
            class="relative group"
          >
            <!-- Card -->
            <div class="relative h-full p-6 sm:p-7 rounded-2xl bg-gray-50 border border-gray-100 transition-all duration-300 hover:bg-white hover:border-gray-200 hover:shadow-xl hover:shadow-gray-200/40 hover:-translate-y-0.5">
              <!-- Icon bubble -->
              <div class="relative w-14 h-14 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-navitag-blue">
                <i :class="['fas', step.icon, 'text-[18px]']"></i>
              </div>
              <!-- Step number -->
              <div class="absolute top-6 right-6 font-mono text-xs font-semibold text-gray-300 tracking-[0.2em]">
                {{ step.n }}
              </div>
              <h3 class="mt-6 text-lg font-semibold tracking-tight text-gray-950">
                {{ step.title }}
              </h3>
              <p class="mt-2 text-[14.5px] text-gray-600 leading-relaxed">
                {{ step.body }}
              </p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>
