# Savor website

Savor üçün hazırlanmış, üç dilli və idarəetmə panelli statik marka saytıdır.

## Hazır olan bölmələr

- Ana səhifə
- Məhsullar və məhsul detalları
- Reseptlər və resept detalları
- Haqqımızda
- Haradan almaq olar
- Azərbaycan, rus və ingilis dili
- Hər dil üçün ayrıca mətn və ayrıca şəkil sahələri
- Pages CMS ilə pulsuz admin paneli
- Telefon, planşet və kompüterə uyğun dizayn

## Lokal baxış

Brauzer təhlükəsizlik qaydalarına görə JSON məzmunu birbaşa fayla iki dəfə klikləməklə açılmır. Qovluqda sadə lokal server başladın:

```powershell
python -m http.server 8080
```

Sonra `http://localhost:8080` ünvanını açın.

## Pulsuz yayımlama

Ən sadə yol GitHub Pages-dir:

1. Bu qovluqdakı faylları yeni GitHub deposuna yükləyin.
2. GitHub-da **Settings → Pages** bölməsini açın.
3. **Deploy from a branch**, `main`, `/ (root)` seçin.
4. Bir neçə dəqiqə sonra saytın pulsuz ünvanı hazır olacaq.

Öz domeniniz varsa, eyni bölmədə **Custom domain** sahəsinə əlavə edə bilərsiniz.

## Admin paneli

1. [Pages CMS](https://app.pagescms.org) ünvanında GitHub ilə daxil olun.
2. Pages CMS GitHub tətbiqinə yalnız Savor deposu üçün icazə verin.
3. Deponu seçin. Kökdəki `.pages.yml` faylı paneli avtomatik qurur.
4. **Səhifələr və əlaqə**, **Məhsullar** və ya **Reseptlər** bölməsindən məzmunu dəyişin.
5. `Azərbaycan`, `Русский` və `English` sahələrini doldurub yadda saxlayın.

Pages CMS pulsuzdur və ayrıca verilənlər bazası tələb etmir. Dəyişikliklər GitHub-a yazıldığı üçün əvvəlki versiyalar da saxlanılır.

## Məzmun faylları

- `content/site.json` — ana səhifə, haqqımızda, satış və əlaqə məlumatları
- `content/products.json` — məhsullar
- `content/recipes.json` — reseptlər
- `assets/uploads/` — paneldən yüklənən şəkillər

## Yayımdan əvvəl dəyişdirilməli məlumatlar

- `content/site.json` daxilində telefon və e-poçt
- Təsdiqlənmiş satış nöqtələri
- Rəsmi məhsul fotoşəkilləri
- Məhsulların hüquqi/texniki təsvirləri və real tərkib məlumatları

Məhsul şəkli boş saxlananda sayt avtomatik Savor qablaşdırma maketi göstərir. Rəsmi məhsul fotoları hazır olduqda admin panelindən hər dil üçün ayrıca yüklənə bilər.
