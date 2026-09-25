/**
 * Du lieu gia cho giai doan dung giao dien (chua noi MySQL).
 *
 * Moi mang duoi day lay kieu tu src/db/schema.ts bang $inferSelect, nen khong
 * the lech ten cot hay kieu so voi bang that — TypeScript se bao loi ngay.
 *
 * Moi bang chia lam hai phan, danh dau bang chu thich:
 *   ---- TU 02_Sample_Data.sql ----  chep nguyen 10 dong goc
 *   ---- DON THEM CHO DEMO ----     dong bo sung cho man hinh du day
 *
 * Phan don them sinh bang ham co quy tac thay vi go tay hang tram dong, de
 * khong sai sot; den giai doan noi CSDL, doi sang cau INSERT bang mot vong lap
 * tuong tu. Quy tac ma giu dung CHAR(10): tien to + chu so cho du 10 ky tu.
 */
import type * as schema from "@/db/schema";
import { congTien, tienDichVu, tienPhong } from "@/lib/tinh-toan";
import { NGAY_HIEN_TAI } from "@/lib/mock/now";

type LoaiTaiKhoan = typeof schema.loaiTaiKhoan.$inferSelect;
type TaiKhoan = typeof schema.taiKhoan.$inferSelect;
type KhachHang = typeof schema.khachHang.$inferSelect;
type LoaiPhong = typeof schema.loaiPhong.$inferSelect;
type BangGiaPhong = typeof schema.bangGiaPhong.$inferSelect;
type Phong = typeof schema.phong.$inferSelect;
type PhieuDatPhong = typeof schema.phieuDatPhong.$inferSelect;
type ChiTietDatPhong = typeof schema.chiTietDatPhong.$inferSelect;
type DonPhong = typeof schema.donPhong.$inferSelect;
type SuaPhong = typeof schema.suaPhong.$inferSelect;
type DichVu = typeof schema.dichVu.$inferSelect;
type SuDungDichVu = typeof schema.suDungDichVu.$inferSelect;
type HoaDon = typeof schema.hoaDon.$inferSelect;
type ChiTietHoaDon = typeof schema.chiTietHoaDon.$inferSelect;

/** Sinh ma CHAR(10): tien to + so, dem 0 cho du 10 ky tu. */
function ma(tienTo: string, n: number): string {
  return tienTo + String(n).padStart(10 - tienTo.length, "0");
}

/** Cong them n ngay vao chuoi 'YYYY-MM-DD'. */
function themNgay(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// =====================================================================
// LOAI_TAI_KHOAN
// =====================================================================
export const LOAI_TAI_KHOAN: LoaiTaiKhoan[] = [
  // ---- TU 02_Sample_Data.sql ----
  { maLoaiTk: "LTK0000001", tenLoaiTk: "Quan tri vien",       moTa: "Quan tri he thong va tai khoan" },
  { maLoaiTk: "LTK0000002", tenLoaiTk: "Le tan",              moTa: "Dat phong, nhan phong va tra phong" },
  { maLoaiTk: "LTK0000003", tenLoaiTk: "Buong phong",         moTa: "Don phong va cap nhat tinh trang phong" },
  { maLoaiTk: "LTK0000004", tenLoaiTk: "Ky thuat",            moTa: "Sua chua va bao tri co so vat chat" },
  { maLoaiTk: "LTK0000005", tenLoaiTk: "Ke toan",             moTa: "Quan ly hoa don va thanh toan" },
  { maLoaiTk: "LTK0000006", tenLoaiTk: "Quan ly khach san",   moTa: "Theo doi hoat dong va bao cao" },
  { maLoaiTk: "LTK0000007", tenLoaiTk: "Nha hang",            moTa: "Quan ly dich vu an uong" },
  { maLoaiTk: "LTK0000008", tenLoaiTk: "Spa",                 moTa: "Quan ly dich vu cham soc suc khoe" },
  { maLoaiTk: "LTK0000009", tenLoaiTk: "Bao ve",              moTa: "Dam bao an ninh va kiem soat ra vao" },
  { maLoaiTk: "LTK0000010", tenLoaiTk: "Cham soc khach hang", moTa: "Tiep nhan va xu ly yeu cau cua khach" },
];

// =====================================================================
// TAI_KHOAN — MatKhau la chuoi SHA2(...,256) dung nhu trong CSDL.
// Mat khau tho nam o queries/accounts.ts, khong de o day.
// =====================================================================
export const TAI_KHOAN: TaiKhoan[] = [
  // ---- TU 02_Sample_Data.sql ----
  { maTk: "TK00000001", maLoaiTk: "LTK0000001", tenDangNhap: "admin",        matKhau: "e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7", hoTen: "Nguyen Minh Anh", trangThai: "DangLamViec" },
  { maTk: "TK00000002", maLoaiTk: "LTK0000002", tenDangNhap: "letan.lan",    matKhau: "e9f2562f0e7354e35ebd6ef9bcc3a931d4e541a59630ae7b1e4e1743a50cad8b", hoTen: "Tran Ngoc Lan",   trangThai: "DangLamViec" },
  { maTk: "TK00000003", maLoaiTk: "LTK0000002", tenDangNhap: "letan.huy",    matKhau: "fa506c8b3b224797667887c3b8adb4daeb70e9f9af76b24f41a5bbc7bb6b86a8", hoTen: "Le Quang Huy",    trangThai: "DangLamViec" },
  { maTk: "TK00000004", maLoaiTk: "LTK0000003", tenDangNhap: "buong.mai",    matKhau: "dad724df76524d3a60f3379e5b2c9dda08c8efd5da8546ef567db495378bb784", hoTen: "Pham Thi Mai",    trangThai: "DangLamViec" },
  { maTk: "TK00000005", maLoaiTk: "LTK0000003", tenDangNhap: "buong.thao",   matKhau: "2a25ae5e5d05c808ee41bb3e7980596ab4b85a629a93d09b60909e5a1827a5ed", hoTen: "Vo Thanh Thao",   trangThai: "DangLamViec" },
  { maTk: "TK00000006", maLoaiTk: "LTK0000004", tenDangNhap: "kythuat.nam",  matKhau: "8c3cce94c1542421f640d256eee7350c538572f893e737f971386036f8de1bdd", hoTen: "Do Hoang Nam",    trangThai: "DangLamViec" },
  { maTk: "TK00000007", maLoaiTk: "LTK0000004", tenDangNhap: "kythuat.son",  matKhau: "92cefd2db566b058e07a43b9b12f1c8ea60eb4a3bdced6b3d545ad302a05deef", hoTen: "Bui Minh Son",    trangThai: "TamNghi" },
  { maTk: "TK00000008", maLoaiTk: "LTK0000005", tenDangNhap: "ketoan.hoa",   matKhau: "1fdb95a3f1bfe969640ae6382a82430e8c92484da5f088cc61ecde8ae94564d1", hoTen: "Nguyen Thu Hoa",  trangThai: "DangLamViec" },
  { maTk: "TK00000009", maLoaiTk: "LTK0000006", tenDangNhap: "quanly.khanh", matKhau: "0648eac017e13fe4fe7f1e1322a1827d94640bf31536ef48d2a2da2c5f1d1bfc", hoTen: "Dang Gia Khanh",  trangThai: "DangLamViec" },
  { maTk: "TK00000010", maLoaiTk: "LTK0000010", tenDangNhap: "cskh.uyen",    matKhau: "4027cf7364adab9b581f53a0c758ec1d4ccb1d5375c0b2db2de68dc013bfc989", hoTen: "Hoang Ngoc Uyen", trangThai: "NghiViec" },
];

// =====================================================================
// KHACH_HANG
// =====================================================================
const KHACH_GOC: KhachHang[] = [
  // ---- TU 02_Sample_Data.sql ----
  { maKh: "KH00000001", hoTen: "Nguyen Hoang Long", cccd: "079201000001", sdt: "0901234501", email: "long.nguyen@example.com" },
  { maKh: "KH00000002", hoTen: "Tran Thi Bao Chau", cccd: "079202000002", sdt: "0901234502", email: "chau.tran@example.com" },
  { maKh: "KH00000003", hoTen: "Le Minh Tuan",      cccd: "079203000003", sdt: "0901234503", email: "tuan.le@example.com" },
  { maKh: "KH00000004", hoTen: "Pham Ngoc Ha",      cccd: "079204000004", sdt: "0901234504", email: "ha.pham@example.com" },
  { maKh: "KH00000005", hoTen: "Vo Quoc Bao",       cccd: "079205000005", sdt: "0901234505", email: "bao.vo@example.com" },
  { maKh: "KH00000006", hoTen: "Dang Thuy Linh",    cccd: "079206000006", sdt: "0901234506", email: "linh.dang@example.com" },
  { maKh: "KH00000007", hoTen: "Bui Gia Han",       cccd: "079207000007", sdt: "0901234507", email: "han.bui@example.com" },
  { maKh: "KH00000008", hoTen: "Hoang Anh Khoa",    cccd: "079208000008", sdt: "0901234508", email: "khoa.hoang@example.com" },
  { maKh: "KH00000009", hoTen: "Do My Duyen",       cccd: "079209000009", sdt: "0901234509", email: "duyen.do@example.com" },
  { maKh: "KH00000010", hoTen: "Truong Duc Phuc",   cccd: "079210000010", sdt: "0901234510", email: "phuc.truong@example.com" },
];

// ---- DON THEM CHO DEMO ----
// Ten khong dau, giong loi viet cua du lieu goc. Ghep tu ba mang de co 50 ho so
// khac nhau ma khong phai go tay tung dong.
const HO = ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Vo", "Dang", "Bui", "Do", "Ho"];
const DEM = ["Thi", "Van", "Minh", "Ngoc", "Gia", "Quoc", "Thanh", "Hai", "Anh", "Kim"];
const TEN = ["An", "Binh", "Chi", "Dung", "Giang", "Ha", "Khanh", "Linh", "Mai", "Nam"];

const KHACH_THEM: KhachHang[] = Array.from({ length: 50 }, (_, i) => {
  const n = i + 11;
  return {
    maKh: ma("KH", n),
    hoTen: `${HO[i % 10]} ${DEM[(i * 3) % 10]} ${TEN[(i * 7) % 10]}`,
    // Tien to 0793 de khong dung CCCD cua du lieu goc (07920x, 07921x).
    cccd: `0793${String(n).padStart(8, "0")}`,
    sdt: `09${String(10_000_000 + n).padStart(8, "0")}`,
    email: `khach${n}@example.com`,
  };
});

export const KHACH_HANG: KhachHang[] = [...KHACH_GOC, ...KHACH_THEM];

// =====================================================================
// LOAI_PHONG
// =====================================================================
export const LOAI_PHONG: LoaiPhong[] = [
  // ---- TU 02_Sample_Data.sql ----
  { maLoaiPhong: "LP00000001", tenLoaiPhong: "Standard Single",    donGiaNgay: "600000.00" },
  { maLoaiPhong: "LP00000002", tenLoaiPhong: "Standard Double",    donGiaNgay: "800000.00" },
  { maLoaiPhong: "LP00000003", tenLoaiPhong: "Superior Twin",      donGiaNgay: "1000000.00" },
  { maLoaiPhong: "LP00000004", tenLoaiPhong: "Superior Double",    donGiaNgay: "1150000.00" },
  { maLoaiPhong: "LP00000005", tenLoaiPhong: "Deluxe King",        donGiaNgay: "1500000.00" },
  { maLoaiPhong: "LP00000006", tenLoaiPhong: "Deluxe Twin",        donGiaNgay: "1600000.00" },
  { maLoaiPhong: "LP00000007", tenLoaiPhong: "Junior Suite",       donGiaNgay: "2200000.00" },
  { maLoaiPhong: "LP00000008", tenLoaiPhong: "Executive Suite",    donGiaNgay: "3200000.00" },
  { maLoaiPhong: "LP00000009", tenLoaiPhong: "Family Room",        donGiaNgay: "2600000.00" },
  { maLoaiPhong: "LP00000010", tenLoaiPhong: "Presidential Suite", donGiaNgay: "6000000.00" },
];

// =====================================================================
// BANG_GIA_PHONG
// =====================================================================
export const BANG_GIA_PHONG: BangGiaPhong[] = [
  // ---- TU 02_Sample_Data.sql ----
  { maBangGia: "BG00000001", maLoaiPhong: "LP00000001", heSo: "1.00", apDungTuNgay: "2026-01-01", denNgay: "2026-12-31", donGia: "600000.00" },
  { maBangGia: "BG00000002", maLoaiPhong: "LP00000002", heSo: "1.10", apDungTuNgay: "2026-01-01", denNgay: "2026-12-31", donGia: "880000.00" },
  { maBangGia: "BG00000003", maLoaiPhong: "LP00000003", heSo: "1.00", apDungTuNgay: "2026-01-01", denNgay: "2026-12-31", donGia: "1000000.00" },
  { maBangGia: "BG00000004", maLoaiPhong: "LP00000004", heSo: "1.20", apDungTuNgay: "2026-01-01", denNgay: "2026-12-31", donGia: "1380000.00" },
  { maBangGia: "BG00000005", maLoaiPhong: "LP00000005", heSo: "1.00", apDungTuNgay: "2026-01-01", denNgay: "2026-12-31", donGia: "1500000.00" },
  { maBangGia: "BG00000006", maLoaiPhong: "LP00000006", heSo: "1.15", apDungTuNgay: "2026-01-01", denNgay: "2026-12-31", donGia: "1840000.00" },
  { maBangGia: "BG00000007", maLoaiPhong: "LP00000007", heSo: "1.00", apDungTuNgay: "2026-01-01", denNgay: "2026-12-31", donGia: "2200000.00" },
  { maBangGia: "BG00000008", maLoaiPhong: "LP00000008", heSo: "1.25", apDungTuNgay: "2026-01-01", denNgay: "2026-12-31", donGia: "4000000.00" },
  { maBangGia: "BG00000009", maLoaiPhong: "LP00000009", heSo: "1.10", apDungTuNgay: "2026-01-01", denNgay: "2026-12-31", donGia: "2860000.00" },
  { maBangGia: "BG00000010", maLoaiPhong: "LP00000010", heSo: "1.30", apDungTuNgay: "2026-01-01", denNgay: "2026-12-31", donGia: "7800000.00" },
];

// =====================================================================
// PHONG
// =====================================================================
const PHONG_GOC: Phong[] = [
  // ---- TU 02_Sample_Data.sql ----
  { maPhong: "PH00000001", maLoaiPhong: "LP00000001", soPhong: "101",     tang: 1, trangThai: "Trong" },
  { maPhong: "PH00000002", maLoaiPhong: "LP00000002", soPhong: "102",     tang: 1, trangThai: "Trong" },
  { maPhong: "PH00000003", maLoaiPhong: "LP00000003", soPhong: "201",     tang: 2, trangThai: "Trong" },
  { maPhong: "PH00000004", maLoaiPhong: "LP00000004", soPhong: "202",     tang: 2, trangThai: "BaoTri" },
  { maPhong: "PH00000005", maLoaiPhong: "LP00000005", soPhong: "301",     tang: 3, trangThai: "DangDon" },
  { maPhong: "PH00000006", maLoaiPhong: "LP00000006", soPhong: "302",     tang: 3, trangThai: "DangSuDung" },
  { maPhong: "PH00000007", maLoaiPhong: "LP00000007", soPhong: "401",     tang: 4, trangThai: "DaDat" },
  { maPhong: "PH00000008", maLoaiPhong: "LP00000008", soPhong: "402",     tang: 4, trangThai: "DaDat" },
  { maPhong: "PH00000009", maLoaiPhong: "LP00000009", soPhong: "501",     tang: 5, trangThai: "DaDat" },
  { maPhong: "PH00000010", maLoaiPhong: "LP00000010", soPhong: "PRES-01", tang: 6, trangThai: "BaoTri" },
];

// ---- DON THEM CHO DEMO ----
// Lap day tang 1-4, moi tang them 8 phong (x03..x10), tong cong 42 phong.
// Trang thai rai theo mot chu ky co dinh de con so tren man Tong quan on dinh
// giua cac lan tai trang, khong phu thuoc thu tu ngau nhien.
const CHU_KY_TRANG_THAI = [
  "DangSuDung", "DangSuDung", "DangSuDung", "DaDat",
  "DangSuDung", "Trong", "DangSuDung", "DaDat",
] as const;

const PHONG_THEM: Phong[] = [1, 2, 3, 4].flatMap((tang, iTang) =>
  Array.from({ length: 8 }, (_, i) => {
    const thuTu = iTang * 8 + i;
    return {
      maPhong: ma("PH", 11 + thuTu),
      maLoaiPhong: ma("LP", (thuTu % 10) + 1),
      soPhong: `${tang}${String(i + 3).padStart(2, "0")}`,
      tang,
      trangThai: CHU_KY_TRANG_THAI[thuTu % CHU_KY_TRANG_THAI.length],
    };
  }),
);

export const PHONG: Phong[] = [...PHONG_GOC, ...PHONG_THEM];

// =====================================================================
// DICH_VU
// =====================================================================
export const DICH_VU: DichVu[] = [
  // ---- TU 02_Sample_Data.sql ----
  { maDv: "DV00000001", tenDv: "Giat ui",             donViTinh: "Kg",       giaDv: "80000.00" },
  { maDv: "DV00000002", tenDv: "Buffet sang",         donViTinh: "Suat",     giaDv: "250000.00" },
  { maDv: "DV00000003", tenDv: "Dua don san bay",     donViTinh: "Chuyen",   giaDv: "500000.00" },
  { maDv: "DV00000004", tenDv: "Spa 60 phut",         donViTinh: "Luot",     giaDv: "700000.00" },
  { maDv: "DV00000005", tenDv: "Minibar",             donViTinh: "SanPham",  giaDv: "100000.00" },
  { maDv: "DV00000006", tenDv: "An tai phong",        donViTinh: "Suat",     giaDv: "350000.00" },
  { maDv: "DV00000007", tenDv: "Thue xe may",         donViTinh: "Ngay",     giaDv: "200000.00" },
  { maDv: "DV00000008", tenDv: "Phong hoi nghi",      donViTinh: "Gio",      giaDv: "1000000.00" },
  { maDv: "DV00000009", tenDv: "Giuong phu",          donViTinh: "Dem",      giaDv: "400000.00" },
  { maDv: "DV00000010", tenDv: "Trang tri sinh nhat", donViTinh: "Goi",      giaDv: "1500000.00" },
];

/** Don gia mot dem cua phong, tra cuu qua loai phong. */
function donGiaCuaPhong(maPhong: string): string {
  const p = PHONG.find((x) => x.maPhong === maPhong);
  return LOAI_PHONG.find((l) => l.maLoaiPhong === p?.maLoaiPhong)?.donGiaNgay ?? "0.00";
}

// =====================================================================
// PHIEU_DAT_PHONG + CHI_TIET_DAT_PHONG
// =====================================================================
const PHIEU_GOC: PhieuDatPhong[] = [
  // ---- TU 02_Sample_Data.sql ----
  { maDatPhong: "DP00000001", maKh: "KH00000001", maTk: "TK00000002", ngayLap: "2026-01-02 09:10:00", ngayCheckIn: "2026-01-10", ngayCheckOut: "2026-01-12", tienCoc: "600000.00",  trangThai: "HoanTat" },
  { maDatPhong: "DP00000002", maKh: "KH00000002", maTk: "TK00000003", ngayLap: "2026-04-12 14:20:00", ngayCheckIn: "2026-04-20", ngayCheckOut: "2026-04-23", tienCoc: "1320000.00", trangThai: "HoanTat" },
  { maDatPhong: "DP00000003", maKh: "KH00000003", maTk: "TK00000002", ngayLap: "2026-08-01 10:00:00", ngayCheckIn: "2026-08-14", ngayCheckOut: "2026-08-16", tienCoc: "1000000.00", trangThai: "HoanTat" },
  { maDatPhong: "DP00000004", maKh: "KH00000004", maTk: "TK00000003", ngayLap: "2026-09-01 16:30:00", ngayCheckIn: "2026-09-10", ngayCheckOut: "2026-09-12", tienCoc: "1380000.00", trangThai: "HoanTat" },
  { maDatPhong: "DP00000005", maKh: "KH00000005", maTk: "TK00000002", ngayLap: "2026-09-05 08:45:00", ngayCheckIn: "2026-09-14", ngayCheckOut: "2026-09-16", tienCoc: "1500000.00", trangThai: "HoanTat" },
  { maDatPhong: "DP00000006", maKh: "KH00000006", maTk: "TK00000003", ngayLap: "2026-09-10 11:15:00", ngayCheckIn: "2026-09-15", ngayCheckOut: "2026-09-18", tienCoc: "2760000.00", trangThai: "DangO" },
  { maDatPhong: "DP00000007", maKh: "KH00000007", maTk: "TK00000002", ngayLap: "2026-09-12 13:40:00", ngayCheckIn: "2026-10-05", ngayCheckOut: "2026-10-08", tienCoc: "3300000.00", trangThai: "DaDat" },
  { maDatPhong: "DP00000008", maKh: "KH00000008", maTk: "TK00000003", ngayLap: "2026-09-13 15:05:00", ngayCheckIn: "2026-11-20", ngayCheckOut: "2026-11-22", tienCoc: "6860000.00", trangThai: "DaDat" },
  { maDatPhong: "DP00000009", maKh: "KH00000009", maTk: "TK00000002", ngayLap: "2026-09-01 09:30:00", ngayCheckIn: "2026-09-20", ngayCheckOut: "2026-09-22", tienCoc: "0.00",       trangThai: "DaHuy" },
  { maDatPhong: "DP00000010", maKh: "KH00000010", maTk: "TK00000003", ngayLap: "2026-09-10 17:00:00", ngayCheckIn: "2026-12-01", ngayCheckOut: "2026-12-03", tienCoc: "0.00",       trangThai: "DaHuy" },
];

const CHI_TIET_GOC: ChiTietDatPhong[] = [
  // ---- TU 02_Sample_Data.sql ---- (ThanhTien la cot sinh = GiaThueThoiDiem * SoDem)
  { maDatPhong: "DP00000001", maPhong: "PH00000001", giaThueThoiDiem: "600000.00",  soDem: 2, thanhTien: "1200000.00" },
  { maDatPhong: "DP00000002", maPhong: "PH00000002", giaThueThoiDiem: "880000.00",  soDem: 3, thanhTien: "2640000.00" },
  { maDatPhong: "DP00000003", maPhong: "PH00000003", giaThueThoiDiem: "1000000.00", soDem: 2, thanhTien: "2000000.00" },
  { maDatPhong: "DP00000004", maPhong: "PH00000004", giaThueThoiDiem: "1380000.00", soDem: 2, thanhTien: "2760000.00" },
  { maDatPhong: "DP00000005", maPhong: "PH00000005", giaThueThoiDiem: "1500000.00", soDem: 2, thanhTien: "3000000.00" },
  { maDatPhong: "DP00000006", maPhong: "PH00000006", giaThueThoiDiem: "1840000.00", soDem: 3, thanhTien: "5520000.00" },
  { maDatPhong: "DP00000007", maPhong: "PH00000007", giaThueThoiDiem: "2200000.00", soDem: 3, thanhTien: "6600000.00" },
  { maDatPhong: "DP00000008", maPhong: "PH00000008", giaThueThoiDiem: "4000000.00", soDem: 2, thanhTien: "8000000.00" },
  { maDatPhong: "DP00000008", maPhong: "PH00000009", giaThueThoiDiem: "2860000.00", soDem: 2, thanhTien: "5720000.00" },
  { maDatPhong: "DP00000009", maPhong: "PH00000009", giaThueThoiDiem: "2860000.00", soDem: 2, thanhTien: "5720000.00" },
];

// ---- DON THEM CHO DEMO ----
// Ba nhom: 12 phieu nhan phong hom nay, 9 phieu tra phong hom nay, va cac phieu
// da hoan tat rai deu 12 thang de man Bao cao co du lieu ca ky.
const phieuThem: PhieuDatPhong[] = [];
const chiTietThem: ChiTietDatPhong[] = [];

/** Tao mot phieu kem mot dong chi tiet, dung chung cho ca ba nhom. */
function themPhieu(args: {
  soHieu: number;
  maKh: string;
  maPhong: string;
  checkIn: string;
  soDemO: number;
  trangThai: string;
}): void {
  const { soHieu, maKh, maPhong, checkIn, soDemO, trangThai } = args;
  const gia = donGiaCuaPhong(maPhong);
  const maDatPhong = ma("DP", soHieu);

  phieuThem.push({
    maDatPhong,
    maKh,
    maTk: soHieu % 2 === 0 ? "TK00000002" : "TK00000003",
    ngayLap: `${themNgay(checkIn, -7)} 09:00:00`,
    ngayCheckIn: checkIn,
    ngayCheckOut: themNgay(checkIn, soDemO),
    tienCoc: gia,
    trangThai,
  });
  chiTietThem.push({
    maDatPhong,
    maPhong,
    giaThueThoiDiem: gia,
    soDem: soDemO,
    thanhTien: tienPhong(gia, soDemO),
  });
}

// Nhom 1 — 12 luot nhan phong hom nay (phong PH00000011..PH00000022).
for (let i = 0; i < 12; i++) {
  themPhieu({
    soHieu: 11 + i,
    maKh: ma("KH", 11 + i),
    maPhong: ma("PH", 11 + i),
    checkIn: NGAY_HIEN_TAI,
    soDemO: 2 + (i % 3),
    trangThai: "DaDat",
  });
}

// Nhom 2 — 9 luot tra phong hom nay (phong PH00000023..PH00000031).
for (let i = 0; i < 9; i++) {
  const soDemO = 2 + (i % 3);
  themPhieu({
    soHieu: 23 + i,
    maKh: ma("KH", 23 + i),
    maPhong: ma("PH", 23 + i),
    checkIn: themNgay(NGAY_HIEN_TAI, -soDemO),
    soDemO,
    trangThai: "DangO",
  });
}

// Nhom 3 — 9 phieu da tra phong VA da thanh toan trong hom nay, de man Tong quan
// co so "doanh thu hom nay" that thay vi 0 dong (phong PH00000032..PH00000040).
for (let i = 0; i < 9; i++) {
  themPhieu({
    soHieu: 90 + i,
    maKh: ma("KH", 32 + i),
    maPhong: ma("PH", 32 + i),
    checkIn: themNgay(NGAY_HIEN_TAI, -2),
    soDemO: 2,
    trangThai: "HoanTat",
  });
}

// Nhom 4 — phieu da hoan tat, 4 phieu moi thang trong 12 thang gan nhat.
const THANG_BAO_CAO: string[] = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 8, 1));
  d.setUTCMonth(d.getUTCMonth() - (11 - i));
  return d.toISOString().slice(0, 7);
});

let soHieuLichSu = 32;
for (const thang of THANG_BAO_CAO) {
  for (const ngay of ["03", "09", "15", "20"]) {
    themPhieu({
      soHieu: soHieuLichSu,
      maKh: ma("KH", 11 + (soHieuLichSu % 50)),
      maPhong: ma("PH", 32 + (soHieuLichSu % 11)),
      checkIn: `${thang}-${ngay}`,
      soDemO: 2,
      trangThai: "HoanTat",
    });
    soHieuLichSu++;
  }
}

export const PHIEU_DAT_PHONG: PhieuDatPhong[] = [...PHIEU_GOC, ...phieuThem];
export const CHI_TIET_DAT_PHONG: ChiTietDatPhong[] = [...CHI_TIET_GOC, ...chiTietThem];

// =====================================================================
// DON_PHONG
// =====================================================================
export const DON_PHONG: DonPhong[] = [
  // ---- TU 02_Sample_Data.sql ----
  { maDon: "DON0000001", maPhong: "PH00000001", maTk: "TK00000004", thoiGian: "2026-01-12 12:30:00", ghiChu: "Don sau khi khach tra phong" },
  { maDon: "DON0000002", maPhong: "PH00000002", maTk: "TK00000005", thoiGian: "2026-04-23 11:45:00", ghiChu: "Thay ga giuong va bo sung nuoc" },
  { maDon: "DON0000003", maPhong: "PH00000003", maTk: "TK00000004", thoiGian: "2026-08-16 12:10:00", ghiChu: "Don phong va kiem tra minibar" },
  { maDon: "DON0000004", maPhong: "PH00000004", maTk: "TK00000005", thoiGian: "2026-09-12 11:30:00", ghiChu: "Ve sinh phong tam" },
  { maDon: "DON0000005", maPhong: "PH00000005", maTk: "TK00000004", thoiGian: "2026-09-16 12:00:00", ghiChu: "Dang don tong quat sau check-out" },
  { maDon: "DON0000006", maPhong: "PH00000006", maTk: "TK00000005", thoiGian: "2026-09-14 15:20:00", ghiChu: "Chuan bi phong truoc check-in" },
  { maDon: "DON0000007", maPhong: "PH00000007", maTk: "TK00000004", thoiGian: "2026-09-15 09:00:00", ghiChu: "Ve sinh dinh ky phong Junior Suite" },
  { maDon: "DON0000008", maPhong: "PH00000008", maTk: "TK00000005", thoiGian: "2026-09-15 09:30:00", ghiChu: "Ve sinh dinh ky phong Executive Suite" },
  { maDon: "DON0000009", maPhong: "PH00000009", maTk: "TK00000004", thoiGian: "2026-09-15 10:00:00", ghiChu: "Ve sinh dinh ky phong gia dinh" },
  { maDon: "DON0000010", maPhong: "PH00000010", maTk: "TK00000005", thoiGian: "2026-09-01 10:30:00", ghiChu: "Ve sinh truoc dot bao tri" },
  // ---- DON THEM CHO DEMO ---- (quanh 22-23/09 de nhat ky buong phong co dong)
  { maDon: "DON0000011", maPhong: "PH00000023", maTk: "TK00000004", thoiGian: "2026-09-23 09:50:00", ghiChu: "Don phong sau khi khach tra" },
  { maDon: "DON0000012", maPhong: "PH00000024", maTk: "TK00000005", thoiGian: "2026-09-23 10:15:00", ghiChu: "Thay ga giuong va khan tam" },
  { maDon: "DON0000013", maPhong: "PH00000011", maTk: "TK00000004", thoiGian: "2026-09-23 08:30:00", ghiChu: "Chuan bi phong don khach trong ngay" },
  { maDon: "DON0000014", maPhong: "PH00000012", maTk: "TK00000005", thoiGian: "2026-09-23 08:45:00", ghiChu: "Chuan bi phong don khach trong ngay" },
  { maDon: "DON0000015", maPhong: "PH00000025", maTk: "TK00000004", thoiGian: "2026-09-22 14:20:00", ghiChu: "Ve sinh dinh ky" },
  { maDon: "DON0000016", maPhong: "PH00000026", maTk: "TK00000005", thoiGian: "2026-09-22 15:00:00", ghiChu: "Bo sung minibar" },
];

// =====================================================================
// SUA_PHONG
// =====================================================================
export const SUA_PHONG: SuaPhong[] = [
  // ---- TU 02_Sample_Data.sql ----
  { maSua: "SUA0000001", maPhong: "PH00000001", maTk: "TK00000006", thoiGian: "2025-12-15 09:00:00", chiPhi: "250000.00",  moTaLoi: "Thay khoa cua phong" },
  { maSua: "SUA0000002", maPhong: "PH00000002", maTk: "TK00000007", thoiGian: "2026-03-05 10:30:00", chiPhi: "180000.00",  moTaLoi: "Sua voi nuoc bi ri" },
  { maSua: "SUA0000003", maPhong: "PH00000003", maTk: "TK00000006", thoiGian: "2026-07-01 13:00:00", chiPhi: "450000.00",  moTaLoi: "Bao tri may lanh" },
  { maSua: "SUA0000004", maPhong: "PH00000004", maTk: "TK00000007", thoiGian: "2026-09-13 15:20:00", chiPhi: "900000.00",  moTaLoi: "Sua he thong nuoc nong" },
  { maSua: "SUA0000005", maPhong: "PH00000005", maTk: "TK00000006", thoiGian: "2026-08-20 08:45:00", chiPhi: "120000.00",  moTaLoi: "Thay bong den phong tam" },
  { maSua: "SUA0000006", maPhong: "PH00000006", maTk: "TK00000007", thoiGian: "2026-08-25 14:10:00", chiPhi: "350000.00",  moTaLoi: "Bao tri tivi" },
  { maSua: "SUA0000007", maPhong: "PH00000007", maTk: "TK00000006", thoiGian: "2026-09-02 10:00:00", chiPhi: "600000.00",  moTaLoi: "Thay rem cua so" },
  { maSua: "SUA0000008", maPhong: "PH00000008", maTk: "TK00000007", thoiGian: "2026-09-03 11:30:00", chiPhi: "750000.00",  moTaLoi: "Sua may pha ca phe" },
  { maSua: "SUA0000009", maPhong: "PH00000009", maTk: "TK00000006", thoiGian: "2026-09-04 16:00:00", chiPhi: "500000.00",  moTaLoi: "Bao tri tu lanh" },
  { maSua: "SUA0000010", maPhong: "PH00000010", maTk: "TK00000007", thoiGian: "2026-09-15 09:40:00", chiPhi: "1500000.00", moTaLoi: "Bao tri he thong am thanh" },
  // ---- DON THEM CHO DEMO ----
  { maSua: "SUA0000011", maPhong: "PH00000027", maTk: "TK00000006", thoiGian: "2026-09-23 08:10:00", chiPhi: "0.00",       moTaLoi: "May lanh khong chay, dang kiem tra" },
  { maSua: "SUA0000012", maPhong: "PH00000028", maTk: "TK00000006", thoiGian: "2026-09-22 16:30:00", chiPhi: "320000.00",  moTaLoi: "Thay voi sen phong tam" },
];

// =====================================================================
// SU_DUNG_DICH_VU + HOA_DON + CHI_TIET_HOA_DON
// =====================================================================
const SU_DUNG_GOC: SuDungDichVu[] = [
  // ---- TU 02_Sample_Data.sql ---- (ThanhTien la cot sinh = SoLuong * DonGiaThoiDiem)
  { maSuDungDv: "SD00000001", maDatPhong: "DP00000001", maDv: "DV00000002", ngaySuDung: "2026-01-11 07:30:00", soLuong: 2, donGiaThoiDiem: "250000.00",  thanhTien: "500000.00" },
  { maSuDungDv: "SD00000002", maDatPhong: "DP00000001", maDv: "DV00000001", ngaySuDung: "2026-01-11 09:00:00", soLuong: 2, donGiaThoiDiem: "80000.00",   thanhTien: "160000.00" },
  { maSuDungDv: "SD00000003", maDatPhong: "DP00000001", maDv: "DV00000005", ngaySuDung: "2026-01-11 20:00:00", soLuong: 1, donGiaThoiDiem: "100000.00",  thanhTien: "100000.00" },
  { maSuDungDv: "SD00000004", maDatPhong: "DP00000002", maDv: "DV00000002", ngaySuDung: "2026-04-21 07:30:00", soLuong: 4, donGiaThoiDiem: "250000.00",  thanhTien: "1000000.00" },
  { maSuDungDv: "SD00000005", maDatPhong: "DP00000002", maDv: "DV00000003", ngaySuDung: "2026-04-20 12:00:00", soLuong: 1, donGiaThoiDiem: "500000.00",  thanhTien: "500000.00" },
  { maSuDungDv: "SD00000006", maDatPhong: "DP00000002", maDv: "DV00000004", ngaySuDung: "2026-04-22 15:00:00", soLuong: 1, donGiaThoiDiem: "700000.00",  thanhTien: "700000.00" },
  { maSuDungDv: "SD00000007", maDatPhong: "DP00000003", maDv: "DV00000006", ngaySuDung: "2026-08-14 19:30:00", soLuong: 2, donGiaThoiDiem: "350000.00",  thanhTien: "700000.00" },
  { maSuDungDv: "SD00000008", maDatPhong: "DP00000003", maDv: "DV00000007", ngaySuDung: "2026-08-15 08:00:00", soLuong: 2, donGiaThoiDiem: "200000.00",  thanhTien: "400000.00" },
  { maSuDungDv: "SD00000009", maDatPhong: "DP00000004", maDv: "DV00000008", ngaySuDung: "2026-09-11 09:00:00", soLuong: 2, donGiaThoiDiem: "1000000.00", thanhTien: "2000000.00" },
  { maSuDungDv: "SD00000010", maDatPhong: "DP00000004", maDv: "DV00000009", ngaySuDung: "2026-09-10 18:00:00", soLuong: 2, donGiaThoiDiem: "400000.00",  thanhTien: "800000.00" },
];

const HOA_DON_GOC: HoaDon[] = [
  // ---- TU 02_Sample_Data.sql ----
  { maHoaDon: "HD00000001", maDatPhong: "DP00000001", ngayLap: "2026-01-12 11:00:00", tongTien: "1360000.00", loaiThanhToan: "The",         trangThai: "DaThanhToan" },
  { maHoaDon: "HD00000002", maDatPhong: "DP00000002", ngayLap: "2026-04-23 10:30:00", tongTien: "3620000.00", loaiThanhToan: "ChuyenKhoan", trangThai: "DaThanhToan" },
  { maHoaDon: "HD00000003", maDatPhong: "DP00000003", ngayLap: "2026-08-16 11:00:00", tongTien: "2100000.00", loaiThanhToan: "TienMat",     trangThai: "DaThanhToan" },
  { maHoaDon: "HD00000004", maDatPhong: "DP00000004", ngayLap: "2026-09-12 10:45:00", tongTien: "4180000.00", loaiThanhToan: "The",         trangThai: "DaThanhToan" },
  { maHoaDon: "HD00000005", maDatPhong: "DP00000005", ngayLap: "2026-09-16 11:15:00", tongTien: "1500000.00", loaiThanhToan: "TienMat",     trangThai: "DaThanhToan" },
  { maHoaDon: "HD00000006", maDatPhong: "DP00000006", ngayLap: "2026-09-15 14:00:00", tongTien: "2760000.00", loaiThanhToan: null,          trangThai: "ChuaThanhToan" },
  { maHoaDon: "HD00000007", maDatPhong: "DP00000007", ngayLap: "2026-09-12 13:45:00", tongTien: "0.00",       loaiThanhToan: null,          trangThai: "ChuaThanhToan" },
  { maHoaDon: "HD00000008", maDatPhong: "DP00000008", ngayLap: "2026-09-13 15:10:00", tongTien: "0.00",       loaiThanhToan: null,          trangThai: "ChuaThanhToan" },
  { maHoaDon: "HD00000009", maDatPhong: "DP00000009", ngayLap: "2026-09-05 10:00:00", tongTien: "0.00",       loaiThanhToan: null,          trangThai: "DaHuy" },
  { maHoaDon: "HD00000010", maDatPhong: "DP00000010", ngayLap: "2026-09-12 09:00:00", tongTien: "0.00",       loaiThanhToan: null,          trangThai: "DaHuy" },
];

const CHI_TIET_HOA_DON_GOC: ChiTietHoaDon[] = [
  // ---- TU 02_Sample_Data.sql ----
  { maCthd: "CT00000001", maHoaDon: "HD00000001", loaiKhoanMuc: "TienPhong", soTien: "1200000.00",  ghiChu: "Phong 101: 600.000 x 2 dem" },
  { maCthd: "CT00000002", maHoaDon: "HD00000001", loaiKhoanMuc: "DichVu",    soTien: "760000.00",   ghiChu: "Buffet, giat ui va minibar" },
  { maCthd: "CT00000003", maHoaDon: "HD00000002", loaiKhoanMuc: "TienPhong", soTien: "2640000.00",  ghiChu: "Phong 102: 880.000 x 3 dem" },
  { maCthd: "CT00000004", maHoaDon: "HD00000002", loaiKhoanMuc: "DichVu",    soTien: "2200000.00",  ghiChu: "Buffet, dua don san bay va spa" },
  { maCthd: "CT00000005", maHoaDon: "HD00000003", loaiKhoanMuc: "TienPhong", soTien: "2000000.00",  ghiChu: "Phong 201: 1.000.000 x 2 dem" },
  { maCthd: "CT00000006", maHoaDon: "HD00000003", loaiKhoanMuc: "DichVu",    soTien: "1100000.00",  ghiChu: "An tai phong va thue xe may" },
  { maCthd: "CT00000007", maHoaDon: "HD00000004", loaiKhoanMuc: "TienPhong", soTien: "2760000.00",  ghiChu: "Phong 202: 1.380.000 x 2 dem" },
  { maCthd: "CT00000008", maHoaDon: "HD00000004", loaiKhoanMuc: "DichVu",    soTien: "2800000.00",  ghiChu: "Phong hoi nghi va giuong phu" },
  { maCthd: "CT00000009", maHoaDon: "HD00000005", loaiKhoanMuc: "TienPhong", soTien: "3000000.00",  ghiChu: "Phong 301: 1.500.000 x 2 dem" },
  { maCthd: "CT00000010", maHoaDon: "HD00000006", loaiKhoanMuc: "TienPhong", soTien: "5520000.00",  ghiChu: "Phong 302: 1.840.000 x 3 dem" },
  { maCthd: "CT00000011", maHoaDon: "HD00000001", loaiKhoanMuc: "PhuThu",    soTien: "100000.00",   ghiChu: "Phu thu nhan phong som" },
  { maCthd: "CT00000012", maHoaDon: "HD00000002", loaiKhoanMuc: "PhuThu",    soTien: "300000.00",   ghiChu: "Phu thu tra phong muon" },
  { maCthd: "CT00000013", maHoaDon: "HD00000001", loaiKhoanMuc: "GiamGia",   soTien: "-100000.00",  ghiChu: "Giam gia khach hang thanh vien" },
  { maCthd: "CT00000014", maHoaDon: "HD00000002", loaiKhoanMuc: "GiamGia",   soTien: "-200000.00",  ghiChu: "Giam gia theo chuong trinh khuyen mai" },
  { maCthd: "CT00000015", maHoaDon: "HD00000001", loaiKhoanMuc: "GiamTru",   soTien: "-600000.00",  ghiChu: "Tru tien coc cua phieu DP00000001" },
  { maCthd: "CT00000016", maHoaDon: "HD00000002", loaiKhoanMuc: "GiamTru",   soTien: "-1320000.00", ghiChu: "Tru tien coc cua phieu DP00000002" },
  { maCthd: "CT00000017", maHoaDon: "HD00000003", loaiKhoanMuc: "GiamTru",   soTien: "-1000000.00", ghiChu: "Tru tien coc cua phieu DP00000003" },
  { maCthd: "CT00000018", maHoaDon: "HD00000004", loaiKhoanMuc: "GiamTru",   soTien: "-1380000.00", ghiChu: "Tru tien coc cua phieu DP00000004" },
  { maCthd: "CT00000019", maHoaDon: "HD00000005", loaiKhoanMuc: "GiamTru",   soTien: "-1500000.00", ghiChu: "Tru tien coc cua phieu DP00000005" },
  { maCthd: "CT00000020", maHoaDon: "HD00000006", loaiKhoanMuc: "GiamTru",   soTien: "-2760000.00", ghiChu: "Tru tien coc cua phieu DP00000006" },
];

// ---- DON THEM CHO DEMO ----
// Moi phieu DangO va HoanTat o phan don them duoc mot hoa don. Tong tien luon
// tinh tu chinh cac dong khoan muc, khong go tay, de rang buoc
// TongTien = SUM(SoTien) khong bao gio lech.
const suDungThem: SuDungDichVu[] = [];
const hoaDonThem: HoaDon[] = [];
const chiTietHoaDonThem: ChiTietHoaDon[] = [];

let soHieuSd = 11;
let soHieuHd = 11;
let soHieuCt = 21;

for (const [i, phieu] of phieuThem.entries()) {
  if (phieu.trangThai !== "DangO" && phieu.trangThai !== "HoanTat") continue;

  const ct = chiTietThem[i];
  const khoanMuc: ChiTietHoaDon[] = [];
  const maHoaDon = ma("HD", soHieuHd++);

  khoanMuc.push({
    maCthd: ma("CT", soHieuCt++),
    maHoaDon,
    loaiKhoanMuc: "TienPhong",
    soTien: ct.thanhTien ?? "0.00",
    ghiChu: `Phong ${PHONG.find((p) => p.maPhong === ct.maPhong)?.soPhong}: ${ct.soDem} dem`,
  });

  // Khach dang o duoc ghi them mot dich vu, de man Dich vu va Hoa don co dong.
  if (phieu.trangThai === "DangO") {
    const dv = DICH_VU[i % DICH_VU.length];
    const soLuong = 1 + (i % 3);
    suDungThem.push({
      maSuDungDv: ma("SD", soHieuSd++),
      maDatPhong: phieu.maDatPhong,
      maDv: dv.maDv,
      ngaySuDung: `${phieu.ngayCheckIn} 08:00:00`,
      soLuong,
      donGiaThoiDiem: dv.giaDv,
      thanhTien: tienDichVu(dv.giaDv, soLuong),
    });
    khoanMuc.push({
      maCthd: ma("CT", soHieuCt++),
      maHoaDon,
      loaiKhoanMuc: "DichVu",
      soTien: tienDichVu(dv.giaDv, soLuong),
      ghiChu: dv.tenDv,
    });
  }

  // Tien coc da thu duoc tru lai, nen la so am (rang buoc
  // CK_CHI_TIET_HOA_DON_SoTienTheoLoai).
  khoanMuc.push({
    maCthd: ma("CT", soHieuCt++),
    maHoaDon,
    loaiKhoanMuc: "GiamTru",
    soTien: `-${phieu.tienCoc}`,
    ghiChu: `Tru tien coc cua phieu ${phieu.maDatPhong}`,
  });

  const daTra = phieu.trangThai === "HoanTat";
  hoaDonThem.push({
    maHoaDon,
    maDatPhong: phieu.maDatPhong,
    ngayLap: `${phieu.ngayCheckOut} 11:00:00`,
    tongTien: congTien(...khoanMuc.map((k) => k.soTien)),
    loaiThanhToan: daTra ? ["TienMat", "ChuyenKhoan", "The"][i % 3] : null,
    trangThai: daTra ? "DaThanhToan" : "ChuaThanhToan",
  });
  chiTietHoaDonThem.push(...khoanMuc);
}

export const SU_DUNG_DICH_VU: SuDungDichVu[] = [...SU_DUNG_GOC, ...suDungThem];
export const HOA_DON: HoaDon[] = [...HOA_DON_GOC, ...hoaDonThem];
export const CHI_TIET_HOA_DON: ChiTietHoaDon[] = [...CHI_TIET_HOA_DON_GOC, ...chiTietHoaDonThem];
