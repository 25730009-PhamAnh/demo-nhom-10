import { describe, expect, it } from "vitest";
import type { RowDataPacket } from "mysql2";

import { pool } from "@/db";
import { getChiSoTongQuan, getDoanhThuTheoThang, gopDoanhThu12Thang } from "@/lib/queries/reports";
import { congTien } from "@/lib/tinh-toan";

describe("getDoanhThuTheoThang", () => {
  it("du 12 thang tinh den hom nay, cu nhat truoc", async () => {
    const ds = await getDoanhThuTheoThang();
    expect(ds.map((d) => d.thang)).toEqual([
      "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03",
      "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09",
    ]);
  });

  it("so cua thang lay dung tu sp_BaoCaoDoanhThu", async () => {
    const ds = await getDoanhThuTheoThang();
    expect(ds.at(-1)).toEqual({
      thang: "2026-09",
      tienPhong: "51060000.00",
      dichVu: "12630000.00",
      phuThu: "0.00",
      giamGia: "0.00",
      tong: "63690000.00",
    });
    expect(ds.find((d) => d.thang === "2026-01")).toEqual({
      thang: "2026-01",
      tienPhong: "8700000.00",
      dichVu: "5210000.00",
      phuThu: "100000.00",
      giamGia: "-100000.00",
      tong: "13910000.00",
    });
  });

  it("khong tru tien coc: tong = tien phong + dich vu + phu thu + giam gia", async () => {
    // Thang 09 co tien coc bu tru that tren hoa don da thanh toan; neu bi tru
    // vao doanh thu thi tong se nho hon 63.690.000.
    const [r] = await pool.query<RowDataPacket[]>(`
      SELECT SUM(ct.SoTien) AS coc
      FROM   CHI_TIET_HOA_DON ct JOIN HOA_DON hd ON hd.MaHoaDon = ct.MaHoaDon
      WHERE  hd.TrangThai = 'DaThanhToan' AND ct.LoaiKhoanMuc = 'GiamTru'
        AND  DATE_FORMAT(hd.NgayLap, '%Y-%m') = '2026-09'`);
    expect(Number(r[0].coc)).toBeLessThan(0);

    for (const d of await getDoanhThuTheoThang()) {
      expect([d.thang, congTien(d.tienPhong, d.dichVu, d.phuThu, d.giamGia)]).toEqual([d.thang, d.tong]);
      expect(Number(d.tienPhong)).toBeGreaterThanOrEqual(0);
      expect(Number(d.dichVu)).toBeGreaterThanOrEqual(0);
      expect(Number(d.phuThu)).toBeGreaterThanOrEqual(0);
      expect(Number(d.giamGia)).toBeLessThanOrEqual(0);
    }
  });
});

describe("gopDoanhThu12Thang", () => {
  // Review Focus #2
  it("thang khong co hoa don nao van co cot, moi so la '0.00'", () => {
    const ds = gopDoanhThu12Thang("2026-03-05", [
      {
        Thang: "2026-01",
        SoHoaDon: 1,
        TienPhong: "100.00",
        DichVu: "0.00",
        PhuThu: "0.00",
        GiamGia: "0.00",
        DoanhThuThuan: "100.00",
      },
    ]);
    expect(ds).toHaveLength(12);
    expect([ds[0].thang, ds.at(-1)!.thang]).toEqual(["2025-04", "2026-03"]);
    expect(ds.find((d) => d.thang === "2026-01")!.tong).toBe("100.00");
    expect(ds.find((d) => d.thang === "2026-02")).toEqual({
      thang: "2026-02",
      tienPhong: "0.00",
      dichVu: "0.00",
      phuThu: "0.00",
      giamGia: "0.00",
      tong: "0.00",
    });
  });

  it("dem lui qua moc nam, ke ca khi hom nay la ngay 31", () => {
    const ds = gopDoanhThu12Thang("2026-01-31", []);
    expect([ds[0].thang, ds.at(-1)!.thang]).toEqual(["2025-02", "2026-01"]);
  });
});

describe("getChiSoTongQuan", () => {
  it("so lieu cua hom nay, doanh thu la doanh thu thuan (khong phai so con phai thu)", async () => {
    expect(await getChiSoTongQuan()).toEqual({
      congSuat: 24,
      khachLuuTru: 10,
      doanhThuHomNay: "50530000.00",
      soHoaDonHomNay: 10,
      soNhanHomNay: 12,
      soTraHomNay: 9,
      hoaDonChuaThanhToan: 12,
      soPhong: 42,
      soPhongDangSuDung: 10,
    });
  });
});
