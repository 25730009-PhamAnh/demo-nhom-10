import { describe, expect, it } from "vitest";

import { thanhToan } from "@/app/(app)/invoices/[maHoaDon]/actions";

describe("Server Action thanh toan: tham so sai hinh thuc", () => {
  it("tu choi truoc khi cham CSDL", async () => {
    await expect(thanhToan({ MaHoaDon: "HD00000023" }, "TienMat")).resolves.toEqual({
      ok: false,
      loi: "Mã hóa đơn không hợp lệ",
    });
    await expect(thanhToan("HD00000023", { toString: () => "TienMat" })).resolves.toEqual({
      ok: false,
      loi: "Hình thức thanh toán không hợp lệ",
    });
  });
});
