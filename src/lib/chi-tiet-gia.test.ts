import { describe, expect, it } from "vitest";

import { gopDoanGia } from "@/lib/chi-tiet-gia";

describe("gopDoanGia", () => {
  it("gop cac dem lien nhau cung gia thanh mot doan", () => {
    expect(
      gopDoanGia([
        { ngay: "2026-12-28", donGia: "1500000.00" },
        { ngay: "2026-12-29", donGia: "1500000.00" },
        { ngay: "2026-12-30", donGia: "1950000.00" },
      ]),
    ).toEqual([
      { tuNgay: "2026-12-28", denNgay: "2026-12-29", donGia: "1500000.00", soDem: 2 },
      { tuNgay: "2026-12-30", denNgay: "2026-12-30", donGia: "1950000.00", soDem: 1 },
    ]);
  });

  it("gia quay lai muc cu la doan moi, khong gop voi doan truoc", () => {
    const doan = gopDoanGia([
      { ngay: "2027-01-01", donGia: "1500000.00" },
      { ngay: "2027-01-02", donGia: "1950000.00" },
      { ngay: "2027-01-03", donGia: "1500000.00" },
    ]);
    expect(doan.map((d) => d.soDem)).toEqual([1, 1, 1]);
  });

  it("khong co dem nao thi khong co doan", () => {
    expect(gopDoanGia([])).toEqual([]);
  });
});
