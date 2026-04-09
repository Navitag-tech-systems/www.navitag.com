<script setup>
const props = defineProps({
  error: Object,
})

const statusCode = computed(() => props.error?.statusCode || 404)
const message = computed(() => {
  if (statusCode.value === 404) return 'The page you\'re looking for doesn\'t exist.'
  return 'Something went wrong.'
})

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="font-sans antialiased text-gray-900 bg-white min-h-screen flex items-center justify-center px-4">
    <div class="text-center max-w-md">
      <svg class="w-48 h-48 mx-auto mb-6 text-gray-300" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Broken map/compass illustration -->
        <circle cx="100" cy="90" r="60" stroke="currentColor" stroke-width="2" stroke-dasharray="6 4" />
        <circle cx="100" cy="90" r="4" fill="currentColor" />
        <!-- Compass needle (tilted/broken) -->
        <line x1="100" y1="90" x2="85" y2="55" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
        <line x1="100" y1="90" x2="120" y2="118" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.5" />
        <!-- Cardinal marks -->
        <text x="100" y="24" text-anchor="middle" fill="currentColor" font-size="12" font-family="sans-serif" opacity="0.6">?</text>
        <text x="166" y="94" text-anchor="middle" fill="currentColor" font-size="12" font-family="sans-serif" opacity="0.6">?</text>
        <text x="34" y="94" text-anchor="middle" fill="currentColor" font-size="12" font-family="sans-serif" opacity="0.6">?</text>
        <text x="100" y="160" text-anchor="middle" fill="currentColor" font-size="12" font-family="sans-serif" opacity="0.6">?</text>
        <!-- Small X mark to indicate "lost" -->
        <line x1="140" y1="140" x2="155" y2="155" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.4" />
        <line x1="155" y1="140" x2="140" y2="155" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.4" />
      </svg>
      <p class="text-lg text-gray-500 mb-8">{{ message }}</p>
      <button
        @click="handleError"
        class="text-sm text-gray-500 underline underline-offset-4 hover:text-gray-800 transition-colors"
      >
        Go back home
      </button>
    </div>
  </div>
</template>
