import "server-only";

import type { RowDataPacket } from "mysql2";

import { pool } from "@/db";
import { callProcedure } from "@/db/procedures";
import { getPhieuNhanHomNay, getPhieuTraHomNay } from "@/lib/queries/bookings";
import { getNgayHienTai } from "@/lib/queries/ngay";

/**
 * Mat tien so lieu bao cao. Doanh thu lay tu sp_BaoCaoDoanhThu: chi hoa don
 * DaThanhToan, doanh thu thuan = TienPhong + DichVu + PhuThu + GiamGia.
 * GiamTru la tien coc bu tru tren hoa don, KHONG phai giam doanh thu, nen
 * khong co mat o day.
 */

export type DoanhThuThang = {
  thang: string;
  tienPhong: string;
  dichVu: string;
  phuThu: string;
  giamGia: string;
  tong: string;
};

/** Mot dong ket qua cua sp_BaoCaoDoanhThu. */
export type DongDoanhThu = {
  Thang: string;
  SoHoaDon: number;
  TienPhong: string;
  DichVu: string;
  PhuThu: string;
  GiamGia: string;
  DoanhThuThuan: string;
};

/** 12 thang gan nhat tinh den homNay, dang 'YYYY-MM', cu nhat truoc. */
function muoiHaiThang(homNay: string): string[] {
  const [nam, thang] = homNay.split("-").map(Number);
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(nam, thang - 1, 1));
    d.setUTCMonth(d.getUTCMonth() - (11 - i));
    return d.toISOString().slice(0, 7);
  });
}

/**
 * Ghep ket qua sp_BaoCaoDoanhThu vao du 12 thang. Thu tuc chi tra thang CO hoa
 * don, nen thang trong phai tu dien "0.00" de bieu do luon du 12 cot.
 */
export function gopDoanhThu12Thang(homNay: string, dong: DongDoanhThu[]): DoanhThuThang[] {
  const theoThang = new Map(dong.map((d) => [d.Thang, d]));
  return muoiHaiThang(homNay).map((thang) => {
    const d = theoThang.get(thang);
    return {
      thang,
      tienPhong: d?.TienPhong ?? "0.00",
      dichVu: d?.DichVu ?? "0.00",
      phuThu: d?.PhuThu ?? "0.00",
      giamGia: d?.GiamGia ?? "0.00",
      tong: d?.DoanhThuThuan ?? "0.00",
    };
  });
}

export async function getDoanhThuTheoThang(): Promise<DoanhThuThang[]> {
  const homNay = await getNgayHienTai();
  const tuNgay = `${muoiHaiThang(homNay)[0]}-01`;
  const dong = await callProcedure<DongDoanhThu>("sp_BaoCaoDoanhThu", [tuNgay, homNay]);
  return gopDoanhThu12Thang(homNay, dong);
}

export async function getChiSoTongQuan() {
  const homNay = await getNgayHienTai();
  const [nhan, tra, doanhThu, [dem]] = await Promise.all([
    getPhieuNhanHomNay(),
    getPhieuTraHomNay(),
    callProcedure<DongDoanhThu>("sp_BaoCaoDoanhThu", [homNay, homNay]),
    pool.query<RowDataPacket[]>(`
      SELECT (SELECT COUNT(*) FROM PHONG)                                    AS soPhong,
             (SELECT COUNT(*) FROM PHONG WHERE TrangThai = 'DangSuDung')     AS soPhongDangSuDung,
             (SELECT COUNT(DISTINCT MaKH) FROM PHIEU_DAT_PHONG
              WHERE  TrangThai = 'DangO')                                    AS khachLuuTru,
             (SELECT COUNT(*) FROM HOA_DON WHERE TrangThai = 'ChuaThanhToan') AS hoaDonChuaThanhToan`),
  ]);

  const d = dem[0];
  const soPhong = Number(d.soPhong);
  const soPhongDangSuDung = Number(d.soPhongDangSuDung);
  // Hom nay chua co hoa don nao thanh toan thi thu tuc khong tra dong nao.
  const homNayDt = doanhThu[0];

  return {
    congSuat: soPhong === 0 ? 0 : Math.round((soPhongDangSuDung / soPhong) * 100),
    khachLuuTru: Number(d.khachLuuTru),
    doanhThuHomNay: homNayDt?.DoanhThuThuan ?? "0.00",
    soHoaDonHomNay: homNayDt?.SoHoaDon ?? 0,
    soNhanHomNay: nhan.length,
    soTraHomNay: tra.length,
    hoaDonChuaThanhToan: Number(d.hoaDonChuaThanhToan),
    soPhong,
    soPhongDangSuDung,
  };
}
