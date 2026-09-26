import "server-only";

import { callProcedureOut } from "@/db/procedures";

import { thucHien, type KetQua } from "./ket-qua";

/**
 * Ghi mot lan su dung dich vu vao phieu dang o (sp_GhiNhanDichVu), thoi diem
 * la bay gio cua CSDL. Tra ma dong su dung vua sinh.
 */
export function ghiDichVu(
  maDatPhong: string,
  maDv: string,
  soLuong: number,
): Promise<KetQua<{ maSuDungDv: string }>> {
  return thucHien(async () => {
    const { out } = await callProcedureOut("sp_GhiNhanDichVu", [maDatPhong, maDv, soLuong, null], 1);
    return { maSuDungDv: out[0]! };
  });
}
