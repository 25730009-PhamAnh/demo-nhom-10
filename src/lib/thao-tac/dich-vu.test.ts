import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { ghiDichVu } from "@/lib/thao-tac/dich-vu";
import { thanhToan } from "@/lib/thao-tac/hoa-don";
import { dong } from "@/test/csdl";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

beforeEach(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

describe("ghiDichVu", () => {
  it("phieu dang o: ghi dong moi, chot don gia cua DICH_VU", async () => {
    expect(await ghiDichVu("DP00000006", "DV00000002", 2)).toEqual({
      ok: true,
      data: { maSuDungDv: "SD00000099" },
    });
    expect(
      await dong(
        "SELECT MaDatPhong, MaDV, SoLuong, DonGiaThoiDiem, ThanhTien, NgaySuDung FROM SU_DUNG_DICH_VU WHERE MaSuDungDV = 'SD00000099'",
      ),
    ).toEqual({
      MaDatPhong: "DP00000006",
      MaDV: "DV00000002",
      SoLuong: 2,
      DonGiaThoiDiem: "250000.00",
      ThanhTien: "500000.00",
      NgaySuDung: "2026-09-23 10:00:00",
    });
  });

  it("phieu chua nhan phong thi CSDL tu choi", async () => {
    expect(await ghiDichVu("DP00000011", "DV00000002", 1)).toEqual({
      ok: false,
      loi: "CSDL từ chối: Chi ghi nhan dich vu cho phieu dang o (DangO)",
    });
  });

  it("phieu da co hoa don nhap: ghi them dich vu roi thanh toan duoc ngay", async () => {
    const truoc = await dong("SELECT TongTien FROM HOA_DON WHERE MaHoaDon = 'HD00000023'");
    expect(await ghiDichVu("DP00000023", "DV00000001", 1)).toMatchObject({ ok: true });

    expect(await dong("SELECT TongTien FROM HOA_DON WHERE MaHoaDon = 'HD00000023'")).toEqual({
      TongTien: (Number(truoc.TongTien) + 80000).toFixed(2),
    });
    expect(await thanhToan("HD00000023", "TienMat")).toEqual({ ok: true, data: null });
  });
});
