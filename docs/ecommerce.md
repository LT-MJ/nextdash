# E-commerce

## Admin

- `/admin/ecommerce` — dashboard: revenue, orders, AOV, product/customer
  counts, low-stock/out-of-stock items, order-status breakdown, recent
  orders, top-selling products — all server-aggregated.
- `/admin/ecommerce/products` (+ `/new`, `/[id]`) — tabbed editor: General
  (name/slug/description/SKU/brand/category/price/images/specifications),
  Variants (SKU/price/options per variant, each gets its own
  `InventoryItem`), Inventory (stock adjustment via a transactional
  `adjustInventory()` that never lets stock go negative), SEO (embeds
  `<SeoEditorPanel entityType="product" .../>`).
- `/admin/ecommerce/categories`, `/collections` (manual product picker +
  an automatic rule builder resolved by
  `src/lib/ecommerce/collections.ts::getAutomaticCollectionProducts`),
  `/inventory` (cross-catalog view), `/orders` (+ `/[id]`, status control
  gated by the order state machine), `/customers`, `/coupons`, `/reviews`
  (moderation), `/analytics` (date-range revenue/orders/AOV with a
  Recharts chart).

## Order state machine

`src/lib/ecommerce/order-state-machine.ts` defines the only valid
transitions: `PENDING → PAID | CANCELLED`, `PAID → PROCESSING | REFUNDED`,
`PROCESSING → SHIPPED`, `SHIPPED → DELIVERED`. The API route re-validates
every transition server-side — the client only ever sees the valid next
statuses computed by `getValidNextStatuses()`. Marking an order `PAID`
updates the customer's denormalized `totalSpent`/`ordersCount`
transactionally; cancelling a `PENDING` order restores the inventory it had
reserved.

## Checkout pipeline (`POST /api/shop/checkout`)

1. Re-fetch every line item's current price and stock from the database —
   **never** trust a client-submitted price.
2. Re-validate any coupon code server-side (`validateCoupon()`:
   active/date-range/usage-limit/per-customer-limit/min-purchase/product-
   or-category-restrictions).
3. Compute authoritative totals (`computeOrderTotals()` —
   `FLAT_SHIPPING_RATE=$5.99` with `FREE_SHIPPING_THRESHOLD=$75`, and a
   documented `TAX_RATE=0` placeholder in `src/lib/ecommerce/pricing.ts`).
4. Inside one Prisma `$transaction`: re-check stock (closing the race
   between two concurrent checkouts), upsert the `Customer`, create the
   `Order`+`OrderItem`s, write `InventoryAdjustment` rows and decrement
   `InventoryItem.stock`, increment `Coupon.usedCount`.
5. Redirect to `/shop/order/[orderNumber]/confirmation`.

**No payment gateway is configured in this environment** (no Stripe keys,
etc.) — per the project's ground rules against fabricating fake
integrations, checkout does not collect or "charge" a card. Orders are
created `status: PENDING`, `paymentStatus: UNPAID`; an admin uses the order
detail page's status control to mark one `PAID` once payment is confirmed
out of band. **To wire up a real provider**: create a payment intent in
`src/app/api/shop/checkout/route.ts` before the order-creation transaction,
and handle the provider's webhook by calling the same order-transition
logic in `src/lib/ecommerce/order-transitions.ts` that the admin UI uses.

## Known simplifications

- **Shipping/tax** are flat-rate placeholders (see above), not a real
  carrier-rate or tax-jurisdiction integration.
- **Money fields are `Float`**, not `Decimal` — see
  [database.md](./database.md#money-fields-are-float-not-decimal). All
  arithmetic goes through `round2()` in `src/lib/ecommerce/money.ts`, but
  this is still the wrong representation for production money math.
- **Customer lifetime-value fields** (`totalSpent`, `ordersCount`) are
  updated transactionally on order-paid/refunded transitions rather than
  recomputed live on every page view — documented in
  `order-transitions.ts` and the customer detail page.
- **No public review-submission form** — reviews are created via the admin
  (or seed data) only; the moderation queue (`PENDING`/`APPROVED`/
  `REJECTED`/`SPAM`) is fully functional, there's just no public "leave a
  review" UI yet.
- **Product `aggregateRating`** in the Product JSON-LD is only emitted when
  there's at least one real `APPROVED` review — never fabricated.
