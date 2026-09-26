import "server-only";

import type { RowDataPacket } from "mysql2";

import { pool } from "./index";

/**
 * Goi mot stored procedure cua database QuanLyKhachSan.
 *
 * Quy uoc cua do an: doc du lieu thi dung Drizzle cho gon va co type,
 * con moi thao tac GHI (nhan phong, ghi dich vu, lap hoa don, thanh toan)
 * deu di qua stored procedure trong ../Scripts/ de trigger va rang buoc
 * o tang CSDL con hieu luc.
 *
 * MySQL tra ve nhieu result set cho mot lenh CALL: cac result set do
 * procedure SELECT ra, roi cuoi cung la mot OkPacket. Ham nay tra ve
 * result set dau tien, la thu procedure thuc su muon tra.
 *
 * Dang dung cho sp_TraCuuPhongTrong, sp_BaoCaoDoanhThu va sp_DangNhap.
 */
export async function callProcedure<T = RowDataPacket>(
  name: string,
  params: unknown[] = [],
): Promise<T[]> {
  // Ten procedure duoc noi thang vao cau lenh (placeholder `?` khong dung
  // cho ten duoc), nen phai chan ky tu la de tranh SQL injection.
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error(`Ten stored procedure khong hop le: ${name}`);
  }

  const placeholders = params.map(() => "?").join(", ");
  const [resultSets] = await pool.query(
    `CALL \`${name}\`(${placeholders})`,
    params,
  );

  if (!Array.isArray(resultSets)) {
    return [];
  }

  const first = resultSets[0];
  return Array.isArray(first) ? (first as T[]) : [];
}
