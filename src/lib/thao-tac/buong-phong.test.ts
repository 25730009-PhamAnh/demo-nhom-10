import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { callProcedure } from "@/db/procedures";
import { baoBaoTri, baoDonPhong, ghiDonPhong, ghiSuaPhong } from "@/lib/thao-tac/buong-phong";
import { dong } from "@/test/csdl";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

beforeEach(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

// Moc 23/09/2026. 101 PH00000001 Trong; 202 PH00000004 BaoTri (phieu mo
// SUA0000004, 900.000d); 301 PH00000005 DangDon; 302 PH00000006 DangSuDung;
// 103 PH00000011 DaDat (DP00000011 nhan hom nay); PRES-01 PH00000010 BaoTri
// (SUA0000010). SUA_PHONG 12 dong, DON_PHONG 16 dong.
const LE_TAN = "TK00000002";
const BUONG = "TK00000004";
const KY_THUAT = "TK00000006";
const KY_THUAT_NGHI = "TK00000007"; // TamNghi
const phong = async (ma: string) =>
  (await dong("SELECT TrangThai FROM PHONG WHERE MaPhong = ?", [ma])).TrangThai;
const dem = async (bang: "SUA_PHONG" | "DON_PHONG") =>
  (await dong(`SELECT COUNT(*) AS n FROM ${bang}`)).n;

describe("baoDonPhong", () => {
  it("phong Trong va phong DaDat sang DangDon", async () => {
    expect(await baoDonPhong("PH00000001")).toEqual({ ok: true, data: null });
    expect(await baoDonPhong("PH00000011")).toEqual({ ok: true, data: null });
    expect([await phong("PH00000001"), await phong("PH00000011")]).toEqual(["DangDon", "DangDon"]);
  });

  // Review Focus #3: bao lan hai (phong da DangDon) bi tu choi.
  it("phong co khach, dang bao tri, da cho don thi CSDL tu choi, trang thai giu nguyen", async () => {
    expect(await baoDonPhong("PH00000006")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phong dang co khach: buong phong ghi nhan don truc tiep",
    });
    expect(await baoDonPhong("PH00000004")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phong dang bao tri, se sang cho don khi ky thuat sua xong",
    });
    expect(await baoDonPhong("PH00000005")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phong da nam trong danh sach cho don",
    });
    expect([await phong("PH00000006"), await phong("PH00000004"), await phong("PH00000005")]).toEqual([
      "DangSuDung",
      "BaoTri",
      "DangDon",
    ]);
  });
});

describe("baoBaoTri", () => {
  it("phong Trong: mo phieu 0d mang MaTK nguoi bao, phong sang BaoTri", async () => {
    expect(await baoBaoTri("PH00000001", LE_TAN, "  Voi sen ri nuoc ")).toEqual({
      ok: true,
      data: { maSua: "SUA0000013" },
    });
    expect(await phong("PH00000001")).toBe("BaoTri");
    expect(
      await dong("SELECT MaPhong, MaTK, ThoiGian, ChiPhi, MoTaLoi FROM SUA_PHONG WHERE MaSua = 'SUA0000013'"),
    ).toEqual({
      MaPhong: "PH00000001",
      MaTK: LE_TAN,
      ThoiGian: "2026-09-23 10:00:00",
      ChiPhi: "0.00",
      MoTaLoi: "Voi sen ri nuoc",
    });
  });

  it("phong dang cho don cung bao duoc (buong phong thay hong khi don)", async () => {
    expect((await baoBaoTri("PH00000005", BUONG, "Bong den chay")).ok).toBe(true);
    expect(await phong("PH00000005")).toBe("BaoTri");
  });

  // Review Focus #3
  it("bao hai lan: lan sau bi tu choi vi da co phieu dang mo, khong them dong", async () => {
    await baoBaoTri("PH00000001", LE_TAN, "Voi sen ri nuoc");
    expect(await baoBaoTri("PH00000001", LE_TAN, "Voi sen ri nuoc")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phong dang bao tri, da co phieu dang mo",
    });
    expect(await dem("SUA_PHONG")).toBe(13);
  });

  it("phong co khach, mo ta rong, tai khoan tam nghi thi CSDL tu choi", async () => {
    expect(await baoBaoTri("PH00000006", LE_TAN, "May lanh")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phong dang co khach luu tru, khong the dua vao bao tri",
    });
    expect(await baoBaoTri("PH00000001", LE_TAN, "   ")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phai mo ta su co can bao tri",
    });
    expect(await baoBaoTri("PH00000001", KY_THUAT_NGHI, "Khoa tu")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Tai khoan bao su co khong ton tai hoac khong con lam viec",
    });
    expect(await dem("SUA_PHONG")).toBe(12);
  });
});

describe("ghiSuaPhong (sua xong)", () => {
  it("phong BaoTri: cap nhat phieu dang mo, phong sang DangDon, khong them dong", async () => {
    expect(await ghiSuaPhong("PH00000004", KY_THUAT, "950000", "Thay binh nong lanh")).toEqual({
      ok: true,
      data: null,
    });
    expect(await phong("PH00000004")).toBe("DangDon");
    expect(
      await dong("SELECT MaTK, ThoiGian, ChiPhi, MoTaLoi FROM SUA_PHONG WHERE MaSua = 'SUA0000004'"),
    ).toEqual({
      MaTK: KY_THUAT,
      ThoiGian: "2026-09-23 10:00:00",
      ChiPhi: "950000.00",
      MoTaLoi: "Thay binh nong lanh",
    });
    expect(await dem("SUA_PHONG")).toBe(12);
  });

  it("mo ta de trong thi giu mo ta cu cua phieu", async () => {
    await ghiSuaPhong("PH00000010", KY_THUAT, "0", "  ");
    expect(await dong("SELECT ChiPhi, MoTaLoi FROM SUA_PHONG WHERE MaSua = 'SUA0000010'")).toEqual({
      ChiPhi: "0.00",
      MoTaLoi: "Bao tri he thong am thanh",
    });
  });

  // Review Focus #3
  it("sua xong hai lan: lan sau bi tu choi vi phong da sang DangDon", async () => {
    await ghiSuaPhong("PH00000004", KY_THUAT, "950000", "");
    expect(await ghiSuaPhong("PH00000004", KY_THUAT, "950000", "")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phong khong o trang thai bao tri, hay bao bao tri truoc",
    });
  });

  it("phong khong BaoTri, tai khoan tam nghi thi CSDL tu choi, phong giu nguyen", async () => {
    expect(await ghiSuaPhong("PH00000001", KY_THUAT, "0", "Thay voi sen")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phong khong o trang thai bao tri, hay bao bao tri truoc",
    });
    expect(await ghiSuaPhong("PH00000010", KY_THUAT_NGHI, "0", "")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Tai khoan ky thuat khong con lam viec",
    });
    expect([await phong("PH00000001"), await phong("PH00000010")]).toEqual(["Trong", "BaoTri"]);
  });
});

describe("ghiDonPhong (don xong)", () => {
  it("phong DangDon: ghi nhat ky, phong ve Trong", async () => {
    expect(await ghiDonPhong("PH00000005", BUONG, "Don xong")).toEqual({ ok: true, data: null });
    expect(await phong("PH00000005")).toBe("Trong");
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

  it("phong DangDon con phieu DaDat giu thi ve DaDat", async () => {
    await baoDonPhong("PH00000011");
    await ghiDonPhong("PH00000011", BUONG, "");
    expect(await phong("PH00000011")).toBe("DaDat");
  });

  it("phong BaoTri van BaoTri (phai sua xong truoc), van ghi nhat ky", async () => {
    expect(await ghiDonPhong("PH00000004", BUONG, "")).toEqual({ ok: true, data: null });
    expect(await phong("PH00000004")).toBe("BaoTri");
    expect(await dem("DON_PHONG")).toBe(17);
  });

  it("phong dang co khach (DangSuDung) va dang giu (DaDat) giu nguyen, van ghi nhat ky", async () => {
    await ghiDonPhong("PH00000006", BUONG, "Don giua ky");
    await ghiDonPhong("PH00000011", BUONG, "");
    expect([await phong("PH00000006"), await phong("PH00000011")]).toEqual(["DangSuDung", "DaDat"]);
    expect(await dem("DON_PHONG")).toBe(18);
  });

  it("ghi chu rong luu NULL", async () => {
    await ghiDonPhong("PH00000005", BUONG, "   ");
    expect(await dong("SELECT GhiChu FROM DON_PHONG WHERE MaDon = 'DON0000017'")).toEqual({ GhiChu: null });
  });

  it("phong khong ton tai, tai khoan nghi viec thi CSDL tu choi", async () => {
    expect(await ghiDonPhong("PH99999999", BUONG, "")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Ma phong khong ton tai!",
    });
    expect(await ghiDonPhong("PH00000005", "TK00000010", "")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Tai khoan nhan vien khong con lam viec",
    });
  });
});

describe("mot su co di tron vong", () => {
  it("bao bao tri -> sua xong -> don xong: phong Trong, SUA_PHONG them dung 1 dong", async () => {
    await baoBaoTri("PH00000001", LE_TAN, "Khoa tu hong");
    await ghiSuaPhong("PH00000001", KY_THUAT, "150000", "");
    expect(await phong("PH00000001")).toBe("DangDon");
    await ghiDonPhong("PH00000001", BUONG, "Don sau sua");
    expect(await phong("PH00000001")).toBe("Trong");
    expect(await dem("SUA_PHONG")).toBe(13);
    expect(await dong("SELECT MaTK, ChiPhi, MoTaLoi FROM SUA_PHONG WHERE MaSua = 'SUA0000013'")).toEqual({
      MaTK: KY_THUAT,
      ChiPhi: "150000.00",
      MoTaLoi: "Khoa tu hong",
    });
    // Moi su co mot dong: phong 101 co SUA0000001 (250.000) va su co nay.
    const baoCao = await callProcedure<{ SoPhong: string; SoLanSua: number; TongChiPhiSua: string }>(
      "sp_BaoCaoBuongPhong",
      [null, null],
    );
    expect(baoCao.find((r) => r.SoPhong === "101")).toMatchObject({ SoLanSua: 2, TongChiPhiSua: "400000.00" });
  });

  it("phong DaDat di het vong thi ve DaDat", async () => {
    await baoBaoTri("PH00000011", LE_TAN, "Ri nuoc");
    await ghiSuaPhong("PH00000011", KY_THUAT, "0", "");
    await ghiDonPhong("PH00000011", BUONG, "");
    expect(await phong("PH00000011")).toBe("DaDat");
  });
});
