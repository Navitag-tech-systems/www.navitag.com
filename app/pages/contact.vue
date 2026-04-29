<script setup lang="ts">
const route = useRoute()

useSeoMeta({
  title: 'Contact Us — Navitag',
  description: 'Reach the Navitag team. Questions about devices, data plans, business fleets, or where to buy — we reply within one business day.',
  ogUrl: 'https://navitag.com/contact',
})
useHead({ link: [{ rel: 'canonical', href: 'https://navitag.com/contact' }] })

const subject = computed(() => {
  const q = route.query.subject
  return typeof q === 'string' ? q : ''
})

if (import.meta.client) {
  const { $fbq } = useNuxtApp()
  onMounted(() => {
    $fbq('ViewContent', {
      content_name: 'contact',
      content_category: 'contact',
      audience: inferAudience({ subject: subject.value }),
    })
  })
}
</script>

<template>
  <ContactView :subject="subject" />
</template>
