import { describe, expect, it } from "vitest";

import { capNhatGiaGoc, datGia } from "@/app/(app)/pricing/actions";

// Review Focus #5: null chi hop le o o don gia (ve gia goc).
describe("Server Action bang gia: tham so sai hinh thuc", () => {
  it("tu choi truoc khi cham CSDL", async () => {
    await expect(datGia({ ma: 1 }, "2026-10-01", "2026-10-03", "1500000")).resolves.toEqual({
      ok: false,
      loi: "Loại phòng không hợp lệ",
    });
    await expect(datGia("LP00000005", "2026-02-30", "2026-10-03", "1500000")).resolves.toEqual({
      ok: false,
      loi: "Khoảng ngày không hợp lệ",
    });
    await expect(datGia("LP00000005", "2026-10-01", "2026-10-03", "1.500.000")).resolves.toEqual({
      ok: false,
      loi: "Đơn giá không hợp lệ",
    });
    await expect(datGia("LP00000005", "2026-10-01", "2026-10-03", undefined)).resolves.toEqual({
      ok: false,
      loi: "Đơn giá không hợp lệ",
    });
    await expect(capNhatGiaGoc("LP00000005", -1)).resolves.toEqual({
      ok: false,
      loi: "Giá gốc không hợp lệ",
    });
  });
});
