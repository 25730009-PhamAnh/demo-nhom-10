import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { callProcedure, callProcedureOut } from "@/db/procedures";
import { dong, trangThai } from "@/test/csdl";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

/**
 * Hoi quy cho 4 thu tuc sua o phase 2 (spec phase 2 muc 4). Moi ca da thay DO
 * tren 06_Procedures.sql cu truoc khi sua. Goi thang thu tuc, khong qua
 * src/lib/thao-tac, de loi nam o dau thi do ngay o day.
 */
beforeEach(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

const LE_TAN = "TK00000002";
const BUONG = "TK00000004";
const phong = (ma: string) => dong("SELECT TrangThai FROM PHONG WHERE MaPhong = ?", [ma]);

describe("sp_NhanPhong", () => {
  it("nhan duoc phieu vua dat bang sp_DatPhong (phong DaDat)", async () => {
    const { out } = await callProcedureOut(
      "sp_DatPhong",
      ["KH00000001", LE_TAN, "2026-09-23", "2026-09-24", "PH00000001", 0],
      1,
    );
    await callProcedure("sp_NhanPhong", [out[0], LE_TAN]);
    expect(await trangThai(out[0]!)).toEqual({ phieu: "DangO", phong: "DangSuDung", hoaDon: null });
  });

  it("van tu choi khi phong con khach cu chua tra (DangSuDung)", async () => {
    // Phong 207 (PH00000023): khach DP00000023 tra hom nay nen dat duoc cho
    // dem nay, nhung chua tra phong thi chua nhan duoc.
    const { out } = await callProcedureOut(
      "sp_DatPhong",
      ["KH00000001", LE_TAN, "2026-09-23", "2026-09-24", "PH00000023", 0],
      1,
    );
    await expect(callProcedure("sp_NhanPhong", [out[0], LE_TAN])).rejects.toThrow(
      "Co phong chua san sang (phong phai Trong hoac DaDat)",
    );
    expect(await trangThai(out[0]!)).toMatchObject({ phieu: "DaDat" });
  });
});

describe("sp_GhiNhanDonPhong", () => {
  it("phong co khach (DangSuDung) va phong dang giu (DaDat) giu nguyen trang thai, van ghi nhat ky", async () => {
    await callProcedure("sp_GhiNhanDonPhong", ["PH00000006", BUONG, "Don giua ky"]);
    await callProcedure("sp_GhiNhanDonPhong", ["PH00000011", BUONG, null]);
    expect(await phong("PH00000006")).toEqual({ TrangThai: "DangSuDung" });
    expect(await phong("PH00000011")).toEqual({ TrangThai: "DaDat" });
    expect(await dong("SELECT COUNT(*) AS n FROM DON_PHONG")).toEqual({ n: 18 });
  });

  // Spec bo sung nghiep vu 4.2: phong BaoTri phai sua xong (sp_GhiNhanSuaPhong) truoc.
  it("phong DangDon ve Trong; phong BaoTri giu BaoTri", async () => {
    await callProcedure("sp_GhiNhanDonPhong", ["PH00000005", BUONG, null]);
    await callProcedure("sp_GhiNhanDonPhong", ["PH00000004", BUONG, null]);
    expect(await phong("PH00000005")).toEqual({ TrangThai: "Trong" });
    expect(await phong("PH00000004")).toEqual({ TrangThai: "BaoTri" });
  });
});

describe("sp_GhiNhanDichVu", () => {
  it("phieu da co hoa don nhap: tinh lai hoa don, thanh toan duoc ngay", async () => {
    // HD00000023: 3.100.000 truoc khi ghi them 1 luot giat ui 80.000.
    await callProcedureOut("sp_GhiNhanDichVu", ["DP00000023", "DV00000001", 1, null], 1);
    expect(await dong("SELECT TongTien FROM HOA_DON WHERE MaHoaDon = 'HD00000023'")).toEqual({
      TongTien: "3180000.00",
    });
    await expect(callProcedure("sp_ThanhToanHoaDon", ["HD00000023", "TienMat"])).resolves.toBeDefined();
  });
});

describe("sp_HuyPhieuDat", () => {
  it("huy phieu thi hoa don nhap cua phieu cung DaHuy", async () => {
    await callProcedure("sp_HuyPhieuDat", ["DP00000007"]);
    expect(await trangThai("DP00000007")).toEqual({ phieu: "DaHuy", phong: "Trong", hoaDon: "DaHuy" });
  });
});
