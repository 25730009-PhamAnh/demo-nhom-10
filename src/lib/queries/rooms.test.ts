import { describe, expect, it } from "vitest";
import * as mock from "@/lib/mock/data";
import { TRANG_THAI_PHONG } from "@/lib/status";
import {
  getNhatKyBuongPhong,
  getSoDoPhong,
  getThongKePhongTheoTrangThai,
} from "@/lib/queries/rooms";

describe("getSoDoPhong", () => {
  it("tra du moi phong kem ten loai phong da noi bang", async () => {
    const ds = await getSoDoPhong();
    expect(ds).toHaveLength(mock.PHONG.length);
    expect(ds[0].tenLoaiPhong).toBeTruthy();
    expect(ds[0].donGiaNgay).toMatch(/^\d+\.\d{2}$/);
  });
  it("sap xep theo so phong tang dan", async () => {
    const ds = await getSoDoPhong();
    const so = ds.map((p) => p.soPhong);
    expect(so).toEqual([...so].sort());
  });
});

describe("getThongKePhongTheoTrangThai", () => {
  it("dem du 5 trang thai, ke ca trang thai khong co phong nao", async () => {
    const tk = await getThongKePhongTheoTrangThai();
    expect(tk.map((t) => t.ma)).toEqual([...TRANG_THAI_PHONG]);
  });
  it("tong so luong bang tong so phong", async () => {
    const tk = await getThongKePhongTheoTrangThai();
    const tong = tk.reduce((s, t) => s + t.soLuong, 0);
    expect(tong).toBe(mock.PHONG.length);
  });

  // Review Focus #3 — man hinh phai xu ly duoc truong hop dem ra 0
  it("trang thai khong co phong nao van tra ve dong voi soLuong 0", async () => {
    const tk = await getThongKePhongTheoTrangThai();
    for (const t of tk) expect(t.soLuong).toBeGreaterThanOrEqual(0);
    expect(tk).toHaveLength(5);
  });
});

describe("getNhatKyBuongPhong", () => {
  it("gop don phong va sua phong, moi nhat len dau", async () => {
    const nk = await getNhatKyBuongPhong();
    expect(nk.length).toBeGreaterThan(0);
    const gio = nk.map((n) => n.ngayGio);
    expect(gio).toEqual([...gio].sort().reverse());
    expect(new Set(nk.map((n) => n.loai))).toEqual(new Set(["DonPhong", "SuaPhong"]));
  });
});
