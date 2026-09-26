import { describe, expect, it } from "vitest";

import { pool } from "@/db";
import { thongBaoCsdl } from "@/db/loi";

describe("thongBaoCsdl", () => {
  it("loi SIGNAL 45000 giu nguyen van thong bao cua CSDL", () => {
    expect(
      thongBaoCsdl({ errno: 1644, sqlMessage: "Tai khoan dang o trang thai TamNghi, khong the dang nhap" }),
    ).toBe("CSDL từ chối: Tai khoan dang o trang thai TamNghi, khong the dang nhap");
  });

  it("bo tien to 'Loi: ' ma mot so thu tuc tu them", () => {
    expect(thongBaoCsdl({ errno: 1644, sqlMessage: "Loi: Ma phong khong ton tai!" })).toBe(
      "CSDL từ chối: Ma phong khong ton tai!",
    );
  });

  // Review Focus #3
  it("loi khong phai loi nghiep vu thi nem tiep, khong gia lam thong bao", () => {
    const matKetNoi = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:3306"), {
      code: "ECONNREFUSED",
      errno: -61,
    });
    expect(() => thongBaoCsdl(matKetNoi)).toThrow(matKetNoi);
    expect(() => thongBaoCsdl("khong phai loi")).toThrow();
  });

  it("dung voi loi that cua mysql2: SIGNAL thi thanh thong bao, loi 1292 thi nem tiep", async () => {
    const loi = await pool
      .query("CALL sp_TraCuuPhongTrong('2026-10-03', '2026-10-01', NULL)")
      .catch((e: unknown) => e);
    expect(thongBaoCsdl(loi)).toBe("CSDL từ chối: Ngay tra phong phai sau ngay nhan phong");

    const loiNgay = await pool.query("CALL sp_TraCuuPhongTrong('', '', NULL)").catch((e: unknown) => e);
    expect(() => thongBaoCsdl(loiNgay)).toThrow("Incorrect date value");
  });
});
