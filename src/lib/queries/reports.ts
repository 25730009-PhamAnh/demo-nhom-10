import * as mock from "@/lib/mock/data";
import { NGAY_HIEN_TAI } from "@/lib/mock/now";
import { congTien } from "@/lib/tinh-toan";
import { getPhieuNhanHomNay, getPhieuTraHomNay } from "@/lib/queries/bookings";

/** Mat tien tong hop so lieu bao cao. Giai doan sau gom bang SQL GROUP BY. */

/** 12 thang gan nhat tinh den NGAY_HIEN_TAI, dang 'YYYY-MM', cu nhat truoc. */
function muoiHaiThang(): string[] {
  const [nam, thang] = NGAY_HIEN_TAI.split("-").map(Number);
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(nam, thang - 1, 1));
    d.setUTCMonth(d.getUTCMonth() - (11 - i));
    return d.toISOString().slice(0, 7);
  });
}

export async function getDoanhThuTheoThang() {
  // Hoa don da huy khong tinh vao doanh thu.
  const hoaDon = mock.HOA_DON.filter((h) => h.trangThai !== "DaHuy");

  return muoiHaiThang().map((thang) => {
    const trongThang = hoaDon.filter((h) => h.ngayLap.slice(0, 7) === thang);
    const khoanMuc = mock.CHI_TIET_HOA_DON.filter((c) =>
      trongThang.some((h) => h.maHoaDon === c.maHoaDon),
    );
    const gom = (loai: string) =>
      congTien(...khoanMuc.filter((c) => c.loaiKhoanMuc === loai).map((c) => c.soTien));

    const tienPhong = gom("TienPhong");
    const dichVu = gom("DichVu");

    // Tach khoan DUONG va khoan AM ra rieng thay vi gop chung. Gop chung thi
    // cot thu ba luon am (GiamTru lon hon PhuThu), bieu do khong ve duoc no, va
    // chieu cao cot khong con phan anh dung tong.
    const conLai = khoanMuc.filter(
      (c) => c.loaiKhoanMuc !== "TienPhong" && c.loaiKhoanMuc !== "DichVu",
    );
    const phuThu = congTien(
      ...conLai.filter((c) => Number(c.soTien) > 0).map((c) => c.soTien),
    );
    const giamTru = congTien(
      ...conLai.filter((c) => Number(c.soTien) < 0).map((c) => c.soTien),
    );

    return {
      thang,
      tienPhong,
      dichVu,
      phuThu,
      giamTru,
      tong: congTien(tienPhong, dichVu, phuThu, giamTru),
    };
  });
}

export async function getChiSoTongQuan() {
  const [nhan, tra] = await Promise.all([getPhieuNhanHomNay(), getPhieuTraHomNay()]);

  const dangSuDung = mock.PHONG.filter((p) => p.trangThai === "DangSuDung").length;
  const dangO = mock.PHIEU_DAT_PHONG.filter((p) => p.trangThai === "DangO");

  return {
    congSuat:
      mock.PHONG.length === 0
        ? 0
        : Math.round((dangSuDung / mock.PHONG.length) * 100),
    khachLuuTru: new Set(dangO.map((p) => p.maKh)).size,
    doanhThuHomNay: congTien(
      ...mock.HOA_DON
        .filter(
          (h) => h.trangThai === "DaThanhToan" && h.ngayLap.slice(0, 10) === NGAY_HIEN_TAI,
        )
        .map((h) => h.tongTien),
    ),
    soHoaDonHomNay: mock.HOA_DON.filter(
      (h) => h.trangThai === "DaThanhToan" && h.ngayLap.slice(0, 10) === NGAY_HIEN_TAI,
    ).length,
    soNhanHomNay: nhan.length,
    soTraHomNay: tra.length,
    hoaDonChuaThanhToan: mock.HOA_DON.filter((h) => h.trangThai === "ChuaThanhToan").length,
    soPhong: mock.PHONG.length,
    soPhongDangSuDung: dangSuDung,
  };
}
