import "server-only";

import { and, asc, eq, inArray, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { thongBaoCsdl } from "@/db/loi";
import { callProcedure } from "@/db/procedures";
import * as schema from "@/db/schema";
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
};

export type LoaiPhongConTrong = {
  maLoaiPhong: string;
  tenLoaiPhong: string;
  donGiaNgay: string;
  soPhongTrong: number;
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
    })
    .from(pdp)
    .innerJoin(kh, eq(kh.maKh, pdp.maKh))
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

  return phieu.map((p) => {
    const cua = chiTiet.filter((c) => c.maDatPhong === p.maDatPhong);
    return {
      ...p,
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
  const [loai, phongTrong] = await Promise.all([
    db
      .select({
        maLoaiPhong: schema.loaiPhong.maLoaiPhong,
        tenLoaiPhong: schema.loaiPhong.tenLoaiPhong,
        donGiaNgay: schema.loaiPhong.donGiaNgay,
      })
      .from(schema.loaiPhong)
      .orderBy(asc(schema.loaiPhong.maLoaiPhong)),
    callProcedure<{ MaLoaiPhong: string }>("sp_TraCuuPhongTrong", [checkIn, checkOut, null]),
  ]);

  return loai.map((l) => ({
    ...l,
    soPhongTrong: phongTrong.filter((p) => p.MaLoaiPhong === l.maLoaiPhong).length,
  }));
}

const NGAY_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Ngay 'YYYY-MM-DD' co that tren lich; chan chuoi rong va ngay nhu 2026-02-30. */
function laNgayHopLe(s: string): boolean {
  if (!NGAY_ISO.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

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
  // 1292 chu khong phai SIGNAL, thongBaoCsdl se nem tiep, nen phai chan truoc.
  if (!laNgayHopLe(checkIn) || !laNgayHopLe(checkOut)) {
    return { ok: false, loi: "Ngày không hợp lệ" };
  }
  try {
    return { ok: true, data: await getLoaiPhongConTrong(checkIn, checkOut) };
  } catch (err) {
    return { ok: false, loi: thongBaoCsdl(err) };
  }
}
