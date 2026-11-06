# Telefon28Mobile

Trilingual Next.js App Router storefront and Azerbaijani administration for Telefon28Mobile in Baku. The owner manages the catalog through Supabase. Publishing a product takes effect on the next request. Buyers can browse, save favorites and prepare a WhatsApp inquiry without an account.

## Development

Use Node 22 and npm. Run `npm ci`, copy `.env.example` to your ignored local environment file and fill in the settings described in [DATABASE_SETUP.md](DATABASE_SETUP.md). Use `npm run dev` and visit /az, /ru, /en or /admin/login. Set NEXT_PUBLIC_SITE_URL to the actual origin when testing share links and password recovery. Keep deployment and database credentials outside Git.

## Features and implementation

- The existing dark-first, light-switchable storefront retains its hero, motion effects, localized URLs, catalog filters, search, quick view, cart and wishlist. The owner-supplied vector logo is used in navigation and the footer.
- Published products, active categories, branches, settings and gallery images are read with the publishable key under PostgreSQL RLS. Old marketplace snapshots are historical research. No sample inventory is seeded. The storefront distinguishes an empty catalog from a connection failure.
- Catalog variants use a separate stable slug per priced configuration. Public product images are decoded, resized and re-encoded as WebP. Only upload images approved for public distribution, even when the product is a draft.
- Authenticated admin routes verify Supabase claims and a server-managed membership. Privileged store edits use the administrator's session under RLS. The server-only ingest client calls restricted database functions for throttled trade-ins and aggregate metrics.
- WhatsApp checkout re-reads published configurations and prices. If an item changes, the shopper reviews the refreshed basket. The URL carries unit and extended prices, quantities, links and the total. The customer sends the actual message in WhatsApp.
- Trade-in submissions require consent. No customer photo upload, buyer password, payment or order-confirmation database is involved. Request contacts are visible only to assigned administrators.
- Session estimates are per browser tab and expire after 30 minutes of inactivity. Product views are deduplicated for one minute in that tab. WhatsApp order-button clicks and successful trade-ins are separate events. Aggregates use Baku dates. Browser blockers, opt-outs and abuse limits affect totals. Service/contact WhatsApp links are outside the order-click metric.
- Branches and owner-provided map appear on /az/stores and localized contact pages. The map is a single external place link.

## Structure

App Router pages and handlers are in `app`; storefront and admin interfaces in `components`; typed catalog data, server clients, validation and import code in `lib`. Messages live in `lib/i18n.ts`. Zustand handles browser-only preferences for shopping. next-intl, next-themes, Motion, Radix, Tailwind, Zod, ExcelJS and Papa Parse support the UI. Database schema and policies are versioned under `supabase/migrations`.

## Quality checks

Run `npm run lint`, `npm run typecheck` and `npm run build`. For full integration coverage, run Docker and the Supabase CLI in this folder:

```powershell
npx supabase start
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-local.ps1
```

The test helper uses only the local loopback stack. It passes temporary credentials in process memory, builds against that environment, starts the app on port 3028 and runs Chrome tests. Never run fixture setup against hosted data. Rebuild with the desired environment before serving or deploying. For public smoke tests set TEST_ORIGIN to the authorized preview and run the storefront suite.

## Operations

[Database and first-admin setup](DATABASE_SETUP.md) · [Owner guide in Azerbaijani](ADMIN_GUIDE_AZ.md) · [Spreadsheet import](IMPORT_GUIDE.md) · [Release checklist](DEPLOYMENT_CHECKLIST.md) · [Implementation report](IMPLEMENTATION_REPORT.md).

The owner should review open trade-ins regularly and remove closed requests after the approved retention period. No automatic deletion schedule has been authorized. Confirm SMTP delivery, privacy terms, backups, domain verification and an eligible commercial hosting plan before business launch. Supabase Free quotas and pausing can affect availability.
