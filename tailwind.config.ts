import type { Config } from 'tailwindcss'

export default <Config>{
  content: [],
  theme: {
    extend: {
      colors: {
        'navitag-blue': '#0076F5',
        'navitag-orange': '#F28C38',
        'navitag-bg': '#F7F4EF',
      },
      fontFamily: {
        sans: ['"Funnel Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
}
