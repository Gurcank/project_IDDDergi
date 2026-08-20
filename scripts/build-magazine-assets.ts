// PDF -> tek sayfa görselleri + manifest.
// YEREL çalışır, prod build'de çağrılmaz (poppler bağımlılığı deploy'a taşınmasın).
//
// PDF'in iç sayfaları A3 "spread" (iki A4 sayfa yan yana) olarak gelebilir —
// bu script her spread'i tam ortadan ikiye böler. Bkz.
// docs/dergi-flipbook-rehberi.md §2.2.
//
// Kullanım: node scripts/build-magazine-assets.ts <pdf-yolu> <sayi-slug>

import { execFileSync } from "node:child_process";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const WEB_WIDTH = 1600; // 800 CSS px sayfa x 2 (retina)
const ZOOM_WIDTH = 2400; // 1,5x zoom'da net
const QUALITY = 85;
const PT_PER_INCH = 72;

type PageSource = { widthPt: number; heightPt: number; isSpread: boolean };

/** pdfinfo -f/-l ile TEK sayfanın boyutunu okur. */
function readPageSize(pdfPath: string, pageNo: number): PageSource {
  const out = execFileSync("pdfinfo", ["-f", String(pageNo), "-l", String(pageNo), pdfPath], {
    encoding: "utf8",
  });
  const m = out.match(/Page\s+\d+\s+size:\s+([\d.]+) x ([\d.]+) pts/);
  if (!m) throw new Error(`Sayfa ${pageNo} boyutu okunamadı`);
  const widthPt = Number(m[1]);
  const heightPt = Number(m[2]);
  return { widthPt, heightPt, isSpread: widthPt > heightPt };
}

/**
 * Sabit DPI KULLANMA. Hedef genişlikten hesapla, yoksa farklı sayfa
 * boyutlarında zoom seti sessizce hedefin altında kalır ve hata vermez.
 */
function dpiFor(widthPt: number, targetPx: number): number {
  return Math.min(Math.ceil((targetPx * PT_PER_INCH) / widthPt), 600);
}

/**
 * Sayfa sayısı tek çıkarsa (bkz. §2.3) kapaktan üretilen basit bir kapanış
 * sayfası. Kırpma oranları BU kapağa göre kalibre edildi (COP31 kapağının
 * sağ-alt köşesi düz renk, sol-alt köşesinde IDD ORG logosu var) —
 * sonraki sayıda gerçek bir kapanış sayfası gelirse bu fonksiyon hiç
 * çağrılmaz; farklı bir kapak tasarımıyla tekrar kullanılacaksa oranlar
 * gözden geçirilmeli.
 */
async function generateClosingPage(coverBuffer: Buffer): Promise<Buffer> {
  const coverMeta = await sharp(coverBuffer).metadata();
  const w = coverMeta.width ?? 0;
  const h = coverMeta.height ?? 0;
  const channels = coverMeta.channels ?? 3;

  const logoRegion = {
    left: Math.round(w * 0.06),
    top: Math.round(h * 0.865),
    width: Math.round(w * 0.3),
    height: Math.round(h * 0.055),
  };

  // Arka planı logo kutusunun HEMEN SOLUNDAN örnekle — aynı gradyan
  // şeridinde olduğu için tuvale konunca dikiş görünmüyor. Uzak bir
  // köşeden örneklemek (ör. sağ-alt) farklı bir ton yakalayıp logonun
  // etrafında fark edilir bir dikdörtgen bırakıyordu.
  const bgSample = await sharp(coverBuffer)
    .extract({ left: 0, top: logoRegion.top, width: logoRegion.left - 2, height: logoRegion.height })
    .raw()
    .toBuffer();
  let r = 0;
  let g = 0;
  let b = 0;
  const n = bgSample.length / channels;
  for (let i = 0; i < bgSample.length; i += channels) {
    r += bgSample[i];
    g += bgSample[i + 1];
    b += bgSample[i + 2];
  }
  const background = { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };

  const logoCrop = await sharp(coverBuffer).extract(logoRegion).toBuffer();
  const logo = await sharp(logoCrop).resize({ width: Math.round(w * 0.5) }).toBuffer();
  const logoMeta = await sharp(logo).metadata();
  const logoWidth = logoMeta.width ?? 0;
  const logoHeight = logoMeta.height ?? 0;

  return sharp({ create: { width: w, height: h, channels: 3, background } })
    .composite([
      {
        input: logo,
        left: Math.round((w - logoWidth) / 2),
        top: Math.round((h - logoHeight) / 2),
      },
    ])
    .png()
    .toBuffer();
}

async function main(): Promise<void> {
  const [pdfPath, issue] = process.argv.slice(2);
  if (!pdfPath || !issue) {
    throw new Error("Kullanım: build-magazine-assets.ts <pdf-yolu> <sayi-slug>");
  }

  const outDir = path.join(process.cwd(), "public/dergi", issue);
  const tmpDir = path.join(process.cwd(), ".magazine-tmp");

  await rm(tmpDir, { recursive: true, force: true });
  await mkdir(tmpDir, { recursive: true });
  await mkdir(path.join(outDir, "web"), { recursive: true });
  await mkdir(path.join(outDir, "zoom"), { recursive: true });

  const pdfPageCount = Number(
    execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" }).match(/^Pages:\s+(\d+)/m)?.[1] ?? 0,
  );
  if (!pdfPageCount) throw new Error("Sayfa sayısı okunamadı");

  // Spread'ler A4'ün iki katı genişlikte render edilir, sonra ortadan bölünür.
  const first = readPageSize(pdfPath, 1);
  const singleWidthPt = first.isSpread ? first.widthPt / 2 : first.widthPt;
  const renderDpi = dpiFor(singleWidthPt, ZOOM_WIDTH);
  console.log(`Render DPI: ${renderDpi} (hedef ${ZOOM_WIDTH}px tek sayfa genişliği)`);

  execFileSync(
    "pdftoppm",
    ["-png", "-r", String(renderDpi), pdfPath, path.join(tmpDir, "src")],
    { stdio: "inherit" },
  );

  const rendered = (await readdir(tmpDir)).filter((f) => f.endsWith(".png")).sort();
  if (rendered.length !== pdfPageCount) {
    throw new Error(`${pdfPageCount} sayfa bekleniyordu, ${rendered.length} üretildi`);
  }

  // Tek A4 sayfalara aç
  const singles: Buffer[] = [];
  let coverBuffer: Buffer | null = null;

  for (const [i, file] of rendered.entries()) {
    const src = path.join(tmpDir, file);
    const { isSpread } = readPageSize(pdfPath, i + 1);

    if (!isSpread) {
      const buf = await sharp(src).toBuffer();
      singles.push(buf);
      if (i === 0) coverBuffer = buf;
      continue;
    }

    // ÇİFT piksel genişliğe normalize et, sonra tam ortadan böl.
    // Aksi halde iki yarı 1px farklı olur ve sırtta kayma görünür.
    const spread = await sharp(src).resize({ width: ZOOM_WIDTH * 2, kernel: "lanczos3" }).toBuffer();
    const meta = await sharp(spread).metadata();
    const h = meta.height ?? 0;

    for (const left of [0, ZOOM_WIDTH]) {
      singles.push(await sharp(spread).extract({ left, top: 0, width: ZOOM_WIDTH, height: h }).toBuffer());
    }
    console.log(`PDF sayfa ${i + 1}/${pdfPageCount} bölündü (basılı ${singles.length - 1}-${singles.length})`);
  }

  if (singles.length % 2 !== 0) {
    if (!coverBuffer) throw new Error("Kapanış sayfası üretilemedi: kapak bulunamadı");
    console.warn(
      `UYARI: ${singles.length} sayfa (tek sayı). Kapanış sayfası üretiliyor — bkz. docs/dergi-flipbook-rehberi.md §2.3.`,
    );
    singles.push(await generateClosingPage(coverBuffer));
  }

  let pageWidth = 0;
  let pageHeight = 0;

  for (const [i, buf] of singles.entries()) {
    const name = `sayfa-${String(i + 1).padStart(2, "0")}.webp`;

    const web = await sharp(buf)
      .resize({ width: WEB_WIDTH, kernel: "lanczos3" })
      .webp({ quality: QUALITY })
      .toFile(path.join(outDir, "web", name));

    await sharp(buf)
      .resize({ width: ZOOM_WIDTH, kernel: "lanczos3" })
      .webp({ quality: QUALITY })
      .toFile(path.join(outDir, "zoom", name));

    if (i === 0) {
      pageWidth = web.width;
      pageHeight = web.height;
    } else if (web.width !== pageWidth || web.height !== pageHeight) {
      throw new Error(`Sayfa ${i + 1} farklı boyutta: ${web.width}x${web.height}`);
    }
  }

  const manifest = {
    issue,
    pageCount: singles.length,
    pageWidth,
    pageHeight,
    aspectRatio: Number((pageWidth / pageHeight).toFixed(4)),
    // Sıkıştırma henüz yapılmadı (bkz. §4.3) — orijinal PDF yayınlanıyor.
    // Dosya adı sabit kalıyor, sıkıştırılmış sürüm gelince sadece
    // içerik değişecek, hiçbir kod satırı güncellenmeyecek.
    pdf: `/dergi/${issue}/${issue}.pdf`,
  };

  // page.tsx buradan import ediyor (resolveJsonModule) — @/public/... alias'ına
  // güvenmek yerine. public/ altındaki kopya doğrudan servis/referans için.
  await writeFile(
    path.join(process.cwd(), "app/dergi/manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  await writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  await rm(tmpDir, { recursive: true, force: true });
  console.log(`${singles.length} tek sayfa üretildi → ${outDir}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
