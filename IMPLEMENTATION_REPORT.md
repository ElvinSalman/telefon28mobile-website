# Telefon28Mobile implementation report — 9 November 2026

## Existing project and release
Workspace: C:/Users/Elvin/Desktop/telefon28mobile. Repository: https://github.com/ElvinSalman/telefon28mobile-website. Canonical production: https://telefon28mobile-website.vercel.app. Admin: https://telefon28mobile-website.vercel.app/admin/login.

The existing Next.js design, official supplied logo, AZ/RU/EN, dark/light modes, cart and wishlist are preserved. Restore branches preserve the original production and both pre-change baselines. No new project, repository, DNS or paid service was created.

## Database and security
The existing Supabase project bpsmcmmdtxteeswaumse has migrations 202611060001, 202611080001 and 202611090001 applied. RLS protects products, categories, brands, branches, images, admin membership, trade-in PII and aggregate analytics. Public reads expose only published products in active categories. Admin APIs and password pages/actions check verified Auth claims and explicit membership. Public signup and anonymous Auth are disabled. Product photos use public Storage with admin-only writes. Server credentials remain in sensitive Vercel environment storage, never in client code or Git.

Ten products and their photos are stored in hosted Supabase; all ten have source URLs and dated verification metadata. Public catalog reads returned ten products. Admin writes are read on subsequent requests without redeployment. Products are archived by default. Galleries support up to eight optimized photos, multi-file upload, replacement, reorder and removal. CSV/XLSX import includes preview, duplicate checks, validation and category suggestions that require review.

## Admin provisioning
The nominated first administrator has been created as a confirmed Supabase Auth user and added to admin_memberships. No email was sent. Its generated temporary password is stored only as Windows-user-encrypted ciphertext in the ignored .vercel directory. The owner reveals it privately with scripts/show-admin-password.ps1 and changes it at /admin/password, which requires the current password. ADMIN_GUIDE.md documents the private setup and Dashboard alternative. No invitation or recovery email is required or claimed. SMTP/email recovery remains disabled.

## Verified launch catalog
Owner authorization for these specific seller photographs was given in the conversation. No bulk crawler, bypass or live sync was implemented. Original watermarks remain. Prices were checked on 8 November; availability still requires owner confirmation. Used-device condition notes are preserved in AZ/RU/EN.

| Product / configuration | AZN | Source |
|---|---:|---|
| Apple iPhone 14 128 GB Blue | 559 | [Listing](https://tap.az/elanlar/elektronika/telefonlar/49076729) |
| Apple iPhone 15 128 GB Black | 789 | [Listing](https://tap.az/elanlar/elektronika/telefonlar/49041247) |
| Apple iPhone 17 Pro 256 GB Silver | 2199 | [Listing](https://tap.az/elanlar/elektronika/telefonlar/49104970) |
| Xiaomi Redmi A7 Pro 128 GB Black | 329 | [Listing](https://tap.az/elanlar/elektronika/telefonlar/47822941) |
| Apple iPhone 18 Pro 512 GB Black | 3649 | [Listing](https://tap.az/elanlar/elektronika/telefonlar/48822711) |
| Apple iPhone 15 128 GB Blue | 1399 | [Listing](https://tap.az/elanlar/elektronika/telefonlar/47001254) |
| Apple Watch Series 11 Aluminum 42mm  Jet Black | 649 | [Listing](https://tap.az/elanlar/elektronika/smart-saat-ve-qolbaqlar/48607589) |
| Dyson Airwrap i.d Ceramic Pop  Ceramic Pop | 949 | [Listing](https://tap.az/elanlar/sexsi-esyalar/gozellik-saglamliq/43754376) |
| Apple Watch Series 11 Aluminum 42mm  Rose Gold | 649 | [Listing](https://tap.az/elanlar/elektronika/smart-saat-ve-qolbaqlar/48607583) |
| Xiaomi Redmi Note 15 256 GB Black | 519 | [Listing](https://tap.az/elanlar/elektronika/telefonlar/46774272) |

Tablets, laptops, headphones, consoles, accessories and other electronics need additional verified owner data/photos; relevant distinct category icons replace repeated artificial graphics meanwhile. No invented stock or prices are supplied for those categories.

## Branches, map and customer flows
All three full addresses are shown: Azadlıq prospekti 39D, Dilarə Əliyeva küçəsi 21 and Azadlıq prospekti 39E, Bakı. The provided Google Maps link resolved to Telefon 28 Store at 40.3775119,49.8481256. A Google Maps iframe uses that one verified location; no claim is made that it marks all three branches. The exact owner share link remains a separate CTA, spaced from WhatsApp.

WhatsApp quotes re-fetch current prices/status and encode item details, quantities and totals for 994556002001. Customers manually send the message. Trade-in form data is validated, rate-limited and persisted; admins review and update status. Analytics count real pageviews, approximate tab sessions, product views, WhatsApp clicks and trade-in submissions, not unique people or completed sales. DNT is respected. Technical SEO includes localized metadata/canonical/hreflang, dynamic sitemap, robots and factual structured data.

## Local acceptance results
Final lint/typecheck/build passed. All 19 local Chrome/Supabase tests passed, covering RLS allow/deny, confirmed manual password login, current-password changes, private page gates, product create/edit/publish/archive, image upload/reorder/removal, CSV/XLSX validation/import, stale cart prices, WhatsApp composition, persisted trade-ins and counters, callback token handling, AZ/RU/EN, dark/light and widths 320/375/390/768/1024/1440/1920.

Production acceptance and screenshots are recorded below after deployment; local success alone is not claimed as production success.

## Remaining operating work
No purchase was made. Existing Vercel team remains Hobby; the owner must arrange hosting eligible for commercial operation. Email recovery/SMTP, customer image uploads/private media, ZIP photo imports, custom-domain DNS, Search Console ownership, legal/retention policy approval and additional category inventory remain manual or out of scope. Trade-in images are not accepted, so no private customer media bucket is advertised. Exact remote Auth redirect allowlist persistence will be tested with a disposable token without sending email. Public product updates and operator login must be confirmed in production before final signoff.
