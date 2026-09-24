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

export const pool =
  globalForDb.pool ??
  mysql.createPool({
    uri: process.env.DATABASE_URL,
    connectionLimit: 10,
    // Du lieu trong DB la tieng Viet co dau, phai khop collation cua schema.
    charset: "utf8mb4",
    timezone: "local",
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, {
  schema: { ...schema, ...relations },
  mode: "default",
});
