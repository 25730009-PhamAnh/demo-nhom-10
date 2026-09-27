import { describe, expect, it } from "vitest";

import { baoHong, donXong } from "@/app/(app)/housekeeping/actions";

// Review Focus #5
describe("Server Action buong phong: tham so sai hinh thuc", () => {
  it("tu choi truoc khi cham CSDL", async () => {
    await expect(donXong(["PH00000005"], "TK00000004", "")).resolves.toEqual({
      ok: false,
      loi: "Phòng không hợp lệ",
    });
    await expect(donXong("PH00000005", { maTk: "TK00000004" }, "")).resolves.toEqual({
      ok: false,
      loi: "Nhân viên không hợp lệ",
    });
    await expect(donXong("PH00000005", "TK00000004", "x".repeat(201))).resolves.toEqual({
      ok: false,
      loi: "Ghi chú không hợp lệ",
    });
    await expect(baoHong("PH00000005", "TK00000004", null)).resolves.toEqual({
      ok: false,
      loi: "Mô tả sự cố không hợp lệ",
    });
  });
});
