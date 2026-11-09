# Telefon28Mobile — sahib üçün qısa təlimat

Sayt: https://telefon28mobile-website.vercel.app
İdarəetmə: https://telefon28mobile-website.vercel.app/admin/login

## Məhsul və foto əlavə etmək
1. **Məhsullar → + Yeni məhsul** açın.
2. Adı, qiyməti və kateqoriyanı yazın. Brendi siyahıdan seçin; yeni brend üçün adını yazıb **+ Yeni brend** basın.
3. Yaddaş, rəng və təsviri doldurun. RU/EN tərcüməsi yoxdursa, AZ təsviri göstərilir. Xüsusiyyətləri ad/dəyər şəklində əlavə edin.
4. **Fotoları seç** vasitəsilə 8-ə qədər JPG/PNG/WebP seçin (hər biri ən çox 4 MB). Önbaxışda **Əvvələ** ilə əsas fotonu birinci edin; istəmədiyiniz seçimi çıxarın.
5. Statusdan **Dərc edilib** seçin, sonra **Saxla** basın. Bütün fotolar yüklənənədək məhsul qaralamada qalır. Xəta olarsa, formadan çıxmadan təkrar saxlayın. Yalnız uğur mesajından sonra tamamlanmış sayılır.
6. Saytı yeniləyin — GitHub və ya Vercel əməliyyatına ehtiyac yoxdur.

## Qiyməti dəyişmək
**Məhsullar → Axtar → Redaktə et → Qiymət → Saxla**. Adı dəyişmək məhsulun keçidini dəyişmir. **Arxivlə** məhsulu saytdan gizlədir, bazadan silmir.

## Fotoları idarə etmək
**Fotonu sil**, **Əsas şəkil et** ayrıca işləyir. Siləndən sonra başqa foto seçmək və ya əlavə Saxla basmaq lazım deyil. **Əvəz et** ilə yeni faylı seçin, **Foto əlavə et** basın. Köhnə faylın təmizlənməsi barədə xəbərdarlıq görsəniz, həmin xəbərdarlıqdakı təkrar düyməsini istifadə edin.

## Excel və CSV
1. **İdxal** səhifəsindən **Excel şablonu** və ya **CSV şablonu** endirin.
2. Altı başlığı dəyişməyin: **Məhsulun adı; Qiymət (AZN); Brend; Yaddaş; Rəng; Təsvir**.
3. 1–200 məhsul yazın. Excel-in ikinci vərəqi yalnız təlimatdır; uydurma nümunəni real məhsul kimi əlavə etməyin. CSV UTF-8 olmalıdır. Qiymət: `1234.50` (Excel-də `1234,50` də qəbul edilir).
4. Faylı yükləyin. Önbaxışda adları, qiymətləri, yeni brendləri və kateqoriyaları yoxlayın. Naməlum kateqoriyanı seçin. Eyni variant üçün ad/brend/yaddaş/rəngi sabit saxlayın; qiyməti dəyişə bilərsiniz.
5. Təsdiq işarəsini seçib **İdxalı təsdiqlə** basın. Yeni brendlər bu mərhələdə yaranır. Yeni məhsullar avtomatik dərc edilir. Fotosuz məhsulda **Foto əlavə edilməyib** göstərilir.
6. **Şəkilləri əlavə et** keçidlərindən real fotoları yükləyin. Boş təsvir əvvəlki təsviri silmir; mövcud fotolar qorunur.

CSV: https://telefon28mobile-website.vercel.app/import-template.csv
Excel: https://telefon28mobile-website.vercel.app/admin/import (daxil olduqdan sonra endirmə düyməsi).

## Trade-in və analitika
İcmaldakı **Saxlanmış Trade-in müraciətləri** faktiki bazadakı müraciətlərdir. Eyni gün intervalı və status filtri ilə siyahıdakı say uyğun gəlir. Vaxt Bakı vaxtıdır. **Yeni / Əlaqə saxlanılıb / Bağlı** statuslarını dəyişə bilərsiniz. WhatsApp klikləri göndərilmiş mesaj və ya satış demək deyil. Sessiyalar unikal insan sayı deyil.

## Kamran üçün ayrıca, məxfi giriş
E-poçtun sahibə məxsus olduğu layihə sahibi tərəfindən təsdiqlənib. Mövcud administrator hesabı dəyişdirilmir. Yeni hesabın şəxsi şifrəsi avtomatik yaradılmır və paylaşılmır.

Layihə sahibinin Supabase CLI hesabı ilə daxil olduğu kompüterdə, mağaza sahibi yanında olarkən:
1. PowerShell-də `C:\Users\Elvin\Desktop\telefon28mobile` qovluğuna keçin.
2. Bu əmri işlədin:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/provision-admin.ps1 -Email Kamranshohretli@icloud.com -OwnerConfirmed
```

3. Mağaza sahibi ən azı 16 simvolluq şəxsi şifrəsini iki dəfə gizli xanaya daxil etsin. Şifrəni çata, əmr arqumentinə və ya fayla yazmayın. Skript mövcud hesabı sıfırlamır. Hesab artıq varsa, avtomatik yenisini yaratmır və icazə vermir; layihə sahibi Supabase-də mövcud istifadəçini yoxlamalıdır.
4. Uğur mesajından sonra sahib öz e-poçtu/şifrəsi ilə admin ünvanına daxil olsun. SMTP və e-poçt dəvəti tələb edilmir.
5. **Şifrəni dəyiş** səhifəsində cari şifrəni, yeni şifrəni və təkrarını daxil edin. Hesabdan çıxıb yeni şifrə ilə giriş edin.

Bu son məxfi addım sahibi tərəfindən tamamlanana qədər onun şəxsi hesabı üzrə giriş testindən keçildiyi iddia edilmir. Eyni Supabase Auth, allowlist, məhsul/foto və Trade-in icazələri ayrıca müvəqqəti QA administratoru ilə yoxlanılır.
