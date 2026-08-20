import Image from "next/image";
import { SITE_CONTAINER } from "./site-container";

// Gerçek sitedeki Bootstrap Icons'ın (bootstrap-icons@1.7.2) BİREBİR aynı
// path verisi — https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/icons/*.svg
// kaynağından indirildi. Önceki elle çizilmiş yaklaşık ikonların yerine geçti.
const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/idd.org.tr/",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-6 w-6" aria-hidden="true">
        <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/i%CC%87klim-de%C4%9Fi%C5%9Fmeden-de%C4%9Fi%C5%9F-%C5%9Firket",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-6 w-6" aria-hidden="true">
        <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z" />
      </svg>
    ),
  },
  {
    label: "Spotify",
    href: "https://open.spotify.com/show/0FnjKhFwwugAHvTSIOiVS0?si=5fe08b0c2dde4414&nd=1&dlsi=b1f7cc70aa8e45e4",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-6 w-6" aria-hidden="true">
        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.669 11.538a.498.498 0 0 1-.686.165c-1.879-1.147-4.243-1.407-7.028-.77a.499.499 0 0 1-.222-.973c3.048-.696 5.662-.397 7.77.892a.5.5 0 0 1 .166.686zm.979-2.178a.624.624 0 0 1-.858.205c-2.15-1.321-5.428-1.704-7.972-.932a.625.625 0 0 1-.362-1.194c2.905-.881 6.517-.454 8.986 1.063a.624.624 0 0 1 .206.858zm.084-2.268C10.154 5.56 5.9 5.419 3.438 6.166a.748.748 0 1 1-.434-1.432c2.825-.857 7.523-.692 10.492 1.07a.747.747 0 1 1-.764 1.288z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@iklimdegismedendegis",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-6 w-6" aria-hidden="true">
        <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.007 2.007 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.007 2.007 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31.4 31.4 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.007 2.007 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A99.788 99.788 0 0 1 7.858 2h.193zM6.4 5.209v4.818l4.157-2.408L6.4 5.209z" />
      </svg>
    ),
  },
] as const;

function EnvelopeIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z" />
    </svg>
  );
}

function GeoAltIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z" />
      <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-idd-dark py-12 text-white">
      <div className={SITE_CONTAINER}>
        {/* Bootstrap'in .row satır boşluğu (gutter-y) mobilde 32px, masaüstünde
            sütunlar arası ayrım gap değil sağ sütunun kendi pl-12'siyle (3rem)
            geliyor — gap-10'u sabit tutmak masaüstünde bunun üstüne 40px daha
            ekleyip çift boşluk yaratıyordu. NOT: Bootstrap'in spacer skalası
            Tailwind'inkiyle AYNI SAYIDA AYNI PİKSELİ VERMİYOR (BS mb-3 = 16px,
            Tailwind mb-3 = 12px) — bu dosyadaki boşluk sınıfları bu yüzden
            kaynaktaki sayı birebir kopyalanmadan, ölçülen piksele göre seçildi. */}
        <div className="flex flex-col gap-8 md:flex-row md:gap-0">
          <div className="md:w-7/12">
            <Image src="/brand/idd-logo.png" alt="idd-logo" width={100} height={100} className="mb-4 h-[100px] w-[100px]" />
            <h5 className="mb-2 font-heading text-xl font-extrabold">İklim Değişmeden Değiş (IDD ORG)</h5>
            {/* Gerçek sitede bu metin sönük değil — footer'ın "text-white"
                mirasından geliyor, opaklık azaltan bir sınıf yok (rgb(255,255,255)
                ölçüldü). text-white/70 kullanmak yanlış bir soluklaştırmaydı. */}
            <p className="text-base leading-relaxed">
              İklim için harekete geçmek, yalnızca bilimin değil, sanatın, teknolojinin ve dayanışmanın da ortak
              sorumluluğudur. Değişim ise birlikte düşündüğümüzde, ürettiğimizde ve harekete geçtiğimizde
              mümkündür. <em>Çünkü iklim krizi tek bir alanın değil, insanlığın yaratıcılığının sınavıdır.</em>
            </p>
          </div>

          {/* gap YOK — masaüstünde bu iki blok arası boşluk explicit bir gap
              değil, satırın kendi yüksekliğine (sol sütunla stretch ile eşit)
              göre dağılan justify-between'den geliyor. Mobilde stretch
              olmadığı için justify-between hiçbir şey dağıtmıyor — orada
              gerçek siteden ölçülen 56px'e mb-14 ile birebir eşlendi. */}
          <div className="flex flex-col justify-between md:w-5/12 md:pl-12">
            <div className="mb-14 md:mb-0">
              <h5 className="mb-4 font-heading text-xl font-extrabold">İletişim</h5>
              {/* Gerçek sitede e-posta tıklanabilir bir link DEĞİL, düz metin
                  (doğrudan ölçüldü: <a> yok, <p> içinde) — mailto: kaldırıldı. */}
              <p className="flex items-center gap-2 text-base">
                <EnvelopeIcon />
                iklimdegismedendegis@gmail.com
              </p>
              <p className="mt-2 flex items-center gap-2 text-base">
                <GeoAltIcon />
                İstanbul, Türkiye
              </p>
            </div>

            <div>
              <h5 className="mb-4 font-heading text-xl font-extrabold">Bizi Takip Edin</h5>
              {/* Gerçek sitede ikonlar arası boşluk 20.5px ölçüldü (me-3'ün
                  ikon fontunun kendi glif kutusuyla birleşimi) — gap-3(12px)
                  bunu birebir vermiyordu. */}
              <div className="flex gap-[20.5px]">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="text-white transition-colors hover:text-idd-green"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
