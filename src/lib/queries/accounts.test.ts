import { describe, expect, it } from "vitest";

import { dangNhap, dangNhapAnToan, getNhanVienMacDinh } from "@/lib/queries/accounts";

describe("dangNhap", () => {
  it("dung ten va mat khau thi tra phien cua sp_DangNhap", async () => {
    expect(await dangNhap("admin", "Admin@123")).toEqual({
      maTk: "TK00000001",
      tenDangNhap: "admin",
      hoTen: "Nguyen Minh Anh",
      maLoaiTk: "LTK0000001",
      vaiTro: "Quan tri vien",
    });
  });

  it("sai mat khau va ten khong ton tai bao cung mot loi", async () => {
    await expect(dangNhap("admin", "sai")).rejects.toThrow("Ten dang nhap hoac mat khau khong dung");
    await expect(dangNhap("khongcoai", "gi do")).rejects.toThrow("Ten dang nhap hoac mat khau khong dung");
  });

  it("tai khoan TamNghi, NghiViec bi tu choi du dung mat khau", async () => {
    await expect(dangNhap("kythuat.son", "KyThuat@456")).rejects.toThrow(
      "Tai khoan dang o trang thai TamNghi, khong the dang nhap",
    );
    await expect(dangNhap("cskh.uyen", "CSKH@123")).rejects.toThrow(
      "Tai khoan dang o trang thai NghiViec, khong the dang nhap",
    );
  });
});

describe("dangNhapAnToan", () => {
  it("dung thi ok kem phien, sai thi ok:false kem thong bao cua CSDL", async () => {
    const dung = await dangNhapAnToan("letan.lan", "LeTan@123");
    expect(dung.ok && dung.phien.hoTen).toBe("Tran Ngoc Lan");
    await expect(dangNhapAnToan("letan.lan", "sai")).resolves.toEqual({
      ok: false,
      loi: "CSDL từ chối: Ten dang nhap hoac mat khau khong dung",
    });
  });
});

describe("getNhanVienMacDinh", () => {
  it("la letan.lan doc tu TAI_KHOAN, khop voi ket qua cua sp_DangNhap", async () => {
    expect(await getNhanVienMacDinh()).toEqual(await dangNhap("letan.lan", "LeTan@123"));
  });
});
