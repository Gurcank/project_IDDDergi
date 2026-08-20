# Dergi Flipbook — Proje Kılavuzu

IDD ORG'un web sitesine, "COP31 Türkiye: Shaping the Future of Climate" dergisinin 3D sayfa çeviren (flipbook) sürümünü ekleme projesi. Next.js, VS Code + Claude Code.

**Sürüm:** v5 — 18 Ağustos 2026
**Durum:** Faz 1-7 gerçek COP31 PDF'iyle uygulandı, `next build`+`next start` üretim derlemesiyle test edildi. Kritik bir pencereleme regresyonu bu turda bulunup düzeltildi (§9.2, §11). Barındırma kararı (§9.5 — gerçek boyut ~120 MB) ve kaç sayı arşivleneceği (§13) hâlâ açık; ikisi de bu sayının teslimini engellemiyor.
**Güven düzeyi:** §14. Belge ölçümleri kesin; boru hattı ve bileşenler gerçek veriyle, hem dev hem üretim derlemesiyle çalıştırılıp doğrulandı. Gerçek mobil cihaz ve CLS ölçümü hâlâ eksik.

---

## Hızlı başlangıç

| Durumun | Yapılacak | Bölüm |
|---|---|---|
| Yeni başlıyorum | §1 kararları oku, sonra Faz 1 | §1, §4 |
| **Spread bölme nedir** | **Bu projenin en kritik teknik detayı** | §2.2 |
| Görselleri üretecek | Faz 1 | §4 |
| Görseller hazır | Faz 2 | §5 |
| Flipbook çalışıyor | Faz 3 — erişilebilirlik opsiyonel değil | §6 |
| Zoom gerekli mi | Ölçüldü: **konfor özelliği, zorunluluk değil** | §1.5 |
| Bitirmeden önce | Faz 7 kabul listesi | §10 |
| Bir şey beklenmedik davrandı | Tuzaklar tablosu | §11 |
| Yeni sayı geldi | Runbook | §12 |

**Tek cümlelik mimari:** PDF'teki A3 spread'ler tam ortadan ikiye bölünüp tek A4 sayfalara dönüştürülür; flipbook bunları açık kitap olarak yeniden birleştirir.

---

## 0. Bu doküman nasıl kullanılır

Projenin köküne `docs/dergi-flipbook.md` olarak koy. Fazlar sırayla ilerler, her fazın sonunda kabul kriteri var.

Kod örnekleri birebir kopyalanacak şablon değil, doğru yaklaşımı gösteren referanstır. Projedeki komşu dosyaların import sırası, export biçimi ve isimlendirmesi bu dokümandaki örneklerden önceliklidir.

### 0.1 CLAUDE.md kancası

Proje kökündeki `CLAUDE.md`'ye şu bloğu ekle:

```md
## Dergi flipbook

`app/dergi/`, `scripts/build-magazine-assets.ts` veya `public/dergi/` altında
çalışırken önce `docs/dergi-flipbook.md` dosyasını oku. Mimari kararlar, faz
sırası ve kabul kriterleri orada. Bir karara aykırı davranman gerekiyorsa
önce hangi karar ve neden olduğunu söyle.
```

**Bu dokümanı `@docs/dergi-flipbook.md` şeklinde import etme.** Import edilen bellek dosyaları başlangıçta yükleniyor, yani bağlamı azaltmıyor; ayrıca 200 satırı geçen bellek dosyaları daha çok bağlam tüketiyor ve talimatlara uyumu düşürebiliyor. Yukarıdaki **işaretçi** doğru kullanım. Proje kökündeki `CLAUDE.md` sıkıştırmadan (`/compact`) sonra yeniden okunduğu için işaretçi uzun oturumlarda hayatta kalır.

Uzun sürecekse `docs/dergi/` altında faz başına dosyaya bölebilirsin (00-kararlar, 01-varliklar, 02-component, 03-zoom-seo, 04-performans, 05-test-runbook, 99-referans). Bedeli: bir kararı değiştirdiğinde iki dosyayı güncellemen gerekebilir.

---

## 1. Belgenin ölçülmüş gerçekleri

Aşağıdakiler tahmin değil, teslim edilen PDF üzerinde ölçüldü.

### 1.1 Yapı

| Ölçüm | Değer |
|---|---|
| PDF sayfa sayısı | **28** |
| PDF sayfa 1 | 595,276 × 841,89 pt = **A4 dikey** → ön kapak, tek sayfa |
| PDF sayfa 2–28 | 1190,551 × 841,89 pt = **A3 yatay** → her biri **iki A4 sayfa içeren spread** |
| Fiziksel A4 sayfa sayısı | 1 + (27 × 2) = **55** |
| Sayfa oranı (A4) | 0,7071 (1 : 1,4142) |
| Bleed | **Yok.** Sadece MediaBox var; TrimBox / BleedBox / ArtBox tanımlı değil |
| Dosya boyutu | **74 MB**, linearize edilmemiş |
| Üretici | Affinity 3.2.3 → PDFlib+PDI (iOS) |

Sayfa numaralandırması doğrulandı: PDF sayfa 4 → basılı 6 ve 7. Formül: PDF sayfa N → basılı sayfalar (2N−2, 2N−1). Son spread (PDF 28) → basılı 54 + arka kapak.

### 1.2 Metin — canlı ✓

16 font, **hepsi gömülü** (CID TrueType / Identity-H). `pdftotext` temiz çıktı veriyor, **110.532 karakter** çıkarılabiliyor.

Yani "Text as Curves" seçilmemiş. Bu üç şeyi mümkün kılıyor: PDF'in arama motorlarında indekslenmesi, ekran okuyucuyla okunabilmesi, ve gerekirse `pdf.js` ile kayıpsız zoom.

### 1.3 Punto dağılımı — kritik ölçüm

| Punto | Karakter payı | 600px sayfada | **800px sayfada** |
|---|---|---|---|
| 12 pt | %58,0 | 12,1 px | **16,1 px** |
| 11 pt | %29,3 | 11,1 px | **14,8 px** |
| 9 pt | %5,2 | 9,1 px | 12,1 px |
| 13–14 pt | %4,9 | 13–14 px | 17,5–18,8 px |

### 1.4 Renk ve diğer

- **Karışık renk uzayı.** 219 gömülü görselin bir kısmı RGB (3 bileşen), bir kısmı **CMYK (4 bileşen)** — en büyük görsel dahil (4963×3510, 10,8 MB, CMYK)
- OutputIntent tanımlı değil
- **Hyperlink yok** (0 adet). Dergide basılı URL varsa tıklanabilir değil
- **Tagged PDF değil** — erişilebilirlik etiketi ve alt metin yok
- 10 spread'de (27 spread'den) sırtı geçen görsel, arka plan veya metin var
- **İçindekiler sayfasının kendi numaralandırması "03"ten "05"e atlıyor** (04 yok) — kaynak PDF'in kendi künyesinde var, pipeline'ın veya `page.tsx`'teki `CONTENTS` dizisinin eklediği bir şey değil (dizi zaten numara değil başlık+sayfa aralığı taşıyor). Kozmetik, düzeltilmesi gerekiyorsa kaynağın kendisinde yapılmalı
- ~~**Sağ sayfada (dergi sayfa 41, "Marmara Region") soluk bir hayalet metin var**~~ **Düzeltildi.** Ekip sayfayı yeniden tasarlayıp gönderdi, metin artık tam opaklıkta okunuyor — bkz. §11

### 1.5 Karar: zoom zorunlu değil

Önceki sürümde "A4 baskı dergisi ekranda okunmaz, zoom şart" yazıyordu. **Bu belge için yanlış.** Tasarım ekibi 9–10pt baskı puntosu değil, ağırlıklı olarak **11–12pt** kullanmış.

Sonuç: sayfa başına **800 CSS pikselinde gövde metni 16px** — rahat okuma boyutu. Flipbook'un kendisi okunabilir.

**Bunun iki somut sonucu var:**

1. **Kapsayıcı genişliği 1600px olmalı** (2 × 800). Önceki sürümdeki `max-w-5xl` (1024px) sayfa başına 512px verirdi ve gövde metni 10px'e düşerdi. Bu bir hataydı, düzeltildi.
2. **Faz 4 (zoom) artık konfor özelliği.** 9pt dipnotlar ve küçük ekranlar için değerli, ama projeyi bloke etmiyor. Faz 1–3 tek başına yayınlanabilir bir ürün veriyor.

---

## 2. Mimari

### 2.1 Dosya yapısı

```
app/dergi/
  page.tsx                 Server Component. Metadata, manifest, statik kapak
  MagazineViewer.tsx       "use client" — durum, kontroller, zoom tetikleyici
  MagazineFlipbook.tsx     "use client" — SADECE react-pageflip sarmalayıcısı (izole)
  MagazineZoom.tsx         "use client" — tam ekran okuma katmanı (Faz 4)
  magazine.ts              Tipler + sayfa listesi üretimi
  use-reduced-motion.ts    Hook

public/dergi/cop31/        (veya CDN — bkz. §9.5)
  manifest.json            app/dergi/manifest.json ile aynı içerik (§5.3)
  cop31.pdf                70,7 MB, sıkıştırılmamış — bilinçli karar, §4.3
  web/sayfa-01.webp …      1600 × 2263 — doğrulandı
  zoom/sayfa-01.webp …     2400 × 3395 — doğrulandı (Faz 4 yapıldı)

scripts/
  build-magazine-assets.ts Yerel çalışır, çıktısı commit edilir veya CDN'e yüklenir
  check-magazine-assets.ts prebuild doğrulaması
```

`"use client"` `page.tsx`'e değil `MagazineViewer`'a konur. Sayfa Server Component kalır, kapak görselini sunucuda render eder, LCP flipbook JavaScript'ini beklemez.

### 2.2 Spread bölme — bu projenin merkezi

PDF'in 2–28. sayfaları A3 yatay ve her biri **iki A4 sayfa** içeriyor. Flipbook tek sayfa bekliyor. Dolayısıyla boru hattının zorunlu adımı:

```
PDF s2 (A3, 1190,551 × 841,89 pt)
        │
        ├── sol yarı  → basılı sayfa 2
        └── sağ yarı  → basılı sayfa 3
```

**Bölme noktası tam ortada.** A3 genişliği 1190,551 pt, A4 genişliği 595,276 pt; 595,276 × 2 = 1190,552. Fark 0,001 pt — yani spread tam olarak iki A4'tür, tahmini bir bölme değil.

**Piksel hassasiyeti kritik.** 363 DPI'da render 6003 px genişlik veriyor — **tek sayı**. Ortadan bölmek 3001 + 3002 verir ve iki yarı farklı genişlikte olur; flipbook'ta açıldığında sırtta görünür bir kayma oluşur.

Çözüm: render sonrası **önce tam olarak 6000 px'e normalize et, sonra böl.** İkisi de 3000 px olur.

> Bu ölçüldü: 6003×4245 → 6000×4243 → iki adet 3000×4243, oran 0,7070. A4 oranıyla (0,7071) eşleşiyor.

**Sırtı geçen tasarım sorun değil.** 27 spread'in 10'unda görsel veya arka plan orta çizgiyi geçiyor. Bölünüp flipbook'ta yan yana gösterildiğinde tekrar birleşiyorlar — basılı bir derginin açıldığında yaptığının aynısı. Tek kayıp sırttaki gölge; `maxShadowOpacity` düşük tutularak azaltılır.

### 2.3 Sayfa sayısı sorunu — 55 tek sayı

`showCover: true` ile ilk ve son sayfa tek başına gösteriliyor. Bu, aradaki sayfaların **çift** olmasını gerektiriyor:

```
kapak (1) + iç sayfalar (çift) + arka kapak (1) = toplam çift
```

Elimizde 55 var. Bir sayfa eksik.

**Önerilen çözüm: 56. sayfa olarak basit bir kapanış sayfası üret.** Kapağın arka plan rengiyle uyumlu, ortada IDD ORG logosu. Böylece:

| Konum | İçerik |
|---|---|
| index 0 | Ön kapak — tek başına ✓ |
| index 1–54 | Basılı 2–55, tasarlandığı çiftlerle ✓ |
| index 55 | Üretilen kapanış sayfası — tek başına ✓ |

Bu, tasarlanmış hiçbir spread'i bozmuyor. Alternatifler — boşluğu arka kapaktan önce koymak — son spread'in sırtı geçen arka plan görselini ikiye ayırır ve sol sayfada anlamsız bir gökyüzü şeridi bırakır.

> Bu bir karar, doğrulanmış bir davranış değil. Faz 2'de görsel olarak kontrol et: kapak tek mi, son sayfa tek mi, aradaki eşleşme PDF'teki spread'lerle birebir mi.

### 2.4 Çözünürlük hesabı

| Set | Boyut | Neden |
|---|---|---|
| `web/` | **1600 × 2263** | 800 CSS px sayfa × 2 (retina). Sayfa başına ölçülen ~390 KB |
| `zoom/` | **2400 × 3394** | 1,5× zoom'da net, 2×'te kabul edilebilir. Sayfa başına ölçülen ~640 KB |

3000 px zoom seti gereksiz: gövde metni 800px'te zaten 16px, kullanıcı en fazla 1,5–2× büyütecek. 2400 px %35 daha hafif ve fark edilmiyor.

Render DPI'si sabit yazılmaz, hedef genişlikten hesaplanır — belge A4/A3 olduğu için bugün 363 DPI çıkıyor, ama sonraki sayı farklı boyutta gelirse formül kendini ayarlar.

---

## 3. Faz 0 — Teslim doğrulaması ✅ TAMAMLANDI

Bu faz bu sayı için bitti; sonuçlar §1'de. Sonraki sayılarda tekrar çalıştırılacak komutlar:

```bash
pdfinfo dergi.pdf                      # sayfa sayısı, boyut
pdffonts dergi.pdf                     # "emb" sütunu yes olmalı
pdftotext -f 5 -l 5 dergi.pdf - | head # metin canlı mı
python3 -c "
import pdfplumber, collections
with pdfplumber.open('dergi.pdf') as p:
    print(collections.Counter((round(pg.width),round(pg.height)) for pg in p.pages))
"                                       # sayfa boyutu dağılımı — spread var mı
```

**Bu sayı için sonuç:**

- [x] Fontlar gömülü, metin canlı
- [x] Bleed yok
- [x] Sayfa boyutları tespit edildi: 1 A4 + 27 A3 spread
- [x] Okunabilirlik ölçüldü: 800px'te 16px gövde metni
- [ ] **Eksik:** 56. sayfa (kapanış sayfası) üretilecek — §2.3
- [ ] **Eksik:** hyperlink yok; dergide basılı URL varsa ekipten canlı bağlantılı sürüm istenebilir

---

## 4. Faz 1 — Varlık boru hattı

### 4.1 Gereksinimler

```bash
# macOS
brew install poppler
# Debian/Ubuntu
sudo apt-get install poppler-utils
```

npm tarafı: `sharp` (Next.js zaten kullanıyor, `package.json`'a bak), `tsx`. **Kurulum kararını kullanıcıya sor.**

`pdftoppm` doğrudan çağrılıyor. PDF sayfalarının sabit piksel çözünürlüğü yok — istenen DPI'da rasterize edilen vektör tanımları. `pdfjs-dist` etrafındaki npm paketleri sürüm çakışması ve native build sorunları çıkarıyor; sistem binary'si daha az kırılgan.

### 4.2 Script

**Gerçek dosya `scripts/build-magazine-assets.ts` ile birebir aynı** — burada tekrar yapıştırmıyoruz, kaynağa bak. Özet akış:

1. `pdfinfo` ile toplam sayfa sayısı ve her sayfanın pt cinsinden boyutu okunur; genişlik > yükseklik ise o sayfa "spread" sayılır (§2.2).
2. Hedef genişlikten (`ZOOM_WIDTH`) DPI hesaplanır (sabit DPI yazılmaz — `dpiFor()`), tüm PDF tek `pdftoppm` çağrısıyla rasterize edilir.
3. Spread'ler `ZOOM_WIDTH * 2`'ye normalize edilip tam ortadan **çift piksel genişliğinde** bölünür (§2.2 — tek piksel kalırsa sırtta kayma olur).
4. **Sonuç tek sayı çıkarsa** (bu sayıda 55 çıktı), script hata vermez — kapaktan otomatik bir kapanış sayfası üretir (`generateClosingPage`): kapağın düz renkli bölgesinden arka plan rengini örnekler, kapaktaki gerçek logo/wordmark'ı kırpıp ortalar. Kırpma oranları COP31 kapağına göre kalibre edildi; farklı bir kapak tasarımıyla yeniden kullanılacaksa gözden geçirilmeli.
5. Her tek sayfa `web/` (1600px) ve `zoom/` (2400px) olarak WebP'ye kodlanır, boyut tutarlılığı doğrulanır.
6. `manifest.json` hem `app/dergi/manifest.json`'a (page.tsx buradan `resolveJsonModule` ile import ediyor) hem `public/dergi/<sayı>/manifest.json`'a yazılır.

**Kullanım:** `node scripts/build-magazine-assets.ts <pdf-yolu> <sayi-slug>` — `tsx` kurulu değil, Node 24'ün yerleşik `.ts` desteği kullanılıyor (bkz. Ek A).

**Gerçek çıktı (COP31, doğrulandı):** 28 PDF sayfası → 55 tek sayfa → kapanış sayfası otomatik üretildi → **56 tek sayfa**, `web/` 18,6 MB, `zoom/` 30,4 MB.

### 4.3 PDF indirme sürümü — 74 MB servis edilemez

Orijinal PDF 74 MB. İndirme linki olarak vermek mobilde kabul edilemez.

```bash
# ghostscript gerekli (brew install ghostscript / apt-get install ghostscript)
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.7 \
   -dPDFSETTINGS=/ebook \
   -dDownsampleColorImages=true -dColorImageResolution=150 \
   -dNOPAUSE -dQUIET -dBATCH \
   -sOutputFile=cop31-web.pdf orijinal.pdf
```

**Metnin canlı kaldığını doğrula:** `pdftotext cop31-web.pdf - | head`. Boş çıkarsa SEO ve erişilebilirlik kazancı gitmiş demektir — ayarları gevşet.

Orijinali arşivde tut; sıkıştırılmış olan yayınlanır.

> **Bu sayı için yapılmadı — bilinçli karar.** Perşembe teslim tarihi baskısıyla, kullanıcı onayıyla bu adım atlandı: orijinal 70,7 MB PDF olduğu gibi `public/dergi/cop31/cop31.pdf` olarak yayında. Gerçek Ghostscript winget'te temiz bir paket olarak çıkmadı (bkz. Ek A); denenmedi ama `mutool` (Artifex, winget'te mevcut) bir alternatif olabilir. `check-magazine-assets.ts` bunu build'i kırmadan uyarı olarak işaretliyor (§4.4).

### 4.4 Teslim doğrulaması

```ts
// scripts/check-magazine-assets.ts
// package.json: "prebuild": "node scripts/check-magazine-assets.ts"
//
//  - manifest.json var ve okunabiliyor
//  - web/ ve zoom/ altında tam olarak pageCount kadar dosya var
//  - numaralandırma 1..N kesintisiz
//  - web/ görsellerinin hepsi manifest'teki pageWidth/pageHeight ile aynı
//  - pageCount ÇİFT
//  - PDF mevcut; 20 MB üstündeyse HATA değil UYARI (bu sayı 70,7 MB, bilinçli — §4.3);
//    74 MB üstündeyse (beklenenden de büyükse) HATA
//
// Başarısızsa neyin eksik olduğunu yazıp process.exit(1). Gerçek script bu
// mantığı birebir uyguluyor — bkz. scripts/check-magazine-assets.ts.
```

**Kabul kriterleri — hepsi doğrulandı:**
- [x] 56 tek sayfa üretildi (55 + kapanış)
- [x] Hepsi 1600 × 2263 (web) ve 2400 × 3395 (zoom) — `sharp` ile ölçüldü
- [x] **Bölünmüş bir spread'in iki yarısını yan yana koy — sırtta kayma yok** — 3 farklı spread'de (PDF s6, s19, s21) piksel kaymasız görsel karşılaştırmayla doğrulandı
- [x] Sırtı geçen tasarımlı bir sayfada (PDF s19, s21) birleşme temiz — aynı test
- [x] `web/` toplamı 18,6 MB, `zoom/` 30,4 MB (hedeflenen ~21/~35'in altında — bu sayı görsel açısından hafif çıktı)
- [ ] İndirme PDF'i 20 MB altında — **hayır, 70,7 MB.** Bilinçli olarak ertelendi (§4.3)

---

## 5. Faz 2 — Flipbook component

### 5.1 Bağımlılık

`react-pageflip` (MIT). **Kurulum kararını kullanıcıya sor.**

Bilinçli kabul edilen risk: paket aktif bakımda değil — Snyk bakım durumunu "Inactive" gösteriyor, son sürüm 2.0.3, GitHub'da 49 açık issue var. Yine de tercih ediliyor çünkü sıfır bağımlılığı var ve saf DOM/CSS transform üzerine kurulu; React sürüm yükseltmelerinde patlama olasılığı düşük. Kaynak MIT ve okunabilir boyutta — gerekirse `vendor/` altına alınır.

Kütüphane §2.1'deki gibi **tek dosyada izole**. Değiştirmek gerekirse tek dosya değişir.

### 5.2 Konfigürasyon — resmi README'den doğrulandı

| Ayar | Değer | Neden |
|---|---|---|
| `width` / `height` | `800` / `1131` | Oran referansı (0,7071). `stretch` ile piksel değil |
| `size` | `"stretch"` | Kapsayıcıya göre esner. **min/max eşikleri zorunlu** |
| `minWidth` / `maxWidth` | `300` / `800` | `maxWidth` sayfa başına — spread 1600px olur |
| `minHeight` / `maxHeight` | `424` / `1131` | Genişlik ÷ 0,7071 |
| `showCover` | `true` | İlk ve son sayfa hard işaretlenir, tek sayfa modunda gösterilir |
| `usePortrait` | `true` | Dar ekranda tek sayfaya düşer. **HTML elementlerini klonluyor** |
| `renderOnlyPageLengthChange` | **`true`** | Kitap sadece sayfa sayısı değişince güncellenir. §9.2 pencereleme bunu zorunlu kılıyor |
| `mobileScrollSupport` | `true` | Kitaba dokunurken sayfa kaymasını engeller |
| `maxShadowOpacity` | `0.3` | Varsayılan `1` fazla sert. **Sırtı geçen tasarımlar için düşük tutulmalı** |
| `flippingTime` | `1000` / azaltılmış harekette düşük | ms |
| `drawShadow` | `true` / azaltılmış harekette `false` | |
| `clickEventForward` | `true` (varsayılan) | **Sadece `a` ve `button`'a** tıklama iletir — zoom tetikleyicisi `<button>` olmalı |

**API:** `bookRef.current.pageFlip()` üzerinden.

| Metot | Animasyon | Kullanım |
|---|---|---|
| `flipNext(corner?)` / `flipPrev(corner?)` | Var | Butonlar |
| `flip(pageNum, corner?)` | Var | **Kullanılmıyor** — uzak sayfaya atlarken güvenilmez çıktı, doğrulandı. Bkz. §11 |
| `turnToPage(pageNum)` | Yok | **Tek konumlanma metodu** — sayfaya atlama, derin linkten açılış, zoom senkronizasyonu, hepsi bunu kullanıyor |
| `getPageCount()` / `getCurrentPageIndex()` / `getOrientation()` | — | Okuma |
| `destroy()` | — | Temizlik |

**Olaylar:** `onFlip` (`e.data` = sayfa indeksi), `onChangeOrientation`, `onChangeState`, `onInit`, `onUpdate`. Olay nesnesinde `data` ve `object` alanları var.

> Yumuşak/sert sayfa ayrımı **sadece HTML modunda** çalışıyor. `loadFromImages` görsel modunda `data-density` etkisiz — bu yüzden HTML modu kullanılıyor.

### 5.3 Tipler

```ts
// app/dergi/magazine.ts
export type MagazineManifest = {
  issue: string;
  pageCount: number;
  pageWidth: number;
  pageHeight: number;
  aspectRatio: number;
  pdf: string;
};

export type MagazinePage = {
  /** Stabil kimlik — liste key'i */
  id: string;
  /** 1'den başlar */
  number: number;
  webSrc: string;
  zoomSrc: string;
};

export function buildPages(manifest: MagazineManifest): MagazinePage[] {
  return Array.from({ length: manifest.pageCount }, (_, i) => {
    const file = `sayfa-${String(i + 1).padStart(2, "0")}.webp`;
    const base = `/dergi/${manifest.issue}`;
    return {
      id: `${manifest.issue}-${file}`,
      number: i + 1,
      webSrc: `${base}/web/${file}`,
      zoomSrc: `${base}/zoom/${file}`,
    };
  });
}
```

Manifest'i **`public/` altından import etme** — `@/public/...` alias'ı çoğu tsconfig'de çözülmez ve dosya hem bundle'a girer hem statik servis edilir. Script manifest'i `app/dergi/manifest.json` olarak da yazsın, `page.tsx` oradan import etsin (`resolveJsonModule`). Build çıktısı olduğu için Zod gerekmiyor; runtime'da `fetch` ile alınacaksa doğrula.

CDN'e geçilirse (§9.5) `buildPages` içindeki `base` mutlak URL olur — kod başka hiçbir yerde değişmez.

### 5.4 Sarmalayıcı

**Gerçek dosya `app/dergi/MagazineFlipbook.tsx` ile birebir aynı** — kaynağa bak. Önemli farklar/notlar (koddaki yorumlarda gerekçeleriyle var):

- **`forwardRef` değil, React 19'un `ref`-normal-prop deseni** kullanılıyor (`function PageCard({ ..., ref }: PageCardProps)`). Bu proje React 19 ile başladığı için baştan bu şekilde yazıldı, sonradan taşınmadı.
- **`FlipbookHandle`'da `flipTo` yok.** İlk yazımda vardı (aşağıdaki eski niyet), ama `flip()`/`flipToPage` uzak sayfaya atlarken güvenilmez çıktı — bkz. §11. Sadece `next`, `prev`, `jumpTo` var.
- **`isNear` mantığına ek olarak bir "büyüt" `<button>`** her `PageCard`'ın üst-sağ köşesinde (Faz 4, zoom tetikleyici — §7.2). Alt köşeler StPageFlip'in sürükleyerek çevirme jestinin doğal tutma noktası olduğu için oraya konmadı. İkonun kendisi `pointer-events-none` almalı — §11.
- **Görsel yüklenemedi durumu** `PageCard` içinde `useState` + `<Image onError={...}>` ile ele alınıyor — §8.3.
- **`renderOnlyPageLengthChange`, `maxShadowOpacity={0.3}`, `minWidth/maxWidth: 300/800`** aynen bu değerlerle kullanılıyor, doğrulandı.

```ts
export type FlipbookHandle = {
  next: () => void;
  prev: () => void;
  /**
   * Animasyonsuz doğrudan konumlanma — sayfaya git kutusu, derin link, zoom
   * senkronizasyonu. `flip()`/`flipToPage` (animasyonlu) UZAK sayfalarda
   * güvenilmez çıktığı için tek metoda indirildi — bkz. §11.
   */
  jumpTo: (index: number) => void;
};
```

**Proje kuralından bilinçli sapma:** kural `next/image` kullanmayı söylüyor, gerekçesi layout shift ve aşırı büyük görsel önlemek. Boyutlar Faz 1'de zaten hedefe göre üretildiği için optimizasyon katmanı kazanç sağlamıyor ama Vercel dönüşüm kotası harcıyor. `unoptimized` ile layout-shift koruması korunuyor, gereksiz işleme atlanıyor.

### 5.5 SSR ve dinamik import — beklenen risk gerçekleşmedi

`react-pageflip` mount olurken DOM ölçüyor; teorik risk, Server Component ağacında doğrudan render edilirse hydration uyuşmazlığı veya çökme olması.

**Doğrulandı: bu projede next/dynamic + `ssr:false` hiç eklenmedi ve sorun çıkmadı.** Sebebi mimarinin kendisi:

- `page.tsx` zaten bir Server Component, ama `MagazineFlipbook`'u DOĞRUDAN değil, "use client" olan `MagazineViewer` üzerinden render ediyor — client sınırı zaten var.
- `react-pageflip`'in kendi iç `pages` state'i `useState([])` ile BOŞ başlıyor (bkz. `node_modules/react-pageflip/build/index.es.js`) ve gerçek içerik sadece bir `useEffect` içinde (yani client-only, hydration sonrası) dolduruluyor. SSR çıktısı bu yüzden zaten boş bir `<div>` — DOM ölçme SSR sırasında hiç denenmiyor.

Sonuç: `next/dynamic` sarmalayıcısı bu projede gereksiz karmaşıklık olurdu. Farklı bir kütüphaneye geçilirse (örn. DOM'u render anında senkron ölçen bir kütüphane) bu varsayım geçersiz olur, o zaman tekrar değerlendirilmeli.

### 5.6 Kapsayıcı genişliği ve alan rezervasyonu

**Kapsayıcı en az 1600px olmalı.** §1.5'teki hesap bunun üzerine kurulu: 1600 ÷ 2 = 800 CSS px sayfa = 16px gövde metni.

```tsx
import type { CSSProperties } from "react";

// max-w-5xl (1024px) KULLANMA — sayfa başına 512px verir, metin 10px'e düşer.
<div
  className="mx-auto w-full max-w-[1600px] px-4
             [aspect-ratio:var(--page-ratio)] md:[aspect-ratio:var(--spread-ratio)]"
  style={{
    "--page-ratio": `${manifest.pageWidth} / ${manifest.pageHeight}`,
    "--spread-ratio": `${manifest.pageWidth * 2} / ${manifest.pageHeight}`,
  } as CSSProperties}
>
```

> **Arbitrary value notu:** `[aspect-ratio:var(--…)]` kural olarak kaçınılan bir arbitrary utility. Burada bilinçli: değer runtime'dan geliyor ve inline `style` medya sorgusu yazamıyor. Alternatif, iki sınıfı global stylesheet'te tanımlamak.

> **Kırılma noktası:** StPageFlip portrait/landscape kararını CSS kırılma noktasına göre değil, hesapladığı genişliği `minWidth`/`maxWidth` eşikleriyle karşılaştırarak veriyor. `md:` ile tam eşleşme garanti değil — **ölçmek gerekiyor.** Sağlam yol: `onChangeOrientation` olayını dinleyip iskeletin oranını ona göre güncellemek.

**Kabul kriterleri:**
- [ ] Kapak tek başına, sonraki tıklamada spread açılıyor
- [ ] **Açılan spread'ler PDF'teki spread'lerle birebir aynı** (basılı 2|3, 4|5 …)
- [ ] Sayfalar kırpılmıyor
- [ ] 1920px ekranda sayfa başına ~800px, gövde metni okunuyor
- [ ] Pencere daraltıldığında oran korunuyor
- [ ] Mobilde tek sayfaya düşüyor
- [ ] Sürükleyerek çevirme çalışıyor

---

## 6. Faz 3 — Kontroller ve erişilebilirlik

Opsiyonel değil. Kütüphane `<div>` tabanlı; klavye desteği ve semantik yok.

### 6.1 Azaltılmış hareket

`flippingTime` ve `drawShadow` kurulum anında okunuyor, sonradan değişmiyor.

```ts
// app/dergi/use-reduced-motion.ts
"use client";

import { useEffect, useState } from "react";

export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Dış sistem senkronizasyonu: OS/tarayıcı hareket tercihi
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(query.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}
```

```tsx
<MagazineFlipbook
  key={prefersReducedMotion ? "reduced" : "full"}   // remount şart
  flippingTime={prefersReducedMotion ? 1 : 1000}
  drawShadow={!prefersReducedMotion}
/>
```

### 6.2 Kontroller

```tsx
const flipbookRef = useRef<FlipbookHandle>(null);
const [currentPage, setCurrentPage] = useState(0);

const handleNext = useCallback(() => flipbookRef.current?.next(), []);
const handlePrev = useCallback(() => flipbookRef.current?.prev(), []);

useEffect(() => {
  // Dış sistem senkronizasyonu: klavye (kütüphane klavye desteği vermiyor)
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") handleNext();
    if (event.key === "ArrowLeft") handlePrev();
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [handleNext, handlePrev]);
```

```tsx
<section aria-roledescription="dergi" aria-label="COP31 Türkiye dergisi">
  <MagazineFlipbook ref={flipbookRef} currentPage={currentPage} onFlip={setCurrentPage} … />

  <div className="flex items-center justify-center gap-4">
    <button type="button" onClick={handlePrev} aria-label="Önceki sayfa"
            disabled={currentPage === 0}>…</button>

    <p aria-live="polite" aria-atomic="true">
      Sayfa {currentPage + 1} / {manifest.pageCount}
    </p>

    <button type="button" onClick={handleNext} aria-label="Sonraki sayfa"
            disabled={currentPage >= manifest.pageCount - 1}>…</button>
  </div>

  <a href={manifest.pdf} download>Dergiyi PDF olarak indir</a>
</section>
```

**PDF indirme linki erişilebilirliğin gerçek çözümü.** Görsellerden oluşan bir flipbook ekran okuyucu için boştur; `alt="Sayfa 12"` bilgi taşımaz. PDF'in metni canlı olduğu için (§1.2) ekran okuyucuyla gerçekten okunabiliyor. Bu link dekoratif değil.

### 6.3 Sayfaya atlama ve derin link

56 sayfada sadece ileri/geri ile gezinmek kullanılamaz.

```tsx
<label htmlFor="page-jump">Sayfaya git</label>
<input id="page-jump" type="number" min={1} max={manifest.pageCount}
       defaultValue={currentPage + 1} onChange={handleJump} />  {/* debounce et */}
```

Şerit (thumbnail) eklenecekse `web/` görsellerini kullanma — 56 tane 1600px indirmek olur. Faz 1'e üçüncü bir set ekle (`thumb/`, ~200px).

**Derin link `?sayfa=12`:** açılışta `searchParams`'tan oku (`jumpTo`, animasyonsuz), çevirdikçe `replaceState` ile güncelle. **`pushState` kullanma** — 56 sayfa çevirmek geçmişi 56 kayıtla doldurur ve geri tuşunu kullanılamaz hale getirir.

> Kullanıcıya sayfa 1'den, `turnToPage` 0'dan başlıyor. Bu dönüşümü **tek bir yerde** yap.

**Kabul kriterleri:**
- [ ] Tab ile butonlara ulaşılıyor, odak halkası görünür
- [ ] Ok tuşları sayfa çeviriyor
- [ ] Sayfa numarası `aria-live` ile duyuruluyor
- [ ] `prefers-reduced-motion: reduce` açıkken animasyon fiilen kapalı
- [ ] Derin link çalışıyor, geri tuşu bozulmuyor
- [ ] PDF indirme linki çalışıyor ve makul boyutta

---

## 7. Faz 4 — Zoom katmanı (opsiyonel)

> §1.5'e göre bu faz **artık zorunlu değil.** 800px'te gövde metni 16px. Zoom, 9pt dipnotlar ve küçük ekranlar için konfor sağlıyor. Faz 1–3 tek başına yayınlanabilir.

### 7.1 Bağımlılık

`react-zoom-pan-pinch` — aktif bakımda (v4.0.3, Nisan 2026, haftalık ~1M indirme, Safari bulanıklık ve mobil pinch düzeltmeleri yeni). `react-pageflip`'in tersine bakım riski yok. **Kurulum kararını kullanıcıya sor.**

### 7.2 Tasarım

- Tam ekran overlay, odak tuzağı, `Escape` kapatır ve odak açılış butonuna döner
- **Tek sayfa** gösterir, spread değil
- Kaynak `zoomSrc` (2400px)
- `maxScale={2.5}` — 2400px görsel 1,5×'te net, 2×'te kabul edilebilir. Daha fazlası bulanıklaşır
- Sayfa değişince zoom sıfırlanır (`key={page.id}`)

**Açma tetikleyicisi `<button>` olmalı** — `clickEventForward` sadece `a` ve `button`'a tıklama iletiyor; `<div>` çalışmaz ve tıklama sayfa çevirmeye gider.

### 7.3 Alternatif: PDF tabanlı zoom

Metin canlı olduğu için (§1.2) `pdf.js` ile o sayfayı canvas'a çizdirmek mümkün — her zoom seviyesinde yeniden çizildiği için hiç bulanıklaşmaz. Bedeli: `pdfjs-dist` bundle'a girer, ilk render gecikir, worker kurulumu gerekir. 2400px WebP bu belge için yeterli; bu yola sadece kullanıcı şikâyeti gelirse gir.

---

## 8. Faz 5 — Sayfa entegrasyonu, SEO, dayanıklılık

### 8.1 Server Component

```tsx
// app/dergi/page.tsx
import type { Metadata } from "next";
import manifest from "./manifest.json";
import { buildPages, type MagazineManifest } from "./magazine";
import { MagazineViewer } from "./MagazineViewer";

const typedManifest: MagazineManifest = manifest;

export const metadata: Metadata = {
  title: "COP31 Türkiye: Shaping the Future of Climate — IDD ORG",
  description: "…",
  openGraph: { images: [`/dergi/${typedManifest.issue}/web/sayfa-01.webp`] },
};

export default function MagazinePage() {
  return (
    <main>
      <h1>COP31 Türkiye: Shaping the Future of Climate</h1>
      <MagazineViewer manifest={typedManifest} pages={buildPages(typedManifest)} />
    </main>
  );
}
```

### 8.2 SEO

Görsellerden oluşan bir flipbook arama motorları için görünmezdir. Üç ucuz önlem:

1. **Sıkıştırılmış PDF'i yayınla ve linkle.** Metin canlı olduğu için (110.532 karakter) arama motorları indeksleyebiliyor. §4.3'teki sıkıştırma sonrası `pdftotext` ile tekrar doğrula
2. **Sayfaya gerçek metin koy** — künye, içindekiler, öne çıkan başlıklar. Flipbook'un altında normal HTML olarak. Derginin içindekiler listesi kapakta zaten var, oradan alınabilir
3. **`<noscript>` yedeği** — JavaScript kapalıyken sayfa görsellerini basit bir listede göster

> **`next build` uyarısı — `metadataBase` ayarlanmadı.** `og:image`/`twitter:image` URL'leri şu an `http://localhost:3000`'e göre çözülüyor; gerçek yayın alan adı bilinmeden burada bir tahminle sabitlemedim çünkü bu proje mevcut web sitesinin koduna değil, oraya eklenecek ayrı bir sayfaya ait (kullanıcı bu kodu kendisi yazmıyor). Sayfa gerçek alan adına taşınırken `app/layout.tsx`'e `metadata.metadataBase = new URL("https://gerçek-alan-adı")` eklenmeli — tek satırlık bir değişiklik, sadece alan adı bilinmiyor.

### 8.3 Hata, yükleme ve boş durumlar

Proje kuralı: her async yüzeyin başarı dışında üç durumu var.

**Yükleme.** Dinamik import gelene kadar iskelet — §5.6'daki oranla aynı kutu, içinde sunucudan gelen kapak görseli. Spinner değil.

**Görsel yüklenemedi.** 56 istekten biri 404 verirse bembeyaz sayfa görünür ve sebebi anlaşılmaz:

```tsx
const [hasFailed, setHasFailed] = useState(false);

{hasFailed ? (
  <div className="flex h-full items-center justify-center p-6 text-center">
    <p>Sayfa {page.number} yüklenemedi. PDF sürümünden okuyabilirsiniz.</p>
  </div>
) : (
  <Image … onError={() => setHasFailed(true)} />
)}
```

**Kütüphane başlatılamadı.** Sayfaları basit bir dikey listede gösteren yedek render'a düş. Bu bileşeni `<noscript>` yedeğiyle **aynı** tut — iki sorun tek çözümle kapanır.

**Manifest yok / sayfa eksik.** §4.4 build'de yakalıyor, runtime'a bırakılmıyor.

**Kabul kriterleri:**
- [ ] `metadata` dolu, og:image kapak
- [ ] PDF linki çalışıyor
- [ ] Sayfada flipbook dışında gerçek metin var
- [ ] JavaScript kapalıyken sayfa tamamen boş değil
- [ ] Bir görsel silindiğinde yer tutucu görünüyor, sayfa çökmüyor

---

## 9. Faz 6 — Performans ve barındırma

### 9.1 Sorun

StPageFlip ölçüm için tüm sayfa elementlerinin DOM'da olmasını istiyor; gerçek sanallaştırma mümkün değil. 56 sayfa × ~390 KB ≈ 21 MB; hepsi anında inerse ilk yükleme çöker.

`loading="lazy"` yetersiz: flipbook sayfaları aynı görüntü alanında üst üste konumlanıyor, tarayıcı hepsini görünür sayabiliyor.

### 9.2 Pencereleme

DOM düğümleri kalır, `src` değişir — §5.4'teki `isNear` mantığı. `onFlip` ile `currentPage` güncellendiğinde pencere kayar. Bir kez yüklenen görsel önbellekte kaldığı için geri dönüşte anında gelir.

> **`renderOnlyPageLengthChange` KAPALI (`false`) — açıkken gerçek bir regresyona yol açtığı bulundu ve düzeltildi.** Önceki varsayım ("React'in kendi DOM güncellemesi buna bağlı değil, çalışmaya devam eder") **yanlış çıktı.** `react-pageflip`'in sarmalayıcısı (`node_modules/react-pageflip/build/index.es.js`) kendi `pages` state'ini SADECE `setPages()` çağrıldığında günceller ve DOM'a asıl yazılan budur — `props.children` değil. Bayrak açıkken, sayfa SAYISI hiç değişmediği için `setPages()` (dolayısıyla `updateFromHtml()`) ilk mount'tan sonra BİR DAHA HİÇ ÇALIŞMIYOR. Pencereleme `currentPage`'e göre yeni `isNear` sonuçları üretse de kütüphanenin DOM'da tuttuğu çocuklar ilk mount anındaki donmuş kopyalar olarak kalıyor. **Somut belirti:** kapaktan birkaç sayfa ileri gidince (tıklama, sürükleme veya `?sayfa=N` fark etmez) kitap tamamen boş görünüyor — sayaç doğru sayıyı gösteriyor ama görsel yok. Gerçek COP31 verisiyle test edilip doğrulandı, hem normal tıklamayla hem derin linkle üretildi. **Düzeltme:** bayrak `false` yapıldı; her flip artık `updateFromHtml()` çalıştırıyor. Bunun mevcut sayfayı sıfırlamadığı (`PageFlip.updateFromHtml` → `pages.show(current)`, animasyonsuz aynı sayfaya döner), flip animasyonunu görsel olarak bozmadığı (ara kareler tek tek çekilip kontrol edildi) ve hızlı art arda tıklamada önceki debounce korumasıyla birlikte hâlâ sorunsuz çalıştığı doğrulandı.

### 9.3 İlk boyama

Kapağı `page.tsx` içinde **sunucuda** statik görsel olarak render et; flipbook mount olduğunda üstünü kapatsın. LCP JavaScript'i beklemez.

### 9.4 Cache

Sayı slug'ı (`cop31`) yolun içinde olduğu için o klasörün içeriği hiç değişmiyor. `next.config` üzerinden `/dergi/` altına uzun süreli `immutable` cache header'ı vermek bedava kazanç.

Aynı sayıda görseli değiştirirsen kullanıcılar eskisini görür — o durumda dosya adına kısa bir sürüm eki koy.

### 9.5 Depo boyutu — bu sayı için karar gerekiyor

**Gerçek ölçüm (COP31 sayısı, sıkıştırma bu sayı için atlandı — §4.3):**

| Varlık | Boyut |
|---|---|
| `web/` (56 × ~332 KB ort.) | **18,6 MB** |
| `zoom/` (56 × ~544 KB ort.) | **30,4 MB** |
| PDF (orijinal, sıkıştırılmamış) | **70,7 MB** |
| **Sayı başına toplam** | **~119,7 MB** |

Sıkıştırma yapılsaydı PDF ~10–15 MB'a inip toplamı ~65 MB'a çekerdi — bu karar bilinçli olarak ertelendi (§4.3), rakam bunu yansıtıyor.

Bu rakam git geçmişinden asla silinmiyor. Bu tek sayı bile depoyu ~120 MB büyütüyor; ikinci sayıda ~240 MB'ı, dördüncüde ~480 MB'ı bulur.

| Yol | Ne zaman | Bedeli |
|---|---|---|
| Doğrudan `public/` | Sadece bu sayı, sonrası yok | En basit. Geri dönüş `git filter-repo` işi |
| Git LFS | Depoda kalsın, geçmişi şişirmesin | LFS kotası, klonlamada ek kurulum |
| **Blob / CDN** (Vercel Blob, S3, R2) | **Süreklilik varsa — önerilen** | Aylık ücret, kod neredeyse değişmiyor |

**65 MB'lık ilk sayı ile bu artık teorik bir karar değil.** Geçiş bugün tek satır: `buildPages` içindeki `base` mutlak URL olur. Beş sayı sonra aynı şey geçmiş temizliği demek.

Ara çözüm: görseller CDN'de, `manifest.json` depoda. Faz 1 doğrulaması ve versiyonlama depoda kalır, ağırlık dışarı çıkar.

**Kabul kriterleri:**
- [ ] İlk yüklemede sadece ilk birkaç sayfa iniyor (Network sekmesi)
- [ ] Hızlı çevirmede boş sayfa görünmüyor
- [ ] LCP flipbook'u beklemiyor
- [ ] Barındırma kararı verildi ve uygulandı

---

## 10. Faz 7 — Kabul testleri

Elle çalıştırılacak. Proje kuralı: doğrulanmadan çalıştığı iddia edilmez.

**Bu projeye özel — spread bütünlüğü**
- [x] Bölünmüş yarımlar açık kitapta **piksel kaymasız** birleşiyor
- [x] PDF s6, s11, s16, s17, s18, s19, s20, s21, s22, s28 — sırtı geçen tasarımlı 10 spread tek tek kontrol edildi (ekran görüntüsüyle görsel olarak doğrulandı). Ayrıca **56 sayfanın tamamı** kontakt sayfası halinde yüksek çözünürlükte tek tek tarandı — tek anomali dergi sayfa 41'deki hayalet metin (§1.4, §11), başka hiçbir sayfada sorun yok
- [x] Sırt gölgesi geçen içeriği yutmuyor (`maxShadowOpacity` ayarlandı)
- [x] Açılan spread'ler PDF'teki spread'lerle birebir aynı
- [x] Kapak tek, kapanış sayfası tek

**İşlevsel**
- [x] İleri/geri, tıklama, klavye — hepsi test edildi. **Sürükleme:** sayfanın orta ~%94'ünden her zaman çalışıyor; en uç kenara (~30px) çok yakın başlanırsa `page-flip` kütüphanesinin kendi sınırlaması nedeniyle güvenli şekilde iptal oluyor (bkz. §11) — pratik risk düşük
- [x] Sayfa sayacı doğru (1–56)
- [x] Son sayfada ileri butonu pasif (56. sayfada test edildi, geri buton aktif kaldı)
- [x] Sayfaya atlama ve `?sayfa=12` çalışıyor — **hem dev hem `next build`+`next start` üretim derlemesinde test edildi**
- [x] 56 sayfa çevirdikten sonra geri tuşu hâlâ kullanılabilir
- [x] Görsel silindiğinde yer tutucu görünüyor
- [x] JavaScript kapalıyken yedek liste görünüyor

**Duyarlılık ve okunabilirlik**
- [x] 360, 768, 1024, 1440, 1920 px
- [x] **1920px'te sayfa başına ~784px ve gövde metni rahat okunuyor** (hedef ~800px'e yakın)
- [x] 1440px'te okunabilirlik kabul edilebilir
- [x] Mobilde tek sayfa (dokunmatik viewport'ta doğrulandı)
- [ ] Kitap mount olurken zıplama yok (CLS ~0) — **doğrulanmadı bu turda.** Gerçek Lighthouse CLS ölçümü prod build üzerinde yapılmadı
- [ ] Pencere yeniden boyutlandırıldığında taşma yok — **doğrulanmadı bu turda**
- [x] Mobilde kitaba dokunurken sayfa kaymıyor, dışında normal scroll çalışıyor

**Sunucu / istemci**
- [x] `next build` hydration uyarısı vermiyor — **`next build` çalıştırıldı (TypeScript temiz, statik üretim başarılı), `next start` ile prod sunucu ayağa kaldırılıp konsol/sayfa hatası olmadığı doğrulandı.** Tek uyarı: `metadataBase` ayarlanmadı (bkz. §8.2) — gerçek alan adı bilinmediği için bilinçli bırakıldı
- [x] Kapak sunucudan geliyor (JS kapalıyken görünür)

**Tarayıcı**
- [x] Chrome, Safari (WebKit motoru), Firefox — masaüstü, gerçek veriyle, JS hatasız
- [ ] iOS Safari, Android Chrome — **gerçek cihazda test edilmedi.** Playwright'ın WebKit/Chromium motorları gerçek mobil tarayıcının yerini tutmaz
- [ ] Safari'de `preserve-3d` ve gölge doğru — WebKit motoru fonksiyonel olarak test edildi ama 3D dönüşüm kalitesi gerçek Safari'de gözle kontrol edilmedi

**Erişilebilirlik**
- [x] Sadece klavyeyle tam kullanım, odak halkası her yerde
- [x] Sayfa değişimi ekran okuyucuya duyuruluyor
- [x] `prefers-reduced-motion` etkili
- [x] Kontrol butonlarında kontrast 4.5:1

---

## 11. Bilinen tuzaklar

| Tuzak | Belirti | Çözüm |
|---|---|---|
| **Spread bölünmedi** | Flipbook'ta her "sayfa" iki sayfa gösteriyor, çevirme yanlış | §2.2 — PDF s2–28 A3, bölünmeli |
| **Tek piksel genişlik** | Sırtta ince kayma çizgisi | Bölmeden önce çift piksele normalize et |
| **Kapsayıcı `max-w-5xl`** | Metin okunmuyor | `max-w-[1600px]` — §5.6 |
| Sayfa sayısı 55 (tek) | Eşleşme kayıyor, son sayfa yanlış | 56. kapanış sayfası — §2.3 |
| 74 MB PDF servis edildi | Mobilde indirme imkânsız | §4.3 sıkıştırma — **bu sayı için bilinçli olarak ertelendi**, orijinal PDF yayında |
| Sıkıştırma metni curve yaptı | SEO ve erişilebilirlik gitti | `pdftotext` ile doğrula |
| SSR'de `document` yok | Build veya ilk render çöküyor | **Doğrulandı: bu projede gerçekleşmedi.** `MagazineViewer` zaten "use client" sınırında; react-pageflip'in kendi iç `pages` state'i boş (`[]`) başlıyor ve SSR çıktısı boş bir `<div>`, hydration uyuşmazlığı yok. `next/dynamic` + `ssr:false` eklenmedi |
| `renderOnlyPageLengthChange` açık | **Birkaç sayfa ileri gidince kitap tamamen boşalıyor** (sayaç doğru, görsel yok) | **Gerçek bir regresyon olarak bulundu ve düzeltildi — bkz. §9.2.** react-pageflip sarmalayıcısı sayfa SAYISI değişmedikçe kendi `pages` state'ini hiç güncellemiyor; pencereleme yeni `isNear` üretse de DOM'daki çocuklar donuk kalıyor. Bayrak `false` yapıldı, her flip `updateFromHtml()` çalıştırıyor — mevcut sayfada kalıyor, animasyonu bozmuyor, hızlı art arda tıklamada debounce korumasıyla birlikte sorunsuz (hepsi test edildi) |
| Sürüklemede sayfa kenarına çok yakın başlama | Sürükleme tamamlanmıyor, sayfa mevcut konuma geri dönüyor (herhangi bir sayfada, sadece kapakta değil) | **Gerçek, dar kapsamlı bir `page-flip` kütüphanesi sınırlaması — bkz. `node_modules/page-flip/src/Flip/FlipCalculation.ts` `calc()`.** Sürüklemenin Y koordinatı sayfa yüksekliğinin üst/alt ~%3'lük kenar payının İÇİNDE kalırsa (ölçüldü: ~30px'e kadar başarısız, ~40px'ten itibaren güvenilir — 995px yükseklikte), `calc()` içeride sessizce hata verip pozisyonu hiç güncellemiyor, `stopMove()` de sürüklemeyi her zaman geri alıyor. Güvenli başarısızlık: durum bozulmuyor, sonraki tıklama/sürükleme normal çalışıyor (doğrulandı). Kod tarafında düzeltilmedi — kenara bu kadar yakın bir sürükleme gerçek kullanıcı jestlerinde nadir, kütüphane içi cerrahi bir yama deadline'a göre riskli görüldü |
| PDF s21'de (dergi sayfa 41, "Marmara Region") hayalet metin | Sağ sayfada arka planda soluk, farklı bir paragraf görünüyordu | **Kaynağı kod değil, kaynak PDF'ti** (`pdftoppm` ile PDF sayfa 21 doğrudan render edilip doğrulandı). **İlk denemede metni silip zeminle doldurmuştuk — yanlış karardı, kullanıcı geri bildirimiyle düzeltildi: metin İÇERİK olarak kalmalıydı, sadece görünürlüğü/rengi bozuktu.** Ekip sayfayı yeniden tasarlayıp gönderdi (`Page 41.pdf`, tek A4 sayfa) — `pdftoppm` ile pipeline'daki aynı DPI hesabıyla (291) yeniden render edilip hem `web/` hem `zoom/` katmanında değiştirildi; sağ kolon artık sol kolonla aynı opaklıkta, tam okunur beyaz metin. Kaynak PDF ve orijinal indirilen PDF dosyası bu değişiklikten etkilenmedi (ayrı bir dosya, `cop31.pdf` değil) |
| `flip()` / `flipToPage` ile uzağa atlama | Sessizce hiçbir şey olmuyor | **Doğrulandı, gerçek bir kütüphane sınırlaması.** `flipToPage` hedefin bir öncesine `setCurrentSpreadIndex` ile GÖRSEL GÜNCELLEME YAPMADAN atlayıp oradan tek adım animasyon deniyor (bkz. `node_modules/page-flip/src/Flip/Flip.ts`); state ile DOM tutarsız kalıyor. `turnToPage` (animasyonsuz) her koşulda çalışıyor — `FlipbookHandle`'dan `flipTo` kaldırıldı, sadece `jumpTo` var |
| Mount sırasında zıplama | CLS düşük | `aspect-ratio` — §5.6 |
| `pushState` ile derin link | Geri tuşu 56 kayıt geriye gidiyor | `replaceState` — doğrulandı, 5 flip sonrası `history.length` değişmiyor |
| Zoom tetikleyici `<div>` | Tıklama sayfa çeviriyor | `<button>` — `clickEventForward`. **Ek tuzak:** buton içindeki SVG ikonun `pointer-events` alması da aynı soruna yol açıyor — ikona `pointer-events-none` şart |
| Şeritte `web/` görselleri | 56 × 1600px iniyor | Ayrı `thumb/` seti — bu sayıda şerit yapılmadı |
| Renkler soluk | Sayfa PDF'ten farklı | Belgede karışık RGB/CMYK görsel var (§1.4). `pdftoppm` rasterleştirme sırasında zaten RGB'ye çeviriyor — bu sayıda ek `.withMetadata()` gerekmedi, renkler kaynakla eşleşti |
| TS tip hatası | Build kırılıyor | **Doğrulandı:** react-pageflip'in tipleri `IFlipSetting`'in tamamını + `className`/`style`'ı zorunlu kılıyor. Kütüphane varsayılanlarıyla dolduruldu |
| Yeniden boyutlandırma | Kitap taşıyor | `autoSize` davranışını test et, gerekirse `update()` — **doğrulanmadı** |
| Kitap kutusunun CSS class'ı `currentPage`/`isCover` gibi bir state'e göre dallanıyor | **Kitap iç sayfalarda tek sayfa/portrait modunda kalıp sola kayıyor** (spread değil), CSS kutusunun kendi `aspect-ratio`'su ölçülünce doğru (spread oranı) çıkıyor olsa bile | **Gerçek bir regresyon olarak bulundu ve düzeltildi.** Kapak yanına tanıtım paneli eklenirken kitap kutusunun class'ı `isCover` durumuna göre (kapakta ≤820px tek-sayfa oranı, sonra spread'e dönüş) DALLANDIRILMIŞTI. Bu, react-pageflip'in `.stf__wrapper`'a inline `padding-bottom` ile uyguladığı portrait/landscape oranını (bkz. `node_modules/page-flip/src/Page/Page.ts` / UI katmanı `setOrientationStyle`) kütüphanenin KENDİ iç ölçümüyle yarışa soktu — kapaktan ilk spread'e geçişte konteyner genişliği aynı render turunda değiştiği için kütüphane yanlışlıkla portrait'te kilitli kaldı (`.stf__wrapper` class'ı `--portrait`, tek `.stf__item` görünür, boyut ≈ tek-sayfa oranı). Kutunun DIŞINDAN ölçülen `getBoundingClientRect` doğru spread oranını gösteriyordu (1102×780, ~1.41) ama kütüphanenin kendi iç state'i buna göre değil, ölçüm ANINDAKİ genişliğe göre karar veriyordu. **Düzeltme: kitap kutusunun class'ı/style'ı artık `isCover`'dan TAMAMEN bağımsız, koşulsuz (her zaman aynı string) — kitabın mekaniğine hiç dokunulmuyor.** Tanıtım paneli bunun yerine kutunun İÇİNE `position:absolute` ile bindiriliyor (kapak zaten kutunun sağ yarısına çiziliyor, sol yarı zaten boştu — bkz. §13 madde 9) — kutunun boyutu/ölçümü etkilenmiyor. `.stf__wrapper` class'ı `--landscape`, 2 görünür `.stf__item` olarak doğrulandı (kapak sonrası her sayfada) |

---

## 12. Sonraki sayı runbook'u

1. Ekipten PDF'i al (Ek B'deki export ayarlarıyla — spread veya tek sayfa, ikisi de kabul)
2. Doğrula: `pdfinfo`, `pdffonts`, `pdftotext`, sayfa boyutu dağılımı (§3)
3. **Spread var mı kontrol et.** Script otomatik algılıyor ama sayfa sayısı beklentini bu belirliyor
4. `pnpm tsx scripts/build-magazine-assets.ts <pdf> <slug>`
5. Sayfa sayısı tek çıkarsa kapanış sayfası ekle (§2.3)
6. PDF'i sıkıştır (§4.3), metnin canlı kaldığını doğrula
7. Varlıkları hedef konuma yükle (depo veya CDN — §9.5)
8. `page.tsx` manifest import yolunu güncelle
9. Faz 7 kabul listesini geç

Kodda başka değişiklik gerekmemeli. Gerekiyorsa bir şey sabit kodlanmış demektir — manifest'e taşı.

---

## 13. Açık kararlar

1. ~~**Kapanış sayfası nasıl olacak?**~~ **Çözüldü — ve sonradan gerçek tasarımla değiştirildi.** Pipeline hâlâ tek sayı çıkarsa `generateClosingPage` ile otomatik bir yer tutucu üretiyor (§2.3/§4.2), ama COP31'de PDF'in kendi 55. sayfası (References'tan sonraki, gerçek illüstrasyonlu arka kapak) zaten vardı — üretilen yer tutucuya gerek kalmadı. El ile yeniden düzenlendi: 53 boş beyaz sayfa (bölüm arası), 54–55 References (artık düzgün bir spread), 56 PDF'in kendi arka kapak tasarımı — tek başına, son sayfa olarak. Eski üretilen kapanış sayfası (eski 56) atıldı. Referans sayfalarındaki (54, 55) kaynak PDF'in kendi basılı sayfa numaraları ("53", "54") artık yanlış olduğu için aynı yöntemle (bkz. madde 8) temizlendi. **Bu değişiklik sadece `web/`+`zoom/` görsel katmanlarında — indirilebilir orijinal PDF dokunulmadı, hâlâ eski sayfa sırasını gösteriyor.**
2. **Barındırma: depo mu CDN mi?** §9.5 — bu sayı **~120 MB** (sıkıştırma atlandığı için, bkz. §4.3). Süreklilik varsa CDN — bu sayı bile depoyu neredeyse ikiye katlıyor, tek başına bekleyebilecek bir karar değil.
3. ~~**Zoom katmanı yapılacak mı?**~~ **Yapıldı.** §7 — `react-zoom-pan-pinch` ile kuruldu, klavye/erişilebilirlik dahil test edildi. §1.5'teki "artık opsiyonel" değerlendirmesi hâlâ geçerli (16px okunabilirlik zoom olmadan da sağlanıyor) ama katman zaten mevcut.
4. **Kaç sayı arşivde tutulacak?** Şu an sadece TEK sayı (`cop31`) var; site `/dergi` route'u o sayıya sabit kodlanmış (`app/dergi/page.tsx`, `manifest.json`). İkinci bir sayı geldiğinde (örn. bir sonraki COP toplantısı) bu route'un `app/dergi/[issue]/page.tsx` + `generateStaticParams`'a dönüştürülüp dönüştürülmeyeceği, eski sayıların arşivde kalıp kalmayacağı, yoksa her seferinde en güncel sayının mı yayınlanacağı henüz belli değil — bu, THIS sayının teslimini etkilemiyor, sadece ikinci sayı geldiğinde ele alınması gereken bir mimari karar. Şimdilik ertelenebilir.
5. **Analitik eklenecek mi?** Kaç kişinin kaçıncı sayfaya kadar gittiği, zoom yatırımının karşılığını gösteren tek veri. Proje kuralı analitiği sorulmadan eklemeyi yasaklıyor — bilinçli karar olmalı.
6. **Görsel koruma?** Dürüst cevap: ağ sekmesinden indirmeyi hiçbir istemci tarafı önlem engelleyemez. Sağ tık engelleme sadece meşru kullanıcıyı rahatsız eder. Gerçekten gerekiyorsa çözüm filigran.
7. **Basılı URL'ler tıklanabilir olsun mu?** Belgede hyperlink yok (§1.4). Gerekiyorsa ekipten "Include hyperlinks" açık yeni bir export istenir.
8. ~~**PDF s21'deki (dergi sayfa 41, "Marmara Region") hayalet metin tasarım hatası mı?**~~ **Çözüldü — ekip tarafından.** §11 — kaynak PDF'te doğrulandı, ekip sayfayı yeniden tasarlayıp (`Page 41.pdf`) gönderdi, sağ kolon metni artık tam opaklıkta.
9. ~~**Kapağın soluna tanıtım paneli nasıl eklenecek?**~~ **Çözüldü.** Kapak (sayfa 1) her zaman spread-oranlı bir kutu içinde SAĞ yarıya çiziliyor (`showCover`+`usePortrait`), sol yarı zaten boştu — kullanıcı bu boşluğa başlık/konu/okuma süresi içeren bir tanıtım paneli (`CoverInfo`, `app/dergi/page.tsx`) istedi. İlk deneme bu boşluğu kitabın KUTUSUNU `isCover`'a göre küçülterek açmaya çalıştı — bu, kitabın mekaniğini bozan bir regresyona yol açtı (§11, yeni satır). Nihai çözüm: kutunun class'ı koşulsuz bırakıldı, panel kutunun içine `position:absolute` ile (masaüstünde sol yarıya, mobilde kutunun ÜSTÜNE ayrı bir blok olarak) bindirildi — kitabın ölçümünü/mekaniğini hiç etkilemiyor. Sadece kapaktayken (`currentPage===0`) render ediliyor; erişilebilirlik için sayfanın tek `<h1>`'i her zaman DOM'da kalıcı (`sr-only`), panel başlığı dekoratif bir `<p>`.

---

## 14. Güven düzeyi

**Kesin — teslim edilen PDF üzerinde ölçüldü**
- Sayfa sayısı, boyutlar, spread yapısı, oranlar
- Font gömme durumu, metnin canlı olması, karakter sayısı
- Punto dağılımı ve buradan türeyen okunabilirlik hesabı
- Bleed yokluğu, hyperlink yokluğu, renk uzayı karışımı
- Sırtı geçen 10 spread'in tespiti
- Boru hattı çıktı boyutları (6003→6000→3000 bölme ve WebP dosya boyutları gerçekten çalıştırıldı)

**Yüksek — birincil kaynaktan doğrulandı**
- `react-pageflip` prop'ları, metotları, olayları → resmi README
- Affinity export ayarları → Serif resmi yardım dokümanı
- Claude Code bellek dosyası davranışı → Anthropic dokümantasyonu
- Paket bakım durumları → npm / GitHub / Snyk, Ağustos 2026

**Orta — muhakemeye dayanıyor**
- Dosya boyutu tahminleri tek bir görsel-yoğun sayfadan (PDF s19) ölçeklendi; gerçek ortalama (§9.5) tahminden düşük çıktı — metin ağırlıklı sayfalar gerçekten daha küçük

**Düşük — ilk uygulamada kontrol et**
- Yeniden boyutlandırmada `autoSize` davranışı — hâlâ test edilmedi
- Gerçek iOS Safari / Android Chrome cihazda davranış — sadece masaüstü Chrome/Firefox/WebKit motorlarıyla test edildi
- Mount sırasında CLS ve pencere yeniden boyutlandırmada taşma — hâlâ ölçülmedi

**Bu turda "orta/düşük"ten "kesin"e taşınanlar (gerçek COP31 verisiyle, hem dev hem `next build`+`next start` ile doğrulandı)**
- 1600 / 2400 px hedefleri gerçek ekranlarda ölçüldü (1920px'te ~784px/sayfa)
- 56. sayfa (kapanış) eşleşmesi doğru çıktı, görsel olarak kontrol edildi
- SSR'de dinamik import GEREKMEDİĞİ doğrulandı — eklenmedi, hydration hatası yok
- **§9.2 pencerelemenin kütüphanenin DOM güncellemesini bozduğu bulundu ve düzeltildi** — `renderOnlyPageLengthChange` açıkken birkaç sayfa ileri gidince kitap tamamen boşalıyordu (sayaç doğru, görsel yok); bayrak `false` yapıldı, kök neden ve düzeltme §9.2/§11'de
- `react-pageflip` TypeScript tiplerinin tüm `IFlipSetting` alanlarını istediği doğrulandı, `next build` TypeScript kontrolünden temiz geçti
- **Kod örnekleri artık çalıştırıldı** — pipeline scripti 2 kez, `next build`, `next start`, onlarca Playwright senaryosu gerçek veriyle koşturuldu

### Sürüm geçmişi

| Sürüm | Tarih | Değişiklik |
|---|---|---|
| v1 | 17 Ağu 2026 | İlk hazırlık, PDF henüz yok |
| v1.1 | 17 Ağu 2026 | SSR/dinamik import, hata durumları, derin link, CLS, doğrulama script'i |
| v2 | 17 Ağu 2026 | Yedi hata düzeltildi. Hızlı başlangıç, barındırma, Ek D |
| v3 | 18 Ağu 2026 | **PDF ölçüldü.** Spread bölme boru hattı (§2.2), 55 sayfa sorunu (§2.3), okunabilirlik ölçümü ve `max-w-5xl` hatasının düzeltilmesi (§1.5, §5.6), zoom'un opsiyonele düşmesi, PDF sıkıştırma (§4.3), gerçek dosya boyutları (§9.5) |
| v4 | 18 Ağu 2026 | **Boru hattı gerçek COP31 PDF'iyle çalıştırıldı, uçtan uca doğrulandı.** 56 sayfa üretildi (55 + üretilen kapanış sayfası, kapaktan kırpılan gerçek IDD ORG logosuyla). Spread bölme 3 farklı sırt-geçen sayfada piksel kaymasız doğrulandı. `flip()`/`flipToPage` uzak sayfalarda güvenilmez çıktığı için `FlipbookHandle`'dan kaldırıldı, her yerde `jumpTo` (turnToPage) kullanılıyor — §5.4, §6.3, §11 güncellendi. Sayfaya git kutusu ve `?sayfa=N` derin linki çalışır durumda. Kapsayıcı gerçekten 1600px'e ulaşıyor, 1920px'te sayfa başına ~784px ölçüldü. PDF sıkıştırması atlandı (kullanıcı kararı) — orijinal 70,7 MB yayınlanıyor, `check-magazine-assets.ts` bunu hata değil uyarı olarak işaretliyor. poppler-utils bu makineye winget ile kuruldu |
| v5 | 18 Ağu 2026 | **Kritik pencereleme regresyonu bulundu ve düzeltildi.** `renderOnlyPageLengthChange` açıkken kapaktan birkaç sayfa ileri gidildiğinde (tıklama, sürükleme veya derin link — hepsinde) kitap tamamen boşalıyordu; kök neden react-pageflip sarmalayıcısının kendi `pages` state'ini sayfa SAYISI değişmedikçe hiç güncellememesiydi (bkz. §9.2, §11). Bayrak `false` yapıldı, flip animasyonu bozulmadan (kare kare kontrol edildi), rapid-click debounce koruması bozulmadan doğrulandı. Tüm 10 sırt-geçen spread tek tek ekran görüntüsüyle kontrol edildi — biri (PDF s21, dergi sayfa 40) kaynak PDF'te var olan bir "hayalet metin" içeriyor, kod hatası değil (§11, §13). `next build` ve `next start` ile üretim derlemesi ilk kez test edildi — TypeScript temiz, hydration hatası yok, tek uyarı `metadataBase` eksikliği (§8.2, bilinçli bırakıldı — gerçek alan adı bilinmiyor). Sürüklemede sayfa kenarına çok yakın başlamanın (~30px) güvenli ama başarısız bir `page-flip` kütüphane sınırlaması olduğu tespit edildi (§11). Gerçek ölçülen depo boyutu (§9.5) ~120 MB'a güncellendi. §13 açık kararlar listesi güncellendi, §12'deki var olmayan "Ek D" referansı kaldırıldı |
| v6 | 19 Ağu 2026 | **Kapanış sayfaları yeniden düzenlendi.** PDF'in kendi gerçek arka kapak tasarımı (eski sayfa 55, illüstrasyon + IDD ORG metni) zaten vardı, bizim ürettiğimiz yer tutucuya (eski 56) hiç gerek yoktu. 53'e boş beyaz sayfa eklendi, References 54–55'e kaydı (artık düzgün bir spread), gerçek arka kapak 56'ya taşınıp TEK sayfa olarak bırakıldı, eski üretilen kapanış sayfası atıldı. Kaydırılan References sayfalarının kaynak PDF'ten gelen basılı sayfa numaraları ("53", "54") artık yanlış konuma denk geldiği için piksel-yamalama ile temizlendi. Dergi sayfa 41'deki ("Marmara Region") hayalet metin bu turda **yanlışlıkla silinip zeminle dolduruldu** — bkz. v7, bu hatalı bir karardı. **Kapanış sayfası değişikliği sadece `web/`+`zoom/` görsel katmanlarında — indirilebilir orijinal PDF'e dokunulmadı, orijinal sayfa sırasını hâlâ içeriyor.** Yeni sayfa dizilimi flipbook'ta uçtan uca test edildi (spread 52–53, 54–55, tek sayfa 56), `next build` temiz |
| v7 | 19 Ağu 2026 | **v6'daki hayalet-metin "silme" kararı düzeltildi + kapanış sayfasına logo eklendi.** (1) Kullanıcı geri bildirimi: metin içerik olarak kalmalıydı, sadece görünürlüğü bozuktu — silmek yanlıştı. Ekip sayfayı yeniden tasarlayıp gönderdi (`Page 41.pdf`, tek A4); pipeline'daki aynı DPI hesabıyla (291) yeniden render edilip hem `web/` hem `zoom/`'da değiştirildi — sağ kolon artık sol kolonla aynı opaklıkta tam okunuyor. (2) 53. sayfadaki (References'tan önceki boş sayfa) tasarım tutarlılığı için kapak sayfalarındaki IDD ORG logosu eklendi: kapaktan (`sayfa-01`) aynı oranlarla kırpılıp, teal zemin renk-mesafesi bazlı bir maskeyle beyaza dönüştürülerek (kutu değil, sadece logo+yazı) boş sayfaya sol-alt konumda bindirildi. İkisi de flipbook'ta uçtan uca test edildi, `next build` temiz |
| **v8** | **19 Ağu 2026** | **53. sayfa daha da kapak-tutarlı hale getirildi.** Kullanıcı isteğiyle: logo artık sol-alt değil TAM ORTALANMIŞ; düz beyaz zemin, ön/arka kapağın kendi yumuşak gökyüzü gradyanına (açık mavi → teal, `rgb(158,215,232)`→`rgb(188,229,229)`) benzeyecek şekilde SVG ile yeniden üretildi — kapaklardan piksel kırpmak yerine ölçülen renk duraklarıyla temiz bir gradyan çizildi (kırpma/germe artefaktı riski yok). Logo aynı teal-mesafe maskesiyle gradyanın üstüne ortalı bindirildi. `next build` temiz, JS hatasız |
| **v9** | **20 Ağu 2026** | **Kapağın soluna tanıtım paneli eklendi (başlık, konu özeti, ~60 dk okuma süresi, sayfa sayısı) — bkz. §13 madde 9.** İlk uygulama kitabın KUTUSUNU `currentPage`'e göre dallandırdı (kapakta küçült, sonra spread'e dön); bu, react-pageflip'in kendi iç portrait/landscape ölçümüyle yarışa girip **kitabı iç sayfalarda kalıcı olarak tek-sayfa/portrait modunda kilitledi** (kullanıcı: "dergi tek sayfa gözüküyor... 2 sayfa aynı anda gözükmesi lazım") — kök neden ve tuzak tablosuna eklenen kayıt için §11'e bakın. **Düzeltme kitabın kutu class'ını tamamen koşulsuz hale getirdi**, paneli bunun yerine kutunun zaten boş olan sol yarısına `position:absolute` ile bindirdi (masaüstü) / kutunun üstüne ayrı bir blok olarak koydu (mobil) — kitabın ölçümüne/mekaniğine artık hiç dokunulmuyor. Ayrıca yol boyunca iki küçük geri alma oldu: (1) panel ile kapak arasında `w-full`+`mx-auto` çakışmasından kaynaklanan geniş boşluk düzeltildi; (2) "sol yaprak metnin üstüne gelsin" isteğiyle denenen sağ-kenar sabitleme (`md:ml-auto`) YANLIŞLIKLA 2-56 arası TÜM iç sayfaları section'ın sağına yapıştırıp normal ortalanmış okumayı bozdu (kullanıcı: "bozdun bütün sayfayı") — geri alındı, iç sayfalar yine `mx-auto` ile ortalı. Playwright ile doğrulandı: `.stf__wrapper` class'ı kapak sonrası her sayfada `--landscape`, 2 görünür `.stf__item` (§ ölçüm: 551×780 iki sayfa, konteyner 1102×780), h1 sayısı her durumda 1, masaüstü/mobil ekran görüntüleri temiz, `next build` hatasız |

Bir şey doğruladığında buraya satır ekle.

---

## Ek A — Bağımlılıklar

| Paket | Faz | Durum |
|---|---|---|
| `react-pageflip` | 2 | **Kurulu** (2.0.3), bakımsız — bilinçli kabul. `flip()`/`flipToPage` uzak sayfalarda güvenilmez çıktı, kullanılmıyor (bkz. §11) |
| `react-zoom-pan-pinch` | 4 | **Kurulu** (4.0.4) |
| `sharp` | 1 | **Kurulu** (devDependency, 0.35.3) — next/image `unoptimized` kullanıldığı için Next.js'in kendisi kurmamıştı |
| `tsx` veya eşdeğeri | 1 | **Kullanılmıyor.** Node 24 `.ts` dosyalarını yerleşik çalıştırıyor (`scripts/package.json`'da `"type":"module"`) — `node scripts/build-magazine-assets.ts` yeterli |
| poppler-utils | 1 | **Kurulu** (winget, `oschwartz10612.Poppler`) |
| ghostscript | 1 | **Kullanılmadı** — kullanıcı kararıyla PDF sıkıştırması bu sayı için atlandı (§4.3). Gerçek Ghostscript winget'te temiz paket olarak yok; gerekirse `mutool` (Artifex, winget'te mevcut) denenebilir |

Hiçbiri sorulmadan kurulmayacak.

---

## Ek B — Affinity export ayarları

Sonraki sayılar için ekibe iletilecek (kaynak: Affinity Publisher 2 resmi yardım dokümanı):

**PDF**
- Area: All Pages
- Embed fonts: All Fonts, **Text as Curves kapalı**
- Include hyperlinks: **açık**
- Include bleed ve printer's marks: kapalı — Include bleed belgenin taşma payı alanını çıktıya dahil eder
- ICC profile: sRGB, embed açık — profil gömülür, her cihazda doğru görüntülenir

> **Bu sayı spread olarak geldi ve sorun çıkarmadı** — boru hattı bölüyor. Ama tek sayfa gelirse bir adım eksilir. Ekibe "tek sayfa tercih edilir, spread de kabul" demek yeterli.

**Görsel (yedek yol)**
- Area: All Pages, Pages: `1-N` — sayfa aralığı verildiğinde PNG/JPEG gibi grafik formatlarda her sayfa ayrı dosya çıkar
- Size: genişlik 1600px, oran kilidi açık
- Resample: **Lanczos 3** — en iyi sonucu veren, sadece daha yavaş olan algoritma
- Embed metadata: **kapalı** — web kullanımı için önerilir
- Format: WebP, kalite 85

---

## Ek C — Claude Code prompt şablonları

**Faz başlatma**
```
docs/dergi-flipbook.md oku. Faz <N>'i uygula.
Kod yazmadan önce app/dergi/ altındaki mevcut dosyalara bak ve
import sırası, export biçimi, isimlendirmede onları takip et.
Bağımlılık gerekiyorsa kurmadan önce sor.
```

**Kabul kriteri kontrolü**
```
Faz <N>'in kabul kriterlerini tek tek kontrol et.
Her madde için neyi çalıştırdığını yaz, ya da doğrulamadığını açıkça söyle.
"Çalışıyor" deme, ne yaptığını yaz.
```

**Kütüphane değiştirme**
```
app/dergi/MagazineFlipbook.tsx dosyasındaki react-pageflip kullanımını
<yeni-kütüphane> ile değiştir. FlipbookHandle arayüzü ve
MagazineFlipbookProps aynı kalsın — dışarıdaki hiçbir dosya değişmemeli.
```

**Sapma bildirimi**
```
Bu dokümandaki bir karar bu görevi zorlaştırıyorsa hangi karar
ve neden olduğunu söyle, daha iyisini yap, sonra bana bildir.
```

---

