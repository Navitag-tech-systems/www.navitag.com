<script setup lang="ts">
useHead({
  title: 'Navitag - My Account',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})

const basic = useBasicStore()
const user = computed(() => basic.user)
const authChecked = computed(() => basic.authResolved)
const { $fbq } = useNuxtApp()

if (import.meta.client) {
  onMounted(() => {
    // Account is shared by B2C and B2B users — leave audience to the
    // plugin's route-inference (which falls back to b2c here; that's
    // acceptable as the surface itself isn't conversion-shaped).
    $fbq('ViewContent', {
      content_name: 'my_account',
      content_category: 'account',
    })
  })
}

async function logout() {
  await basic.logout()
}
</script>

<template>
  <div class="min-h-screen bg-navitag-bg py-12">
    <div class="container mx-auto px-6 max-w-lg">

      <!-- Loading -->
      <div v-if="!authChecked" class="text-center py-20">
        <i class="fas fa-spinner fa-spin fa-2x text-navitag-blue"></i>
      </div>

      <!-- Not logged in -->
      <div v-else-if="!user" class="text-center py-20">
        <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <i class="fas fa-user text-3xl text-gray-400"></i>
        </div>
        <h1 class="text-2xl font-extrabold text-gray-950 mb-2">Not Signed In</h1>
        <p class="text-gray-500 text-sm mb-8">Sign in to view your account details.</p>
        <NuxtLink
          to="/login"
          class="inline-block px-8 py-3 rounded-full bg-navitag-blue text-white font-semibold hover:bg-opacity-90 transition shadow-lg shadow-navitag-blue/20"
        >
          Sign In
        </NuxtLink>
      </div>

      <!-- Logged in -->
      <div v-else>
        <div class="text-center mb-8">
          <div class="w-20 h-20 rounded-full bg-navitag-blue bg-opacity-10 flex items-center justify-center mx-auto mb-4">
            <img v-if="user.photoURL" :src="user.photoURL" alt="Avatar" class="w-20 h-20 rounded-full object-cover">
            <i v-else class="fas fa-user text-3xl text-navitag-blue"></i>
          </div>
          <h1 class="text-2xl font-extrabold text-gray-950">{{ user.displayName || 'Navitag User' }}</h1>
          <p class="text-gray-500 text-sm">{{ user.email }}</p>
        </div>

        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="divide-y divide-gray-100">
            <div class="px-6 py-4 flex justify-between items-center">
              <span class="text-xs uppercase font-medium text-gray-400">UID</span>
              <span class="text-sm font-mono text-gray-700">{{ user.uid }}</span>
            </div>
            <div class="px-6 py-4 flex justify-between items-center">
              <span class="text-xs uppercase font-medium text-gray-400">Email</span>
              <span class="text-sm text-gray-900">{{ user.email || '—' }}</span>
            </div>
            <div class="px-6 py-4 flex justify-between items-center">
              <span class="text-xs uppercase font-medium text-gray-400">Email Verified</span>
              <span class="text-sm" :class="user.emailVerified ? 'text-green-600' : 'text-red-500'">
                <i :class="user.emailVerified ? 'fas fa-check-circle' : 'fas fa-times-circle'" class="mr-1"></i>
                {{ user.emailVerified ? 'Yes' : 'No' }}
              </span>
            </div>
            <div class="px-6 py-4 flex justify-between items-center">
              <span class="text-xs uppercase font-medium text-gray-400">Provider</span>
              <span class="text-sm text-gray-900">{{ user.providerData?.[0]?.providerId || '—' }}</span>
            </div>
            <div class="px-6 py-4 flex justify-between items-center">
              <span class="text-xs uppercase font-medium text-gray-400">Phone</span>
              <span class="text-sm text-gray-900">{{ user.phoneNumber || '—' }}</span>
            </div>
            <div class="px-6 py-4 flex justify-between items-center">
              <span class="text-xs uppercase font-medium text-gray-400">Created</span>
              <span class="text-sm text-gray-900">{{ user.metadata?.creationTime || '—' }}</span>
            </div>
            <div class="px-6 py-4 flex justify-between items-center">
              <span class="text-xs uppercase font-medium text-gray-400">Last Sign In</span>
              <span class="text-sm text-gray-900">{{ user.metadata?.lastSignInTime || '—' }}</span>
            </div>
          </div>
        </div>

        <div class="mt-6 text-center">
          <button
            class="px-8 py-3 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition"
            @click="logout"
          >
            <i class="fas fa-sign-out-alt mr-2"></i>Sign Out
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
