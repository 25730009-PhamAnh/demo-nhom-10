import { describe, expect, it } from "vitest";
import type { RowDataPacket } from "mysql2";

import { pool } from "@/db";
import { getDanhSachKhachHang, getThongKeKhachHang } from "@/lib/queries/customers";

describe("getDanhSachKhachHang", () => {
  it("du 60 khach theo ma, so lan luu tru va chi tieu tinh tu bang khac", async () => {
    const ds = await getDanhSachKhachHang();
    expect(ds).toHaveLength(60);
    expect(ds[0]).toEqual({
      maKh: "KH00000001",
      hoTen: "Nguyen Hoang Long",
      cccd: "079201000001",
      sdt: "0901234501",
      email: "long.nguyen@example.com",
      soLanLuuTru: 1,
      tongChiTieu: "1960000.00",
      dangLuuTru: false,
      conNo: false,
    });
  });

  it("khach dang o, hoa don chua thanh toan: chi tieu 0.00, dang luu tru, con no", async () => {
    const k = (await getDanhSachKhachHang()).find((x) => x.maKh === "KH00000006");
    expect(k).toMatchObject({ soLanLuuTru: 1, tongChiTieu: "0.00", dangLuuTru: true, conNo: true });
  });

  it("khach moi dat, chua o lan nao: so lan 0 va chi tieu 0.00", async () => {
    const k = (await getDanhSachKhachHang()).find((x) => x.maKh === "KH00000007");
    expect(k).toMatchObject({ soLanLuuTru: 0, tongChiTieu: "0.00", dangLuuTru: false });
  });

  it("so lan luu tru va chi tieu khop voi sp_BaoCaoKhachHang cho moi khach", async () => {
    const ds = await getDanhSachKhachHang();
    const [kq] = await pool.query<RowDataPacket[][]>("CALL sp_BaoCaoKhachHang(NULL, NULL)");
    const baoCao = new Map(kq[0].map((r) => [r.MaKH as string, r]));
    for (const k of ds) {
      const r = baoCao.get(k.maKh);
      expect([k.maKh, k.soLanLuuTru, k.tongChiTieu]).toEqual([
        k.maKh,
        r ? r.SoLanLuuTru : 0,
        r ? r.TongChiTieu : "0.00",
      ]);
    }
  });
});

describe("getThongKeKhachHang", () => {
  it("tong ho so, khach moi thang nay, dang luu tru va ty le quay lai", async () => {
    expect(await getThongKeKhachHang()).toEqual({
      tongHoSo: 60,
      khachMoiThangNay: 8,
      dangLuuTru: 10,
      tyLeQuayLai: 30,
    });
  });
});
