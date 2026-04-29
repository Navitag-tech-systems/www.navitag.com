import { MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from '~/variables'

const BUSINESS_PLAN_PRODUCT_ID = 'prod_01KQA8TJ0YZV9RSRQ1MHG6JNQY'

interface VariantPrice {
  calculated_amount?: number | null
  currency_code?: string | null
}
interface Variant {
  id: string
  title?: string | null
  metadata?: Record<string, unknown> | null
  calculated_price?: VariantPrice | null
}
interface Product {
  id: string
  variants?: Variant[] | null
}

export interface FleetTierData {
  size: 'small' | 'medium' | 'large'
  /** Unit-count range for this tier, derived from variant break_point metadata. */
  range: string
  /** Formatted per-device monthly price, or "Custom" for the large variant. */
  monthly: string
  /** Formatted per-device annual price (monthly × 11 — one month free), or "Custom". */
  annual: string
}

const DEFAULT_TIERS: FleetTierData[] = [
  { size: 'small', range: '1–9', monthly: '—', annual: '—' },
  { size: 'medium', range: '10–24', monthly: '—', annual: '—' },
  { size: 'large', range: '25+', monthly: 'Custom', annual: 'Custom' },
]

function variantSize(v: Variant): 'small' | 'medium' | 'large' | null {
  const t = (v.title || '').toLowerCase().trim()
  if (t === 'small' || t === 's') return 'small'
  if (t === 'medium' || t === 'm') return 'medium'
  if (t === 'large' || t === 'l') return 'large'
  return null
}

function breakPoint(v: Variant | undefined): number | null {
  const raw = v?.metadata?.break_point
  if (raw == null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function formatAmount(amount: number, currency: string): string {
  const isWhole = Number.isInteger(amount)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Annual = 11 × monthly so customers save one month's worth by paying yearly.
const ANNUAL_MULTIPLIER = 11

function formatTierPrices(v: Variant | undefined): { monthly: string | null; annual: string | null } {
  const calc = v?.calculated_price
  if (calc?.calculated_amount == null) return { monthly: null, annual: null }
  const currency = calc.currency_code || 'USD'
  return {
    monthly: formatAmount(calc.calculated_amount, currency),
    annual: formatAmount(calc.calculated_amount * ANNUAL_MULTIPLIER, currency),
  }
}

export async function useFleetPricing(countryCode: string) {
  const basic = useBasicStore()
  const regionId = basic.getRegionId(countryCode)

  // SSR-friendly: runs on the server during the initial render so crawlers and
  // first paint show real prices, then hydrates without a refetch on the client.
  // Cache key is per-country so /business and /ph/business don't collide.
  const { data: product, pending } = await useAsyncData<Product | null>(
    `business-plan-${countryCode.toLowerCase()}`,
    async () => {
      if (!regionId) return null
      try {
        const res = await $fetch<{ product: Product }>(
          `${MEDUSA_BACKEND_URL}/store/products/${BUSINESS_PLAN_PRODUCT_ID}`,
          {
            params: {
              region_id: regionId,
              fields: '*variants.calculated_price,*variants.metadata',
            },
            headers: { 'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY },
          },
        )
        return res.product ?? null
      }
      catch (e) {
        console.error('[useFleetPricing] fetch failed', e)
        return null
      }
    },
  )

  const tiers = computed<FleetTierData[]>(() => {
    const variants = product.value?.variants || []
    const small = variants.find(v => variantSize(v) === 'small')
    const medium = variants.find(v => variantSize(v) === 'medium')

    const sBp = breakPoint(small)
    const mBp = breakPoint(medium)
    const smallPrices = formatTierPrices(small)
    const mediumPrices = formatTierPrices(medium)

    return [
      {
        size: 'small',
        range: sBp ? `1–${sBp}` : DEFAULT_TIERS[0]!.range,
        monthly: smallPrices.monthly || DEFAULT_TIERS[0]!.monthly,
        annual: smallPrices.annual || DEFAULT_TIERS[0]!.annual,
      },
      {
        size: 'medium',
        range: sBp && mBp ? `${sBp + 1}–${mBp}` : DEFAULT_TIERS[1]!.range,
        monthly: mediumPrices.monthly || DEFAULT_TIERS[1]!.monthly,
        annual: mediumPrices.annual || DEFAULT_TIERS[1]!.annual,
      },
      {
        size: 'large',
        range: mBp ? `${mBp + 1}+` : DEFAULT_TIERS[2]!.range,
        monthly: 'Custom',
        annual: 'Custom',
      },
    ]
  })

  return { tiers, pending }
}
