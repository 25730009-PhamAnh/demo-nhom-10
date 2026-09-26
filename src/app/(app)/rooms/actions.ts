"use server";

import { lamMoiNeuXong } from "@/lib/lam-moi";
import { getNhanVienMacDinh } from "@/lib/queries/accounts";
import * as buongPhong from "@/lib/thao-tac/buong-phong";
import { khongHopLe, laChuoi, laMa, laTien } from "@/lib/thao-tac/kiem-tra";

/** Hai form trong the "Nhat ky buong phong & sua chua". Nguoi ghi tam la nhan vien mac dinh. */

export async function ghiDonPhong(maPhong: unknown, ghiChu: unknown) {
  if (!laMa(maPhong, "PH")) return khongHopLe("Phòng");
  if (!laChuoi(ghiChu, 200)) return khongHopLe("Ghi chú");
  const nv = await getNhanVienMacDinh();
  return lamMoiNeuXong(await buongPhong.ghiDonPhong(maPhong, nv.maTk, ghiChu));
}

export async function ghiSuaPhong(maPhong: unknown, chiPhi: unknown, moTaLoi: unknown) {
  if (!laMa(maPhong, "PH")) return khongHopLe("Phòng");
  if (!laTien(chiPhi)) return khongHopLe("Chi phí");
  if (!laChuoi(moTaLoi, 200)) return khongHopLe("Mô tả lỗi");
  const nv = await getNhanVienMacDinh();
  return lamMoiNeuXong(await buongPhong.ghiSuaPhong(maPhong, nv.maTk, chiPhi, moTaLoi));
}
