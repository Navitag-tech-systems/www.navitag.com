<script setup lang="ts">
// Overlay shown on app boot until the user's country is resolved (either
// from backend sync for authed users, or IP geolocation for visitors).
// IMPORTANT — SEO safety:
//   • Wrapped in <ClientOnly>, so this renders nothing server-side.
//   • Nuxt emits the full page HTML to crawlers before hydration, unaffected.
//   • By the time JS executes, the overlay covers the UI only until we have
//     a country code — bots and no-JS users never see this layer.

const basic = useBasicStore()

// Minimum display window so the spinner is reliably perceivable on every
// app load — even when country resolution returns near-instantly.
const MIN_DISPLAY_MS = 900
// Failsafe cap — if anything stalls, never leave the user stuck behind a spinner.
const HARD_TIMEOUT_MS = 6000

const failsafeFired = ref(false)
const minWindowElapsed = ref(false)

onMounted(async () => {
  const minTimer = setTimeout(() => {
    minWindowElapsed.value = true
  }, MIN_DISPLAY_MS)

  const failsafeTimer = setTimeout(() => {
    failsafeFired.value = true
    basic.countryResolved = true
  }, HARD_TIMEOUT_MS)

  await basic.resolveCountry()
  clearTimeout(failsafeTimer)
  // If country resolved before MIN_DISPLAY_MS, the spinner stays up until
  // minTimer fires (handled by `visible` below). No need to clear minTimer.
  void minTimer
})

const visible = computed(
  () => (!basic.countryResolved || !minWindowElapsed.value) && !failsafeFired.value,
)
</script>

<template>
  <ClientOnly>
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
      appear
    >
      <div
        v-if="visible"
        class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-navitag-bg"
        aria-hidden="true"
      >
        <!-- Ambient glow -->
        <div
          class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,118,245,0.08),_transparent_60%)]"
        ></div>

        <div class="relative flex flex-col items-center">
          <img
            src="/logo-sm.png"
            alt=""
            class="h-10 w-auto opacity-90"
          >
          <div class="mt-6 relative w-9 h-9">
            <div class="absolute inset-0 rounded-full border-2 border-gray-200"></div>
            <div
              class="absolute inset-0 rounded-full border-2 border-transparent border-t-navitag-blue animate-spin"
              style="animation-duration: 0.9s;"
            ></div>
          </div>
        </div>
      </div>
    </Transition>
  </ClientOnly>
</template>
