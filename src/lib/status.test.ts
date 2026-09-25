import { describe, expect, it } from "vitest";
import {
  TRANG_THAI_PHONG,
  nhanTrangThaiHoaDon,
  nhanTrangThaiPhieu,
  nhanTrangThaiPhong,
} from "@/lib/status";

describe("nhanTrangThaiPhong", () => {
  it("tra dung nhan va mau cua design/README.md", () => {
    expect(nhanTrangThaiPhong("Trong")).toEqual({
      nhan: "Trống", fg: "#14664B", bg: "#E3F0E9", dot: "#1B8A6A",
    });
    expect(nhanTrangThaiPhong("BaoTri").nhan).toBe("Bảo trì");
  });

  // Review Focus #2
  it("tra nhan du phong khi gap gia tri la, khong tra undefined", () => {
    const r = nhanTrangThaiPhong("GiaTriLa");
    expect(r.nhan).toBe("GiaTriLa");
    expect(r.fg).toBeTruthy();
    expect(r.bg).toBeTruthy();
  });

  it("phu du 5 gia tri cua rang buoc CHECK", () => {
    expect(TRANG_THAI_PHONG).toHaveLength(5);
    for (const ma of TRANG_THAI_PHONG) {
      expect(nhanTrangThaiPhong(ma).nhan).not.toBe(ma);
    }
  });
});

describe("nhanTrangThaiPhieu", () => {
  it("phu cac gia tri cua PHIEU_DAT_PHONG", () => {
    expect(nhanTrangThaiPhieu("DaDat").nhan).toBe("Đã đặt");
    expect(nhanTrangThaiPhieu("DangO").nhan).toBe("Đang ở");
    expect(nhanTrangThaiPhieu("HoanTat").nhan).toBe("Hoàn tất");
    expect(nhanTrangThaiPhieu("DaHuy").nhan).toBe("Đã hủy");
  });
});

describe("nhanTrangThaiHoaDon", () => {
  it("phu cac gia tri cua HOA_DON", () => {
    expect(nhanTrangThaiHoaDon("ChuaThanhToan").nhan).toBe("Chưa thanh toán");
    expect(nhanTrangThaiHoaDon("DaThanhToan").nhan).toBe("Đã thanh toán");
  });
});
