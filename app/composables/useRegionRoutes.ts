/**
 * Utilities for cross-region routing. Uses the Nuxt/Vue router as the
 * source of truth — no manual page lists to maintain. Catch-all routes
 * (e.g. pages/[...slug].vue) are intentionally ignored so we don't
 * falsely claim every path "exists" in every region.
 *
 * Region prefixes are derived from `app/config/regions.ts` — a single
 * registry powers the header/footer, the redirect plugin, and this helper.
 */

import { regionBasePaths } from '~/config/regions'

const KNOWN_REGION_PREFIXES = regionBasePaths()

function isCatchAllPath(p: string): boolean {
  // Vue Router serializes [...slug].vue / [...pathMatch].vue as
  // "/:slug(.*)*", "/:pathMatch(.*)*", etc. The common token is "(.*)".
  return p.includes('(.*)')
}

export function useRegionRoutes() {
  const router = useRouter()

  /** True if `path` resolves to a real, non-catch-all route. */
  function routeExists(path: string): boolean {
    const resolved = router.resolve(path)
    if (!resolved.matched.length) return false
    return !resolved.matched.some(m => isCatchAllPath(m.path))
  }

  /** Strip any known region prefix from `path`, returning the unscoped path. */
  function stripRegion(path: string): string {
    for (const prefix of KNOWN_REGION_PREFIXES) {
      if (path === prefix) return '/'
      if (path.startsWith(`${prefix}/`)) return path.slice(prefix.length)
    }
    return path
  }

  /** Project `path` into a different region. `targetRegionPath` is "/" for Global, "/ph" for PH, etc. */
  function toRegionalPath(path: string, targetRegionPath: string): string {
    const bare = stripRegion(path)
    if (targetRegionPath === '/') return bare
    return bare === '/' ? targetRegionPath : `${targetRegionPath}${bare}`
  }

  /** True if the current path has a concrete equivalent page in the target region. */
  function hasEquivalent(currentPath: string, targetRegionPath: string): boolean {
    const target = toRegionalPath(currentPath, targetRegionPath)
    return routeExists(target)
  }

  return { routeExists, stripRegion, toRegionalPath, hasEquivalent }
}
