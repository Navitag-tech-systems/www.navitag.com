<script setup lang="ts">
import { useBasicStore } from '~/stores/basicStore'

// Initialize app-level state once on SPA boot.
const basic = useBasicStore()
basic.initAuth()

onMounted(() => { basic.runFirstEntryRedirect() })

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Navitag',
      url: 'https://navitag.com',
      logo: 'https://navitag.com/logo-sm.png',
      description: 'Global GPS trackers with built-in M2M connectivity. No SIM. No contracts. Works in 100+ countries from Day One.',
    }),
  }],
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <AppBootLoader />
</template>
