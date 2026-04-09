// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    '@nuxtjs/sitemap',
  ],

  site: {
    url: 'https://www.navitag.com',
    name: 'Navitag',
  },

  sitemap: {
    exclude: [
      '/acct-log',
      '/test-products',
      '/links',
      '/shop',
      '/login',
      '/signup',
      '/plan-checkout/**',
      '/renew-complete/**',
      '/top-up/**',
    ],
  },

  googleFonts: {
    families: {
      'Funnel Sans': [300, 400, 500, 600, 700, 800],
    },
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { name: 'description', content: 'Navitag provides GPS trackers, wearables, and live dashcams with global M2M eSIM connectivity, working in over 100 countries from Day One.' },
        { property: 'og:site_name', content: 'Navitag' },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'en_US' },
        { name: 'twitter:card', content: 'summary' },
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
        },
        {
          rel: 'icon',
          type: 'image/png',
          href: '/logo-sm.png',
        },
      ],
    },
  },
})
