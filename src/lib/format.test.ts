import { describe, expect, it } from "vitest";
import { formatNgay, formatNgayGio, formatNgayNgan, formatSo, formatVnd } from "@/lib/format";

// Intl.NumberFormat chen NON-BREAKING SPACE (U+00A0) truoc ky hieu dong, de
// '₫' khong bi xuong dong tach khoi con so. Viet \u00A0 tuong minh trong test
// cho khoi phai doan byte vo hinh.
const NBSP = "\u00A0";

describe("formatVnd", () => {
  it("dinh dang chuoi DECIMAL cua MySQL", () => {
    expect(formatVnd("1000000.00")).toBe(`1.000.000${NBSP}₫`);
  });
  it("khong lam tron sai voi so le", () => {
    expect(formatVnd("1500000.50")).toBe(`1.500.001${NBSP}₫`);
  });
});

describe("formatNgay", () => {
  it("doi ISO sang dd/MM/yyyy", () => {
    expect(formatNgay("2026-09-23")).toBe("23/09/2026");
  });
  it("chap nhan ca chuoi DATETIME", () => {
    expect(formatNgay("2026-09-23 11:42:00")).toBe("23/09/2026");
  });
});

describe("formatNgayGio", () => {
  it("doi DATETIME sang HH:mm · dd/MM/yyyy", () => {
    expect(formatNgayGio("2026-09-23 11:42:00")).toBe("11:42 · 23/09/2026");
  });
});

describe("formatSo", () => {
  it("dung dau cham phan cach hang nghin", () => {
    expect(formatSo(1284)).toBe("1.284");
  });
});

describe("formatNgayNgan", () => {
  it("doi ISO (hoac DATETIME) sang dd/MM", () => {
    expect(formatNgayNgan("2026-09-27")).toBe("27/09");
    expect(formatNgayNgan("2026-09-27 08:00:00")).toBe("27/09");
  });
});
