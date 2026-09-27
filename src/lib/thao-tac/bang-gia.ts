import "server-only";

import { callProcedure } from "@/db/procedures";
import type { KhoangGia } from "@/lib/queries/bang-gia";

import { thucHien, type KetQua } from "./ket-qua";

type DongKhoang = {
  MaBangGia: string;
  ApDungTuNgay: string;
  DenNgay: string;
  DonGia: string;
  HeSo: string;
};

/**
 * Phu gia len [tuNgay, denNgay] cua mot loai phong (sp_DatGiaPhong); donGia
 * null = tra doan do ve gia goc. Tra moi khoang gia cua loai do sau khi doi.
 */
export function datGiaPhong(
  maLoaiPhong: string,
  tuNgay: string,
  denNgay: string,
  donGia: string | null,
): Promise<KetQua<KhoangGia[]>> {
  return thucHien(async () => {
    const rows = await callProcedure<DongKhoang>("sp_DatGiaPhong", [maLoaiPhong, tuNgay, denNgay, donGia]);
    return rows.map((r) => ({
      maBangGia: r.MaBangGia,
      apDungTuNgay: r.ApDungTuNgay,
      denNgay: r.DenNgay,
      donGia: r.DonGia,
      heSo: r.HeSo,
    }));
  });
}

/** Sua gia goc (sp_CapNhatGiaLoaiPhong); HeSo cac khoang tinh lai, DonGia giu nguyen. */
export function capNhatGiaGoc(maLoaiPhong: string, donGiaNgay: string): Promise<KetQua<null>> {
  return thucHien(async () => {
    await callProcedure("sp_CapNhatGiaLoaiPhong", [maLoaiPhong, donGiaNgay]);
    return null;
  });
}
