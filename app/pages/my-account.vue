<script setup lang="ts">
/**
 * Account dashboard. Three sections: account details, devices with their
 * subscription expiry, and integrations.
 *
 * NOT country-gated, and it already was not: `/my-account` is in
 * UTILITY_PREFIXES, so runFirstEntryRedirect() leaves it alone. A signed-in
 * customer checking their devices from abroad must not be bounced to a
 * regional landing page.
 *
 * Login IS required — everything here is per-account.
 */
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

type TabId = 'account' | 'devices' | 'integrations'
const TABS: Array<{ id: TabId, label: string, icon: string }> = [
  { id: 'account', label: 'My account', icon: 'fa-user' },
  { id: 'devices', label: 'Devices', icon: 'fa-satellite-dish' },
  { id: 'integrations', label: 'Integrations', icon: 'fa-plug' },
]

// The tab lives in the query string so a reload, a back button, or a link
// someone pastes to a colleague all land on the same panel.
const route = useRoute()
const router = useRouter()
const activeTab = computed<TabId>(() => {
  const t = String(route.query.tab || '')
  return (TABS.some(x => x.id === t) ? t : 'account') as TabId
})
function selectTab(id: TabId) {
  router.replace({ query: { ...route.query, tab: id === 'account' ? undefined : id } })
}

const { devices, loading: devicesLoading, error: devicesError, load: loadDevices } = useAccountDevices()

// Fetch only when the tab is actually opened — most visits are here to check
// one detail, and the devices call is two upstream round trips.
watch([activeTab, user], ([tab, u]) => {
  if (tab === 'devices' && u) loadDevices(u)
}, { immediate: true })

const expiringSoon = computed(() =>
  devices.value.filter(d => d.daysRemaining !== null && d.daysRemaining <= 14),
)

function expiryLabel(d: { expiresAt: string | null, daysRemaining: number | null, expired: boolean }) {
  if (!d.expiresAt) return 'No expiry on record'
  const when = new Date(d.expiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  if (d.expired) return `Expired ${when}`
  return `${when} · ${d.daysRemaining} day${d.daysRemaining === 1 ? '' : 's'} left`
}

function expiryTone(d: { daysRemaining: number | null, expired: boolean }) {
  if (d.expired) return 'text-red-600'
  if (d.daysRemaining !== null && d.daysRemaining <= 14) return 'text-amber-600'
  return 'text-gray-600'
}

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
  <div class="min-h-screen bg-navitag-bg py-8 sm:py-12">
    <div class="container mx-auto px-4 sm:px-6 max-w-5xl">

      <!-- Loading -->
      <div v-if="!authChecked" class="text-center py-20">
        <i class="fas fa-spinner fa-spin fa-2x text-navitag-blue" />
      </div>

      <!-- Not logged in -->
      <div v-else-if="!user" class="text-center py-20">
        <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <i class="fas fa-user text-3xl text-gray-400" />
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

      <!-- Dashboard -->
      <div v-else>

        <!-- Identity header -->
        <div class="flex items-center gap-4 mb-8">
          <div class="w-16 h-16 shrink-0 rounded-full bg-navitag-blue bg-opacity-10 flex items-center justify-center overflow-hidden">
            <img v-if="user.photoURL" :src="user.photoURL" alt="" class="w-16 h-16 rounded-full object-cover">
            <i v-else class="fas fa-user text-2xl text-navitag-blue" />
          </div>
          <div class="min-w-0">
            <h1 class="text-xl sm:text-2xl font-extrabold text-gray-950 truncate">
              {{ user.displayName || 'Navitag User' }}
            </h1>
            <p class="text-gray-500 text-sm truncate">{{ user.email }}</p>
          </div>
        </div>

        <div class="flex flex-col md:flex-row gap-6">

          <!-- Nav: sidebar on desktop, scrollable tab row on mobile -->
          <nav class="md:w-56 shrink-0">
            <ul class="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0 pb-1 md:pb-0">
              <li v-for="tab in TABS" :key="tab.id" class="shrink-0">
                <button
                  class="w-full whitespace-nowrap text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2.5"
                  :class="activeTab === tab.id
                    ? 'bg-navitag-blue text-white shadow-sm'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'"
                  @click="selectTab(tab.id)"
                >
                  <i :class="['fas', tab.icon, activeTab === tab.id ? 'text-white' : 'text-gray-400']" />
                  {{ tab.label }}
                </button>
              </li>
            </ul>
          </nav>

          <div class="flex-1 min-w-0">

            <!-- ── My account ─────────────────────────────────────────── -->
            <section v-if="activeTab === 'account'" class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div class="divide-y divide-gray-100">
                <div class="px-5 sm:px-6 py-4 flex justify-between items-center gap-4">
                  <span class="text-xs uppercase font-medium text-gray-400 shrink-0">Email</span>
                  <span class="text-sm text-gray-900 truncate">{{ user.email || '—' }}</span>
                </div>
                <div class="px-5 sm:px-6 py-4 flex justify-between items-center gap-4">
                  <span class="text-xs uppercase font-medium text-gray-400 shrink-0">Email verified</span>
                  <span class="text-sm" :class="user.emailVerified ? 'text-green-600' : 'text-red-500'">
                    <i :class="user.emailVerified ? 'fas fa-check-circle' : 'fas fa-times-circle'" class="mr-1" />
                    {{ user.emailVerified ? 'Yes' : 'No' }}
                  </span>
                </div>
                <div class="px-5 sm:px-6 py-4 flex justify-between items-center gap-4">
                  <span class="text-xs uppercase font-medium text-gray-400 shrink-0">Sign-in method</span>
                  <span class="text-sm text-gray-900 truncate">{{ user.providerData?.[0]?.providerId || '—' }}</span>
                </div>
                <div class="px-5 sm:px-6 py-4 flex justify-between items-center gap-4">
                  <span class="text-xs uppercase font-medium text-gray-400 shrink-0">Phone</span>
                  <span class="text-sm text-gray-900 truncate">{{ user.phoneNumber || '—' }}</span>
                </div>
                <div class="px-5 sm:px-6 py-4 flex justify-between items-center gap-4">
                  <span class="text-xs uppercase font-medium text-gray-400 shrink-0">Member since</span>
                  <span class="text-sm text-gray-900 truncate">{{ user.metadata?.creationTime || '—' }}</span>
                </div>
                <div class="px-5 sm:px-6 py-4 flex justify-between items-center gap-4">
                  <span class="text-xs uppercase font-medium text-gray-400 shrink-0">Last sign in</span>
                  <span class="text-sm text-gray-900 truncate">{{ user.metadata?.lastSignInTime || '—' }}</span>
                </div>
                <div class="px-5 sm:px-6 py-4 flex justify-between items-center gap-4">
                  <span class="text-xs uppercase font-medium text-gray-400 shrink-0">Account ID</span>
                  <span class="text-xs font-mono text-gray-500 truncate">{{ user.uid }}</span>
                </div>
              </div>

              <div class="px-5 sm:px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-3 justify-between items-center">
                <NuxtLink to="/delete-account" class="text-xs text-gray-400 hover:text-red-500 transition">
                  Delete my account
                </NuxtLink>
                <button
                  class="px-6 py-2.5 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition"
                  @click="logout"
                >
                  <i class="fas fa-sign-out-alt mr-2" />Sign Out
                </button>
              </div>
            </section>

            <!-- ── Devices ────────────────────────────────────────────── -->
            <section v-else-if="activeTab === 'devices'">
              <div v-if="devicesLoading" class="text-center py-16 text-gray-400">
                <i class="fas fa-spinner fa-spin fa-lg" />
              </div>

              <div v-else-if="devicesError" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                <i class="fas fa-triangle-exclamation text-2xl text-amber-500 mb-3" />
                <p class="text-sm text-gray-600 mb-4">{{ devicesError }}</p>
                <button
                  class="px-5 py-2 rounded-full bg-navitag-blue text-white text-sm font-semibold"
                  @click="user && loadDevices(user, true)"
                >
                  Try again
                </button>
              </div>

              <div v-else-if="!devices.length" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <i class="fas fa-satellite-dish text-2xl text-gray-300 mb-3" />
                <h2 class="font-bold text-gray-800 mb-1">No devices yet</h2>
                <p class="text-sm text-gray-500">Devices you activate will appear here with their expiry dates.</p>
              </div>

              <div v-else class="space-y-3">
                <div
                  v-if="expiringSoon.length"
                  class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800"
                >
                  <i class="fas fa-clock mr-1.5" />
                  {{ expiringSoon.length }} of {{ devices.length }}
                  device{{ devices.length === 1 ? '' : 's' }}
                  expire{{ expiringSoon.length === 1 ? 's' : '' }} within 14 days.
                </div>

                <div
                  v-for="d in devices"
                  :key="d.imei"
                  class="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div class="min-w-0">
                    <p class="font-bold text-gray-900 truncate">{{ d.name || d.imei }}</p>
                    <p class="text-xs font-mono text-gray-400 truncate">{{ d.imei }}</p>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-sm font-semibold capitalize" :class="expiryTone(d)">
                      {{ expiryLabel(d) }}
                    </p>
                    <p class="text-xs text-gray-400 capitalize">{{ d.plan || 'basic' }} plan</p>
                  </div>
                </div>

                <!-- /user/device-expiration joins on ownership, so a device
                     someone shared with this account is absent by design. Say
                     so, or a user who sees more devices in the app reads this
                     screen as broken. -->
                <p class="text-xs text-gray-400 px-1 pt-1">
                  Only devices you own are listed. Devices shared with you by other people
                  are managed by their owner.
                </p>
              </div>
            </section>

            <!-- ── Integrations ───────────────────────────────────────── -->
            <section v-else class="space-y-4">

              <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <div class="flex items-start gap-3 mb-3">
                  <div class="w-10 h-10 rounded-xl bg-navitag-blue bg-opacity-10 flex items-center justify-center shrink-0">
                    <i class="fas fa-robot text-navitag-blue" />
                  </div>
                  <div class="min-w-0">
                    <h2 class="font-bold text-gray-900">Connect an AI assistant</h2>
                    <p class="text-sm text-gray-500">
                      Ask Claude, ChatGPT or any MCP-capable assistant about your fleet.
                    </p>
                  </div>
                </div>

                <p class="text-sm text-gray-600 mb-4">
                  Add the address below as a custom connector in your assistant, then sign in
                  with this Navitag account. The connection is <strong>read-only</strong> — it can
                  see your vehicles, their location and history, but it cannot lock, unlock,
                  disable or change anything.
                </p>

                <div class="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
                  <code class="text-xs sm:text-sm text-gray-800 break-all">https://mcp.navitag.com/mcp</code>
                </div>

                <a
                  href="https://mcp.navitag.com/docs"
                  target="_blank"
                  rel="noopener"
                  class="text-sm font-semibold text-navitag-blue hover:underline"
                >
                  What it can and cannot do
                  <i class="fas fa-arrow-up-right-from-square text-xs ml-1" />
                </a>
              </div>

              <!-- API keys are not built. There is no key concept anywhere in
                   the stack: the MCP server uses OAuth 2.1 and the API uses
                   Firebase ID tokens, so this needs a third credential type
                   with its own issuance, hashing, scoping and revocation.
                   Showing a dead "Generate" button would be worse than saying
                   so plainly. -->
              <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <div class="flex items-start gap-3 mb-3">
                  <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <i class="fas fa-key text-gray-400" />
                  </div>
                  <div class="min-w-0">
                    <h2 class="font-bold text-gray-900">
                      API keys
                      <span class="ml-2 align-middle text-[10px] uppercase tracking-wide font-bold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                        Coming soon
                      </span>
                    </h2>
                    <p class="text-sm text-gray-500">
                      Direct programmatic access for your own scripts and systems.
                    </p>
                  </div>
                </div>
                <p class="text-sm text-gray-600">
                  Not available yet. To connect an assistant or automation today, use the
                  MCP connector above — it authenticates as you, with the same permissions
                  you already have.
                </p>
              </div>

            </section>

          </div>
        </div>

      </div>
    </div>
  </div>
</template>
