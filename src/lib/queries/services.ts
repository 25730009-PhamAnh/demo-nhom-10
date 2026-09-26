import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";

/** Mat tien doc dich vu. Ghi nhan dich vu la viec cua phase 2 (sp_GhiNhanDichVu). */

export async function getDanhMucDichVu(): Promise<(typeof schema.dichVu.$inferSelect)[]> {
  return db.select().from(schema.dichVu).orderBy(asc(schema.dichVu.maDv));
}

export async function getSuDungDichVuTheoPhieu(maDatPhong: string) {
  const ds = await db
    .select({
      maDv: schema.suDungDichVu.maDv,
      tenDv: schema.dichVu.tenDv,
      donViTinh: schema.dichVu.donViTinh,
      giaDv: schema.suDungDichVu.donGiaThoiDiem,
      soLuong: schema.suDungDichVu.soLuong,
      thanhTien: schema.suDungDichVu.thanhTien,
    })
    .from(schema.suDungDichVu)
    .innerJoin(schema.dichVu, eq(schema.dichVu.maDv, schema.suDungDichVu.maDv))
    .where(eq(schema.suDungDichVu.maDatPhong, maDatPhong))
    .orderBy(asc(schema.suDungDichVu.ngaySuDung));
  // thanhTien la cot sinh nen kieu la string | null.
  return ds.map((s) => ({ ...s, thanhTien: s.thanhTien ?? "0.00" }));
}
