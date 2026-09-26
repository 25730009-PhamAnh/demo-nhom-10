import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

import { pool } from "@/db";
import { thongBaoCsdl } from "@/db/loi";

describe("thongBaoCsdl", () => {
  let log: MockInstance<typeof console.error>;
  beforeEach(() => {
    log = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => log.mockRestore());

  it("loi SIGNAL 45000 giu nguyen van thong bao cua CSDL, khong ghi log", () => {
    expect(
      thongBaoCsdl({ errno: 1644, sqlMessage: "Tai khoan dang o trang thai TamNghi, khong the dang nhap" }),
    ).toBe("CSDL từ chối: Tai khoan dang o trang thai TamNghi, khong the dang nhap");
    expect(log).not.toHaveBeenCalled();
  });

  it("bo tien to 'Loi: ' ma mot so thu tuc tu them", () => {
    expect(thongBaoCsdl({ errno: 1644, sqlMessage: "Loi: Ma phong khong ton tai!" })).toBe(
      "CSDL từ chối: Ma phong khong ton tai!",
    );
  });

  it("loi CSDL khac (mat ket noi, sai kieu) thanh thong bao kem ma loi va ghi log tren server", () => {
    const matKetNoi = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:3306"), {
      code: "ECONNREFUSED",
      errno: -61,
    });
    expect(thongBaoCsdl(matKetNoi)).toBe("Lỗi CSDL (-61): connect ECONNREFUSED 127.0.0.1:3306");
    expect(log).toHaveBeenCalledWith("Loi CSDL khong phai loi nghiep vu:", matKetNoi);
  });

  // Review Focus: MySQL tat hoac connection bi ngat giua chung. mysql2 bao loi
  // "fatal" khong co errno; khong bat thi trang vo thay vi hien thong bao.
  it("connection bi ngat giua chung (fatal, khong errno) cung thanh thong bao", () => {
    const ngat = Object.assign(new Error("Can't add new command when connection is in closed state"), {
      fatal: true,
    });
    expect(thongBaoCsdl(ngat)).toBe(
      "Lỗi CSDL (mất kết nối): Can't add new command when connection is in closed state",
    );
  });

  it("loi khong den tu CSDL (loi lap trinh) van nem tiep", () => {
    const loiCode = new TypeError("Cannot read properties of undefined (reading 'maTk')");
    expect(() => thongBaoCsdl(loiCode)).toThrow(loiCode);
    expect(() => thongBaoCsdl("khong phai loi")).toThrow();
  });

  it("dung voi loi that cua mysql2: SIGNAL la 'CSDL tu choi', loi 1292 la 'Loi CSDL (1292)'", async () => {
    const loi = await pool
      .query("CALL sp_TraCuuPhongTrong('2026-10-03', '2026-10-01', NULL)")
      .catch((e: unknown) => e);
    expect(thongBaoCsdl(loi)).toBe("CSDL từ chối: Ngay tra phong phai sau ngay nhan phong");

    const loiNgay = await pool.query("CALL sp_TraCuuPhongTrong('', '', NULL)").catch((e: unknown) => e);
    expect(thongBaoCsdl(loiNgay)).toBe(
      "Lỗi CSDL (1292): Incorrect date value: '' for column 'p_NgayCheckIn' at row 1",
    );
  });
});
