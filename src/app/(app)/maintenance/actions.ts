"use server";

import { lamMoiNeuXong } from "@/lib/lam-moi";
import * as buongPhong from "@/lib/thao-tac/buong-phong";
import { khongHopLe, laChuoi, laMa, laTien } from "@/lib/thao-tac/kiem-tra";

/**
 * Man Bao tri: ky thuat vien (chon o dau man) ghi nhan da sua xong. Phong phai
 * dang BaoTri va tai khoan con lam viec: sp_GhiNhanSuaPhong quyet dinh.
 */
export async function suaXong(maPhong: unknown, maTk: unknown, chiPhi: unknown, moTaLoi: unknown) {
  if (!laMa(maPhong, "PH")) return khongHopLe("Phòng");
  if (!laMa(maTk, "TK")) return khongHopLe("Kỹ thuật viên");
  if (!laTien(chiPhi)) return khongHopLe("Chi phí");
  if (!laChuoi(moTaLoi, 200)) return khongHopLe("Mô tả");
  return lamMoiNeuXong(await buongPhong.ghiSuaPhong(maPhong, maTk, chiPhi, moTaLoi));
}
