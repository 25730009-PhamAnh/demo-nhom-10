import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { getLoaiPhongConTrong } from "@/lib/queries/bookings";
import { capNhatGiaGoc, datGiaPhong } from "@/lib/thao-tac/bang-gia";
import { datPhong } from "@/lib/thao-tac/dat-phong";
import { dong } from "@/test/csdl";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

beforeEach(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

// Moc 23/09/2026. Moi loai phong co 1 khoang gia 08/01/2026 - 07/01/2027 (BG00000001-10).
// LP00000005 Deluxe King: gia goc 1.500.000, bang gia 1.500.000.
// LP00000002 Standard Double: gia goc 800.000, bang gia 880.000 (x1,10).
const gia = async (loai: string, ngay: string) =>
  (await dong("SELECT fn_DonGiaPhongTheoNgay(?, ?) AS g", [loai, ngay])).g;
const k = (maBangGia: string, apDungTuNgay: string, denNgay: string, donGia: string, heSo: string) => ({
  maBangGia,
  apDungTuNgay,
  denNgay,
  donGia,
  heSo,
});
const DAU_LP05 = k("BG00000005", "2026-01-08", "2026-12-29", "1500000.00", "1.00");
const DUOI_LP05 = k("BG00000011", "2027-01-02", "2027-01-07", "1500000.00", "1.00");

describe("datGiaPhong", () => {
  it("phu giua khoang ca nam: tach thanh 3 khoang lien mach, gia tung ngay dung o hai mep", async () => {
    expect(await datGiaPhong("LP00000005", "2026-12-30", "2027-01-01", "1950000")).toEqual({
      ok: true,
      data: [DAU_LP05, k("BG00000012", "2026-12-30", "2027-01-01", "1950000.00", "1.30"), DUOI_LP05],
    });
    expect([
      await gia("LP00000005", "2026-12-29"),
      await gia("LP00000005", "2026-12-30"),
      await gia("LP00000005", "2027-01-01"),
      await gia("LP00000005", "2027-01-02"),
    ]).toEqual(["1500000.00", "1950000.00", "1950000.00", "1500000.00"]);
  });

  it("phu trung khit mot khoang: thay gia, khong them khoang", async () => {
    await datGiaPhong("LP00000005", "2026-12-30", "2027-01-01", "1950000");
    expect(await datGiaPhong("LP00000005", "2026-12-30", "2027-01-01", "2100000")).toEqual({
      ok: true,
      data: [DAU_LP05, k("BG00000012", "2026-12-30", "2027-01-01", "2100000.00", "1.40"), DUOI_LP05],
    });
  });

  it("lan dau va lan cuoi, phu qua nhieu khoang", async () => {
    await datGiaPhong("LP00000005", "2026-12-30", "2027-01-01", "1950000");
    expect(await datGiaPhong("LP00000005", "2026-12-25", "2027-01-03", "1800000")).toEqual({
      ok: true,
      data: [
        k("BG00000005", "2026-01-08", "2026-12-24", "1500000.00", "1.00"),
        k("BG00000012", "2026-12-25", "2027-01-03", "1800000.00", "1.20"),
        k("BG00000011", "2027-01-04", "2027-01-07", "1500000.00", "1.00"),
      ],
    });
  });

  // Review Focus #4
  it("doan mot ngay trung mep dau / mep cuoi khoang cu: khong chong, khong ho", async () => {
    await datGiaPhong("LP00000005", "2026-12-30", "2027-01-01", "1950000");
    expect(await datGiaPhong("LP00000005", "2026-12-30", "2026-12-30", "2000000")).toEqual({
      ok: true,
      data: [
        DAU_LP05,
        k("BG00000013", "2026-12-30", "2026-12-30", "2000000.00", "1.33"),
        k("BG00000012", "2026-12-31", "2027-01-01", "1950000.00", "1.30"),
        DUOI_LP05,
      ],
    });

    await datGiaPhong("LP00000002", "2027-01-07", "2027-01-07", "1000000");
    expect([
      await gia("LP00000002", "2027-01-06"),
      await gia("LP00000002", "2027-01-07"),
      await gia("LP00000002", "2027-01-08"),
    ]).toEqual(["880000.00", "1000000.00", "800000.00"]);
  });

  it("ve gia goc: doan do roi ve LOAI_PHONG.DonGiaNgay", async () => {
    expect(await datGiaPhong("LP00000002", "2026-12-30", "2027-01-01", null)).toEqual({
      ok: true,
      data: [
        k("BG00000002", "2026-01-08", "2026-12-29", "880000.00", "1.10"),
        k("BG00000011", "2027-01-02", "2027-01-07", "880000.00", "1.10"),
      ],
    });
    expect([
      await gia("LP00000002", "2026-12-29"),
      await gia("LP00000002", "2026-12-30"),
      await gia("LP00000002", "2027-01-02"),
    ]).toEqual(["880000.00", "800000.00", "880000.00"]);
  });

  it("tu choi: ngay da qua, den truoc tu, don gia 0, loai khong ton tai, vuot 99,99 lan gia goc", async () => {
    const loi = async (...a: Parameters<typeof datGiaPhong>) => {
      const r = await datGiaPhong(...a);
      return r.ok ? "ok" : r.loi;
    };
    expect(await loi("LP00000005", "2026-09-22", "2026-09-30", "1500000")).toBe(
      "CSDL từ chối: Khong sua gia cho ngay da qua",
    );
    expect(await loi("LP00000005", "2026-10-05", "2026-10-01", "1500000")).toBe(
      "CSDL từ chối: Den ngay phai bang hoac sau tu ngay",
    );
    expect(await loi("LP00000005", "2026-10-01", "2026-10-05", "0")).toBe("CSDL từ chối: Don gia phai lon hon 0");
    expect(await loi("LP99999999", "2026-10-01", "2026-10-05", "1500000")).toBe(
      "CSDL từ chối: Loai phong khong ton tai",
    );
    expect(await loi("LP00000001", "2026-10-01", "2026-10-05", "60000000")).toBe(
      "CSDL từ chối: Don gia vuot 99,99 lan gia goc cua loai phong",
    );
    expect(await dong("SELECT COUNT(*) AS n FROM BANG_GIA_PHONG")).toEqual({ n: 10 });
  });

  it("phieu dat sau khi doi gia: GiaThueThoiDiem = don gia form hien = trung binh tung dem", async () => {
    await datGiaPhong("LP00000005", "2026-12-30", "2027-01-01", "1950000");
    const loai = (await getLoaiPhongConTrong("2026-12-28", "2026-12-31")).find(
      (l) => l.maLoaiPhong === "LP00000005",
    )!;
    // (1.500.000 x 2 + 1.950.000) / 3
    expect(loai.donGiaNgay).toBe("1650000.00");
    expect(loai.chiTietGia).toEqual([
      { tuNgay: "2026-12-28", denNgay: "2026-12-29", donGia: "1500000.00", soDem: 2 },
      { tuNgay: "2026-12-30", denNgay: "2026-12-30", donGia: "1950000.00", soDem: 1 },
    ]);
    expect(
      await datPhong({
        maKh: "KH00000001",
        maTk: "TK00000002",
        ngayNhan: "2026-12-28",
        ngayTra: "2026-12-31",
        maLoaiPhong: "LP00000005",
      }),
    ).toEqual({ ok: true, data: { maDatPhong: "DP00000099", soPhong: "107", tienCoc: "1650000.00" } });
    expect(await dong("SELECT GiaThueThoiDiem FROM CHI_TIET_DAT_PHONG WHERE MaDatPhong = 'DP00000099'")).toEqual({
      GiaThueThoiDiem: "1650000.00",
    });
  });
});

describe("capNhatGiaGoc", () => {
  it("sua gia goc: HeSo tinh lai, DonGia cac khoang giu nguyen", async () => {
    expect(await capNhatGiaGoc("LP00000002", "1000000")).toEqual({ ok: true, data: null });
    expect(await dong("SELECT DonGiaNgay FROM LOAI_PHONG WHERE MaLoaiPhong = 'LP00000002'")).toEqual({
      DonGiaNgay: "1000000.00",
    });
    expect(await dong("SELECT HeSo, DonGia FROM BANG_GIA_PHONG WHERE MaBangGia = 'BG00000002'")).toEqual({
      HeSo: "0.88",
      DonGia: "880000.00",
    });
  });

  it("tu choi gia goc 0 va gia goc lam he so vuot 99,99", async () => {
    expect(await capNhatGiaGoc("LP00000001", "0")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Gia goc phai lon hon 0",
    });
    expect(await capNhatGiaGoc("LP00000001", "6000")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Co khoang gia vuot 99,99 lan gia goc moi",
    });
  });
});
