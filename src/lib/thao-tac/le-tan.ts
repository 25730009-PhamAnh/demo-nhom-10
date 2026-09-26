import "server-only";

import { callProcedure, callProcedureOut } from "@/db/procedures";

import { thucHien, type KetQua } from "./ket-qua";

/** Mat tien ghi cua man Nhan & tra phong: moi ham mot thu tuc. */

export function nhanPhong(maDatPhong: string, maTk: string): Promise<KetQua<null>> {
  return thucHien(async () => {
    await callProcedure("sp_NhanPhong", [maDatPhong, maTk]);
    return null;
  });
}

/** Cong them tien coc (sp_XacNhanDatCoc), tra tong coc moi cua phieu. */
export function thuThemCoc(maDatPhong: string, soTien: string): Promise<KetQua<{ tienCoc: string }>> {
  return thucHien(async () => {
    const [r] = await callProcedure<{ TienCoc: string }>("sp_XacNhanDatCoc", [maDatPhong, soTien]);
    return { tienCoc: r.TienCoc };
  });
}

export function huyPhieu(maDatPhong: string): Promise<KetQua<null>> {
  return thucHien(async () => {
    await callProcedure("sp_HuyPhieuDat", [maDatPhong]);
    return null;
  });
}

/** Lap (hoac lap lai) hoa don cua phieu, tra ma hoa don de chuyen sang trang chi tiet. */
export function lapHoaDon(maDatPhong: string): Promise<KetQua<{ maHoaDon: string }>> {
  return thucHien(async () => {
    const { out } = await callProcedureOut("sp_LapHoaDon", [maDatPhong], 1);
    return { maHoaDon: out[0]! };
  });
}

export function traPhong(maDatPhong: string): Promise<KetQua<null>> {
  return thucHien(async () => {
    await callProcedure("sp_TraPhong", [maDatPhong]);
    return null;
  });
}
