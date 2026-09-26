import { describe, expect, it } from "vitest";
import {
  congTien,
  docSoTien,
  soDem,
  tamTinhDatPhong,
  themNgay,
  tienDichVu,
  tienPhong,
} from "@/lib/tinh-toan";

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

describe("tamTinhDatPhong", () => {
  it("tra so dem va tien phong khi ngay hop le", () => {
    expect(
      tamTinhDatPhong({ ngayNhan: "2026-09-23", ngayTra: "2026-09-26", donGia: "1000000.00" }),
    ).toEqual({ soDem: 3, tienPhong: "3000000.00", loi: null });
  });

  // Review Focus #1 — form dat phong khong duoc hien tien am
  it("ngay tra truoc ngay nhan: bao loi, khong tra tien am", () => {
    const r = tamTinhDatPhong({
      ngayNhan: "2026-09-26", ngayTra: "2026-09-23", donGia: "1000000.00",
    });
    expect(r.loi).toBe("Ngày trả phòng phải sau ngày nhận phòng");
    expect(r.soDem).toBe(0);
    expect(r.tienPhong).toBe("0.00");
  });

  it("ngay tra trung ngay nhan: cung bao loi", () => {
    const r = tamTinhDatPhong({
      ngayNhan: "2026-09-23", ngayTra: "2026-09-23", donGia: "1000000.00",
    });
    expect(r.loi).toBe("Ngày trả phòng phải sau ngày nhận phòng");
    expect(r.tienPhong).toBe("0.00");
  });

  it("chua chon loai phong thi tien bang 0 nhung khong bao loi ngay", () => {
    const r = tamTinhDatPhong({
      ngayNhan: "2026-09-23", ngayTra: "2026-09-25", donGia: "0.00",
    });
    expect(r.loi).toBeNull();
    expect(r.soDem).toBe(2);
    expect(r.tienPhong).toBe("0.00");
  });
});

describe("themNgay", () => {
  it("cong va tru ngay, vat qua ranh gioi thang", () => {
    expect(themNgay("2026-09-30", 1)).toBe("2026-10-01");
    expect(themNgay("2026-10-01", -1)).toBe("2026-09-30");
  });

  // Lỗi reviewer tim ra: xoa trong o ngay -> toISOString() nem RangeError,
  // hai nut +/- chet han va hien overlay loi.
  it("chuoi rong hoac khong hop le thi tra lai nguyen ven, khong nem loi", () => {
    expect(() => themNgay("", 1)).not.toThrow();
    expect(themNgay("", 1)).toBe("");
    expect(themNgay("khong-phai-ngay", 1)).toBe("khong-phai-ngay");
  });
});

// Review Focus: nguoi Viet go "300.000" nghia la ba tram nghin, khong phai 300.
describe("docSoTien", () => {
  it("bo dau cham, dau phay, khoang trang ngan cach hang nghin", () => {
    expect(docSoTien("300.000")).toBe("300000");
    expect(docSoTien("1,500,000")).toBe("1500000");
    expect(docSoTien(" 250 000 ")).toBe("250000");
  });

  it("giu nguyen ky tu la de Server Action bao khong hop le", () => {
    expect(docSoTien("-50.000")).toBe("-50000");
    expect(docSoTien("3tr")).toBe("3tr");
    expect(docSoTien("")).toBe("");
  });
});
