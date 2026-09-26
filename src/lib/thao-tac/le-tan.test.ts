import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { thanhToan } from "@/lib/thao-tac/hoa-don";
import { huyPhieu, lapHoaDon, nhanPhong, thuThemCoc, traPhong } from "@/lib/thao-tac/le-tan";
import { dong, trangThai } from "@/test/csdl";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

beforeEach(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

const LE_TAN = "TK00000002";

describe("nhanPhong", () => {
  it("phieu nhan hom nay (phong DaDat nhu sp_DatPhong de lai): phieu DangO, phong DangSuDung", async () => {
    expect(await nhanPhong("DP00000011", LE_TAN)).toEqual({ ok: true, data: null });
    expect(await trangThai("DP00000011")).toEqual({ phieu: "DangO", phong: "DangSuDung", hoaDon: null });
  });

  // Review Focus: bam hai lan, hoac tab khac da nhan phong truoc.
  it("goi lan thu hai cho cung phieu thi CSDL tu choi, khong ghi gi them", async () => {
    await nhanPhong("DP00000011", LE_TAN);
    expect(await nhanPhong("DP00000011", LE_TAN)).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phieu dat phong phai o trang thai DaDat moi duoc nhan phong!",
    });
    expect(await trangThai("DP00000011")).toEqual({ phieu: "DangO", phong: "DangSuDung", hoaDon: null });
  });

  it("phieu dang o thi CSDL tu choi, khong doi gi", async () => {
    expect(await nhanPhong("DP00000006", LE_TAN)).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phieu dat phong phai o trang thai DaDat moi duoc nhan phong!",
    });
    expect(await trangThai("DP00000006")).toEqual({
      phieu: "DangO",
      phong: "DangSuDung",
      hoaDon: "ChuaThanhToan",
    });
  });
});

describe("thuThemCoc", () => {
  it("cong don vao tien coc cua phieu", async () => {
    // DP00000011: coc 600.000, tien phong 1.200.000.
    expect(await thuThemCoc("DP00000011", "400000")).toEqual({ ok: true, data: { tienCoc: "1000000.00" } });
    expect(await dong("SELECT TienCoc FROM PHIEU_DAT_PHONG WHERE MaDatPhong = 'DP00000011'")).toEqual({
      TienCoc: "1000000.00",
    });
  });

  it("tong coc vuot tien phong thi CSDL tu choi, coc giu nguyen", async () => {
    expect(await thuThemCoc("DP00000011", "600000.01")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Tong tien coc (1200000.01) vuot tong tien phong (1200000.00)",
    });
    expect(await dong("SELECT TienCoc FROM PHIEU_DAT_PHONG WHERE MaDatPhong = 'DP00000011'")).toEqual({
      TienCoc: "600000.00",
    });
  });
});

describe("huyPhieu", () => {
  it("phieu DaDat sang DaHuy, phong khong con phieu nao giu thi ve Trong", async () => {
    expect(await huyPhieu("DP00000012")).toEqual({ ok: true, data: null });
    expect(await trangThai("DP00000012")).toEqual({ phieu: "DaHuy", phong: "Trong", hoaDon: null });
  });

  it("phieu co hoa don nhap (DP00000007) thi hoa don nhap cung DaHuy", async () => {
    expect(await huyPhieu("DP00000007")).toEqual({ ok: true, data: null });
    expect(await trangThai("DP00000007")).toEqual({ phieu: "DaHuy", phong: "Trong", hoaDon: "DaHuy" });
  });

  it("phieu dang o thi CSDL tu choi", async () => {
    expect(await huyPhieu("DP00000006")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phieu dang o, khong duoc huy. Hay dung nghiep vu tra phong",
    });
  });
});

describe("lapHoaDon", () => {
  it("phieu vua nhan phong chua co hoa don: lap moi, tru coc", async () => {
    await nhanPhong("DP00000011", LE_TAN);
    expect(await lapHoaDon("DP00000011")).toEqual({ ok: true, data: { maHoaDon: "HD00000099" } });
    expect(
      await dong("SELECT TrangThai, TongTien FROM HOA_DON WHERE MaHoaDon = 'HD00000099'"),
    ).toEqual({ TrangThai: "ChuaThanhToan", TongTien: "600000.00" });
  });

  it("phieu da co hoa don nhap: lap lai, van dung ma cu", async () => {
    expect(await lapHoaDon("DP00000023")).toEqual({ ok: true, data: { maHoaDon: "HD00000023" } });
  });

  it("hoa don da thanh toan thi CSDL tu choi lap lai", async () => {
    expect(await lapHoaDon("DP00000032")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Hoa don da thanh toan hoac da huy, khong the lap lai",
    });
  });
});

describe("traPhong", () => {
  // Spec phase 2 muc 1, tieu chi 2: lam sai thu tu thi hien loi, du lieu khong doi.
  it("hoa don chua thanh toan thi CSDL tu choi, phieu va phong giu nguyen", async () => {
    expect(await traPhong("DP00000023")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Hoa don chua duoc thanh toan, khong the hoan tat tra phong!",
    });
    expect(await trangThai("DP00000023")).toEqual({
      phieu: "DangO",
      phong: "DangSuDung",
      hoaDon: "ChuaThanhToan",
    });
  });

  it("hoa don da thanh toan: phieu HoanTat, phong DangDon", async () => {
    await thanhToan("HD00000023", "TienMat");
    expect(await traPhong("DP00000023")).toEqual({ ok: true, data: null });
    expect(await trangThai("DP00000023")).toEqual({
      phieu: "HoanTat",
      phong: "DangDon",
      hoaDon: "DaThanhToan",
    });
  });
});
