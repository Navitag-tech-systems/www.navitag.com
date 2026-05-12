<script setup lang="ts">
import type { RegionConfig } from '~/config/regions'

interface InfoCard {
  icon: string
  /** Font Awesome style prefix — 'fas' (solid) by default, 'fab' for brand glyphs. */
  iconStyle?: string
  label: string
  text: string
  /** When set, the card renders as a link (e.g. mailto:). */
  href?: string
}

const props = withDefaults(defineProps<{
  region?: RegionConfig | null
  /** Pre-fill for the form's subject field. */
  subject?: string
  /** Override headings if the region/page needs different copy. */
  heading?: string
  subheading?: string
  formHeading?: string
  formSubheading?: string
  /** Replace the default info cards entirely if callers need full control. */
  infoCards?: InfoCard[]
}>(), {
  region: null,
  subject: '',
  heading: '',
  subheading: '',
  formHeading: 'Send us a message',
  formSubheading: 'We read every note and reply personally.',
  infoCards: () => [],
})

const emit = defineEmits<{ success: [payload: { name: string, email: string }] }>()

const defaultHeading = computed(() => {
  if (props.heading) return props.heading
  return props.region ? `Talk to our ${props.region.regionShort} team.` : 'Say hi.'
})

const defaultSubheading = computed(() => {
  if (props.subheading) return props.subheading
  if (props.region) {
    return `Questions about devices, data plans, or fleets in ${props.region.regionShort} — drop us a note and we'll reply within one business day.`
  }
  return 'Questions about devices, data plans, or fleets — drop us a note and we\'ll reply within one business day.'
})

const defaultInfoCards = computed<InfoCard[]>(() => {
  if (props.infoCards?.length) return props.infoCards

  // Regional mode: lead with the regional entity, then whatever contact
  // channels that region defines (email, Viber, WhatsApp, hotline, …),
  // then Global HQ + response time as fallback.
  if (props.region) {
    const channelCards: InfoCard[] = (props.region.contact ?? []).map(c => ({
      icon: c.icon,
      iconStyle: c.iconStyle,
      label: c.label,
      text: c.value,
      href: c.href,
    }))
    return [
      {
        icon: 'fa-earth-asia',
        label: props.region.regionShort,
        text: props.region.entity,
      },
      ...channelCards,
      {
        icon: 'fa-building',
        label: 'Global HQ',
        text: 'Navitag Digital Innovations LLC · Sheridan, Wyoming, USA',
      },
      {
        icon: 'fa-clock',
        label: 'Response time',
        text: 'Within one business day, Mon–Fri',
      },
    ]
  }

  // Global mode: HQ + regional hub + response.
  return [
    {
      icon: 'fa-building',
      label: 'Global HQ',
      text: 'Navitag Digital Innovations LLC · Sheridan, Wyoming, USA',
    },
    {
      icon: 'fa-earth-asia',
      label: 'SEA / APAC',
      text: 'Navitag Technology Systems OPC · Makati, Metro Manila, Philippines',
    },
    {
      icon: 'fa-clock',
      label: 'Response time',
      text: 'Within one business day, Mon–Fri',
    },
  ]
})
</script>

<template>
  <section class="relative bg-navitag-bg overflow-hidden">
    <!-- Ambient glows -->
    <div
      class="absolute -top-40 -right-32 w-[520px] h-[520px] rounded-full bg-navitag-blue/10 blur-3xl pointer-events-none"
      aria-hidden="true"
    ></div>
    <div
      class="absolute -bottom-40 -left-32 w-[420px] h-[420px] rounded-full bg-navitag-orange/10 blur-3xl pointer-events-none"
      aria-hidden="true"
    ></div>

    <div class="relative max-w-5xl mx-auto px-6 sm:px-8 pt-20 sm:pt-28 pb-20 sm:pb-28">
      <!-- Intro -->
      <div class="max-w-2xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700 text-[11px] font-semibold tracking-[0.15em] uppercase">
          <span class="w-1.5 h-1.5 rounded-full bg-navitag-orange"></span>
          Contact
        </div>
        <h1 class="mt-5 text-4xl sm:text-5xl lg:text-[56px] font-semibold tracking-tight leading-[1.02] text-gray-950">
          {{ defaultHeading }} <br>
          <span class="text-gray-400">We'll write back.</span>
        </h1>
        <p class="mt-6 text-base sm:text-lg text-gray-600 leading-relaxed">
          {{ defaultSubheading }}
        </p>
      </div>

      <!-- Form — above the info cards -->
      <div class="mt-10 sm:mt-12">
        <ContactForm
          :heading="formHeading"
          :subheading="formSubheading"
          :subject="subject"
          @success="(p) => emit('success', p)"
        />
      </div>

      <!-- Info cards — below the form -->
      <div class="mt-14 sm:mt-20 grid gap-5 sm:grid-cols-3">
        <component
          :is="card.href ? 'a' : 'div'"
          v-for="card in defaultInfoCards"
          :key="card.label"
          :href="card.href"
          class="flex items-start gap-4 p-5 rounded-2xl bg-white/70 border border-gray-200/70"
          :class="card.href ? 'transition hover:bg-white hover:border-navitag-blue/30' : ''"
        >
          <div class="shrink-0 w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-navitag-blue">
            <i class="text-[14px]" :class="[card.iconStyle || 'fas', card.icon]"></i>
          </div>
          <div>
            <div class="text-[11px] uppercase tracking-[0.18em] font-semibold text-gray-500">
              {{ card.label }}
            </div>
            <div class="mt-0.5 text-[13.5px] leading-relaxed" :class="card.href ? 'text-navitag-blue' : 'text-gray-800'">
              {{ card.text }}
            </div>
          </div>
        </component>
      </div>
    </div>
  </section>
</template>
