// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    '@nuxtjs/sitemap',
    '@nuxt/image',
  ],

  image: {
    format: ['webp', 'avif'],
    quality: 80,
    densities: [1, 2],
  },

  site: {
    url: 'https://navitag.com',
    name: 'Navitag',
  },

  runtimeConfig: {
    public: {
      paypalClientId: 'AVx8m5QJkqqyF0stlr1EixS43TInHL_0mf-5nhlBaMDwB9PIwAsY8y4CPc_J5a5TXiiDsMAoMKdnpcuC',
      metaPixelId: '1478826687226054',
      // CAPI mirror endpoint (dedicated subdomain). Browser-side events POST
      // here so the server can forward to Meta with the access token + IP.
      // Override per env via NUXT_PUBLIC_META_CAPI_ENDPOINT.
      metaCapiEndpoint: 'https://capi.navitag.app/',
      // Set to a non-empty string (e.g. "TEST12345") in staging so events
      // land in Meta's Test Events tab rather than production. Empty in prod.
      metaTestEventCode: '',
    },
  },

  vite: {
    optimizeDeps: {
      include: ['topojson-client'],
    },
  },

  routeRules: {
    '/shop': { redirect: { to: '/shop/product/track-1', statusCode: 301 } },
    '/distribution': { redirect: { to: '/shop/product/track-1', statusCode: 301 } },
  },

  sitemap: {
    exclude: [
      '/my-account',
      '/test-products',
      '/links',
      '/shop',
      '/login',
      '/signup',
      '/plan-checkout/**',
      '/renew-complete/**',
      '/top-up/**',
    ],
    sources: [
      '/api/__sitemap__/articles',
    ],
  },

  googleFonts: {
    families: {
      'Funnel Sans': [300, 400, 500, 600, 700, 800],
    },
    display: 'swap',
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { name: 'description', content: 'Navitag provides global GPS trackers with built-in M2M connectivity. No SIM. No contracts. Works in 100+ countries from Day One.' },
        { property: 'og:site_name', content: 'Navitag' },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'en_US' },
        { property: 'og:image', content: 'https://navitag.com/og-default-1200x630.jpg' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:type', content: 'image/jpeg' },
        { property: 'og:image:alt', content: 'Navitag — global GPS trackers with built-in M2M connectivity' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: 'https://navitag.com/og-default-1200x630.jpg' },
        { name: 'twitter:image:alt', content: 'Navitag — global GPS trackers with built-in M2M connectivity' },
        { name: 'theme-color', content: '#0076F5' },
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
          media: 'print',
          onload: "this.media='all'",
        },
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icons/icon-192.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
      noscript: [
        {
          children: '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />',
          tagPosition: 'head',
        },
        {
          children: '<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=1478826687226054&ev=PageView&noscript=1" alt="" />',
          tagPosition: 'bodyClose',
        },
      ],
    },
  },
})
