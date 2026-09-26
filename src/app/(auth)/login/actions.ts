"use server";

import { dangNhapAnToan } from "@/lib/queries/accounts";

/**
 * Form dang nhap goi ham nay tren server, nen sp_DangNhap va mat khau khong
 * di qua bundle trinh duyet. Chua tao phien: thanh cong thi client tu chuyen
 * ve "/" (phase 3 moi ghi cookie va chan route).
 */
export async function xacThucDangNhap(
  tenDangNhap: string,
  matKhau: string,
): Promise<{ ok: true } | { ok: false; loi: string }> {
  const r = await dangNhapAnToan(tenDangNhap, matKhau);
  return r.ok ? { ok: true } : r;
}
