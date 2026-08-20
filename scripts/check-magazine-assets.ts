// Faz 1 çıktısının bütünlüğünü build öncesi doğrular. Amaç: eksik/bozuk bir
// varlık runtime'da (kullanıcının ekranında) değil, burada yakalansın.
//
// package.json: "prebuild": "node scripts/check-magazine-assets.ts"

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MANIFEST_PATH = path.join(process.cwd(), "app/dergi/manifest.json");
const MAX_PDF_BYTES_HARD = 74 * 1024 * 1024; // sıkıştırma henüz yok — bkz. §4.3, §9.5

type Manifest = {
  issue: string;
  pageCount: number;
  pageWidth: number;
  pageHeight: number;
  aspectRatio: number;
  pdf: string;
};

const errors: string[] = [];
const warnings: string[] = [];

async function main(): Promise<void> {
  let raw: string;
  try {
    raw = await readFile(MANIFEST_PATH, "utf8");
  } catch {
    fail(`manifest.json okunamadı: ${MANIFEST_PATH}`);
    return report();
  }

  const manifest = JSON.parse(raw) as Manifest;
  const outDir = path.join(process.cwd(), "public/dergi", manifest.issue);

  if (manifest.pageCount % 2 !== 0) {
    fail(`pageCount tek sayı (${manifest.pageCount}) — showCover ile aradaki sayfalar çift olmalı`);
  }

  for (const set of ["web", "zoom"] as const) {
    const dir = path.join(outDir, set);
    let files: string[];
    try {
      files = (await readdir(dir)).filter((f) => f.endsWith(".webp")).sort();
    } catch {
      fail(`${set}/ klasörü yok: ${dir}`);
      continue;
    }

    if (files.length !== manifest.pageCount) {
      fail(`${set}/ içinde ${files.length} dosya var, manifest ${manifest.pageCount} bekliyor`);
    }

    for (let i = 0; i < files.length; i++) {
      const expected = `sayfa-${String(i + 1).padStart(2, "0")}.webp`;
      if (files[i] !== expected) {
        fail(`${set}/ numaralandırması kesintili: "${expected}" bekleniyordu, "${files[i]}" bulundu`);
        break;
      }
    }

    if (set === "web") {
      for (const file of files) {
        const meta = await sharp(path.join(dir, file)).metadata();
        if (meta.width !== manifest.pageWidth || meta.height !== manifest.pageHeight) {
          fail(
            `${file}: ${meta.width}x${meta.height}, manifest ${manifest.pageWidth}x${manifest.pageHeight} bekliyor`,
          );
        }
      }
    }
  }

  const pdfPath = path.join(process.cwd(), "public", manifest.pdf);
  try {
    const pdfStat = await stat(pdfPath);
    if (pdfStat.size > MAX_PDF_BYTES_HARD) {
      fail(`PDF ${(pdfStat.size / 1024 / 1024).toFixed(1)} MB — beklenenden büyük`);
    } else if (pdfStat.size > 20 * 1024 * 1024) {
      warn(
        `PDF ${(pdfStat.size / 1024 / 1024).toFixed(1)} MB — sıkıştırılmamış (bilinçli karar, bkz. §4.3). Mobilde ağır.`,
      );
    }
  } catch {
    fail(`PDF bulunamadı: ${pdfPath}`);
  }

  report();
}

function fail(message: string): void {
  errors.push(message);
}
function warn(message: string): void {
  warnings.push(message);
}

function report(): void {
  for (const w of warnings) console.warn(`UYARI: ${w}`);
  if (errors.length > 0) {
    console.error(`Dergi varlıkları doğrulanamadı (${errors.length} sorun):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log("Dergi varlıkları doğrulandı.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
