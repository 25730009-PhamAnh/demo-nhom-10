import "server-only";

import { asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";

/** Mat tien doc hoa don. Lap / thanh toan hoa don la viec cua phase 2 (sp_LapHoaDon, sp_ThanhToanHoaDon). */

export type HoaDonDayDu = {
  maHoaDon: string;
  maDatPhong: string;
  ngayLap: string;
  trangThai: string;
  loaiThanhToan: string | null;
  tongTien: string;
  khach: { hoTen: string; maKh: string; cccd: string; sdt: string | null };
  phieu: {
    ngayCheckIn: string;
    ngayCheckOut: string;
    soDem: number;
    soPhong: string[];
    tenLoaiPhong: string;
  };
  khoanMuc: { loaiKhoanMuc: string; ghiChu: string | null; soTien: string }[];
};

const hoaDon = schema.hoaDon;
const pdp = schema.phieuDatPhong;
const kh = schema.khachHang;

export async function getHoaDon(ma: string): Promise<HoaDonDayDu | null> {
  const [hd] = await db
    .select({
      maHoaDon: hoaDon.maHoaDon,
      maDatPhong: hoaDon.maDatPhong,
      ngayLap: hoaDon.ngayLap,
      trangThai: hoaDon.trangThai,
      loaiThanhToan: hoaDon.loaiThanhToan,
      tongTien: hoaDon.tongTien,
      hoTen: kh.hoTen,
      maKh: kh.maKh,
      cccd: kh.cccd,
      sdt: kh.sdt,
      ngayCheckIn: pdp.ngayCheckIn,
      ngayCheckOut: pdp.ngayCheckOut,
      soDem: sql<number>`DATEDIFF(${pdp.ngayCheckOut}, ${pdp.ngayCheckIn})`.mapWith(Number),
    })
    .from(hoaDon)
    .innerJoin(pdp, eq(pdp.maDatPhong, hoaDon.maDatPhong))
    .innerJoin(kh, eq(kh.maKh, pdp.maKh))
    .where(eq(hoaDon.maHoaDon, ma));
  if (!hd) return null;

  const [dsPhong, khoanMuc] = await Promise.all([
    db
      .select({ soPhong: schema.phong.soPhong, tenLoaiPhong: schema.loaiPhong.tenLoaiPhong })
      .from(schema.chiTietDatPhong)
      .innerJoin(schema.phong, eq(schema.phong.maPhong, schema.chiTietDatPhong.maPhong))
      .innerJoin(schema.loaiPhong, eq(schema.loaiPhong.maLoaiPhong, schema.phong.maLoaiPhong))
      .where(eq(schema.chiTietDatPhong.maDatPhong, hd.maDatPhong))
      .orderBy(asc(schema.phong.soPhong)),
    db
      .select({
        loaiKhoanMuc: schema.chiTietHoaDon.loaiKhoanMuc,
        ghiChu: schema.chiTietHoaDon.ghiChu,
        soTien: schema.chiTietHoaDon.soTien,
      })
      .from(schema.chiTietHoaDon)
      .where(eq(schema.chiTietHoaDon.maHoaDon, ma))
      .orderBy(asc(schema.chiTietHoaDon.maCthd)),
  ]);

  return {
    maHoaDon: hd.maHoaDon,
    maDatPhong: hd.maDatPhong,
    ngayLap: hd.ngayLap,
    trangThai: hd.trangThai,
    loaiThanhToan: hd.loaiThanhToan,
    tongTien: hd.tongTien,
    khach: { hoTen: hd.hoTen, maKh: hd.maKh, cccd: hd.cccd, sdt: hd.sdt },
    phieu: {
      ngayCheckIn: hd.ngayCheckIn,
      ngayCheckOut: hd.ngayCheckOut,
      soDem: hd.soDem,
      soPhong: dsPhong.map((p) => p.soPhong),
      tenLoaiPhong: dsPhong[0]?.tenLoaiPhong ?? "—",
    },
    khoanMuc,
  };
}

/** Danh sach cho trang /invoices (muc "Hoa don" tren thanh dieu huong), moi nhat truoc. */
export async function getDanhSachHoaDon() {
  return db
    .select({
      maHoaDon: hoaDon.maHoaDon,
      maDatPhong: hoaDon.maDatPhong,
      ngayLap: hoaDon.ngayLap,
      tongTien: hoaDon.tongTien,
      trangThai: hoaDon.trangThai,
      hoTenKhach: kh.hoTen,
    })
    .from(hoaDon)
    .innerJoin(pdp, eq(pdp.maDatPhong, hoaDon.maDatPhong))
    .innerJoin(kh, eq(kh.maKh, pdp.maKh))
    // Nhieu hoa don cung gio lap (hoa don nhap sang nay), them ma de thu tu on dinh.
    .orderBy(desc(hoaDon.ngayLap), desc(hoaDon.maHoaDon));
}
