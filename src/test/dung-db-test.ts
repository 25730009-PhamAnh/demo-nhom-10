import { execFileSync } from "node:child_process";

import { NGAY_CO_DINH } from "./ngay-co-dinh";

/**
 * Vitest globalSetup: dung lai CSDL kiem thu tu dau moi lan `npm test`, de
 * test nao cung chay tren dung mot bo du lieu mau. QLKS_SCRIPTS_DIR va
 * DATABASE_URL_TEST da duoc vitest.config.mts nap tu .env.local.
 */
export default function dungDbTest() {
  execFileSync("bash", ["scripts/db-test-setup.sh"], {
    stdio: "inherit",
    env: { ...process.env, DB_NGAY_CO_DINH: NGAY_CO_DINH },
  });
}
