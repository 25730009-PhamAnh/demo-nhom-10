import { describe, expect, it } from "vitest";
import { MUC_DIEU_HUONG } from "@/lib/nav";

describe("MUC_DIEU_HUONG", () => {
  it("8 muc cua artboard, them Buong phong va Bao tri sau So do phong", () => {
    expect(MUC_DIEU_HUONG.map((m) => m.nhan)).toEqual([
      "Tổng quan",
      "Sơ đồ phòng",
      "Buồng phòng",
      "Bảo trì",
      "Đặt phòng",
      "Nhận & trả phòng",
      "Khách hàng",
      "Dịch vụ",
      "Hóa đơn",
      "Báo cáo",
    ]);
  });
  it("moi muc co href bat dau bang /", () => {
    for (const m of MUC_DIEU_HUONG) expect(m.href.startsWith("/")).toBe(true);
  });
  it("khong co href trung", () => {
    const hrefs = MUC_DIEU_HUONG.map((m) => m.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
