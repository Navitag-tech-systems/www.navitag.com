/**
 * Shapes shared between /partner-listing and its field components.
 *
 * These live here rather than in the SFCs that use them because `export` inside
 * `<script setup>` is a compiler-version-dependent affair — type-only exports
 * are tolerated by some versions of @vue/compiler-sfc and rejected by others.
 * A plain module is unambiguous and importable from both sides.
 *
 * Each shape mirrors a table written by POST /v1/partner-listing; the field
 * names here are camelCase and are mapped to the API's snake_case in the page's
 * submit handler, which is the single place that translation happens.
 */

/** One row of the weekly hours grid. `day` is ISO-8601: 1 = Monday, 7 = Sunday. */
export interface HoursRow {
  day: number
  closed: boolean
  /** "HH:MM" from <input type="time">, or '' when the day was never answered. */
  opens: string
  closes: string
}

/**
 * The store's location.
 *
 * `lat`/`lng` are null until a pin exists — which is the normal state when the
 * Google Maps key is unset and the visitor is pasting a share link we could not
 * read coordinates out of. `place_id` is cleared whenever the pin is moved by
 * hand, because the pin is then no longer that Place.
 */
export interface MapPinValue {
  link: string
  lat: number | null
  lng: number | null
  place_id: string
  formatted_address: string
}

/** A proof photo after the browser has re-encoded it (see PartnerProofUpload). */
export interface ProofImage {
  name: string
  /** data: URL. The API strips the prefix and base64-decodes. */
  data: string
  /** Encoded byte count, for the running total shown to the user. */
  size: number
}
