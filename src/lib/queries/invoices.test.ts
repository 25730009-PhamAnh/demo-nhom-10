import { describe, expect, it } from "vitest";

import { getDanhSachHoaDon, getHoaDon } from "@/lib/queries/invoices";
import { congTien } from "@/lib/tinh-toan";

describe("getHoaDon", () => {
  it("tra hoa don kem khach, phieu va khoan muc theo thu tu ma", async () => {
    expect(await getHoaDon("HD00000001")).toEqual({
      maHoaDon: "HD00000001",
      maDatPhong: "DP00000001",
      ngayLap: "2026-01-19 11:00:00",
      trangThai: "DaThanhToan",
      loaiThanhToan: "The",
      tongTien: "1360000.00",
      khach: { hoTen: "Nguyen Hoang Long", maKh: "KH00000001", cccd: "079201000001", sdt: "0901234501" },
      phieu: {
        ngayCheckIn: "2026-01-17",
        ngayCheckOut: "2026-01-19",
        soDem: 2,
        soPhong: ["101"],
        tenLoaiPhong: "Standard Single",
      },
      khoanMuc: [
        { loaiKhoanMuc: "TienPhong", ghiChu: "Phong 101: 600.000 x 2 dem", soTien: "1200000.00" },
        { loaiKhoanMuc: "DichVu", ghiChu: "Buffet, giat ui va minibar", soTien: "760000.00" },
        { loaiKhoanMuc: "PhuThu", ghiChu: "Phu thu nhan phong som", soTien: "100000.00" },
        { loaiKhoanMuc: "GiamGia", ghiChu: "Giam gia khach hang thanh vien", soTien: "-100000.00" },
        { loaiKhoanMuc: "GiamTru", ghiChu: "Tru tien coc cua phieu DP00000001", soTien: "-600000.00" },
      ],
    });
  });

  it("tong cac khoan muc bang tong tien, voi moi hoa don", async () => {
    for (const { maHoaDon } of await getDanhSachHoaDon()) {
      const hd = await getHoaDon(maHoaDon);
      expect([maHoaDon, congTien(...hd!.khoanMuc.map((k) => k.soTien))]).toEqual([maHoaDon, hd!.tongTien]);
    }
  });

  // Review Focus #4
  it("hoa don nhap chua co khoan muc nao: danh sach rong, tong 0.00, van co phong", async () => {
    const hd = await getHoaDon("HD00000007");
    expect(hd).toMatchObject({ trangThai: "ChuaThanhToan", tongTien: "0.00", khoanMuc: [] });
    expect(hd?.phieu.soPhong).toEqual(["401"]);
  });

  it("tra null khi ma hoa don khong ton tai", async () => {
    await expect(getHoaDon("HD99999999")).resolves.toBeNull();
  });
});

describe("getDanhSachHoaDon", () => {
  it("du 76 hoa don, moi nhat truoc", async () => {
    const ds = await getDanhSachHoaDon();
    expect(ds).toHaveLength(76);
    expect(ds[0]).toEqual({
      maHoaDon: "HD00000005",
      maDatPhong: "DP00000005",
      ngayLap: "2026-09-23 11:15:00",
      tongTien: "1500000.00",
      trangThai: "DaThanhToan",
      hoTenKhach: "Vo Quoc Bao",
    });
    const lap = ds.map((h) => h.ngayLap);
    expect(lap).toEqual([...lap].sort().reverse());
  });
});
