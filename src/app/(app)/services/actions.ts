"use server";

import { lamMoiNeuXong } from "@/lib/lam-moi";
import * as dichVu from "@/lib/thao-tac/dich-vu";
import { khongHopLe, laMa, laSoNguyenDuong } from "@/lib/thao-tac/kiem-tra";

/** Nut "Ghi nhan dich vu". */
export async function ghiDichVu(maDatPhong: unknown, maDv: unknown, soLuong: unknown) {
  if (!laMa(maDatPhong, "DP")) return khongHopLe("Mã phiếu");
  if (!laMa(maDv, "DV")) return khongHopLe("Mã dịch vụ");
  if (!laSoNguyenDuong(soLuong)) return khongHopLe("Số lượng");
  return lamMoiNeuXong(await dichVu.ghiDichVu(maDatPhong, maDv, soLuong));
}
