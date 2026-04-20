# Navitag Storefront API — Frontend Integration Guide

**Audience:** developers building the customer-facing e-commerce storefronts (e.g. `navitag.com`, `navitag.net`). For the internal admin UI at `shopadmin.navitag.com`, see `shopadmin API docs.md`.

**Backend URL:** `https://shopapi.navitag.com`
**Medusa version:** v2.13.1
**Auth provider:** Firebase (project: `track-navitag-com`)
**Guest checkout:** **disabled** — every cart is created by a signed-in Firebase user.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Authentication flow](#2-authentication-flow)
3. [Cart contract (required)](#3-cart-contract-required)
4. [Request format](#4-request-format)
5. [Token refresh strategy](#5-token-refresh-strategy)
6. [Endpoint reference](#6-endpoint-reference)
7. [Error handling](#7-error-handling)
8. [Example implementations (Vue 3 / Nuxt 3)](#8-example-implementations-vue-3--nuxt-3)
9. [Known gaps / SSO caveats](#9-known-gaps--sso-caveats)

---

## 1. Prerequisites

- **Firebase Client SDK** initialised with project `track-navitag-com`.
- **Publishable API key** — required in the `x-publishable-api-key` header on every `/store/*` request. Current key: `pk_acd1689997df608660c9753f37ae30f24a0b503e7de1bacba7e12e3acaf7216d`.

### Headers on every `/store/*` request

```
Content-Type: application/json
x-publishable-api-key: <publishable-api-key>
Authorization: Bearer <medusa-jwt>       # after login
```

### Endpoints that do NOT require the publishable key

| Endpoint | Purpose |
|----------|---------|
| `POST /auth/customer/firebase` | Firebase authentication (returns Medusa JWT) |
| `GET /health` | Health check |

---

## 2. Authentication flow

### The single login endpoint

There is **one** endpoint. The old `POST /store/auth/firebase` has been removed (any code still calling it returns 404).

```http
POST /auth/customer/firebase
Content-Type: application/json

{ "id_token": "<Firebase ID token from getIdToken()>" }
```

| Status | Body | Meaning |
|--------|------|---------|
| `200` | `{ "token": "<Medusa JWT>" }` | Success — customer found or created, auth identity linked, 24 h JWT issued |
| `400` | `{ "message": "id_token is required in the request body" }` | Missing body field |
| `401` | `{ "message": "<reason>" }` | Firebase token invalid, expired, or verification failed |

### Two-token handshake

```
Firebase ID Token  ──►  POST /auth/customer/firebase  ──►  Medusa JWT
(1 h lifespan)          (exchange, not stored)             (24 h lifespan)
```

- **Firebase ID token** — used *once* per login to obtain a Medusa JWT. Refreshed by the Firebase SDK every hour.
- **Medusa JWT** — sent as `Authorization: Bearer <jwt>` on every authenticated `/store/*` call. Valid 24 h.

> **Do not** send the Firebase token in the `Authorization` header. Medusa will try to decode it as a Medusa JWT and reject with 401.

### What the backend does on login (you don't have to do any of this)

1. Verifies the Firebase ID token.
2. Finds or creates the Medusa customer using this match order — **email is never used** as a key:
   1. `medusa_shop_id` Firebase custom claim (cross-checked against `firebase_uid`)
   2. `customer.metadata.firebase_uid` (JSONB lookup, indexed)
   3. `authIdentity.app_metadata.customer_id`
   4. Creates a new customer (email from Firebase, or `firebase-<uid>@placeholder.local` if none)
3. Seeds `customer.metadata.digital_cart` and `customer.metadata.physical_cart` if missing.
4. Syncs `firebase_uid`, `firebase_email`, `firebase_name`, `last_firebase_sync` into `customer.metadata`.
5. Writes `medusa_shop_id: <customer.id>` back to Firebase custom claims (accelerates step 2.1 next time).
6. Signs a 24-hour Medusa JWT with `actor_id = customer.id`.

### Logout

```javascript
import { signOut } from "firebase/auth"

await signOut(auth)
localStorage.removeItem("medusa_jwt")
```

---

## 3. Cart contract (required)

Because guest checkout is off, **every cart belongs to the signed-in Firebase user**. The storefront must uphold two invariants or orders may land unlinked to their customer.

### Invariant A — cart is tied to the customer

Every cart you create must carry both:
- `customer_id` set to the Medusa customer id
- `email` set to the customer's email (Firebase email or the customer's canonical email)

### Invariant B — every cart carries `firebase_uid` in metadata

Every cart you create or update must include:

```json
{ "metadata": { "firebase_uid": "<Firebase uid>" } }
```

**Why it matters:** when `completeCart` runs, Medusa automatically copies `cart.metadata` into `order.metadata`. If a cart ever slips through without `customer_id` (bug, race, malformed client), the backend's `order-placed-backfill` subscriber uses `order.metadata.firebase_uid` to repair the customer link. Without this metadata, the safety net cannot fire.

### Using the seeded carts

On every successful login, the backend ensures two carts exist and are referenced in the customer record:

```jsonc
// customer.metadata after login
{
  "firebase_uid":    "abc123",
  "firebase_email":  "user@example.com",
  "firebase_name":   "Jane Doe",
  "digital_cart":    "cart_01H...",      // pre-created, customer-linked
  "physical_cart":   "cart_01H...",      // pre-created, customer-linked
  "last_firebase_sync": "2026-04-20T..."
}
```

Recommended pattern:

1. After login, `GET /store/customers/me` and read `metadata.digital_cart` / `metadata.physical_cart`.
2. Route the user's "digital" purchases (SIM top-ups) into the digital cart, "physical" items into the physical cart.
3. A cart can only contain one type — the backend rejects mixed carts at completion.

If you ever create your own cart via `POST /store/carts`, you **must** supply `customer_id`, `email`, and `metadata.firebase_uid`. Missing any of these means the order may land unlinked.

---

## 4. Request format

### Base URL

```
https://shopapi.navitag.com
```

### Authenticated store request

```javascript
const res = await fetch("https://shopapi.navitag.com/store/customers/me", {
  headers: {
    "x-publishable-api-key": PUBLISHABLE_API_KEY,
    "Authorization": `Bearer ${medusaJwt}`,
  },
})
```

### Unauthenticated store request (browsing products)

```javascript
const res = await fetch("https://shopapi.navitag.com/store/products", {
  headers: { "x-publishable-api-key": PUBLISHABLE_API_KEY },
})
```

### Auth request (login)

```javascript
const res = await fetch("https://shopapi.navitag.com/auth/customer/firebase", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ id_token: firebaseIdToken }),
})
```

### CORS

The backend accepts requests from `https://navitag.com`, `https://navitag.net`, any `*.navitag.com` / `*.navitag.net` subdomain, and `http://localhost:3000` for local development.

---

## 5. Token refresh strategy

### Token lifespans

| Token | Lifespan | Issued by |
|-------|----------|-----------|
| Firebase ID token | 1 hour | Firebase Client SDK (auto-refreshes while the user is signed in) |
| Medusa JWT | 24 hours | Medusa backend (via `/auth/customer/firebase`) |

### Refresh flow

When the Medusa JWT expires, re-authenticate with a fresh Firebase ID token. There is no separate Medusa refresh endpoint.

```
401 from /store/*
        │
        ▼
Is Firebase user still signed in?
     │               │
    YES             NO
     │               │
     ▼               ▼
getIdToken(true)   redirect
     │             to login
     ▼
POST /auth/customer/firebase
     │
     ▼
New Medusa JWT → retry original request
```

### Fetch interceptor

```javascript
import { auth } from "./firebase-config"

const MEDUSA_URL = "https://shopapi.navitag.com"
const PUBLISHABLE_API_KEY = "<your-publishable-api-key>"

async function refreshMedusaToken() {
  const firebaseUser = auth.currentUser
  if (!firebaseUser) throw new Error("No Firebase session")

  const freshIdToken = await firebaseUser.getIdToken(true)
  const res = await fetch(`${MEDUSA_URL}/auth/customer/firebase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: freshIdToken }),
  })
  if (!res.ok) throw new Error("Failed to refresh Medusa token")
  const { token } = await res.json()
  localStorage.setItem("medusa_jwt", token)
  return token
}

export async function medusaFetch(path, options = {}) {
  const token = localStorage.getItem("medusa_jwt")
  const headers = {
    "Content-Type": "application/json",
    "x-publishable-api-key": PUBLISHABLE_API_KEY,
    ...(options.headers || {}),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  let res = await fetch(`${MEDUSA_URL}${path}`, { ...options, headers })
  if (res.status === 401 && auth.currentUser) {
    const newToken = await refreshMedusaToken()
    headers["Authorization"] = `Bearer ${newToken}`
    res = await fetch(`${MEDUSA_URL}${path}`, { ...options, headers })
  }
  return res
}
```

### Axios interceptor (with request queue for concurrency)

```javascript
import axios from "axios"
import { auth } from "./firebase-config"

const medusaClient = axios.create({
  baseURL: "https://shopapi.navitag.com",
  headers: { "x-publishable-api-key": PUBLISHABLE_API_KEY },
})

medusaClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("medusa_jwt")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  failedQueue = []
}

medusaClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    const firebaseUser = auth.currentUser
    if (!firebaseUser) {
      localStorage.removeItem("medusa_jwt")
      window.location.href = "/login"
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return medusaClient(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const freshIdToken = await firebaseUser.getIdToken(true)
      const { data } = await axios.post(
        "https://shopapi.navitag.com/auth/customer/firebase",
        { id_token: freshIdToken },
        { headers: { "Content-Type": "application/json" } }
      )
      localStorage.setItem("medusa_jwt", data.token)
      processQueue(null, data.token)
      originalRequest.headers.Authorization = `Bearer ${data.token}`
      return medusaClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      localStorage.removeItem("medusa_jwt")
      window.location.href = "/login"
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default medusaClient
```

---

## 6. Endpoint reference

### Authentication

| Method | Endpoint | Auth required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/customer/firebase` | None | Exchange Firebase ID token for a Medusa JWT. Creates customer on first login, seeds digital+physical carts, writes Firebase custom claim. |

> `POST /store/auth/firebase` has been **removed**. Update any client code still calling it.

### Customer

| Method | Endpoint | Auth required | Description |
|--------|----------|---------------|-------------|
| GET | `/store/customers/me` | JWT + publishable key | Get the current customer (includes `metadata.digital_cart`, `metadata.physical_cart`) |
| POST | `/store/customers/me` | JWT + publishable key | Update customer profile |

### Products

| Method | Endpoint | Auth required | Description |
|--------|----------|---------------|-------------|
| GET | `/store/products` | Publishable key | List products |
| GET | `/store/products/:id` | Publishable key | Get product details |

### Cart

| Method | Endpoint | Auth required | Description |
|--------|----------|---------------|-------------|
| POST | `/store/carts` | JWT + publishable key | Create a cart — **must** include `customer_id`, `email`, `metadata.firebase_uid` |
| GET | `/store/carts/:id` | Publishable key | Get a cart |
| POST | `/store/carts/:id` | JWT + publishable key | Update a cart (address, metadata, etc.) |
| POST | `/store/carts/:id/line-items` | JWT + publishable key | Add an item |
| POST | `/store/carts/:id/complete` | JWT + publishable key | Complete the cart → creates an order |

### Payment (PayPal)

| Method | Endpoint | Auth required | Description |
|--------|----------|---------------|-------------|
| POST | `/store/paypal/client-token` | JWT + publishable key | Returns a PayPal client token for frontend checkout integration |

### Other store endpoints

Medusa v2 exposes a full Store API. See the [Medusa Store API Reference](https://docs.medusajs.com/api/store). All `/store/*` endpoints require `x-publishable-api-key`.

---

## 7. Error handling

### Common responses

| Status | Type | Meaning |
|--------|------|---------|
| 400 | `invalid_data` | Missing or invalid request body/params |
| 401 | `unauthorized` | Missing, expired, or invalid Medusa JWT / Firebase token |
| 403 | `not_allowed` | Missing `x-publishable-api-key` header |
| 404 | `not_found` | Resource not found |
| 409 | `conflict` | Resource already exists / idempotency violation |
| 500 | `unknown_error` | Server error |

### Auth-specific errors

| Message | Cause | Resolution |
|---------|-------|------------|
| `id_token is required in the request body` | Missing `id_token` field | Send `{ "id_token": "..." }` |
| `Decoding Firebase ID token failed...` | Malformed Firebase token | Call `getIdToken(true)` and retry |
| `Firebase ID token has expired...` | Firebase token older than 1 h | Call `getIdToken(true)` to force refresh |
| `Publishable API key required...` | Missing header on `/store/*` | Add `x-publishable-api-key` |

---

## 8. Example implementations (Vue 3 / Nuxt 3)

### Composable: `useAuth`

```typescript
// composables/useAuth.ts
import { ref, onMounted, onUnmounted } from "vue"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { auth } from "~/lib/firebase"

const MEDUSA_URL = "https://shopapi.navitag.com"

const user = ref<User | null>(null)
const medusaToken = ref<string | null>(null)
const loading = ref(true)

async function exchangeToken(firebaseUser: User): Promise<string> {
  const idToken = await firebaseUser.getIdToken()
  const res = await $fetch<{ token: string }>(
    `${MEDUSA_URL}/auth/customer/firebase`,
    { method: "POST", body: { id_token: idToken } }
  )
  medusaToken.value = res.token
  if (import.meta.client) localStorage.setItem("medusa_jwt", res.token)
  return res.token
}

export function useAuth() {
  let unsubscribe: (() => void) | null = null

  onMounted(() => {
    medusaToken.value = localStorage.getItem("medusa_jwt")
    unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        user.value = firebaseUser
        if (!medusaToken.value) await exchangeToken(firebaseUser)
      } else {
        user.value = null
        medusaToken.value = null
        localStorage.removeItem("medusa_jwt")
      }
      loading.value = false
    })
  })

  onUnmounted(() => unsubscribe?.())

  return {
    user,
    medusaToken,
    loading,
    login: async (email: string, password: string) => {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      await exchangeToken(cred.user)
    },
    register: async (email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await exchangeToken(cred.user)
    },
    logout: async () => {
      await signOut(auth)
      localStorage.removeItem("medusa_jwt")
      medusaToken.value = null
      user.value = null
    },
  }
}
```

### Composable: `useMedusa` (with silent refresh)

```typescript
// composables/useMedusa.ts
import { auth } from "~/lib/firebase"

const MEDUSA_URL = "https://shopapi.navitag.com"
const PUBLISHABLE_API_KEY = "<your-publishable-api-key>"

let isRefreshing = false
let refreshPromise: Promise<string> | null = null

async function refreshMedusaToken(): Promise<string> {
  const firebaseUser = auth.currentUser
  if (!firebaseUser) throw new Error("No Firebase session")
  const freshIdToken = await firebaseUser.getIdToken(true)
  const res = await $fetch<{ token: string }>(
    `${MEDUSA_URL}/auth/customer/firebase`,
    { method: "POST", body: { id_token: freshIdToken } }
  )
  localStorage.setItem("medusa_jwt", res.token)
  return res.token
}

export function useMedusa() {
  async function medusaFetch<T = any>(
    path: string,
    options: Parameters<typeof $fetch>[1] = {}
  ): Promise<T> {
    const token = localStorage.getItem("medusa_jwt")
    const headers: Record<string, string> = {
      "x-publishable-api-key": PUBLISHABLE_API_KEY,
      ...(options.headers as Record<string, string>),
    }
    if (token) headers["Authorization"] = `Bearer ${token}`

    try {
      return await $fetch<T>(`${MEDUSA_URL}${path}`, { ...options, headers })
    } catch (error: any) {
      if (error.response?.status !== 401 || !auth.currentUser) throw error
      if (!isRefreshing) {
        isRefreshing = true
        refreshPromise = refreshMedusaToken().finally(() => {
          isRefreshing = false
          refreshPromise = null
        })
      }
      const newToken = await refreshPromise!
      headers["Authorization"] = `Bearer ${newToken}`
      return await $fetch<T>(`${MEDUSA_URL}${path}`, { ...options, headers })
    }
  }

  return { medusaFetch }
}
```

### Stamping the firebase_uid on a cart

```typescript
// Called once after login, or any time a cart is created client-side
import { auth } from "~/lib/firebase"
import { useMedusa } from "~/composables/useMedusa"

async function stampCartMetadata(cartId: string) {
  const user = auth.currentUser
  if (!user) return
  const { medusaFetch } = useMedusa()
  await medusaFetch(`/store/carts/${cartId}`, {
    method: "POST",
    body: { metadata: { firebase_uid: user.uid } },
  })
}
```

### Nuxt 3: server-side token handling (HTTP-only cookie)

```typescript
// server/api/auth/firebase.post.ts
export default defineEventHandler(async (event) => {
  const { id_token } = await readBody(event)
  const data = await $fetch<{ token: string }>(
    "https://shopapi.navitag.com/auth/customer/firebase",
    { method: "POST", body: { id_token } }
  )
  setCookie(event, "medusa_jwt", data.token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 86400,
  })
  return { success: true }
})
```

```typescript
// server/api/medusa/[...path].ts — transparent proxy
export default defineEventHandler(async (event) => {
  const path = event.context.params?.path || ""
  const medusaJwt = getCookie(event, "medusa_jwt")
  const headers: Record<string, string> = {
    "x-publishable-api-key": process.env.MEDUSA_PUBLISHABLE_KEY || "",
  }
  if (medusaJwt) headers["Authorization"] = `Bearer ${medusaJwt}`

  const body = ["POST", "PUT", "PATCH"].includes(event.method)
    ? await readBody(event)
    : undefined

  return await $fetch(`https://shopapi.navitag.com/store/${path}`, {
    method: event.method,
    headers,
    body,
    query: getQuery(event),
  })
})
```

---

## 9. Known gaps / SSO caveats

- **Apple "Hide My Email"** returns a rotating relay address (`*@privaterelay.appleid.com`). The backend stores the real/relay email as `customer.metadata.firebase_email` but uses a placeholder on `customer.email` when the relay rotates. If you need a reliable contact email, prompt the user at checkout — do not rely on Firebase `email`.
- **Apple `name`** is returned on the *first* login only. The backend currently overwrites metadata unconditionally on every login, which means a later login with no name can null out a previously captured one. Storefronts should capture name at registration and persist it client-side until this is fixed on the backend.
- **Account linking across providers** (same human signs in via Google once, Facebook later) is not automatic — they'll get two Medusa customers. If you want to merge, run Firebase's `linkWithCredential` on the client and re-login; the backend will pick up the unified uid.
- **Firebase custom claims** (`medusa_shop_id`) are cached in the ID token for up to 1 hour. After the backend sets the claim, the client must call `getIdToken(true)` or wait for the next rotation to see it. Not a correctness issue (the workflow falls through to UID lookup), but relevant if you try to read the claim client-side.

---

## 10. Quick reference

| Thing | Value |
|-------|-------|
| Login endpoint | `POST https://shopapi.navitag.com/auth/customer/firebase` |
| Login body | `{ "id_token": string }` |
| Login response | `{ "token": string }` (Medusa JWT, 24 h) |
| Publishable key header | `x-publishable-api-key: pk_acd1689997df608660c9753f37ae30f24a0b503e7de1bacba7e12e3acaf7216d` |
| Auth header (all `/store/*`) | `Authorization: Bearer <Medusa JWT>` |
| Firebase token TTL | 1 h (SDK auto-refreshes) |
| Medusa JWT TTL | 24 h |
| Cart contract | `customer_id`, `email`, `metadata.firebase_uid` on every cart |
| Digital vs physical | Use `customer.metadata.digital_cart` / `physical_cart` — never mix item types |
