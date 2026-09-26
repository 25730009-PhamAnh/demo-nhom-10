import type { RowDataPacket } from "mysql2";

import { pool } from "@/db";

/** Dong dau tien cua mot cau SELECT, dang object thuong (de so bang toEqual). */
export async function dong(cau: string, thamSo: unknown[] = []): Promise<Record<string, unknown>> {
  const [rows] = await pool.query<RowDataPacket[]>(cau, thamSo);
  return { ...rows[0] };
}

/** Trang thai hien tai cua mot phieu, cac phong cua no va hoa don cua no. */
export async function trangThai(maDatPhong: string) {
  return dong(
    `SELECT pd.TrangThai AS phieu,
            (SELECT GROUP_CONCAT(p.TrangThai ORDER BY p.SoPhong)
             FROM CHI_TIET_DAT_PHONG ct JOIN PHONG p ON p.MaPhong = ct.MaPhong
             WHERE ct.MaDatPhong = pd.MaDatPhong) AS phong,
            (SELECT TrangThai FROM HOA_DON WHERE MaDatPhong = pd.MaDatPhong) AS hoaDon
     FROM PHIEU_DAT_PHONG pd WHERE pd.MaDatPhong = ?`,
    [maDatPhong],
  );
}
