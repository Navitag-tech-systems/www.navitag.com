<script setup lang="ts">
useSeoMeta({
  title: 'Navitag — Never Lose What Matters',
  description: 'Global GPS trackers with built-in M2M connectivity. No SIM card. No contracts. No borders. Works in 100+ countries out of the box.',
  ogTitle: 'Navitag — Never Lose What Matters',
  ogDescription: 'Global GPS trackers with built-in M2M connectivity. Works in 100+ countries out of the box.',
  ogUrl: 'https://navitag.com',
})
useHead({ link: [{ rel: 'canonical', href: 'https://navitag.com' }] })

if (import.meta.client) {
  const { $fbq } = useNuxtApp()
  onMounted(() => {
    $fbq('ViewContent', {
      content_name: 'home',
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
  <HomeCoverage />
  <HomeFlexibility />
  <HomeGuarantee />
</template>
