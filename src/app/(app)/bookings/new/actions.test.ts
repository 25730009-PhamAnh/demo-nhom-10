import { describe, expect, it } from "vitest";

import { datPhong } from "@/app/(app)/bookings/new/actions";

// Review Focus: Server Action la diem vao ai cung POST toi duoc.
describe("Server Action dat phong: tham so sai hinh thuc", () => {
  it("tu choi truoc khi cham CSDL", async () => {
    await expect(datPhong({ $ne: "" }, "2026-09-23", "2026-09-25", "LP00000001")).resolves.toEqual({
      ok: false,
      loi: "Mã khách hàng không hợp lệ",
    });
    await expect(datPhong("KH00000001", "", "2026-09-25", "LP00000001")).resolves.toEqual({
      ok: false,
      loi: "Ngày nhận / trả phòng không hợp lệ",
    });
    await expect(datPhong("KH00000001", "2026-09-23", "2026-09-25", ["LP00000001"])).resolves.toEqual({
      ok: false,
      loi: "Loại phòng không hợp lệ",
    });
  });
});
