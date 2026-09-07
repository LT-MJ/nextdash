# Security

## Authentication

Credentials provider (email + bcrypt-hashed password), JWT session
strategy. Passwords are hashed with `bcryptjs` (cost factor 10) — never
stored or logged in plaintext. `middleware.ts` gates every `/admin/*`
route at the Edge (session-cookie check only, no DB access needed there);
every Server Component page under `admin/(dashboard)/**` *also* calls
`requirePermission()`/`requireAuth()` independently, and every API route
re-checks permissions again — defense in depth, not just relying on the
middleware redirect.

## Authorization

See [permissions.md](./permissions.md). Every mutation checks a specific
permission string server-side; the client never decides what it's allowed
to do beyond hiding UI it can't use anyway.

## Input validation

Every API route validates its request body with Zod before touching the
database — `seoMetadataInputSchema`, `redirectInputSchema`, and the
blog/commerce equivalents. Client-side form validation exists for UX but is
never trusted as the sole check.

## Commerce-specific integrity

- **Prices, inventory, and coupon math are always recomputed server-side**
  at checkout — the client-submitted cart is only ever a list of
  `{productId, variantId?, quantity}`; price and stock come from the
  database at the moment of order creation, inside a transaction that also
  re-validates stock to avoid a race between two concurrent checkouts.
- **Order status transitions** go through an explicit state machine
  (`src/lib/ecommerce/order-state-machine.ts`) that the API route enforces
  server-side — a client can't jump an order from `PENDING` straight to
  `DELIVERED`.
- No payment gateway is configured in this environment (no Stripe keys,
  etc.). Checkout is an honest manual/invoice-style flow — no card data is
  collected or "charged". See
  [scope-and-limitations.md](./scope-and-limitations.md) for where a real
  provider would plug in.

## JSON-LD / structured data

`src/components/seo/JsonLd.tsx` escapes `<`, `>`, `&`, and Unicode
line/paragraph separators before serializing to a `<script
type="application/ld+json">` tag — this prevents both script-tag breakout
and a subtle V8 JSON-in-HTML parsing issue, even when the JSON includes an
admin-supplied "custom schema" field.

## Secrets

`AUTH_SECRET`, `INDEXNOW_KEY` (semi-secret — it's also served publicly at
`/{key}.txt` by design, that's how IndexNow verification works),
`CRON_SECRET`, and any future Google API credentials are read from
`process.env` server-side only. None of them are passed to a Client
Component or exposed via a public API response. `.env` is gitignored;
`.env.example` documents every variable without real values.

## Known gaps (be aware of these before a real production deployment)

- **No distributed rate limiting.** There's no Redis/Upstash configured in
  this environment, so login attempts and API routes aren't rate-limited.
  Add one (e.g. `@upstash/ratelimit` if you provision Upstash Redis) in
  front of `/api/auth/callback/credentials` and any public-facing mutation
  route (checkout, coupon validation) before a real launch.
- **No CSRF token beyond `SameSite=Lax` cookies.** This is the standard,
  generally-accepted mitigation for same-origin JSON APIs in a Next.js app
  (a cross-site request can't attach the session cookie), but it's not the
  same as an explicit per-form CSRF token. If you add a non-JSON mutation
  endpoint (e.g. one that accepts `multipart/form-data` from a plain HTML
  form), reconsider this.
- **SSRF surface**: nothing in this build fetches an admin-supplied URL
  server-side except the IndexNow submission (a fixed, hardcoded
  endpoint — `api.indexnow.org` — not a user-controlled URL), so there's no
  current SSRF exposure. If a future "check broken links" background job
  fetches arbitrary URLs found in content, validate/allowlist schemes and
  reject internal/private IP ranges before doing so.
