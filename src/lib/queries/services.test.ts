import { describe, expect, it } from "vitest";

import { getDanhMucDichVu, getSuDungDichVuTheoPhieu } from "@/lib/queries/services";

describe("getDanhMucDichVu", () => {
  it("du 10 dich vu theo ma", async () => {
    const ds = await getDanhMucDichVu();
    expect(ds).toHaveLength(10);
    expect(ds[0]).toEqual({ maDv: "DV00000001", tenDv: "Giat ui", donViTinh: "Kg", giaDv: "80000.00" });
  });
});

describe("getSuDungDichVuTheoPhieu", () => {
  it("cac lan dung dich vu cua phieu, theo thoi gian, gia chot luc dung", async () => {
    expect(await getSuDungDichVuTheoPhieu("DP00000001")).toEqual([
      { maDv: "DV00000002", tenDv: "Buffet sang", donViTinh: "Suat", giaDv: "250000.00", soLuong: 2, thanhTien: "500000.00" },
      { maDv: "DV00000001", tenDv: "Giat ui", donViTinh: "Kg", giaDv: "80000.00", soLuong: 2, thanhTien: "160000.00" },
      { maDv: "DV00000005", tenDv: "Minibar", donViTinh: "SanPham", giaDv: "100000.00", soLuong: 1, thanhTien: "100000.00" },
    ]);
  });

  it("phieu chua dung dich vu nao thi tra mang rong", async () => {
    expect(await getSuDungDichVuTheoPhieu("DP00000011")).toEqual([]);
  });
});
