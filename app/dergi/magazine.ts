export type MagazineManifest = {
  issue: string;
  pageCount: number;
  pageWidth: number;
  pageHeight: number;
  aspectRatio: number;
  pdf: string;
};

export type MagazinePage = {
  /** Stabil kimlik — liste key'i olarak kullanılır */
  id: string;
  /** 1'den başlar, kullanıcıya gösterilen numara */
  number: number;
  webSrc: string;
  zoomSrc: string;
};

export function buildPages(manifest: MagazineManifest): MagazinePage[] {
  return Array.from({ length: manifest.pageCount }, (_, i) => {
    const pageNumber = i + 1;
    const padded = String(pageNumber).padStart(2, "0");
    const base = `/dergi/${manifest.issue}`;
    return {
      id: `${manifest.issue}-${padded}`,
      number: pageNumber,
      webSrc: `${base}/web/sayfa-${padded}.webp`,
      zoomSrc: `${base}/zoom/sayfa-${padded}.webp`,
    };
  });
}
