import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import "./globals.css";

// iklimdd.org da Inter kullanıyor (bkz. Navbar/Footer'ın eşleştiği marka) —
// Geist yerine bununla değiştirildi ki eklenen sayfa geri kalanla tutarlı görünsün.
const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Gerçek sitede footer başlıkları (İklim Değişmeden Değiş, İletişim, Bizi
// Takip Edin) gövde metninden FARKLI bir yazı tipiyle geliyor — Montserrat,
// 800 ağırlık (ölçülüp doğrulandı). Bkz. app/Footer.tsx.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["800"],
});

export const metadata: Metadata = {
  title: "IDD ORG",
  description: "İklim Değişmeden Değiş (IDD ORG)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${inter.variable} ${montserrat.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Navbar />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
