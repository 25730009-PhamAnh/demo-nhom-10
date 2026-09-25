import { describe, expect, it } from "vitest";
import * as mock from "@/lib/mock/data";
import { TRANG_THAI_PHONG } from "@/lib/status";
import { NGAY_HIEN_TAI } from "@/lib/mock/now";

const MA = /^[A-Z]{2}\d{8}$/;

describe("du lieu goc tu 02_Sample_Data.sql", () => {
  it("giu du 10 dong goc cua moi bang chinh", () => {
    expect(mock.LOAI_PHONG).toHaveLength(10);
    expect(mock.DICH_VU).toHaveLength(10);
    expect(mock.TAI_KHOAN).toHaveLength(10);
    expect(mock.LOAI_TAI_KHOAN).toHaveLength(10);
  });
  it("giu dung ma va gia cua loai phong goc", () => {
    const lp = mock.LOAI_PHONG.find((x) => x.maLoaiPhong === "LP00000001");
    expect(lp?.tenLoaiPhong).toBe("Standard Single");
    expect(lp?.donGiaNgay).toBe("600000.00");
  });
});

describe("phan don them cho demo", () => {
  it("co du phong de lap day tang 1-4", () => {
    expect(mock.PHONG.length).toBeGreaterThanOrEqual(40);
    expect(new Set(mock.PHONG.map((p) => p.tang))).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  });
  it("co phieu dat nhan phong dung ngay hien tai", () => {
    const nhanHomNay = mock.PHIEU_DAT_PHONG.filter(
      (p) => p.ngayCheckIn === NGAY_HIEN_TAI && p.trangThai === "DaDat",
    );
    expect(nhanHomNay.length).toBeGreaterThanOrEqual(5);
  });
  it("co phieu dang o de tra phong hom nay", () => {
    const dangO = mock.PHIEU_DAT_PHONG.filter((p) => p.trangThai === "DangO");
    expect(dangO.length).toBeGreaterThanOrEqual(5);
  });
});

describe("toan ven du lieu", () => {
  it("moi ma khoa dung dang CHAR(10)", () => {
    for (const p of mock.PHONG) expect(p.maPhong).toMatch(MA);
    for (const k of mock.KHACH_HANG) expect(k.maKh).toMatch(MA);
    for (const d of mock.PHIEU_DAT_PHONG) expect(d.maDatPhong).toMatch(MA);
    for (const h of mock.HOA_DON) expect(h.maHoaDon).toMatch(MA);
  });
  it("khong co ma trung", () => {
    const ma = mock.PHONG.map((p) => p.maPhong);
    expect(new Set(ma).size).toBe(ma.length);
  });
  it("moi phong tro toi mot loai phong co that", () => {
    const loai = new Set(mock.LOAI_PHONG.map((l) => l.maLoaiPhong));
    for (const p of mock.PHONG) expect(loai.has(p.maLoaiPhong)).toBe(true);
  });
  it("moi phieu dat tro toi mot khach hang co that", () => {
    const kh = new Set(mock.KHACH_HANG.map((k) => k.maKh));
    for (const d of mock.PHIEU_DAT_PHONG) expect(kh.has(d.maKh)).toBe(true);
  });
  it("moi hoa don tro toi mot phieu dat co that", () => {
    const dp = new Set(mock.PHIEU_DAT_PHONG.map((d) => d.maDatPhong));
    for (const h of mock.HOA_DON) expect(dp.has(h.maDatPhong)).toBe(true);
  });
  it("trang thai phong chi nhan 5 gia tri cua rang buoc CHECK", () => {
    for (const p of mock.PHONG) {
      expect(TRANG_THAI_PHONG).toContain(p.trangThai);
    }
  });
  it("tien luon la chuoi hai chu so thap phan", () => {
    for (const l of mock.LOAI_PHONG) expect(l.donGiaNgay).toMatch(/^\d+\.\d{2}$/);
    for (const d of mock.DICH_VU) expect(d.giaDv).toMatch(/^\d+\.\d{2}$/);
  });
});
