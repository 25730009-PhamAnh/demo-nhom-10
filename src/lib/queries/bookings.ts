import "server-only";

import { and, asc, eq, inArray, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { thongBaoCsdl } from "@/db/loi";
import { callProcedure } from "@/db/procedures";
import * as schema from "@/db/schema";
import { gopDoanGia, type DoanGia, type GiaDem } from "@/lib/chi-tiet-gia";
import { laNgay } from "@/lib/thao-tac/kiem-tra";
import { congTien } from "@/lib/tinh-toan";

/**
 * Mat tien doc phieu dat phong. "Hom nay" la CURDATE() cua CSDL (xem
 * queries/ngay.ts). Tra cuu phong trong goi sp_TraCuuPhongTrong, dung vi tu
 * kha dung cua sp_DatPhong, nen so phong trong luon khop voi luc dat that.
 */

export type PhieuTomTat = {
  maDatPhong: string;
  maKh: string;
  hoTenKhach: string;
  cccd: string;
  sdt: string | null;
  ngayCheckIn: string;
  ngayCheckOut: string;
  soDem: number;
  trangThai: string;
  tienCoc: string;
  soPhong: string[];
  tenLoaiPhong: string;
  tongTienPhong: string;
  /** Hoa don cua phieu (moi phieu toi da mot), null khi chua lap. */
  hoaDon: { maHoaDon: string; trangThai: string } | null;
};

export type LoaiPhongConTrong = {
  maLoaiPhong: string;
  tenLoaiPhong: string;
  /**
   * Don gia mot dem ma sp_DatPhong se chot cho dung khoang ngay nay (RB-06):
   * fn_DonGiaTrungBinh, cung ham sp_DatPhong goi. Form dat phong tam tinh va
   * tinh tien coc theo so nay.
   */
  donGiaNgay: string;
  soPhongTrong: number;
  /** Gia tung dem gop thanh doan, chi de hien "Chi tiet gia". */
  chiTietGia: DoanGia[];
};

const pdp = schema.phieuDatPhong;
const kh = schema.khachHang;
const ctdp = schema.chiTietDatPhong;

/** Doc cac phieu thoa dieu kien, kem khach, phong va loai phong, theo ma phieu. */
async function docPhieu(dieuKien: SQL | undefined): Promise<PhieuTomTat[]> {
  const phieu = await db
    .select({
      maDatPhong: pdp.maDatPhong,
      maKh: pdp.maKh,
      hoTenKhach: kh.hoTen,
      cccd: kh.cccd,
      sdt: kh.sdt,
      ngayCheckIn: pdp.ngayCheckIn,
      ngayCheckOut: pdp.ngayCheckOut,
      soDem: sql<number>`DATEDIFF(${pdp.ngayCheckOut}, ${pdp.ngayCheckIn})`.mapWith(Number),
      trangThai: pdp.trangThai,
      tienCoc: pdp.tienCoc,
      maHoaDon: schema.hoaDon.maHoaDon,
      trangThaiHoaDon: schema.hoaDon.trangThai,
    })
    .from(pdp)
    .innerJoin(kh, eq(kh.maKh, pdp.maKh))
    .leftJoin(schema.hoaDon, eq(schema.hoaDon.maDatPhong, pdp.maDatPhong))
    .where(dieuKien)
    .orderBy(asc(pdp.maDatPhong));
  if (phieu.length === 0) return [];

  const chiTiet = await db
    .select({
      maDatPhong: ctdp.maDatPhong,
      soPhong: schema.phong.soPhong,
      tenLoaiPhong: schema.loaiPhong.tenLoaiPhong,
      thanhTien: ctdp.thanhTien,
    })
    .from(ctdp)
    .innerJoin(schema.phong, eq(schema.phong.maPhong, ctdp.maPhong))
    .innerJoin(schema.loaiPhong, eq(schema.loaiPhong.maLoaiPhong, schema.phong.maLoaiPhong))
    .where(inArray(ctdp.maDatPhong, phieu.map((p) => p.maDatPhong)))
    .orderBy(asc(schema.phong.soPhong));

  return phieu.map(({ maHoaDon, trangThaiHoaDon, ...p }) => {
    const cua = chiTiet.filter((c) => c.maDatPhong === p.maDatPhong);
    return {
      ...p,
      hoaDon: maHoaDon && trangThaiHoaDon ? { maHoaDon, trangThai: trangThaiHoaDon } : null,
      soPhong: cua.map((c) => c.soPhong),
      tenLoaiPhong: cua[0]?.tenLoaiPhong ?? "—",
      // thanhTien la cot sinh (generatedAlwaysAs) nen kieu la string | null.
      tongTienPhong: congTien(...cua.map((c) => c.thanhTien ?? "0.00")),
    };
  });
}

export async function getPhieuNhanHomNay(): Promise<PhieuTomTat[]> {
  return docPhieu(and(eq(pdp.trangThai, "DaDat"), eq(pdp.ngayCheckIn, sql`CURDATE()`)));
}

export async function getPhieuTraHomNay(): Promise<PhieuTomTat[]> {
  return docPhieu(and(eq(pdp.trangThai, "DangO"), eq(pdp.ngayCheckOut, sql`CURDATE()`)));
}

/** Moi phieu dang o, khong rieng phieu tra hom nay: man Dich vu ghi cho phieu nao cung duoc. */
export async function getPhieuDangO(): Promise<PhieuTomTat[]> {
  return docPhieu(eq(pdp.trangThai, "DangO"));
}

export async function getPhieuTheoMa(ma: string): Promise<PhieuTomTat | null> {
  const [p] = await docPhieu(eq(pdp.maDatPhong, ma));
  return p ?? null;
}

/**
 * So phong con trong theo tung loai trong [checkIn, checkOut). LOAI_PHONG lam
 * goc de loai het phong van co dong soPhongTrong = 0. Ngay sai thi
 * sp_TraCuuPhongTrong SIGNAL va ham nay nem loi do.
 */
export async function getLoaiPhongConTrong(
  checkIn: string,
  checkOut: string,
): Promise<LoaiPhongConTrong[]> {
  const [[loai], [dem], phongTrong] = await Promise.all([
    db.execute(sql`
      SELECT   MaLoaiPhong AS maLoaiPhong,
               TenLoaiPhong AS tenLoaiPhong,
               fn_DonGiaTrungBinh(MaLoaiPhong, ${checkIn}, ${checkOut}) AS donGiaNgay
      FROM     LOAI_PHONG
      ORDER BY MaLoaiPhong`),
    db.execute(sql`
      WITH RECURSIVE CacDem (Ngay) AS (
        SELECT CAST(${checkIn} AS DATE)
        UNION ALL
        SELECT Ngay + INTERVAL 1 DAY FROM CacDem WHERE Ngay + INTERVAL 1 DAY < ${checkOut}
      )
      SELECT   lp.MaLoaiPhong AS maLoaiPhong,
               DATE_FORMAT(d.Ngay, '%Y-%m-%d') AS ngay,
               fn_DonGiaPhongTheoNgay(lp.MaLoaiPhong, d.Ngay) AS donGia
      FROM     LOAI_PHONG lp CROSS JOIN CacDem d
      ORDER BY lp.MaLoaiPhong, d.Ngay`),
    callProcedure<{ MaLoaiPhong: string }>("sp_TraCuuPhongTrong", [checkIn, checkOut, null]),
  ]);

  const giaDem = dem as unknown as (GiaDem & { maLoaiPhong: string })[];
  type DongLoai = Pick<LoaiPhongConTrong, "maLoaiPhong" | "tenLoaiPhong" | "donGiaNgay">;
  return (loai as unknown as DongLoai[]).map((l) => ({
    ...l,
    soPhongTrong: phongTrong.filter((p) => p.MaLoaiPhong === l.maLoaiPhong).length,
    chiTietGia: gopDoanGia(
      giaDem
        .filter((d) => d.maLoaiPhong === l.maLoaiPhong)
        .map((d) => ({ ngay: d.ngay, donGia: d.donGia })),
    ),
  }));
}

const SO_DEM_TOI_DA = 1000;

/**
 * Ban an toan cua getLoaiPhongConTrong: khong nem loi ma tra ve ket qua co gan
 * nhan, de Server Action goi tu form dat phong khong lam vo trang khi nguoi
 * dung go ngay sai.
 */
export async function traCuuPhongTrongAnToan(
  checkIn: string,
  checkOut: string,
): Promise<{ ok: true; data: LoaiPhongConTrong[] } | { ok: false; loi: string }> {
  // O ngay cua trinh duyet cho xoa trong. Ngay rong / sai den MySQL la loi
  // 1292 chu khong phai SIGNAL; chan truoc de bao mot cau de hieu.
  if (!laNgay(checkIn) || !laNgay(checkOut)) {
    return { ok: false, loi: "Ngày không hợp lệ" };
  }
  // CTE de quy tinh don gia (va buoc 3e cua sp_DatPhong) dung o
  // cte_max_recursion_depth = 1000 dem, qua muc do MySQL bao loi 3636 chu
  // khong phai SIGNAL. Go nham nam la gap ngay, nen chan truoc.
  if ((Date.parse(checkOut) - Date.parse(checkIn)) / 86_400_000 > SO_DEM_TOI_DA) {
    return { ok: false, loi: `Mỗi lần chỉ tra cứu tối đa ${SO_DEM_TOI_DA} đêm` };
  }
  try {
    return { ok: true, data: await getLoaiPhongConTrong(checkIn, checkOut) };
  } catch (err) {
    return { ok: false, loi: thongBaoCsdl(err) };
  }
}
