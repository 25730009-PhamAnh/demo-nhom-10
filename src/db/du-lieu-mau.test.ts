import { describe, expect, it } from "vitest";
import type { RowDataPacket } from "mysql2";

import { pool } from "@/db";

/** Chay mot cau SELECT tra ve dung mot con so. */
async function dem(cau: string): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(cau);
  return Number(Object.values(rows[0])[0]);
}

/**
 * Kiem du lieu mau Scripts/setup_database/07_Sample_Data.sql tren CSDL kiem
 * thu (hom nay dong bang 23/09/2026). Day la dieu kien de 9 man hinh co du
 * lieu ngay nao mo demo cung vay (spec phase 1 muc 3).
 */
describe("du lieu mau 07", () => {
  it("co 42 phong, 60 khach, 88 phieu dat, 76 hoa don", async () => {
    expect(await dem("SELECT COUNT(*) FROM PHONG")).toBe(42);
    expect(await dem("SELECT COUNT(*) FROM KHACH_HANG")).toBe(60);
    expect(await dem("SELECT COUNT(*) FROM PHIEU_DAT_PHONG")).toBe(88);
    expect(await dem("SELECT COUNT(*) FROM HOA_DON")).toBe(76);
  });

  it("hom nay co 12 luot nhan va 9 luot tra phong", async () => {
    expect(
      await dem("SELECT COUNT(*) FROM PHIEU_DAT_PHONG WHERE TrangThai = 'DaDat' AND NgayCheckIn = CURDATE()"),
    ).toBe(12);
    expect(
      await dem("SELECT COUNT(*) FROM PHIEU_DAT_PHONG WHERE TrangThai = 'DangO' AND NgayCheckOut = CURDATE()"),
    ).toBe(9);
  });

  it("10 dong goc dich theo moc 16/09: DP00000006 nhan phong hom qua, con o", async () => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT NgayCheckIn, NgayCheckOut, TrangThai FROM PHIEU_DAT_PHONG WHERE MaDatPhong = 'DP00000006'",
    );
    expect({ ...rows[0] }).toEqual({
      NgayCheckIn: "2026-09-22",
      NgayCheckOut: "2026-09-25",
      TrangThai: "DangO",
    });
  });

  it("dem phong theo trang thai", async () => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT TrangThai, COUNT(*) AS n FROM PHONG GROUP BY TrangThai ORDER BY TrangThai",
    );
    expect(rows.map((r) => [r.TrangThai, r.n])).toEqual([
      ["BaoTri", 2],
      ["DaDat", 15],
      ["DangDon", 10],
      ["DangSuDung", 10],
      ["Trong", 5],
    ]);
  });

  it("trang thai phong khop voi phieu, de nut nhan / tra phong o phase 2 chay duoc", async () => {
    const lech = (dieuKien: string) =>
      dem(`SELECT COUNT(*) FROM PHIEU_DAT_PHONG pd
           JOIN CHI_TIET_DAT_PHONG ct ON ct.MaDatPhong = pd.MaDatPhong
           JOIN PHONG p ON p.MaPhong = ct.MaPhong
           WHERE ${dieuKien}`);
    expect(await lech("pd.TrangThai = 'DangO' AND p.TrangThai <> 'DangSuDung'")).toBe(0);
    expect(
      await lech("pd.TrangThai = 'DaDat' AND pd.NgayCheckIn = CURDATE() AND p.TrangThai <> 'DaDat'"),
    ).toBe(0);
  });

  it("khong co hai phieu chua huy nao giu cung mot phong trong khoang ngay giao nhau", async () => {
    expect(
      await dem(`SELECT COUNT(*) FROM CHI_TIET_DAT_PHONG a
                 JOIN PHIEU_DAT_PHONG pa ON pa.MaDatPhong = a.MaDatPhong
                 JOIN CHI_TIET_DAT_PHONG b ON b.MaPhong = a.MaPhong AND b.MaDatPhong < a.MaDatPhong
                 JOIN PHIEU_DAT_PHONG pb ON pb.MaDatPhong = b.MaDatPhong
                 WHERE pa.TrangThai <> 'DaHuy' AND pb.TrangThai <> 'DaHuy'
                   AND pa.NgayCheckIn < pb.NgayCheckOut AND pb.NgayCheckIn < pa.NgayCheckOut`),
    ).toBe(0);
  });

  it("khong phieu HoanTat nao tra phong sau hom nay, khong phieu DaDat nao qua han", async () => {
    expect(
      await dem("SELECT COUNT(*) FROM PHIEU_DAT_PHONG WHERE TrangThai = 'HoanTat' AND NgayCheckOut > CURDATE()"),
    ).toBe(0);
    expect(
      await dem("SELECT COUNT(*) FROM PHIEU_DAT_PHONG WHERE TrangThai = 'DaDat' AND NgayCheckIn < CURDATE()"),
    ).toBe(0);
  });

  it("TongTien moi hoa don bang tong khoan muc", async () => {
    expect(
      await dem(`SELECT COUNT(*) FROM (
                   SELECT hd.MaHoaDon FROM HOA_DON hd
                   JOIN CHI_TIET_HOA_DON ct ON ct.MaHoaDon = hd.MaHoaDon
                   GROUP BY hd.MaHoaDon, hd.TongTien
                   HAVING GREATEST(SUM(ct.SoTien), 0) <> hd.TongTien) x`),
    ).toBe(0);
  });

  it("12 thang gan nhat thang nao cung co hoa don da thanh toan", async () => {
    expect(
      await dem(`SELECT COUNT(DISTINCT DATE_FORMAT(NgayLap, '%Y-%m')) FROM HOA_DON
                 WHERE TrangThai = 'DaThanhToan'
                   AND NgayLap >= DATE_FORMAT(CURDATE() - INTERVAL 11 MONTH, '%Y-%m-01')`),
    ).toBe(12);
  });
});
