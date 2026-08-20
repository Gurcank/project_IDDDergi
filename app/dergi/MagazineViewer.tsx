"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { MagazineFlipbook, type FlipbookHandle } from "./MagazineFlipbook";
import { MagazineZoom } from "./MagazineZoom";
import type { MagazineManifest, MagazinePage } from "./magazine";
import { usePrefersReducedMotion } from "./use-reduced-motion";

type MagazineViewerProps = {
  manifest: MagazineManifest;
  pages: MagazinePage[];
  /** Sadece kapak açıkken (currentPage 0) kapağın soluna gösterilen tanıtım paneli. */
  coverInfo?: ReactNode;
};

export function MagazineViewer({ manifest, pages, coverInfo }: MagazineViewerProps) {
  const flipbookRef = useRef<FlipbookHandle>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  const [zoomPage, setZoomPage] = useState<MagazinePage | null>(null);
  const zoomTriggerRef = useRef<HTMLElement | null>(null);

  // Statik kapak sadece react-pageflip gerçek içeriği yazana kadar görünür
  // kalmalı — kalıcı kalırsa, kitap "spread" (çift sayfa) moduna geçtiğinde
  // kapak kutusunun tek-sayfa oranı artık uymuyor ve arkadan sızıyor.
  const [isReady, setIsReady] = useState(false);

  // `key={prefersReducedMotion ? ... }` değişince MagazineFlipbook baştan
  // kuruluyor ve kendi iç sayfasını 0'a (kapak) döndürüyor, ama bu bir
  // "flip" sayılmadığı için onFlip tetiklenmiyor — currentPage eski
  // değerde kalıp sayaç/önceki-sonraki butonlarını yanlış gösteriyordu.
  // onInit hem ilk mount'ta hem her remount'ta ateşlendiği için burada
  // sıfırlamak, gerçek sayfa durumuyla senkron kalmayı garanti ediyor.
  // İlk mount'ta ayrıca ?sayfa= derin linkini burada işliyoruz — react-pageflip
  // gerçekten hazır olmadan turnToPage sessizce hiçbir şey yapmaz.
  const handleReady = useCallback(() => {
    setIsReady(true);
    const target = Number(new URLSearchParams(window.location.search).get("sayfa"));
    if (target >= 1 && target <= manifest.pageCount) {
      flipbookRef.current?.jumpTo(target - 1);
    } else {
      setCurrentPage(0);
    }
  }, [manifest.pageCount]);

  const flippingTime = prefersReducedMotion ? 1 : 1000;
  const isFlippingRef = useRef(false);

  // Bir flip animasyonu bitmeden yenisi tetiklenirse StPageFlip'in sayfa
  // durumu karışıyor (iki sayfa üst üste biniyor, bkz. test ekran görüntüsü).
  // Ok tuşuna/butona hızlı art arda basmayı flippingTime boyunca yok sayarak
  // önlüyoruz.
  const handleNext = useCallback(() => {
    if (isFlippingRef.current) return;
    isFlippingRef.current = true;
    flipbookRef.current?.next();
    setTimeout(() => {
      isFlippingRef.current = false;
    }, flippingTime);
  }, [flippingTime]);

  const handlePrev = useCallback(() => {
    if (isFlippingRef.current) return;
    isFlippingRef.current = true;
    flipbookRef.current?.prev();
    setTimeout(() => {
      isFlippingRef.current = false;
    }, flippingTime);
  }, [flippingTime]);

  const jumpDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleJumpChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);
      if (jumpDebounceRef.current) clearTimeout(jumpDebounceRef.current);
      if (value < 1 || value > manifest.pageCount) return;
      jumpDebounceRef.current = setTimeout(() => {
        // flipTo (page-flip'in flip()/flipToPage metodu) uzak sayfalara
        // güvenilir çalışmıyor — bkz. node_modules/page-flip/src/Flip/Flip.ts
        // flipToPage: hedefin bir öncesine setCurrentSpreadIndex ile
        // GÖRSEL GÜNCELLEME YAPMADAN atlayıp oradan tek adım animasyonlu
        // flip deniyor; state ile DOM tutarsız kalıp hiçbir şey olmuyor.
        // Test edilip doğrulandı — jumpTo (turnToPage) her koşulda çalışıyor.
        flipbookRef.current?.jumpTo(value - 1);
      }, 400);
    },
    [manifest.pageCount],
  );

  useEffect(() => {
    // Temizlik: bekleyen bir "sayfaya git" debounce'u varsa unmount'ta iptal et
    return () => {
      if (jumpDebounceRef.current) clearTimeout(jumpDebounceRef.current);
    };
  }, []);

  useEffect(() => {
    // Dış sistem senkronizasyonu: URL'i mevcut sayfayla senkron tutar (derin
    // link paylaşımı için). pushState KULLANILMIYOR — 56 sayfa çevirmek
    // geçmişi 56 kayıtla doldurup geri tuşunu kullanılamaz hale getirirdi.
    if (!isReady) return;
    const url = new URL(window.location.href);
    url.searchParams.set("sayfa", String(currentPage + 1));
    window.history.replaceState(null, "", url);
  }, [currentPage, isReady]);

  const handlePageClick = useCallback((page: MagazinePage, trigger: HTMLElement) => {
    zoomTriggerRef.current = trigger;
    setZoomPage(page);
  }, []);

  const handleZoomClose = useCallback(() => {
    setZoomPage(null);
    const trigger = zoomTriggerRef.current;
    if (!trigger) return;
    // Native <dialog>'un kapanış adımları kendi focus sıfırlamasını 'close'
    // event'inden SONRA çalıştırıyor; senkron .focus() çağrısı ezilir.
    // Bir sonraki frame'e erteleyerek geri alıyoruz.
    requestAnimationFrame(() => trigger.focus());
  }, []);

  const handleZoomStep = useCallback(
    (direction: 1 | -1) => {
      if (!zoomPage) return;
      const index = pages.findIndex((p) => p.id === zoomPage.id);
      const nextIndex = index + direction;
      const next = pages[nextIndex];
      if (!next) return;
      // Arka plandaki kitabı da senkron tut — turnToPage kendi 'flip'
      // olayını tetikliyor (bkz. node_modules/page-flip PageCollection.show),
      // bu yüzden currentPage otomatik güncellenir, ayrıca setCurrentPage
      // çağırmaya gerek yok. Bunsuz, zoom içinde gezinip kapatınca kitap
      // zoom açılmadan önceki sayfada kalıyordu. Animasyonsuz jumpTo
      // kullanılıyor — zoom kapalıyken görünmeyen bir geçiş.
      // (jumpTo çağrısı BİLEREK setZoomPage updater'ının dışında: bir state
      // updater'ı içinde yan etkili/imperatif bir çağrı yapmak React'te
      // güvenilir değil — burada bir kez off-by-one'a yol açmıştı.)
      flipbookRef.current?.jumpTo(nextIndex);
      setZoomPage(next);
    },
    [pages, zoomPage],
  );

  const zoomIndex = zoomPage ? pages.findIndex((p) => p.id === zoomPage.id) : -1;

  useEffect(() => {
    // Dış sistem senkronizasyonu: klavye olayları (kütüphane klavye desteği vermiyor)
    const handleKeyDown = (event: KeyboardEvent) => {
      // Zoom overlay açıkken <dialog> odağı hapsediyor ama tuş olayının
      // window'a kabarmasını ENGELLEMİYOR — korumasız bırakılırsa ok
      // tuşları arka plandaki kitabı da (görünmez şekilde) çeviriyordu.
      if (zoomPage) return;
      if (event.key === "ArrowRight") handleNext();
      if (event.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, zoomPage]);

  // Kapak (currentPage 0) tek sayfa — kutu her zaman spread oranını
  // rezerve ettiği için kapağın solunda zaten kullanılmayan bir boşluk
  // vardı (StPageFlip showCover+usePortrait kapağı kutunun SAĞ yarısına
  // çiziyor). Tanıtım panelini o mevcut boşluğun İÇİNE, kutunun üstüne
  // mutlak konumlu (absolute) bindiriyoruz.
  //
  // ÖNEMLİ (geri alınan iki hata):
  // 1) Sağ kenarı TÜM iç sayfalarda sabitlemeyi denedim (md:ml-auto) — bu
  //    2-56 arası HER sayfayı section'ın sağına yapıştırıp normal
  //    ortalanmış okuma düzenini bozdu.
  // 2) Kitap kutusunun kendi boyut/oran class'ını isCover'a göre
  //    DEĞİŞTİRMEYİ denedim (kapakta ≤820px tek-sayfa oranı, sonra spread'e
  //    dönüş) — bu, react-pageflip'in konteyner ölçümüyle yarışa girip
  //    kütüphaneyi iç sayfalarda YANLIŞLIKLA portrait modda (tek sayfa,
  //    sola kaymış) kilitli bıraktı. Kitabın mekaniğine artık HİÇ
  //    dokunmuyoruz: kutunun class'ı/oranı her zaman aynı, koşulsuz.
  const isCover = currentPage === 0;

  return (
    <section
      aria-roledescription="dergi"
      aria-label={`${manifest.issue} sayısı`}
      className="mx-auto w-full max-w-[1600px] px-4"
    >
      {isCover && coverInfo && <div className="mb-6 md:hidden">{coverInfo}</div>}

      {/* Kitap kutusu 1600px'e kadar genişleyebilmeli — sayfa başına 800px,
          gövde metni 16px okunabilir kalıyor (bkz. §1.5). Kapak modunda
          (tek sayfa) ve spread modunda (çift sayfa) oranlar farklı;
          StPageFlip kırılma noktasını CSS media query değil hesapladığı
          genişliğe göre veriyor — md: burada tam garantili eşleşme değil
          ama pratikte yeterli (bkz. §5.6).

          Genişlik SADECE %100 genişliğe göre büyürse (eski davranış), sayfa
          oranı (yükseklik > genişlik) yüzünden geniş/kısa ekranlarda kitap
          ekran yüksekliğini aşıyor — %100 yakınlaştırmada dergi tam
          görünmüyordu (kullanıcı geri bildirimi). Çözüm görsel çözünürlüğü
          DÜŞÜRMÜYOR, sadece EKRANDAKİ boyutu ekran yüksekliğine göre üstten
          sınırlıyor: width artık min(kapsayıcının %100'ü, hedef yüksekliğe
          karşılık gelen genişlik) — 220px, navbar (85px) + üst boşluk (48px)
          + sayfa-git barının kendisi + üstündeki boşluk için ayrılan pay
          (bkz. ölçüm: header 85px, main pt 48px, mt-6 24px, pill ~50px).

          Bu kutunun class'ı/style'ı isCover'a göre ASLA dallanmıyor — kitabın
          mekaniğini etkileyen tek şey bu (bkz. yukarıdaki not). */}
      <div
        className="relative mx-auto w-full [aspect-ratio:var(--page-ratio)] md:[aspect-ratio:var(--spread-ratio)] [width:min(100%,calc((100dvh-220px)*var(--page-ratio)))] md:[width:min(100%,calc((100dvh-220px)*var(--spread-ratio)))]"
        style={
          {
            "--page-ratio": `${manifest.pageWidth} / ${manifest.pageHeight}`,
            "--spread-ratio": `${manifest.pageWidth * 2} / ${manifest.pageHeight}`,
          } as CSSProperties
        }
      >
        {/* Kapak, kutunun SAĞ yarısına çiziliyor (showCover+usePortrait);
            sol yarıdaki boşluğa tanıtım panelini bindiriyoruz — kutunun
            boyutunu/oranını değiştirmeden, sadece üstüne mutlak konumlu. */}
        {isCover && coverInfo && (
          <div className="absolute inset-y-0 left-0 z-10 hidden w-[380px] items-center pr-6 md:flex">
            {coverInfo}
          </div>
        )}

        {/* LCP: react-pageflip "use client" gerektiriyor ve ilk mount'ta
            içi boş (bkz. react-pageflip build/index.es.js — pages state'i
            [] ile başlıyor). JS/hydrasyon beklemeden görünen statik bir
            kapak koyup flipbook gerçek içeriğini yazınca (onReady) kaldırıyoruz.
            Kalıcı bırakmak yerine unmount ediyoruz — kitap "spread" moduna
            geçtiğinde bu kutunun tek-sayfa oranı artık uymuyor ve arkadan
            görünür şekilde sızabiliyordu. */}
        {!isReady && pages[0] && (
          <Image
            src={pages[0].webSrc}
            alt=""
            aria-hidden="true"
            fill
            unoptimized
            priority
            className="object-contain"
          />
        )}
        <div className="absolute inset-0">
          <MagazineFlipbook
            key={prefersReducedMotion ? "reduced" : "full"}
            ref={flipbookRef}
            pages={pages}
            pageWidth={manifest.pageWidth}
            pageHeight={manifest.pageHeight}
            currentPage={currentPage}
            flippingTime={flippingTime}
            drawShadow={!prefersReducedMotion}
            onFlip={setCurrentPage}
            onPageClick={handlePageClick}
            onReady={handleReady}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        {/* Tek "hap" (pill) kapsayıcı — önceden ayrı yüzen üç öğe (ok, sayaç,
            sayfaya-git kutusu) tek bir tutarlı kontrole birleştirildi.
            İlerleme çubuğu süs değil: derginin neresinde olunduğunu gerçekten
            gösteriyor (bkz. currentPage/pageCount). */}
        <div className="inline-flex items-center gap-0.5 rounded-full border border-neutral-200 bg-white p-1.5 shadow-sm shadow-neutral-900/5">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentPage === 0}
            aria-label="Önceki sayfa"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M12.5 15 7.5 10l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex flex-col items-center px-3">
            <p aria-live="polite" aria-atomic="true" className="flex items-baseline gap-1 text-sm leading-none tabular-nums">
              <span className="font-semibold text-neutral-900">{currentPage + 1}</span>
              <span className="text-neutral-400">/ {manifest.pageCount}</span>
            </p>
            <div className="mt-1.5 h-1 w-16 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-idd-green transition-[width] duration-300"
                style={{ width: `${((currentPage + 1) / manifest.pageCount) * 100}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentPage >= manifest.pageCount - 1}
            aria-label="Sonraki sayfa"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M7.5 15l5-5-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="mx-1 h-6 w-px bg-neutral-200" aria-hidden="true" />

          <label htmlFor="page-jump" className="sr-only">
            Sayfaya git
          </label>
          <input
            key={currentPage}
            id="page-jump"
            type="number"
            min={1}
            max={manifest.pageCount}
            defaultValue={currentPage + 1}
            onChange={handleJumpChange}
            className="h-9 w-12 shrink-0 rounded-full bg-neutral-50 px-2 text-center text-sm text-neutral-700 [appearance:textfield] focus-visible:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
      </div>

      <MagazineZoom
        page={zoomPage}
        totalPages={manifest.pageCount}
        hasPrev={zoomIndex > 0}
        hasNext={zoomIndex >= 0 && zoomIndex < pages.length - 1}
        onClose={handleZoomClose}
        onNext={() => handleZoomStep(1)}
        onPrev={() => handleZoomStep(-1)}
      />
    </section>
  );
}
