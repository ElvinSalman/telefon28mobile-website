# Telefon28Mobile — production repair acceptance report

Date: 10 November 2026 (Asia/Baku).

## Release and preservation

- Canonical storefront: https://telefon28mobile-website.vercel.app
- Admin login: https://telefon28mobile-website.vercel.app/admin/login
- Existing repository: https://github.com/ElvinSalman/telefon28mobile-website
- Tested runtime release: `bc98aef4c899dfdecfd033b936099030318af5fb` on existing `main`.
- Verified deployment: `dpl_GbUG6PcaRgn32kD5pTFr2CRDo3jS`, READY, production, canonical alias confirmed through Vercel API; metadata reports the exact SHA above.
- Baseline backup: `codex/backup-before-production-repair-20261109` at `39ddf3d`, preserved locally and pushed remotely.
- Existing administrator, password, memberships, production products, branches and customer requests preserved. No new GitHub, Vercel or Supabase project. No paid services purchased. No SMTP invitation or recovery email sent.

## Actual product-edit failure

Controlled authenticated production reproduction on `xiaomi-redmi-note-15-256-gb-black` showed that the database's `source_verified_at` ending `+00:00` caused the old strict `z.iso.datetime()` validator to return an empty HTTP 400. The same record with that timestamp converted to `Z` saved successfully (HTTP 204 in the old API). The ID/slug matched and RLS permitted the authorized edit.

The repair removes source verification timestamps from editable input entirely. Product updates use the stable UUID, explicitly preserve the slug, return the affected record, reject missing IDs, and optionally compare `updated_at` to detect concurrent edits. Audit metadata remains unchanged. The production browser regression changed the real Xiaomi name to `redmi note test`, reloaded the admin, checked the public page, changed price, checked its public rendering, then restored the original name and price. The original ID, slug, source audit and other fields were verified unchanged; `updated_at` necessarily records the legitimate edits.

A separate admin hydration issue was also reproduced: Node formatted the same AZ date as `09.11.2026, 23:00:00`, while Chrome produced `2026-11-09 23:00:00`. `lib/admin-date.ts` now uses explicit Baku date parts and separators in both product and Trade-in rows. The corrected local suite reports no uncaught runtime errors.

Relevant implementation: `lib/validation.ts`, `app/api/admin/route.ts`, `lib/admin-errors.ts`, `lib/admin-client.ts`, `components/admin-products.tsx`.

## Product and photo workflow

The owner editor groups product details, AZ/RU/EN descriptions, simple specification rows, photos, publishing and Advanced settings. Brand/category search, inline brand creation, automatic slugs, featured switch, filters, sorting, pagination, updated dates and responsive product cards use the existing design tokens and themes.

Photos may be selected before the initial save. The internal sequence is draft → validated/re-encoded uploads → requested status. A failed upload preserves the form and successful photos for retry; it does not falsely publish a completed product. Independent delete/replace/main-photo controls are outside the file-upload save path, and the file input is not required for a normal product save.

Image writes lock the product and compare the expected previous path. Superseded paths enter an admin-only cleanup queue after database reference changes commit. Storage failures can be retried; referenced objects are never removed by cleanup. Replacement uses a new immutable object path. Public CDN caches can temporarily serve an old URL even after object removal: acceptance therefore checks authenticated Storage listings and database references, not only the cached public URL. Public galleries use the new paths immediately.

## Simple import

Both downloadable templates contain exactly:

1. Məhsulun adı
2. Qiymət (AZN)
3. Brend
4. Yaddaş
5. Rəng
6. Təsvir

CSV: https://telefon28mobile-website.vercel.app/import-template.csv

XLSX: sign in at https://telefon28mobile-website.vercel.app/admin/import and choose **Excel şablonu ↓**. The first sheet is empty product data; the second sheet contains instructions and clearly fictional examples, which are not imported.

Preview is editable and displays new/update, new/existing brand, suggested category, slug and missing photos. Unknown categories require selection; the owner confirms the preview before changes. PostgreSQL resolves normalized brand names and imports the batch transactionally under an advisory lock. Stable import identities prevent duplicates on reimport and price changes. Existing blank descriptions are preserved; photos and unrelated records remain intact. New items are published. Missing images have a truthful localized placeholder; untranslated descriptions fall back to AZ.

## Database and security

Migration `202611090002_simple_import.sql` is applied to existing project `bpsmcmmdtxteeswaumse`; all four migration versions match local/hosted. The user authorized the migration. It adds a nullable unique import key, admin-only brand/import/image functions and a cleanup queue with RLS. Existing rows were not replaced or backfilled.

The rollback strategy in `supabase/rollback-simple-import.sql` was tested locally inside a transaction: the new import/brand RPC grants became unavailable; ROLLBACK restored them. Existing data and identity keys remain intact. The Supabase CLI emitted a migration catalog-cache certificate warning after successful application; migration list independently confirmed the applied version.

Anonymous and ordinary authenticated users cannot write catalog/Storage, grant memberships, call admin import functions, or read customer requests. Admin API mutations require a verified allowlisted session and same-origin requests. Structured errors include safe codes, Azerbaijani messages, field errors where applicable and correlation IDs; server logs omit raw SQL and customer payloads. Server credentials remain outside Git and browser bundles.

## Trade-in and analytics

Before repair, there were two stored customer requests and three historical `trade_in` events. These are different quantities; existing records alone cannot establish who removed a past request, so this report does not invent that cause. The overview now counts actual `trade_in_requests` using the same selected period/status and Baku day boundaries as the management list. Historical events are not mislabeled as current requests. No genuine historical analytics were erased.

Page views, approximate browser sessions, product views and WhatsApp clicks remain real stored metrics. Clicks are not messages received or sales. Test browsing intercepts passive analytics; explicit analytics checks use unique QA product subjects. Cleanup removes exact QA subjects and subtracts only the single known QA trade-in event associated with the removed QA request.

## Acceptance results

Complete production suite on the repaired runtime before the final date-only correction: **22 passed**. Final date correction: **all three distinct focused live checks passed** across the final runs: real Xiaomi name/price/callback; initial photos and upload retry; Trade-in counts/analytics/WhatsApp/password change/logout. The final two-test rerun passed in 1.4 minutes after correcting only a password-field test selector. Unchanged storefront/import/gallery evidence is reused rather than rerunning all 22 tests.

Final source validation: lint PASS, TypeScript PASS, production build PASS, **21 local tests PASS / 1 intentionally skipped production-only Xiaomi regression**. This run includes interrupted-upload retry, edit fields and browser runtime-error checks.

| Result | Test | Observed acceptance evidence |
| --- | --- | --- |
| PASS | Existing real Xiaomi name and price | Production save, admin reload, public name/price, stable slug and audit, original values restored |
| PASS | Existing disposable product fields | Name, price, brand, category, storage/color, descriptions, specifications, status and featured persist; unchanged save succeeds |
| PASS | Safe errors | Missing record 404; invalid price/source URL 422; duplicate/stale update 409; unauthorized and wrong-origin 403; unsaved form retained on network error |
| PASS | Initial product with photos | New inline brand, auto slug, two authorized photos selected/reordered before save, published public product |
| PASS | Interrupted upload | First photo succeeds, second deliberately fails; database stays draft with one photo; retry publishes exactly two |
| PASS | Gallery | Main-photo reorder, replacement, first/last/only deletion; database references and Storage object listing checked; normal save after deletion needs no file |
| PASS | CSV/XLSX templates | Both downloaded from actual site; exact six headers; separate XLSX instructions; actual XLSX and CSV imports |
| PASS | Import semantics | New brand, category prediction/review, publication, repeated file, price-only update, variant, Unicode/cents, blank description preservation, duplicate/malformed/formula rejection, multi-row transaction rollback and concurrent imports |
| PASS | Public updates | QA products render immediately in AZ/RU/EN without deployment; untranslated descriptions fall back to AZ |
| PASS | Trade-in | QA request persists; list/overview agree for 1/7/30/90 days; status update survives navigation; exact QA request removed |
| PASS | Ordering | Recipient 994556002001; current title, quantity and prices encoded in WhatsApp quote; stale price rejected with 409. No message sent to seller by test |
| PASS | Analytics | Real session/page/product/WhatsApp event writes and database counts verified on exact QA subject |
| PASS | Auth | Disposable administrator login/logout and password change without SMTP; ordinary-user/anonymous RLS rejection; existing owner credentials untouched |
| PASS | Redirect | Exact production `/auth/callback` accepted by Supabase through a generated single-use QA link; no recovery email sent |
| PASS | Responsive/themes | 320/375/390/768/1024/1440/1920 storefront widths; admin mobile/tablet/desktop; three locales × dark/light; no horizontal overflow |
| PASS | Maps/branches | Three full addresses, verified map coordinates, owner-provided Google Maps link and separate CTAs |
| PASS | SEO | All locales have title/description/canonical/structured data; live sitemap contains product; robots excludes admin; real product schema has AZN |
| PASS | Browser runtime | Uncaught page errors checked in owner tests. Intentional network/storage error tests are expected negative cases |

Earlier failed assertions and reruns are not counted as passes: a public Storage CDN cache invalidated the old deletion assertion, and Next.js streamed hidden markup required visible/accessibility-scoped selectors. The final run summary distinguishes the full passing suite from the focused checks on the final date-only correction.

## Catalog and assets

Ten original reviewed listing records and authorized photos remain in `data/verified-listings.json` (reviewed 8 November 2026); two owner-added products were also present before this repair and preserved. No new fictional inventory, invented prices or live Tap.az synchronization was introduced. The real owner must confirm current stock and prices. Missing category inventory/photos must come from the owner; distinct category symbols and truthful missing-photo placeholders avoid invented product imagery.

## Independent owner access and manual tasks

`Kamranshohretli@icloud.com` was explicitly confirmed as belonging to the owner. Secure manual provisioning is prepared, not silently granted using a shared temporary password. The owner must enter their own private password using the terminal procedure in `OWNER_GUIDE_AZ.md`. The existing administrator is never reset or replaced. This final private step, and therefore that specific person's login test, remains manual. Equivalent access is exercised with disposable allowlisted QA users.

Required production redirect: `https://telefon28mobile-website.vercel.app/auth/callback` (verified). Existing local redirect: `http://localhost:3000/**`. Site URL remains the canonical production origin. Email/password login and in-session password change do not require SMTP.

Commercial hosting remains an owner decision: the existing team is on Hobby, whose official terms restrict it to non-commercial personal use. No plan was purchased or changed. Before handing this over as a commercial store, the owner must choose a permitted commercial hosting plan. Source: https://vercel.com/docs/plans/hobby.

No implementation credentials are missing. No paid SMTP or email recovery flow is configured. Owner instructions for products, photos, prices, imports, trade-in and secure independent access are in `OWNER_GUIDE_AZ.md`.


## Final cleanup and handover state

Read-only hosted audit after all final checks: **12 genuine products, 2 genuine Trade-in requests, zero QA Auth accounts, zero queued image cleanups, zero unreferenced product Storage objects**. Two accounts left by an earlier interrupted test hook were identified by exact UUID/email and removed; the existing real administrator was independently confirmed preserved.

The implementation is released and verified. Remaining owner actions are private password provisioning and choosing permitted commercial hosting; these do not require more application development. No unresolved functional blocker was found in the executed acceptance checks. Kamran's personal login remains untested until he supplies his private password locally.

The production runtime remains commit `bc98aef4c899dfdecfd033b936099030318af5fb`. The subsequent handover commit changes only this report, the checkpoint, and a test selector; it requires no runtime redeployment.
