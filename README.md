# Telefon 28 Mobile

A trilingual electronics shopping demo for a retailer on Azadlıq Avenue in Baku. The default storefront opens in Azerbaijani and dark mode.

## Run locally

Use Node.js 22.23 or a compatible newer LTS release and npm. From the project root:

```sh
npm ci
npm run dev
```

Open http://localhost:3000/az. For a production preview, run `npm run build` followed by `npm start`. The shopping demo works without secret keys. Set the optional canonical origin in `.env.example` when deploying outside Vercel.

## Shopping experience

- Switch between Azerbaijani, Russian and English while preserving the route and catalog filters. The root URL remembers the last language.
- Browse six illustrated categories, featured products and brands. Search, filter, sort, paginate or open a quick view from the catalog.
- Inspect seller-attributed prices, known product attributes, alternative configurations, related products and enlarged original illustrations.
- Save favorites, change cart quantities and prepare a pickup or delivery request. Checkout validates the form in the browser and opens WhatsApp with the selected configurations and total. The customer reviews and sends the message in WhatsApp.
- Explore store information, services, contact, FAQ, promotions and owner-review legal pages.
- Explore read-only administration and account prototypes. No password collection, real orders, stock editing, payment processing or customer database is enabled.

## Architecture

Next.js App Router and React use strict TypeScript. Tailwind CSS and theme variables style both themes. Motion for React handles entrance, viewport and counter transitions. Radix Dialog provides focus trapping and keyboard dismissal, with a locally adapted shadcn/ui Badge and button variants. Lucide supplies functional icons. Zod validates inquiry fields.

| Location | Responsibility |
| --- | --- |
| `app/[locale]` | Server-rendered routes, metadata, loading and error boundaries |
| `components` | Store shell, hero, catalog, product gallery, cart, forms and prototypes |
| `data/products.ts` | Typed catalog snapshots with source URLs and UTC review time |
| `lib/i18n.ts` and `i18n/request.ts` | Interface messages and next-intl request configuration |
| `lib/store.ts` | Zustand cart and favorites, persisted in this browser |
| `lib/art.ts` and `public/art` | Original artwork and model-to-illustration mapping |
| `tests` | Browser and route checks |

Locale prefixes determine interface language. The header stores language preference in a cookie. next-themes applies the selected theme before hydration and persists that choice locally. Product model and finish names retain their advertised spelling.

## Product evidence

The dataset contains 60 configurations from 49 model names across 11 brands. Prices are seller-advertised snapshots in AZN. Most sources are seller catalog pages. Two sources are individual listings with explicit condition information. See [RESEARCH.md](RESEARCH.md) for the sources, contact verification and limitations. The demo uses original illustrations, including family-level representations where exact product photography is unavailable.

## Run checks

```sh
npm run lint
npm run typecheck
npm run build
npm test
```

Playwright uses installed Google Chrome and starts the local production server on port 3028. Set `TEST_ORIGIN` to check an existing deployment. The suite covers 320, 375, 390, 768, 1024, 1440 and 1920 pixel widths, localized navigation, themes, filter persistence, quick view, favorites, cart quantities and inquiry validation.

## Deployment

The Vercel project uses the Next.js framework preset and the repository root. Import the GitHub repository into Vercel, select `main` for production and use the default build settings. Vercel's production project URL supplies the SEO origin unless `NEXT_PUBLIC_SITE_URL` overrides it. Git and Vercel credentials stay outside the source tree.

## Commercial launch work

Obtain owner approval for public branding, licensed photographs, legal copy, service terms, stock and prices. Connect a maintained catalog feed. For accounts, addresses, order history and writable administration, add a secure backend with server-side roles, authorization, auditing and persistence. Confirm fulfillment rules and integrate payments only after selecting an appropriate provider. Monitor real-user performance once production traffic is available.
