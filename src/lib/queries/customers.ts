import "server-only";

import { asc, desc, like, or, sql } from "drizzle-orm";
import type { RowDataPacket } from "mysql2";

import { db, pool } from "@/db";
import * as schema from "@/db/schema";

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

const kh = schema.khachHang;

// Chi tinh la mot lan luu tru khi khach thuc su den o (dang o hoac da xong).
// Dung chung cho bang khach hang va o tim khach cua form dat phong.
const SO_LAN_LUU_TRU = sql<number>`(
  SELECT COUNT(*) FROM PHIEU_DAT_PHONG p
  WHERE  p.MaKH = KHACH_HANG.MaKH AND p.TrangThai IN ('DangO', 'HoanTat'))`.mapWith(Number);

// Cac subquery duoi day tuong quan voi dong KHACH_HANG dang doc, nen phai viet
// ro KHACH_HANG.MaKH: trong select mot bang, Drizzle in ${kh.maKh} thanh `MaKH`
// khong kem ten bang, va `p.MaKH = MaKH` thanh so sanh cot voi chinh no.

export async function getDanhSachKhachHang(): Promise<KhachHangTrenBang[]> {
  return db
    .select({
      maKh: kh.maKh,
      hoTen: kh.hoTen,
      cccd: kh.cccd,
      sdt: kh.sdt,
      email: kh.email,
      soLanLuuTru: SO_LAN_LUU_TRU,
      // Cung quy tac voi sp_BaoCaoKhachHang: hoa don da thanh toan, cong
      // TienPhong + DichVu + PhuThu + GiamGia. GiamTru la tien coc bu tru,
      // khong phai chi tieu bot di, nen khong cong.
      tongChiTieu: sql<string>`(
        SELECT COALESCE(SUM(ct.SoTien), 0)
        FROM   PHIEU_DAT_PHONG  p
        JOIN   HOA_DON          hd ON hd.MaDatPhong = p.MaDatPhong
                                  AND hd.TrangThai  = 'DaThanhToan'
        JOIN   CHI_TIET_HOA_DON ct ON ct.MaHoaDon   = hd.MaHoaDon
                                  AND ct.LoaiKhoanMuc IN ('TienPhong', 'DichVu', 'PhuThu', 'GiamGia')
        WHERE  p.MaKH = KHACH_HANG.MaKH)`,
      dangLuuTru: sql<boolean>`EXISTS (
        SELECT 1 FROM PHIEU_DAT_PHONG p
        WHERE  p.MaKH = KHACH_HANG.MaKH AND p.TrangThai = 'DangO')`.mapWith(Boolean),
      conNo: sql<boolean>`EXISTS (
        SELECT 1 FROM PHIEU_DAT_PHONG p
        JOIN   HOA_DON hd ON hd.MaDatPhong = p.MaDatPhong
        WHERE  p.MaKH = KHACH_HANG.MaKH AND hd.TrangThai = 'ChuaThanhToan' AND hd.TongTien > 0)`.mapWith(Boolean),
    })
    .from(kh)
    .orderBy(asc(kh.maKh));
}

export async function getThongKeKhachHang() {
  // Bang KHACH_HANG khong co cot ngay tao ho so, nen "khach moi thang nay" duoc
  // hieu la khach co phieu dat DAU TIEN roi vao thang cua CURDATE().
  const [ds, [moi]] = await Promise.all([
    getDanhSachKhachHang(),
    pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) AS n
      FROM   (SELECT MaKH, MIN(NgayLap) AS LanDau FROM PHIEU_DAT_PHONG GROUP BY MaKH) x
      WHERE  DATE_FORMAT(x.LanDau, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')`),
  ]);

  const quayLai = ds.filter((k) => k.soLanLuuTru >= 2).length;

  return {
    tongHoSo: ds.length,
    khachMoiThangNay: Number(moi[0].n),
    dangLuuTru: ds.filter((k) => k.dangLuuTru).length,
    tyLeQuayLai: ds.length === 0 ? 0 : Math.round((quayLai / ds.length) * 100),
  };
}

export type KhachTimThay = {
  maKh: string;
  hoTen: string;
  cccd: string;
  sdt: string | null;
  email: string | null;
  soLanLuuTru: number;
};

/** Boc %...% sau khi escape ky tu dac biet cua LIKE (\ % _), de go "%" khong ra ca bang. */
function chuaChuoi(s: string): string {
  return `%${s.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/**
 * O tim khach cua form dat phong: toi da 10 khach khop ho ten, ma khach, SDT
 * hoac CCCD. Ho ten so bang utf8mb4_0900_ai_ci vi collation cua cot
 * (utf8mb4_unicode_ci) coi "e" = "e" nhung KHONG coi "Đ" = "D", nen go "Đặng"
 * khong ra "Dang". SDT / CCCD so voi tu khoa da bo khoang trang, dau cham,
 * gach ngang; trung khit xep dau. Tu khoa rong: 10 khach moi nhat.
 */
export async function timKhachHang(q: string): Promise<KhachTimThay[]> {
  const tu = q.trim();
  const so = tu.replace(/[\s.-]/g, "");
  const chon = db
    .select({
      maKh: kh.maKh,
      hoTen: kh.hoTen,
      cccd: kh.cccd,
      sdt: kh.sdt,
      email: kh.email,
      soLanLuuTru: SO_LAN_LUU_TRU,
    })
    .from(kh);

  if (tu === "") return chon.orderBy(desc(kh.maKh)).limit(10);

  const dieuKien = [
    sql`${kh.hoTen} COLLATE utf8mb4_0900_ai_ci LIKE ${chuaChuoi(tu)}`,
    like(kh.maKh, chuaChuoi(tu)),
  ];
  // Tu khoa chi toan dau cham / gach thi `so` rong: bo qua, khong thi LIKE '%%' ra ca bang.
  if (so !== "") dieuKien.push(like(kh.cccd, chuaChuoi(so)), like(kh.sdt, chuaChuoi(so)));

  return chon
    .where(or(...dieuKien))
    .orderBy(sql`(${kh.cccd} = ${so} OR ${kh.sdt} = ${so}) DESC`, asc(kh.hoTen), asc(kh.maKh))
    .limit(10);
}
