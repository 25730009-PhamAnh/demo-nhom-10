import "server-only";

import type { RowDataPacket } from "mysql2";

import { pool } from "@/db";

/**
 * "Hom nay" cua ca he thong la CURDATE() cua CSDL, khong phai dong ho cua may
 * chay Next: sp_DatPhong, sp_XacNhanDatCoc va v_TinhTrangPhongHomNay deu so
 * voi CURDATE(), nen app phai doc cung mot dong ho. Khi kiem thu, dong ho nay
 * bi dong bang bang DB_NGAY_CO_DINH (src/db/index.ts).
 */
export async function getNgayHienTai(): Promise<string> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT CURDATE() AS ngay");
  return rows[0].ngay as string;
}

/** Gio phut hien tai cua CSDL, dang 'HH:MM', cho dong "Cap nhat" tren Topbar. */
export async function getGioHienTai(): Promise<string> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT DATE_FORMAT(NOW(), '%H:%i') AS gio");
  return rows[0].gio as string;
}
