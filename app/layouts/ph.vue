<script setup lang="ts">
import { resolveRegionFromPath, REGIONS } from '~/config/regions'

const route = useRoute()
const region = computed(() => resolveRegionFromPath(route.path) ?? REGIONS.PH)

useHead({
  htmlAttrs: { lang: 'en-PH' },
  meta: [{ property: 'og:locale', content: 'en_PH' }],
})
</script>

<template>
  <div class="font-sans antialiased text-gray-900 bg-navitag-bg">
    <RegionBanner />
    <HeaderRegional :region="region" />
    <slot />
    <FooterRegional :region="region" />
  </div>
</template>
