import { describe, expect, it } from "vitest";
import type { RowDataPacket } from "mysql2";

import { pool } from "@/db";

/**
 * Kiem 5 thu tuc bao cao (thu tuc 13 - 17 cua 06_Procedures.sql) tren du lieu
 * mau 07, hom nay dong bang 23/09/2026. So mong doi dung nhu khoi chu thich
 * cuoi file 06.
 */

/** CALL mot thu tuc, tra ve result set dau tien. */
async function goi(cau: string): Promise<Record<string, unknown>[]> {
  const [kq] = await pool.query<RowDataPacket[][]>(cau);
  return kq[0].map((r) => ({ ...r }));
}

const LOI_KY = "Tu ngay phai nho hon hoac bang den ngay";

describe("sp_BaoCaoDoanhThu", () => {
  it("toan bo: du 12 thang, thang 09/2026 = 63.690.000", async () => {
    const ds = await goi("CALL sp_BaoCaoDoanhThu(NULL, NULL)");
    expect(ds.map((d) => d.Thang)).toEqual([
      "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03",
      "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09",
    ]);
    expect(ds.at(-1)).toEqual({
      Thang: "2026-09", SoHoaDon: 14, TienPhong: "51060000.00", DichVu: "12630000.00",
      PhuThu: "0.00", GiamGia: "0.00", DoanhThuThuan: "63690000.00",
    });
  });

  it("thang co phu thu va giam gia (01/2026) cong ca hai vao doanh thu thuan", async () => {
    const ds = await goi("CALL sp_BaoCaoDoanhThu('2026-01-01', '2026-01-31')");
    expect(ds).toEqual([{
      Thang: "2026-01", SoHoaDon: 5, TienPhong: "8700000.00", DichVu: "5210000.00",
      PhuThu: "100000.00", GiamGia: "-100000.00", DoanhThuThuan: "13910000.00",
    }]);
  });

  it("DenNgay tinh tron ngay: hoa don lap 11:15 hom nay van duoc tinh", async () => {
    const ds = await goi("CALL sp_BaoCaoDoanhThu('2026-09-23', '2026-09-23')");
    expect(ds).toEqual([{
      Thang: "2026-09", SoHoaDon: 10, TienPhong: "43100000.00", DichVu: "7430000.00",
      PhuThu: "0.00", GiamGia: "0.00", DoanhThuThuan: "50530000.00",
    }]);
  });

  it("bao loi khi TuNgay > DenNgay", async () => {
    await expect(goi("CALL sp_BaoCaoDoanhThu('2026-09-30', '2026-09-01')")).rejects.toThrow(LOI_KY);
  });
});

describe("sp_BaoCaoCongSuat", () => {
  it("thang 09/2026: 56 / 1260 dem, cong suat 4,44%", async () => {
    expect(await goi("CALL sp_BaoCaoCongSuat('2026-09-01', '2026-09-30')")).toEqual([{
      Thang: "2026-09", SoNgay: 30, DemKhaDung: 1260, DemBan: "56", CongSuatPhanTram: "4.44",
      DoanhThuPhong: "114230000.00", ADR: "2039821.43", RevPAR: "90658.73",
    }]);
  });

  it("phieu vat qua hai thang tach dung dem va tien ve tung thang", async () => {
    const conn = await pool.getConnection();
    try {
      const cau = "CALL sp_BaoCaoCongSuat('2026-01-01', '2026-02-28')";
      const [truocKq] = await conn.query<RowDataPacket[][]>(cau);
      const truoc = truocKq[0];

      await conn.beginTransaction();
      // Phieu thu: 30/01 -> 02/02, 3 dem x 6.000.000 tren phong PRES-01.
      await conn.query(`INSERT INTO PHIEU_DAT_PHONG
          (MaDatPhong, MaKH, MaTK, NgayLap, NgayCheckIn, NgayCheckOut, TienCoc, TrangThai)
        VALUES ('DPTEST0001', 'KH00000001', 'TK00000002', '2026-01-20 09:00:00',
                '2026-01-30', '2026-02-02', 0, 'HoanTat')`);
      await conn.query(`INSERT INTO CHI_TIET_DAT_PHONG (MaDatPhong, MaPhong, GiaThueThoiDiem, SoDem)
        VALUES ('DPTEST0001', 'PH00000010', 6000000.00, 3)`);
      const [sauKq] = await conn.query<RowDataPacket[][]>(cau);
      const sau = sauKq[0];
      await conn.rollback();

      const tang = (i: number, cot: string) => Number(sau[i][cot]) - Number(truoc[i][cot]);
      expect([truoc[0].Thang, truoc[1].Thang]).toEqual(["2026-01", "2026-02"]);
      expect([tang(0, "DemBan"), tang(1, "DemBan")]).toEqual([2, 1]);
      expect([tang(0, "DoanhThuPhong"), tang(1, "DoanhThuPhong")]).toEqual([12_000_000, 6_000_000]);

      const [con] = await conn.query<RowDataPacket[]>(
        "SELECT COUNT(*) AS n FROM PHIEU_DAT_PHONG WHERE MaDatPhong = 'DPTEST0001'",
      );
      expect(con[0].n).toBe(0);
    } finally {
      conn.release();
    }
  });

  it("bao loi khi TuNgay > DenNgay", async () => {
    await expect(goi("CALL sp_BaoCaoCongSuat('2026-09-30', '2026-09-01')")).rejects.toThrow(LOI_KY);
  });
});

describe("sp_BaoCaoKhachHang", () => {
  it("toan bo: 54 khach co luu tru, 18 khach quay lai, chi tieu cao nhat KH00000040", async () => {
    const ds = await goi("CALL sp_BaoCaoKhachHang(NULL, NULL)");
    expect(ds).toHaveLength(54);
    expect(ds.filter((k) => k.KhachQuayLai === 1)).toHaveLength(18);
    expect(ds[0]).toEqual({
      MaKH: "KH00000040", HoTen: "Ho Hai Dung", SoLanLuuTru: 2, TongSoDem: "4",
      TongChiTieu: "18500000.00", ChiTieuTBMoiLan: "9250000.00", LanGanNhat: "2026-09-21",
      KhachQuayLai: 1,
    });
  });

  it("khach dang o chua thanh toan thi chi tieu 0", async () => {
    const ds = await goi("CALL sp_BaoCaoKhachHang(NULL, NULL)");
    expect(ds.find((k) => k.MaKH === "KH00000006")?.TongChiTieu).toBe("0.00");
  });

  it("bao loi khi TuNgay > DenNgay", async () => {
    await expect(goi("CALL sp_BaoCaoKhachHang('2026-09-30', '2026-09-01')")).rejects.toThrow(LOI_KY);
  });
});

describe("sp_BaoCaoBuongPhong", () => {
  it("toan bo: du 42 phong, PRES-01 chi phi sua cao nhat", async () => {
    const ds = await goi("CALL sp_BaoCaoBuongPhong(NULL, NULL)");
    expect(ds).toHaveLength(42);
    expect(ds[0]).toMatchObject({ SoPhong: "PRES-01", TongChiPhiSua: "1500000.00" });
  });

  it("ky khong phat sinh gi van du 42 phong, moi so bang 0", async () => {
    const ds = await goi("CALL sp_BaoCaoBuongPhong('2030-01-01', '2030-01-31')");
    expect(ds).toHaveLength(42);
    expect(ds.every((p) => p.SoLanDon === 0 && p.SoLanSua === 0 && p.TongChiPhiSua === "0.00")).toBe(true);
  });

  it("DenNgay tinh tron ngay: lan don 12:00 hom nay cua phong 301 van duoc dem", async () => {
    const ds = await goi("CALL sp_BaoCaoBuongPhong('2026-09-23', '2026-09-23')");
    expect(ds.find((p) => p.SoPhong === "301")?.SoLanDon).toBe(1);
  });

  it("bao loi khi TuNgay > DenNgay", async () => {
    await expect(goi("CALL sp_BaoCaoBuongPhong('2026-09-30', '2026-09-01')")).rejects.toThrow(LOI_KY);
  });
});

describe("sp_BaoCaoCongNo", () => {
  it("10 hoa don con phai thu: HD00000006 ton lau nhat, roi 9 hoa don nhap sang nay", async () => {
    const ds = await goi("CALL sp_BaoCaoCongNo(NULL, CURDATE())");
    expect(ds.map((d) => d.MaHoaDon)).toEqual([
      "HD00000006", "HD00000023", "HD00000024", "HD00000025", "HD00000026",
      "HD00000027", "HD00000028", "HD00000029", "HD00000030", "HD00000031",
    ]);
    expect(ds[0]).toMatchObject({ ConPhaiThu: "2760000.00", TienCocDaTru: "2760000.00", SoNgayTon: 1 });
  });

  it("hoa don lap sau DenNgay khong xuat hien", async () => {
    expect(await goi("CALL sp_BaoCaoCongNo(NULL, '2026-09-21')")).toEqual([]);
  });

  it("DenNgay tinh tron ngay: hoa don lap 14:00 ngay 22/09 co mat, ton 0 ngay", async () => {
    const ds = await goi("CALL sp_BaoCaoCongNo(NULL, '2026-09-22')");
    expect(ds.map((d) => [d.MaHoaDon, d.SoNgayTon])).toEqual([["HD00000006", 0]]);
  });

  it("bao loi khi TuNgay > DenNgay", async () => {
    await expect(goi("CALL sp_BaoCaoCongNo('2026-09-30', '2026-09-01')")).rejects.toThrow(LOI_KY);
  });
});
