import "server-only";

import { callProcedure } from "@/db/procedures";

import { thucHien, type KetQua } from "./ket-qua";

/** Ghi chu rong thi luu NULL, nhu du lieu mau. */
const hoacNull = (s: string) => (s.trim() === "" ? null : s.trim());

export function ghiDonPhong(maPhong: string, maTk: string, ghiChu: string): Promise<KetQua<null>> {
  return thucHien(async () => {
    await callProcedure("sp_GhiNhanDonPhong", [maPhong, maTk, hoacNull(ghiChu)]);
    return null;
  });
}

export function ghiSuaPhong(
  maPhong: string,
  maTk: string,
  chiPhi: string,
  moTaLoi: string,
): Promise<KetQua<null>> {
  return thucHien(async () => {
    await callProcedure("sp_GhiNhanSuaPhong", [maPhong, maTk, chiPhi, hoacNull(moTaLoi)]);
    return null;
  });
}
