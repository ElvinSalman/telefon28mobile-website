# Telefon28Mobile — FINAL IMPLEMENTATION TASK FOR CODEX

You are continuing work on the EXISTING Telefon28Mobile Next.js project on my Windows laptop. This is a real, small-budget electronics store website for a client in Baku, Azerbaijan. The existing visual website is already deployed, but it is not yet a completed commerce/admin system.

## NON-NEGOTIABLE RULES
1. Open and inspect the existing project in `Desktop/telefon28mobile` (resolve the actual Windows Desktop path, including OneDrive redirection). DO NOT scaffold a new app, create a new repository, or overwrite another project.
2. Before editing, inspect Git status, branches, remotes, current deployment, existing code, environment configuration, assets and previous work. Preserve the current working baseline in a backup branch or tag; do not discard uncommitted changes. Work incrementally and safely.
3. Preserve the current premium visual identity, animations, responsiveness, AZ/RU/EN localization, light/dark theme switching, cart and wishlist. Improve existing code rather than replacing it with a generic template.
4. Complete real end-to-end working features, not mock screens. Every control must work or be clearly marked as unfinished/demo. Never claim success without testing it.
5. Use my EXISTING GitHub repository and EXISTING Vercel project. Canonical production domain: `https://telefon28mobile-website.vercel.app`. The `telefon28mobile-website-lyo5wem7k.vercel.app` URL shown in screenshots is a specific deployment URL; do not mistake it for the stable production domain.
6. Never commit credentials, database passwords, access tokens, service-role/secret keys or `.env.local`. Never expose service-role keys in client code. Do not purchase services, change DNS, delete production data or run destructive migrations without my explicit approval.
7. If an external permission or configuration is missing, implement and test everything else, then give a precise checklist. Only ask for genuinely necessary access/approval. Do not leave the project in a broken half-deployed state.

## VERIFIED PROJECT INFORMATION PROVIDED BY OWNER
- Store: Telefon28Mobile / Telefon 28 Mobile, Baku.
- Order WhatsApp number: `+994 55 600 20 01` (wa.me digits `994556002001`).
- Branch 1: `Azadlıq prospekti, 39D, Bakı`.
- Branch 2: `Dilarə Əliyeva küçəsi, 21, Bakı`.
- Branch 3: `Azadlıq prospekti, 39E, Bakı` (IMPORTANT: 39E is the confirmed correction; NOT Azadlıq 41).
- Store-supplied Google Maps link: `https://maps.app.goo.gl/FHLKC7UydaLqFPM99`.
- Instagram: `https://www.instagram.com/telefon28mobile/`.
- Tap.az seller profile for researching permitted product information: `https://ru.tap.az/shops/telefon28mobile`.
- Existing Vercel live site: `https://telefon28mobile-website.vercel.app`.
- Existing Supabase project URL: `https://bpsmcmmdtxteeswaumse.supabase.co`.
- Existing Supabase public publishable key: `sb_publishable_tAIO6n5qMN1mxB_TBbod5A_WTVAHTxe` (a public client key; store it as an environment variable, not a hardcoded string).
- Owner provided a logo PDF named `logo yeni.pdf` / possibly copied under `brand-assets/`. Find and reuse it if present; do not invent or redesign the logo without approval. If missing from this computer project, explain exactly where I should copy it.

## PHASE 1 — AUDIT AND SAFETY
1. Inspect package.json, existing app routes, localized routing, UI components, Tailwind tokens, images, product data, admin routes, Supabase utilities, database migrations, trade-in form, analytics, cart checkout, Git and Vercel configuration.
2. Produce a short `IMPLEMENTATION_STATUS.md`: what already works, what is incomplete, what needs backend credentials, which production URL is currently live.
3. Make a safe Git restore point and preserve any unrelated local changes. Never overwrite work without inspection.
4. Plan a reliable implementation sequence and then actually execute it. Do not stop after planning.

## PHASE 2 — SUPABASE DATABASE, SECURITY AND STORAGE
Use the existing Supabase project. Prefer `@supabase/supabase-js` and `@supabase/ssr` with server-safe Next.js App Router integration, compatible with the installed Next.js version.

Create version-controlled migrations and typed data access for at least:
- `categories` (localized names, slug, sort, active)
- `brands`
- `products` (id, slug, source, source_url, title, descriptions/locale support, price_azn, optional compare-at price only if legitimate, category_id, brand_id, condition, specifications, active/published, featured, timestamps)
- `product_images` (storage path, alt text, sort order)
- `product_variants` if actually used in the existing site
- `branches` (3 addresses, contact fields, map link, display order)
- `trade_in_requests` (customer contact, device info, condition, details, submitted time, status)
- `trade_in_images` if upload is enabled (private storage)
- `analytics_events` or appropriately designed aggregate tables for real counts
- `admin_members` or equivalent explicit admin allowlist by Supabase `auth.users.id`, with safe server-side authorization.

Create indexes, uniqueness constraints, validation, safe migrations, reasonable error handling and clear seed scripts. Initial migration must be non-destructive. Set up appropriate RLS: public users can read ONLY published public products/categories/branches and permitted public image files; admin-only insert/update/delete for catalog, prices, images, branches and request statuses; trade-in request insertion must be validated and rate-limited and must not allow public reading of submitted PII; analytics event insertion must not expose raw event data to other visitors.

Store public product images in an appropriate public read bucket with admin-only write; store customer trade-in images in a PRIVATE bucket with restricted reads and uploads. Never expose service-role credentials or rely only on hidden UI for security.

Use environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and only additional server-side secrets if actually needed. Inspect existing local env configuration first. Configure Vercel env vars securely using the account's authorized CLI/dashboard. If direct remote migrations are not authorized, output ready-to-run SQL migrations with clear steps and test after they are applied. Obtain approval before applying destructive changes.

The website must read real products from the database, not static hardcoded demo products. Admin edits must be visible in the public catalog without a Git commit or full redeployment. Implement appropriate cache invalidation/revalidation. Provide clear loading/empty/error states.

## PHASE 3 — WORKING ADMIN LOGIN AND FIRST ADMIN
Create a REAL, responsive, polished admin interface, located at `/admin` with an appropriate login route such as `/admin/login` (support localizations consistently or keep admin locale-independent). A public page must not expose admin data.

Use Supabase Auth for secure email/password sessions. Verify access server-side on EVERY protected admin page, API route, server action and database write. Use an explicit `admin_members` allowlist, not merely an authenticated session; never let a user assign themselves admin status. Add safe logout and unauthorized states. Apply RLS to enforce the same rule in the database.

Important existing Supabase configuration:
- Public sign-ups DISABLED.
- Anonymous sign-ins DISABLED.
- Confirm email ENABLED.
- Site URL configured as `https://telefon28mobile-website.vercel.app`.
- Local allowed redirect `http://localhost:3000/**`.
- Exact production redirect requested: `https://telefon28mobile-website.vercel.app/auth/callback` (verify it is saved, otherwise tell me exactly how to add it).
- On Supabase Free, email template customization is blocked without a configured custom SMTP service. We do NOT have custom SMTP and do not wish to purchase one now.

Therefore, DO NOT make initial admin setup depend on custom invite/recovery email templates, magic links or SMTP. Implement a secure way to create the first admin manually through Supabase Dashboard / authorized server-side admin provisioning, with a strong temporary password set privately, confirmed email as needed, and a documented process for adding their `auth.users.id` to the admin allowlist. Do not create public default admin credentials, hardcode passwords, or ask for any password in chat. Provide precise first-login and password-change instructions. If self-service password reset will not function without SMTP, label it as unavailable for now and document later setup. Do not falsely claim email invitations work.

If an `/auth/callback` handler exists, verify token_hash handling against current Supabase auth patterns and security best practices, without depending on it for manual first-admin provisioning.

## PHASE 4 — ADMIN PRODUCT MANAGEMENT
Make the admin pleasant for a nontechnical store owner, usable on desktop AND mobile, with Azerbaijani default admin UI and optional RU/EN if practical. Must include:
- Dashboard with real analytics counters and clear zero states.
- Product table with image, title, category, price in AZN, active status, search, sorting, filters and pagination.
- Create product with multiple images from desktop/mobile, title, short/full description, price, brand, category, condition, optional variants/specifications, SEO slug and publishing toggle.
- Edit product and re-order images; upload/delete images safely; ensure optimized images display on product and catalog pages.
- Archive/unpublish product instead of destructive deletion by default.
- Manage categories and brands, including distinct category visuals.
- Edit three branch records and WhatsApp settings safely.
- View trade-in submissions and change status.
- CSV/XLSX import with downloadable template, validation, category auto-suggestions, preview, duplicate detection, import errors and explicit confirmation. Product image matching can use owner-supplied file names or zip archives if feasible; document limitations honestly.
- A short onboarding guide inside admin: how to add a phone, upload its photos, set price and publish it.

Do not require GitHub, Vercel or a developer for future product edits.

## PHASE 5 — REALISTIC IMAGERY AND INITIAL CATALOG
Existing screenshots show visually artificial orange phone illustrations, duplicated camera images for unrelated categories (laptops, accessories, appliances and "other"), and an empty "store picks" section. These make the site look fake. Fix them without sacrificing the premium design.

- Use the provided genuine store logo from `logo yeni.pdf` if present; preserve its aspect ratio and legibility on both themes. Generate appropriate web assets only from this authorized file.
- Give EACH category a relevant DISTINCT visual. Prefer accurate, usable licensed photographs of real device types, owner-provided photos or clean distinctive category icons over incorrect/repeated fake product images. Never use a camera photo for laptop/accessory/appliance categories.
- Replace overly artificial fake devices in hero and catalog with realistic, legally usable visuals, keeping an attractive premium dark-first design and a carefully designed light theme.
- Initial real catalog target: 10–15 actual Telefon28Mobile listings with exact verified current item name, variant, condition if stated, price in AZN, description/category, and individually matched photos if authorized. Store source URL and date of verification.
- The shop's public Tap.az seller page may help identify items, but DO NOT scrape it in bulk, bypass restrictions, or copy its images/text in violation of its terms. The shop owner's permission to build a site does not automatically override marketplace rights. Use an approved source feed, explicitly authorized manual listing information and/or original photos/product sheets from the owner. If access/reuse rights are missing, do NOT fabricate the 10–15 "real" products or falsely claim they were imported. Instead, populate only approved verified products and output a specific owner checklist for the remaining items. Keep a clearly labeled empty state instead of fake real inventory.
- Product category suggestions: Smartphones, Tablets, Laptops, Smartwatches, Headphones, Game Consoles, Accessories, Home Appliances, Other. Confirm device type by details; allow manual corrections.
- Every published product must have its own working SEO-friendly localized URL and gallery, accurate price, variants if verified, description/specs, add-to-cart and WhatsApp inquiry.

## PHASE 6 — FIX CONTACTS, THREE BRANCHES AND EMBEDDED MAP
Existing contact screenshots show isolated oversized headings `39D`, `21`, `39E` and the "Show on map" and "WhatsApp" buttons almost touching.

- Replace isolated address-number headings with complete human-readable addresses.
- Build three beautiful consistent responsive branch cards with precise addresses, appropriate links, phone/WhatsApp contact where valid, and generous button spacing/touch targets.
- Add a nice EMBEDDED interactive map directly on the page using an allowed, technically viable provider and a verified location. The provided short maps.app.goo.gl URL is a share link, not necessarily a valid iframe embed URL; resolve an official embed URL or use a safe map approach, without claiming that unverified branch pins are accurate.
- Keep a dedicated clear "Show on Google Maps" button linking to EXACTLY `https://maps.app.goo.gl/FHLKC7UydaLqFPM99`.
- Allow admin to edit branch details and map links. Do not fabricate coordinates.
- Ensure AZ/RU/EN contact translations and mobile layouts are excellent.

## PHASE 7 — CART -> WHATSAPP ORDER FLOW
Preserve and test the current cart model: customers browse products, add multiple items, adjust quantity, review totals, click "Order via WhatsApp", and manually send a prefilled message to the store WhatsApp account `994556002001`. NO online payment. NO customer account requirement.

- Before building the message, re-fetch current product price/status server-side and warn about changes/unavailable products.
- Format the message clearly (item name, variant if available, quantity, unit price, line total, overall total in AZN, useful product link); honor selected AZ/RU/EN language where practical.
- Use the properly encoded `https://wa.me/994556002001?text=...` URL.
- Count the outbound WhatsApp BUTTON CLICK, not a verified delivered WhatsApp message or completed order. Do not pretend a message was sent automatically.

## PHASE 8 — TRADE-IN REQUESTS
Ensure the existing trade-in page actually works:
- Real form for device brand/model, storage if relevant, condition, defects, contact name, phone, optional description/images, consent acknowledgement.
- Client/server validation, spam/rate limiting, privacy-friendly storage.
- Persist real submissions in Supabase with a success state ONLY after a successful insert.
- Admin can list, inspect and update submission status; customer data and uploaded images are NOT publicly readable.
- Do not invent automatic valuation or promises of a specific buyback price.

## PHASE 9 — REAL ANALYTICS DASHBOARD
Implement real basic metrics: visits or pageviews (clearly labeled correctly), product page views, outbound WhatsApp clicks, trade-in requests, and top viewed products. Distinguish pageviews vs unique visitors where metrics cannot be measured reliably; do NOT claim identifiable unique users without an accurate method.

Use a lightweight consent-conscious, privacy-conscious analytics approach that fits low operating costs (reusing already enabled analytics, or an internal minimal event model where appropriate). Avoid collecting raw phone numbers, message content or sensitive customer data in analytics. Respect required privacy disclosures and retention. Dashboard must show REAL data and zero states; never use the screenshot's fictional numbers as live metrics. Include date range filters if feasible.

## PHASE 10 — SEO, LOCALES, THEMES, PERFORMANCE
Preserve AZ default, RU, EN and both themes throughout the whole public site. Maintain locale on navigation and product URLs; ensure all new UI labels/forms/errors are translated naturally. Theme persistence and accessibility should work on mobile.

Implement technical SEO: canonical links, localized `hreflang`, meta titles/descriptions, Open Graph, robots/sitemap, structured Product and LocalBusiness data ONLY with verified facts, optimized product images, clean semantic markup. Do not promise top search rankings; technical SEO ≠ guaranteed ranking. Exclude admin/private content from indexing.

Run real responsive checks at 320/375/390/768/1024/1440 px. Preserve premium animations while respecting `prefers-reduced-motion`. Fix repeated graphics, bad spacing, awkward buttons, broken images, horizontal overflow and dead links. Ensure core user flows work with keyboard/touch. Keep site performant on mobile.

## PHASE 11 — TESTS / ACCEPTANCE CRITERIA
Do NOT report the project done until you actually verify the following with real connected Supabase (or explicitly identify a missing permission/credential):
A. An authorized admin can log in; a nonadmin/unauthenticated user CANNOT access admin pages or write endpoints.
B. Admin creates a product, uploads several photos, sets category/price and publishes it. It immediately appears in public catalog and its own URL without a deploy.
C. Admin updates a price; public product detail, cart validation and WhatsApp checkout reflect the new price.
D. Admin unpublishes product; it is no longer purchasable in public UI.
E. Three branch cards show the confirmed full addresses; embedded map works; Google Maps and WhatsApp CTAs are separated and clickable.
F. Trade-in submission is stored securely; admin sees it; public cannot list requests.
G. Real analytics counters change appropriately upon test events; test data is marked/cleaned without removing genuine data.
H. RU/AZ/EN, light/dark, category visuals, mobile navigation and cart are tested.
I. npm lint/typecheck/test/build pass as supported by current repo. Fix production errors.
J. Verify the CANONICAL Vercel production URL and the admin login URL after deployment, not only a temporary preview URL.

Use Playwright or similar smoke tests if practical. Do not fake their output. Verify Supabase SQL/RLS policies with practical allow/deny tests. Document what was tested, what couldn't be tested and why.

## PHASE 12 — GITHUB, VERCEL, HANDOFF
- Update useful docs: README.md, ADMIN_GUIDE.md, DATABASE_SETUP.md, PRODUCT_IMPORT_GUIDE.md, `IMPLEMENTATION_STATUS.md`, `.env.example`, any migration documentation.
- Provide clear instructions to safely provision the first admin via Supabase Dashboard, map their UID to the admin allowlist, and log in at `/admin`. Do not ask me to share a password, and never create a public default password.
- Reuse existing GitHub remote and Vercel project; do not create duplicates. Stage only appropriate files, commit with a meaningful message and push changes to the existing main branch with my approval if needed.
- Set real required Vercel environment variables in an authorized secure way; do not print secrets in logs or files. Run and verify production deployment. If commercial hosting requires a paid plan, inform me before any upgrade or launch; do not buy anything on my behalf.
- When production is verified, open the stable production site in Chrome if local environment access permits. If not, give me the exact URL.

FINAL RESPONSE MUST INCLUDE:
1. Exact local project path and Git commit hash.
2. Existing GitHub repository URL and stable Vercel production URL.
3. Exact admin login URL and first-admin setup steps.
4. Schema/migration/RLS/storage status and security checks.
5. List of genuinely verified initial products with sources, prices and image permissions; explicitly list any missing ones.
6. Product CRUD, trade-in, cart-to-WhatsApp, analytics and map test results.
7. Actual AZ/RU/EN and light/dark/mobile test results.
8. Production deployment status and Chrome opening result.
9. Remaining blockers needing my action, with precise steps, and what is still demo-only.
10. A brief Azerbaijani-language handover guide for the store owner, covering admin login, adding a product, uploading photos, changing prices and unpublishing an item.

Start NOW by inspecting the current workspace and changes from the previous Codex session. Continue the implementation until all feasible work is done. Prioritize safe real functionality over superficial claims. Do not just answer with instructions or a plan; execute the work.
