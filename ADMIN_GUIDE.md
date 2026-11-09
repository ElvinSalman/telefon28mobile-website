# Administrator setup without SMTP

Login: https://telefon28mobile-website.vercel.app/admin/login

## Private terminal setup (existing authorized Supabase CLI)

From PowerShell in C:/Users/Elvin/Desktop/telefon28mobile run:

powershell -NoProfile -ExecutionPolicy Bypass -File scripts/provision-admin.ps1 -Email YOUR_EMAIL

Enter a unique 16–128 character password twice at the hidden prompts. Do not paste passwords into chat, command arguments, Git, or environment files. The script creates a confirmed Auth user and adds that exact UUID to admin_memberships. It refuses to reset an existing account and sends no email. If creation succeeds but membership fails, use the Dashboard procedure below for the existing user.

## Supabase Dashboard alternative

1. Open project bpsmcmmdtxteeswaumse → Authentication → Users → Add user → Create new user (not Send invitation).
2. Enter the intended admin email and a strong password privately. Enable Auto Confirm User / confirmed email. Keep public signup disabled.
3. Copy the created user's UUID. In SQL Editor, replace both placeholders in this query, check the email and UUID match, then run:

    insert into public.admin_memberships(user_id)
    select id from auth.users
    where id='<UUID>'::uuid and lower(email)=lower('<ADMIN_EMAIL>')
      and email_confirmed_at is not null
    on conflict do nothing returning user_id;

4. Open the login URL and sign in. Dashboard → Şifrəni dəyiş opens /admin/password. Enter the current password, a new password of at least 12 characters, and confirmation. If a temporary password was provided privately, change it immediately.
5. Forgetting a password currently requires the authorized Supabase operator to update the Auth account privately. Email recovery is intentionally unavailable. No default credentials exist.

## Callback settings

Site URL: https://telefon28mobile-website.vercel.app
Exact additional redirect: https://telefon28mobile-website.vercel.app/auth/callback
Keep the existing http://localhost:3000/** local entry. In Authentication → URL Configuration, add the exact HTTPS callback and Save if absent. Manual email/password login does not depend on callback email templates. The callback accepts PKCE codes and single-use invite/recovery token hashes; admin membership is still required for protected pages. Email onboarding/recovery requires a separately configured compatible SMTP/template flow later.

## Qısa Azərbaycan dilində təlimat

1. /admin/login açın; şəxsi e-poçt və şifrə ilə daxil olun.
2. Məhsullar → Yeni məhsul: ad, brend, kateqoriya, AZN qiyməti və təsvirləri yazın. Qaralama saxlayın.
3. Fotoları seçin (JPG/PNG/WebP, hər biri 4 MB-a qədər, maksimum 8). Sıra 0 əsas fotodur. Oxlarla sıralayın, Fotonu sil ilə lazımsız fotonu çıxarın.
4. Dərc edilib → Saxla: məhsul dərhal saytda görünür; Vercel/GitHub lazım deyil.
5. Qiyməti dəyişmək üçün Redaktə → Qiymət → Saxla. Satışdan çıxarmaq üçün Arxivlə və ya Qaralama seçin.
6. Trade-in müraciətlərinin statusunu yeniləyin; Filiallar bölməsindən ünvanları idarə edin. Analitika klik və baxış sayıdır, satış sayı deyil.
7. İş bitdikdə Çıxış düyməsini basın.

## Generated first-admin credential on this computer

The authorized first account has been provisioned with a random temporary password. Only an encrypted, Windows-user-bound copy is stored at .vercel/first-admin-password.dpapi (ignored by Git). Run powershell -NoProfile -ExecutionPolicy Bypass -File scripts/show-admin-password.ps1 yourself to reveal it in your private terminal. Never run that command through chat tooling or paste its output into chat. Sign in, change the password through /admin/password, and then remove the encrypted bootstrap file. The file is usable only by the Windows account that created it.

Production verification on 9 November: the exact callback redirect was allowed, real owner password login/logout succeeded, and protected password changes succeeded with a disposable administrator. No SMTP was used.
