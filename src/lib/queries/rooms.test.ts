import { describe, expect, it } from "vitest";

import {
  getNhatKyBuongPhong,
  getSoDoPhong,
  getThongKePhongTheoTrangThai,
  gopThongKeTrangThai,
} from "@/lib/queries/rooms";

describe("getSoDoPhong", () => {
  it("tra du 42 phong kem loai phong da noi bang", async () => {
    const ds = await getSoDoPhong();
    expect(ds).toHaveLength(42);
    expect(ds[0]).toEqual({
      maPhong: "PH00000001",
      soPhong: "101",
      tang: 1,
      tenLoaiPhong: "Standard Single",
      donGiaNgay: "600000.00",
      trangThai: "Trong",
    });
  });

  it("sap xep theo so phong tang dan", async () => {
    const so = (await getSoDoPhong()).map((p) => p.soPhong);
    expect(so).toEqual([...so].sort());
  });
});

describe("getThongKePhongTheoTrangThai", () => {
  it("dem dung 5 trang thai, theo thu tu TRANG_THAI_PHONG", async () => {
    const tk = await getThongKePhongTheoTrangThai();
    expect(tk.map((t) => [t.ma, t.soLuong])).toEqual([
      ["Trong", 5],
      ["DaDat", 15],
      ["DangSuDung", 10],
      ["DangDon", 10],
      ["BaoTri", 2],
    ]);
    expect(tk[0].nhan).toBe("Trống");
  });
});

describe("gopThongKeTrangThai", () => {
  // Man hinh phai xu ly duoc truong hop dem ra 0.
  it("trang thai khong co phong nao van co dong voi soLuong 0", () => {
    const tk = gopThongKeTrangThai([{ ma: "Trong", soLuong: 3 }]);
    expect(tk.map((t) => [t.ma, t.soLuong])).toEqual([
      ["Trong", 3],
      ["DaDat", 0],
      ["DangSuDung", 0],
      ["DangDon", 0],
      ["BaoTri", 0],
    ]);
  });
});

describe("getNhatKyBuongPhong", () => {
  it("gop 16 lan don va 12 lan sua, moi nhat len dau", async () => {
    const nk = await getNhatKyBuongPhong();
    expect(nk).toHaveLength(28);
    expect(nk.filter((n) => n.loai === "DonPhong")).toHaveLength(16);
    const gio = nk.map((n) => n.ngayGio);
    expect(gio).toEqual([...gio].sort().reverse());
    expect(nk[0]).toEqual({
      ngayGio: "2026-09-23 12:00:00",
      soPhong: "301",
      loai: "DonPhong",
      nhanVien: "TK00000004",
      ghiChu: "Dang don tong quat sau check-out",
      chiPhi: null,
    });
  });

  it("su co chua co chi phi mang chiPhi '0.00' de man Tong quan nhan ra phong dang hong", async () => {
    const nk = await getNhatKyBuongPhong();
    expect(nk.find((n) => n.loai === "SuaPhong" && n.chiPhi === "0.00")).toMatchObject({
      soPhong: "303",
      ghiChu: "May lanh khong chay, dang kiem tra",
    });
  });
});
