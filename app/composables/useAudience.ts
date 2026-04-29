// Audience inference for Meta Pixel events.
//
// The site serves both B2C (consumers buying a tracker / data plan) and B2B
// (fleet operators, resellers, distribution partners) traffic. Every event
// fires with an `audience: 'b2b' | 'b2c'` parameter so Events Manager can
// filter, and a parallel custom event (`LeadB2B` / `LeadB2C`) is emitted
// alongside the standard `Lead` for clean audience-builder names in Ads Manager.
//
// Inference order:
//   1. explicit override                    → trusted
//   2. B2B keywords in subject / return URL → 'b2b'
//   3. route path under /business           → 'b2b'
//   4. fallback                             → 'b2c'
export type Audience = 'b2b' | 'b2c'

const B2B_RX = /business|fleet|enterprise|reseller|distribut|wholesale|bulk/i

export function inferAudience(opts?: {
  /** Explicit override — wins over every other signal. */
  explicit?: Audience
  /** Contact form / CTA subject, e.g. "Navitag Business PH Inquiry". */
  subject?: string
  /** Post-auth return URL — e.g. signup with `?return=/business` is a B2B signup. */
  returnTo?: string
  /** Override the pathname (defaults to `window.location.pathname`). */
  path?: string
}): Audience {
  if (opts?.explicit) return opts.explicit

  const subject = opts?.subject || ''
  if (subject && B2B_RX.test(subject)) return 'b2b'

  const returnTo = opts?.returnTo || ''
  if (returnTo && B2B_RX.test(returnTo)) return 'b2b'

  const path = opts?.path
    ?? (typeof window !== 'undefined' ? window.location.pathname : '')
  if (/\/business(\/|$)/.test(path)) return 'b2b'

  return 'b2c'
}

/** Auto-resolves audience from the active route. Use inside script-setup. */
export function useAudience(opts?: { explicit?: Audience; subject?: string; returnTo?: string }) {
  const route = useRoute()
  return computed<Audience>(() =>
    inferAudience({
      explicit: opts?.explicit,
      subject: opts?.subject,
      returnTo: opts?.returnTo,
      path: route.path,
    }),
  )
}
