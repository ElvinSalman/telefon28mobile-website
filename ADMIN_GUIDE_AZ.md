# Telefon28Mobile idarəetmə təlimatı

## İlk giriş
Hesab Supabase-də təsdiqlənmiş e-poçt və şəxsi şifrə ilə əl ilə yaradılır; UUID ayrıca admin_memberships siyahısına əlavə edilir. Dəvət və bərpa e-poçtu tələb olunmur. Təhlükəsiz terminal əmri və Dashboard addımları ADMIN_GUIDE.md faylındadır. /admin/login açın. Müvəqqəti şifrə ilə daxil olmusunuzsa, Şifrəni dəyiş bölməsində cari və yeni şifrəni yazın. Şifrəni heç vaxt çatda paylaşmayın.

## Məhsulu satış kataloquna əlavə etmək
1. **Kateqoriyalar** bölməsində brendi əlavə edin. Yeni kateqoriya yaradarkən AZ, RU və EN adlarını yazın.
2. **Məhsullar → Yeni məhsul** seçin. Model, brend, kateqoriya və manatla qiymət tələb olunur. Slug hər konfiqurasiya üçün sabit və unikal olmalıdır. Məsələn, eyni telefonun 128 GB və 256 GB variantlarına ayrı slug və uyğun qiymət verin.
3. İstəsəniz rəngi, yaddaşı, təsdiqlənmiş vəziyyəti, təsvirləri və xüsusiyyətləri əlavə edin. Xüsusiyyətlər üçün nümunə: `{"Ekran":"6.1 düym"}`. Önbaxışı yoxlayıb əvvəlcə qaralama saxlayın.
4. Saxlanmış məhsulu açın. Hər şəkil üçün fayl, təsvir və sıra seçin. 0 əsas şəkildir. 0–7 arasında səkkiz yer var. JPG, PNG və WebP qəbul edilir. Limit 4 MB-dır. Eyni sıra seçilərsə, həmin şəkil əvəzlənir. Yalnız mağazaya aid və paylaşılması icazəli fotolardan istifadə edin.
5. **Dərc edilib → Saxla** seçin. Məhsul aktiv kateqoriyada olanda kataloqda görünür. Qiyməti dəyişdikdə yeni sorğuda server cari qiyməti yoxlayır. Satışdan çıxarılan məhsulu arxivləyin. Arxivləndikdə ictimai keçidi 404 qaytarır.

## İdxal
İdxal bölməsindən boş CSV və ya XLSX şablonunu endirin. Mövcud brend və kateqoriya slug-larından istifadə edin. Eyni məhsulu yeniləmək üçün əvvəlki slug-u saxlayın. Önbaxışda qiyməti, statusu və “yeni/yenilənir” qeydini yoxlayın, sonra təsdiqləyin. Bir faylda maksimum 200 sətir və 2 MB qəbul olunur.

## Müraciətlər və filiallar
**Trade-in** bölməsində yeni müraciətləri açın. Cihaz və əlaqə məlumatlarına yalnız səlahiyyətli şəxslər baxmalıdır. Müştəri ilə əlaqə saxladıqda statusu dəyişin, iş bitdikdə bağlayın. Müştəri fotosu qəbul edilmir. Silinmə sorğularını şəxsiyyəti yoxlayaraq mağaza sahibinə yönləndirin.

**Filiallar** bölməsində ünvan və görünmə sırasını yeniləyin. İş saatlarını, ayrıca telefonu və fərdi xəritə keçidini yalnız təsdiqdən sonra yazın. Ümumi Telefon 28 Store xəritəsi filial siyahısından ayrıdır. **Ayarlar** bölməsində WhatsApp nömrəsi beynəlxalq formatda, yalnız rəqəmlərlə saxlanılır.

## Analitika
1, 7, 30 və ya 90 günlük dövrü seçin. Sessiya təxmini brauzer vərəqi sessiyasıdır. Məhsula baxış, WhatsApp keçidinə klik və uğurla saxlanmış trade-in müraciəti ayrı sayılır. WhatsApp klikindən mesajın göndərildiyini və ya satışın baş verdiyini müəyyən etmək mümkün deyil. E-poçt göndərilməsi, silinmə müddəti və hüquqi mətnlər mağaza sahibi tərəfindən təsdiqlənməlidir.
