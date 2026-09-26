import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { callProcedure, callProcedureOut } from "@/db/procedures";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

beforeEach(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

describe("callProcedureOut", () => {
  it("tra tham so OUT cung result set dau tien", async () => {
    // DP00000006 da co hoa don nhap HD00000006: lap lai tra dung ma do.
    const r = await callProcedureOut<{ MaHoaDon: string }>("sp_LapHoaDon", ["DP00000006"], 1);
    expect(r.out).toEqual(["HD00000006"]);
    expect(r.rows[0].MaHoaDon).toBe("HD00000006");
  });

  it("thu tuc bi CSDL tu choi thi nem loi, va connection van tra ve pool", async () => {
    // Pool co 10 connection. Neu loi lam ro connection, lan goi thu 11 se treo.
    for (let i = 0; i < 12; i++) {
      await expect(callProcedureOut("sp_LapHoaDon", ["DP99999999"], 1)).rejects.toThrow(
        "Phieu dat phong khong ton tai",
      );
    }
    const r = await callProcedureOut("sp_LapHoaDon", ["DP00000006"], 1);
    expect(r.out).toEqual(["HD00000006"]);
  });
});

describe("callProcedure", () => {
  it("van tra result set dau tien nhu truoc", async () => {
    const rows = await callProcedure<{ MaPhong: string }>("sp_TraCuuPhongTrong", [
      "2026-10-01",
      "2026-10-03",
      "LP00000001",
    ]);
    expect(rows).toHaveLength(5);
  });
});
