import { getRegionIdForCountry } from '~/utils/countryData'

export interface RegionNavLink {
  label: string
  to: string
}

export interface RegionFooterLink {
  label: string
  to?: string
  href?: string
  external?: boolean
  /** Optional Meta Pixel attribution. When set, FooterRegional emits
   *  data-pixel-* attributes so the plugin's delegated click listener
   *  fires the configured event. */
  pixel?: {
    /** Standard event name (Lead, Contact, etc) or 'Custom'. */
    event: string
    /** Required when event === 'Custom' — the trackCustom name. */
    customName?: string
    contentName: string
    contentCategory?: string
    audience?: 'b2b' | 'b2c'
    leadType?: string
  }
}

export interface RegionFooterGroup {
  heading: string
  links: RegionFooterLink[]
}

export interface RegionConfig {
  code: string
  /** Human-readable name used by the region banner / switcher. */
  displayName: string
  basePath: string
  homePath: string
  brandLabel: string
  regionLabel: string
  regionShort: string
  regionSub?: string
  entity: string
  entitySecondary?: string
  globalLinkTo: string
  /** Medusa region id — derived from countryList.ts so there is one source of truth. */
  medusaRegionId: string
  /** ISO 3166-1 alpha-2 codes of countries this region serves. */
  countries: string[]
  navLinks: RegionNavLink[]
  cta?: { label: string, href: string }
  footerGroups: RegionFooterGroup[]
}

/**
 * Utility / user-flow paths that are flat at the root and must NEVER be
 * auto-redirected across regions. These pages take their country context
 * from auth profile or IP, not the URL.
 */
export const UTILITY_PREFIXES = [
  '/top-up',
  '/plan-checkout',
  '/renew-complete',
  '/login',
  '/signup',
  '/forgot-password',
  '/my-account',
  '/articles',
  '/links',
  '/shop',
  '/test-products',
]

export function isUtilityPath(path: string): boolean {
  return UTILITY_PREFIXES.some(p => path === p || path.startsWith(`${p}/`))
}

export const REGIONS: Record<string, RegionConfig> = {
  PH: {
    code: 'PH',
    displayName: 'Philippines',
    basePath: '/ph',
    homePath: '/ph',
    brandLabel: 'NAVITAG',
    regionLabel: 'Philippines',
    regionShort: 'Philippines',
    entity: 'Navitag Technology Systems OPC. Registered Philippine Corporation for APAC Region.',
    entitySecondary: 'Navitag Digital Innovations LLC. All rights reserved. Registered US LLC.',
    globalLinkTo: '/',
    medusaRegionId: getRegionIdForCountry('PH'),
    countries: ['PH'],
    navLinks: [
      { label: 'Where to Buy', to: '/ph/distribution' },
      { label: 'Data Plans', to: '/ph/data-plans' },
      { label: 'For Business', to: '/ph/business' },
    ],
    cta: { label: 'Contact Local Sales', href: '/ph/contact' },
    footerGroups: [
      {
        heading: 'Shopping',
        links: [
          {
            label: 'Shopee',
            href: 'https://shopee.ph/product/1765622736/51207409880',
            external: true,
            pixel: {
              event: 'Lead',
              contentName: 'retailer_shopee_ph_footer',
              contentCategory: 'retailer_outbound',
              audience: 'b2c',
              leadType: 'retailer_outbound',
            },
          },
          {
            label: 'Lazada',
            href: 'https://www.lazada.com.ph/products/i15437871676.html',
            external: true,
            pixel: {
              event: 'Lead',
              contentName: 'retailer_lazada_ph_footer',
              contentCategory: 'retailer_outbound',
              audience: 'b2c',
              leadType: 'retailer_outbound',
            },
          },
          {
            label: 'For Business',
            to: '/ph/business',
            pixel: {
              event: 'Custom',
              customName: 'FooterCTA',
              contentName: 'footer_for_business_ph',
              audience: 'b2b',
            },
          },
        ],
      },
      {
        heading: 'Company',
        links: [
          { label: 'Global Headquarters (USA)', to: '/' },
          { label: 'Contact Local Team', to: '/ph/contact' },
        ],
      },
    ],
  },
}

export function resolveRegionFromPath(path: string): RegionConfig | null {
  for (const region of Object.values(REGIONS)) {
    if (path === region.basePath || path.startsWith(`${region.basePath}/`)) {
      return region
    }
  }
  return null
}

/** Return the region that services `countryCode`, or null (→ falls back to global). */
export function resolveRegionFromCountry(countryCode: string | null | undefined): RegionConfig | null {
  if (!countryCode) return null
  const cc = countryCode.toUpperCase()
  for (const region of Object.values(REGIONS)) {
    if (region.countries.includes(cc)) return region
  }
  return null
}

/** Base paths of every region (e.g. ['/ph']). Used for cross-region path projection. */
export function regionBasePaths(): string[] {
  return Object.values(REGIONS).map(r => r.basePath)
}

/** Metadata for the Global (fallback) "region" — not a RegionConfig itself. */
export const GLOBAL_REGION_META = {
  code: 'global',
  displayName: 'Global',
  basePath: '/',
} as const
