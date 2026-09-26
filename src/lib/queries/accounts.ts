import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { thongBaoCsdl } from "@/db/loi";
import { callProcedure } from "@/db/procedures";
import * as schema from "@/db/schema";

/**
 * Dang nhap qua sp_DangNhap: CSDL doi chieu SHA2(mat khau, 256) voi cot
 * MatKhau, app khong giu hay bam mat khau o dau ca. Chua tao phien (phase 3).
 */

export type PhienDangNhap = {
  maTk: string;
  tenDangNhap: string;
  hoTen: string;
  maLoaiTk: string;
  vaiTro: string;
};

/** Mot dong ket qua cua sp_DangNhap khi dang nhap dung. */
type DongDangNhap = {
  MaTK: string;
  TenDangNhap: string;
  HoTen: string;
  MaLoaiTK: string;
  VaiTro: string;
};

/**
 * Sai ten / sai mat khau / tai khoan khong con lam viec: sp_DangNhap SIGNAL va
 * ham nay nem nguyen loi do. Sai ten va sai mat khau cung mot thong bao, de
 * khong lo tai khoan nao co that.
 */
export async function dangNhap(tenDangNhap: string, matKhau: string): Promise<PhienDangNhap> {
  const [d] = await callProcedure<DongDangNhap>("sp_DangNhap", [tenDangNhap, matKhau]);
  return {
    maTk: d.MaTK,
    tenDangNhap: d.TenDangNhap,
    hoTen: d.HoTen,
    maLoaiTk: d.MaLoaiTK,
    vaiTro: d.VaiTro,
  };
}

/** Ban an toan cho Server Action: loi nghiep vu thanh { ok: false, loi }. */
export async function dangNhapAnToan(
  tenDangNhap: string,
  matKhau: string,
): Promise<{ ok: true; phien: PhienDangNhap } | { ok: false; loi: string }> {
  try {
    return { ok: true, phien: await dangNhap(tenDangNhap, matKhau) };
  } catch (err) {
    return { ok: false, loi: thongBaoCsdl(err) };
  }
}

/**
 * Nhan vien hien tren sidebar khi chua co phien dang nhap that (phase 3 thay
 * bang nguoi trong phien). Doc tu chinh TAI_KHOAN chu khong go tay, de ten va
 * vai tro khong lech voi du lieu.
 */
export async function getNhanVienMacDinh(): Promise<PhienDangNhap> {
  const [nv] = await db
    .select({
      maTk: schema.taiKhoan.maTk,
      tenDangNhap: schema.taiKhoan.tenDangNhap,
      hoTen: schema.taiKhoan.hoTen,
      maLoaiTk: schema.taiKhoan.maLoaiTk,
      vaiTro: schema.loaiTaiKhoan.tenLoaiTk,
    })
    .from(schema.taiKhoan)
    .innerJoin(schema.loaiTaiKhoan, eq(schema.loaiTaiKhoan.maLoaiTk, schema.taiKhoan.maLoaiTk))
    .where(eq(schema.taiKhoan.tenDangNhap, "letan.lan"));
  return nv;
}
