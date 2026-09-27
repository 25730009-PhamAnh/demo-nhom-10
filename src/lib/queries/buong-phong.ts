import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import type { RowDataPacket } from "mysql2";

import { db, pool } from "@/db";
import * as schema from "@/db/schema";

/**
 * Mat tien doc cua man Buong phong va Bao tri (spec bo sung nghiep vu 4.3).
 *
 * Hang cho la chinh PHONG.TrangThai: DangDon = cho don, BaoTri = cho sua. Phieu
 * bao tri dang mo cua mot phong BaoTri la dong SUA_PHONG moi nhat cua phong do
 * (ThoiGian DESC, MaSua DESC), dung thu tu sp_GhiNhanSuaPhong chon.
 *
 * v_TinhTrangPhongHomNay doc bang SQL tho voi dung ten hoa / thuong: Drizzle
 * introspect ra ten chu thuong, chi chay duoc tren may khong phan biet hoa thuong.
 */

export type NhanVien = { maTk: string; hoTen: string };

export async function getNhanVienTheoLoai(maLoaiTk: string): Promise<NhanVien[]> {
  const tk = schema.taiKhoan;
  return db
    .select({ maTk: tk.maTk, hoTen: tk.hoTen })
    .from(tk)
    .where(and(eq(tk.maLoaiTk, maLoaiTk), eq(tk.trangThai, "DangLamViec")))
    .orderBy(asc(tk.hoTen));
}

/** Phieu DaDat / DangO phu hom nay cua mot phong (v_TinhTrangPhongHomNay). */
export type KhachHomNay = { maDatPhong: string; hoTen: string } | null;

export type PhongChoDon = {
  maPhong: string;
  soPhong: string;
  tang: number;
  tenLoaiPhong: string;
  khachHomNay: KhachHomNay;
};

export type PhieuBaoTri = {
  maSua: string;
  moTaLoi: string | null;
  chiPhi: string;
  thoiGian: string;
  nguoiGhi: string;
  soNgayCho: number;
};

export type PhongDangBaoTri = PhongChoDon & { phieu: PhieuBaoTri | null };

const sangPhong = (r: RowDataPacket): PhongChoDon => ({
  maPhong: r.MaPhong,
  soPhong: r.SoPhong,
  tang: Number(r.Tang),
  tenLoaiPhong: r.TenLoaiPhong,
  khachHomNay: r.MaDatPhong ? { maDatPhong: r.MaDatPhong, hoTen: r.KhachLuuTru } : null,
});

/** Phong cho don; phong co khach nhan hom nay len dau de don truoc. */
export async function getPhongChoDon(): Promise<PhongChoDon[]> {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT MaPhong, SoPhong, Tang, TenLoaiPhong, MaDatPhong, KhachLuuTru
    FROM   v_TinhTrangPhongHomNay
    WHERE  TrangThai = 'DangDon'
    ORDER  BY MaDatPhong IS NULL, SoPhong`);
  return rows.map(sangPhong);
}

/** Phong dang bao tri kem phieu dang mo; co khach hom nay len dau, roi phieu cu nhat. */
export async function getPhongDangBaoTri(): Promise<PhongDangBaoTri[]> {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT v.MaPhong, v.SoPhong, v.Tang, v.TenLoaiPhong, v.MaDatPhong, v.KhachLuuTru,
           s.MaSua, s.MoTaLoi, s.ChiPhi, s.ThoiGian, tk.HoTen AS NguoiGhi,
           DATEDIFF(CURDATE(), DATE(s.ThoiGian)) AS SoNgayCho
    FROM   v_TinhTrangPhongHomNay v
    LEFT   JOIN (SELECT sp.*,
                        ROW_NUMBER() OVER (PARTITION BY sp.MaPhong
                                           ORDER BY sp.ThoiGian DESC, sp.MaSua DESC) AS Thu
                 FROM   SUA_PHONG sp) s ON s.MaPhong = v.MaPhong AND s.Thu = 1
    LEFT   JOIN TAI_KHOAN tk ON tk.MaTK = s.MaTK
    WHERE  v.TrangThai = 'BaoTri'
    ORDER  BY v.MaDatPhong IS NULL, s.ThoiGian, v.SoPhong`);
  return rows.map((r) => ({
    ...sangPhong(r),
    phieu: r.MaSua
      ? {
          maSua: r.MaSua,
          moTaLoi: r.MoTaLoi,
          chiPhi: r.ChiPhi,
          thoiGian: r.ThoiGian,
          nguoiGhi: r.NguoiGhi,
          soNgayCho: Number(r.SoNgayCho),
        }
      : null,
  }));
}

export async function getNhatKyDon(n = 20) {
  const don = schema.donPhong;
  return db
    .select({
      maDon: don.maDon,
      thoiGian: don.thoiGian,
      soPhong: schema.phong.soPhong,
      nhanVien: schema.taiKhoan.hoTen,
      ghiChu: don.ghiChu,
    })
    .from(don)
    .innerJoin(schema.phong, eq(schema.phong.maPhong, don.maPhong))
    .innerJoin(schema.taiKhoan, eq(schema.taiKhoan.maTk, don.maTk))
    .orderBy(desc(don.thoiGian), desc(don.maDon))
    .limit(n);
}

export async function getNhatKySua(n = 20) {
  const sua = schema.suaPhong;
  return db
    .select({
      maSua: sua.maSua,
      thoiGian: sua.thoiGian,
      soPhong: schema.phong.soPhong,
      nhanVien: schema.taiKhoan.hoTen,
      chiPhi: sua.chiPhi,
      moTaLoi: sua.moTaLoi,
    })
    .from(sua)
    .innerJoin(schema.phong, eq(schema.phong.maPhong, sua.maPhong))
    .innerJoin(schema.taiKhoan, eq(schema.taiKhoan.maTk, sua.maTk))
    .orderBy(desc(sua.thoiGian), desc(sua.maSua))
    .limit(n);
}
