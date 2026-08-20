"use client";

import Image from "next/image";
import { useImperativeHandle, useMemo, useRef, useState, type Ref } from "react";
import HTMLFlipBook from "react-pageflip";
import type { MagazinePage } from "./magazine";

// StPageFlip ölçüm için tüm sayfa elementlerinin DOM'da kalmasını istiyor —
// gerçek sanallaştırma (unmount) mümkün değil. Bunun yerine DOM düğümü
// kalır, sadece görselin src'si "yakındaysa" yüklenir. Çift sayfa modunda
// önde/arkada birer spread'e denk gelir; çevirme sırasında boş sayfa
// görünmesini önlemeye yetiyor (bkz. docs/dergi-flipbook-rehberi.md §9.2).
const WINDOW = 3;

// Sayfa başına eşik — spread'de toplam 2×MAX_BOOK_WIDTH (1600px) olur,
// bu da §1.5'teki 16px gövde metni hesabının dayandığı genişlik.
export const MIN_BOOK_WIDTH = 300;
export const MAX_BOOK_WIDTH = 800;

type PageCardProps = {
  page: MagazinePage;
  isHard: boolean;
  isEager: boolean;
  isNear: boolean;
  onZoom: (page: MagazinePage, trigger: HTMLElement) => void;
  ref?: Ref<HTMLDivElement>;
};

function PageCard({ page, isHard, isEager, isNear, onZoom, ref }: PageCardProps) {
  const [hasFailed, setHasFailed] = useState(false);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden bg-white"
      data-density={isHard ? "hard" : "soft"}
    >
      {isNear ? (
        hasFailed ? (
          // 56 istekten biri 404/ağ hatası verirse bembeyaz bir sayfa yerine
          // sebebi anlaşılır bir mesaj — bkz. docs/dergi-flipbook-rehberi.md §8.3.
          <div className="flex h-full w-full items-center justify-center bg-neutral-50 p-6 text-center">
            <p className="text-sm text-neutral-600">
              Sayfa {page.number} yüklenemedi. PDF sürümünden okuyabilirsiniz.
            </p>
          </div>
        ) : (
          <Image
            src={page.webSrc}
            alt={`Sayfa ${page.number}`}
            fill
            // Kaynak görseller zaten tam hedef boyutta üretildi (Faz 1).
            // Next'in yeniden optimize etmesi kazanç sağlamaz, dönüşüm kotası harcar.
            unoptimized
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain"
            priority={isEager}
            draggable={false}
            onError={() => setHasFailed(true)}
          />
        )
      ) : (
        <div className="h-full w-full bg-neutral-100" aria-hidden="true" />
      )}
      {isNear && (
        // Sayfanın tamamını kaplayan bir tetikleyici react-pageflip'in kendi
        // tıklama/sürükleme ile çevirmesini kırar — sadece köşede, küçük bir
        // <button> (clickEventForward yalnız a/button'a izin veriyor).
        // Üst-sağ köşede: alt köşeler StPageFlip'in sürükleyerek çevirme
        // jestinin doğal tutma noktası — oraya konursa bir sürükleme başlangıcı
        // bu butonun üstüne denk gelip flip'i engelleyebiliyor.
        <button
          type="button"
          onClick={(event) => onZoom(page, event.currentTarget)}
          aria-label={`Sayfa ${page.number} — büyüt`}
          // bg-black/45 beyaz bir sayfa zemininde 3.36:1 kontrast veriyordu
          // (WCAG metin eşiği 4.5:1'in altında) — /60 ile ~5.7:1'e çıkarıldı.
          className="absolute top-2 right-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {/* react-pageflip'in "hedef buton mu?" kontrolü e.target.tagName'e
              bakıyor (bkz. node_modules/page-flip/src/UI/UI.ts checkTarget) —
              ikon pointer-events almazsa mousedown'ın gerçek hedefi <button>
              olur, yoksa <svg>/<path> olur ve kütüphane bunu sayfa çevirme
              jesti sanıp arka planda sayfayı da çevirir. */}
          <svg viewBox="0 0 20 20" fill="none" className="pointer-events-none h-4 w-4" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="m17 17-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

export type FlipbookHandle = {
  next: () => void;
  prev: () => void;
  /**
   * Animasyonsuz doğrudan konumlanma — sayfaya git kutusu, derin link,
   * zoom senkronizasyonu. page-flip'in animasyonlu `flip()`/flipToPage
   * metodu UZAK sayfalarda güvenilmez çıktı (bkz.
   * node_modules/page-flip/src/Flip/Flip.ts flipToPage: hedefin bir
   * öncesine görsel güncelleme yapmadan atlayıp oradan tek adım animasyon
   * deniyor, state ile DOM tutarsız kalıp hiçbir şey olmuyor — test edilip
   * doğrulandı). turnToPage her koşulda çalıştığı için tek metoda indirildi.
   */
  jumpTo: (index: number) => void;
};

// react-pageflip'in kendi PageFlip nesnesi için tip üretmiyor
// (bkz. node_modules/react-pageflip/build/*.d.ts — ref RefAttributes<any>).
// Burada sadece kullandığımız metotları tipliyoruz, "any" sızdırmadan.
type PageFlipController = {
  flipNext: () => void;
  flipPrev: () => void;
  turnToPage: (page: number) => void;
};

type FlipBookRef = {
  pageFlip: () => PageFlipController | undefined;
};

type MagazineFlipbookProps = {
  pages: readonly MagazinePage[];
  pageWidth: number;
  pageHeight: number;
  currentPage: number;
  flippingTime: number;
  drawShadow: boolean;
  onFlip: (pageIndex: number) => void;
  onPageClick: (page: MagazinePage, trigger: HTMLElement) => void;
  /** react-pageflip ilk kurulumunu bitirip gerçek içeriği DOM'a yazdığında bir kez çağrılır. */
  onReady: () => void;
  ref?: Ref<FlipbookHandle>;
};

export function MagazineFlipbook({
  pages,
  pageWidth,
  pageHeight,
  currentPage,
  flippingTime,
  drawShadow,
  onFlip,
  onPageClick,
  onReady,
  ref,
}: MagazineFlipbookProps) {
  const bookRef = useRef<FlipBookRef>(null);
  const ratio = pageHeight / pageWidth;

  useImperativeHandle(ref, () => ({
    next: () => bookRef.current?.pageFlip()?.flipNext(),
    prev: () => bookRef.current?.pageFlip()?.flipPrev(),
    jumpTo: (index: number) => bookRef.current?.pageFlip()?.turnToPage(index),
  }));

  // react-pageflip children referansı değiştiğinde kendi içinde
  // updateFromHtml() çağırıp DOM'u yeniden kuruyor (bkz. build/index.es.js).
  // pages.map() her render'da yeni elementler üretirse bu, zoom/sayfa
  // sayacı gibi ilgisiz state değişimlerinde bile tetiklenir ve o anki
  // odağı (örn. büyüteç butonundan dönen focus) siler. currentPage burada
  // BİLEREK bağımlılık — pencereleme için gerekli, sadece sayfa gerçekten
  // değiştiğinde yeniden hesaplanıyor.
  const pageCards = useMemo(
    () =>
      pages.map((page, i) => (
        <PageCard
          key={page.id}
          page={page}
          isHard={i === 0 || i === pages.length - 1}
          isEager={i < 4}
          isNear={Math.abs(i - currentPage) <= WINDOW}
          onZoom={onPageClick}
        />
      )),
    [pages, onPageClick, currentPage],
  );

  return (
    <HTMLFlipBook
      ref={bookRef}
      className=""
      style={{}}
      // react-pageflip'in tipleri IFlipSetting'in tamamını zorunlu kılıyor
      // (bkz. docs/dergi-flipbook-rehberi.md §11 "TS tip hatası" tuzağı).
      // Aşağıdaki blok kütüphanenin kendi çalışma zamanı varsayılanlarıyla
      // aynı — sadece derleyiciyi susturmak için yazıldı.
      startPage={0}
      startZIndex={0}
      autoSize
      useMouseEvents
      swipeDistance={30}
      showPageCorners
      disableFlipByClick={false}
      clickEventForward
      size="stretch"
      width={pageWidth}
      height={pageHeight}
      minWidth={MIN_BOOK_WIDTH}
      maxWidth={MAX_BOOK_WIDTH}
      minHeight={Math.round(MIN_BOOK_WIDTH * ratio)}
      maxHeight={Math.round(MAX_BOOK_WIDTH * ratio)}
      showCover
      usePortrait
      mobileScrollSupport
      // true İKEN GERÇEK BİR REGRESYONA YOL AÇTI (bkz. docs/dergi-flipbook-rehberi.md
      // §9.2, §11): react-pageflip kendi `pages` state'ini `updateFromHtml`
      // çağrılmadıkça asla güncellemiyor (bkz. node_modules/react-pageflip/build/index.es.js) —
      // sayfa SAYISI hiç değişmediği için bu bayrak açıkken updateFromHtml
      // BİR DAHA HİÇ ÇALIŞMIYOR, yani pencereleme currentPage'e göre yeni
      // `isNear` sonuçları üretse bile kütüphanenin DOM'a yazdığı çocuklar
      // ilk mount'taki donmuş kopyalarda kalıyor. Sonuç: birkaç sayfa ileri
      // gidince kitap tamamen boş görünüyor (sayaç doğru, içerik yok) —
      // gerçek veriyle test edilip doğrulandı. false ile her flip
      // `updateFromHtml` çalıştırıyor; bu da `pages.show(current)` ile AYNI
      // sayfada kalıyor (animasyon sıfırlanmıyor) — test edilip doğrulandı.
      renderOnlyPageLengthChange={false}
      maxShadowOpacity={0.3}
      flippingTime={flippingTime}
      drawShadow={drawShadow}
      onFlip={(event: { data: number }) => onFlip(event.data)}
      onInit={() => onReady()}
    >
      {pageCards}
    </HTMLFlipBook>
  );
}
