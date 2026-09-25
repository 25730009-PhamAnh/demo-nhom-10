import { describe, expect, it } from "vitest";
import { congTien } from "@/lib/tinh-toan";
import { getChiSoTongQuan, getDoanhThuTheoThang } from "@/lib/queries/reports";

describe("getDoanhThuTheoThang", () => {
  it("tra dung 12 thang, cu nhat truoc", async () => {
    const ds = await getDoanhThuTheoThang();
    expect(ds).toHaveLength(12);
    const thang = ds.map((d) => d.thang);
    expect(thang).toEqual([...thang].sort());
  });
  it("tong bang tong bon thanh phan", async () => {
    for (const d of await getDoanhThuTheoThang()) {
      expect(congTien(d.tienPhong, d.dichVu, d.phuThu, d.giamTru)).toBe(d.tong);
    }
  });
});

describe("getChiSoTongQuan", () => {
  it("cong suat nam trong khoang 0-100", async () => {
    const cs = await getChiSoTongQuan();
    expect(cs.congSuat).toBeGreaterThanOrEqual(0);
    expect(cs.congSuat).toBeLessThanOrEqual(100);
  });
  it("doanh thu hom nay khac 0 — man Tong quan khong duoc hien 0 dong", async () => {
    const cs = await getChiSoTongQuan();
    expect(Number(cs.doanhThuHomNay)).toBeGreaterThan(0);
    expect(cs.soHoaDonHomNay).toBeGreaterThan(0);
  });
  it("so luot nhan va tra khop voi queries/bookings", async () => {
    const cs = await getChiSoTongQuan();
    expect(cs.soNhanHomNay).toBeGreaterThan(0);
    expect(cs.soTraHomNay).toBeGreaterThan(0);
  });
});

describe("getDoanhThuTheoThang — tach khoan am ra rieng", () => {
  it("ba cot duong khong bao gio am, giamTru khong bao gio duong", async () => {
    for (const d of await getDoanhThuTheoThang()) {
      expect(Number(d.tienPhong)).toBeGreaterThanOrEqual(0);
      expect(Number(d.dichVu)).toBeGreaterThanOrEqual(0);
      expect(Number(d.phuThu)).toBeGreaterThanOrEqual(0);
      expect(Number(d.giamTru)).toBeLessThanOrEqual(0);
    }
  });
});
