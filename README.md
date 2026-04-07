# Navitag www-v3

The next-generation front-facing website for the Navitag brand, replacing www-v2. Built with Nuxt 4, featuring a global brand site and regional pages, with an ecommerce storefront at `/shop`.

## Project Status

### Completed
- [X] Create a new Nuxt 4 project
- [X] Upload to GitHub
- [X] Extract Navitag brand colors from www-v2 (Blue `#0076F5`, Orange `#F28C38`)
- [X] Migrate all www-v2 content into www-v3 (Global landing, PH landing, PH distribution, Privacy Policy)
- [X] Setup Firebase Authentication and Analytics (client-side plugin + composable)
- [X] Setup shared layouts and reusable header/footer components (Global + PH)

### TODO
- [ ] Build reusable ecom components and/or composables (product search, catalog view)
- [ ] Setup ecommerce storefront at /shop with MedusaJS backend

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Nuxt 4** | Vue 3 SSR/SSG framework |
| **Tailwind CSS** | Utility-first CSS (`@nuxtjs/tailwindcss`) |
| **Pinia** | State management (`@pinia/nuxt`) |
| **Firebase** | Authentication & Analytics (official JS SDK) |
| **Font Awesome 6** | Icon library (CDN) |
| **Google Fonts** | Funnel Sans (`@nuxtjs/google-fonts`) |
| **MedusaJS** | Ecommerce backend (shopapi.navitag.com) |

## Modules & Plugins
- Nuxt MCP: https://mcp-toolkit.nuxt.dev/getting-started/introduction
- MedusaJS frontend: https://github.com/medusajs/medusa-agent-skills/blob/main/plugins/ecommerce-storefront/README.md#installation-with-claude-code

## Local Documentation
- `localapi/shopadmin API docs.md` — Frontend integration guide for the MedusaJS backend (`shopapi.navitag.com`). Covers the two-token auth flow (Firebase ID token → Medusa JWT), required headers, endpoint reference, token refresh strategy, and Vue 3/Nuxt composable examples. Firebase is configured as a custom auth provider on the Medusa backend.

---

## Site Route Mapping

| Route | Description |
|---|---|
| `/` | Global landing page highlighting the Navitag brand |
| `/privacy-policy` | Global privacy policy (Facebook Login compliance) |
| `/ph` | Philippines / SEA / APAC regional landing page |
| `/ph/distribution` | Where to buy - official stores & installation partners |
| `/shop` | JS logic page redirecting to region/country-specific store |
| `/shop/global` | Global ecommerce store (MedusaJS) |

---

## Project Structure

```
app/
├── components/
│   ├── HeaderGlobal.vue      # Sticky nav for global pages
│   ├── FooterGlobal.vue      # Footer for global pages
│   ├── HeaderPh.vue          # Sticky nav for PH/SEA pages
│   └── FooterPh.vue          # Footer for PH/SEA pages
├── composables/
│   └── useFirebase.ts        # Firebase auth/analytics composable
├── layouts/
│   ├── default.vue           # Global layout (HeaderGlobal + FooterGlobal)
│   └── ph.vue                # PH layout (HeaderPh + FooterPh)
├── pages/
│   ├── index.vue             # Global landing page
│   ├── privacy-policy.vue    # Privacy policy
│   └── ph/
│       ├── index.vue         # PH regional landing page
│       └── distribution.vue  # Where to buy page
├── plugins/
│   └── firebase.client.ts    # Firebase initialization (client-side only)
└── app.vue                   # Root app component
```

---

## Brand Colors

| Name | Hex | Usage |
|---|---|---|
| **Navitag Blue** | `#0076F5` | Primary brand color, CTAs, links, headings |
| **Navitag Orange** | `#F28C38` | Secondary/accent color, highlights, product badges |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## Navitag Entities

- **Navitag Digital Innovations LLC** - Sheridan, Wyoming, USA (Global HQ)
- **Navitag Technology Systems OPC** - Makati, Metro Manila, Philippines (SEA/APAC regional hub)
