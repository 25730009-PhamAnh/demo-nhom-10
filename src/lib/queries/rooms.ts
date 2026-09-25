import * as mock from "@/lib/mock/data";
import { TRANG_THAI_PHONG, nhanTrangThaiPhong } from "@/lib/status";

/**
 * Mat tien doc du lieu phong. Hom nay doc tu du lieu gia; giai doan sau doi
 * than ham sang Drizzle (v_TinhTrangPhongHomNay) ma khong doi chu ky.
 * Vi vay moi ham deu async du hien tai khong cho gi.
 */

export type PhongTrenSoDo = {
  maPhong: string;
  soPhong: string;
  tang: number;
  tenLoaiPhong: string;
  donGiaNgay: string;
  trangThai: string;
};

export async function getSoDoPhong(): Promise<PhongTrenSoDo[]> {
  const loai = new Map(mock.LOAI_PHONG.map((l) => [l.maLoaiPhong, l]));
  return mock.PHONG
    .map((p) => ({
      maPhong: p.maPhong,
      soPhong: p.soPhong,
      tang: p.tang,
      tenLoaiPhong: loai.get(p.maLoaiPhong)?.tenLoaiPhong ?? "—",
      donGiaNgay: loai.get(p.maLoaiPhong)?.donGiaNgay ?? "0.00",
      trangThai: p.trangThai,
    }))
    .sort((a, b) => a.soPhong.localeCompare(b.soPhong));
}

export async function getThongKePhongTheoTrangThai() {
  // Duyet theo TRANG_THAI_PHONG chu khong theo du lieu, de trang thai khong co
  // phong nao van hien mot chip voi so 0 dung nhu artboard.
  return TRANG_THAI_PHONG.map((ma) => ({
    ma,
    nhan: nhanTrangThaiPhong(ma).nhan,
    soLuong: mock.PHONG.filter((p) => p.trangThai === ma).length,
  }));
}

export async function getNhatKyBuongPhong() {
  const soPhong = new Map(mock.PHONG.map((p) => [p.maPhong, p.soPhong]));

  // DON_PHONG va SUA_PHONG cung dung cot ThoiGian; SUA_PHONG co MoTaLoi va
  // ChiPhi (NOT NULL, mac dinh '0.00'), DON_PHONG co GhiChu va khong co chi phi.
  const don = mock.DON_PHONG.map((d) => ({
    ngayGio: d.thoiGian,
    soPhong: soPhong.get(d.maPhong) ?? "—",
    loai: "DonPhong" as const,
    nhanVien: d.maTk,
    ghiChu: d.ghiChu ?? "",
    chiPhi: null as string | null,
  }));
  const sua = mock.SUA_PHONG.map((x) => ({
    ngayGio: x.thoiGian,
    soPhong: soPhong.get(x.maPhong) ?? "—",
    loai: "SuaPhong" as const,
    nhanVien: x.maTk,
    ghiChu: x.moTaLoi ?? "",
    chiPhi: x.chiPhi as string | null,
  }));

  return [...don, ...sua].sort((a, b) => b.ngayGio.localeCompare(a.ngayGio));
}
