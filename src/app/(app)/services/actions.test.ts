import { describe, expect, it } from "vitest";

import { ghiDichVu } from "@/app/(app)/services/actions";

describe("Server Action ghi dich vu: tham so sai hinh thuc", () => {
  it("tu choi truoc khi cham CSDL", async () => {
    await expect(ghiDichVu(["DP00000006"], "DV00000002", 1)).resolves.toEqual({
      ok: false,
      loi: "Mã phiếu không hợp lệ",
    });
    await expect(ghiDichVu("DP00000006", "", 1)).resolves.toEqual({ ok: false, loi: "Mã dịch vụ không hợp lệ" });
    for (const sai of [0, -1, 1.5, "2"]) {
      await expect(ghiDichVu("DP00000006", "DV00000002", sai)).resolves.toEqual({
        ok: false,
        loi: "Số lượng không hợp lệ",
      });
    }
  });
});
