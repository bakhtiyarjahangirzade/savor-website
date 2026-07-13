# Savor sitesi — yönetim ve developer teslim notu

## Demo yönetim paneli

Panel adresi: `/admin/`

Bu GitHub Pages sürümü müşteri önizlemesi içindir. İlk açılışta ana admin hesabı oluşturulur. Sonraki girişlerde e-posta ve şifre istenir.

Panelde:

- Ana sayfa, hakkımızda ve satış noktaları metinleri AZ / RU / EN olarak düzenlenebilir.
- Ürün ve tarif eklenebilir, silinebilir ve üç dilde düzenlenebilir.
- Her dil için farklı görsel yüklenebilir; görsel kırpılabilir, döndürülebilir, yakınlaştırılabilir ve çevrilebilir.
- Ana admin başka adminler ekleyebilir, kapatabilir veya silebilir.
- İçerik ve admin işlemleri loglanır; logları yalnızca ana admin silebilir.
- Tüm içerik tek JSON yedeği olarak dışa aktarılabilir ve yeniden içe alınabilir.

## Önemli demo sınırı

Bu sürümde adminler, loglar ve panelden kaydedilen içerikler tarayıcıdaki IndexedDB içinde tutulur. Bu nedenle:

- Değişiklikler yalnızca aynı alan adında ve aynı tarayıcı profilinde görünür.
- Başka bilgisayara taşımak için paneldeki “Yedek” bölümünden JSON dışa aktarılmalıdır.
- Bu yapı gerçek üretim güvenliği veya ortak çalışan adminler için backend yerine geçmez.

Bu sınır müşteri onay demosu için bilinçli olarak seçilmiştir.

## Hosting / domain teslimi

Deploy edilecek kök klasör `savor-site` klasörüdür. Statik hosting üzerinde doğrudan çalışır; derleme adımı yoktur.

Kalıcı üretim yönetimi eklenirken arayüzün yeniden yazılması gerekmez. `cms-local.js` içindeki veri metotları gerçek API/veritabanı ile değiştirilir:

- `authenticate`, `logout`, `sessionUser`
- `users`, `createAdmin`, `updateAdmin`, `deleteAdmin`
- `document`, `saveDocument`, `importContent`, `exportContent`
- `logs`, `deleteLog`, `clearLogs`

Mevcut içerik şemaları şunlardır:

- `content/site.json`
- `content/products.json`
- `content/recipes.json`

Panelden alınan JSON yedeğinin `documents` alanı aynı yapıyı kullanır. Yüklenen/kırpılan görseller demo yedeğinde data URL olarak bulunur; üretimde bunlar dosya depolamasına yüklenip URL ile değiştirilmelidir.

`admin.html` eski bağlantılar için yalnızca `/admin/` adresine yönlendirme yapar. Eski PagesCMS yapılandırması üretimde kullanılmak zorunda değildir.
