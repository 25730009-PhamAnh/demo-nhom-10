import * as mock from "@/lib/mock/data";
import { NGAY_HIEN_TAI } from "@/lib/mock/now";
import { congTien, soDem } from "@/lib/tinh-toan";

/**
 * Mat tien doc phieu dat phong. Hom nay doc tu du lieu gia; giai doan sau doi
 * than ham sang Drizzle (v_PhieuDatDangHieuLuc) va sp_TraCuuPhongTrong.
 */

export type PhieuTomTat = {
  maDatPhong: string;
  maKh: string;
  hoTenKhach: string;
  cccd: string;
  sdt: string | null;
  ngayCheckIn: string;
  ngayCheckOut: string;
  soDem: number;
  trangThai: string;
  tienCoc: string;
  soPhong: string[];
  tenLoaiPhong: string;
  tongTienPhong: string;
};

/** Noi mot phieu dat voi khach, chi tiet dat phong, phong va loai phong. */
function dungPhieu(p: (typeof mock.PHIEU_DAT_PHONG)[number]): PhieuTomTat {
  const khach = mock.KHACH_HANG.find((k) => k.maKh === p.maKh);
  const chiTiet = mock.CHI_TIET_DAT_PHONG.filter((c) => c.maDatPhong === p.maDatPhong);
  const phong = chiTiet.map((c) => mock.PHONG.find((x) => x.maPhong === c.maPhong));
  const loai = mock.LOAI_PHONG.find((l) => l.maLoaiPhong === phong[0]?.maLoaiPhong);

  return {
    maDatPhong: p.maDatPhong,
    maKh: p.maKh,
    hoTenKhach: khach?.hoTen ?? "—",
    cccd: khach?.cccd ?? "",
    sdt: khach?.sdt ?? null,
    ngayCheckIn: p.ngayCheckIn,
    ngayCheckOut: p.ngayCheckOut,
    soDem: soDem(p.ngayCheckIn, p.ngayCheckOut),
    trangThai: p.trangThai,
    tienCoc: p.tienCoc,
    soPhong: phong.map((x) => x?.soPhong ?? "—"),
    tenLoaiPhong: loai?.tenLoaiPhong ?? "—",
    // thanhTien la cot sinh (generatedAlwaysAs) nen kieu la string | null.
    tongTienPhong: congTien(...chiTiet.map((c) => c.thanhTien ?? "0.00")),
  };
}

export async function getPhieuNhanHomNay(): Promise<PhieuTomTat[]> {
  return mock.PHIEU_DAT_PHONG
    .filter((p) => p.ngayCheckIn === NGAY_HIEN_TAI && p.trangThai === "DaDat")
    .map(dungPhieu);
}

export async function getPhieuTraHomNay(): Promise<PhieuTomTat[]> {
  return mock.PHIEU_DAT_PHONG
    .filter((p) => p.ngayCheckOut === NGAY_HIEN_TAI && p.trangThai === "DangO")
    .map(dungPhieu);
}

export async function getPhieuTheoMa(ma: string): Promise<PhieuTomTat | null> {
  const p = mock.PHIEU_DAT_PHONG.find((x) => x.maDatPhong === ma);
  return p ? dungPhieu(p) : null;
}

export async function getLoaiPhongConTrong(checkIn: string, checkOut: string) {
  // Goi soDem TRUOC de loi ngay sai noi len dung thong bao cua fn_SoDem,
  // thay vi tra ve danh sach rong mot cach am tham.
  soDem(checkIn, checkOut);

  // Vi tu kha dung giong sp_TraCuuPhongTrong: mot phong bi chiem neu thuoc mot
  // phieu chua huy co khoang ngay giao voi [checkIn, checkOut).
  const biChiem = new Set(
    mock.PHIEU_DAT_PHONG
      .filter(
        (p) =>
          p.trangThai !== "DaHuy" &&
          p.ngayCheckIn < checkOut &&
          p.ngayCheckOut > checkIn,
      )
      .flatMap((p) =>
        mock.CHI_TIET_DAT_PHONG
          .filter((c) => c.maDatPhong === p.maDatPhong)
          .map((c) => c.maPhong),
      ),
  );

  return mock.LOAI_PHONG.map((l) => ({
    maLoaiPhong: l.maLoaiPhong,
    tenLoaiPhong: l.tenLoaiPhong,
    donGiaNgay: l.donGiaNgay,
    soPhongTrong: mock.PHONG.filter(
      (p) =>
        p.maLoaiPhong === l.maLoaiPhong &&
        p.trangThai !== "BaoTri" &&
        !biChiem.has(p.maPhong),
    ).length,
  }));
}
