import "server-only";

import { callProcedure, callProcedureOut } from "@/db/procedures";

import { thucHien, type KetQua } from "./ket-qua";

/**
 * Them / sua ho so khach (sp_ThemKhachHang, sp_SuaKhachHang). Chuan hoa (trim,
 * bo khoang trang trong SDT, chu thuong email, rong -> NULL) va moi quy tac
 * (dinh dang, trung CCCD / email) nam trong sp_ChuanHoaKhachHang, app gui
 * nguyen van nguoi dung go.
 */

export type HoSoKhach = { hoTen: string; cccd: string; sdt: string; email: string };

export type KhachDaLuu = {
  maKh: string;
  hoTen: string;
  cccd: string;
  sdt: string | null;
  email: string | null;
};

type DongKhach = { MaKH: string; HoTen: string; CCCD: string; SDT: string | null; Email: string | null };

const sangKhach = (d: DongKhach): KhachDaLuu => ({
  maKh: d.MaKH,
  hoTen: d.HoTen,
  cccd: d.CCCD,
  sdt: d.SDT,
  email: d.Email,
});

export function themKhachHang(v: HoSoKhach): Promise<KetQua<KhachDaLuu>> {
  return thucHien(async () => {
    const { rows } = await callProcedureOut<DongKhach>(
      "sp_ThemKhachHang",
      [v.hoTen, v.cccd, v.sdt, v.email],
      1,
    );
    return sangKhach(rows[0]);
  });
}

export function suaKhachHang(maKh: string, v: HoSoKhach): Promise<KetQua<KhachDaLuu>> {
  return thucHien(async () => {
    const [d] = await callProcedure<DongKhach>("sp_SuaKhachHang", [maKh, v.hoTen, v.cccd, v.sdt, v.email]);
    return sangKhach(d);
  });
}
