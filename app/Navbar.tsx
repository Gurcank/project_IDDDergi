"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SITE_CONTAINER } from "./site-container";

// iklimdd.org'un kendi sayfaları bu depoda yok (bkz. docs/dergi-flipbook-rehberi.md
// — proje sadece siteye eklenecek /dergi sayfası). Bu yüzden Dergi dışındaki
// tüm linkler gerçek siteye mutlak URL ile gidiyor; Dergi tek yerel route.
const NAV_LINKS = [
  { label: "Ana Sayfa", href: "https://iklimdd.org/" },
  { label: "Hakkımızda", href: "https://iklimdd.org/about" },
] as const;

const PROJECT_LINKS = [
  { label: "Kitap", href: "https://iklimdd.org/book" },
  { label: "Podcast", href: "https://iklimdd.org/podcast" },
  { label: "Kampanyalarımız", href: "https://iklimdd.org/campaings" },
  { label: "Dergi", href: "/dergi" },
] as const;

const TRAILING_LINKS = [
  { label: "Etkinliklerimiz", href: "https://iklimdd.org/events" },
  { label: "Blog", href: "https://iklimdd.org/blog" },
  { label: "İletişim", href: "https://iklimdd.org/contact" },
] as const;

// Gerçek sitede navbar Bootstrap'in "lg" eşiğinde (992px) katlanıyor —
// Tailwind'in kendi lg: eşiği (1024px) burada BİREBİR eşleşmiyor, o yüzden
// tüm masaüstü/mobil geçişler aşağıda min-[992px]: ile yazıldı. ÖNEMLİ:
// bu değer bir JS değişkeninde TUTULAMAZ — Tailwind sınıf adlarını derleme
// zamanında statik metin taraması ile buluyor, `${DESKTOP}:flex` gibi
// template-literal ile üretilen bir sınıf adı asla derlenmiyor (denendi,
// masaüstü nav tamamen görünmez kaldı). Her yerde tam sınıf adı yazılı olmalı.

// Gerçek sitede bu bir SVG değil, Bootstrap'in .dropdown-toggle::after'ı —
// saf CSS kenarlarıyla çizilen bir üçgen. Ölçülen orijinal sol boşluk
// (4.4px) kullanıcı isteğiyle bilinçli olarak artırıldı — "Projelerimiz"
// yazısına biraz daha uzak dursun diye.
function DropdownCaret({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`ml-2 inline-block border-x-[5px] border-t-[5px] border-x-transparent border-t-white transition-transform ${open ? "rotate-180" : ""}`}
    />
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      {open ? (
        <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      ) : (
        <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const isDergiActive = pathname === "/dergi";

  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const projectsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dış sistem senkronizasyonu: dropdown dışına tıklanınca kapat
    if (!isProjectsOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!projectsRef.current?.contains(event.target as Node)) setIsProjectsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsProjectsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProjectsOpen]);

  // Bootstrap'in .nav-link'i dış boşluğu kendi padding'iyle yaratıyor,
  // aradaki flex gap değil. Gerçek sitede DOĞRUDAN ölçülen padding 8px/8px
  // (px-4/py-4 DEĞİL, px-2/py-2) — px-4 kullanmak öğeler arası boşluğu
  // olması gerekenin (16px) tam iki katına (32px) çıkarıyordu; metin-metin
  // mesafesi her iki sitede de tek tek ölçülüp doğrulandı. Yazı boyutu
  // (17.28px) da gerçek siteden ölçüldü — Tailwind'in text-base'i (16px)
  // burada BİREBİR değil.
  const navLinkClass = "px-2 py-2 text-[17.28px] text-white/55 transition-colors hover:text-white/80";
  const activeNavLinkClass = "px-2 py-2 text-[17.28px] text-white transition-colors hover:text-white/80";

  return (
    <header className="sticky top-0 z-50 bg-idd-dark">
      <div className={`${SITE_CONTAINER} flex items-center py-[14.6px]`}>
        <a
          href="https://iklimdd.org/"
          className="flex shrink-0 items-center min-[992px]:mr-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Image src="/brand/idd-logo.png" alt="idd-logo" width={56} height={56} className="mr-2 min-[992px]:mr-0" priority />
          <span className="text-[18.88px] font-bold text-white min-[992px]:hidden">IDD ORG</span>
        </a>

        <nav className="hidden min-[992px]:flex min-[992px]:items-center">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={navLinkClass}>
              {link.label}
            </a>
          ))}

          <div ref={projectsRef} className="relative">
            <button
              type="button"
              onClick={() => setIsProjectsOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={isProjectsOpen}
              className={`flex items-center ${isDergiActive ? activeNavLinkClass : navLinkClass}`}
            >
              Projelerimiz
              <DropdownCaret open={isProjectsOpen} />
            </button>

            {isProjectsOpen && (
              <div
                role="menu"
                className="absolute top-full left-0 mt-1 w-52 rounded-md border border-white/10 bg-idd-dark py-2 shadow-lg"
              >
                {PROJECT_LINKS.map((link) =>
                  link.href.startsWith("/") ? (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      onClick={() => setIsProjectsOpen(false)}
                      className={`block px-4 py-1 text-[17.28px] transition-colors hover:bg-idd-green hover:text-white ${
                        pathname === link.href ? "text-white" : "text-white/70"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      className="block px-4 py-1 text-[17.28px] text-white/70 transition-colors hover:bg-idd-green hover:text-white"
                    >
                      {link.label}
                    </a>
                  ),
                )}
              </div>
            )}
          </div>

          {TRAILING_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={navLinkClass}>
              {link.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setIsMobileOpen((open) => !open)}
          aria-label={isMobileOpen ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={isMobileOpen}
          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded text-white min-[992px]:hidden"
        >
          <MenuIcon open={isMobileOpen} />
        </button>
      </div>

      {isMobileOpen && (
        <nav className="border-t border-white/10 px-4 pb-4 min-[992px]:hidden">
          <div className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="py-2.5 text-[17.28px] text-white/55 transition-colors hover:text-white/80">
                {link.label}
              </a>
            ))}

            <p className="pt-2.5 text-[17.28px] font-medium text-white/55">Projelerimiz</p>
            {PROJECT_LINKS.map((link) =>
              link.href.startsWith("/") ? (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`py-2 pl-4 text-[17.28px] ${pathname === link.href ? "text-white" : "text-white/70"}`}
                >
                  {link.label}
                </Link>
              ) : (
                <a key={link.href} href={link.href} className="py-2 pl-4 text-[17.28px] text-white/70">
                  {link.label}
                </a>
              ),
            )}

            {TRAILING_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="py-2.5 text-[17.28px] text-white/55 transition-colors hover:text-white/80">
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
