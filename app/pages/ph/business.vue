<script setup lang="ts">
definePageMeta({ layout: 'ph' })

useSeoMeta({
  title: 'Navitag Business Philippines — Fleet Tracking & Enterprise Plans',
  description: 'Local fleet tracking for Philippine operators. Volume pricing in PHP, on-site installation across Metro Manila & Cebu, 24/7 support, lifetime warranty, daily reports — and LTFRB-certified hardware.',
  ogTitle: 'Navitag Business Philippines — Fleet Tracking & Enterprise Plans',
  ogDescription: 'Local fleet tracking for Philippine operators with PHP pricing, on-site installation, and LTFRB-certified hardware.',
  ogUrl: 'https://navitag.com/ph/business',
})
useHead({ link: [{ rel: 'canonical', href: 'https://navitag.com/ph/business' }] })

if (import.meta.client) {
  const { $fbq } = useNuxtApp()
  onMounted(() => {
    $fbq('ViewContent', {
      content_name: 'business_ph',
      content_category: 'fleet',
      audience: 'b2b',
    })
  })
}

interface FleetCopy {
  label: string
  tagline: string
  highlighted?: boolean
}

const fleetCopy: FleetCopy[] = [
  {
    label: 'Starter Fleet',
    tagline: 'Small operators getting started with connected vehicles.',
  },
  {
    label: 'Growth Fleet',
    tagline: 'Expanding rosters: courier, rental, and dispatch fleets.',
  },
  {
    label: 'Enterprise Fleet',
    tagline: 'Large logistics, PUV, and corporate fleet operators.',
  },
]

const { tiers: fleetData } = await useFleetPricing('PH')
const billingTerm = ref<'monthly' | 'annual'>('monthly')

const fleetTiers = computed(() => fleetCopy.map((c, i) => {
  const data = fleetData.value[i]!
  const isCustom = data.size === 'large'
  return {
    ...c,
    range: data.range,
    perDevice: billingTerm.value === 'annual' ? data.annual : data.monthly,
    note: isCustom
      ? 'contact for volume pricing'
      : billingTerm.value === 'annual' ? 'per device · billed annually' : 'per device · monthly',
  }
}))

interface Service {
  icon: string
  title: string
  body: string
  tag?: string
}

const services: Service[] = [
  {
    icon: 'fa-screwdriver-wrench',
    title: 'Free on-site installation',
    body: 'Our local field technicians handle mounting, wiring, and activation for every device.',
    tag: 'Metro Manila · Cebu',
  },
  {
    icon: 'fa-magnifying-glass',
    title: 'Warranty inspection',
    body: 'Scheduled on-site inspections to catch hardware faults before they impact uptime.',
    tag: 'Metro Manila · Cebu',
  },
  {
    icon: 'fa-rotate-right',
    title: 'On-site replacement',
    body: 'If a device fails under warranty, we come to your yard or branch and swap it — no shipping wait.',
    tag: 'Metro Manila · Cebu',
  },
  {
    icon: 'fa-headset',
    title: '24/7 dedicated support',
    body: 'Priority phone, Viber, and email support with real humans — day, night, weekends, holidays.',
  },
  {
    icon: 'fa-shield-alt',
    title: 'Lifetime warranty',
    body: "We replace any defective, broken, or end-of-life device for free — for as long as it's on a Business plan.",
  },
  {
    icon: 'fa-chart-line',
    title: 'Daily reports',
    body: 'Per-device activity and full fleet overview emailed every morning, plus on-demand in dashboard.',
  },
]

interface ReportRow {
  metric: string
  detail: string
}

const perDeviceReport: ReportRow[] = [
  { metric: 'Distance travelled', detail: 'Total km per driver, per shift' },
  { metric: 'Idle time', detail: 'Engine-on time with no movement' },
  { metric: 'Speeding events', detail: 'Breaches of set speed policy' },
  { metric: 'Geofence activity', detail: 'Entry, exit, and dwell time' },
  { metric: 'Utilization', detail: 'Active hours vs parked hours' },
]

const fleetReport: ReportRow[] = [
  { metric: 'Fleet health', detail: 'Online / offline / low-battery counts' },
  { metric: 'Aggregate mileage', detail: 'Daily, weekly, monthly rollups' },
  { metric: 'Driver scorecard', detail: 'Speeding, braking, idling across drivers' },
  { metric: 'Compliance flags', detail: 'Out-of-zone vehicles and unauthorized use' },
  { metric: 'Cost per km', detail: 'Derived from usage + plan spend' },
]

interface IncludedFeature {
  icon: string
  label: string
}

const includedFeatures: IncludedFeature[] = [
  { icon: 'fa-stopwatch', label: '10-second location updates' },
  { icon: 'fa-clock-rotate-left', label: '6 months of history playback' },
  { icon: 'fa-draw-polygon', label: 'Unlimited geofences' },
  { icon: 'fa-bell', label: 'Webhooks · app alerts' },
  { icon: 'fa-tower-broadcast', label: 'Globe + Smart 4G LTE / 5G' },
  { icon: 'fa-file-export', label: 'CSV data exports' },
]

interface UseCase {
  icon: string
  title: string
  body: string
}

const useCases: UseCase[] = [
  {
    icon: 'fa-truck-fast',
    title: 'Courier & last-mile',
    body: 'Live route tracking, proof-of-delivery dwell time, and rider scorecards for parcel and food delivery fleets.',
  },
  {
    icon: 'fa-bus',
    title: 'PUV & shuttle operators',
    body: 'LTFRB-aligned hardware with route compliance, speeding flags, and per-unit utilization for jeepney and shuttle ops.',
  },
  {
    icon: 'fa-car-side',
    title: 'Rental & ride-hail fleets',
    body: 'Geofence enforcement, after-hours alerts, and recovery tools to keep your assets where they should be.',
  },
  {
    icon: 'fa-trailer',
    title: 'Logistics & cold chain',
    body: 'Cross-province tracking on Globe + Smart networks with battery-backed devices for trailer and container fleets.',
  },
]
</script>

<template>
  <!-- Hero -->
  <section class="relative bg-navitag-bg overflow-hidden">
    <div
      class="absolute -top-40 -right-20 w-[640px] h-[640px] rounded-full bg-navitag-blue/10 blur-3xl pointer-events-none"
      aria-hidden="true"
    ></div>
    <div
      class="absolute -bottom-40 -left-20 w-[480px] h-[480px] rounded-full bg-navitag-orange/10 blur-3xl pointer-events-none"
      aria-hidden="true"
    ></div>

    <div class="relative max-w-7xl mx-auto px-6 sm:px-8 pt-20 sm:pt-28 pb-16 sm:pb-24">
      <div class="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        <div class="lg:col-span-7">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700 text-[11px] font-semibold tracking-[0.15em] uppercase">
            <span class="w-1.5 h-1.5 rounded-full bg-navitag-orange"></span>
            Navitag Business · Philippines
          </div>
          <h1 class="mt-5 text-4xl sm:text-5xl lg:text-[64px] font-semibold tracking-tight leading-[1.02] text-gray-950">
            Fleet tracking <span class="text-navitag-blue">above the rest</span>. Global innovation and telematics expertise.
          </h1>
          <p class="mt-6 text-base sm:text-lg text-gray-600 max-w-xl leading-relaxed">
            On-site installation across Metro Manila and Cebu, 24/7 support, and LTFRB-certified hardware. Localized for the Philippine landscape.
          </p>
          <div class="mt-8 flex flex-col sm:flex-row gap-3">
            <NuxtLink
              to="/ph/contact?subject=Navitag%20Business%20PH%20Inquiry"
              class="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gray-950 text-white text-sm font-semibold hover:bg-gray-800 transition shadow-lg shadow-gray-950/10"
              data-pixel-event="Contact"
              data-pixel-audience="b2b"
              data-pixel-content-name="business_ph_hero"
              data-pixel-content-category="b2b_intent"
              data-pixel-lead-type="business_inquiry"
            >
              Talk to our team
              <i class="fas fa-arrow-right text-[11px]"></i>
            </NuxtLink>
          </div>

          <!-- Trust markers -->
          <dl class="mt-12 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl">
            <div>
              <dt class="text-[11px] uppercase tracking-[0.18em] text-gray-400 font-semibold">Warranty</dt>
              <dd class="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-950">Lifetime</dd>
            </div>
            <div>
              <dt class="text-[11px] uppercase tracking-[0.18em] text-gray-400 font-semibold">Support</dt>
              <dd class="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-950">24/7</dd>
            </div>
            <div>
              <dt class="text-[11px] uppercase tracking-[0.18em] text-gray-400 font-semibold">Networks</dt>
              <dd class="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-950">Globe · Smart</dd>
            </div>
          </dl>
        </div>

        <!-- Hero visual -->
        <div class="lg:col-span-5">
          <div class="relative aspect-[4/5] lg:aspect-square rounded-[32px] overflow-hidden border border-gray-200/70 bg-white shadow-2xl shadow-gray-300/30">
            <div class="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100"></div>
            <div
              class="absolute inset-0 opacity-50"
              style="background-image: linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px); background-size: 32px 32px;"
            ></div>

            <div class="absolute top-5 left-5 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-400 bg-white rounded-full border border-gray-200">
              Fleet dashboard · MNL
            </div>

            <div class="absolute inset-6 grid grid-rows-[auto_1fr_auto] gap-4">
              <div class="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
                <div class="text-[10px] uppercase tracking-[0.18em] text-gray-400 font-semibold">Active now</div>
                <div class="mt-2 flex items-baseline gap-2">
                  <span class="text-3xl font-semibold tracking-tight text-gray-950">87</span>
                  <span class="text-[12px] text-green-600 font-medium">↑ 12 from yesterday</span>
                </div>
              </div>

              <div class="relative rounded-2xl bg-gradient-to-br from-navitag-blue/95 to-[#0A60C8] p-5 overflow-hidden">
                <div class="text-[10px] uppercase tracking-[0.18em] text-white/60 font-semibold">Daily km</div>
                <div class="mt-2 text-2xl font-semibold tracking-tight text-white">5,240 km</div>
                <div class="mt-6 flex items-end gap-1.5 h-14">
                  <span
                    v-for="(h, i) in [40, 55, 30, 70, 85, 60, 92]"
                    :key="i"
                    class="flex-1 rounded-sm bg-white/30"
                    :style="{ height: `${h}%` }"
                  ></span>
                </div>
                <div class="absolute -bottom-8 -right-6 w-28 h-28 rounded-full bg-white/10 blur-2xl"></div>
              </div>

              <div class="flex items-center gap-2">
                <span class="flex-1 rounded-xl bg-white border border-gray-200 px-3 py-2.5 text-[11px] font-medium text-gray-700 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Online 84
                </span>
                <span class="flex-1 rounded-xl bg-white border border-gray-200 px-3 py-2.5 text-[11px] font-medium text-gray-700 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Idle 2
                </span>
                <span class="flex-1 rounded-xl bg-white border border-gray-200 px-3 py-2.5 text-[11px] font-medium text-gray-700 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                  Offline 1
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Use cases -->
  <section class="relative bg-white py-20 sm:py-24 border-t border-gray-100">
    <div class="max-w-7xl mx-auto px-6 sm:px-8">
      <div class="max-w-3xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navitag-orange/10 text-navitag-orange text-[11px] font-semibold tracking-[0.15em] uppercase">
          Built for PH operators
        </div>
        <h2 class="mt-5 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight text-gray-950">
          From single van to <span class="text-gray-400">Nation Wide Operations.</span>
        </h2>
        <p class="mt-4 text-[15px] text-gray-600 leading-relaxed max-w-2xl">
          Tested across the operating realities of Philippine fleets — heavy traffic, remote routes, multi-island logistics, and regulatory compliance.
        </p>
      </div>

      <div class="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div
          v-for="u in useCases"
          :key="u.title"
          class="group rounded-3xl border border-gray-200/70 bg-gradient-to-br from-white to-gray-50/60 p-6 sm:p-7 hover:border-navitag-blue/30 hover:shadow-lg hover:shadow-gray-200/50 transition-all"
        >
          <div class="w-12 h-12 rounded-xl bg-navitag-blue/10 text-navitag-blue flex items-center justify-center group-hover:bg-navitag-blue group-hover:text-white transition-colors">
            <i :class="['fas', u.icon, 'text-[16px]']"></i>
          </div>
          <h3 class="mt-5 text-[16.5px] font-semibold tracking-tight text-gray-950">{{ u.title }}</h3>
          <p class="mt-2 text-[13.5px] text-gray-600 leading-relaxed">{{ u.body }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Fleet pricing -->
  <section id="fleet-pricing" class="relative bg-navitag-bg py-20 sm:py-28 border-t border-gray-100">
    <div class="max-w-7xl mx-auto px-6 sm:px-8">
      <div class="max-w-3xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navitag-blue/10 text-navitag-blue text-[11px] font-semibold tracking-[0.15em] uppercase">
          Volume pricing · PHP
        </div>
        <h2 class="mt-5 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight text-gray-950">
          Pricing that scales <span class="text-gray-400">with your fleet.</span>
        </h2>
        <p class="mt-4 text-[15px] text-gray-600 leading-relaxed max-w-2xl">
          The more devices you run, the less you pay per device. Every tier includes 24/7 support, lifetime warranty, daily reports, and free on-site installation in covered metros.
        </p>
      </div>

      <!-- Billing-term toggle -->
      <div class="mt-10 flex justify-center">
        <div
          role="tablist"
          aria-label="Billing term"
          class="inline-flex items-center p-1 rounded-full bg-white border border-gray-200 shadow-sm"
        >
          <button
            type="button"
            role="tab"
            :aria-selected="billingTerm === 'monthly'"
            class="inline-flex items-center px-5 py-2 rounded-full text-[13px] font-semibold transition"
            :class="billingTerm === 'monthly'
              ? 'bg-gray-950 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-950'"
            @click="billingTerm = 'monthly'"
          >
            Monthly
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="billingTerm === 'annual'"
            class="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-semibold transition"
            :class="billingTerm === 'annual'
              ? 'bg-gray-950 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-950'"
            @click="billingTerm = 'annual'"
          >
            Annual
            <span
              class="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase"
              :class="billingTerm === 'annual'
                ? 'bg-navitag-orange text-white'
                : 'bg-green-100 text-green-700'"
            >
              Save 1 month
            </span>
          </button>
        </div>
      </div>

      <div class="mt-8 grid md:grid-cols-3 gap-5 lg:gap-6">
        <div
          v-for="tier in fleetTiers"
          :key="tier.range"
          class="relative rounded-3xl p-7 sm:p-8 flex flex-col"
          :class="tier.highlighted
            ? 'bg-gray-950 text-white border border-gray-900 shadow-2xl shadow-gray-900/20 md:-mt-4'
            : 'bg-white border border-gray-200/70 shadow-sm'"
        >
          <div
            v-if="tier.highlighted"
            class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-navitag-orange text-white text-[10.5px] font-semibold tracking-[0.18em] uppercase shadow-md"
          >
            Most common
          </div>

          <div
            class="text-[11px] uppercase tracking-[0.2em] font-semibold"
            :class="tier.highlighted ? 'text-navitag-orange' : 'text-navitag-blue'"
          >
            {{ tier.label }}
          </div>
          <div
            class="mt-3 text-3xl font-semibold tracking-tight"
            :class="tier.highlighted ? 'text-white' : 'text-gray-950'"
          >
            {{ tier.range }}
            <span class="text-base font-medium opacity-60">units</span>
          </div>
          <p
            class="mt-3 text-[14px] leading-relaxed"
            :class="tier.highlighted ? 'text-white/70' : 'text-gray-600'"
          >
            {{ tier.tagline }}
          </p>

          <div class="mt-8 pt-6 border-t"
            :class="tier.highlighted ? 'border-white/10' : 'border-gray-100'"
          >
            <div class="text-[11px] uppercase tracking-[0.2em] font-semibold"
              :class="tier.highlighted ? 'text-white/50' : 'text-gray-400'"
            >
              Starting at
            </div>
            <div class="mt-2 flex items-baseline gap-1.5">
              <span
                class="text-4xl sm:text-5xl font-semibold tracking-tight leading-none"
                :class="tier.highlighted ? 'text-white' : 'text-gray-950'"
              >
                {{ tier.perDevice }}
              </span>
              <span
                class="text-[13px] font-medium"
                :class="tier.highlighted ? 'text-white/60' : 'text-gray-500'"
              >
                {{ tier.perDevice === 'Custom' ? '' : '/ device' }}
              </span>
            </div>
            <div
              class="mt-2 text-[12.5px]"
              :class="tier.highlighted ? 'text-white/50' : 'text-gray-400'"
            >
              {{ tier.note }}
            </div>
          </div>

          <NuxtLink
            :to="`/ph/contact?subject=${encodeURIComponent('Navitag Business PH - ' + tier.label + ' (' + tier.range + ' units)')}`"
            class="mt-8 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition"
            :class="tier.highlighted
              ? 'bg-white text-gray-950 hover:bg-white/90'
              : 'bg-navitag-blue text-white hover:bg-[#006ADB]'"
            data-pixel-event="Lead"
            data-pixel-audience="b2b"
            :data-pixel-content-name="`fleet_ph_${tier.label.toLowerCase().replace(/\s+/g, '_')}`"
            data-pixel-content-category="fleet_quote"
            data-pixel-lead-type="fleet_quote"
          >
            {{ tier.perDevice === 'Custom' ? 'Request quote' : 'Get started' }}
            <i class="fas fa-arrow-right text-[11px]"></i>
          </NuxtLink>
        </div>
      </div>

      <!-- Included features strip -->
      <div class="mt-12 rounded-3xl bg-white border border-gray-200/70 p-6 sm:p-8">
        <div class="flex items-baseline justify-between flex-wrap gap-2">
          <div class="text-[11px] uppercase tracking-[0.2em] font-semibold text-gray-500">
            Included in every Business plan
          </div>
          <NuxtLink to="/ph/data-plans" class="text-[12px] text-navitag-blue font-semibold hover:underline">
            Compare with Basic &amp; Pro →
          </NuxtLink>
        </div>
        <div class="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
          <div
            v-for="f in includedFeatures"
            :key="f.label"
            class="flex items-center gap-3 text-[13.5px] text-gray-700"
          >
            <span class="shrink-0 w-8 h-8 rounded-lg bg-navitag-bg border border-gray-200 flex items-center justify-center text-navitag-blue">
              <i :class="['fas', f.icon, 'text-[13px]']"></i>
            </span>
            {{ f.label }}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Service benefits -->
  <section class="relative bg-white py-20 sm:py-28 border-t border-gray-100">
    <div class="max-w-7xl mx-auto px-6 sm:px-8">
      <div class="max-w-3xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700 text-[11px] font-semibold tracking-[0.15em] uppercase">
          White-glove service
        </div>
        <h2 class="mt-5 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight text-gray-950">
          We don't just sell trackers. <br class="hidden sm:block"><span class="text-gray-400">We stand behind them.</span>
        </h2>
      </div>

      <div class="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="s in services"
          :key="s.title"
          class="relative rounded-3xl bg-white border border-gray-200/70 p-7 transition hover:shadow-xl hover:shadow-gray-200/60 hover:-translate-y-0.5"
        >
          <div class="w-12 h-12 rounded-xl bg-navitag-blue/10 text-navitag-blue flex items-center justify-center">
            <i :class="['fas', s.icon, 'text-[16px]']"></i>
          </div>
          <div class="mt-5 flex items-center gap-2 flex-wrap">
            <h3 class="text-[16.5px] font-semibold tracking-tight text-gray-950">
              {{ s.title }}
            </h3>
            <span
              v-if="s.tag"
              class="px-2 py-0.5 rounded-full bg-navitag-orange/10 text-navitag-orange text-[10px] font-semibold tracking-wide uppercase"
            >
              {{ s.tag }}
            </span>
          </div>
          <p class="mt-2 text-[13.5px] text-gray-600 leading-relaxed">
            {{ s.body }}
          </p>
        </div>
      </div>

      <div class="mt-8 flex items-start gap-4 max-w-3xl">
        <div class="shrink-0 w-10 h-10 rounded-full bg-navitag-bg border border-gray-200 flex items-center justify-center text-gray-500">
          <i class="fas fa-info text-[12px]"></i>
        </div>
        <p class="text-[13.5px] text-gray-600 leading-relaxed">
          On-site installation, inspection, and replacement are included within Metro Manila and Cebu serviced areas. Outside these zones, we cover round-trip courier shipping for warranty replacements.
        </p>
      </div>
    </div>
  </section>

  <!-- Reports -->
  <section class="relative bg-navitag-bg py-20 sm:py-28 border-t border-gray-100">
    <div class="max-w-7xl mx-auto px-6 sm:px-8">
      <div class="max-w-3xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navitag-blue/10 text-navitag-blue text-[11px] font-semibold tracking-[0.15em] uppercase">
          Daily reports
        </div>
        <h2 class="mt-5 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight text-gray-950">
          The numbers you need, <span class="text-gray-400">every morning.</span>
        </h2>
        <p class="mt-4 text-[15px] text-gray-600 leading-relaxed max-w-2xl">
          Two reports are delivered to your inbox every morning — and available on-demand in the dashboard.
        </p>
      </div>

      <div class="mt-12 grid lg:grid-cols-2 gap-6">
        <div class="rounded-3xl border border-gray-200/70 bg-white overflow-hidden">
          <div class="px-6 sm:px-8 py-5 border-b border-gray-200/70 flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-navitag-blue/10 text-navitag-blue flex items-center justify-center">
              <i class="fas fa-satellite-dish text-[15px]"></i>
            </span>
            <div>
              <div class="text-[11px] uppercase tracking-[0.18em] text-gray-400 font-semibold">
                Per-device report
              </div>
              <div class="text-[15px] font-semibold text-gray-950 tracking-tight">
                Device-level activity
              </div>
            </div>
          </div>
          <dl class="divide-y divide-gray-100">
            <div
              v-for="row in perDeviceReport"
              :key="row.metric"
              class="grid grid-cols-[1fr_1.3fr] gap-4 px-6 sm:px-8 py-4"
            >
              <dt class="text-[13.5px] font-medium text-gray-950">{{ row.metric }}</dt>
              <dd class="text-[13px] text-gray-600">{{ row.detail }}</dd>
            </div>
          </dl>
        </div>

        <div class="rounded-3xl border border-gray-200/70 bg-gray-950 text-white overflow-hidden relative">
          <div class="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-navitag-blue/30 blur-3xl pointer-events-none"></div>
          <div class="relative px-6 sm:px-8 py-5 border-b border-white/10 flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-white/10 text-navitag-orange flex items-center justify-center">
              <i class="fas fa-chart-pie text-[15px]"></i>
            </span>
            <div>
              <div class="text-[11px] uppercase tracking-[0.18em] text-white/50 font-semibold">
                Fleet overview
              </div>
              <div class="text-[15px] font-semibold tracking-tight">
                Aggregate &amp; exec-level view
              </div>
            </div>
          </div>
          <dl class="relative divide-y divide-white/10">
            <div
              v-for="row in fleetReport"
              :key="row.metric"
              class="grid grid-cols-[1fr_1.3fr] gap-4 px-6 sm:px-8 py-4"
            >
              <dt class="text-[13.5px] font-medium text-white">{{ row.metric }}</dt>
              <dd class="text-[13px] text-white/60">{{ row.detail }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div class="mt-8 flex flex-wrap items-center gap-3 text-[12.5px] text-gray-600">
        <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200">
          <i class="fas fa-envelope text-navitag-blue text-[11px]"></i>
          Emailed daily
        </span>
        <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200">
          <i class="fas fa-gauge-high text-navitag-blue text-[11px]"></i>
          On-demand in dashboard
        </span>
        <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200">
          <i class="fas fa-file-csv text-navitag-blue text-[11px]"></i>
          CSV export
        </span>
      </div>
    </div>
  </section>

  <!-- Bottom CTA -->
  <section class="relative bg-white py-20 sm:py-24 border-t border-gray-100">
    <div class="max-w-5xl mx-auto px-6 sm:px-8">
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navitag-blue to-[#0A60C8] text-white p-8 sm:p-12">
        <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
        <div class="relative grid sm:grid-cols-[1fr_auto] gap-6 items-end">
          <div>
            <div class="text-[11px] uppercase tracking-[0.2em] font-semibold text-white/70">
              Ready when you are
            </div>
            <h3 class="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
              Let's scope your fleet. <br class="hidden sm:block">We'll send you a personalized quote for your business needs.
            </h3>
          </div>
          <NuxtLink
            to="/ph/contact?subject=Navitag%20Business%20PH%20Inquiry"
            class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white text-gray-950 text-sm font-semibold hover:bg-white/90 transition shadow-lg shadow-black/20 whitespace-nowrap"
            data-pixel-event="Contact"
            data-pixel-audience="b2b"
            data-pixel-content-name="business_ph_bottom_cta"
            data-pixel-content-category="b2b_intent"
            data-pixel-lead-type="business_inquiry"
          >
            Contact us
            <i class="fas fa-arrow-right text-xs"></i>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
