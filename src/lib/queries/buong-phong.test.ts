import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  getNhanVienTheoLoai,
  getNhatKyDon,
  getNhatKySua,
  getPhongChoDon,
  getPhongDangBaoTri,
} from "@/lib/queries/buong-phong";
import { baoDonPhong } from "@/lib/thao-tac/buong-phong";
import { LOAI_TK_BUONG_PHONG, LOAI_TK_KY_THUAT } from "@/lib/vai-tro";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

// Ca cuoi file ghi vao CSDL (bao don phong 103), nen nap lai truoc va sau file.
beforeAll(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

describe("getNhanVienTheoLoai", () => {
  it("chi nhan vien dang lam viec cua dung vai tro, theo ho ten", async () => {
    expect(await getNhanVienTheoLoai(LOAI_TK_BUONG_PHONG)).toEqual([
      { maTk: "TK00000004", hoTen: "Pham Thi Mai" },
      { maTk: "TK00000005", hoTen: "Vo Thanh Thao" },
    ]);
    // kythuat.son (TK00000007) dang TamNghi.
    expect(await getNhanVienTheoLoai(LOAI_TK_KY_THUAT)).toEqual([
      { maTk: "TK00000006", hoTen: "Do Hoang Nam" },
    ]);
  });
});

describe("getPhongDangBaoTri", () => {
  it("moi phong BaoTri kem phieu dang mo (dong SUA_PHONG moi nhat), phieu cu len truoc", async () => {
    expect(await getPhongDangBaoTri()).toEqual([
      {
        maPhong: "PH00000004",
        soPhong: "202",
        tang: 2,
        tenLoaiPhong: "Superior Double",
        khachHomNay: null,
        phieu: {
          maSua: "SUA0000004",
          moTaLoi: "Sua he thong nuoc nong",
          chiPhi: "900000.00",
          thoiGian: "2026-09-20 15:20:00",
          nguoiGhi: "Bui Minh Son",
          soNgayCho: 3,
        },
      },
      {
        maPhong: "PH00000010",
        soPhong: "PRES-01",
        tang: 6,
        tenLoaiPhong: "Presidential Suite",
        khachHomNay: null,
        phieu: {
          maSua: "SUA0000010",
          moTaLoi: "Bao tri he thong am thanh",
          chiPhi: "1500000.00",
          thoiGian: "2026-09-22 09:40:00",
          nguoiGhi: "Bui Minh Son",
          soNgayCho: 1,
        },
      },
    ]);
  });
});

describe("nhat ky", () => {
  it("getNhatKyDon: moi nhat len dau, kem ho ten nhan vien", async () => {
    const nk = await getNhatKyDon();
    expect(nk).toHaveLength(16);
    expect(nk[0]).toEqual({
      maDon: "DON0000005",
      thoiGian: "2026-09-23 12:00:00",
      soPhong: "301",
      nhanVien: "Pham Thi Mai",
      ghiChu: "Dang don tong quat sau check-out",
    });
    expect(await getNhatKyDon(3)).toHaveLength(3);
  });

  it("getNhatKySua: moi nhat len dau, kem chi phi", async () => {
    expect(await getNhatKySua(1)).toEqual([
      {
        maSua: "SUA0000011",
        thoiGian: "2026-09-23 08:10:00",
        soPhong: "303",
        nhanVien: "Do Hoang Nam",
        chiPhi: "0.00",
        moTaLoi: "May lanh khong chay, dang kiem tra",
      },
    ]);
  });
});

describe("getPhongChoDon", () => {
  it("moi phong DangDon theo so phong", async () => {
    const ds = await getPhongChoDon();
    expect(ds.map((p) => p.soPhong)).toEqual([
      "301", "308", "309", "310", "403", "404", "405", "406", "407", "408",
    ]);
    expect(ds[0]).toEqual({
      maPhong: "PH00000005",
      soPhong: "301",
      tang: 3,
      tenLoaiPhong: "Deluxe King",
      khachHomNay: null,
    });
  });

  it("phong co khach nhan hom nay len dau (ca nay ghi CSDL: bao don phong 103)", async () => {
    expect((await baoDonPhong("PH00000011")).ok).toBe(true);
    const [dau] = await getPhongChoDon();
    expect(dau).toMatchObject({
      soPhong: "103",
      khachHomNay: { maDatPhong: "DP00000011", hoTen: "Nguyen Thi An" },
    });
  });
});
