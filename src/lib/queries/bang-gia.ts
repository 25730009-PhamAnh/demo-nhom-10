import "server-only";

import { asc, sql } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";

/**
 * Mat tien doc cua man Bang gia. Gia mot ngay luon hoi fn_DonGiaPhongTheoNgay
 * (khoang BANG_GIA_PHONG phu ngay do, khong co thi LOAI_PHONG.DonGiaNgay), dung
 * ham ma sp_DatPhong dung qua fn_DonGiaTrungBinh.
 */

export type KhoangGia = {
  maBangGia: string;
  apDungTuNgay: string;
  denNgay: string;
  donGia: string;
  heSo: string;
};

export type LoaiPhongGia = {
  maLoaiPhong: string;
  tenLoaiPhong: string;
  donGiaNgay: string;
  khoang: KhoangGia[];
};

export async function getBangGia(): Promise<LoaiPhongGia[]> {
  const lp = schema.loaiPhong;
  const bg = schema.bangGiaPhong;
  const [loai, khoang] = await Promise.all([
    db
      .select({ maLoaiPhong: lp.maLoaiPhong, tenLoaiPhong: lp.tenLoaiPhong, donGiaNgay: lp.donGiaNgay })
      .from(lp)
      .orderBy(asc(lp.maLoaiPhong)),
    db
      .select({
        maLoaiPhong: bg.maLoaiPhong,
        maBangGia: bg.maBangGia,
        apDungTuNgay: bg.apDungTuNgay,
        denNgay: bg.denNgay,
        donGia: bg.donGia,
        heSo: bg.heSo,
      })
      .from(bg)
      .orderBy(asc(bg.apDungTuNgay)),
  ]);

  return loai.map((l) => ({
    ...l,
    khoang: khoang
      .filter((k) => k.maLoaiPhong === l.maLoaiPhong)
      .map((k) => ({
        maBangGia: k.maBangGia,
        apDungTuNgay: k.apDungTuNgay,
        denNgay: k.denNgay,
        donGia: k.donGia,
        heSo: k.heSo,
      })),
  }));
}

export type LichGia = {
  ngay: string[];
  loai: {
    maLoaiPhong: string;
    tenLoaiPhong: string;
    donGiaNgay: string;
    gia: { donGia: string; coKhaiGia: boolean }[];
  }[];
};

type DongLich = {
  maLoaiPhong: string;
  tenLoaiPhong: string;
  donGiaNgay: string;
  ngay: string;
  donGia: string;
  coKhaiGia: number;
};

/** Loai phong x ngay trong [tuNgay, tuNgay + soNgay); coKhaiGia = ngay do co khoang BANG_GIA_PHONG phu. */
export async function getLichGia(tuNgay: string, soNgay = 14): Promise<LichGia> {
  const [rows] = await db.execute(sql`
    WITH RECURSIVE CacNgay (Ngay) AS (
      SELECT CAST(${tuNgay} AS DATE)
      UNION ALL
      SELECT Ngay + INTERVAL 1 DAY FROM CacNgay
      WHERE  Ngay < CAST(${tuNgay} AS DATE) + INTERVAL ${soNgay - 1} DAY
    )
    SELECT   lp.MaLoaiPhong AS maLoaiPhong,
             lp.TenLoaiPhong AS tenLoaiPhong,
             lp.DonGiaNgay AS donGiaNgay,
             DATE_FORMAT(d.Ngay, '%Y-%m-%d') AS ngay,
             fn_DonGiaPhongTheoNgay(lp.MaLoaiPhong, d.Ngay) AS donGia,
             EXISTS (SELECT 1 FROM BANG_GIA_PHONG bg
                     WHERE  bg.MaLoaiPhong = lp.MaLoaiPhong
                       AND  d.Ngay BETWEEN bg.ApDungTuNgay AND bg.DenNgay) AS coKhaiGia
    FROM     LOAI_PHONG lp CROSS JOIN CacNgay d
    ORDER BY lp.MaLoaiPhong, d.Ngay`);

  const dong = rows as unknown as DongLich[];
  const theoLoai = new Map<string, LichGia["loai"][number]>();
  for (const r of dong) {
    let l = theoLoai.get(r.maLoaiPhong);
    if (!l) {
      l = { maLoaiPhong: r.maLoaiPhong, tenLoaiPhong: r.tenLoaiPhong, donGiaNgay: r.donGiaNgay, gia: [] };
      theoLoai.set(r.maLoaiPhong, l);
    }
    l.gia.push({ donGia: r.donGia, coKhaiGia: Boolean(r.coKhaiGia) });
  }
  return { ngay: [...new Set(dong.map((r) => r.ngay))], loai: [...theoLoai.values()] };
}
