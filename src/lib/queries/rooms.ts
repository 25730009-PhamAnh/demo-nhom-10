import "server-only";

import { asc, count, eq } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { TRANG_THAI_PHONG, nhanTrangThaiPhong } from "@/lib/status";

/** Mat tien doc du lieu phong tu CSDL. Chu ky giu nguyen tu giai doan du lieu gia. */

export type PhongTrenSoDo = {
  maPhong: string;
  soPhong: string;
  tang: number;
  tenLoaiPhong: string;
  donGiaNgay: string;
  trangThai: string;
};

export async function getSoDoPhong(): Promise<PhongTrenSoDo[]> {
  return db
    .select({
      maPhong: schema.phong.maPhong,
      soPhong: schema.phong.soPhong,
      tang: schema.phong.tang,
      tenLoaiPhong: schema.loaiPhong.tenLoaiPhong,
      donGiaNgay: schema.loaiPhong.donGiaNgay,
      trangThai: schema.phong.trangThai,
    })
    .from(schema.phong)
    .innerJoin(schema.loaiPhong, eq(schema.phong.maLoaiPhong, schema.loaiPhong.maLoaiPhong))
    .orderBy(asc(schema.phong.soPhong));
}

/**
 * Duyet theo TRANG_THAI_PHONG chu khong theo ket qua GROUP BY, de trang thai
 * khong co phong nao van hien mot chip voi so 0 dung nhu artboard.
 */
export function gopThongKeTrangThai(dem: { ma: string; soLuong: number }[]) {
  const theoMa = new Map(dem.map((d) => [d.ma, d.soLuong]));
  return TRANG_THAI_PHONG.map((ma) => ({
    ma,
    nhan: nhanTrangThaiPhong(ma).nhan,
    soLuong: theoMa.get(ma) ?? 0,
  }));
}

export async function getThongKePhongTheoTrangThai() {
  const dem = await db
    .select({ ma: schema.phong.trangThai, soLuong: count() })
    .from(schema.phong)
    .groupBy(schema.phong.trangThai);
  return gopThongKeTrangThai(dem);
}

export async function getNhatKyBuongPhong() {
  // DON_PHONG va SUA_PHONG cung dung cot ThoiGian; SUA_PHONG co MoTaLoi va
  // ChiPhi (NOT NULL, mac dinh '0.00'), DON_PHONG co GhiChu va khong co chi phi.
  const [don, sua] = await Promise.all([
    db
      .select({
        ngayGio: schema.donPhong.thoiGian,
        soPhong: schema.phong.soPhong,
        nhanVien: schema.taiKhoan.hoTen,
        ghiChu: schema.donPhong.ghiChu,
      })
      .from(schema.donPhong)
      .innerJoin(schema.phong, eq(schema.donPhong.maPhong, schema.phong.maPhong))
      .innerJoin(schema.taiKhoan, eq(schema.donPhong.maTk, schema.taiKhoan.maTk)),
    db
      .select({
        ngayGio: schema.suaPhong.thoiGian,
        soPhong: schema.phong.soPhong,
        nhanVien: schema.taiKhoan.hoTen,
        ghiChu: schema.suaPhong.moTaLoi,
        chiPhi: schema.suaPhong.chiPhi,
      })
      .from(schema.suaPhong)
      .innerJoin(schema.phong, eq(schema.suaPhong.maPhong, schema.phong.maPhong))
      .innerJoin(schema.taiKhoan, eq(schema.suaPhong.maTk, schema.taiKhoan.maTk)),
  ]);

  return [
    ...don.map((d) => ({
      ngayGio: d.ngayGio,
      soPhong: d.soPhong,
      loai: "DonPhong" as const,
      nhanVien: d.nhanVien,
      ghiChu: d.ghiChu ?? "",
      chiPhi: null as string | null,
    })),
    ...sua.map((x) => ({
      ngayGio: x.ngayGio,
      soPhong: x.soPhong,
      loai: "SuaPhong" as const,
      nhanVien: x.nhanVien,
      ghiChu: x.ghiChu ?? "",
      chiPhi: x.chiPhi as string | null,
    })),
  ].sort((a, b) => b.ngayGio.localeCompare(a.ngayGio));
}
