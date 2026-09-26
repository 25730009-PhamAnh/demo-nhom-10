import "server-only";

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import * as relations from "./relations";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("Thieu DATABASE_URL. Hay copy .env.example thanh .env.local.");
}

// Next.js dev server nap lai module moi lan sua code (HMR). Neu tao pool moi
// moi lan thi MySQL se het connection sau vai chuc lan save, nen cache vao
// globalThis. Production chi nap module mot lan nen khong can cache.
const globalForDb = globalThis as unknown as { pool?: mysql.Pool };

function taoPool(): mysql.Pool {
  const p = mysql.createPool({
    uri: process.env.DATABASE_URL,
    connectionLimit: 10,
    // Du lieu trong DB la tieng Viet co dau, phai khop collation cua schema.
    charset: "utf8mb4",
    timezone: "local",
    // Ket qua CALL va truy van sql`` tra DATE / DATETIME dang chuoi, dung nhu
    // cac cot Drizzle khai mode: 'string'. Mac dinh mysql2 tra Date cua JS.
    dateStrings: true,
  });

  // Kiem thu dong bang CURDATE() / NOW() cua MOI connection ve mot moc
  // (vitest.config.mts dat bien nay). Dev va production khong dat.
  // Su kien 'connection' cua pool loi nhan connection kieu callback.
  const ngayCoDinh = process.env.DB_NGAY_CO_DINH;
  if (ngayCoDinh) {
    p.pool.on("connection", (conn) => {
      conn.query("SET timestamp = UNIX_TIMESTAMP(?)", [ngayCoDinh], (err) => {
        if (err) console.error("Khong dong bang duoc ngay cua connection", err);
      });
    });
  }
  return p;
}

export const pool = globalForDb.pool ?? taoPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, {
  schema: { ...schema, ...relations },
  mode: "default",
});
