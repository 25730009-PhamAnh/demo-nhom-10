import { describe, expect, it } from "vitest";

import {
  getLoaiPhongConTrong,
  getPhieuDangO,
  getPhieuNhanHomNay,
  getPhieuTheoMa,
  getPhieuTraHomNay,
  traCuuPhongTrongAnToan,
} from "@/lib/queries/bookings";

const HOM_NAY = "2026-09-23";

describe("getPhieuNhanHomNay", () => {
  it("dung 12 phieu DaDat co ngay nhan la hom nay", async () => {
    const ds = await getPhieuNhanHomNay();
    expect(ds).toHaveLength(12);
    for (const p of ds) {
      expect(p.ngayCheckIn).toBe(HOM_NAY);
      expect(p.trangThai).toBe("DaDat");
    }
  });

  it("kem khach, phong, loai phong, so dem va tien phong", async () => {
    const [p] = await getPhieuNhanHomNay();
    expect(p).toEqual({
      maDatPhong: "DP00000011",
      maKh: "KH00000011",
      hoTenKhach: "Nguyen Thi An",
      cccd: "079300000011",
      sdt: "0910000011",
      ngayCheckIn: "2026-09-23",
      ngayCheckOut: "2026-09-25",
      soDem: 2,
      trangThai: "DaDat",
      tienCoc: "600000.00",
      soPhong: ["103"],
      tenLoaiPhong: "Standard Single",
      tongTienPhong: "1200000.00",
      hoaDon: null,
    });
  });
});

describe("getPhieuTraHomNay", () => {
  it("dung 9 phieu DangO co ngay tra la hom nay", async () => {
    const ds = await getPhieuTraHomNay();
    expect(ds).toHaveLength(9);
    for (const p of ds) {
      expect(p.ngayCheckOut).toBe(HOM_NAY);
      expect(p.trangThai).toBe("DangO");
    }
  });
});

describe("getPhieuDangO", () => {
  it("moi phieu dang o, ke ca phieu chua den ngay tra (DP00000006)", async () => {
    const ds = await getPhieuDangO();
    expect(ds).toHaveLength(10);
    expect(ds.every((p) => p.trangThai === "DangO")).toBe(true);
    expect(ds.map((p) => p.maDatPhong)).toContain("DP00000006");
  });

  it("kem hoa don cua phieu, de tab Tra phong biet dang o buoc nao", async () => {
    const ds = await getPhieuDangO();
    expect(ds.find((p) => p.maDatPhong === "DP00000023")!.hoaDon).toEqual({
      maHoaDon: "HD00000023",
      trangThai: "ChuaThanhToan",
    });
  });
});

describe("getPhieuTheoMa", () => {
  it("phieu nhieu phong: du so phong va cong tien tung phong", async () => {
    const p = await getPhieuTheoMa("DP00000008");
    expect(p).toMatchObject({
      soPhong: ["402", "501"],
      tenLoaiPhong: "Executive Suite",
      tongTienPhong: "13720000.00",
    });
  });

  it("tra null khi ma khong ton tai, khong nem loi", async () => {
    await expect(getPhieuTheoMa("DP99999999")).resolves.toBeNull();
  });
});

describe("getLoaiPhongConTrong", () => {
  it("du 10 loai phong kem so phong con trong theo sp_TraCuuPhongTrong", async () => {
    const ds = await getLoaiPhongConTrong("2026-10-01", "2026-10-03");
    expect(ds[0]).toEqual({
      maLoaiPhong: "LP00000001",
      tenLoaiPhong: "Standard Single",
      donGiaNgay: "600000.00",
      soPhongTrong: 5,
    });
    expect(ds.map((l) => l.soPhongTrong)).toEqual([5, 4, 3, 2, 2, 3, 3, 3, 3, 2]);
  });

  it("phong DangDon va BaoTri khong bao gio duoc tinh la trong: 42 - 10 - 2 = 30", async () => {
    const ds = await getLoaiPhongConTrong("2026-10-01", "2026-10-03");
    expect(ds.reduce((s, l) => s + l.soPhongTrong, 0)).toBe(30);
  });

  it("phong dang co phieu giu trong khoang ngay thi khong con trong", async () => {
    // DP00000007 giu phong 401 (Junior Suite, LP00000007) tu 12/10 den 15/10.
    const trung = await getLoaiPhongConTrong("2026-10-13", "2026-10-14");
    expect(trung.find((l) => l.maLoaiPhong === "LP00000007")!.soPhongTrong).toBe(2);
  });

  it("don gia moi dem la gia sp_DatPhong se chot tu BANG_GIA_PHONG, khong phai LOAI_PHONG.DonGiaNgay", async () => {
    const ds = await getLoaiPhongConTrong("2026-10-01", "2026-10-03");
    expect(ds.map((l) => l.donGiaNgay)).toEqual([
      "600000.00", "880000.00", "1000000.00", "1380000.00", "1500000.00",
      "1840000.00", "2200000.00", "4000000.00", "2860000.00", "7800000.00",
    ]);
  });

  it("khoang ngay vuot qua bang gia thi lay trung binh tung dem nhu sp_DatPhong", async () => {
    // Bang gia LP00000002 (880.000) het hieu luc sau 07/01/2027; hai dem sau
    // lui ve DonGiaNgay 800.000, nen trung binh 4 dem la 840.000.
    const ds = await getLoaiPhongConTrong("2027-01-06", "2027-01-10");
    expect(ds.find((l) => l.maLoaiPhong === "LP00000002")!.donGiaNgay).toBe("840000.00");
  });

  it("nem loi cua CSDL khi ngay tra khong sau ngay nhan", async () => {
    await expect(getLoaiPhongConTrong("2026-10-03", "2026-10-01")).rejects.toThrow(
      "Ngay tra phong phai sau ngay nhan phong",
    );
  });
});

describe("traCuuPhongTrongAnToan", () => {
  it("ngay hop le thi tra ok kem danh sach", async () => {
    const r = await traCuuPhongTrongAnToan("2026-10-01", "2026-10-03");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toHaveLength(10);
  });

  it("ngay sai thu tu thi tra ok:false kem thong bao cua CSDL, khong nem", async () => {
    await expect(traCuuPhongTrongAnToan("2026-10-03", "2026-10-01")).resolves.toEqual({
      ok: false,
      loi: "CSDL từ chối: Ngay tra phong phai sau ngay nhan phong",
    });
  });

  // Review Focus #1
  it("o ngay bi xoa trong hoac ngay khong co that thi tra ok:false, khong nem", async () => {
    const khongHopLe = { ok: false, loi: "Ngày không hợp lệ" };
    await expect(traCuuPhongTrongAnToan("", "2026-10-03")).resolves.toEqual(khongHopLe);
    await expect(traCuuPhongTrongAnToan("2026-10-01", "")).resolves.toEqual(khongHopLe);
    await expect(traCuuPhongTrongAnToan("2026-02-30", "2026-03-02")).resolves.toEqual(khongHopLe);
  });

  it("go nham nam (luu tru hon 1000 dem) thi tra ok:false, khong nem", async () => {
    await expect(traCuuPhongTrongAnToan("2026-10-01", "2029-10-01")).resolves.toEqual({
      ok: false,
      loi: "Mỗi lần chỉ tra cứu tối đa 1000 đêm",
    });
  });
});
