<script setup lang="ts">
import { REGIONS } from '~/config/regions'

definePageMeta({
  layout: 'ph',
})

const route = useRoute()

useSeoMeta({
  title: 'Contact Us — Navitag Philippines',
  description: 'Reach the Navitag team in the Philippines. Questions about devices, data plans, fleets, or local distribution — we reply within one business day.',
  ogUrl: 'https://navitag.com/ph/contact',
})
useHead({ link: [{ rel: 'canonical', href: 'https://navitag.com/ph/contact' }] })

const subject = computed(() => {
  const q = route.query.subject
  return typeof q === 'string' ? q : ''
})

if (import.meta.client) {
  const { $fbq } = useNuxtApp()
  onMounted(() => {
    $fbq('ViewContent', {
      content_name: 'contact_ph',
      content_category: 'contact',
      audience: inferAudience({ subject: subject.value }),
    })
  })
}
</script>

<template>
  <ContactView :region="REGIONS.PH" :subject="subject" />
</template>
