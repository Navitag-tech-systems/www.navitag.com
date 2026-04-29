<script setup lang="ts">
withDefaults(defineProps<{
  /** Region code — `ph` adds the LTFRB-certified callout below the
   *  lab-test note. Anything else renders the global default only. */
  region?: 'global' | 'ph'
}>(), {
  region: 'global',
})

// Industry-standard regulatory / quality marks common to GPS tracker hardware.
// Rendered as monochrome typographic badges — swap with official cert SVGs later.
const certs = [
  { label: 'CE', caption: 'EU Conformity' },
  { label: 'FCC', caption: 'US Compliance' },
  { label: 'RoHS', caption: 'Restricted Substances' },
  { label: 'IP67', caption: 'Dust &amp; Water Resistant' },
  { label: 'ISO 9001', caption: 'Quality Management' },
  { label: '2G-5G', caption: 'Multi-gen Support' },
]
</script>

<template>
  <section class="relative bg-white py-20 sm:py-28 lg:py-32 border-t border-gray-100">
    <div class="max-w-7xl mx-auto px-6 sm:px-8">
      <div class="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        <!-- Copy side -->
        <div class="lg:col-span-5">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navitag-blue/10 text-navitag-blue text-[11px] font-semibold tracking-[0.15em] uppercase">
            Built to last
          </div>
          <h2 class="mt-5 text-4xl sm:text-5xl lg:text-[56px] font-semibold tracking-tight leading-[1.02] text-gray-950">
            Certified, <br>tested, <br><span class="text-gray-400">guaranteed.</span>
          </h2>
          <p class="mt-6 text-base sm:text-lg text-gray-600 max-w-xl leading-relaxed">
            Every Navitag device ships from factories with ISO-grade quality controls and passes international regulatory standards before it reaches your hands.
          </p>

          <!-- Warranty callout -->
          <div class="mt-10 relative overflow-hidden rounded-3xl bg-gradient-to-br from-navitag-blue to-[#0A60C8] text-white p-7 sm:p-8 shadow-xl shadow-navitag-blue/20">
            <!-- Ambient glow -->
            <div class="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div class="absolute top-6 right-6 w-14 h-14 rounded-full bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <i class="fas fa-shield-halved text-xl"></i>
            </div>

            <div class="relative">
              <div class="text-[11px] uppercase tracking-[0.2em] font-semibold text-white/70">
                Standard on every device
              </div>
              <div class="mt-3 flex items-baseline gap-2">
                <span class="text-5xl sm:text-6xl font-semibold tracking-tight leading-none">12</span>
                <span class="text-lg font-medium text-white/80">months</span>
              </div>
              <div class="mt-2 text-xl font-semibold tracking-tight">
                Full warranty
              </div>
              <p class="mt-3 text-[14px] text-white/75 max-w-sm leading-relaxed">
                Free repair or replacement on manufacturing defects. No hidden terms, no runaround.
              </p>
            </div>
          </div>
        </div>

        <!-- Certifications grid -->
        <div class="lg:col-span-7">
          <div class="text-[11px] uppercase tracking-[0.2em] font-semibold text-gray-400 mb-6">
            Certifications &amp; Standards
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <div
              v-for="c in certs"
              :key="c.label"
              class="group relative rounded-2xl border border-gray-200/70 bg-gradient-to-br from-white to-gray-50/60 p-5 sm:p-6 hover:border-navitag-blue/30 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300"
            >
              <!-- Badge -->
              <div class="flex items-center justify-center h-14 sm:h-16">
                <span class="inline-flex items-center justify-center min-w-[64px] px-3 py-2 rounded-md border-2 border-gray-900 text-gray-900 font-bold tracking-tight text-base sm:text-lg leading-none group-hover:border-navitag-blue group-hover:text-navitag-blue transition-colors">
                  {{ c.label }}
                </span>
              </div>
              <!-- Caption -->
              <div class="mt-4 text-center">
                <div class="text-[12.5px] font-medium text-gray-600 leading-snug" v-html="c.caption"></div>
              </div>
            </div>
          </div>

          <!-- Quality note -->
          <div class="mt-8 flex items-start gap-4 p-5 rounded-2xl bg-navitag-bg border border-gray-200/70">
            <div class="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-navitag-orange">
              <i class="fas fa-flask-vial text-sm"></i>
            </div>
            <div>
              <div class="text-[14.5px] font-semibold text-gray-950 tracking-tight">
                Every batch is lab-tested
              </div>
              <p class="mt-1 text-[13.5px] text-gray-600 leading-relaxed">
                Signal integrity, waterproofing, battery endurance, and thermal stability — verified before shipping.
              </p>
            </div>
          </div>

          <!-- PH regulatory note -->
          <div
            v-if="region === 'ph'"
            class="mt-4 flex items-start gap-4 p-5 rounded-2xl bg-navitag-bg border border-gray-200/70"
          >
            <div class="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden p-1">
              <img
                src="/partners/ltfrb.svg"
                alt="LTFRB seal"
                class="w-full h-full object-contain"
              />
            </div>
            <div>
              <div class="text-[14.5px] font-semibold text-gray-950 tracking-tight">
                LTFRB Certified
              </div>
              <p class="mt-1 text-[13.5px] text-gray-600 leading-relaxed">
                Approved by the Land Transportation Franchising and Regulatory Board for use in Philippine for-hire and commercial fleet operations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
