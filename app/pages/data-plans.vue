<script setup lang="ts">
// Global / USA data plans. Region resolution happens upstream:
//   • plugins/region-redirect.client.ts auto-sends non-US users with a
//     matching regional site (e.g. PH) to their /{cc}/data-plans page.
//   • This page stays "dumb" — it just prices for US / Global.
useSeoMeta({
  title: 'Data Plans — Navitag',
  description: 'Simple global data plans for your Navitag devices. Basic, Pro, and Business tiers with 100+ country coverage.',
  ogUrl: 'https://navitag.com/data-plans',
})
useHead({ link: [{ rel: 'canonical', href: 'https://navitag.com/data-plans' }] })

if (import.meta.client) {
  const { $fbq } = useNuxtApp()
  onMounted(() => {
    $fbq('ViewContent', {
      content_name: 'data_plans',
      content_category: 'plans',
      content_ids: ['basic', 'pro', 'business'],
      content_type: 'data_plan_list',
      audience: 'b2c',
    })
  })
}
</script>

<template>
  <DataPlansView country-code="US" />
</template>
