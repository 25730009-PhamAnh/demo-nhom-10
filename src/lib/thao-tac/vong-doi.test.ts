import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getChiSoTongQuan } from "@/lib/queries/reports";
import { getThongKePhongTheoTrangThai } from "@/lib/queries/rooms";
import { ghiDonPhong } from "@/lib/thao-tac/buong-phong";
import { datPhong } from "@/lib/thao-tac/dat-phong";
import { ghiDichVu } from "@/lib/thao-tac/dich-vu";
import { thanhToan } from "@/lib/thao-tac/hoa-don";
import { lapHoaDon, nhanPhong, thuThemCoc, traPhong } from "@/lib/thao-tac/le-tan";
import { dong, trangThai } from "@/test/csdl";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

// Mot phieu di tron vong doi, dung thu tu spec phase 2 muc 1: cac buoc noi
// tiep nhau nen dung chung mot lan nap du lieu, chay theo thu tu khai bao.
beforeAll(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

const LE_TAN = "TK00000002";
const soPhong = async (ma: string) =>
  (await getThongKePhongTheoTrangThai()).find((t) => t.ma === ma)!.soLuong;

describe("vong doi mot phieu dat phong", () => {
  let maDatPhong = "";
  let maHoaDon = "";

  it("1. dat phong nhan hom nay: phieu DaDat, phong 101 DaDat, coc mot dem", async () => {
    const r = await datPhong({
      maKh: "KH00000001",
      maTk: LE_TAN,
      ngayNhan: "2026-09-23",
      ngayTra: "2026-09-25",
      maLoaiPhong: "LP00000001",
    });
    if (!r.ok) throw new Error(r.loi);
    maDatPhong = r.data.maDatPhong;
    expect(r.data).toEqual({ maDatPhong: "DP00000099", soPhong: "101", tienCoc: "600000.00" });
    expect(await trangThai(maDatPhong)).toEqual({ phieu: "DaDat", phong: "DaDat", hoaDon: null });
    expect(await soPhong("DaDat")).toBe(16);
  });

  it("2. thu them coc: tong coc 900.000", async () => {
    expect(await thuThemCoc(maDatPhong, "300000")).toEqual({ ok: true, data: { tienCoc: "900000.00" } });
  });

  it("3. nhan phong: phieu DangO, phong DangSuDung, cong suat tang", async () => {
    expect(await nhanPhong(maDatPhong, LE_TAN)).toEqual({ ok: true, data: null });
    expect(await trangThai(maDatPhong)).toEqual({ phieu: "DangO", phong: "DangSuDung", hoaDon: null });
    expect((await getChiSoTongQuan()).soPhongDangSuDung).toBe(11);
  });

  it("4. ghi dich vu: 2 suat buffet sang", async () => {
    expect(await ghiDichVu(maDatPhong, "DV00000002", 2)).toMatchObject({ ok: true });
  });

  it("5. lap hoa don: tien phong + dich vu - coc", async () => {
    const r = await lapHoaDon(maDatPhong);
    if (!r.ok) throw new Error(r.loi);
    maHoaDon = r.data.maHoaDon;
    // 1.200.000 + 500.000 - 900.000
    expect(await dong("SELECT TrangThai, TongTien FROM HOA_DON WHERE MaHoaDon = ?", [maHoaDon])).toEqual({
      TrangThai: "ChuaThanhToan",
      TongTien: "800000.00",
    });
  });

  it("6. thanh toan: doanh thu hom nay tang dung tien phong + dich vu", async () => {
    const truoc = await getChiSoTongQuan();
    expect(await thanhToan(maHoaDon, "TienMat")).toEqual({ ok: true, data: null });
    const sau = await getChiSoTongQuan();
    expect(sau.soHoaDonHomNay).toBe(truoc.soHoaDonHomNay + 1);
    expect(Number(sau.doanhThuHomNay) - Number(truoc.doanhThuHomNay)).toBe(1_700_000);
  });

  it("7. tra phong: phieu HoanTat, phong cho don", async () => {
    expect(await traPhong(maDatPhong)).toEqual({ ok: true, data: null });
    expect(await trangThai(maDatPhong)).toEqual({ phieu: "HoanTat", phong: "DangDon", hoaDon: "DaThanhToan" });
    expect(await soPhong("DangDon")).toBe(11);
  });

  it("8. ghi nhan don phong: phong 101 ve Trong", async () => {
    expect(await ghiDonPhong("PH00000001", "TK00000004", "")).toEqual({ ok: true, data: null });
    expect(await trangThai(maDatPhong)).toMatchObject({ phong: "Trong" });
    expect(await soPhong("Trong")).toBe(5);
  });
});
