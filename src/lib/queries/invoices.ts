import * as mock from "@/lib/mock/data";
import { soDem } from "@/lib/tinh-toan";

/** Mat tien doc hoa don. Giai doan sau doi sang sp_LapHoaDon / sp_LapChiTietHoaDon. */

export type HoaDonDayDu = {
  maHoaDon: string;
  maDatPhong: string;
  ngayLap: string;
  trangThai: string;
  loaiThanhToan: string | null;
  tongTien: string;
  khach: { hoTen: string; maKh: string; cccd: string; sdt: string | null };
  phieu: {
    ngayCheckIn: string;
    ngayCheckOut: string;
    soDem: number;
    soPhong: string[];
    tenLoaiPhong: string;
  };
  khoanMuc: { loaiKhoanMuc: string; ghiChu: string | null; soTien: string }[];
};

export async function getHoaDon(ma: string): Promise<HoaDonDayDu | null> {
  const hd = mock.HOA_DON.find((h) => h.maHoaDon === ma);
  if (!hd) return null;

  const phieu = mock.PHIEU_DAT_PHONG.find((p) => p.maDatPhong === hd.maDatPhong);
  const khach = mock.KHACH_HANG.find((k) => k.maKh === phieu?.maKh);
  const chiTiet = mock.CHI_TIET_DAT_PHONG.filter((c) => c.maDatPhong === hd.maDatPhong);
  const phong = chiTiet.map((c) => mock.PHONG.find((x) => x.maPhong === c.maPhong));
  const loai = mock.LOAI_PHONG.find((l) => l.maLoaiPhong === phong[0]?.maLoaiPhong);

  return {
    maHoaDon: hd.maHoaDon,
    maDatPhong: hd.maDatPhong,
    ngayLap: hd.ngayLap,
    trangThai: hd.trangThai,
    loaiThanhToan: hd.loaiThanhToan,
    tongTien: hd.tongTien,
    khach: {
      hoTen: khach?.hoTen ?? "—",
      maKh: khach?.maKh ?? "",
      cccd: khach?.cccd ?? "",
      sdt: khach?.sdt ?? null,
    },
    phieu: {
      ngayCheckIn: phieu?.ngayCheckIn ?? "",
      ngayCheckOut: phieu?.ngayCheckOut ?? "",
      soDem: phieu ? soDem(phieu.ngayCheckIn, phieu.ngayCheckOut) : 0,
      soPhong: phong.map((x) => x?.soPhong ?? "—"),
      tenLoaiPhong: loai?.tenLoaiPhong ?? "—",
    },
    khoanMuc: mock.CHI_TIET_HOA_DON
      .filter((c) => c.maHoaDon === hd.maHoaDon)
      .map((c) => ({
        loaiKhoanMuc: c.loaiKhoanMuc,
        ghiChu: c.ghiChu,
        soTien: c.soTien,
      })),
  };
}

/** Danh sach cho trang /invoices (muc "Hoa don" tren thanh dieu huong). */
export async function getDanhSachHoaDon() {
  return mock.HOA_DON
    .map((h) => {
      const phieu = mock.PHIEU_DAT_PHONG.find((p) => p.maDatPhong === h.maDatPhong);
      const khach = mock.KHACH_HANG.find((k) => k.maKh === phieu?.maKh);
      return {
        maHoaDon: h.maHoaDon,
        maDatPhong: h.maDatPhong,
        ngayLap: h.ngayLap,
        tongTien: h.tongTien,
        trangThai: h.trangThai,
        hoTenKhach: khach?.hoTen ?? "—",
      };
    })
    .sort((a, b) => b.ngayLap.localeCompare(a.ngayLap));
}
