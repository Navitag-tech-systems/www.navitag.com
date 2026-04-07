// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
  ],

  googleFonts: {
    families: {
      'Funnel Sans': [300, 400, 500, 600, 700, 800],
    },
  },

  app: {
    head: {
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
