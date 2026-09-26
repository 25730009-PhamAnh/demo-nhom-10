import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { ghiDonPhong, ghiSuaPhong } from "@/lib/thao-tac/buong-phong";
import { dong } from "@/test/csdl";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

beforeEach(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

const BUONG = "TK00000004";
const KY_THUAT = "TK00000006";
const phong = (ma: string) => dong("SELECT TrangThai FROM PHONG WHERE MaPhong = ?", [ma]);

describe("ghiDonPhong", () => {
  it("phong DangDon: ghi nhat ky, phong ve Trong", async () => {
    // PH00000005 = phong 301.
    expect(await ghiDonPhong("PH00000005", BUONG, "Don xong")).toEqual({ ok: true, data: null });
    expect(await phong("PH00000005")).toEqual({ TrangThai: "Trong" });
    expect(
      await dong("SELECT MaDon, MaPhong, MaTK, ThoiGian, GhiChu FROM DON_PHONG WHERE MaDon = 'DON0000017'"),
    ).toEqual({
      MaDon: "DON0000017",
      MaPhong: "PH00000005",
      MaTK: BUONG,
      ThoiGian: "2026-09-23 10:00:00",
      GhiChu: "Don xong",
    });
  });

  it("phong BaoTri sua xong va don: ve Trong", async () => {
    // PH00000004 = phong 202.
    await ghiDonPhong("PH00000004", BUONG, "");
    expect(await phong("PH00000004")).toEqual({ TrangThai: "Trong" });
  });

  it("phong dang co khach (DangSuDung) van DangSuDung, van ghi nhat ky", async () => {
    // PH00000006 = phong 302 cua DP00000006.
    expect(await ghiDonPhong("PH00000006", BUONG, "Don giua ky")).toEqual({ ok: true, data: null });
    expect(await phong("PH00000006")).toEqual({ TrangThai: "DangSuDung" });
    expect(await dong("SELECT COUNT(*) AS n FROM DON_PHONG")).toEqual({ n: 17 });
  });

  it("phong dang giu cho khach nhan hom nay (DaDat) van DaDat", async () => {
    // PH00000011 = phong 103 cua DP00000011.
    await ghiDonPhong("PH00000011", BUONG, "");
    expect(await phong("PH00000011")).toEqual({ TrangThai: "DaDat" });
  });

  it("ghi chu rong luu NULL", async () => {
    await ghiDonPhong("PH00000005", BUONG, "   ");
    expect(await dong("SELECT GhiChu FROM DON_PHONG WHERE MaDon = 'DON0000017'")).toEqual({ GhiChu: null });
  });

  it("phong khong ton tai thi CSDL tu choi", async () => {
    expect(await ghiDonPhong("PH99999999", BUONG, "")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Ma phong khong ton tai!",
    });
  });
});

describe("ghiSuaPhong", () => {
  it("phong Trong: ghi nhat ky kem chi phi, phong sang BaoTri", async () => {
    expect(await ghiSuaPhong("PH00000001", KY_THUAT, "350000", "Thay voi sen")).toEqual({
      ok: true,
      data: null,
    });
    expect(await phong("PH00000001")).toEqual({ TrangThai: "BaoTri" });
    expect(
      await dong("SELECT MaPhong, MaTK, ChiPhi, MoTaLoi FROM SUA_PHONG WHERE MaSua = 'SUA0000013'"),
    ).toEqual({ MaPhong: "PH00000001", MaTK: KY_THUAT, ChiPhi: "350000.00", MoTaLoi: "Thay voi sen" });
  });

  it("phong dang co khach thi CSDL tu choi, phong giu nguyen", async () => {
    expect(await ghiSuaPhong("PH00000006", KY_THUAT, "0", "May lanh")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phong dang co khach luu tru, khong the dua vao bao tri!",
    });
    expect(await phong("PH00000006")).toEqual({ TrangThai: "DangSuDung" });
  });
});
