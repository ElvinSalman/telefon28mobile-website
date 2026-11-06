# Database and authentication

Use the existing [Telefon28Mobile Supabase project](https://supabase.com/dashboard/project/bpsmcmmdtxteeswaumse) in London. The reviewed migration is `supabase/migrations/202611060001_shop.sql`. The commands below assume PowerShell in the project root.

## Connection and environment

On 6 November 2026, the authenticated Supabase CLI 2.109.1 listed project `bpsmcmmdtxteeswaumse` as `ACTIVE_HEALTHY` in `eu-west-2`. The public Auth endpoint reported disabled self-signups and required email confirmation. The owner reports anonymous sign-ins disabled. Before rollout the public products endpoint returned HTTP 404 with PostgREST code `PGRST205`, indicating that products were absent from the exposed schema cache.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Use `https://bpsmcmmdtxteeswaumse.supabase.co` for this hosted project. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Copy the publishable key from the target project’s API Keys page. |
| `NEXT_PUBLIC_SITE_URL` | Set the HTTPS origin for the intended deployment. Use the localhost origin for development. |
| `SUPABASE_SECRET_KEY` | Server-only secret API key for throttled trade-in and aggregate analytics writes. Use a separate key per deployment environment where possible. |

Set these in the ignored local environment file or the existing Vercel project's environment settings. Production keys belong only in owner-approved production deployments. Keep developer sessions, service keys, passwords and invitation URLs out of source control and logs. The publishable key works with table privileges, row-level security and authenticated user sessions. [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs) · [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Apply the migration

1. Rehearse the migration on a disposable local Supabase database with Auth and Storage available. Confirm migration history, expected tables and policies in that environment first.
2. Check the exact hosted target and the pending migration set. Use the existing CLI session or the owner’s interactive login. If project selection, history or existing table names differ from expectations, investigate before applying.

```powershell
npx.cmd supabase projects list
npx.cmd supabase link --project-ref bpsmcmmdtxteeswaumse
npx.cmd supabase migration list --linked
npx.cmd supabase db push --linked --dry-run
```

3. After the owner authorizes the hosted migration, run `npx.cmd supabase db push --linked`. Save its result and confirm `202611060001` in `npx.cmd supabase migration list --linked`. Each migration version runs once. The SQL transaction rolls back if a statement fails.
4. If CLI access is unavailable, open the same project's **SQL Editor**, review and run the complete migration file once, then verify the checks below. Record the Git revision and SQL Editor success. Before switching back to CLI migrations, compare the schema and use `npx.cmd supabase migration repair 202611060001 --status applied --linked` only after confirming the exact migration already succeeded. [Supabase CLI reference](https://supabase.com/docs/reference/cli/introduction)

## Schema and access checks

The migration seeds three store locations, category translations and the shared WhatsApp number. The product, trade-in and analytics tables start empty. `admin_memberships` references a specific `auth.users.id`. Direct membership changes require the database owner. Server ingest uses restricted RPCs for throttling, counting events and recording trade-ins.

| Actor | Verify with the actor's actual credentials |
| --- | --- |
| Visitor | Read published products in active categories, their image metadata and active locations. Attempt to read trade-in contact details or daily stats, enumerate membership and write products or files. All such private reads/writes must yield no accessible data. |
| Ordinary signed-in user | Repeat the visitor tests through the browser SDK. Attempt to grant membership, publish a draft, update a location and upload a product image. Check the database after each attempt. |
| Assigned admin | Create a draft, verify it is hidden from visitors, then publish it. Upload an approved product photo, query trade-ins, update a status, inspect aggregate analytics and archive the product. Confirm the public catalog reflects both transitions. |

The `product-images` bucket is public by design. Each uploaded object's URL can be used by anyone who obtains it, even while the product is a draft. Upload only owner-approved product photography. The bucket accepts JPEG, PNG and WebP up to 4 MiB. Customer documents or trade-in attachments require a separate private design; the current schema stores trade-in form fields. [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)

## Invite the first administrator

1. First deploy and test the callback in the intended environment. Use **Authentication → URL Configuration**. The production Site URL is `https://telefon28mobile-website.vercel.app`. Allow precisely `https://telefon28mobile-website.vercel.app/auth/callback`. Local development may use the existing `http://localhost:3000/**` entry. Keep public registration and anonymous sign-ins disabled.
2. In **Authentication → Email Templates**, route invitation and recovery links to the server callback. With the production Site URL set as above, use these two template anchors in the corresponding email types. Use a local Auth instance with its own Site URL for local testing.

```html
<!-- Invite user -->
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&amp;type=invite">Accept invitation</a>
<!-- Reset password -->
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&amp;type=recovery">Reset password</a>
```

3. Verify email delivery for the intended recipient. Supabase's default mail service restricts recipients and has low sending limits. For business use, configure an owner-approved SMTP sender, disable link tracking and rehearse delivery before inviting the owner. [Email template variables](https://supabase.com/docs/guides/auth/auth-email-templates) · [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
4. Under **Authentication → Users → Add user → Send invitation**, invite the owner-confirmed email address. The application verifies the token hash server-side, sets the cookie session and opens `/admin/password`. PKCE recovery codes, when used, must be opened in the initiating browser. Grant the invitation only to the intended person. [Invite API](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail)
5. Copy the exact invited user's UUID from Auth and compare its email with the intended recipient. In that project's SQL Editor, substitute that UUID and email, leaving both checks in the query. A returned UUID confirms the inserted membership. An empty result requires checking the identity or existing membership.

```sql
insert into public.admin_memberships (user_id)
select id from auth.users
where id = '<invited-user-uuid>'::uuid
  and lower(email) = lower('<verified-owner-email>')
on conflict (user_id) do nothing
returning user_id;
```

6. Sign in at `/admin/login` in a fresh browser. Verify the admin can perform the assigned operations, logout revokes access, and a user without membership still receives a denial. Test an expired or reused invitation, a successful recovery and a session refresh. To revoke administrative access, the database owner can remove that specific UUID's membership and revoke its Auth sessions.
