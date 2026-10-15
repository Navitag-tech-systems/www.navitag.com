<script setup lang="ts">
import { resolveRegionFromCountry } from '~/config/regions'
import { detectClient, type ClientInfo } from '~/utils/detectClient'

// Standalone link hub — no marketing chrome. The global <AppBootLoader> in
// app.vue (a sibling of <NuxtLayout>) still renders even with layout:false, so
// the boot spinner shows on landing until country resolves.
definePageMeta({ layout: false })

useHead({
  title: 'Navitag — Links',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const basic = useBasicStore()

// Resolve the real component for the dynamic <component :is> below — a bare
// 'NuxtLink' string is not reliably resolved as a global component.
const NuxtLink = resolveComponent('NuxtLink')
const year = new Date().getFullYear()

// ── Destinations ─────────────────────────────────────────────────────
// Web app / account signup — the "web app" button target and the desktop
// redirect destination.
const WEB_APP_URL = 'https://track.navitag.com/signup'
// Android app listing on the Play Store.
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.navitag.track'
// iOS app listing. App Store availability is Philippines-only, so this is a
// /ph/ storefront link and is only offered to PH visitors.
const APP_STORE_URL = 'https://apps.apple.com/ph/app/navitag-track/id6758300749'
// Viber deep link to the official PH account (+63 917 638 8402).
const VIBER_URL = 'viber://chat?number=%2B639176388402'

// ── Client (browser / OS / device) ───────────────────────────────────
// Client-only (needs navigator), so it's filled after mount; null during SSR
// + the first hydration tick → matches server render, no mismatch.
const client = ref<ClientInfo | null>(null)
const isAndroid = computed(() => client.value?.os === 'Android')
const isIos = computed(() => client.value?.os === 'iOS')
// A device we ship a native app for (has a store button). Everything else
// (desktop / other) is "no-app".
const appCapable = computed(() => isAndroid.value || isIos.value)

// ── Country / region ─────────────────────────────────────────────────
const region = computed(() => resolveRegionFromCountry(basic.country))
const isPh = computed(() => region.value?.code === 'PH')

// Web-app button is a secondary option next to a store button, but the sole
// primary CTA on no-app devices (PH desktop).
const webAppLabel = computed(() => (appCapable.value ? 'Or use the web app' : 'Open the web app'))

// ── Secondary links ──────────────────────────────────────────────────
interface HubLink {
  label: string
  icon: string // Font Awesome classes
  to?: string // internal route
  href?: string // external URL / scheme
}

// The hub only ever renders for PH visitors (everyone else is redirected).
const links: HubLink[] = [
  { label: 'Contact PH team', icon: 'fas fa-headset', to: '/ph/contact' },
]

// ── Boot: detect client, resolve country, maybe redirect ─────────────
onMounted(async () => {
  client.value = detectClient()
  // Country-by-IP via the shared resolver (deduped with AppBootLoader's call).
  await basic.resolveCountry()

  // The hub is PH-only. Non-PH visitors on ANY device (store buttons
  // included) go straight to the web app. The template is gated on isPh, so
  // nothing renders for them while the navigation is in flight.
  if (!isPh.value) {
    await navigateTo(WEB_APP_URL, { external: true })
  }
})
</script>

<template>
  <div class="relative min-h-screen bg-navitag-bg font-sans antialiased text-gray-900 overflow-hidden">
    <!-- Ambient glow, matching the boot loader -->
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,118,245,0.10),_transparent_55%)]"
    ></div>

    <!-- Content is gated on country resolution AND PH: nothing renders until
         the region is known, and non-PH visitors never see the hub (they are
         redirected to the web app in onMounted). The boot spinner covers the
         gap until countryResolved flips true. -->
    <div
      v-if="basic.countryResolved && isPh"
      class="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-5 py-12 sm:py-16"
    >
      <!-- Brand -->
      <NuxtLink to="/" class="flex flex-col items-center">
        <img src="/logo-sm.png" alt="Navitag" class="h-11 w-auto">
        <span class="mt-3 text-lg font-semibold tracking-tight text-gray-950">NAVITAG</span>
      </NuxtLink>
      <p class="mt-2 text-[13.5px] text-gray-500 tracking-tight">
        Never Lose What Matters.
      </p>

      <!-- Home Service Installation via Viber -->
      <a
        :href="VIBER_URL"
        class="group mt-8 block w-full rounded-2xl border border-[#7360F2]/25 bg-white p-4 shadow-sm ring-1 ring-[#7360F2]/5 transition hover:border-[#7360F2]/50 hover:shadow-md"
      >
        <div class="flex items-start gap-3.5">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7360F2] text-white">
            <i class="fab fa-viber text-xl"></i>
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-[15px] font-semibold tracking-tight text-gray-950">
              Home Service Installation
            </p>
            <p class="mt-0.5 text-[13px] leading-snug text-gray-500">
              Message the official Navitag Viber account
            </p>
            <p class="mt-1.5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#7360F2]">
              +63 917 638 8402
              <i class="fas fa-arrow-right text-[11px] transition-transform group-hover:translate-x-0.5"></i>
            </p>
          </div>
        </div>
      </a>

      <!-- Acquisition CTAs (device-aware) -->
      <div class="mt-8 flex w-full flex-col gap-3">
        <!-- Android → Google Play -->
        <a
          v-if="isAndroid"
          :href="PLAY_STORE_URL"
          rel="noopener"
          class="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gray-950 px-5 py-4 text-white shadow-sm transition hover:bg-black active:scale-[0.99]"
        >
          <i class="fab fa-google-play text-lg"></i>
          <span class="text-[15px] font-semibold tracking-tight">Get it on Google Play</span>
        </a>

        <!-- iOS → App Store (live in the PH storefront) -->
        <a
          v-else-if="isIos"
          :href="APP_STORE_URL"
          rel="noopener"
          class="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gray-950 px-5 py-4 text-white shadow-sm transition hover:bg-black active:scale-[0.99]"
        >
          <i class="fab fa-apple text-lg"></i>
          <span class="text-[15px] font-semibold tracking-tight">Download on the App Store</span>
        </a>

        <!-- Web app (secondary on app devices, primary on no-app / PH desktop) -->
        <a
          :href="WEB_APP_URL"
          :class="appCapable
            ? 'border border-navitag-blue/30 bg-white text-navitag-blue hover:border-navitag-blue/60'
            : 'bg-navitag-blue text-white hover:bg-blue-600'"
          class="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-[15px] font-semibold shadow-sm transition active:scale-[0.99]"
        >
          <i class="fas fa-globe text-sm opacity-90"></i>
          {{ webAppLabel }}
        </a>
      </div>

      <!-- Link list -->
      <div class="mt-4 flex w-full flex-col gap-3">
        <component
          :is="link.to ? NuxtLink : 'a'"
          v-for="link in links"
          :key="link.label"
          :to="link.to"
          :href="link.href"
          :rel="link.href ? 'noopener' : undefined"
          class="group flex items-center gap-3.5 rounded-2xl border border-gray-200/70 bg-white px-4 py-3.5 shadow-sm transition hover:border-navitag-blue/40 hover:shadow-md active:scale-[0.99]"
        >
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navitag-blue/10 text-navitag-blue">
            <i :class="link.icon"></i>
          </span>
          <span class="flex-1 text-[15px] font-medium tracking-tight text-gray-900">
            {{ link.label }}
          </span>
          <i class="fas fa-chevron-right text-xs text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-navitag-blue"></i>
        </component>
      </div>

      <!-- In-app browser nudge: OAuth pop-ups often fail inside webviews. -->
      <p
        v-if="client?.inApp"
        class="mt-5 w-full rounded-xl bg-amber-50 px-4 py-3 text-[12.5px] leading-snug text-amber-800 ring-1 ring-amber-200"
      >
        <i class="fas fa-circle-info mr-1.5"></i>
        You're in the {{ client.inAppName }} in-app browser. If sign-in doesn't open,
        tap the menu and choose “Open in browser”.
      </p>

      <div class="mt-auto pt-10 text-center text-[11px] text-gray-400">
        &copy; {{ year }} Navitag Digital Innovations LLC
      </div>
    </div>
  </div>
</template>
