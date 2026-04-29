<script setup lang="ts">
definePageMeta({ layout: 'ph' })

useSeoMeta({
  title: 'Navitag Philippines — Never Lose What Matters',
  description: 'Global GPS trackers with built-in M2M connectivity, fulfilled locally from Metro Manila. Runs on Globe and Smart\'s 4G LTE / 5G networks. No SIM card. No contracts.',
  ogTitle: 'Navitag Philippines — Never Lose What Matters',
  ogDescription: 'Global GPS trackers with built-in M2M connectivity, fulfilled locally from Metro Manila. Runs on Globe and Smart networks.',
  ogUrl: 'https://navitag.com/ph',
})
useHead({ link: [{ rel: 'canonical', href: 'https://navitag.com/ph' }] })

if (import.meta.client) {
  const { $fbq } = useNuxtApp()
  onMounted(() => {
    $fbq('ViewContent', {
      content_name: 'home_ph',
      content_category: 'marketing',
      audience: 'b2c',
    })
  })
}
</script>

<template>
  <HomeBannerCarousel />
  <HomeSteps />
  <HomeNoSim />
  <HomeCoveragePh />
  <HomeFlexibility />
  <HomeGuarantee region="ph" />
</template>
