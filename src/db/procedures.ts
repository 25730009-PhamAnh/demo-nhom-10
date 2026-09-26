import "server-only";

import type { RowDataPacket } from "mysql2";

import { pool } from "./index";

/**
 * Goi stored procedure cua database QuanLyKhachSan.
 *
 * Quy uoc cua do an: doc du lieu thi dung Drizzle cho gon va co type,
 * con moi thao tac GHI (dat phong, nhan phong, ghi dich vu, lap hoa don,
 * thanh toan...) deu di qua stored procedure trong ../Scripts/ de trigger va
 * rang buoc o tang CSDL con hieu luc.
 *
 * MySQL tra ve nhieu result set cho mot lenh CALL: cac result set do
 * procedure SELECT ra, roi cuoi cung la mot OkPacket. `rows` la result set
 * dau tien, la thu procedure thuc su muon tra.
 *
 * Tham so OUT: bien @out1, @out2... song theo connection, nen CALL va SELECT
 * phai chay tren CUNG mot connection lay rieng tu pool, roi tra lai (ke ca khi
 * thu tuc bao loi). Cac tham so OUT luon dung sau cung, dung thu tu khai bao.
 */
export async function callProcedureOut<T = RowDataPacket>(
  name: string,
  params: unknown[],
  soThamSoOut: number,
): Promise<{ rows: T[]; out: (string | null)[] }> {
  // Ten procedure duoc noi thang vao cau lenh (placeholder `?` khong dung
  // cho ten duoc), nen phai chan ky tu la de tranh SQL injection.
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error(`Ten stored procedure khong hop le: ${name}`);
  }

  const bienOut = Array.from({ length: soThamSoOut }, (_, i) => `@out${i + 1}`);
  const thamSo = [...params.map(() => "?"), ...bienOut].join(", ");

  const conn = await pool.getConnection();
  try {
    const [resultSets] = await conn.query(`CALL \`${name}\`(${thamSo})`, params);

    let out: (string | null)[] = [];
    if (soThamSoOut > 0) {
      const [r] = await conn.query<RowDataPacket[]>(
        `SELECT ${bienOut.map((b, i) => `${b} AS o${i}`).join(", ")}`,
      );
      out = bienOut.map((_, i) => (r[0][`o${i}`] as string | null) ?? null);
    }

    const dau = Array.isArray(resultSets) ? resultSets[0] : undefined;
    return { rows: Array.isArray(dau) ? (dau as T[]) : [], out };
  } finally {
    conn.release();
  }
}

/** Goi thu tuc chi can result set dau tien (tra phong trong, bao cao, dang nhap). */
export async function callProcedure<T = RowDataPacket>(
  name: string,
  params: unknown[] = [],
): Promise<T[]> {
  return (await callProcedureOut<T>(name, params, 0)).rows;
}
