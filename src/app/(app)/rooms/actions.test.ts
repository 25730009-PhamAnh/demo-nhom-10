import { describe, expect, it } from "vitest";

import { baoBaoTri, baoDonPhong } from "@/app/(app)/rooms/actions";

// Review Focus #5
describe("Server Action So do phong: tham so sai hinh thuc", () => {
  it("tu choi truoc khi cham CSDL", async () => {
    await expect(baoDonPhong({ MaPhong: "PH00000001" })).resolves.toEqual({
      ok: false,
      loi: "Phòng không hợp lệ",
    });
    await expect(baoDonPhong("PH1")).resolves.toEqual({ ok: false, loi: "Phòng không hợp lệ" });
    await expect(baoBaoTri("PH00000001", "x".repeat(201))).resolves.toEqual({
      ok: false,
      loi: "Mô tả sự cố không hợp lệ",
    });
    await expect(baoBaoTri("PH00000001", ["Voi sen"])).resolves.toEqual({
      ok: false,
      loi: "Mô tả sự cố không hợp lệ",
    });
  });
});
