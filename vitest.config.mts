import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

import { NGAY_CO_DINH } from "./src/test/ngay-co-dinh";

// Giong drizzle.config.ts: vitest khong tu doc .env.local.
config({ path: ".env.local" });

const urlTest = process.env.DATABASE_URL_TEST;
if (!urlTest) {
  throw new Error("Thieu DATABASE_URL_TEST trong .env.local (xem .env.example).");
}

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./src/test/rong.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globalSetup: ["./src/test/dung-db-test.ts"],
    // Test ghi (thao-tac/*) sua CSDL kiem thu dung chung, nen cac file chay
    // lan luot; moi file ghi tu nap lai du lieu mau (src/test/nap-lai-mau.ts).
    fileParallelism: false,
    // Tien trinh test dung CSDL kiem thu, khong bao gio dung CSDL dev.
    env: { DATABASE_URL: urlTest, DB_NGAY_CO_DINH: NGAY_CO_DINH },
  },
});
