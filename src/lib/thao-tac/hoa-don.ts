import "server-only";

import { callProcedure } from "@/db/procedures";

import { thucHien, type KetQua } from "./ket-qua";

/** Thanh toan hoa don (sp_ThanhToanHoaDon). Loai: TienMat, ChuyenKhoan hoac The. */
export function thanhToan(maHoaDon: string, loaiThanhToan: string): Promise<KetQua<null>> {
  return thucHien(async () => {
    await callProcedure("sp_ThanhToanHoaDon", [maHoaDon, loaiThanhToan]);
    return null;
  });
}
