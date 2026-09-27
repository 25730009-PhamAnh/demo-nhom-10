/**
 * Chi tiet gia tung dem cua mot khoang luu tru, gop cac dem lien nhau cung gia
 * thanh doan de hien "27/09-28/09 · 1.500.000 x 2 dem". Chi de hien thi: don gia
 * trung binh luon lay tu CSDL (fn_DonGiaTrungBinh), khong tinh lai o day.
 */

export type GiaDem = { ngay: string; donGia: string };

/** Mot doan dem lien nhau cung gia; denNgay la dem cuoi (tinh ca dem do). */
export type DoanGia = { tuNgay: string; denNgay: string; donGia: string; soDem: number };

/** Dau vao la cac dem lien nhau, theo ngay tang dan. */
export function gopDoanGia(dem: GiaDem[]): DoanGia[] {
  const doan: DoanGia[] = [];
  for (const d of dem) {
    const cuoi = doan[doan.length - 1];
    if (cuoi && cuoi.donGia === d.donGia) {
      cuoi.denNgay = d.ngay;
      cuoi.soDem += 1;
    } else {
      doan.push({ tuNgay: d.ngay, denNgay: d.ngay, donGia: d.donGia, soDem: 1 });
    }
  }
  return doan;
}
