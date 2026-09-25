import { describe, expect, it } from "vitest";
import * as mock from "@/lib/mock/data";
import { congTien } from "@/lib/tinh-toan";
import { getHoaDon } from "@/lib/queries/invoices";

describe("getHoaDon", () => {
  it("tra hoa don kem khach, phieu va khoan muc", async () => {
    const ma = mock.HOA_DON[0].maHoaDon;
    const hd = await getHoaDon(ma);
    expect(hd?.maHoaDon).toBe(ma);
    expect(hd?.khach.hoTen).toBeTruthy();
    expect(hd?.phieu.soDem).toBeGreaterThan(0);
    expect(hd?.khoanMuc.length).toBeGreaterThan(0);
  });

  it("tong cac khoan muc bang tong tien cua hoa don", async () => {
    for (const goc of mock.HOA_DON) {
      const hd = await getHoaDon(goc.maHoaDon);
      const tong = congTien(...hd!.khoanMuc.map((k) => k.soTien));
      expect(tong).toBe(hd!.tongTien);
    }
  });

  // Review Focus #4
  it("tra null khi ma hoa don khong ton tai", async () => {
    await expect(getHoaDon("HD99999999")).resolves.toBeNull();
  });
});
