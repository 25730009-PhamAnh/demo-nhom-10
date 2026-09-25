export type KieuTrangThai = { nhan: string; fg: string; bg: string; dot: string };

/** 5 gia tri cua rang buoc CK_PHONG_TrangThai. */
export const TRANG_THAI_PHONG = [
  "Trong", "DaDat", "DangSuDung", "DangDon", "BaoTri",
] as const;

// Bang mau lay dung tu design/README.md, muc "Mau trang thai phong".
const PHONG: Record<string, KieuTrangThai> = {
  Trong:      { nhan: "Trống",        fg: "#14664B", bg: "#E3F0E9", dot: "#1B8A6A" },
  DaDat:      { nhan: "Đã đặt",       fg: "#2A5480", bg: "#E6EDF6", dot: "#4A72C0" },
  DangSuDung: { nhan: "Đang sử dụng", fg: "#8A5A0E", bg: "#F7EFDD", dot: "#B57C10" },
  DangDon:    { nhan: "Đang dọn",     fg: "#5B4B85", bg: "#ECE9F5", dot: "#7561A8" },
  BaoTri:     { nhan: "Bảo trì",      fg: "#8C3A31", bg: "#F8E8E5", dot: "#B04A3E" },
};

const PHIEU: Record<string, KieuTrangThai> = {
  DaDat:   { nhan: "Đã đặt",   fg: "#2A5480", bg: "#E6EDF6", dot: "#4A72C0" },
  DangO:   { nhan: "Đang ở",   fg: "#8A5A0E", bg: "#F7EFDD", dot: "#B57C10" },
  HoanTat: { nhan: "Hoàn tất", fg: "#14664B", bg: "#E3F0E9", dot: "#1B8A6A" },
  DaHuy:   { nhan: "Đã hủy",   fg: "#8C3A31", bg: "#F8E8E5", dot: "#B04A3E" },
};

const HOA_DON: Record<string, KieuTrangThai> = {
  ChuaThanhToan: { nhan: "Chưa thanh toán", fg: "#8A5A0E", bg: "#F7EFDD", dot: "#B57C10" },
  DaThanhToan:   { nhan: "Đã thanh toán",   fg: "#14664B", bg: "#E3F0E9", dot: "#1B8A6A" },
  DaHuy:         { nhan: "Đã hủy",          fg: "#8C3A31", bg: "#F8E8E5", dot: "#B04A3E" },
};

// Du lieu co the chua gia tri ngoai danh sach (vi du sau nay them trang thai
// moi trong CSDL). Tra ve chinh ma kem mau trung tinh thay vi undefined,
// de trang khong vo.
const DU_PHONG = (ma: string): KieuTrangThai => ({
  nhan: ma, fg: "#57504A", bg: "#F3EFE8", dot: "#7B7269",
});

export const nhanTrangThaiPhong  = (ma: string) => PHONG[ma]   ?? DU_PHONG(ma);
export const nhanTrangThaiPhieu  = (ma: string) => PHIEU[ma]   ?? DU_PHONG(ma);
export const nhanTrangThaiHoaDon = (ma: string) => HOA_DON[ma] ?? DU_PHONG(ma);
