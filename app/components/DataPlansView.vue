<script setup lang="ts">
import { MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from '~/variables'

const basic = useBasicStore()

interface Props {
  /** ISO 3166-1 alpha-2 country code for the region this view should price in. */
  countryCode: string
  /** Medusa product category handle that drives public pricing. Defaults to the flagship Track-1 plans. */
  categoryHandle?: string
  /** Region flavor — drives hero copy, CTA destinations, and region-specific callouts. */
  region?: 'global' | 'ph'
}

const props = withDefaults(defineProps<Props>(), {
  categoryHandle: 'track1-data-plan',
  region: 'global',
})

const isPh = computed(() => props.region === 'ph')

const heroPill = computed(() => isPh.value ? 'Philippines · Data plans' : 'Data plans')
const heroPillDot = computed(() => isPh.value ? 'bg-navitag-blue' : 'bg-navitag-orange')
const heroTitleA = computed(() => 'Simple plans.')
const heroTitleB = computed(() => isPh.value ? 'Local coverage.' : 'Global coverage.')
const heroSubtitle = computed(() =>
  isPh.value
    ? 'Pick a plan that matches how you move. Every Navitag device runs on Globe and Smart 4G LTE / 5G — and roams across 100+ countries.'
    : 'Pick a plan that matches how you move. Every tier works in 100+ countries with no roaming fees.',
)

const distributionPath = computed(() => isPh.value ? '/ph/distribution' : '/distribution')
const businessPath = computed(() => isPh.value ? '/ph/business' : '/business')
const contactPath = computed(() =>
  isPh.value
    ? '/ph/contact?subject=Navitag%20Business%20PH%20Inquiry'
    : '/contact?subject=Navitag%20Business%20Inquiry',
)

type TermMonths = 3 | 6 | 12

interface Tier {
  key: 'basic' | 'pro' | 'business'
  name: string
  tagline: string
  /** Per-term price for this tier. null = "Custom" (Business). */
  prices: Record<TermMonths, string> | null
  cta?: { label: string; to: string }
  highlighted?: boolean
  perks: string[]
}

const terms: { months: TermMonths; label: string; saveLabel?: string }[] = [
  { months: 3, label: '3 months' },
  { months: 6, label: '6 months', saveLabel: 'Save ~8%' },
  { months: 12, label: '12 months', saveLabel: 'Save ~16%' },
]

const selectedTerm = ref<TermMonths>(3)

const tiers = computed<Tier[]>(() => [
  {
    key: 'basic',
    name: 'Basic',
    tagline: isPh.value
      ? 'For personal vehicles and everyday peace of mind in the Philippines.'
      : 'For personal vehicles and everyday peace of mind.',
    prices: { 3: '$2.99', 6: '$5.49', 12: '$9.99' },
    cta: { label: 'Start with Basic', to: distributionPath.value },
    perks: [
      '1-minute location updates',
      '1 month of history playback',
      'Up to 2 geofences',
      'In-app notifications',
      isPh.value ? 'Globe + Smart 4G LTE / 5G' : 'Works in 100+ countries',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    tagline: isPh.value
      ? 'For couriers, ride-hail drivers, and growing local fleets.'
      : 'For power users, couriers, and growing fleets.',
    prices: { 3: '$7.99', 6: '$14.99', 12: '$27.99' },
    cta: { label: 'Start with Pro', to: distributionPath.value },
    highlighted: true,
    perks: [
      '20-second location updates',
      '3 months of history playback',
      'Up to 10 geofences',
      'Shared access for family or team',
      'In-app notifications',
    ],
  },
  {
    key: 'business',
    name: 'Business',
    tagline: isPh.value
      ? 'For PUV, logistics, and enterprise fleet operators across PH.'
      : 'For operators, logistics, and enterprise fleets.',
    prices: null,
    cta: { label: 'See Plans', to: businessPath.value },
    perks: [
      '10-second location updates',
      '6 months of history playback',
      'Unlimited geofences',
      'Full reports & analytics dashboard',
      isPh.value
        ? 'On-site installation in Metro Manila & Cebu'
        : 'On-site installation for devices & accessories',
      'Volume discounts for larger fleets',
      'Webhooks, email & app alerts',
      'Shared access with role controls',
      isPh.value ? 'LTFRB-certified hardware' : 'Priority support',
    ],
  },
])

const termSuffix = computed(() => `/ ${selectedTerm.value} months`)
const termNote = computed(() =>
  `per device · billed every ${selectedTerm.value} month${selectedTerm.value === 1 ? '' : 's'}`,
)

// ---------------------------------------------------------------------------
// Medusa-driven pricing. Country comes in as a prop — no detection here.
// ---------------------------------------------------------------------------

const regionId = computed(() => basic.getRegionId(props.countryCode))
const livePrices = ref<Partial<Record<'basic' | 'pro', Partial<Record<TermMonths, string>>>>>({})
const pricesLoading = ref(true)

function termFromVariantTitle(title: string): TermMonths | null {
  const t = title.toLowerCase()
  if (t.includes('12')) return 12
  if (t.includes('6')) return 6
  if (t.includes('3')) return 3
  return null
}

function tierFromTags(tags: unknown): 'basic' | 'pro' | null {
  if (!Array.isArray(tags)) return null
  for (const tag of tags) {
    const v = (tag?.value || '').toString().toLowerCase()
    if (v === 'pro') return 'pro'
    if (v === 'basic') return 'basic'
  }
  return null
}

function formatVariantPrice(variant: any): string | null {
  const calc = variant?.calculated_price
  if (calc?.calculated_amount != null) {
    const amount = calc.calculated_amount
    const isWhole = Number.isInteger(amount)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (calc.currency_code || 'USD').toUpperCase(),
      minimumFractionDigits: isWhole ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }
  return null
}

async function fetchLivePrices() {
  pricesLoading.value = true
  try {
    const catRes = await $fetch<{ product_categories: any[] }>(`${MEDUSA_BACKEND_URL}/store/product-categories`, {
      params: { handle: props.categoryHandle },
      headers: { 'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY },
    })
    const categoryId = catRes.product_categories?.[0]?.id
    if (!categoryId) return

    const res = await $fetch<{ products: any[] }>(`${MEDUSA_BACKEND_URL}/store/products`, {
      params: {
        category_id: categoryId,
        region_id: regionId.value,
        fields: '*variants.calculated_price,*tags',
      },
      headers: { 'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY },
    })

    const next: typeof livePrices.value = {}
    for (const product of res.products || []) {
      const tier = tierFromTags(product.tags)
      if (!tier) continue
      const bucket: Partial<Record<TermMonths, string>> = next[tier] || {}
      for (const variant of product.variants || []) {
        const term = termFromVariantTitle(variant.title || '')
        const price = formatVariantPrice(variant)
        if (term && price) bucket[term] = price
      }
      if (Object.keys(bucket).length) next[tier] = bucket
    }
    livePrices.value = next
  }
  catch (e) {
    console.error('[DataPlansView] fetchLivePrices threw', e)
  }
  finally { pricesLoading.value = false }
}

onMounted(() => { fetchLivePrices() })
watch(regionId, () => { fetchLivePrices() })

function tierPrice(t: Tier): string | null {
  // Business tier intentionally has no `prices` block — render "Custom".
  if (!t.prices) return null
  const key = t.key as 'basic' | 'pro'
  // Pricing is Medusa-driven for every region — no static fallback.
  return livePrices.value[key]?.[selectedTerm.value] || null
}

interface FeatureRow {
  feature: string
  basic: string
  pro: string
  business: string
}

const featureRows = computed<FeatureRow[]>(() => [
  { feature: 'Location update interval', basic: '1 minute', pro: '20 seconds', business: '10 seconds' },
  { feature: 'History playback', basic: '1 month', pro: '3 months', business: '6 months' },
  { feature: 'Geofence limit', basic: '2', pro: '10', business: 'Unlimited' },
  { feature: 'Reports & analytics', basic: 'No', pro: 'No', business: 'Yes' },
  { feature: 'Notifications', basic: 'App', pro: 'App', business: 'App · Email · Webhook' },
  { feature: 'Shared access', basic: 'No', pro: 'Yes', business: 'Yes' },
  { feature: 'On-site installation', basic: 'No', pro: 'No', business: 'Yes' },
  { feature: 'Fleet volume pricing', basic: 'No', pro: 'No', business: 'Yes' },
  isPh.value
    ? { feature: 'Local network', basic: 'Globe + Smart', pro: 'Globe + Smart', business: 'Globe + Smart' }
    : { feature: 'Global M2M coverage', basic: '100+ countries', pro: '100+ countries', business: '100+ countries' },
  ...(isPh.value
    ? [{ feature: 'International roaming', basic: '100+ countries', pro: '100+ countries', business: '100+ countries' }]
    : []),
])

function cellIcon(value: string) {
  if (value === '—' || value.toLowerCase() === 'no') return 'dash'
  if (value.toLowerCase() === 'yes') return 'check'
  return null
}
</script>

<template>
  <!-- Hero -->
  <section class="relative bg-navitag-bg overflow-hidden">
    <div
      class="absolute -top-32 left-1/2 -translate-x-1/2 w-[680px] h-[680px] rounded-full bg-navitag-blue/10 blur-3xl pointer-events-none"
      aria-hidden="true"
    ></div>
    <div class="relative max-w-7xl mx-auto px-6 sm:px-8 pt-20 sm:pt-28 pb-10 sm:pb-14 text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700 text-[11px] font-semibold tracking-[0.15em] uppercase">
        <span class="w-1.5 h-1.5 rounded-full" :class="heroPillDot"></span>
        {{ heroPill }}
      </div>
      <h1 class="mt-5 text-4xl sm:text-5xl lg:text-[64px] font-semibold tracking-tight leading-[1.02] text-gray-950 max-w-3xl mx-auto">
        {{ heroTitleA }} <span class="text-gray-400">{{ heroTitleB }}</span>
      </h1>
      <p class="mt-5 text-base sm:text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
        {{ heroSubtitle }}
      </p>
    </div>
  </section>

  <!-- Tier cards -->
  <section class="relative bg-navitag-bg pb-20 sm:pb-28 pt-12 sm:pt-16">
    <div class="max-w-7xl mx-auto px-6 sm:px-8">
      <!-- Term selector -->
      <div class="mb-10 flex flex-col items-center gap-4 text-center">
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-gray-950">
          Data Plans
        </h2>
        <div
          role="tablist"
          aria-label="Plan term"
          class="inline-flex items-center p-1 rounded-full bg-white border border-gray-200 shadow-sm"
        >
          <button
            v-for="t in terms"
            :key="t.months"
            type="button"
            role="tab"
            :aria-selected="selectedTerm === t.months"
            class="relative inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-[13px] font-semibold transition"
            :class="selectedTerm === t.months
              ? 'bg-gray-950 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-950'"
            @click="selectedTerm = t.months"
          >
            {{ t.label }}
            <span
              v-if="t.saveLabel"
              class="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase"
              :class="selectedTerm === t.months
                ? 'bg-navitag-orange text-white'
                : 'bg-green-100 text-green-700'"
            >
              {{ t.saveLabel }}
            </span>
          </button>
        </div>
        <p class="text-[12px] text-gray-500">
          Same plan, longer term — bigger savings.
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-5 lg:gap-6">
        <div
          v-for="tier in tiers"
          :key="tier.key"
          class="relative rounded-3xl p-7 sm:p-8 flex flex-col"
          :class="tier.highlighted
            ? 'bg-gray-950 text-white border border-gray-900 shadow-2xl shadow-gray-900/20 md:-mt-4 md:mb-0'
            : 'bg-white border border-gray-200/70 shadow-sm'"
        >
          <!-- Recommended badge -->
          <div
            v-if="tier.highlighted"
            class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-navitag-orange text-white text-[10.5px] font-semibold tracking-[0.18em] uppercase shadow-md"
          >
            Most popular
          </div>

          <!-- Name + tagline -->
          <div>
            <div
              class="text-[11px] uppercase tracking-[0.2em] font-semibold"
              :class="tier.highlighted ? 'text-navitag-orange' : 'text-navitag-blue'"
            >
              {{ tier.name }}
            </div>
            <p
              class="mt-2 text-[14px] leading-relaxed"
              :class="tier.highlighted ? 'text-white/70' : 'text-gray-600'"
            >
              {{ tier.tagline }}
            </p>
          </div>

          <!-- Price -->
          <div class="mt-7 min-h-[88px] flex flex-col justify-center">
            <template v-if="tier.prices && pricesLoading && !tierPrice(tier)">
              <div class="space-y-2">
                <div
                  class="h-12 sm:h-14 w-32 rounded-md animate-pulse"
                  :class="tier.highlighted ? 'bg-white/15' : 'bg-gray-100'"
                ></div>
                <div
                  class="h-3 w-40 rounded-md animate-pulse"
                  :class="tier.highlighted ? 'bg-white/10' : 'bg-gray-100'"
                ></div>
              </div>
            </template>
            <template v-else-if="tierPrice(tier)">
              <div class="flex items-baseline gap-1.5">
                <span
                  class="text-5xl sm:text-[56px] font-semibold tracking-tight leading-none tabular-nums"
                  :class="tier.highlighted ? 'text-white' : 'text-gray-950'"
                >
                  {{ tierPrice(tier) }}
                </span>
                <span
                  class="text-[14px] font-medium"
                  :class="tier.highlighted ? 'text-white/60' : 'text-gray-500'"
                >
                  {{ termSuffix }}
                </span>
              </div>
              <div
                class="mt-2 text-[12.5px]"
                :class="tier.highlighted ? 'text-white/50' : 'text-gray-400'"
              >
                {{ termNote }}
              </div>
            </template>
            <template v-else-if="tier.prices">
              <div class="flex items-baseline gap-2">
                <span
                  class="text-3xl sm:text-4xl font-semibold tracking-tight leading-none"
                  :class="tier.highlighted ? 'text-white' : 'text-gray-950'"
                >
                  Unavailable
                </span>
              </div>
              <div
                class="mt-2 text-[12.5px]"
                :class="tier.highlighted ? 'text-white/50' : 'text-gray-500'"
              >
                Please try again shortly
              </div>
            </template>
            <template v-else>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl sm:text-4xl font-semibold tracking-tight leading-none text-gray-950">
                  Custom
                </span>
              </div>
              <div class="mt-2 text-[12.5px] text-gray-500">
                Volume pricing for fleets &amp; operators
              </div>
            </template>
          </div>

          <!-- Perks -->
          <ul
            class="mt-7 space-y-3 flex-1"
            :class="tier.highlighted ? 'text-white/90' : 'text-gray-700'"
          >
            <li
              v-for="perk in tier.perks"
              :key="perk"
              class="flex gap-3 text-[14px] leading-relaxed"
            >
              <span
                class="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                :class="tier.highlighted ? 'bg-white/15 text-navitag-orange' : 'bg-navitag-blue/10 text-navitag-blue'"
              >
                <i class="fas fa-check text-[10px]"></i>
              </span>
              {{ perk }}
            </li>
          </ul>

          <!-- CTA -->
          <NuxtLink
            v-if="tier.cta"
            :to="tier.cta.to"
            class="mt-8 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition"
            :class="tier.highlighted
              ? 'bg-white text-gray-950 hover:bg-white/90'
              : tier.key === 'business'
                ? 'bg-gray-950 text-white hover:bg-gray-800'
                : 'bg-navitag-blue text-white hover:bg-[#006ADB]'"
            data-pixel-event="Lead"
            :data-pixel-audience="tier.key === 'business' ? 'b2b' : 'b2c'"
            :data-pixel-content-name="`plan_tier_${tier.key}`"
            :data-pixel-content-category="tier.key === 'business' ? 'b2b_intent' : 'plan_intent'"
            :data-pixel-lead-type="tier.key === 'business' ? 'business_plan_intent' : 'plan_intent'"
          >
            {{ tier.cta.label }}
            <i class="fas fa-arrow-right text-[11px]"></i>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>

  <!-- How it works -->
  <section class="relative bg-white py-20 sm:py-28 border-t border-gray-100">
    <div class="max-w-7xl mx-auto px-6 sm:px-8">
      <div class="max-w-3xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navitag-blue/10 text-navitag-blue text-[11px] font-semibold tracking-[0.15em] uppercase">
          How it works
        </div>
        <h2 class="mt-5 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight text-gray-950">
          Devices + plans, <span class="text-gray-400">how they work together.</span>
        </h2>
        <p class="mt-4 text-[15px] text-gray-600 leading-relaxed max-w-2xl">
          Every Navitag device ships with connectivity already set up. Here's the full lifecycle — from unboxing to renewal.
        </p>
      </div>

      <div class="relative mt-16">
        <div
          class="hidden lg:block absolute left-0 right-0 top-[26px] h-px border-t border-dashed border-gray-200"
          aria-hidden="true"
        ></div>

        <ol class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          <li class="relative">
            <div class="relative z-10 flex items-center gap-3">
              <span class="shrink-0 w-[52px] h-[52px] rounded-full bg-white border-2 border-navitag-blue text-navitag-blue flex items-center justify-center font-mono text-sm font-bold tracking-[0.18em]">
                01
              </span>
              <span class="px-2.5 py-1 rounded-full bg-navitag-blue/10 text-navitag-blue text-[10px] font-semibold tracking-[0.18em] uppercase">
                Included
              </span>
            </div>
            <h3 class="mt-5 text-[17px] font-semibold tracking-tight text-gray-950">
              Device comes with free 3 months
            </h3>
            <p class="mt-2 text-[13.5px] text-gray-600 leading-relaxed">
              Every Navitag device includes the <span class="text-gray-900 font-medium">Basic plan free for 3 months</span>. Power it on and it starts tracking — no setup, no activation fees.
            </p>
          </li>

          <li class="relative">
            <div class="relative z-10 flex items-center gap-3">
              <span class="shrink-0 w-[52px] h-[52px] rounded-full bg-white border-2 border-navitag-blue text-navitag-blue flex items-center justify-center font-mono text-sm font-bold tracking-[0.18em]">
                02
              </span>
              <span class="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[10px] font-semibold tracking-[0.18em] uppercase">
                Purchase
              </span>
            </div>
            <h3 class="mt-5 text-[17px] font-semibold tracking-tight text-gray-950">
              Extend with a data plan
            </h3>
            <p class="mt-2 text-[13.5px] text-gray-600 leading-relaxed">
              Before the included period ends, pick a plan — <span class="text-gray-900 font-medium">Basic, Pro, or Business</span> — to keep the device online. Buy for 3, 6, or 12-month terms.
            </p>
          </li>

          <li class="relative">
            <div class="relative z-10 flex items-center gap-3">
              <span class="shrink-0 w-[52px] h-[52px] rounded-full bg-white border-2 border-gray-300 text-gray-500 flex items-center justify-center font-mono text-sm font-bold tracking-[0.18em]">
                03
              </span>
              <span class="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-semibold tracking-[0.18em] uppercase">
                On expiry
              </span>
            </div>
            <h3 class="mt-5 text-[17px] font-semibold tracking-tight text-gray-950">
              Inactive if plan expires
            </h3>
            <p class="mt-2 text-[13.5px] text-gray-600 leading-relaxed">
              Without an active plan the device becomes <span class="text-gray-900 font-medium">inactive</span> — it stops sending location and won't appear on live tracking. Historical data stays in your account.
            </p>
          </li>

          <li class="relative">
            <div class="relative z-10 flex items-center gap-3">
              <span class="shrink-0 w-[52px] h-[52px] rounded-full bg-navitag-orange text-white flex items-center justify-center font-mono text-sm font-bold tracking-[0.18em]">
                04
              </span>
              <span class="px-2.5 py-1 rounded-full bg-navitag-orange/10 text-navitag-orange text-[10px] font-semibold tracking-[0.18em] uppercase">
                Anytime
              </span>
            </div>
            <h3 class="mt-5 text-[17px] font-semibold tracking-tight text-gray-950">
              Reactivate with a new plan
            </h3>
            <p class="mt-2 text-[13.5px] text-gray-600 leading-relaxed">
              Purchase any plan to bring an inactive device back online. It <span class="text-gray-900 font-medium">resumes tracking within minutes</span> — no reconfiguration needed.
            </p>
          </li>
        </ol>
      </div>

      <div class="mt-14 rounded-3xl bg-navitag-bg border border-gray-200/70 p-6 sm:p-8">
        <div class="flex items-start gap-5">
          <div class="shrink-0 w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-navitag-blue">
            <i class="fas fa-circle-info text-[15px]"></i>
          </div>
          <div>
            <div class="text-[11px] uppercase tracking-[0.18em] font-semibold text-gray-500">
              A quick note
            </div>
            <p class="mt-1 text-[14.5px] text-gray-700 leading-relaxed max-w-3xl">
              A data plan is required for the device to transmit tracking data. The device itself is yours to keep — only connectivity pauses when a plan lapses.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Comparison table -->
  <section class="relative bg-white py-20 sm:py-28 border-t border-gray-100">
    <div class="max-w-7xl mx-auto px-6 sm:px-8">
      <div class="max-w-3xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navitag-blue/10 text-navitag-blue text-[11px] font-semibold tracking-[0.15em] uppercase">
          Compare plans
        </div>
        <h2 class="mt-5 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight text-gray-950">
          Side-by-side, every feature.
        </h2>
      </div>

      <div class="hidden md:block mt-12 rounded-3xl border border-gray-200/70 overflow-hidden">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200/70">
              <th class="py-5 px-6 text-[11px] uppercase tracking-[0.18em] font-semibold text-gray-400">
                Feature
              </th>
              <th class="py-5 px-6 text-[13px] font-semibold text-gray-950 w-1/5">
                <div class="flex items-center gap-2">
                  Basic
                </div>
              </th>
              <th class="py-5 px-6 text-[13px] font-semibold text-gray-950 w-1/5 bg-navitag-blue/5 border-l border-r border-navitag-blue/10">
                <div class="flex items-center gap-2">
                  Pro
                  <span class="px-1.5 py-0.5 rounded-full bg-navitag-orange text-white text-[9px] font-bold tracking-widest uppercase">Popular</span>
                </div>
              </th>
              <th class="py-5 px-6 text-[13px] font-semibold text-gray-950 w-1/5">
                Business
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="row in featureRows"
              :key="row.feature"
              class="hover:bg-gray-50/60 transition-colors"
            >
              <td class="py-4 px-6 text-[13.5px] font-medium text-gray-700">
                {{ row.feature }}
              </td>
              <td class="py-4 px-6 text-[14px] text-gray-900">
                <span v-if="cellIcon(row.basic) === 'check'" class="inline-flex items-center gap-1 text-green-600 font-semibold">
                  <i class="fas fa-check"></i>
                </span>
                <span v-else-if="cellIcon(row.basic) === 'dash'" class="text-gray-300">—</span>
                <span v-else>{{ row.basic }}</span>
              </td>
              <td class="py-4 px-6 text-[14px] text-gray-900 bg-navitag-blue/5 border-l border-r border-navitag-blue/10 font-medium">
                <span v-if="cellIcon(row.pro) === 'check'" class="inline-flex items-center gap-1 text-green-600 font-semibold">
                  <i class="fas fa-check"></i>
                </span>
                <span v-else-if="cellIcon(row.pro) === 'dash'" class="text-gray-300">—</span>
                <span v-else>{{ row.pro }}</span>
              </td>
              <td class="py-4 px-6 text-[14px] text-gray-900">
                <span v-if="cellIcon(row.business) === 'check'" class="inline-flex items-center gap-1 text-green-600 font-semibold">
                  <i class="fas fa-check"></i>
                </span>
                <span v-else-if="cellIcon(row.business) === 'dash'" class="text-gray-300">—</span>
                <span v-else>{{ row.business }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="md:hidden mt-10 space-y-3">
        <div
          v-for="row in featureRows"
          :key="row.feature"
          class="rounded-2xl border border-gray-200/70 overflow-hidden"
        >
          <div class="bg-gray-50 px-5 py-3 text-[11px] uppercase tracking-[0.18em] font-semibold text-gray-500 border-b border-gray-200/70">
            {{ row.feature }}
          </div>
          <dl class="divide-y divide-gray-100">
            <div class="flex items-center justify-between px-5 py-3">
              <dt class="text-[12.5px] font-medium text-gray-500">Basic</dt>
              <dd class="text-[14px] text-gray-900">
                <span v-if="cellIcon(row.basic) === 'check'" class="text-green-600"><i class="fas fa-check"></i></span>
                <span v-else-if="cellIcon(row.basic) === 'dash'" class="text-gray-300">—</span>
                <span v-else>{{ row.basic }}</span>
              </dd>
            </div>
            <div class="flex items-center justify-between px-5 py-3 bg-navitag-blue/5">
              <dt class="text-[12.5px] font-medium text-navitag-blue">Pro</dt>
              <dd class="text-[14px] font-semibold text-gray-950">
                <span v-if="cellIcon(row.pro) === 'check'" class="text-green-600"><i class="fas fa-check"></i></span>
                <span v-else-if="cellIcon(row.pro) === 'dash'" class="text-gray-300">—</span>
                <span v-else>{{ row.pro }}</span>
              </dd>
            </div>
            <div class="flex items-center justify-between px-5 py-3">
              <dt class="text-[12.5px] font-medium text-gray-500">Business</dt>
              <dd class="text-[14px] text-gray-900">
                <span v-if="cellIcon(row.business) === 'check'" class="text-green-600"><i class="fas fa-check"></i></span>
                <span v-else-if="cellIcon(row.business) === 'dash'" class="text-gray-300">—</span>
                <span v-else>{{ row.business }}</span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </section>

  <!-- Bottom CTA -->
  <section class="relative bg-navitag-bg py-20 sm:py-24 border-t border-gray-200/70">
    <div class="max-w-5xl mx-auto px-6 sm:px-8">
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navitag-blue to-[#0A60C8] text-white p-8 sm:p-12">
        <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
        <div class="relative grid sm:grid-cols-[1fr_auto] gap-6 items-end">
          <div>
            <div class="text-[11px] uppercase tracking-[0.2em] font-semibold text-white/70">
              Need a custom setup?
            </div>
            <h3 class="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
              Fleet or enterprise? <br class="hidden sm:block">We'll tailor a plan to your operation.
            </h3>
          </div>
          <NuxtLink
            :to="contactPath"
            class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white text-gray-950 text-sm font-semibold hover:bg-white/90 transition shadow-lg shadow-black/20 whitespace-nowrap"
            data-pixel-event="Contact"
            data-pixel-audience="b2b"
            data-pixel-content-name="data_plans_bottom_cta"
            data-pixel-content-category="b2b_intent"
            data-pixel-lead-type="business_inquiry"
          >
            Talk to Navitag Business
            <i class="fas fa-arrow-right text-xs"></i>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
