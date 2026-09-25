import { describe, expect, it } from "vitest";
import { NHAN_VIEN_MAC_DINH, dangNhapGia } from "@/lib/queries/accounts";

describe("dangNhapGia", () => {
  it("dang nhap dung thi tra thong tin phien", async () => {
    const p = await dangNhapGia("admin", "Admin@123");
    expect(p.maTk).toBe("TK00000001");
    expect(p.vaiTro).toBe("Quan tri vien");
  });

  it("le tan dang nhap duoc", async () => {
    const p = await dangNhapGia("letan.lan", "LeTan@123");
    expect(p.hoTen).toBe("Tran Ngoc Lan");
  });

  it("sai mat khau thi bao loi giong sp_DangNhap", async () => {
    await expect(dangNhapGia("admin", "sai")).rejects.toThrow(
      "Tên đăng nhập hoặc mật khẩu không đúng",
    );
  });

  it("khong co tai khoan thi bao cung mot loi, khong lo tai khoan nao ton tai", async () => {
    await expect(dangNhapGia("khongcoai", "gi do")).rejects.toThrow(
      "Tên đăng nhập hoặc mật khẩu không đúng",
    );
  });

  // Review Focus #5
  it("tai khoan TamNghi bi tu choi du mat khau dung", async () => {
    await expect(dangNhapGia("kythuat.son", "KyThuat@456")).rejects.toThrow(
      "Tài khoản đang ở trạng thái TamNghi, không thể đăng nhập",
    );
  });

  it("tai khoan NghiViec bi tu choi du mat khau dung", async () => {
    await expect(dangNhapGia("cskh.uyen", "CSKH@123")).rejects.toThrow(
      "Tài khoản đang ở trạng thái NghiViec, không thể đăng nhập",
    );
  });
});

describe("NHAN_VIEN_MAC_DINH", () => {
  it("dung nhan vien nhu artboard ve tren sidebar", () => {
    expect(NHAN_VIEN_MAC_DINH.hoTen).toBeTruthy();
    expect(NHAN_VIEN_MAC_DINH.vaiTro).toBeTruthy();
  });
  it("lay tu chinh bang TAI_KHOAN nen khong the lech voi du lieu", async () => {
    const p = await dangNhapGia("letan.lan", "LeTan@123");
    expect(NHAN_VIEN_MAC_DINH).toEqual(p);
  });
});
