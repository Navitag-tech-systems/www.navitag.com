/**
 * Client (browser / OS / device) detection from the User-Agent string.
 *
 * Client-only: reads `navigator` when no UA is passed. During SSR there is no
 * navigator, so callers must run this after mount (or pass a UA explicitly).
 * A best-effort parse — UA strings are spoofable and messy, so treat the
 * result as a hint for UX (e.g. adapting a link hub), never for security.
 *
 * In-app webviews (Instagram, Facebook, TikTok, …) are detected first because
 * they embed a base engine's UA (Chrome/Safari) and would otherwise be
 * misread as the plain browser. Knowing a visitor is inside a webview matters:
 * these embedded browsers frequently break Google / Apple OAuth pop-ups and
 * some payment flows, so the UI can nudge "open in your browser".
 */

export type BrowserName =
  | 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Opera'
  | 'Samsung Internet' | 'Unknown'

export type OsName = 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux' | 'Unknown'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export type InAppName =
  | 'Instagram' | 'Facebook' | 'TikTok' | 'LINE' | 'Twitter' | 'Snapchat'
  | 'Pinterest' | 'LinkedIn' | 'WeChat' | 'KakaoTalk' | 'Webview'

export interface ClientInfo {
  browser: BrowserName
  /** Major version as a string, or null when it can't be read. */
  browserVersion: string | null
  os: OsName
  device: DeviceType
  /** True when running inside an app's embedded webview. */
  inApp: boolean
  /** Which app's webview, when detectable; null otherwise. */
  inAppName: InAppName | null
  /** The raw UA the parse was derived from (empty string if unavailable). */
  userAgent: string
}

// Ordered app-webview signatures — first match wins.
const IN_APP_SIGNATURES: Array<{ name: InAppName, re: RegExp }> = [
  { name: 'Instagram', re: /Instagram/i },
  { name: 'Facebook', re: /FBAN|FBAV|FB_IAB|FBIOS/i },
  { name: 'TikTok', re: /BytedanceWebview|Bytedance|musical_ly|TikTok|trill/i },
  { name: 'LINE', re: /\bLine\//i },
  { name: 'Twitter', re: /Twitter|TwitterAndroid/i },
  { name: 'Snapchat', re: /Snapchat/i },
  { name: 'Pinterest', re: /Pinterest/i },
  { name: 'LinkedIn', re: /LinkedInApp/i },
  { name: 'WeChat', re: /MicroMessenger/i },
  { name: 'KakaoTalk', re: /KAKAOTALK/i },
]

function detectInApp(ua: string): InAppName | null {
  for (const sig of IN_APP_SIGNATURES) {
    if (sig.re.test(ua)) return sig.name
  }
  // Generic Android webview marker (WebView UAs carry "; wv").
  if (/;\s*wv\)/i.test(ua)) return 'Webview'
  return null
}

function majorVersion(ua: string, re: RegExp): string | null {
  const m = ua.match(re)
  return m?.[1] ? m[1].split('.')[0]! : null
}

function detectBrowser(ua: string): { browser: BrowserName, browserVersion: string | null } {
  // Order matters: derivative browsers embed "Chrome"/"Safari" tokens, so the
  // more specific brands are checked before the generic engines.
  if (/Edg(?:A|iOS)?\//.test(ua)) return { browser: 'Edge', browserVersion: majorVersion(ua, /Edg(?:A|iOS)?\/([\d.]+)/) }
  if (/OPR\/|Opera|OPT\//.test(ua)) return { browser: 'Opera', browserVersion: majorVersion(ua, /(?:OPR|OPT)\/([\d.]+)/) }
  if (/SamsungBrowser\//.test(ua)) return { browser: 'Samsung Internet', browserVersion: majorVersion(ua, /SamsungBrowser\/([\d.]+)/) }
  if (/Firefox\/|FxiOS\//.test(ua)) return { browser: 'Firefox', browserVersion: majorVersion(ua, /(?:Firefox|FxiOS)\/([\d.]+)/) }
  // CriOS = Chrome on iOS.
  if (/Chrome\/|CriOS\//.test(ua)) return { browser: 'Chrome', browserVersion: majorVersion(ua, /(?:Chrome|CriOS)\/([\d.]+)/) }
  // Safari carries a "Version/x" token and a "Safari/" token, but no Chrome.
  if (/Safari\//.test(ua) && /Version\//.test(ua)) return { browser: 'Safari', browserVersion: majorVersion(ua, /Version\/([\d.]+)/) }
  return { browser: 'Unknown', browserVersion: null }
}

function detectOs(ua: string, maxTouchPoints: number): OsName {
  if (/iPhone|iPad|iPod/.test(ua) || /CriOS|FxiOS/.test(ua)) return 'iOS'
  // iPadOS 13+ masquerades as desktop Safari on "Macintosh" but is touch-capable.
  if (/Macintosh/.test(ua) && maxTouchPoints > 1) return 'iOS'
  if (/Android/.test(ua)) return 'Android'
  if (/Windows NT/.test(ua)) return 'Windows'
  if (/Macintosh|Mac OS X/.test(ua)) return 'macOS'
  if (/Linux/.test(ua)) return 'Linux'
  return 'Unknown'
}

function detectDevice(ua: string, os: OsName, maxTouchPoints: number): DeviceType {
  if (/iPad/.test(ua) || (os === 'iOS' && /Macintosh/.test(ua) && maxTouchPoints > 1)) return 'tablet'
  if (/Android/.test(ua) && !/Mobile/.test(ua)) return 'tablet'
  if (/Mobile|iPhone|iPod/.test(ua)) return 'mobile'
  return 'desktop'
}

/**
 * Parse a User-Agent into structured client info.
 * @param ua UA string; defaults to `navigator.userAgent` when available.
 */
export function detectClient(ua?: string): ClientInfo {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined
  const agent = ua ?? nav?.userAgent ?? ''
  const maxTouchPoints = nav?.maxTouchPoints ?? 0

  const inAppName = detectInApp(agent)
  const { browser, browserVersion } = detectBrowser(agent)
  const os = detectOs(agent, maxTouchPoints)
  const device = detectDevice(agent, os, maxTouchPoints)

  return {
    browser,
    browserVersion,
    os,
    device,
    inApp: inAppName !== null,
    inAppName,
    userAgent: agent,
  }
}
