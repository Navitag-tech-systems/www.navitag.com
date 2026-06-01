/**
 * IP → country code via Cloudflare's public trace endpoint.
 *
 * `https://www.cloudflare.com/cdn-cgi/trace` geolocates the caller's IP and
 * returns plain `key=value` lines; we read `loc` (ISO 3166-1 alpha-2). It is
 * free, token-less, and sends `Access-Control-Allow-Origin: *`, so a browser
 * `fetch` works cross-origin. Replaces the previous api.country.is /
 * api.ipinfo.io integrations — both only ever consumed the country code.
 */

const CF_TRACE_URL = 'https://www.cloudflare.com/cdn-cgi/trace'

export interface IpCountryOptions {
  /** Per-attempt abort timeout. Default 3500ms. */
  timeoutMs?: number
  /** Extra attempts after the first. Default 0 (single attempt). */
  retries?: number
  /** Delay between attempts. Default 500ms. */
  retryDelayMs?: number
}

// Cloudflare sentinels that are shaped like a country code but aren't one:
// XX = location unknown, T1 = Tor exit node.
const LOC_SENTINELS = new Set(['XX', 'T1'])

/** Pull the `loc=` line out of the trace body and validate it as ISO alpha-2. */
function parseLoc(body: string): string | null {
  for (const line of body.split('\n')) {
    if (line.startsWith('loc=')) {
      const cc = line.slice(4).trim().toUpperCase()
      return /^[A-Z]{2}$/.test(cc) && !LOC_SENTINELS.has(cc) ? cc : null
    }
  }
  return null
}

/**
 * Resolve the caller's country code from Cloudflare's trace endpoint.
 * Returns an uppercase ISO alpha-2 code, or null on failure/unknown.
 */
export async function fetchCountryFromIp(opts: IpCountryOptions = {}): Promise<string | null> {
  const { timeoutMs = 3500, retries = 0, retryDelayMs = 500 } = opts

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(CF_TRACE_URL, {
        signal: AbortSignal.timeout(timeoutMs),
        cache: 'no-store',
      })
      if (res.ok) {
        const cc = parseLoc(await res.text())
        if (cc) return cc
      }
    }
    catch { /* network/timeout — fall through to retry */ }

    if (attempt < retries) {
      await new Promise(resolve => setTimeout(resolve, retryDelayMs))
    }
  }
  return null
}
