# Telefon28Mobile staged rollout

## Existing deployment baseline

Recorded on 6 November 2026, before deploying the admin/catalog branch.

| Item | Verified baseline |
| --- | --- |
| Repository | [ElvinSalman/telefon28mobile-website](https://github.com/ElvinSalman/telefon28mobile-website) |
| Feature branch and starting revision | `feature/admin-catalog`, based on `ecc115a` |
| Linked Vercel project | `telefon28mobile-website` in team `salmanovelvin96-5841s-projects` |
| Team billing plan | **Hobby**, confirmed via authenticated Vercel team API |
| Production variables | Vercel CLI returned zero configured production variables at the time of inspection |
| Public routes | Root followed through to `/az`. Final responses for `/az`, `/ru` and `/en` were HTTP 200. |
| New routes | `/admin/login` and `/auth/callback` returned HTTP 404 on the original deployment. |

Target the existing [production site](https://telefon28mobile-website.vercel.app). Vercel Hobby limits usage to personal, noncommercial projects. The owner must choose hosting that permits business use before enabling live store operations, including real lead collection or commercial WhatsApp ordering. Obtain approval for any paid plan or host change. [Vercel Hobby terms](https://vercel.com/docs/plans/hobby)

## Preview and verification

- [ ] Check the current branch, diff and Git remote. Keep the last working production deployment ID and commit available for rollback. Work in the existing Vercel link.
- [ ] Use a disposable/local database for QA and synthetic customer data. Apply the reviewed migration, configure the nonproduction environment, and exercise the three access roles. Follow the [database setup guide](DATABASE_SETUP.md).
- [ ] Set `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and private `SUPABASE_SECRET_KEY` in their matching environment. Production secrets belong in production. Set an exact callback origin for each intended hosted preview using staging Auth settings.
- [ ] Run `npm.cmd ci`, `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build` and `npm.cmd test`. Save failing test names or skipped cases as well as successful results.
- [ ] In a preview, exercise AZ/RU/EN, both themes, keyboard navigation, reduced motion, catalog filters, direct product URLs, cart and WhatsApp composition. Check the three supplied addresses and single verified branch map link. Photograph rights, current AZN prices and availability need owner approval before publication.
- [ ] Exercise invite, password setup, recovery, logout and server-side membership enforcement. Test direct REST and Storage writes using a visitor and a signed-in ordinary user. Verify uploaded product images, CSV/XLSX import and repeated imports of the same slug. Inspect the public catalog in an independent browser.
- [ ] Submit a synthetic trade-in through the form, verify its record and status update from the admin side, and confirm the record is inaccessible to other visitors. Trigger real test events and verify Baku-day aggregate counts. Check the rate-limited and unavailable-service paths. Keep personal information out of analytics.

## Approved production release

1. Confirm the eligible hosting plan, intended production commit, migration version and rollback deployment with the owner. Review the owner’s approval for modifying production. Supabase Free has usage limits and low-activity projects may pause. Check database backups, recovery, storage limits, SMTP, operator contact and monitoring before launch. [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
2. With authorization, apply the migration to `bpsmcmmdtxteeswaumse` and verify its history and access rules. Set the public keys and private ingest key in the existing Vercel project's Production scope, then build that exact approved revision. Public Next.js variables are embedded during the build.
3. With the production route implemented and verified in preview, configure Auth Site URL `https://telefon28mobile-website.vercel.app` and exact redirect URL `https://telefon28mobile-website.vercel.app/auth/callback`. Retain the existing localhost development entry. Confirm the invite and recovery templates use the correct domain.
4. Promote the tested revision to the existing production alias through the authorized release path. Recheck public localized routes, a published product, private admin redirection, trade-in, the store map, sitemap and robots over HTTPS. An empty product catalog is expected until an owner publishes an item.
5. After confirming the live callback handles invalid links safely, the owner can invite the first admin, validate the UUID and grant the membership. Verify login/logout, an owner-approved catalog edit, a synthetic trade-in and a corresponding metric. Open the production URL in Chrome after these checks pass.
6. Record commit, deployment ID/URL, migration version, plan, validation results and any outstanding owner actions. If a release regresses, restore the previous known-good Vercel deployment. Keep database changes and newly captured leads intact while diagnosing; use a reviewed forward migration for schema corrections.
