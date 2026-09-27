import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { pool } from "@/db";
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

describe("fn_DonGiaTrungBinh: mot cong thuc gia trung binh", () => {
  // LP00000002: bang gia 880.000 den het 07/01/2027, sau do lui ve gia goc 800.000.
  it("trung binh tung dem, lam tron 2 chu so; ngay sai tra NULL", async () => {
    expect(await dong("SELECT fn_DonGiaTrungBinh('LP00000002', '2027-01-06', '2027-01-10') AS g")).toEqual({
      g: "840000.00",
    });
    // (880.000 + 880.000 + 800.000) / 3 = 853.333,33...
    expect(await dong("SELECT fn_DonGiaTrungBinh('LP00000002', '2027-01-06', '2027-01-09') AS g")).toEqual({
      g: "853333.33",
    });
    expect(await dong("SELECT fn_DonGiaTrungBinh('LP00000002', '2026-10-03', '2026-10-01') AS g")).toEqual({
      g: null,
    });
  });

  it("sp_TraCuuPhongTrong bao dung don gia sp_DatPhong se chot", async () => {
    const [p] = await callProcedure<{ MaPhong: string; DonGiaMotDem: string; TamTinh: string }>(
      "sp_TraCuuPhongTrong",
      ["2027-01-06", "2027-01-09", "LP00000002"],
    );
    expect(p).toMatchObject({ DonGiaMotDem: "853333.33", TamTinh: "2559999.99" });
    const { out } = await callProcedureOut(
      "sp_DatPhong",
      ["KH00000001", LE_TAN, "2027-01-06", "2027-01-09", p.MaPhong, 0],
      1,
    );
    expect(
      await dong("SELECT GiaThueThoiDiem, SoDem FROM CHI_TIET_DAT_PHONG WHERE MaDatPhong = ?", [out[0]]),
    ).toEqual({ GiaThueThoiDiem: "853333.33", SoDem: 3 });
  });

  it("trigger: chen chi tiet voi gia 0 thi tu dien gia trung binh, khong phai gia ngay nhan", async () => {
    await pool.query(
      `INSERT INTO PHIEU_DAT_PHONG (MaDatPhong, MaKH, MaTK, NgayCheckIn, NgayCheckOut, TienCoc, TrangThai)
       VALUES ('DP00000200', 'KH00000001', ?, '2027-01-06', '2027-01-10', 0, 'DaDat')`,
      [LE_TAN],
    );
    await pool.query(
      "INSERT INTO CHI_TIET_DAT_PHONG (MaDatPhong, MaPhong, GiaThueThoiDiem, SoDem) VALUES ('DP00000200', 'PH00000002', 0, 0)",
    );
    expect(
      await dong("SELECT GiaThueThoiDiem, SoDem FROM CHI_TIET_DAT_PHONG WHERE MaDatPhong = 'DP00000200'"),
    ).toEqual({ GiaThueThoiDiem: "840000.00", SoDem: 4 });
  });
});
