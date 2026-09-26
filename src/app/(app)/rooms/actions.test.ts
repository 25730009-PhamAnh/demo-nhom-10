import { describe, expect, it } from "vitest";

import { ghiDonPhong, ghiSuaPhong } from "@/app/(app)/rooms/actions";

describe("Server Action nhat ky buong phong: tham so sai hinh thuc", () => {
  it("tu choi truoc khi cham CSDL", async () => {
    await expect(ghiDonPhong({ MaPhong: "PH00000005" }, "")).resolves.toEqual({
      ok: false,
      loi: "Phòng không hợp lệ",
    });
    await expect(ghiDonPhong("PH00000005", "x".repeat(201))).resolves.toEqual({
      ok: false,
      loi: "Ghi chú không hợp lệ",
    });
    await expect(ghiSuaPhong("PH00000001", "-5", "Vo")).resolves.toEqual({
      ok: false,
      loi: "Chi phí không hợp lệ",
    });
    await expect(ghiSuaPhong("PH00000001", "0", null)).resolves.toEqual({
      ok: false,
      loi: "Mô tả lỗi không hợp lệ",
    });
  });
});
