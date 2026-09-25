import * as mock from "@/lib/mock/data";
import { NGAY_HIEN_TAI } from "@/lib/mock/now";
import { congTien } from "@/lib/tinh-toan";

/**
 * Mat tien doc khach hang.
 *
 * Luu y: bang KHACH_HANG chi co MaKH, HoTen, CCCD, SDT, Email. Hai cot
 * "Lan luu tru" va "Tong chi tieu" tren artboard KHONG phai cot trong bang —
 * chung duoc tinh tu PHIEU_DAT_PHONG va HOA_DON, nen kieu tra ve la view-model
 * chu khong phai $inferSelect tran.
 */

export type KhachHangTrenBang = {
  maKh: string;
  hoTen: string;
  cccd: string;
  sdt: string | null;
  email: string | null;
  soLanLuuTru: number;
  tongChiTieu: string;
  dangLuuTru: boolean;
  conNo: boolean;
};

export async function getDanhSachKhachHang(): Promise<KhachHangTrenBang[]> {
  return mock.KHACH_HANG.map((k) => {
    const phieu = mock.PHIEU_DAT_PHONG.filter((p) => p.maKh === k.maKh);
    // Chi tinh la mot lan luu tru khi khach thuc su den o (dang o hoac da xong).
    const daO = phieu.filter((p) => p.trangThai === "HoanTat" || p.trangThai === "DangO");
    const hoaDon = mock.HOA_DON.filter((h) =>
      phieu.some((p) => p.maDatPhong === h.maDatPhong),
    );

    return {
      maKh: k.maKh,
      hoTen: k.hoTen,
      cccd: k.cccd,
      sdt: k.sdt,
      email: k.email,
      soLanLuuTru: daO.length,
      tongChiTieu: congTien(
        ...hoaDon.filter((h) => h.trangThai === "DaThanhToan").map((h) => h.tongTien),
      ),
      dangLuuTru: phieu.some((p) => p.trangThai === "DangO"),
      conNo: hoaDon.some((h) => h.trangThai === "ChuaThanhToan" && Number(h.tongTien) > 0),
    };
  });
}

export async function getThongKeKhachHang() {
  const ds = await getDanhSachKhachHang();
  const thangNay = NGAY_HIEN_TAI.slice(0, 7);

  // Bang KHACH_HANG khong co cot ngay tao ho so, nen "khach moi thang nay" duoc
  // hieu la khach co phieu dat DAU TIEN roi vao thang hien tai.
  const khachMoiThangNay = mock.KHACH_HANG.filter((k) => {
    const lap = mock.PHIEU_DAT_PHONG
      .filter((p) => p.maKh === k.maKh)
      .map((p) => p.ngayLap)
      .sort();
    return lap.length > 0 && lap[0].slice(0, 7) === thangNay;
  }).length;

  const quayLai = ds.filter((k) => k.soLanLuuTru >= 2).length;

  return {
    tongHoSo: ds.length,
    khachMoiThangNay,
    dangLuuTru: ds.filter((k) => k.dangLuuTru).length,
    tyLeQuayLai: ds.length === 0 ? 0 : Math.round((quayLai / ds.length) * 100),
  };
}
