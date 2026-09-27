import { describe, expect, it } from "vitest";

import { suaXong } from "@/app/(app)/maintenance/actions";

// Review Focus #5
describe("Server Action bao tri: tham so sai hinh thuc", () => {
  it("tu choi truoc khi cham CSDL", async () => {
    await expect(suaXong({}, "TK00000006", "0", "")).resolves.toEqual({
      ok: false,
      loi: "Phòng không hợp lệ",
    });
    await expect(suaXong("PH00000004", "LTK0000004", "0", "")).resolves.toEqual({
      ok: false,
      loi: "Kỹ thuật viên không hợp lệ",
    });
    await expect(suaXong("PH00000004", "TK00000006", "-5", "")).resolves.toEqual({
      ok: false,
      loi: "Chi phí không hợp lệ",
    });
    await expect(suaXong("PH00000004", "TK00000006", "0", 42)).resolves.toEqual({
      ok: false,
      loi: "Mô tả không hợp lệ",
    });
  });
});
