import { describe, expect, it } from "vitest";

import { getBangGia, getLichGia } from "@/lib/queries/bang-gia";

describe("getBangGia", () => {
  it("10 loai phong theo ma, moi loai kem gia goc va cac khoang gia", async () => {
    const ds = await getBangGia();
    expect(ds).toHaveLength(10);
    expect(ds[1]).toEqual({
      maLoaiPhong: "LP00000002",
      tenLoaiPhong: "Standard Double",
      donGiaNgay: "800000.00",
      khoang: [
        {
          maBangGia: "BG00000002",
          apDungTuNgay: "2026-01-08",
          denNgay: "2027-01-07",
          donGia: "880000.00",
          heSo: "1.10",
        },
      ],
    });
  });
});

describe("getLichGia", () => {
  it("gia tung ngay, co danh dau ngay nao roi ve gia goc", async () => {
    const lich = await getLichGia("2027-01-06", 3);
    expect(lich.ngay).toEqual(["2027-01-06", "2027-01-07", "2027-01-08"]);
    expect(lich.loai).toHaveLength(10);
    expect(lich.loai[1]).toEqual({
      maLoaiPhong: "LP00000002",
      tenLoaiPhong: "Standard Double",
      donGiaNgay: "800000.00",
      gia: [
        { donGia: "880000.00", coKhaiGia: true },
        { donGia: "880000.00", coKhaiGia: true },
        { donGia: "800000.00", coKhaiGia: false },
      ],
    });
  });

  it("mac dinh 14 ngay tinh tu ngay dau", async () => {
    const { ngay } = await getLichGia("2026-09-23");
    expect([ngay.length, ngay[0], ngay[13]]).toEqual([14, "2026-09-23", "2026-10-06"]);
  });
});
