"use server";

import { lamMoiNeuXong } from "@/lib/lam-moi";
import * as buongPhong from "@/lib/thao-tac/buong-phong";
import { khongHopLe, laChuoi, laMa } from "@/lib/thao-tac/kiem-tra";

/**
 * Man Buong phong. Nguoi thuc hien la nhan vien chon o dau man (chua co phien
 * dang nhap, phase 3 lay nguoi trong phien); thu tuc kiem tai khoan con lam viec.
 */

export async function donXong(maPhong: unknown, maTk: unknown, ghiChu: unknown) {
  if (!laMa(maPhong, "PH")) return khongHopLe("Phòng");
  if (!laMa(maTk, "TK")) return khongHopLe("Nhân viên");
  if (!laChuoi(ghiChu, 200)) return khongHopLe("Ghi chú");
  return lamMoiNeuXong(await buongPhong.ghiDonPhong(maPhong, maTk, ghiChu));
}

export async function baoHong(maPhong: unknown, maTk: unknown, moTa: unknown) {
  if (!laMa(maPhong, "PH")) return khongHopLe("Phòng");
  if (!laMa(maTk, "TK")) return khongHopLe("Nhân viên");
  if (!laChuoi(moTa, 200)) return khongHopLe("Mô tả sự cố");
  return lamMoiNeuXong(await buongPhong.baoBaoTri(maPhong, maTk, moTa));
}
