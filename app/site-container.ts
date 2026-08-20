// Bootstrap 5'in .container sınıfının BİREBİR piksel karşılığı — iklimdd.org'un
// navbar/footer'ıyla aynı genişlikte kalması için gerçek siteden ölçülüp
// kopyalandı (min-width eşiklerinde 540/720/960/1140/1320px, kenar boşluğu
// 12px). Tailwind'in kendi kırılma noktaları (sm:640, lg:1024...) Bootstrap'in
// kendi eşikleriyle (576, 992...) örtüşmüyor — bu yüzden isimli breakpoint
// yerine min-[Npx] ile birebir piksel eşiği kullanıldı.
export const SITE_CONTAINER =
  "mx-auto w-full px-3 min-[576px]:max-w-[540px] min-[768px]:max-w-[720px] min-[992px]:max-w-[960px] min-[1200px]:max-w-[1140px] min-[1400px]:max-w-[1320px]";
