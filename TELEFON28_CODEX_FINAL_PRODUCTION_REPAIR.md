# Telefon28Mobile — FINAL PRODUCTION REPAIR, ADMIN UX, CATALOG AND HANDOVER

You are continuing the EXISTING Telefon28Mobile Next.js project in `C:\Users\Elvin\Desktop\telefon28mobile` in the SAME Codex project/chat. This document is the single consolidated specification. Implement the repairs, test them end-to-end and finish the release, rather than producing a plan, mockup or another partial implementation.

## 0. Immutable project context and working baseline

- Existing GitHub repository: `ElvinSalman/telefon28mobile-website`; use its EXISTING `main` branch and repository, not a new repository.
- Existing production Vercel project / canonical URL: `https://telefon28mobile-website.vercel.app`. An automatically generated preview deployment is not a substitute for canonical production.
- Existing admin entry: `https://telefon28mobile-website.vercel.app/admin/login`. The administrator was ALREADY created, has successfully logged in, and must NOT be recreated or have a password regenerated.
- Existing Supabase project: `https://bpsmcmmdtxteeswaumse.supabase.co`; use the existing database, authenticated admin membership, product data, trade-in requests, and Storage. Do not create a second Supabase project.
- Public storefront requirements: Azerbaijani, Russian and English; existing responsive premium design and animations; light and dark themes; catalog, product detail pages, cart -> seller WhatsApp; Trade-in; analytics; SEO; three store branches.
- Store's WhatsApp order number: `+994 55 600 20 01` (wa.me digits `994556002001`).
- Branches: `Azadlıq prospekti, 39D`, `Dilarə Əliyeva küçəsi, 21`, `Azadlıq prospekti, 39E` (Baku). Google Maps link provided by the owner: `https://maps.app.goo.gl/FHLKC7UydaLqFPM99`. Preserve the embedded map for the verified store location, without inventing geolocations for the other branches.
- Owner-provided logo/branding: preserve it. Use real, store-owned or otherwise authorized product photos only; never invent prices or fake product data. Do not use unauthorized Tap.az scraping or claim live synchronization.
- Current Supabase Auth does not have custom SMTP. Email invitation and recovery must not be prerequisites for the existing admin. Keep working email/password login with secure admin allowlist. Do not reveal secrets, passwords or sensitive environment variables.

IMPORTANT: The owner personally tested production and confirmed that admin login, new product creation, brand creation under `Kateqoriyalar`, and automatic slug generation when empty WORK. Keep these features working. The owner also personally reproduced multiple critical faults below. Do not dismiss those faults based on previous automated tests.

## 1. FIRST: investigate the confirmed editing failure and fix its root cause

**Confirmed reproduction on live `/admin/products`**: Open an existing product (example: Xiaomi Redmi Note product with slug `xiaomi-redmi-note-15-256-gb-black` and source reference `https://tap.az/elanlar/elektronika/telefonlar/46774272`), change only its display name (e.g. to `redmi note test`) and click `Saxla`. The UI shows **`Saxlanmadı. Məlumatları yoxlayın.`** instead of saving. An existing product's name/price/details MUST be editable and must persist on the public storefront. New product creation has worked, so this may affect the UPDATE path specifically.

Audit the real current code, including:
- `components/admin-console.tsx` (form serialisation, default values, `save()`, `router.refresh()` and selection state)
- `app/api/admin/route.ts` (`op:product` update using `.eq('id', ...).eq('slug', ...)`, Zod parse, DB error response)
- `lib/validation.ts` (especially `source_verified_at: z.iso.datetime()` accepting database-returned time zone formats)
- Supabase `products` schema, foreign keys, RLS, the database update operation, authorization, and PostgreSQL error codes.

The `source_verified_at` field is a potential problem: Supabase timestamp strings can have UTC offsets such as `+00:00`, while the current strict ISO datetime validator may reject them. INVESTIGATE this and the full request payload using a controlled authenticated test. Do not assume it is the only cause. Check whether matching on BOTH ID and slug is rejecting otherwise valid updates and whether update attempts return zero rows or a DB error.

Fix the actual issue, not just the error message. Separate read-only/source-audit fields from user-editable fields. Preserve a stable product ID when editing; do not accidentally change the public slug whenever the name changes. Ensure legitimate edits to any existing seeded product work. Respect existing RLS: never disable security or solve it with an unrestricted service-role key in the browser.

**Mandatory tests** (on isolated disposable test product and a safe existing seeded product with no unrelated data loss): change name only, price only, brand, category, color/storage, descriptions, status and featured flag; save; reload admin; reload public product page; confirm correct values. Test repeat saves and unchanged records. Verify correct count of affected rows and fail if update matches none. Test invalid data and unauthenticated callers. Document the ACTUAL root cause and fix.

## 2. Make error handling genuinely useful

Current admin request handler returns empty `400`/`422` bodies for many different failures; the client maps most to a generic `Saxlanmadı. Məlumatları yoxlayın.`. Replace this with a stable safe JSON error contract, e.g. `{code, message, fieldErrors?, requestId?}`, and proper HTTP statuses, without exposing secrets, raw SQL, PII or stack traces.

- Show field-level Azerbaijani validation messages and a clear top-level alert.
- Distinguish invalid slug/source URL, invalid price, duplicate record, unknown brand/category, authorization/session expiration, storage errors, migration/schema conflicts, concurrency and network failure.
- Preserve all unsaved form content after an error; no fake success and no silent failures.
- Log sanitized server details with a correlation ID for diagnosis.
- Reproduce and test all error states. Do not mistake a failed backend request for a successful save merely because a toast was shown.

## 3. Redesign the admin panel for a non-technical store owner

Keep all existing functions, database relationships, authorization and public storefront. Improve the EXISTING `/admin` experience, not a new system. Make it polished, consistent with Telefon28Mobile branding, accessible and mobile-first, including dark/light modes if present. Azerbaijani admin copy must be natural, correct, readable and consistent.

Navigation: `İcmal`, `Məhsullar`, `Kateqoriyalar / Brendlər`, `Filiallar`, `Trade-in`, `Analitika`, `İdxal`, `Ayarlar`.

Product table/list: real product image, name, brand, price in AZN, category, published/draft/archived state, updated time and obvious actions (`Redaktə et`, `Arxivlə`, etc.). Search, filter by status/category/brand, pagination, responsive cards on mobile, optional quick price edit, explicit save feedback. Avoid full-page forms with enormous unstructured gaps. Prevent accidental deletion; prefer archive/unpublish for products.

Product form should be one understandable flow with grouped sections:
- Product name/model, price in AZN, searchable category and brand, storage, color, condition
- Description (AZ/RU/EN with reasonable fallback; do not invent translated product facts)
- Optional simple specifications as key/value rows (NOT raw JSON in normal view)
- Product photos selected BEFORE saving
- `Ana səhifədə seçilmiş məhsullar arasında göstər` as a properly aligned, explained featured toggle
- `Qaralama`, `Dərc et`, `Arxivlə` with clear consequences
- Source link, technical slug and audit metadata under optional Advanced settings. Slug auto-generated from name for new items, normalized and uniqueness checked. Existing product slug is stable on name edits; handle explicit slug change only by deliberate safe process with redirects if implemented.

Keep existing manual brand creation in `Kateqoriyalar` AND add searchable brand combobox with `+ Yeni brend` directly in product creation/editing. Accept arbitrary brand names, normalize case/whitespace, reuse existing case-insensitively, avoid duplicate brand rows, and create correctly linked brands when needed.

## 4. One-step product creation WITH photos, and reliable photo management

**Confirmed usability fault**: in production, product photos can be uploaded only AFTER the product is initially created and reopened for editing. Change this. Owner must be able to choose multiple JPG/PNG/WebP images before pressing the initial save/publish button, preview them, remove/reorder before upload, choose the main image, enter alt text optionally, and complete the full operation in one UI flow.

A secure internal two-phase sequence (create draft -> upload images -> publish) is acceptable but MUST feel like one process to the user. Never mark complete until all required operations succeed; if partial failure occurs, show which images failed and allow retry without losing other content or leaving misleading public state. Honor appropriate file count/size limits (currently max 8 photos; 4 MB each) and server-side image validation/re-encoding.

**Confirmed photo confusion**: In existing edit view, clicking `Fotonu sil` deletes a photo, but the nearby big `Saxla` button belongs to a different file-upload form with `required` file input. If user then presses `Saxla`, browser displays `Please select one or more files.` The layout makes it look as though deletion itself failed.

Fix UX so that deleting a photo needs NO separate file-upload save operation. Put a distinct, well-labeled `Foto əlavə et` button beside file selection, and independent immediate `Fotonu sil`, `Əvəz et`, `Əsas şəkil et` actions. Do not place an irrelevant required file input in the same save path as photo deletion. Show actual deletion result and update the thumbnail/gallery immediately, accurately reflected in Supabase Storage and `product_images` DB table. Correctly delete old Storage objects only after DB success; avoid orphan objects, broken references, misordered images and accidental loss. Test first/last/only photo, multi-photo reordering, replacement, deletion and retry after failure, including public product gallery and main image.

## 5. COMPLETELY simplify Excel/CSV import (HIGH PRIORITY)

**User's explicit requirement**: the normal Excel template must have SIX simple Azerbaijani columns ONLY:

1. `Məhsulun adı` — product name (required)
2. `Qiymət (AZN)` — price (required)
3. `Brend` — free-form brand name (required)
4. `Yaddaş` — storage (optional)
5. `Rəng` — color (optional)
6. `Təsvir` — optional product description

No `slug`, `brand_id`, `category_id`, `status`, IDs or other technical fields in the SIMPLE template. Downloadable `.xlsx` and UTF-8 `.csv` must both use these six labels and include a separate clear instructions/example sheet (for XLSX) or documentation. Examples must be clearly flagged as fictional and not imported as real store data.

Behavior:
- Validate price with AZN cents, blank cells, duplicates, Unicode/Azerbaijani characters, malformed files, row limits and errors with EXACT row and field number.
- Match existing brand names case-insensitively, normalize spelling/case/whitespace; if brand does not exist, automatically create it ON CONFIRMATION, with valid slug, uniqueness and safe FK relations. Preview which new brands will be created.
- Generate product slug automatically and safely (include model/storage/color if needed); do not require manual slug. Do not create duplicates on reimport or on price changes. For ambiguous matches (identical names/variants), ask admin to choose rather than overwrite arbitrary products. Optional advanced SKU/unique external ID may be supported on a separate advanced template; preserve stable IDs/slugs.
- Infer category from model/brand using robust maintainable rules, e.g., iPhone/Galaxy S -> smartphones; iPad -> tablets; MacBook -> laptops; Watch -> watches; AirPods -> headphones; PlayStation -> gaming; Dyson dryer -> home appliances. Show category and confidence in preview. Unknown/ambiguous category requires user confirmation BEFORE import; no silent wrong assignment.
- Default all newly imported products to **published/active** automatically, as explicitly requested. Clearly warn about rows without photos and use an honest non-misleading placeholder on the public storefront until actual photos are added. No GitHub redeploy needed for new products.
- Import simple description as `description.az`; display a truthful fallback on RU/EN if untranslated; do not invent translation or factual specs.
- Show a clean editable preview: new vs update, resolved brand, new brand, predicted category, derived slug, price, missing photos, validation errors, duplicate warnings. Let admin correct values before confirmation.
- Confirmation should atomically or safely upsert brands + products, with retry/idempotency and no partial misleading success. Preserve existing images, descriptions and unrelated fields when omitted/blank; never delete products omitted from spreadsheet. Avoid mass overwrites caused by fuzzy name matching.
- Show import progress, success/error counts and actionable per-row problems. Support 1–200 rows per file unless a better tested limit is implemented; large files should fail gracefully.
- After import, provide `Şəkilləri əlavə et` for the imported product set. Optional additional feature: ZIP of product images matched by verified SKU or explicit mapping/preview; do not silently match uncertain files or fetch remote images.
- IMPORTANT: Current `lib/importer.ts` insists on technical `slug`, `brand_id`, `category_id`, `status` columns and current admin import requires brands/categories to preexist. Replace BOTH frontend and backend assumptions; update `public/import-template.csv`, generated XLSX, validation, upsert handling, docs and real tests.

Mandatory tests: existing brand, entirely new brand, reimport same file, update only price, new color/storage variant, accented characters, empty description, missing photo, ambiguous category, duplicate rows, invalid price, unknown brand, multi-row import, authorization and rollback semantics. Confirm inserted/updated products appear immediately on public `/az`, `/ru`, `/en` catalog without redeployment. Do not insert fictional inventory in production; use temporary QA rows and remove only your QA rows afterwards.

## 6. Trade-in dashboard totals vs actual requests

**Confirmed production discrepancy**: overview showed `Trade-in müraciətləri = 3`, but the `/admin/trade-in` page showed only two visible requests. Existing dashboard sums `daily_stats` event `trade_in`, while management list reads `trade_in_requests`. Investigate whether deleted QA/test records, date filters, status filters or time zones account for the difference.

Show a prominently labeled count of ACTUAL stored requests for the selected 1/7/30/90-day period, consistent with the management list for the same period and filters. If preserving historical submission events as separate statistics, label them explicitly; do NOT call those events current open requests. Fix statistics for Baku timezone and accurate date ranges. Avoid counting deleted disposable QA records as real customer inquiries. Never erase real customer submissions or historical analytics without explicit approval.

Trade-in admin should also have clear Azerbaijani status labels (`Yeni`, `Əlaqə saxlanılıb`, `Bağlı`), translate condition (`good` => `Yaxşı`, etc.), legible phone/name/model/storage/notes, visible creation date, practical status change feedback, empty states and filters. Verify status changes after refresh. Respect PII access control; avoid showing test customers as real leads.

## 7. Analytics and dashboard usability

Preserve real tracking for page views, approximate browser sessions, product views and WhatsApp button clicks. Clearly distinguish clicks from messages actually SENT, and from sales. Never fabricate metrics. Ensure selected date period applies consistently, counters do not conflate page views with unique visitors, and QA events do not skew business metrics. Make overview useful and attractive on mobile, with top viewed products, useful links and appropriate empty states.

## 8. Preserve and polish public website

Do not redesign the public store from scratch. Preserve existing three-language routing (AZ/RU/EN), dark/light themes, responsive behavior, animations, logo, navigation, product pages, checkout-to-WhatsApp, Trade-in form, storefront SEO, Google Maps, and three correct addresses. Check brand/category images for duplicates and inappropriate camera placeholders; show distinct, realistic and authorized imagery rather than fabricated store photos.

Keep branch cards labeled with full addresses (not isolated big house numbers). Maintain clear spacing between Maps and WhatsApp CTAs and retain the verified map embed/link. Ensure long model names, prices, galleries, filters, search and category cards render correctly from desktop to small mobile widths. Product details/price edits must appear after saving without a GitHub push or Vercel redeploy.

Source data: inspect existing ~10 product records/source references, but DO NOT claim a listing is current or invent real product prices or product photos. If approved assets are absent, clearly label missing assets and request owner-provided materials. Do not scrape Tap.az or copy protected content without appropriate permission.

## 9. Security, privacy, and data integrity

Preserve existing confirmed Supabase admin Auth, membership allowlist, secure server-only access, RLS, Storage policies, secrets and sessions. Do not reset, replace, expose, or email the existing administrator password. No unauthenticated writes to products, brands, photos, categories or Trade-in submissions. Validate request origins, file type/size, numeric prices, lengths, statuses and all admin mutations server-side. Prevent CSV formula injection in exported files if applicable. Handle potential auth expiry, duplicate slug/brand, storage race conditions and import concurrency.

Before migrations/backfill, inspect linked production DB and current migrations and make a NON-DESTRUCTIVE backup/export or a tested rollback strategy. Ask permission before migrations that alter live schema or destroy customer data. Never use real buyer details in QA logs or screenshots. Only create disposable QA records with distinctive prefixes and delete ONLY those after verification, without altering legitimate records. Keep `.env.local`, service role/secret keys and locally encrypted credentials out of Git and final chat logs.

## 10. Test plan — not optional, do not declare success until verified

Create automated unit/integration/browser tests with representative accepted and rejected operations; avoid merely testing mocked UI. Verify live or approved staging Supabase-backed workflows after deployment, with protected test account and disposable data. Cover at minimum:

- Existing product: change name; save; refresh; name persists; existing stable slug/details preserved.
- Existing product: change price, description, brand, category and status separately; verify admin and public views.
- New product: enter name, create NEW brand in form, choose category, add 2+ real authorized QA images BEFORE saving, reorder, choose primary and publish; confirm public visibility.
- Photo edit: remove photo without file chooser validation; replace photo and verify Storage and public gallery; confirm deleted files aren't referenced.
- Spreadsheet six-column XLSX and CSV, unknown brand auto-create, inferred category review, auto slug, default published, duplicate-safe reimport and price update, correct preservation of existing images/descriptions.
- Trade-in: create QA request, confirm list and count across ranges, update status and delete only created QA data using authorized method; recheck totals.
- WhatsApp cart message contains correct title, quantities, CURRENT prices and recipient number. No claim of received message unless external confirmation is available.
- Analytics, admin login/logout, password change without custom SMTP, role restriction, RLS, unauthorized API 403, malformed inputs.
- AZ/RU/EN, light/dark, keyboard/accessibility basics, iPhone-sized mobile + tablet + desktop widths; no overlapping CTAs or oversized image forms.
- `npm run lint`, TypeScript checking (`npx tsc --noEmit` or configured script), automated tests and production build all pass.

For each required test report PASS/FAIL with evidence, test action and observed result. If any critical test fails, FIX it and rerun; do not claim the release completed. Do not conceal blockers or replace real tests with an assertion.

## 11. Safe GitHub and Vercel release

1. Inspect `git status`, recent commits and existing production deployment. Preserve all work in the current directory, including uncommitted files and previously deployed changes. Make a safe branch/checkpoint if useful.
2. Do not replace the existing repo, Supabase project or Vercel project. Do not force-push `main` or overwrite newer changes.
3. Implement targeted changes, check and commit source/migrations/documentation/tests, and push to the existing GitHub repository using the authorized account.
4. Deploy ONLY tested changes to `telefon28mobile-website.vercel.app` via the existing Vercel project. Check that live deployment SHA matches committed code; do not confuse a preview with canonical production.
5. Verify the production admin panel, especially the previously failing Xiaomi product name edit, Excel brand automation, upload/delete photos and trade-in counts.
6. Do not purchase a hosting plan, custom domain, SMTP or other paid service. Flag that Vercel Hobby plan must be checked for permitted commercial use; hosting decisions belong to the owner.

## 12. Deliverable and first-owner handover — must be concrete

Give ONE final written report containing:
- Exact GitHub repository URL, commit SHA, canonical production URL, working admin login URL and deployment state.
- Actual root cause of the edit `Saxlanmadı. Məlumatları yoxlayın.` error and code-level fix (with files changed).
- Explanation of previous photo deletion/file-input issue and confirmed fixed UX.
- Excel six-column template link/download location and **simple owner instructions in Azerbaijani**: download, fill, upload, preview, auto-create brand, confirm, add photos, edit price.
- Confirmation of photo upload during initial creation, automatic slugs, inline brand creation, real edit saving, trade-in count, analytics period and all three languages/themes.
- Concrete test matrix with pass/fail and any outstanding functional or security blockers.
- Missing real product images/data/permissions and optional future enhancements clearly separated from implemented features.
- A brief, nontechnical step-by-step guide for store owner to add a device with photos and change its price.
- Do NOT post credentials, passwords, private SQL dumps, service-role keys or sensitive customer details.

**STOP CONDITIONS**: Do NOT say "done" if an existing product still cannot be edited, if photo deletion triggers an unrelated required file chooser, if the six-column Excel import cannot create unknown brands or causes duplicates, if dashboard request totals are mislabeled, if unauthorised users can write, or if the final changes are not on the canonical production URL.

**Execution preference**: Work autonomously through implementation and tests. Request user approval only for genuinely sensitive destructive actions, production-impacting migrations or expenses. If a service, access or owner-approved image is missing, state exactly what is blocked and COMPLETE other independent work. Finish the existing project, not a new demonstration.
