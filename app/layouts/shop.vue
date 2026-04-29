<script setup lang="ts">
import { resolveRegionFromCountry } from '~/config/regions'

// Country-reactive shop layout. The /shop URL space is region-neutral by
// design (see UTILITY_PREFIXES in config/regions.ts) so chrome adapts to the
// visitor instead of the path:
//   • Anonymous visitor → IP-resolved country → matching region (or global)
//   • Authenticated visitor → backend profile country → matching region
//   • Crawler / SSR (no country) → global header & footer
// The swap is reactive: when basic.country flips (login, logout, force-resolve)
// the header & footer re-render in place without unmounting the page slot.
const basic = useBasicStore()
const region = computed(() => resolveRegionFromCountry(basic.country))

useHead(() => region.value
  ? { htmlAttrs: { lang: 'en-PH' }, meta: [{ property: 'og:locale', content: 'en_PH' }] }
  : { htmlAttrs: { lang: 'en' }, meta: [{ property: 'og:locale', content: 'en_US' }] },
)
</script>

<template>
  <div class="font-sans antialiased text-gray-900 bg-navitag-bg">
    <RegionBanner />
    <HeaderRegional v-if="region" :region="region" />
    <HeaderGlobal v-else />
    <slot />
    <FooterRegional v-if="region" :region="region" />
    <FooterGlobal v-else />
  </div>
</template>
