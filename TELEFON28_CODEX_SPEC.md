# TELEFON28MOBILE — MASTER CODEX IMPLEMENTATION SPECIFICATION

## Role and outcome
You are continuing an EXISTING, already deployed Telefon28Mobile e-commerce demo. Act as senior Next.js/full-stack engineer, UX designer, database architect, security engineer, QA engineer, and deployment engineer. Build a genuinely working, attractive, low-maintenance shop management system based on this existing codebase.

**Execution instruction:** Inspect the local repository and current production site first. Implement the actual changes and tests, not merely a plan. Work autonomously as far as permissions allow. Ask for authorization only for account sign-ins, applying potentially destructive database migrations, or modifying the live production environment. Never report a feature as working unless you tested it.

## 0. Hard constraints and scope
- Local project location: the EXISTING Windows Desktop folder `telefon28mobile`. Resolve Desktop with PowerShell or Windows APIs because OneDrive redirection is possible. Do not create another app or nested project.
- Existing production URL: `https://telefon28mobile-website.vercel.app/` (public localized routes include `/az`, `/ru`, `/en`).
- Reuse the EXISTING Git remote/repository and Vercel project. Discover their exact names/URLs from the checked-out repository and Vercel CLI. **Never** create a second project/repo or touch OK Mobile, iStoreBaku or NOVA.
- Preserve existing beautiful dark-first design, rich but smooth animations, mobile/tablet/desktop responsiveness, three languages (AZ default, RU, EN), both dark/light themes, catalog URLs, search, filters, wishlist, and cart. Improve design polish without a visual redesign.
- This is a tightly scoped, low-budget project (approximately 200–300 AZN development fee). Prioritize a complete product-management workflow, correct WhatsApp checkout, basic analytics, trade-in, branches and SEO. Avoid needless payment, complex CRM, buyer accounts, multi-warehouse inventory, or expensive integrations.
- Do NOT implement automated fetching, scraping or downloading from Tap.az; no authorized integration has been confirmed. Provide optional CSV/XLSX import of *store-provided original product data* instead. Do not copy marketplace image assets without authorization.
- No online card payment. Buyers need no account. No fake checkout success.
- Never commit secrets, passwords, personal customer data or real environment files. Do not buy anything or upgrade plans.
- Make an initial backup commit or branch `feature/admin-catalog` before touching the existing production code. Do not overwrite unrelated changes. If working tree is dirty, inspect and preserve them.

## 1. Source-of-truth business details
- Public brand name: **Telefon28Mobile** (use appropriate brand display `Telefon 28 Mobile` where design warrants).
- Official business-provided logo: `brand-assets/logo yeni.pdf` included alongside this brief. Reuse it with the owner's authorization. Inspect/convert it into optimized web-safe SVG or transparent PNG/WebP if conversion is safe and reliable; preserve typography and artwork, and prepare legible dark/light theme versions. Do NOT replace it with invented branding. Avoid huge hero-sized logo; use crisp proportional placement.
- Shared WhatsApp order number (international digits): `+994 55 600 20 01` / `994556002001` for wa.me URLs.
- Three owner-provided addresses (DO NOT change or conflate):
  1. `Azadlıq prospekti, 39D, Bakı`
  2. `Dilarə Əliyeva küçəsi, 21, Bakı`
  3. `Azadlıq prospekti, 39E, Bakı`
- **One exact Google Maps link supplied by the owner:** `https://maps.app.goo.gl/FHLKC7UydaLqFPM99` (resolves to a Google Maps place titled `Telefon 28 Mobile`). Add a responsive map/contact section and a prominent `Xəritədə bax / Показать на карте / View on map` button using this exact URL. If official embed data is accessible, embed one map for this place; otherwise show a thoughtful location preview/card plus external link. Do NOT claim the single map pin separately marks all three branches. If individual branch pins cannot be verified, show address cards without fabricated coordinates or links.
- No separate branch phone numbers, hours or precise coordinates have been confirmed. Do not invent them. Use shared WhatsApp contact and leave admin-editable optional fields for each branch.
- Existing deployed demo: `https://telefon28mobile-website.vercel.app/en`.
- Supabase project already created, name `telefon28mobile-website`, project ref `bpsmcmmdtxteeswaumse`, region London, initial database empty.
- Supabase URL: `https://bpsmcmmdtxteeswaumse.supabase.co`.
- Supabase **publishable** key (not secret): `sb_publishable_tAIO6n5qMN1mxB_TBbod5A_WTVAHTxe`.
- Supabase Auth settings already configured: new self-signups OFF, anonymous sign-ins OFF, email confirmation ON. No users yet.
- Supabase Auth URL Configuration: Site URL `https://telefon28mobile-website.vercel.app`, redirect `http://localhost:3000/**` already added. Add an EXACT production callback URL once you actually implement its route (e.g. `https://telefon28mobile-website.vercel.app/auth/callback`). Never use a broad wildcard production redirect.
- Treat product descriptions, pricing and stock as unverified until uploaded or entered by the owner. Seed only a SMALL number of clearly marked sample products or owner-supplied real products. Do not claim placeholder catalog is real inventory.

## 2. Start by auditing, planning and preserving the current work
1. Verify Desktop/telefon28mobile exists and inspect framework version, routing, i18n, themes, product types, cart, WhatsApp function, deployment and Git status.
2. Run the current project locally, inspect existing UI and production site, identify tests, run baseline build.
3. Create a safe development branch and backup. Document changes needed, but proceed with implementation without waiting for unnecessary confirmation.
4. Prefer incremental modifications. Do not recreate the Next.js app or swap frameworks.
5. Keep compatibility with currently installed versions. Verify current official docs for Supabase SSR/Next.js integration, server auth, RLS and deployment.

## 3. Supabase connection and migrations
1. Install compatible `@supabase/supabase-js` and `@supabase/ssr` if needed; set up browser/server clients using cookie-based SSR and the current Next.js proxy/middleware convention for the project version. Verify auth token claims on the server. Do not trust a client-only login check or `getSession()` as sole server authorization.
2. Create `.env.example` listing required variable names; create `.env.local` locally from the public Supabase values provided, and ensure it is gitignored. Set identical public variables in the EXISTING Vercel project through authorized CLI/dashboard access. Never expose secret/service-role keys in client code, logs, READMEs, or git.
3. Use repeatable, reviewed SQL migrations stored in `supabase/migrations`. No manual ad-hoc production schema drift. If CLI access/auth is missing, provide the exact migration file and clear instructions to run it in Supabase SQL Editor. Do not pretend it ran.
4. Minimum database model:
   - `categories` (slug, multilingual labels, sort, active)
   - `brands` (name, slug)
   - `products` (id/UUID, slug, category_id, brand_id, name, optional localized descriptions, base price in AZN, specifications JSON, condition when verified, status published/draft/archived, created_at/updated_at, manual data origin)
   - `product_images` (product_id, storage path, alt text, sort_order)
   - `product_variants` where existing product UX actually supports it (storage, color, variant price) or simplify safely
   - `store_locations` (name, address, optional branch phone, hours, map URL when verified, sort/order)
   - `trade_in_requests` (submitted timestamp, name, phone, phone model, storage, condition, defect notes, optional media path, status, consent timestamp)
   - `admin_users`/`admin_memberships` mapped securely to `auth.users.id`
   - privacy-respecting analytics aggregates such as `daily_site_stats`, `daily_product_views`, `daily_whatsapp_clicks`, or a safer low-cost alternative
   - `site_settings` for shared WhatsApp number and public contact content
   - optional import job logs for CSV/XLSX admin imports.
5. Use strong foreign keys, appropriate indexes, uniqueness for slugs, nonnegative price constraints, created/updated timestamps and soft-delete/archiving to avoid accidental loss.
6. All exposed tables must have RLS *and appropriate grants*. Only published, non-sensitive product/category/location data should be publicly readable. Only assigned admins can write. Trade-in contact data and analytics/admin membership must never be publicly readable. Storage upload/write must require verified admin roles.
7. For role bootstrap, build safe instructions and an owner-managed flow: first create/invite an admin using `Authentication > Users` *after callback routes are live*, then explicitly grant that user's UUID admin privileges via a reviewed manual SQL script or secure owner-only procedure. Never implement public first-user-becomes-admin or hardcoded admin account.
8. Test RLS using unauthenticated, ordinary authenticated (if applicable), and authorized admin scenarios. Test non-admin write rejection directly from browser SDK.

## 4. Secure administration UI
Create a polished responsive `/admin` area, with Azerbaijani as the default language, which can be extended to Russian/English if efficient. Routes may be independent of public locale prefixes but must not interfere with i18n.
- `/admin/login`: working Supabase Auth login and error handling; protected session; logout; password reset where email service/callback is configured.
- `/admin`: overview KPIs (real data only), today's/week's activity, drafts/published products, trade-in requests, last product edits.
- `/admin/products`: searchable sortable table with image, brand, category, AZN price, status, edit/archive actions; convenient on mobile.
- Create/edit: name/model, category, brand, description AZ/RU/EN where supplied, price, specs/variants, multiple images, visibility/published state, slug generated safely, preview, save with validation.
- `/admin/categories`, `/admin/locations`, `/admin/settings`, `/admin/trade-in`, `/admin/analytics` or equivalent organized tabs.
- Provide bulk CSV/XLSX import + downloadable template with headers and clear validation preview; use admin-supplied originals only; match by unique SKU/slug, make safe upserts, prevent duplicates; show import errors. Support image upload separately if spreadsheet references local filenames. Never fetch Tap.az wholesale.
- Admin editing must update public product pages without a new Git push. Use sensible cache invalidation/revalidation.
- UI must work well from mobile devices, with loading/error/success feedback; protect every Server Action/route handler, not just page navigation.
- Avoid deleting owner data on import. Confirm bulk destructive operations.
- Logo and public branch info may be managed in site settings as appropriate.

## 5. Supabase Storage / brand assets
- Configure bucket(s) for public product images (readable publicly, writable only by authenticated admins) and separate PRIVATE files for trade-in attachments if implemented.
- Restrict uploads to appropriate MIME types, max sizes and sane quantity per product; optimize and provide responsive WebP/AVIF where feasible. Keep sort ordering and alt texts.
- Never make photos submitted in trade-in requests public. Use owner-only access / signed URLs and retention policy; if secure uploads add excessive risk, make photo attachment an explicitly deferred enhancement and keep form functional without attachments.
- Ensure no broken image paths, secure placeholder images and good fallbacks.

## 6. Public storefront — preserve and connect existing design
- Keep all existing routes, 3 languages (AZ/RU/EN), light/dark themes, typography, hero, motion details, responsive breakpoints and accessibility.
- Replace hardcoded demo product read paths with real Supabase database queries for actual owner-added inventory; on an empty database, show an elegant honest empty/sample state instead of pretending stock is real.
- Catalog with category navigation and automatic category placement of manually added goods, price/brand filters, sorting, search, pagination; direct deep links and localized product pages.
- Maintain source-of-truth for price, variants and published visibility. Preserve shareable URLs and SEO.
- Add reasonable category mappings for smartphones, tablets, laptops, watches, headphones, accessories, consoles, home appliances and other; allow admin corrections.
- Do not regress cart, wishlist or animations. Respect reduced-motion settings and performance on common phones.

## 7. WhatsApp cart / order inquiry
- Retain current cart workflow: add multiple products, quantity changes, remove, show total AZN.
- Final CTA opens WhatsApp for `994556002001` with a polished prefilled multilingual order inquiry containing product name, variant, quantity, unit price, total and product page links. In AZ, example greeting `Salam, Telefon28Mobile! Saytdan aşağıdakı məhsullarla maraqlanıram:`.
- Before creating the link, re-fetch current authoritative prices and visibility; notify customer of changes/unavailable items instead of showing stale totals. Don't accept fake price from client browser as authoritative.
- Track a `whatsapp_click` event when customer follows the CTA, distinguishing it from a message actually sent, an order confirmed or a sale. Never display the click as an actual completed sale.
- WhatsApp launch should work mobile and desktop, with correct UTF-8 URL encoding.

## 8. Trade-in request form — working, privacy-respecting
- Public responsive Trade-in page and CTA in menu/hero/services.
- Inputs: name, contact number, device brand/model, storage, device condition, issues, optional comments, consent checkbox; attach photos only if private storage and secure limits are implemented.
- Localize AZ/RU/EN. Validate all inputs client- AND server-side using Zod or equivalent.
- Submit securely to Supabase (only create request through protected rate-limited backend endpoint), show success only after database writes succeed; errors and retry paths.
- Admin can see requests, filter by status, and change status (new/contacted/closed). No fake price estimate. No PII displayed to public.
- Implement anti-spam (honeypot, rate limits or appropriate verification). Document privacy notice and retention approach; mark final privacy policy for owner/legal approval.

## 9. One map and 3 addresses
- Add tasteful `Mağazalarımız / Наши магазины / Our stores` page or section with THREE provided branch address cards, clearly distinct:
  `Azadlıq prospekti, 39D, Bakı`
  `Dilarə Əliyeva küçəsi, 21, Bakı`
  `Azadlıq prospekti, 39E, Bakı`.
- Include ONE Google Maps panel/button with owner's EXACT link `https://maps.app.goo.gl/FHLKC7UydaLqFPM99`; it points to `Telefon 28 Mobile`. Do not pretend this one Google Maps location corresponds to every branch.
- If an iframe embed of that exact place can be obtained with permitted means and works without extra paid API requirements, show one responsive accessible embed with an external open-map button. Otherwise show a nice map preview and external link; no broken iframe.
- Add shared WhatsApp CTA, admin-editable per-branch contact/hours but no fabricated phone numbers, business hours or individual map coordinates.

## 10. Analytics/dashboard — ACTUAL data only
Goal: recreate the look/utility of the provided dark sample dashboard, but with real measured metrics and clear labels.
- Cards: site visits/sessions (label accurately), product detail views, WhatsApp link clicks, Trade-in submissions. Do NOT show registrations because the project does not require customer accounts.
- Graphs/table: top 5–10 products by view count, daily/weekly views and WhatsApp clicks, date-range selector, product trends if reasonable.
- The previous sample metrics such as 12,840 / 28,450 / 385 were ILLUSTRATIVE ONLY. Never seed them or claim they are factual. Show zero/empty states before data arrives.
- For a low-cost MVP, prefer a simple privacy-conscious solution: aggregate anonymous daily counters with minimal event collection, rate limiting, dedupe or sensible sampling, no raw IP retention, and no personally identifying analytics. Optionally integrate Google Analytics 4 if authorized and configured, but do not display its numbers unless fetched reliably. Avoid invasive fingerprinting.
- WhatsApp events are CTA CLICKS, not message sends, confirmed orders or sales.
- Explain metrics and limitations inside admin tooltips/docs. Preserve data privacy and obtain consent when legally required.

## 11. SEO and discoverability
- For AZ/RU/EN pages implement appropriate localized title, description, canonical, hreflang language alternates, Open Graph, robots, sitemap, accessible breadcrumbs and descriptive URLs.
- Product structured data only using actually verified product data (valid product name/price where genuine); do not output fake stock, reviews, ratings, warranties or discounts.
- LocalBusiness structured data with 3 owner-supplied addresses where supportable; don't fabricate telephone per branch, hours, coordinates or misleading map associations.
- Help connect Google Search Console, but domain or DNS verification requires owner approval/access; provide human steps. Do NOT promise guaranteed Google rankings.
- Use the actual logo and optimize image alt text, speed and mobile UX.
- Ensure private admin, login, trade-in admin screens are excluded from indexation.

## 12. UI and visual quality
- Keep the strong existing Telefon28Mobile design intact, with cinematic premium dark theme, tasteful light alternative and polished responsive behavior.
- Integrate owner logo faithfully in navigation, footer, favicon where appropriate; use a contrasting treatment for dark/light backgrounds.
- For new pages, match the same component style, animated hover/reveal patterns and typography; don't overanimate data entry forms or reduce usability.
- Test widths: 320, 375, 390, 768, 1024, 1440+; no horizontal overflow or keyboard traps.
- Internationalization must be comprehensive for public pages, cart, trade-in, map/address labels and errors. Prefer accurate AZ, RU, EN phrasing.

## 13. Test plan, quality gates, and security
- Provide automated checks where feasible: TS typecheck, lint, production build, integration/smoke tests, basic Playwright browser flows at mobile+desktop.
- Verify unauthorized user cannot load admin data or mutate any rows/storage; public can only view published products.
- Test first-admin invitation/callback and admin login/logout; CSV import/preview/duplicate suppression; create/edit/archive products; images upload; product pages; search/filter; cart and WhatsApp links; Trade-in actual persisted request; analytics event count; three branches and one map link; localization x theme combinations.
- Verify direct URLs refresh correctly on Vercel, no broken images, no console errors, no secrets in Git, no unprotected public PII.
- Protect backend endpoints against abuse with input validation, anti-spam/rate limiting and appropriate cache control; no server-side auth based solely on user-controlled role flags.
- Do not claim tests passed if test frameworks/credentials are missing; provide exact blockers and next steps.

## 14. GitHub, Supabase and Vercel deployment
- After local implementation and verification, commit changes to existing Git repo on safe feature branch, then merge/push to `main` for the same repo *only with authorization for production changes*.
- Prefer CI and preview deployments before final production rollout.
- Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and any legitimate other vars in EXISTING Vercel project's dashboard/CLI. Never store server secrets in `NEXT_PUBLIC_*` variables or git.
- If Supabase CLI authorization is available, inspect planned migrations and apply reviewed ones to this specific project (`bpsmcmmdtxteeswaumse`), checking RLS and bucket policies. Ask for consent before destructive/production migrations. Otherwise provide copy/paste SQL and a clear setup guide; do not claim the DB is live when it's not.
- For Auth callback URL: implement and verify first, then add the exact production redirect URL to Supabase Auth settings. Site URL already points to live root. Keep localhost `http://localhost:3000/**` for development.
- Do not set up a production admin account with default credentials. Provide setup instructions so the owner/developer can invite real administrator and grant explicit admin role securely after Auth is ready.
- Update EXISTING Vercel deployment only once all gates pass. Verify routes `/az`, `/ru`, `/en`, actual product, admin login, Trade-in and map link on live HTTPS site.
- Important licensing/cost condition: Vercel Hobby is intended for noncommercial projects; do not represent a commercial launch on Hobby as compliant. Confirm Vercel account plan and recommend an allowed commercial host/plan before taking payments or switching from demo to business site. Do not purchase or upgrade without approval. Supabase Free also has usage limits/sleep behavior; document operational requirements.
- Open the final live site in Google Chrome using Windows tools if supported. If not supported, output exact verified HTTPS URL.

## 15. Delivery docs
Create or update:
- `README.md`: tech stack, setup, features, development/build/test, deploy, current limitations.
- `DATABASE_SETUP.md`: Supabase link, migrations, policies, storage buckets, environment variables (NO secret values).
- `ADMIN_GUIDE_AZ.md`: clear AZ-language admin instructions for owner: logging in, adding items, photos, prices, availability, locations, trade-in requests and analytics.
- `IMPORT_GUIDE.md`: sample CSV/XLSX template, bulk import behavior, image mapping and how to avoid duplicates.
- `DEPLOYMENT_CHECKLIST.md`: safe staged rollout, exact Supabase Auth URLs, environment vars, Vercel hosting constraints.
- `.env.example`: variable names, non-secret placeholders; ensure `.env.local` is ignored.
- `IMPLEMENTATION_REPORT.md`: exactly what is real and tested vs demo / blocked by permissions, schema status, production status.

## 16. Exact final report to me
Report clearly:
1. Local project path and GitHub repo URL + commit hash.
2. What was implemented, tested and what needs owner action.
3. Supabase database/migrations/RLS/storage/auth status; never claim working if unconfigured.
4. Admin login URL and steps for secure first admin invitation/role assignment; DO NOT expose credentials.
5. How the owner adds a product and uploads images.
6. WhatsApp cart and Trade-in flow test status.
7. Actual analytics events implemented and limitations.
8. Correct three branch addresses and owner's one Google Maps link in the UI.
9. AZ/RU/EN and light/dark testing status; mobile tests.
10. SEO and Google Search Console pending manual verification.
11. Vercel preview/production URL, plan/commercial-use status and Chrome launch status.
12. Exact remaining blockers, such as owner admin email, migration authorization, SMTP, hosting plan or missing original product data.

**Finish as much as possible in this Codex session. The existing storefront must remain intact. No new GitHub/Vercel project, no unauthorized Tap.az scraping, no fake analytics, no fake admin access, and no unstated commercial costs.**
