"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import type { MagazinePage } from "./magazine";

type MagazineZoomProps = {
  page: MagazinePage | null;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
};

export function MagazineZoom({
  page,
  totalPages,
  hasPrev,
  hasNext,
  onClose,
  onNext,
  onPrev,
}: MagazineZoomProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    // Dış sistem senkronizasyonu: native <dialog> açık/kapalı durumunu page state'iyle eşitliyor
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (page && !dialog.open) dialog.showModal();
    if (!page && dialog.open) dialog.close();
  }, [page]);

  useEffect(() => {
    // Dış sistem senkronizasyonu: native <dialog>'un 'close' olayını (Escape
    // ve backdrop dahil her kapanış yolunu) React state'ine bağlıyor
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [onClose]);

  useEffect(() => {
    // Dış sistem senkronizasyonu: native <dialog>'un focus-trap'i güvenilir
    // değil — test sırasında üçüncü Tab'da odak dialog dışına (body'e)
    // kaçtığı görüldü. Tab/Shift+Tab'ı dialog içindeki ilk/son elemana
    // elle sarıyoruz.
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]"),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener("keydown", handleKeyDown);
    return () => dialog.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label={page ? `Sayfa ${page.number} — büyütülmüş görünüm` : undefined}
      className="m-0 h-dvh max-h-none w-dvw max-w-none border-0 bg-black/95 p-0 backdrop:bg-black/70"
    >
      {page && (
        <>
          {/* maxScale 2.5: zoomSrc 2400px'te 1,5x'te net, 2x'te kabul edilebilir —
              daha fazlası bulanıklaşır (bkz. docs/dergi-flipbook-rehberi.md §7.2). */}
          <TransformWrapper key={page.id} minScale={1} maxScale={2.5} centerOnInit doubleClick={{ mode: "toggle" }}>
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
              contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <div className="relative h-[85dvh] w-[92dvw]">
                <Image
                  src={page.zoomSrc}
                  alt={`Sayfa ${page.number}`}
                  fill
                  unoptimized
                  priority
                  className="object-contain"
                  draggable={false}
                />
              </div>
            </TransformComponent>
          </TransformWrapper>

          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
            <div className="pointer-events-auto flex justify-end">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label="Kapat"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                  <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="pointer-events-auto flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={onPrev}
                disabled={!hasPrev}
                aria-label="Önceki sayfa"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                  <path d="M12.5 15 7.5 10l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <p aria-live="polite" aria-atomic="true" className="text-sm text-white/80">
                Sayfa {page.number} / {totalPages}
              </p>

              <button
                type="button"
                onClick={onNext}
                disabled={!hasNext}
                aria-label="Sonraki sayfa"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                  <path d="M7.5 15l5-5-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
