import { describe, expect, it } from "vitest";
import { getDanhSachKhachHang, getThongKeKhachHang } from "@/lib/queries/customers";

describe("getDanhSachKhachHang", () => {
  it("tinh so lan luu tru va tong chi tieu tu bang khac", async () => {
    const ds = await getDanhSachKhachHang();
    expect(ds.length).toBeGreaterThanOrEqual(10);
    for (const k of ds) {
      expect(k.soLanLuuTru).toBeGreaterThanOrEqual(0);
      expect(k.tongChiTieu).toMatch(/^-?\d+\.\d{2}$/);
    }
  });
  it("khach chua tung dat phong thi so lan 0 va chi tieu 0.00", async () => {
    const ds = await getDanhSachKhachHang();
    const chuaDat = ds.filter((k) => k.soLanLuuTru === 0);
    for (const k of chuaDat) expect(k.tongChiTieu).toBe("0.00");
  });
  it("co it nhat mot khach dang luu tru", async () => {
    const ds = await getDanhSachKhachHang();
    expect(ds.some((k) => k.dangLuuTru)).toBe(true);
  });
});

describe("getThongKeKhachHang", () => {
  it("tong ho so bang so dong trong danh sach", async () => {
    const [tk, ds] = await Promise.all([getThongKeKhachHang(), getDanhSachKhachHang()]);
    expect(tk.tongHoSo).toBe(ds.length);
    expect(tk.tyLeQuayLai).toBeGreaterThanOrEqual(0);
    expect(tk.tyLeQuayLai).toBeLessThanOrEqual(100);
  });
});
