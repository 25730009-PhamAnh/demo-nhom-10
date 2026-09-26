import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { datPhong, type DatPhongVao } from "@/lib/thao-tac/dat-phong";
import { dong } from "@/test/csdl";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

beforeEach(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

// Hom nay (CSDL kiem thu) la 23/09/2026.
const PHIEU: DatPhongVao = {
  maKh: "KH00000001",
  maTk: "TK00000002",
  ngayNhan: "2026-09-23",
  ngayTra: "2026-09-25",
  maLoaiPhong: "LP00000002",
};

describe("datPhong", () => {
  it("lap phieu DaDat cho phong trong dau tien, coc mot dem theo gia sp_DatPhong chot", async () => {
    const r = await datPhong(PHIEU);
    expect(r).toEqual({
      ok: true,
      data: { maDatPhong: "DP00000099", soPhong: "102", tienCoc: "880000.00" },
    });

    expect(
      await dong(
        `SELECT pd.TrangThai, pd.TienCoc, pd.MaKH, pd.MaTK, ct.MaPhong, ct.GiaThueThoiDiem, ct.SoDem,
                p.TrangThai AS phong
         FROM PHIEU_DAT_PHONG pd
         JOIN CHI_TIET_DAT_PHONG ct ON ct.MaDatPhong = pd.MaDatPhong
         JOIN PHONG p ON p.MaPhong = ct.MaPhong
         WHERE pd.MaDatPhong = 'DP00000099'`,
      ),
    ).toEqual({
      TrangThai: "DaDat",
      TienCoc: "880000.00",
      MaKH: "KH00000001",
      MaTK: "TK00000002",
      MaPhong: "PH00000002",
      GiaThueThoiDiem: "880000.00",
      SoDem: 2,
      phong: "DaDat",
    });
  });

  it("loai phong da het phong trong thi bao loi, khong ghi phieu nao", async () => {
    // LP00000004 hom nay chi con phong 208. Dat mot lan la het.
    const loai = { ...PHIEU, maLoaiPhong: "LP00000004" };
    expect((await datPhong(loai)).ok).toBe(true);

    expect(await datPhong({ ...loai, maKh: "KH00000002" })).toEqual({
      ok: false,
      loi: "Loại phòng này đã hết phòng trống trong khoảng ngày đã chọn",
    });
    expect(await dong("SELECT COUNT(*) AS n FROM PHIEU_DAT_PHONG")).toEqual({ n: 89 });
  });

  it("ngay nhan da qua thi CSDL tu choi", async () => {
    expect(await datPhong({ ...PHIEU, ngayNhan: "2026-09-22" })).toEqual({
      ok: false,
      loi: "CSDL từ chối: Khong the dat phong cho ngay da qua",
    });
  });

  it("khach hang khong ton tai thi CSDL tu choi", async () => {
    expect(await datPhong({ ...PHIEU, maKh: "KH99999999" })).toEqual({
      ok: false,
      loi: "CSDL từ chối: Khach hang khong ton tai",
    });
  });
});
