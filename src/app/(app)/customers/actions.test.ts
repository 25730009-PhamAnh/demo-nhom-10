import { describe, expect, it } from "vitest";

import { suaKhachHang, themKhachHang, timKhach } from "@/app/(app)/customers/actions";

// Review Focus #5: Server Action la diem vao ai cung POST toi duoc.
describe("Server Action khach hang: tham so sai hinh thuc", () => {
  it("tu choi truoc khi cham CSDL", async () => {
    await expect(themKhachHang({ $ne: "" }, "079299000061", "", "")).resolves.toEqual({
      ok: false,
      loi: "Họ tên không hợp lệ",
    });
    await expect(themKhachHang("A", ["079299000061"], "", "")).resolves.toEqual({
      ok: false,
      loi: "CCCD / hộ chiếu không hợp lệ",
    });
    await expect(themKhachHang("A", "079299000061", "0".repeat(21), "")).resolves.toEqual({
      ok: false,
      loi: "Số điện thoại không hợp lệ",
    });
    await expect(themKhachHang("A", "079299000061", "", 5)).resolves.toEqual({
      ok: false,
      loi: "Email không hợp lệ",
    });
    await expect(suaKhachHang("KH1", "A", "079299000061", "", "")).resolves.toEqual({
      ok: false,
      loi: "Mã khách hàng không hợp lệ",
    });
    await expect(timKhach({ q: "Nguyen" })).resolves.toEqual({
      ok: false,
      loi: "Từ khóa tìm kiếm không hợp lệ",
    });
  });

  it("timKhach hop le thi tra ket qua, khong refresh", async () => {
    const r = await timKhach("Đặng Thùy");
    expect(r).toMatchObject({ ok: true, data: [{ maKh: "KH00000006" }] });
  });
});
