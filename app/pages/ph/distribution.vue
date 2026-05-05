<script setup lang="ts">
definePageMeta({ layout: 'ph' })

useSeoMeta({
  title: 'Navitag - Where to Buy | Southeast Asia',
  description: 'Buy genuine Navitag GPS trackers in the Philippines and Southeast Asia — via Shopee, Lazada, our online store, or authorized installers in Metro Manila and Cebu.',
  ogTitle: 'Navitag - Where to Buy | Southeast Asia',
  ogDescription: 'Find official Navitag stores and authorized retailers in the Philippines and Southeast Asia.',
  ogUrl: 'https://navitag.com/ph/distribution',
})
useHead({ link: [{ rel: 'canonical', href: 'https://navitag.com/ph/distribution' }] })

if (import.meta.client) {
  const { $fbq } = useNuxtApp()
  onMounted(() => {
    $fbq('ViewContent', {
      content_name: 'distribution_ph',
      content_category: 'distribution',
      audience: 'b2c',
    })
  })
}
</script>

<template>
  <!-- Page Header -->
  <section class="relative bg-gray-50 py-20 border-b border-gray-100">
    <div class="container mx-auto px-6 text-center max-w-3xl">
      <div class="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-navitag-blue bg-opacity-10 text-navitag-blue font-semibold text-xs border border-navitag-blue border-opacity-20 mb-6">
        <i class="fas fa-store"></i> Official Distribution Channels
      </div>
      <h1 class="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-gray-950 mb-6">
        Get Your Navitag Devices.
      </h1>
      <p class="text-lg text-gray-600 leading-relaxed">
        Purchase authentic Navitag trackers, dashcams, and wearables through our official online marketplace stores, or visit our authorized physical installation partners.
      </p>
    </div>
  </section>

  <!-- Official Online Stores -->
  <section class="py-20 bg-white">
    <div class="container mx-auto px-6">
      <h2 class="text-2xl font-extrabold tracking-tight text-gray-950 mb-10 text-center">Official Online Stores</h2>

      <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <!-- Shopee -->
        <a href="https://shopee.ph/ahw7ln8f3c" target="_blank" rel="noopener noreferrer" class="group block bg-white p-8 rounded-3xl border-2 border-transparent hover:border-[#EE4D2D] shadow-lg shadow-gray-200/50 hover:shadow-[#EE4D2D]/20 transition-all text-center flex flex-col h-full" data-pixel-event="Lead" data-pixel-audience="b2c" data-pixel-content-name="retailer_shopee_ph" data-pixel-content-category="retailer_outbound" data-pixel-lead-type="retailer_outbound">
          <div class="w-16 h-16 mx-auto rounded-full bg-orange-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <i class="fas fa-shopping-bag fa-2x text-[#EE4D2D]"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-950 mb-2">Shopee Philippines</h3>
          <p class="text-sm text-gray-600 mb-8 flex-grow">Shop our official Shopee store for fast, nationwide delivery and exclusive platform vouchers.</p>
          <div class="inline-block px-6 py-2.5 rounded-full bg-[#EE4D2D] text-white text-sm font-semibold w-full">
            Shop on Shopee <i class="fas fa-external-link-alt ml-1 text-xs"></i>
          </div>
        </a>

        <!-- Lazada -->
        <a href="https://www.lazada.com.ph/shop/navitag-tech?path=index.htm&lang=en" target="_blank" rel="noopener noreferrer" class="group block bg-white p-8 rounded-3xl border-2 border-transparent hover:border-[#0F146D] shadow-lg shadow-gray-200/50 hover:shadow-[#0F146D]/20 transition-all text-center flex flex-col h-full" data-pixel-event="Lead" data-pixel-audience="b2c" data-pixel-content-name="retailer_lazada_ph" data-pixel-content-category="retailer_outbound" data-pixel-lead-type="retailer_outbound">
          <div class="w-16 h-16 mx-auto rounded-full bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <i class="fas fa-heart fa-2x text-[#0F146D]"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-950 mb-2">Lazada</h3>
          <p class="text-sm text-gray-600 mb-8 flex-grow">Experience Lazada guarantees, fast shipping, and easy returns directly from our official flagship store.</p>
          <div class="inline-block px-6 py-2.5 rounded-full bg-[#0F146D] text-white text-sm font-semibold w-full">
            Shop on Lazada <i class="fas fa-external-link-alt ml-1 text-xs"></i>
          </div>
        </a>

        <!-- Navitag Direct — coming soon (PH online store not yet live) -->
        <div class="group block bg-white p-8 rounded-3xl border-2 border-transparent shadow-lg shadow-gray-200/50 text-center flex flex-col h-full opacity-60 cursor-not-allowed" aria-disabled="true">
          <div class="w-16 h-16 mx-auto rounded-full bg-blue-50 flex items-center justify-center mb-6">
            <img src="/logo-sm.png" alt="Navitag Logo" class="h-8 w-auto">
          </div>
          <h3 class="text-xl font-bold text-gray-950 mb-2">Navitag Direct</h3>
          <p class="text-sm text-gray-600 mb-8 flex-grow">Buy directly from our official online store with seamless local checkout and full warranty support.</p>
          <div class="inline-block px-6 py-2.5 rounded-full bg-gray-200 text-gray-500 text-sm font-semibold w-full">
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Authorized Installation Partners -->
  <section class="py-20 bg-gray-50 border-t border-gray-100">
    <div class="container mx-auto px-6 max-w-4xl">
      <div class="text-center mb-12">
        <h2 class="text-2xl font-extrabold tracking-tight text-gray-950 mb-4">Authorized Retail Partners</h2>
        <p class="text-gray-600 max-w-2xl mx-auto">Prefer professional installation for your vehicle dashcams or stealth trackers? Visit our certified local partners across Southeast Asia.</p>
      </div>

      <div class="mb-10">
        <h3 class="text-xl font-bold text-gray-900 border-b-2 border-navitag-blue pb-2 mb-6 inline-block">Philippines</h3>

        <div class="space-y-4">
          <!-- Metro Manila -->
          <details class="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <summary class="flex cursor-pointer items-center justify-between gap-1.5 p-6 text-gray-900 [&::-webkit-details-marker]:hidden list-none">
              <h4 class="font-semibold text-lg flex items-center gap-3">
                <i class="fas fa-map-marker-alt text-navitag-orange"></i> Metro Manila Partners
              </h4>
              <span class="shrink-0 transition duration-300 group-open:-rotate-180">
                <i class="fas fa-chevron-down text-gray-500"></i>
              </span>
            </summary>
            <div class="px-6 pb-6 border-t border-gray-100 pt-4">
              <div>
                <h5 class="font-bold text-gray-900 mb-3">Quirino Highway Auto Supply</h5>
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p class="text-sm font-semibold text-gray-800">Main Branch</p>
                  <p class="text-sm text-gray-600 mb-3">761 Quirino Hwy, Novaliches, Quezon City, 1116 Metro Manila</p>
                  <a href="https://maps.app.goo.gl/9sAfmkP3nB5mDXwS9" target="_blank" rel="noopener noreferrer" class="inline-flex items-center text-xs font-semibold text-navitag-blue hover:underline" data-pixel-event="FindLocation" data-pixel-audience="b2c" data-pixel-content-name="retailer_qhas_novaliches" data-pixel-content-category="retail_locator">
                    <i class="fas fa-map-marked-alt mr-1"></i> View on Map
                  </a>
                </div>
              </div>
            </div>
          </details>

          <!-- Cebu -->
          <details class="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <summary class="flex cursor-pointer items-center justify-between gap-1.5 p-6 text-gray-900 [&::-webkit-details-marker]:hidden list-none">
              <h4 class="font-semibold text-lg flex items-center gap-3">
                <i class="fas fa-map-marker-alt text-navitag-orange"></i> Cebu Partners
              </h4>
              <span class="shrink-0 transition duration-300 group-open:-rotate-180">
                <i class="fas fa-chevron-down text-gray-500"></i>
              </span>
            </summary>
            <div class="px-6 pb-6 border-t border-gray-100 pt-4">
              <h5 class="font-bold text-gray-900 mb-4">Cebu Massive Auto Parts Inc.</h5>
              <div class="grid md:grid-cols-2 gap-4">
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col">
                  <p class="text-sm font-semibold text-gray-800">Cebu City Main Branch</p>
                  <p class="text-sm text-gray-600 mb-3 flex-grow">B20 Gochan Bldg., Leon Kilat Street, Kalubihan, Cebu City, Cebu 6000</p>
                  <a href="https://maps.google.com/?q=10.293764457655655,123.89688098043497" target="_blank" rel="noopener noreferrer" class="inline-flex items-center text-xs font-semibold text-navitag-blue hover:underline mt-auto" data-pixel-event="FindLocation" data-pixel-audience="b2c" data-pixel-content-name="retailer_cmap_cebu_city_main" data-pixel-content-category="retail_locator">
                    <i class="fas fa-map-marked-alt mr-1"></i> View on Map
                  </a>
                </div>
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col">
                  <p class="text-sm font-semibold text-gray-800">Mandaue Branch</p>
                  <p class="text-sm text-gray-600 mb-3 flex-grow">Apt. D, Comfoods Bldg., M.C. Briones Street, Maguikay, Mandaue City, Cebu 6014</p>
                  <a href="https://maps.google.com/?q=10.337475916406728,123.94312397301461" target="_blank" rel="noopener noreferrer" class="inline-flex items-center text-xs font-semibold text-navitag-blue hover:underline mt-auto" data-pixel-event="FindLocation" data-pixel-audience="b2c" data-pixel-content-name="retailer_cmap_mandaue" data-pixel-content-category="retail_locator">
                    <i class="fas fa-map-marked-alt mr-1"></i> View on Map
                  </a>
                </div>
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col">
                  <p class="text-sm font-semibold text-gray-800">Basak, San Nicolas Branch</p>
                  <p class="text-sm text-gray-600 mb-3 flex-grow">Cebu South Road Corner Eucalyptus Street, Basak, San Nicolas, Cebu City, Cebu 6000</p>
                  <a href="https://maps.google.com/?q=10.289948459913697,123.87116804002402" target="_blank" rel="noopener noreferrer" class="inline-flex items-center text-xs font-semibold text-navitag-blue hover:underline mt-auto" data-pixel-event="FindLocation" data-pixel-audience="b2c" data-pixel-content-name="retailer_cmap_basak_san_nicolas" data-pixel-content-category="retail_locator">
                    <i class="fas fa-map-marked-alt mr-1"></i> View on Map
                  </a>
                </div>
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col">
                  <p class="text-sm font-semibold text-gray-800">Bulacao, Talisay Branch</p>
                  <p class="text-sm text-gray-600 mb-3 flex-grow">Quintin Dy Bldg., Cebu South Road, Bulacao, Talisay City, Cebu 6045</p>
                  <a href="https://maps.google.com/?q=10.266989634131091,123.84282297178031" target="_blank" rel="noopener noreferrer" class="inline-flex items-center text-xs font-semibold text-navitag-blue hover:underline mt-auto" data-pixel-event="FindLocation" data-pixel-audience="b2c" data-pixel-content-name="retailer_cmap_bulacao_talisay" data-pixel-content-category="retail_locator">
                    <i class="fas fa-map-marked-alt mr-1"></i> View on Map
                  </a>
                </div>
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col">
                  <p class="text-sm font-semibold text-gray-800">Tabunok, Talisay Branch</p>
                  <p class="text-sm text-gray-600 mb-3 flex-grow">Suarez Bldg., Cebu South Road, Tabunok, Talisay City, Cebu 6045</p>
                  <a href="https://maps.google.com/?q=10.262052776403443,123.83754466649651" target="_blank" rel="noopener noreferrer" class="inline-flex items-center text-xs font-semibold text-navitag-blue hover:underline mt-auto" data-pixel-event="FindLocation" data-pixel-audience="b2c" data-pixel-content-name="retailer_cmap_tabunok_talisay" data-pixel-content-category="retail_locator">
                    <i class="fas fa-map-marked-alt mr-1"></i> View on Map
                  </a>
                </div>
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col">
                  <p class="text-sm font-semibold text-gray-800">Awayan, Carcar Branch</p>
                  <p class="text-sm text-gray-600 mb-3 flex-grow">Natalio B. Bacalso Cebu South Road, Awayan, Carcar City, Cebu 6019</p>
                  <a href="https://maps.google.com/?q=10.10912775986944,123.64832329919201" target="_blank" rel="noopener noreferrer" class="inline-flex items-center text-xs font-semibold text-navitag-blue hover:underline mt-auto" data-pixel-event="FindLocation" data-pixel-audience="b2c" data-pixel-content-name="retailer_cmap_awayan_carcar" data-pixel-content-category="retail_locator">
                    <i class="fas fa-map-marked-alt mr-1"></i> View on Map
                  </a>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  </section>

  <!-- Bulk Pricing -->
  <section class="py-20 bg-white border-t border-gray-100">
    <div class="container mx-auto px-6 max-w-3xl text-center">
      <h2 class="text-2xl font-extrabold tracking-tight text-gray-950 mb-4">Need Bulk or Fleet Pricing?</h2>
      <p class="text-gray-600 mb-8">For orders of 10+ devices, commercial fleet deployments, or B2B inquiries, please bypass the retail stores and speak directly to our local enterprise team.</p>
      <a href="mailto:sea-sales@navitag.com" class="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-navitag-blue text-white font-semibold hover:bg-opacity-90 transition shadow-lg shadow-navitag-blue/20" data-pixel-event="Contact" data-pixel-audience="b2b" data-pixel-content-name="distribution_ph_bulk_sales" data-pixel-content-category="b2b_intent" data-pixel-lead-type="reseller_inquiry">
        Contact Fleet Sales <i class="fas fa-envelope ml-2"></i>
      </a>

      <div class="mt-16 pt-12 border-t border-gray-100">
        <h2 class="text-2xl font-extrabold tracking-tight text-gray-950 mb-4">Interested in Reselling Navitag?</h2>
        <p class="text-gray-600 mb-8">Join our growing network of authorized resellers across the Philippines and Southeast Asia. Get partner pricing, marketing support, and dedicated account management.</p>
        <NuxtLink to="/ph/contact" class="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-navitag-orange text-white font-semibold hover:bg-opacity-90 transition shadow-lg shadow-navitag-orange/20" data-pixel-event="Contact" data-pixel-audience="b2b" data-pixel-content-name="distribution_ph_reseller" data-pixel-content-category="b2b_intent" data-pixel-lead-type="reseller_inquiry">
          Become a Reseller <i class="fas fa-handshake ml-2"></i>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
