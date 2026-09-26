import { describe, expect, it } from "vitest";

import { laChuoi, laMa, laNgay, laSoNguyenDuong, laTien } from "@/lib/thao-tac/kiem-tra";

/**
 * Server Action la diem vao ai cung POST toi duoc, nen moi tham so phai kiem
 * KIEU truoc khi dua xuong CSDL: mot object gui len thay cho chuoi se bi mysql2
 * dich thanh `cot = gia tri` trong cau lenh (stringifyObjects mac dinh false).
 */
describe("laMa", () => {
  it("nhan ma CHAR(10) dung tien to", () => {
    expect(laMa("DP00000011", "DP")).toBe(true);
    expect(laMa("PH00000042", "PH")).toBe(true);
  });

  it("tu choi sai tien to, sai do dai, chu thuong va kieu khac chuoi", () => {
    expect(laMa("KH00000011", "DP")).toBe(false);
    expect(laMa("DP0000011", "DP")).toBe(false);
    expect(laMa("dp00000011", "DP")).toBe(false);
    expect(laMa("DP0000001'", "DP")).toBe(false);
    expect(laMa({ MaDatPhong: "DP00000011" }, "DP")).toBe(false);
    expect(laMa(["DP00000011"], "DP")).toBe(false);
    expect(laMa(undefined, "DP")).toBe(false);
  });
});

describe("laSoNguyenDuong", () => {
  it("chi nhan so nguyen tu 1 den gioi han INT", () => {
    expect(laSoNguyenDuong(1)).toBe(true);
    expect(laSoNguyenDuong(2_147_483_647)).toBe(true);
    for (const x of [0, -1, 1.5, 2_147_483_648, Number.NaN, "2", null]) {
      expect(laSoNguyenDuong(x)).toBe(false);
    }
  });
});

describe("laTien", () => {
  it("nhan chuoi so khong am, toi da 2 chu so thap phan, vua DECIMAL(18,2)", () => {
    for (const x of ["0", "600000", "600000.5", "600000.50", "9999999999999999.99"]) {
      expect(laTien(x)).toBe(true);
    }
  });

  it("tu choi so am, chuoi rong, dau phay, qua 16 chu so phan nguyen va kieu so", () => {
    for (const x of ["-1", "", "600.000", "1,5", "1.234", "10000000000000000", 600000]) {
      expect(laTien(x)).toBe(false);
    }
  });
});

describe("laNgay", () => {
  it("nhan ngay YYYY-MM-DD co that tren lich", () => {
    expect(laNgay("2026-09-23")).toBe(true);
    expect(laNgay("2028-02-29")).toBe(true);
  });

  it("tu choi chuoi rong, ngay khong co that va kieu khac chuoi", () => {
    for (const x of ["", "2026-02-30", "2026-9-23", "23/09/2026", 20260923, null]) {
      expect(laNgay(x)).toBe(false);
    }
  });
});

describe("laChuoi", () => {
  it("nhan chuoi toi da n ky tu, ke ca chuoi rong", () => {
    expect(laChuoi("", 200)).toBe(true);
    expect(laChuoi("Đã dọn xong, thay khăn", 200)).toBe(true);
    expect(laChuoi("x".repeat(200), 200)).toBe(true);
  });

  it("tu choi chuoi qua dai va kieu khac chuoi", () => {
    expect(laChuoi("x".repeat(201), 200)).toBe(false);
    expect(laChuoi(null, 200)).toBe(false);
    expect(laChuoi({ toString: () => "x" }, 200)).toBe(false);
  });
});
