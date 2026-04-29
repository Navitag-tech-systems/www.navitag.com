# Frontend Integration — Invite Landing Page

**URL pattern:** `https://navitag.com/invite/view/{token}` (where `token` is a string starting with `nvit_`).

This page is the destination of the invite link sent in the share-invite email. Its job is to:
1. Show the recipient what the invite is for (granter name, device count, expiry).
2. Force them through Firebase sign-in or sign-up.
3. After auth, call the claim endpoint to convert the invite into a permanent share grant on their account.

The page should work for both first-time visitors (no Navitag account yet) and returning users.

---

## The 4 page states

The page progresses through these states. Each has clear inputs, what to render, and what to do next.

### State 1 — Loading metadata

The page mounts. Read the `token` from the URL path. Call `GET /v1/share/invite/{token}` (no auth required).

**Why no auth:** the recipient may not have signed in yet — they need to see what the invite is before deciding to create an account. The endpoint returns display-safe metadata only; never any device locations or personal data of the granter.

While the request is in flight: spinner / skeleton.

### State 2 — Invite preview

`GET /v1/share/invite/{token}` returned **200**. Render the preview using the response body:

```json
{
  "status":       "success",
  "granter_name": "James Ong",
  "device_count": 2,
  "scopes":       ["position:live", "history:read"],
  "expires_at":   "2026-04-30T15:22:00+00:00"
}
```

**Suggested layout:**

> **{granter_name}** wants to share **{device_count}** Navitag tracker{s} with you.
>
> You'll be able to see live position{s if scopes includes history:read: " and trip history"}.
>
> Expires {format expires_at as "in 6 days" or "April 30 at 3:22 PM"}.
>
> [ Sign in to accept ]   [ Create a free account ]

**Scope copy** (translate technical scope strings to user-facing phrases):
| Scope value | Display as |
|---|---|
| `position:live` | "Live location" (always present — this is the floor scope, never absent) |
| `history:read` | "Trip history" |
| `notification:read` | "Tracker alerts" |

`granter_name` will be `"A Navitag user"` if the granter hasn't set a display name. Render it as-is.

### State 3 — Authenticate

User taps "Sign in" or "Create account". Run your existing Firebase auth flow.

**Important:** preserve the `token` across the auth flow so you can claim after the user returns. Two safe ways:
- Keep the token in the URL the whole time (`/invite/view/{token}` stays in the address bar; auth happens in a modal/overlay).
- Stash the token in `sessionStorage` before navigating to the auth route, and restore it after.

Don't put the token in `localStorage` — if a different user signs in on the same device later, they shouldn't inherit a stale invite intent.

### State 4 — Claim

After successful Firebase sign-in/sign-up, call `POST /v1/share/claim` with the user's Firebase ID token in the `Authorization: Bearer <id_token>` header:

```json
POST /v1/share/claim
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{ "token": "nvit_..." }
```

**On 200:**

```json
{
  "status":          "success",
  "granted_devices": ["860123456789012"],
  "already_shared":  ["353456789012345"],
  "scopes":          ["position:live", "history:read"],
  "broker_synced":   true
}
```

Show a success screen, then redirect into the main app's "Shared with me" view. The new grants are immediately visible via `GET /share/tome`.

**`already_shared` handling (silent):** if non-empty, optionally show an info notice ("X tracker was already shared with you and was skipped"). This is not an error — the invite is still considered successfully claimed.

**Whole-invite no-op:** if `granted_devices` is `[]` and `already_shared` has entries, the user already had access to every device on the invite. Show a friendly "You already have access to these trackers" message. Do not show an error.

---

## Error states

These error responses can come back from either endpoint. All are non-recoverable — show a clear terminal-state UI, do not auto-retry.

### From `GET /v1/share/invite/{token}` (state 1)

| Status | Body | What it means | UI |
|---|---|---|---|
| `404` | `{"error": "invite not found"}` | Token doesn't exist, or invite was already claimed, or it expired. The endpoint deliberately uses a single 404 for all three to avoid leaking which case applies. | "This invite is no longer valid. Ask the sender for a new one." Don't try to be more specific. |

### From `POST /v1/share/claim` (state 4)

| Status | Body | What it means | UI |
|---|---|---|---|
| `400` | `{"error": "cannot claim your own invite"}` | The signed-in user is the same person who sent the invite. Likely they clicked their own preview link to test. | "You can't accept your own invite." |
| `401` | `{"error": "..."}` | Auth failed — token expired, malformed, or missing. | Re-trigger the Firebase sign-in flow. |
| `404` | `{"error": "invite not found"}` | Same as above. | Same. |
| `409` | `{"error": "invite already claimed"}` | Someone (possibly the same user in another tab) already claimed it. | "This invite has already been used." |
| `409` | `{"error": "granter no longer owns the invited devices", "devices": [...]}` | The sender lost ownership of every device on the invite (e.g., they sold the tracker after sending). The invite is left to expire naturally. | "The sender no longer owns these trackers. Ask them for a new invite if they still want to share." |
| `410` | `{"error": "invite expired"}` | Past the 7-day TTL. | "This invite has expired (invites are valid for 7 days). Ask the sender for a new one." |
| `502` | `{"error": "Broker error", ...}` | Posbroker rejected the permission patch. Backend issue, not user-visible cause. | "Something went wrong. Please try again in a moment." Allow ONE retry button. |

---

## What this page does NOT do

- **No live position preview.** There is no anonymous map view. The recipient must sign in/up before any device data is shown. This is a deliberate product rule — don't build a "preview the trackers without an account" UX, the backend does not expose a token for it.
- **No granter contact info.** The metadata endpoint never returns the granter's email or uid. If the user wants to verify the sender, that's an out-of-band conversation.
- **No "decline" or "report" affordance for v1.** The recipient can simply close the tab. Invites expire after 7 days regardless.

---

## Sequence diagram (happy path, new user)

```
Recipient clicks email link
        │
        ▼
GET /invite/view/nvit_abc...        ← page loads
        │
        ▼
GET /v1/share/invite/nvit_abc...    ← no auth, fetches metadata
        │
        ▼
[Render preview — "James Ong wants to share 2 trackers"]
        │
        ▼ (recipient taps "Create account")
[Firebase sign-up flow]
        │
        ▼ (success — Firebase returns ID token)
POST /v1/share/claim
  Authorization: Bearer <id_token>
  body: { "token": "nvit_abc..." }
        │
        ▼
[Show success → redirect to "Shared with me"]
```

---

## Quick reference

| Need | Endpoint | Auth |
|---|---|---|
| Show what the invite is for | `GET /v1/share/invite/{token}` | none |
| Accept the invite | `POST /v1/share/claim` body `{token}` | Firebase Bearer |
| Show resulting shared trackers | `POST /v1/share/tome` (existing) | Firebase Bearer |

For the full backend reference (request/response schemas, all error codes, scope semantics, the broker/MySQL invariants), see `API_DOCUMENTATION.md` → "Share by invite" section.
