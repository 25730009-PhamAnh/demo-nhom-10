"use client";

import { useState, useTransition } from "react";

import type { KetQua } from "@/lib/thao-tac/ket-qua";

import type { ThongBaoKieu } from "./thong-bao";

/**
 * Chay mot Server Action ghi trong transition: `dangChay` de khoa nut trong
 * luc cho, `thongBao` la ket qua hien duoi nut. Action thanh cong da tu
 * refresh() nen trang doc lai CSDL; `khiXong` chi viet cau bao va doi state.
 */
export function useThaoTac() {
  const [dangChay, chuyenTiep] = useTransition();
  const [thongBao, setThongBao] = useState<ThongBaoKieu | null>(null);

  function chay<T>(viec: () => Promise<KetQua<T>>, khiXong: (data: T) => string) {
    setThongBao(null);
    chuyenTiep(async () => {
      const r = await viec();
      // Action redirect() (Lap hoa don) chuyen trang, khong tra ket qua.
      if (!r) return;
      setThongBao(r.ok ? { loai: "ok", noiDung: khiXong(r.data) } : { loai: "loi", noiDung: r.loi });
    });
  }

  return { dangChay, thongBao, setThongBao, chay };
}
