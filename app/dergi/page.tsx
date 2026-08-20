import type { Metadata } from "next";
import manifestJson from "./manifest.json";
import { buildPages, type MagazineManifest } from "./magazine";
import { MagazineViewer } from "./MagazineViewer";

const manifest: MagazineManifest = manifestJson;
const pages = buildPages(manifest);

const MAGAZINE_TITLE = "COP31 Türkiye: Shaping the Future of Climate";
const ISSUE_DESCRIPTION =
  "IDD ORG tarafından hazırlanan COP31 Türkiye dergisini sayfalarını çevirerek çevrimiçi okuyun.";

// pdftotext ile ölçülen gerçek kelime sayısından (13.814) hesaplandı — 220
// kelime/dk ortalama okuma hızıyla ~63 dk; yuvarlanmış, iddialı olmayan bir
// tahmin olarak veriliyor.
const READING_MINUTES = 60;

export const metadata: Metadata = {
  title: `${MAGAZINE_TITLE} — IDD ORG`,
  description: ISSUE_DESCRIPTION,
  openGraph: {
    title: `${MAGAZINE_TITLE} — IDD ORG`,
    description: ISSUE_DESCRIPTION,
    images: [pages[0].webSrc],
  },
};

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6v4l2.6 1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Sadece kapak açıkken kapağın soluna gösteriliyor (bkz. MagazineViewer
// `coverInfo`) — sayfayı çevirince kayboluyor. Bu yüzden başlığı burada
// gerçek <h1> yapmadık: sayfanın tek <h1>'i aşağıda, her zaman DOM'da kalan
// sr-only versiyonu. Buradaki <p> görsel olarak aynı görünüyor, ekran
// okuyucuya ayrı bir başlık seviyesi olarak sızmıyor.
function CoverInfo() {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.2em] text-idd-green uppercase">COP31 özel sayısı</p>
      <p className="mt-3 font-heading text-3xl font-extrabold leading-tight text-neutral-900">{MAGAZINE_TITLE}</p>
      <p className="mt-4 text-base leading-relaxed text-neutral-600">
        Antalya, COP31&rsquo;e ev sahipliği yapmaya hazırlanıyor. IDD ORG&rsquo;un hazırladığı bu özel sayıda
        COP&rsquo;un tarihine, Türkiye&rsquo;nin yedi bölgesine, nesli tehlikedeki türlere ve daha fazlasına yer
        veriyoruz.
      </p>
      <div className="mt-6 flex items-center gap-3 text-sm text-neutral-500">
        <span className="flex items-center gap-1.5">
          <ClockIcon />
          ~{READING_MINUTES} dakika okuma
        </span>
        <span className="text-neutral-300" aria-hidden="true">
          ·
        </span>
        <span>{manifest.pageCount} sayfa</span>
      </div>
    </div>
  );
}

export default function MagazinePage() {
  return (
    <main className="min-h-full bg-neutral-100 py-12">
      {/* Sayfanın tek <h1>'i — CoverInfo yalnızca kapaktayken görünüyor,
          bu yüzden başlık DOM'dan hiç kaybolmasın diye ayrı ve kalıcı. */}
      <h1 className="sr-only">{MAGAZINE_TITLE}</h1>

      <MagazineViewer manifest={manifest} pages={pages} coverInfo={<CoverInfo />} />

      {/* JavaScript kapalıyken flipbook hiç render olmaz (react-pageflip
          "use client" gerektiriyor) — bu yedek olmadan sayfa tamamen boş
          kalır. next/image yerine düz <img>: bu yol zaten JS'siz çalışması
          gereken tek yer, next/image'ın istemci tarafı davranışı burada
          anlamsız. */}
      <noscript>
        <div className="mx-auto mt-8 w-full max-w-[1600px] px-4">
          <p className="text-sm text-neutral-700">
            Sayfayı çevirmeli görünüm için JavaScript gerekiyor. Sayfalar aşağıda listelenmiştir.
          </p>
          <ol className="mt-4 flex flex-col gap-4">
            {pages.map((page) => (
              <li key={page.id}>
                {/* eslint-disable-next-line @next/next/no-img-element -- JS'siz yedek, next/image istemci davranışı burada geçersiz */}
                <img src={page.webSrc} alt={`Sayfa ${page.number}`} className="w-full" />
              </li>
            ))}
          </ol>
        </div>
      </noscript>
    </main>
  );
}
