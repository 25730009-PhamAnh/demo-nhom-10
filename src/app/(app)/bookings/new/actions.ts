"use server";

import { lamMoiNeuXong } from "@/lib/lam-moi";
import { getNhanVienMacDinh } from "@/lib/queries/accounts";
import { traCuuPhongTrongAnToan } from "@/lib/queries/bookings";
import * as datPhongTT from "@/lib/thao-tac/dat-phong";
import { khongHopLe, laMa, laNgay } from "@/lib/thao-tac/kiem-tra";

/**
 * Form dat phong goi lai moi khi nguoi dung doi ngay, de so phong con trong
 * luon dung voi khoang ngay dang chon. Truoc day danh sach chi duoc tinh mot
 * lan tren may chu cho khoang ngay mac dinh roi giu nguyen, nen form bao so
 * phong trong sai ngay khi doi ngay.
 */
export async function traCuuPhongTrong(checkIn: string, checkOut: string) {
  return traCuuPhongTrongAnToan(checkIn, checkOut);
}

/** Nut "Lap phieu dat phong". Nguoi lap tam la nhan vien mac dinh (phase 3 doi sang phien). */
export async function datPhong(maKh: unknown, ngayNhan: unknown, ngayTra: unknown, maLoaiPhong: unknown) {
  if (!laMa(maKh, "KH")) return khongHopLe("Mã khách hàng");
  if (!laNgay(ngayNhan) || !laNgay(ngayTra)) return khongHopLe("Ngày nhận / trả phòng");
  if (!laMa(maLoaiPhong, "LP")) return khongHopLe("Loại phòng");

  const nv = await getNhanVienMacDinh();
  return lamMoiNeuXong(
    await datPhongTT.datPhong({ maKh, maTk: nv.maTk, ngayNhan, ngayTra, maLoaiPhong }),
  );
}
