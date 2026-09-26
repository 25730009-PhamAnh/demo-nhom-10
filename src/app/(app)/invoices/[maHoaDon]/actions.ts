"use server";

import { lamMoiNeuXong } from "@/lib/lam-moi";
import * as hoaDon from "@/lib/thao-tac/hoa-don";
import { khongHopLe, laChuoi, laMa } from "@/lib/thao-tac/kiem-tra";

/** Nut "Xac nhan thanh toan". Hinh thuc hop le hay khong do sp_ThanhToanHoaDon kiem. */
export async function thanhToan(maHoaDon: unknown, loaiThanhToan: unknown) {
  if (!laMa(maHoaDon, "HD")) return khongHopLe("Mã hóa đơn");
  if (!laChuoi(loaiThanhToan, 20)) return khongHopLe("Hình thức thanh toán");
  return lamMoiNeuXong(await hoaDon.thanhToan(maHoaDon, loaiThanhToan));
}
