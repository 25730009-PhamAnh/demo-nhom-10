import * as mock from "@/lib/mock/data";

/**
 * Mo phong sp_DangNhap bang du lieu gia. Mat khau de dang THO vi day la du
 * lieu gia; sp_DangNhap that so bang SHA2(?, 256) voi cot MatKhau. Giai doan
 * sau thay than ham nay bang callProcedure('sp_DangNhap', [...]).
 */

export type PhienDangNhap = {
  maTk: string;
  tenDangNhap: string;
  hoTen: string;
  maLoaiTk: string;
  vaiTro: string;
};

// Mat khau tho tuong ung voi doi so cua SHA2(...) trong Scripts/02_Sample_Data.sql.
const MAT_KHAU: Record<string, string> = {
  admin: "Admin@123",
  "letan.lan": "LeTan@123",
  "letan.huy": "LeTan@456",
  "buong.mai": "Buong@123",
  "buong.thao": "Buong@456",
  "kythuat.nam": "KyThuat@123",
  "kythuat.son": "KyThuat@456",
  "ketoan.hoa": "KeToan@123",
  "quanly.khanh": "QuanLy@123",
  "cskh.uyen": "CSKH@123",
};

/** Dung thong tin phien tu mot dong TAI_KHOAN, noi sang LOAI_TAI_KHOAN. */
function dungPhien(tk: (typeof mock.TAI_KHOAN)[number]): PhienDangNhap {
  const loai = mock.LOAI_TAI_KHOAN.find((l) => l.maLoaiTk === tk.maLoaiTk);
  return {
    maTk: tk.maTk,
    tenDangNhap: tk.tenDangNhap,
    hoTen: tk.hoTen,
    maLoaiTk: tk.maLoaiTk,
    vaiTro: loai?.tenLoaiTk ?? "—",
  };
}

export async function dangNhapGia(
  tenDangNhap: string,
  matKhau: string,
): Promise<PhienDangNhap> {
  const tk = mock.TAI_KHOAN.find((t) => t.tenDangNhap === tenDangNhap);

  // Sai tai khoan va sai mat khau tra cung mot thong bao, giong sp_DangNhap,
  // de khong lo tai khoan nao co that.
  if (!tk || MAT_KHAU[tenDangNhap] !== matKhau) {
    throw new Error("Tên đăng nhập hoặc mật khẩu không đúng");
  }

  if (tk.trangThai !== "DangLamViec") {
    throw new Error(
      `Tài khoản đang ở trạng thái ${tk.trangThai}, không thể đăng nhập`,
    );
  }

  return dungPhien(tk);
}

/**
 * Nhan vien hien tren sidebar khi chua co phien dang nhap that.
 * Lay tu chinh bang TAI_KHOAN chu khong go tay, de ten va vai tro khong lech
 * voi du lieu. `(app)/layout.tsx` doc hang nay roi truyen xuong Sidebar bang
 * prop, de Sidebar (Client Component) khong phai import module nay.
 */
export const NHAN_VIEN_MAC_DINH: PhienDangNhap = dungPhien(
  mock.TAI_KHOAN.find((t) => t.tenDangNhap === "letan.lan")!,
);
