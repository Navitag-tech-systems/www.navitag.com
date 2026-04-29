<script setup lang="ts">
definePageMeta({
  layout: 'ph',
})

useSeoMeta({
  title: 'Data Plans — Navitag Philippines',
  description: 'Navitag data plans for the Philippines. Basic, Pro, and Business tiers — priced in your local currency.',
  ogUrl: 'https://navitag.com/ph/data-plans',
})
useHead({ link: [{ rel: 'canonical', href: 'https://navitag.com/ph/data-plans' }] })

if (import.meta.client) {
  const { $fbq } = useNuxtApp()
  onMounted(() => {
    $fbq('ViewContent', {
      content_name: 'data_plans_ph',
      content_category: 'plans',
      content_ids: ['basic', 'pro', 'business'],
      content_type: 'data_plan_list',
      audience: 'b2c',
    })
  })
}
</script>

<template>
  <DataPlansView country-code="PH" region="ph" />
</template>
