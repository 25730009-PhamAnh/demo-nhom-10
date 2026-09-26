/**
 * Kiem KIEU va DINH DANG tham so cua Server Action truoc khi goi thu tuc.
 *
 * Server Action la diem vao ai cung POST toi duoc, nen khong duoc tin kieu ma
 * TypeScript khai: object gui len thay cho chuoi se bi mysql2 dich thanh
 * `cot = gia tri` (stringifyObjects mac dinh false). O day chi kiem hinh thuc;
 * quy tac nghiep vu (trang thai phieu, phong co san sang...) de thu tuc quyet.
 */

const NGAY_ISO = /^\d{4}-\d{2}-\d{2}$/;
const TIEN = /^\d{1,16}(\.\d{1,2})?$/; // DECIMAL(18,2), khong am
const INT_MAX = 2_147_483_647;

/** Ma CHAR(10) cua do an: tien to chu hoa + chu so, vi du DP00000011. */
export function laMa(x: unknown, tienTo: string): x is string {
  return typeof x === "string" && x.length === 10 && x.startsWith(tienTo) && /^[A-Z]+\d+$/.test(x);
}

export function laSoNguyenDuong(x: unknown): x is number {
  return typeof x === "number" && Number.isInteger(x) && x > 0 && x <= INT_MAX;
}

/** So tien dang chuoi nhu o nhap: '600000', '600000.5'. Khong am. */
export function laTien(x: unknown): x is string {
  return typeof x === "string" && TIEN.test(x);
}

/** Ngay 'YYYY-MM-DD' co that tren lich; chan chuoi rong va ngay nhu 2026-02-30. */
export function laNgay(x: unknown): x is string {
  if (typeof x !== "string" || !NGAY_ISO.test(x)) return false;
  const d = new Date(`${x}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === x;
}

/** Chuoi toi da `toiDa` ky tu (VARCHAR(n)), chuoi rong van hop le. */
export function laChuoi(x: unknown, toiDa: number): x is string {
  return typeof x === "string" && x.length <= toiDa;
}

/** Ket qua tra ve cho client khi tham so sai hinh thuc. */
export function khongHopLe(truong: string): { ok: false; loi: string } {
  return { ok: false, loi: `${truong} không hợp lệ` };
}
