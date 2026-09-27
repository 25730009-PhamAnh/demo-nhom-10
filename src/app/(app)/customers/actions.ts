"use server";

import { lamMoiNeuXong } from "@/lib/lam-moi";
import { timKhachHang } from "@/lib/queries/customers";
import { thucHien } from "@/lib/thao-tac/ket-qua";
import * as khachHang from "@/lib/thao-tac/khach-hang";
import { khongHopLe, laChuoi, laMa } from "@/lib/thao-tac/kiem-tra";

/**
 * Them / sua ho so khach (trang Khach hang, buoc 1 cua form dat phong) va o
 * tim khach. Chi kiem kieu va do dai cot; dinh dang CCCD / SDT / email va trung
 * ho so do sp_ChuanHoaKhachHang quyet dinh. SDT cho toi 20 ky tu vi con khoang
 * trang, thu tuc bo di roi moi kiem.
 */
function docHoSo(
  hoTen: unknown,
  cccd: unknown,
  sdt: unknown,
  email: unknown,
): khachHang.HoSoKhach | { ok: false; loi: string } {
  if (!laChuoi(hoTen, 100)) return khongHopLe("Họ tên");
  if (!laChuoi(cccd, 20)) return khongHopLe("CCCD / hộ chiếu");
  if (!laChuoi(sdt, 20)) return khongHopLe("Số điện thoại");
  if (!laChuoi(email, 100)) return khongHopLe("Email");
  return { hoTen, cccd, sdt, email };
}

export async function themKhachHang(hoTen: unknown, cccd: unknown, sdt: unknown, email: unknown) {
  const v = docHoSo(hoTen, cccd, sdt, email);
  if ("ok" in v) return v;
  return lamMoiNeuXong(await khachHang.themKhachHang(v));
}

export async function suaKhachHang(
  maKh: unknown,
  hoTen: unknown,
  cccd: unknown,
  sdt: unknown,
  email: unknown,
) {
  if (!laMa(maKh, "KH")) return khongHopLe("Mã khách hàng");
  const v = docHoSo(hoTen, cccd, sdt, email);
  if ("ok" in v) return v;
  return lamMoiNeuXong(await khachHang.suaKhachHang(maKh, v));
}

/** O tim khach cua form dat phong: chi doc, nen khong refresh(). */
export async function timKhach(q: unknown) {
  if (!laChuoi(q, 100)) return khongHopLe("Từ khóa tìm kiếm");
  return thucHien(() => timKhachHang(q));
}
