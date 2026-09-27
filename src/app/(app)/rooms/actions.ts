"use server";

import { lamMoiNeuXong } from "@/lib/lam-moi";
import { getNhanVienMacDinh } from "@/lib/queries/accounts";
import * as buongPhong from "@/lib/thao-tac/buong-phong";
import { khongHopLe, laChuoi, laMa } from "@/lib/thao-tac/kiem-tra";

/**
 * Khung thao tac cua mot phong tren So do phong. Nguoi bao tam la nhan vien
 * mac dinh (phase 3 doi sang phien). "Don xong" / "Sua xong" nam o man Buong
 * phong va Bao tri.
 */

export async function baoDonPhong(maPhong: unknown) {
  if (!laMa(maPhong, "PH")) return khongHopLe("Phòng");
  return lamMoiNeuXong(await buongPhong.baoDonPhong(maPhong));
}

export async function baoBaoTri(maPhong: unknown, moTa: unknown) {
  if (!laMa(maPhong, "PH")) return khongHopLe("Phòng");
  if (!laChuoi(moTa, 200)) return khongHopLe("Mô tả sự cố");
  const nv = await getNhanVienMacDinh();
  return lamMoiNeuXong(await buongPhong.baoBaoTri(maPhong, nv.maTk, moTa));
}
