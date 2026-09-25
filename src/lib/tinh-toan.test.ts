import { describe, expect, it } from "vitest";
import { congTien, soDem, tienDichVu, tienPhong } from "@/lib/tinh-toan";

describe("soDem", () => {
  it("dem so dem giua hai ngay", () => {
    expect(soDem("2026-09-23", "2026-09-26")).toBe(3);
  });
  it("vat qua ranh gioi thang", () => {
    expect(soDem("2026-09-30", "2026-10-02")).toBe(2);
  });

  // Review Focus #1
  it("nem loi khi ngay tra khong sau ngay nhan", () => {
    expect(() => soDem("2026-09-26", "2026-09-23")).toThrow(
      "Ngay tra phong phai sau ngay nhan phong",
    );
    expect(() => soDem("2026-09-23", "2026-09-23")).toThrow(
      "Ngay tra phong phai sau ngay nhan phong",
    );
  });
});

describe("tienPhong", () => {
  it("nhan don gia voi so dem", () => {
    expect(tienPhong("1000000.00", 3)).toBe("3000000.00");
  });
  it("giu dung hai chu so thap phan", () => {
    // 1150000.50 = 115000050 xu; x2 = 230000100 xu = 2300001.00
    expect(tienPhong("1150000.50", 2)).toBe("2300001.00");
  });
});

describe("tienDichVu", () => {
  it("nhan don gia dich vu voi so luong", () => {
    expect(tienDichVu("100000.00", 2)).toBe("200000.00");
  });
  it("so luong 0 cho thanh tien 0", () => {
    expect(tienDichVu("100000.00", 0)).toBe("0.00");
  });
});

describe("congTien", () => {
  it("cong khong bi sai so dau phay dong", () => {
    expect(congTien("0.10", "0.20")).toBe("0.30");
  });
  it("cong nhieu khoan muc cua hoa don", () => {
    expect(congTien("3000000.00", "200000.00", "-150000.00")).toBe("3050000.00");
  });
  it("khong doi so nao thi tra 0", () => {
    expect(congTien()).toBe("0.00");
  });
});
