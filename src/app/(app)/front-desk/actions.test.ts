import { describe, expect, it } from "vitest";

import { huyPhieu, lapHoaDon, nhanPhong, thuThemCoc, traPhong } from "@/app/(app)/front-desk/actions";

describe("Server Action Nhan & tra phong: tham so sai hinh thuc", () => {
  it("object, mang, so gui thay cho ma phieu thi tu choi truoc khi cham CSDL", async () => {
    for (const sai of [{ MaDatPhong: "DP00000011" }, ["DP00000011"], 11, null, "DP00000011' OR 1=1"]) {
      await expect(nhanPhong(sai)).resolves.toEqual({ ok: false, loi: "Mã phiếu không hợp lệ" });
      await expect(huyPhieu(sai)).resolves.toEqual({ ok: false, loi: "Mã phiếu không hợp lệ" });
      await expect(lapHoaDon(sai)).resolves.toEqual({ ok: false, loi: "Mã phiếu không hợp lệ" });
      await expect(traPhong(sai)).resolves.toEqual({ ok: false, loi: "Mã phiếu không hợp lệ" });
    }
    await expect(thuThemCoc("DP00000011", { $gt: 0 })).resolves.toEqual({
      ok: false,
      loi: "Số tiền cọc không hợp lệ",
    });
  });
});
