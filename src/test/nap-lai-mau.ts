import { execFileSync } from "node:child_process";

import { NGAY_CO_DINH } from "./ngay-co-dinh";

/**
 * Nap lai du lieu mau 07 vao CSDL kiem thu (TRUNCATE roi nap, khoang 0,2 giay),
 * de moi test ghi bat dau tu cung mot bo du lieu. File test ghi goi ham nay
 * trong beforeEach va afterAll, nen file test doc chay sau van thay du lieu goc.
 *
 * Truyen thang URL cho script: script tu doc .env.local, ma DATABASE_URL trong
 * do la CSDL dev. Tu choi neu tien trinh khong tro vao CSDL kiem thu.
 */
export function napLaiDuLieuMau(): void {
  const url = process.env.DATABASE_URL;
  if (!url || url !== process.env.DATABASE_URL_TEST) {
    throw new Error("napLaiDuLieuMau chi chay tren CSDL kiem thu (DATABASE_URL_TEST).");
  }
  execFileSync("bash", ["scripts/db-nap-lai-mau.sh", url], {
    stdio: "pipe",
    env: { ...process.env, DB_NGAY_CO_DINH: NGAY_CO_DINH },
  });
}
