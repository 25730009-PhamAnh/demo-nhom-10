import "server-only";

import { count, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";

export type DbSnapshot = {
  serverVersion: string;
  databaseName: string;
  tableCounts: { table: string; rows: number }[];
  rooms: {
    maPhong: string;
    soPhong: string;
    tang: number;
    tenLoaiPhong: string;
    donGiaNgay: string;
    trangThai: string;
  }[];
};

/** Cac bang cua do an, theo dung thu tu trong Scripts/01_Create_Database.sql. */
const TABLES = [
  ["LOAI_TAI_KHOAN", schema.loaiTaiKhoan],
  ["TAI_KHOAN", schema.taiKhoan],
  ["KHACH_HANG", schema.khachHang],
  ["LOAI_PHONG", schema.loaiPhong],
  ["BANG_GIA_PHONG", schema.bangGiaPhong],
  ["PHONG", schema.phong],
  ["PHIEU_DAT_PHONG", schema.phieuDatPhong],
  ["CHI_TIET_DAT_PHONG", schema.chiTietDatPhong],
  ["DON_PHONG", schema.donPhong],
  ["SUA_PHONG", schema.suaPhong],
  ["DICH_VU", schema.dichVu],
  ["SU_DUNG_DICH_VU", schema.suDungDichVu],
  ["HOA_DON", schema.hoaDon],
  ["CHI_TIET_HOA_DON", schema.chiTietHoaDon],
] as const;

/**
 * Doc mot lat cat cua database de trang chu chung minh duoc scaffold
 * da noi duoc toi MySQL. Day khong phai nghiep vu — chi la kiem tra ket noi.
 */
export async function readDbSnapshot(): Promise<DbSnapshot> {
  const [info] = await db.execute<{ version: string; db: string }>(
    sql`SELECT VERSION() AS version, DATABASE() AS db`,
  );
  const meta = (info as unknown as { version: string; db: string }[])[0];

  const tableCounts = await Promise.all(
    TABLES.map(async ([name, table]) => {
      const [row] = await db.select({ n: count() }).from(table);
      return { table: name, rows: row.n };
    }),
  );

  const rooms = await db
    .select({
      maPhong: schema.phong.maPhong,
      soPhong: schema.phong.soPhong,
      tang: schema.phong.tang,
      tenLoaiPhong: schema.loaiPhong.tenLoaiPhong,
      donGiaNgay: schema.loaiPhong.donGiaNgay,
      trangThai: schema.phong.trangThai,
    })
    .from(schema.phong)
    .innerJoin(
      schema.loaiPhong,
      eq(schema.phong.maLoaiPhong, schema.loaiPhong.maLoaiPhong),
    )
    .orderBy(schema.phong.soPhong);

  return {
    serverVersion: meta?.version ?? "?",
    databaseName: meta?.db ?? "?",
    tableCounts,
    rooms,
  };
}
