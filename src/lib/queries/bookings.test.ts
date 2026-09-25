import { describe, expect, it } from "vitest";
import { NGAY_HIEN_TAI } from "@/lib/mock/now";
import {
  getLoaiPhongConTrong,
  getPhieuNhanHomNay,
  getPhieuTheoMa,
  getPhieuTraHomNay,
  traCuuPhongTrongAnToan,
} from "@/lib/queries/bookings";

describe("getPhieuNhanHomNay", () => {
  it("chi tra phieu DaDat co ngay nhan dung hom nay", async () => {
    const ds = await getPhieuNhanHomNay();
    expect(ds.length).toBeGreaterThanOrEqual(5);
    for (const p of ds) {
      expect(p.ngayCheckIn).toBe(NGAY_HIEN_TAI);
      expect(p.trangThai).toBe("DaDat");
    }
  });
  it("kem ten khach va so dem da tinh san", async () => {
    const [p] = await getPhieuNhanHomNay();
    expect(p.hoTenKhach).toBeTruthy();
    expect(p.soDem).toBeGreaterThan(0);
    expect(p.soPhong.length).toBeGreaterThan(0);
  });
});

describe("getPhieuTraHomNay", () => {
  it("chi tra phieu DangO co ngay tra dung hom nay", async () => {
    const ds = await getPhieuTraHomNay();
    expect(ds.length).toBeGreaterThanOrEqual(5);
    for (const p of ds) {
      expect(p.ngayCheckOut).toBe(NGAY_HIEN_TAI);
      expect(p.trangThai).toBe("DangO");
    }
  });
});

describe("getPhieuTheoMa", () => {
  it("tra dung phieu khi ma co that", async () => {
    const [mau] = await getPhieuNhanHomNay();
    const p = await getPhieuTheoMa(mau.maDatPhong);
    expect(p?.maDatPhong).toBe(mau.maDatPhong);
  });
  it("tra null khi ma khong ton tai, khong nem loi", async () => {
    await expect(getPhieuTheoMa("DP99999999")).resolves.toBeNull();
  });
});

describe("getLoaiPhongConTrong", () => {
  it("tra moi loai phong kem so phong con trong", async () => {
    const ds = await getLoaiPhongConTrong("2026-10-01", "2026-10-03");
    expect(ds).toHaveLength(10);
    for (const l of ds) expect(l.soPhongTrong).toBeGreaterThanOrEqual(0);
  });
  it("nem loi khi ngay tra khong sau ngay nhan", async () => {
    await expect(getLoaiPhongConTrong("2026-10-03", "2026-10-01")).rejects.toThrow(
      "Ngay tra phong phai sau ngay nhan phong",
    );
  });
  it("phong dang co phieu chiem khoang ngay thi khong con trong", async () => {
    // DP00000007 giu PH00000007 (Junior Suite, LP00000007) tu 05/10 den 08/10.
    const trung = await getLoaiPhongConTrong("2026-10-06", "2026-10-07");
    const roi = await getLoaiPhongConTrong("2026-10-01", "2026-10-03");
    const soTrung = trung.find((l) => l.maLoaiPhong === "LP00000007")!.soPhongTrong;
    const soRoi = roi.find((l) => l.maLoaiPhong === "LP00000007")!.soPhongTrong;
    expect(soTrung).toBeLessThan(soRoi);
  });
});

describe("traCuuPhongTrongAnToan", () => {
  it("ngay hop le thi tra ok kem danh sach", async () => {
    const r = await traCuuPhongTrongAnToan("2026-10-01", "2026-10-03");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toHaveLength(10);
  });
  it("ngay sai thi tra ok:false kem thong bao, khong nem loi", async () => {
    const r = await traCuuPhongTrongAnToan("2026-10-03", "2026-10-01");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.loi).toBe("Ngày trả phòng phải sau ngày nhận phòng");
  });
  it("khoang ngay khac nhau cho so phong trong khac nhau", async () => {
    const a = await traCuuPhongTrongAnToan("2026-10-01", "2026-10-03");
    const b = await traCuuPhongTrongAnToan("2026-10-05", "2026-10-08");
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      const cua = (x: typeof a.data, ma: string) =>
        x.find((l) => l.maLoaiPhong === ma)!.soPhongTrong;
      expect(cua(a.data, "LP00000007")).not.toBe(cua(b.data, "LP00000007"));
    }
  });
});
