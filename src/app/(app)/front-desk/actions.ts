"use server";

import { redirect } from "next/navigation";

import { lamMoiNeuXong } from "@/lib/lam-moi";
import { getNhanVienMacDinh } from "@/lib/queries/accounts";
import { khongHopLe, laMa, laTien } from "@/lib/thao-tac/kiem-tra";
import * as leTan from "@/lib/thao-tac/le-tan";

/** Cac nut cua man Nhan & tra phong. Moi ham kiem hinh thuc roi goi mot thu tuc. */

export async function nhanPhong(maDatPhong: unknown) {
  if (!laMa(maDatPhong, "DP")) return khongHopLe("Mã phiếu");
  const nv = await getNhanVienMacDinh();
  return lamMoiNeuXong(await leTan.nhanPhong(maDatPhong, nv.maTk));
}

export async function thuThemCoc(maDatPhong: unknown, soTien: unknown) {
  if (!laMa(maDatPhong, "DP")) return khongHopLe("Mã phiếu");
  if (!laTien(soTien)) return khongHopLe("Số tiền cọc");
  return lamMoiNeuXong(await leTan.thuThemCoc(maDatPhong, soTien));
}

export async function huyPhieu(maDatPhong: unknown) {
  if (!laMa(maDatPhong, "DP")) return khongHopLe("Mã phiếu");
  return lamMoiNeuXong(await leTan.huyPhieu(maDatPhong));
}

/** Lap (lai) hoa don roi chuyen sang trang chi tiet de thanh toan. */
export async function lapHoaDon(maDatPhong: unknown) {
  if (!laMa(maDatPhong, "DP")) return khongHopLe("Mã phiếu");
  const r = await leTan.lapHoaDon(maDatPhong);
  if (r.ok) redirect(`/invoices/${r.data.maHoaDon}`);
  return r;
}

export async function traPhong(maDatPhong: unknown) {
  if (!laMa(maDatPhong, "DP")) return khongHopLe("Mã phiếu");
  return lamMoiNeuXong(await leTan.traPhong(maDatPhong));
}
