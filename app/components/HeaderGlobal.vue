<script setup lang="ts">
import { onAuthStateChanged, signOut } from 'firebase/auth'

const mobileMenuOpen = ref(false)
const isLoggedIn = ref(false)

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

onMounted(() => {
  const { auth } = useFirebase()
  onAuthStateChanged(auth, (user) => {
    isLoggedIn.value = !!user
  })
})

async function logout() {
  const { auth } = useFirebase()
  await signOut(auth)
  localStorage.removeItem('medusa_jwt')
  isLoggedIn.value = false
  navigateTo('/')
}
</script>

<template>
  <header class="bg-white border-b border-gray-100 sticky top-0 z-50">
    <nav class="container mx-auto px-6 py-4 flex items-center justify-between">
      <NuxtLink to="/" class="flex items-center gap-3">
        <img src="/logo-sm.png" alt="Navitag Logo" class="h-10 w-auto">
        <span class="text-2xl font-bold text-gray-900">Navitag</span>
      </NuxtLink>

      <div class="hidden md:flex items-center gap-8 text-sm font-medium">
        <a href="#connectivity" class="hover:text-navitag-blue transition">The M2M Edge</a>
        <a href="#products" class="hover:text-navitag-blue transition">Our Products</a>
        <a href="#the-app" class="hover:text-navitag-blue transition">The App</a>
        <a href="#global" class="hover:text-navitag-blue transition">Our Global Footprint</a>
        <a href="#contact" class="px-5 py-2.5 rounded-full bg-navitag-blue text-white text-sm font-semibold hover:bg-opacity-90 transition">Contact Us</a>
        <ClientOnly>
          <button v-if="isLoggedIn" class="text-gray-500 hover:text-red-500 transition" @click="logout" title="Logout">
            <i class="fas fa-sign-out-alt fa-lg"></i>
          </button>
        </ClientOnly>
      </div>

      <button class="md:hidden text-gray-900" @click="mobileMenuOpen = !mobileMenuOpen">
        <i class="fas fa-bars fa-lg"></i>
      </button>
    </nav>

    <div v-show="mobileMenuOpen" class="md:hidden bg-white border-t border-gray-100">
      <div class="px-6 py-6 flex flex-col gap-6 text-sm font-medium">
        <a href="#connectivity" class="block" @click="closeMobileMenu">The M2M Edge</a>
        <a href="#products" class="block" @click="closeMobileMenu">Our Products</a>
        <a href="#the-app" class="block" @click="closeMobileMenu">The App</a>
        <a href="#global" class="block" @click="closeMobileMenu">Our Global Footprint</a>
        <a href="#contact" class="block px-5 py-2.5 text-center rounded-full bg-navitag-blue text-white text-sm font-semibold hover:bg-opacity-90 transition" @click="closeMobileMenu">Contact Us</a>
        <ClientOnly>
          <button v-if="isLoggedIn" class="block text-red-500" @click="logout(); closeMobileMenu()">
            <i class="fas fa-sign-out-alt mr-2"></i>Logout
          </button>
        </ClientOnly>
      </div>
    </div>
  </header>
</template>
