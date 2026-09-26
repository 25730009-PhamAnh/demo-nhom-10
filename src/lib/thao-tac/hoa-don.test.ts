import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { thanhToan } from "@/lib/thao-tac/hoa-don";
import { dong } from "@/test/csdl";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

beforeEach(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

describe("thanhToan", () => {
  it("hoa don chua thanh toan: sang DaThanhToan kem hinh thuc", async () => {
    expect(await thanhToan("HD00000023", "ChuyenKhoan")).toEqual({ ok: true, data: null });
    expect(
      await dong("SELECT TrangThai, LoaiThanhToan FROM HOA_DON WHERE MaHoaDon = 'HD00000023'"),
    ).toEqual({ TrangThai: "DaThanhToan", LoaiThanhToan: "ChuyenKhoan" });
  });

  it("hoa don da thanh toan thi CSDL tu choi", async () => {
    expect(await thanhToan("HD00000032", "TienMat")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Hoa don da duoc thanh toan",
    });
  });

  it("hoa don nhap chua co khoan muc thi CSDL tu choi", async () => {
    expect(await thanhToan("HD00000007", "TienMat")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Hoa don nhap chua co chi tiet, hay lap hoa don truoc",
    });
  });

  it("hinh thuc la thi CSDL tu choi, hoa don giu nguyen", async () => {
    expect(await thanhToan("HD00000023", "BitCoin")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Loai thanh toan phai la TienMat, ChuyenKhoan hoac The",
    });
    expect(await dong("SELECT TrangThai FROM HOA_DON WHERE MaHoaDon = 'HD00000023'")).toEqual({
      TrangThai: "ChuaThanhToan",
    });
  });
});
