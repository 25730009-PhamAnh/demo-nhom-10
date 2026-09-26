import { describe, expect, it } from "vitest";
import type { RowDataPacket } from "mysql2";

import { pool } from "@/db";

describe("pool khi kiem thu", () => {
  it("tro vao CSDL kiem thu, khong phai CSDL dev", async () => {
    const [r] = await pool.query<RowDataPacket[]>("SELECT DATABASE() AS ten");
    // lower_case_table_names = 2 (macOS): MySQL tra ten CSDL o dang chu thuong.
    const ten = String(r[0].ten).toLowerCase();
    expect(ten).not.toBe("quanlykhachsan");
    expect(ten).toBe(new URL(process.env.DATABASE_URL!).pathname.slice(1).toLowerCase());
  });

  it("CURDATE() va NOW() bi dong bang ve 23/09/2026 10:00, tra ve dang chuoi", async () => {
    const [r] = await pool.query<RowDataPacket[]>("SELECT CURDATE() AS ngay, NOW() AS luc");
    expect(r[0].ngay).toBe("2026-09-23");
    expect(r[0].luc).toBe("2026-09-23 10:00:00");
  });

  it("moi connection moi trong pool deu bi dong bang, khong chi connection dau", async () => {
    const cs = await Promise.all([pool.getConnection(), pool.getConnection(), pool.getConnection()]);
    try {
      for (const c of cs) {
        const [r] = await c.query<RowDataPacket[]>("SELECT CURDATE() AS ngay");
        expect(r[0].ngay).toBe("2026-09-23");
      }
    } finally {
      cs.forEach((c) => c.release());
    }
  });
});
