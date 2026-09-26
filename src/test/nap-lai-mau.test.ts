import { describe, expect, it } from "vitest";
import type { RowDataPacket } from "mysql2";

import { pool } from "@/db";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

describe("napLaiDuLieuMau", () => {
  it("test ghi lam doi du lieu, nap lai thi ve dung bo du lieu mau", async () => {
    await pool.query("UPDATE PHONG SET TrangThai = 'BaoTri' WHERE MaPhong = 'PH00000001'");
    await pool.query("DELETE FROM DON_PHONG");

    napLaiDuLieuMau();

    const [r] = await pool.query<RowDataPacket[]>(
      "SELECT (SELECT TrangThai FROM PHONG WHERE MaPhong = 'PH00000001') AS tt, (SELECT COUNT(*) FROM DON_PHONG) AS don",
    );
    expect({ ...r[0] }).toEqual({ tt: "Trong", don: 16 });
  });

  it("tu choi chay khi DATABASE_URL khong phai CSDL kiem thu", () => {
    const cu = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "mysql://root:@127.0.0.1:3306/QuanLyKhachSan";
    try {
      expect(() => napLaiDuLieuMau()).toThrow("CSDL kiem thu");
    } finally {
      process.env.DATABASE_URL = cu;
    }
  });
});
