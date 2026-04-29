// Meta CAPI user_data helpers: SHA-256 hashing + browser cookie capture.
//
// Per Meta docs, identifiers like email / phone / name / city / country must
// be SHA-256 hashed (lowercase + trimmed) before transmission. `external_id`
// can be sent unhashed but we still hash for consistency. `_fbp` and `_fbc`
// cookies are sent verbatim — they are already opaque IDs that Meta sets.
//
// Hashing happens client-side because the same hashed values must be
// available for both:
//   1. fbq('init', PIXEL, { em, external_id, ... })   — browser AdvancedMatching
//   2. POST capi.navitag.app  user_data                — server-side mirror
// If we hashed only on the server, browser AM would have nothing to send and
// dedup quality would drop.

export interface HashedUserData {
  /** SHA-256 of lowercase trimmed email. */
  em?: string
  /** SHA-256 of digits-only phone. */
  ph?: string
  /** SHA-256 of lowercase first name. */
  fn?: string
  /** SHA-256 of lowercase last name. */
  ln?: string
  /** SHA-256 of lowercase city. */
  ct?: string
  /** SHA-256 of lowercase ISO 3166-1 alpha-2 country code. */
  country?: string
  /** SHA-256 of the customer's stable identifier (e.g. Firebase UID). */
  external_id?: string
}

export interface CapiUserData extends HashedUserData {
  /** `_fbp` cookie — Meta-set browser pixel ID. */
  fbp?: string
  /** `_fbc` cookie — fbclid-derived click ID. */
  fbc?: string
  /** Browser user agent — required by Meta for matching. */
  client_user_agent?: string
}

/**
 * SHA-256 hex digest using the Web Crypto API.
 * Returns null if SubtleCrypto is unavailable (very old browsers / non-HTTPS).
 */
export async function sha256Hex(input: string): Promise<string | null> {
  if (typeof crypto === 'undefined' || !crypto.subtle) return null
  const buf = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Per Meta normalization rules: lowercase + trim, drop empty values. */
function norm(value: string | null | undefined): string | null {
  if (!value) return null
  const v = String(value).trim().toLowerCase()
  return v || null
}

function normPhone(value: string | null | undefined): string | null {
  if (!value) return null
  const digits = String(value).replace(/\D+/g, '')
  return digits || null
}

/** Hash a plaintext identity object into Meta's expected user_data shape. */
export async function hashIdentity(input: {
  email?: string | null
  phone?: string | null
  firstName?: string | null
  lastName?: string | null
  city?: string | null
  countryCode?: string | null
  externalId?: string | null
}): Promise<HashedUserData> {
  const out: HashedUserData = {}

  const em = norm(input.email)
  const ph = normPhone(input.phone)
  const fn = norm(input.firstName)
  const ln = norm(input.lastName)
  const ct = norm(input.city)
  const country = norm(input.countryCode)
  const external = norm(input.externalId)

  const [emH, phH, fnH, lnH, ctH, ccH, exH] = await Promise.all([
    em ? sha256Hex(em) : null,
    ph ? sha256Hex(ph) : null,
    fn ? sha256Hex(fn) : null,
    ln ? sha256Hex(ln) : null,
    ct ? sha256Hex(ct) : null,
    country ? sha256Hex(country) : null,
    external ? sha256Hex(external) : null,
  ])

  if (emH) out.em = emH
  if (phH) out.ph = phH
  if (fnH) out.fn = fnH
  if (lnH) out.ln = lnH
  if (ctH) out.ct = ctH
  if (ccH) out.country = ccH
  if (exH) out.external_id = exH

  return out
}

/** Read a single cookie value by name. */
function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
  return match ? decodeURIComponent(match[1]!) : null
}

/**
 * Read `_fbp` / `_fbc` Meta cookies. `_fbp` is set by fbevents.js on first
 * pixel boot. `_fbc` is set by fbevents.js when the URL carries `?fbclid=`.
 * If `_fbc` is missing but `?fbclid=` is in the current URL, synthesize one
 * per Meta's format `fb.<subdomain_index>.<timestamp>.<fbclid>`.
 */
export function readFbCookies(): { fbp: string | null; fbc: string | null } {
  const fbp = readCookie('_fbp')
  let fbc = readCookie('_fbc')
  if (!fbc && typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    const fbclid = url.searchParams.get('fbclid')
    if (fbclid) {
      // subdomain_index of 1 = .navitag.com (apex+1 segment). Adjust if the
      // pixel ever moves to a subdomain serving a different rollout.
      fbc = `fb.1.${Date.now()}.${fbclid}`
    }
  }
  return { fbp, fbc }
}

/** Browser-side user_data builder: hashed identity + cookies + UA. */
export async function buildCapiUserData(input: {
  email?: string | null
  phone?: string | null
  firstName?: string | null
  lastName?: string | null
  city?: string | null
  countryCode?: string | null
  externalId?: string | null
}): Promise<CapiUserData> {
  const hashed = await hashIdentity(input)
  const { fbp, fbc } = readFbCookies()
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : undefined
  const out: CapiUserData = { ...hashed }
  if (fbp) out.fbp = fbp
  if (fbc) out.fbc = fbc
  if (ua) out.client_user_agent = ua
  return out
}
