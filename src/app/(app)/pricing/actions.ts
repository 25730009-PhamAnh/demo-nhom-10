"use server";

import { lamMoiNeuXong } from "@/lib/lam-moi";
import * as bangGia from "@/lib/thao-tac/bang-gia";
import { khongHopLe, laMa, laNgay, laTien } from "@/lib/thao-tac/kiem-tra";

/**
 * Man Bang gia. donGia null = tra doan ngay ve gia goc. Ngay da qua, den truoc
 * tu, he so vuot 99,99... do sp_DatGiaPhong / sp_CapNhatGiaLoaiPhong quyet dinh.
 */

export async function datGia(maLoai: unknown, tuNgay: unknown, denNgay: unknown, donGia: unknown) {
  if (!laMa(maLoai, "LP")) return khongHopLe("Loại phòng");
  if (!laNgay(tuNgay) || !laNgay(denNgay)) return khongHopLe("Khoảng ngày");
  const gia = donGia === null ? null : laTien(donGia) ? donGia : undefined;
  if (gia === undefined) return khongHopLe("Đơn giá");
  return lamMoiNeuXong(await bangGia.datGiaPhong(maLoai, tuNgay, denNgay, gia));
}

export async function capNhatGiaGoc(maLoai: unknown, donGia: unknown) {
  if (!laMa(maLoai, "LP")) return khongHopLe("Loại phòng");
  if (!laTien(donGia)) return khongHopLe("Giá gốc");
  return lamMoiNeuXong(await bangGia.capNhatGiaGoc(maLoai, donGia));
}
