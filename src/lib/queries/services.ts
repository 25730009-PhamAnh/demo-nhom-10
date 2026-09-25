import type * as schema from "@/db/schema";
import * as mock from "@/lib/mock/data";

/** Mat tien doc dich vu. Giai doan sau doi sang Drizzle va sp_GhiNhanDichVu. */

export async function getDanhMucDichVu(): Promise<
  (typeof schema.dichVu.$inferSelect)[]
> {
  return mock.DICH_VU;
}

export async function getSuDungDichVuTheoPhieu(maDatPhong: string) {
  return mock.SU_DUNG_DICH_VU
    .filter((s) => s.maDatPhong === maDatPhong)
    .map((s) => {
      const dv = mock.DICH_VU.find((d) => d.maDv === s.maDv);
      return {
        maDv: s.maDv,
        tenDv: dv?.tenDv ?? "—",
        donViTinh: dv?.donViTinh ?? null,
        giaDv: s.donGiaThoiDiem,
        soLuong: s.soLuong,
        // thanhTien la cot sinh nen kieu la string | null.
        thanhTien: s.thanhTien ?? "0.00",
      };
    });
}
