# Nối CSDL — Phase 1: 9 màn hình đọc từ MySQL — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 9 màn hình của `Demo/` đọc dữ liệu thật từ MySQL `QuanLyKhachSan` thay cho `src/lib/mock/`, với dữ liệu mẫu tính theo ngày chạy để mở demo ngày nào cũng có khách nhận / trả phòng.

**Architecture:** Giữ nguyên mặt tiền `src/lib/queries/*` (chữ ký không đổi), chỉ thay thân hàm: Drizzle cho join thường, `callProcedure()` cho `sp_TraCuuPhongTrong`, `sp_BaoCaoDoanhThu`, `sp_DangNhap`. "Hôm nay" là `CURDATE()` của CSDL. Test là test tích hợp trên CSDL riêng `QuanLyKhachSan_test`, dựng lại từ `Scripts/setup_database/01`–`07` mỗi lần `npm test`, đồng hồ CSDL đóng băng ở 23/09/2026 10:00 bằng `SET timestamp`.

**Tech Stack:** Next.js 16.3.5 (App Router), React 19, Drizzle ORM 0.45 + mysql2 3.24, MySQL 9.7 (script viết cho 8.0.16+), Vitest 5, bash + `mysql` CLI.

**Spec:** `docs/superpowers/specs/2026-09-26-noi-csdl-phase-1-doc-design.md`

## Global Constraints

- AGENTS.md: Next 16 có thay đổi phá vỡ — đọc `node_modules/next/dist/docs/` trước khi viết code Next (đã đọc cho plan này: `connection()` ở `03-api-reference/04-functions/connection.md`).
- Chữ hiển thị trên giao diện: tiếng Việt có dấu. Chú thích trong code (TS và SQL): tiếng Việt **không dấu**, theo lối đang dùng trong `src/db/`.
- Không sửa tay `src/db/schema.ts` (sinh bằng `npm run db:pull`).
- Tiền luôn là chuỗi 2 chữ số thập phân như `DECIMAL(18,2)` (`"0.00"`, không phải `"0"`); ngày `'YYYY-MM-DD'`, ngày giờ `'YYYY-MM-DD HH:MM:SS'`.
- Mọi hàm `src/lib/queries/*` giữ tên, tham số, kiểu trả về; chỉ được **thêm** trường / hàm, trừ hai đổi đã duyệt: `giamTru` → `giamGia` (spec §2.6) và `dangNhapGia` / `NHAN_VIEN_MAC_DINH` → `dangNhap` / `getNhanVienMacDinh()` (spec §2.3).
- Thông báo lỗi nghiệp vụ = `"CSDL từ chối: " + MESSAGE_TEXT` của `SIGNAL 45000`, bỏ tiền tố `"Loi: "`; lỗi CSDL khác ném tiếp (spec §2.7).
- `Scripts/` nằm ngoài git (thư mục OneDrive), nhóm đang sửa song song: **sao lưu và đọc lại file ngay trước khi sửa**; chỉ chèn / thay đúng chỗ đã neo, không ghi đè cả file.
- Script SQL: chú thích không dấu, căn cột, xuống dòng LF, ASCII.
- **Không chạy `01_Create_Database.sql` vào CSDL dev `QuanLyKhachSan` khi chưa hỏi người dùng** (nó `DROP DATABASE`). Không chạy `08` (phase 3).
- Commit: thông điệp tiếng Việt không dấu dạng `feat: …` / `test: …` như lịch sử repo, kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Ô ngày trên form đặt phòng bị xóa trống hoặc sai định dạng** → `traCuuPhongTrongAnToan` phải trả `{ ok: false }`, không ném. MySQL trả lỗi `1292` (không phải `SIGNAL`) cho `''`, nên nếu không chặn trước thì `thongBaoCsdl` ném tiếp và Server Action vỡ. Test ở Task 5.
2. **Tháng trong kỳ 12 tháng không có hóa đơn nào** → vẫn đủ 12 cột, tháng trống là `"0.00"`. Dữ liệu mẫu tháng nào cũng có hóa đơn nên phải test bằng hàm gộp thuần. Test ở Task 8.
3. **Lỗi CSDL không phải lỗi nghiệp vụ** (mất kết nối, sai kiểu) → ném tiếp, không bị biến thành "CSDL từ chối: …". Test ở Task 3.
4. **Hóa đơn nháp chưa có khoản mục nào** (HD00000007, phiếu chưa đến ngày ở) → `khoanMuc` rỗng, `tongTien = "0.00"`, trang chi tiết không vỡ. Test ở Task 7.
5. **Mở app vào ngày khác mốc 23/09** → dữ liệu mẫu vẫn có đúng 12 lượt nhận / 9 lượt trả, không phiếu `HoanTat` nào ở tương lai. Test tự động chỉ chạy ở một mốc, nên Task 2 có bước kiểm tay ở hai ngày khác.

## Cấu trúc file

| File | Trách nhiệm |
|---|---|
| `scripts/db-test-setup.sh` *(mới)* | Dựng `QuanLyKhachSan_test` từ `Scripts/setup_database/01`–`07`, đổi tên CSDL trên luồng đọc, đóng băng ngày |
| `src/test/ngay-co-dinh.ts` *(mới)* | Hằng `NGAY_CO_DINH` dùng chung cho config và globalSetup |
| `src/test/dung-db-test.ts` *(mới)* | Vitest globalSetup gọi script trên |
| `src/test/rong.ts` *(mới)* | Module rỗng thay `server-only` khi test |
| `vitest.config.mts` | Nạp `.env.local`, alias, `globalSetup`, `env` của tiến trình test |
| `src/db/index.ts` | `dateStrings: true`; `SET timestamp` khi có `DB_NGAY_CO_DINH` |
| `src/db/loi.ts` *(mới)* | `thongBaoCsdl(err)` |
| `src/db/procedures.ts` | Chỉ sửa chú thích (hàm nay đã được dùng) |
| `src/db/index.test.ts`, `du-lieu-mau.test.ts`, `bao-cao.test.ts`, `loi.test.ts` *(mới)* | Test hạ tầng, dữ liệu mẫu, 5 thủ tục báo cáo, thông báo lỗi |
| `src/lib/queries/ngay.ts` *(mới)* | `getNgayHienTai()`, `getGioHienTai()` |
| `src/lib/queries/{rooms,bookings,customers,invoices,services,reports,accounts}.ts` | Thay thân hàm |
| `src/app/(auth)/login/actions.ts` *(mới)* | Server Action đăng nhập |
| `Scripts/setup_database/07_Sample_Data.sql` | Viết lại theo spec §3 |
| `Scripts/setup_database/06_Procedures.sql` | Chỉ khối chú thích số mong đợi của báo cáo |
| `src/lib/mock/` | Xóa ở Task 11 |

---

### Task 0: Tạo nhánh làm việc

- [ ] **Step 1: Tạo nhánh từ `main`**

```bash
cd /Users/anhpham/PA/UIT/Demo
git status --short
git switch -c noi-csdl-phase-1
```

Expected: `git status --short` không in gì (cây sạch), rồi `Switched to a new branch 'noi-csdl-phase-1'`.

---

### Task 1: Hạ tầng CSDL kiểm thử, ngày đóng băng

**Files:**
- Create: `scripts/db-test-setup.sh`, `src/test/ngay-co-dinh.ts`, `src/test/dung-db-test.ts`, `src/test/rong.ts`
- Modify: `vitest.config.mts`, `src/db/index.ts`, `.env.example`, `.env.local` (không commit)
- Test: `src/db/index.test.ts`

**Interfaces:**
- Consumes: không.
- Produces: `pool` và `db` của `@/db` trong test trỏ vào `QuanLyKhachSan_test`, `CURDATE()` = `'2026-09-23'`, `NOW()` = `'2026-09-23 10:00:00'`; `pool.query` trả DATE / DATETIME dạng chuỗi. Hằng `NGAY_CO_DINH = "2026-09-23 10:00:00"` (`src/test/ngay-co-dinh.ts`).

- [ ] **Step 1: Thêm biến môi trường**

Thêm vào cuối `.env.local` (file không commit; giữ nguyên dòng `DATABASE_URL` đang có):

```bash
cd /Users/anhpham/PA/UIT/Demo
cat >> .env.local <<'ENV'
QLKS_SCRIPTS_DIR="/Users/anhpham/Library/CloudStorage/OneDrive-TrườngĐHCNTT-UniversityofInformationTechnology/UIT/2026HK3/5 quản lý thông tin/Nhom 10/Đồ án/Scripts/setup_database"
DATABASE_URL_TEST="mysql://root:@127.0.0.1:3306/QuanLyKhachSan_test"
ENV
```

Thêm vào cuối `.env.example`:

```bash
cat >> .env.example <<'ENV'

# Kiem thu (npm test). CSDL test duoc DUNG LAI TU DAU moi lan chay test tu
# bo script cua nhom, nen KHONG BAO GIO duoc trung CSDL dev o tren.
# QLKS_SCRIPTS_DIR: thu muc chua 01_Create_Database.sql ... 07_Sample_Data.sql.
QLKS_SCRIPTS_DIR="/duong/dan/toi/Do an/Scripts/setup_database"
DATABASE_URL_TEST="mysql://root:@127.0.0.1:3306/QuanLyKhachSan_test"

# Chi dung khi kiem thu (vitest tu dat): dong bang CURDATE() / NOW() cua moi
# connection ve moc nay. Dev va production de trong.
# DB_NGAY_CO_DINH="2026-09-23 10:00:00"
ENV
```

- [ ] **Step 2: Viết `scripts/db-test-setup.sh`**

```bash
#!/usr/bin/env bash
# Dung CSDL kiem thu tu bo script cua nhom (Scripts/setup_database/01 - 07).
#
#   - Doc QLKS_SCRIPTS_DIR, DATABASE_URL_TEST, DB_NGAY_CO_DINH tu moi truong.
#     Vitest tu nap (vitest.config.mts). Chay tay:
#       set -a; source .env.local; set +a
#       DB_NGAY_CO_DINH='2026-09-23 10:00:00' bash scripts/db-test-setup.sh
#   - Doi ten CSDL QuanLyKhachSan -> ten trong DATABASE_URL_TEST ngay tren luong
#     doc vao; file goc cua nhom khong bi sua.
#   - Moi phien mysql dat SET timestamp ve DB_NGAY_CO_DINH, nen du lieu mau
#     (viet theo CURDATE()) luon ra dung mot bo.
#   - Tu choi chay neu ten CSDL test trung CSDL dev: file 01 co DROP DATABASE.
set -euo pipefail

: "${QLKS_SCRIPTS_DIR:?Thieu QLKS_SCRIPTS_DIR (xem .env.example)}"
: "${DATABASE_URL_TEST:?Thieu DATABASE_URL_TEST (xem .env.example)}"
: "${DB_NGAY_CO_DINH:?Thieu DB_NGAY_CO_DINH}"

MAU='^mysql://([^:@/]+)(:([^@]*))?@([^:/]+)(:([0-9]+))?/([A-Za-z0-9_]+)$'
if [[ ! "$DATABASE_URL_TEST" =~ $MAU ]]; then
  echo "DATABASE_URL_TEST phai co dang mysql://user:pass@host:port/ten_csdl" >&2
  exit 1
fi
NGUOI_DUNG="${BASH_REMATCH[1]}"
export MYSQL_PWD="${BASH_REMATCH[3]}"
MAY="${BASH_REMATCH[4]}"
CONG="${BASH_REMATCH[6]:-3306}"
TEN_CSDL="${BASH_REMATCH[7]}"

if [[ "$(printf '%s' "$TEN_CSDL" | tr '[:upper:]' '[:lower:]')" == "quanlykhachsan" ]]; then
  echo "DATABASE_URL_TEST dang tro vao CSDL dev QuanLyKhachSan - tu choi chay." >&2
  exit 1
fi

MYSQL_BIN="${MYSQL_BIN:-mysql}"
for f in 01_Create_Database 02_Functions 03_Views 04_Triggers 05_Cursors \
         06_Procedures 07_Sample_Data; do
  sed "s/QuanLyKhachSan/${TEN_CSDL}/g" "$QLKS_SCRIPTS_DIR/$f.sql" |
    "$MYSQL_BIN" -u"$NGUOI_DUNG" -h"$MAY" -P"$CONG" --default-character-set=utf8mb4 \
      --init-command="SET timestamp = UNIX_TIMESTAMP('$DB_NGAY_CO_DINH')" > /dev/null
done
echo "Da dung $TEN_CSDL, ngay dong bang $DB_NGAY_CO_DINH"
```

```bash
chmod +x scripts/db-test-setup.sh
```

- [ ] **Step 3: Chạy tay script, kiểm cả hai nhánh**

```bash
cd /Users/anhpham/PA/UIT/Demo
( set -a; source .env.local; set +a
  DB_NGAY_CO_DINH='2026-09-23 10:00:00' bash scripts/db-test-setup.sh )
mysql -uroot -h127.0.0.1 -N -e "SELECT COUNT(*) FROM QuanLyKhachSan_test.PHONG; SELECT COUNT(*) FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = 'QuanLyKhachSan_test';"
( set -a; source .env.local; set +a
  DATABASE_URL_TEST='mysql://root:@127.0.0.1:3306/QuanLyKhachSan' DB_NGAY_CO_DINH='2026-09-23 10:00:00' bash scripts/db-test-setup.sh ); echo "exit=$?"
```

Expected: dòng `Da dung QuanLyKhachSan_test, ngay dong bang 2026-09-23 10:00:00`; hai số `10` (bảng PHONG của `07` cũ) và `24` (19 thủ tục — 17 của `06` + 2 của `05` — và 5 hàm). Lệnh thứ ba in `DATABASE_URL_TEST dang tro vao CSDL dev QuanLyKhachSan - tu choi chay.` và `exit=1`. CSDL dev không bị đụng.

- [ ] **Step 4: Tạo ba file hỗ trợ test**

`src/test/ngay-co-dinh.ts`:

```ts
/**
 * Moc "hom nay" cua moi test: CURDATE() / NOW() cua CSDL kiem thu bi dong bang
 * ve day bang SET timestamp. Du lieu mau 07 viet theo CURDATE(), nen so lieu
 * mong doi trong test chi dung o moc nay.
 */
export const NGAY_CO_DINH = "2026-09-23 10:00:00";
```

`src/test/dung-db-test.ts`:

```ts
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
```

`src/test/rong.ts`:

```ts
// Thay cho goi "server-only" khi chay test: goi do nem loi neu bi import ngoai
// React Server Component, ma test chay trong Node thuan.
export {};
```

- [ ] **Step 5: Sửa `vitest.config.mts`** (thay toàn bộ nội dung)

```ts
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
    // Tien trinh test dung CSDL kiem thu, khong bao gio dung CSDL dev.
    env: { DATABASE_URL: urlTest, DB_NGAY_CO_DINH: NGAY_CO_DINH },
  },
});
```

- [ ] **Step 6: Viết test hỏng `src/db/index.test.ts`**

```ts
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
```

- [ ] **Step 7: Chạy test, xác nhận hỏng đúng lý do**

Run: `npx vitest run src/db/index.test.ts`
Expected: test 1 PASS; test 2 và 3 FAIL vì `r[0].ngay` là đối tượng `Date` của ngày thật (26/09/2026 trở đi), không phải chuỗi `'2026-09-23'`.

- [ ] **Step 8: Sửa `src/db/index.ts`** (thay toàn bộ nội dung)

```ts
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
```

- [ ] **Step 9: Chạy lại test và cả bộ test**

Run: `npx vitest run src/db/index.test.ts` → Expected: 3 passed.
Run: `npm test` → Expected: `Test Files 12 passed`, `Tests 83 passed` (80 test cũ vẫn chạy trên mock + 3 test mới), tiến trình tự thoát.

- [ ] **Step 10: Kiểm kiểu và lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: không lỗi.

- [ ] **Step 11: Commit**

```bash
git add scripts/db-test-setup.sh src/test vitest.config.mts src/db/index.ts src/db/index.test.ts .env.example
git commit -m "test: CSDL kiem thu dung tu Scripts 01-07, dong bang ngay 23/09/2026

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Dữ liệu mẫu `07` tính theo ngày chạy

**Files:**
- Modify (ngoài git): `$QLKS_SCRIPTS_DIR/07_Sample_Data.sql`; `$QLKS_SCRIPTS_DIR/06_Procedures.sql` (chỉ khối chú thích số mong đợi ở cuối file)
- Test: `src/db/du-lieu-mau.test.ts`, `src/db/bao-cao.test.ts`

**Interfaces:**
- Consumes: hạ tầng test của Task 1.
- Produces: CSDL test (và sau Task 12 là CSDL dev) có bộ dữ liệu dưới đây. Các task sau dựa vào đúng những con số này ở mốc 23/09/2026 10:00:
  - 42 phòng: `Trong` 5 · `DaDat` 15 · `DangSuDung` 10 · `DangDon` 10 · `BaoTri` 2. 60 khách. 88 phiếu. 76 hóa đơn.
  - Hôm nay 12 phiếu `DaDat` nhận phòng (DP00000011–22, phòng `103`…) và 9 phiếu `DangO` trả phòng (DP00000023–31). Có 10 phiếu `DangO` tính cả DP00000006, của 10 khách khác nhau.
  - Doanh thu hôm nay 50.530.000 trên 10 hóa đơn. 12 tháng 2025-10 … 2026-09; tháng 09 = 63.690.000.
  - DP00000006 ở từ 22/09 đến 25/09. DP00000007 (phòng `401`, Junior Suite) ở từ 12/10 đến 15/10.

Cách làm theo spec §3: 10 dòng gốc giữ nguyên ngày viết trong file và cộng thêm `@Lech = DATEDIFF(CURDATE(), '2026-09-16')`. Phần độn (phần B) viết thẳng theo `@HomNay`, bằng `INSERT … SELECT` từ CTE đệ quy cộng một bảng tạm. Toàn bộ SQL dưới đây đã chạy thử trên một CSDL nháp ở ba mốc 23/09/2026, 01/10/2026 và 01/03/2027.

- [ ] **Step 1: Viết test hỏng `src/db/du-lieu-mau.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import type { RowDataPacket } from "mysql2";

import { pool } from "@/db";

/** Chay mot cau SELECT tra ve dung mot con so. */
async function dem(cau: string): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(cau);
  return Number(Object.values(rows[0])[0]);
}

/**
 * Kiem du lieu mau Scripts/setup_database/07_Sample_Data.sql tren CSDL kiem
 * thu (hom nay dong bang 23/09/2026). Day la dieu kien de 9 man hinh co du
 * lieu ngay nao mo demo cung vay (spec phase 1 muc 3).
 */
describe("du lieu mau 07", () => {
  it("co 42 phong, 60 khach, 88 phieu dat, 76 hoa don", async () => {
    expect(await dem("SELECT COUNT(*) FROM PHONG")).toBe(42);
    expect(await dem("SELECT COUNT(*) FROM KHACH_HANG")).toBe(60);
    expect(await dem("SELECT COUNT(*) FROM PHIEU_DAT_PHONG")).toBe(88);
    expect(await dem("SELECT COUNT(*) FROM HOA_DON")).toBe(76);
  });

  it("hom nay co 12 luot nhan va 9 luot tra phong", async () => {
    expect(
      await dem("SELECT COUNT(*) FROM PHIEU_DAT_PHONG WHERE TrangThai = 'DaDat' AND NgayCheckIn = CURDATE()"),
    ).toBe(12);
    expect(
      await dem("SELECT COUNT(*) FROM PHIEU_DAT_PHONG WHERE TrangThai = 'DangO' AND NgayCheckOut = CURDATE()"),
    ).toBe(9);
  });

  it("10 dong goc dich theo moc 16/09: DP00000006 nhan phong hom qua, con o", async () => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT NgayCheckIn, NgayCheckOut, TrangThai FROM PHIEU_DAT_PHONG WHERE MaDatPhong = 'DP00000006'",
    );
    expect({ ...rows[0] }).toEqual({
      NgayCheckIn: "2026-09-22",
      NgayCheckOut: "2026-09-25",
      TrangThai: "DangO",
    });
  });

  it("dem phong theo trang thai", async () => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT TrangThai, COUNT(*) AS n FROM PHONG GROUP BY TrangThai ORDER BY TrangThai",
    );
    expect(rows.map((r) => [r.TrangThai, r.n])).toEqual([
      ["BaoTri", 2],
      ["DaDat", 15],
      ["DangDon", 10],
      ["DangSuDung", 10],
      ["Trong", 5],
    ]);
  });

  it("trang thai phong khop voi phieu, de nut nhan / tra phong o phase 2 chay duoc", async () => {
    const lech = (dieuKien: string) =>
      dem(`SELECT COUNT(*) FROM PHIEU_DAT_PHONG pd
           JOIN CHI_TIET_DAT_PHONG ct ON ct.MaDatPhong = pd.MaDatPhong
           JOIN PHONG p ON p.MaPhong = ct.MaPhong
           WHERE ${dieuKien}`);
    expect(await lech("pd.TrangThai = 'DangO' AND p.TrangThai <> 'DangSuDung'")).toBe(0);
    expect(
      await lech("pd.TrangThai = 'DaDat' AND pd.NgayCheckIn = CURDATE() AND p.TrangThai <> 'DaDat'"),
    ).toBe(0);
  });

  it("khong co hai phieu chua huy nao giu cung mot phong trong khoang ngay giao nhau", async () => {
    expect(
      await dem(`SELECT COUNT(*) FROM CHI_TIET_DAT_PHONG a
                 JOIN PHIEU_DAT_PHONG pa ON pa.MaDatPhong = a.MaDatPhong
                 JOIN CHI_TIET_DAT_PHONG b ON b.MaPhong = a.MaPhong AND b.MaDatPhong < a.MaDatPhong
                 JOIN PHIEU_DAT_PHONG pb ON pb.MaDatPhong = b.MaDatPhong
                 WHERE pa.TrangThai <> 'DaHuy' AND pb.TrangThai <> 'DaHuy'
                   AND pa.NgayCheckIn < pb.NgayCheckOut AND pb.NgayCheckIn < pa.NgayCheckOut`),
    ).toBe(0);
  });

  it("khong phieu HoanTat nao tra phong sau hom nay, khong phieu DaDat nao qua han", async () => {
    expect(
      await dem("SELECT COUNT(*) FROM PHIEU_DAT_PHONG WHERE TrangThai = 'HoanTat' AND NgayCheckOut > CURDATE()"),
    ).toBe(0);
    expect(
      await dem("SELECT COUNT(*) FROM PHIEU_DAT_PHONG WHERE TrangThai = 'DaDat' AND NgayCheckIn < CURDATE()"),
    ).toBe(0);
  });

  it("TongTien moi hoa don bang tong khoan muc", async () => {
    expect(
      await dem(`SELECT COUNT(*) FROM (
                   SELECT hd.MaHoaDon FROM HOA_DON hd
                   JOIN CHI_TIET_HOA_DON ct ON ct.MaHoaDon = hd.MaHoaDon
                   GROUP BY hd.MaHoaDon, hd.TongTien
                   HAVING GREATEST(SUM(ct.SoTien), 0) <> hd.TongTien) x`),
    ).toBe(0);
  });

  it("12 thang gan nhat thang nao cung co hoa don da thanh toan", async () => {
    expect(
      await dem(`SELECT COUNT(DISTINCT DATE_FORMAT(NgayLap, '%Y-%m')) FROM HOA_DON
                 WHERE TrangThai = 'DaThanhToan'
                   AND NgayLap >= DATE_FORMAT(CURDATE() - INTERVAL 11 MONTH, '%Y-%m-01')`),
    ).toBe(12);
  });
});
```

- [ ] **Step 2: Viết test hỏng `src/db/bao-cao.test.ts`** (thay bộ 21 ca kiểm báo cáo viết bằng bash lúc thêm báo cáo, vốn nằm ngoài repo)

```ts
import { describe, expect, it } from "vitest";
import type { RowDataPacket } from "mysql2";

import { pool } from "@/db";

/**
 * Kiem 5 thu tuc bao cao (thu tuc 13 - 17 cua 06_Procedures.sql) tren du lieu
 * mau 07, hom nay dong bang 23/09/2026. So mong doi dung nhu khoi chu thich
 * cuoi file 06.
 */

/** CALL mot thu tuc, tra ve result set dau tien. */
async function goi(cau: string): Promise<Record<string, unknown>[]> {
  const [kq] = await pool.query<RowDataPacket[][]>(cau);
  return kq[0].map((r) => ({ ...r }));
}

const LOI_KY = "Tu ngay phai nho hon hoac bang den ngay";

describe("sp_BaoCaoDoanhThu", () => {
  it("toan bo: du 12 thang, thang 09/2026 = 63.690.000", async () => {
    const ds = await goi("CALL sp_BaoCaoDoanhThu(NULL, NULL)");
    expect(ds.map((d) => d.Thang)).toEqual([
      "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03",
      "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09",
    ]);
    expect(ds.at(-1)).toEqual({
      Thang: "2026-09", SoHoaDon: 14, TienPhong: "51060000.00", DichVu: "12630000.00",
      PhuThu: "0.00", GiamGia: "0.00", DoanhThuThuan: "63690000.00",
    });
  });

  it("thang co phu thu va giam gia (01/2026) cong ca hai vao doanh thu thuan", async () => {
    const ds = await goi("CALL sp_BaoCaoDoanhThu('2026-01-01', '2026-01-31')");
    expect(ds).toEqual([{
      Thang: "2026-01", SoHoaDon: 5, TienPhong: "8700000.00", DichVu: "5210000.00",
      PhuThu: "100000.00", GiamGia: "-100000.00", DoanhThuThuan: "13910000.00",
    }]);
  });

  it("DenNgay tinh tron ngay: hoa don lap 11:15 hom nay van duoc tinh", async () => {
    const ds = await goi("CALL sp_BaoCaoDoanhThu('2026-09-23', '2026-09-23')");
    expect(ds).toEqual([{
      Thang: "2026-09", SoHoaDon: 10, TienPhong: "43100000.00", DichVu: "7430000.00",
      PhuThu: "0.00", GiamGia: "0.00", DoanhThuThuan: "50530000.00",
    }]);
  });

  it("bao loi khi TuNgay > DenNgay", async () => {
    await expect(goi("CALL sp_BaoCaoDoanhThu('2026-09-30', '2026-09-01')")).rejects.toThrow(LOI_KY);
  });
});

describe("sp_BaoCaoCongSuat", () => {
  it("thang 09/2026: 56 / 1260 dem, cong suat 4,44%", async () => {
    expect(await goi("CALL sp_BaoCaoCongSuat('2026-09-01', '2026-09-30')")).toEqual([{
      Thang: "2026-09", SoNgay: 30, DemKhaDung: 1260, DemBan: "56", CongSuatPhanTram: "4.44",
      DoanhThuPhong: "114230000.00", ADR: "2039821.43", RevPAR: "90658.73",
    }]);
  });

  it("phieu vat qua hai thang tach dung dem va tien ve tung thang", async () => {
    const conn = await pool.getConnection();
    try {
      const cau = "CALL sp_BaoCaoCongSuat('2026-01-01', '2026-02-28')";
      const [truocKq] = await conn.query<RowDataPacket[][]>(cau);
      const truoc = truocKq[0];

      await conn.beginTransaction();
      // Phieu thu: 30/01 -> 02/02, 3 dem x 6.000.000 tren phong PRES-01.
      await conn.query(`INSERT INTO PHIEU_DAT_PHONG
          (MaDatPhong, MaKH, MaTK, NgayLap, NgayCheckIn, NgayCheckOut, TienCoc, TrangThai)
        VALUES ('DPTEST0001', 'KH00000001', 'TK00000002', '2026-01-20 09:00:00',
                '2026-01-30', '2026-02-02', 0, 'HoanTat')`);
      await conn.query(`INSERT INTO CHI_TIET_DAT_PHONG (MaDatPhong, MaPhong, GiaThueThoiDiem, SoDem)
        VALUES ('DPTEST0001', 'PH00000010', 6000000.00, 3)`);
      const [sauKq] = await conn.query<RowDataPacket[][]>(cau);
      const sau = sauKq[0];
      await conn.rollback();

      const tang = (i: number, cot: string) => Number(sau[i][cot]) - Number(truoc[i][cot]);
      expect([truoc[0].Thang, truoc[1].Thang]).toEqual(["2026-01", "2026-02"]);
      expect([tang(0, "DemBan"), tang(1, "DemBan")]).toEqual([2, 1]);
      expect([tang(0, "DoanhThuPhong"), tang(1, "DoanhThuPhong")]).toEqual([12_000_000, 6_000_000]);

      const [con] = await conn.query<RowDataPacket[]>(
        "SELECT COUNT(*) AS n FROM PHIEU_DAT_PHONG WHERE MaDatPhong = 'DPTEST0001'",
      );
      expect(con[0].n).toBe(0);
    } finally {
      conn.release();
    }
  });

  it("bao loi khi TuNgay > DenNgay", async () => {
    await expect(goi("CALL sp_BaoCaoCongSuat('2026-09-30', '2026-09-01')")).rejects.toThrow(LOI_KY);
  });
});

describe("sp_BaoCaoKhachHang", () => {
  it("toan bo: 54 khach co luu tru, 18 khach quay lai, chi tieu cao nhat KH00000040", async () => {
    const ds = await goi("CALL sp_BaoCaoKhachHang(NULL, NULL)");
    expect(ds).toHaveLength(54);
    expect(ds.filter((k) => k.KhachQuayLai === 1)).toHaveLength(18);
    expect(ds[0]).toEqual({
      MaKH: "KH00000040", HoTen: "Ho Hai Dung", SoLanLuuTru: 2, TongSoDem: "4",
      TongChiTieu: "18500000.00", ChiTieuTBMoiLan: "9250000.00", LanGanNhat: "2026-09-21",
      KhachQuayLai: 1,
    });
  });

  it("khach dang o chua thanh toan thi chi tieu 0", async () => {
    const ds = await goi("CALL sp_BaoCaoKhachHang(NULL, NULL)");
    expect(ds.find((k) => k.MaKH === "KH00000006")?.TongChiTieu).toBe("0.00");
  });

  it("bao loi khi TuNgay > DenNgay", async () => {
    await expect(goi("CALL sp_BaoCaoKhachHang('2026-09-30', '2026-09-01')")).rejects.toThrow(LOI_KY);
  });
});

describe("sp_BaoCaoBuongPhong", () => {
  it("toan bo: du 42 phong, PRES-01 chi phi sua cao nhat", async () => {
    const ds = await goi("CALL sp_BaoCaoBuongPhong(NULL, NULL)");
    expect(ds).toHaveLength(42);
    expect(ds[0]).toMatchObject({ SoPhong: "PRES-01", TongChiPhiSua: "1500000.00" });
  });

  it("ky khong phat sinh gi van du 42 phong, moi so bang 0", async () => {
    const ds = await goi("CALL sp_BaoCaoBuongPhong('2030-01-01', '2030-01-31')");
    expect(ds).toHaveLength(42);
    expect(ds.every((p) => p.SoLanDon === 0 && p.SoLanSua === 0 && p.TongChiPhiSua === "0.00")).toBe(true);
  });

  it("DenNgay tinh tron ngay: lan don 12:00 hom nay cua phong 301 van duoc dem", async () => {
    const ds = await goi("CALL sp_BaoCaoBuongPhong('2026-09-23', '2026-09-23')");
    expect(ds.find((p) => p.SoPhong === "301")?.SoLanDon).toBe(1);
  });

  it("bao loi khi TuNgay > DenNgay", async () => {
    await expect(goi("CALL sp_BaoCaoBuongPhong('2026-09-30', '2026-09-01')")).rejects.toThrow(LOI_KY);
  });
});

describe("sp_BaoCaoCongNo", () => {
  it("10 hoa don con phai thu: HD00000006 ton lau nhat, roi 9 hoa don nhap sang nay", async () => {
    const ds = await goi("CALL sp_BaoCaoCongNo(NULL, CURDATE())");
    expect(ds.map((d) => d.MaHoaDon)).toEqual([
      "HD00000006", "HD00000023", "HD00000024", "HD00000025", "HD00000026",
      "HD00000027", "HD00000028", "HD00000029", "HD00000030", "HD00000031",
    ]);
    expect(ds[0]).toMatchObject({ ConPhaiThu: "2760000.00", TienCocDaTru: "2760000.00", SoNgayTon: 1 });
  });

  it("hoa don lap sau DenNgay khong xuat hien", async () => {
    expect(await goi("CALL sp_BaoCaoCongNo(NULL, '2026-09-21')")).toEqual([]);
  });

  it("DenNgay tinh tron ngay: hoa don lap 14:00 ngay 22/09 co mat, ton 0 ngay", async () => {
    const ds = await goi("CALL sp_BaoCaoCongNo(NULL, '2026-09-22')");
    expect(ds.map((d) => [d.MaHoaDon, d.SoNgayTon])).toEqual([["HD00000006", 0]]);
  });

  it("bao loi khi TuNgay > DenNgay", async () => {
    await expect(goi("CALL sp_BaoCaoCongNo('2026-09-30', '2026-09-01')")).rejects.toThrow(LOI_KY);
  });
});
```

- [ ] **Step 3: Chạy, xác nhận hỏng vì dữ liệu cũ**

Run: `npx vitest run src/db/du-lieu-mau.test.ts src/db/bao-cao.test.ts`
Expected: FAIL, ví dụ `expected 10 to be 42` (PHONG), `expected 0 to be 12` (nhận hôm nay), và số tháng / số tiền của báo cáo lệch.

- [ ] **Step 4: Sao lưu hai file của nhóm, đọc lại ngay trước khi sửa**

```bash
cd /Users/anhpham/PA/UIT/Demo
set -a; source .env.local; set +a
BK=$(mktemp -d); echo "Sao luu o $BK"
cp "$QLKS_SCRIPTS_DIR/06_Procedures.sql" "$QLKS_SCRIPTS_DIR/07_Sample_Data.sql" "$BK/"
ls -la "$QLKS_SCRIPTS_DIR"
grep -n "START TRANSACTION;\|^COMMIT;\|^SET NAMES\|Nap sau khi da co trigger" "$QLKS_SCRIPTS_DIR/07_Sample_Data.sql"
grep -n "So lieu mong doi cua bao cao" "$QLKS_SCRIPTS_DIR/06_Procedures.sql"
```

Expected: mỗi chỗ neo xuất hiện đúng một lần: `SET NAMES utf8mb4;`, dòng `-- Nap sau khi da co trigger…`, `START TRANSACTION;`, `COMMIT;` trong `07`, và dòng `So lieu mong doi` trong `06`. Nếu `07` đã có `@Lech` (có người sửa trước) hoặc thiếu chỗ neo: dừng lại, báo người dùng.

- [ ] **Step 5: Tạo ba file đầu vào cho bước biến đổi** (trong thư mục sao lưu `$BK`)

`$BK/phan_b.sql` — phần độn, chèn ngay trước `COMMIT;`:

```sql

-- =====================================================================
-- B. DON THEM CHO DEMO. Viet thang theo @HomNay.
--    42 phong, 60 khach; 12 luot nhan va 9 luot tra phong hom nay; 9 phieu
--    da tra va thanh toan sang nay; 48 phieu lich su, moi tuan mot phieu.
-- =====================================================================

-- B1. KHACH_HANG: 50 dong KH00000011 - KH00000060, ten ghep tu ho / dem / ten.
INSERT INTO KHACH_HANG (MaKH, HoTen, CCCD, SDT, Email)
WITH RECURSIVE so (n) AS (
    SELECT 11 UNION ALL SELECT n + 1 FROM so WHERE n < 60
)
SELECT CONCAT('KH', LPAD(n, 8, '0')),
       CONCAT_WS(' ',
           ELT((n - 11)     MOD 10 + 1, 'Nguyen', 'Tran', 'Le', 'Pham', 'Hoang',
                                        'Vo', 'Dang', 'Bui', 'Do', 'Ho'),
           ELT((n - 11) * 3 MOD 10 + 1, 'Thi', 'Van', 'Minh', 'Ngoc', 'Gia',
                                        'Quoc', 'Thanh', 'Hai', 'Anh', 'Kim'),
           ELT((n - 11) * 7 MOD 10 + 1, 'An', 'Binh', 'Chi', 'Dung', 'Giang',
                                        'Ha', 'Khanh', 'Linh', 'Mai', 'Nam')),
       CONCAT('0793', LPAD(n, 8, '0')),
       CONCAT('09', 10000000 + n),
       CONCAT('khach', n, '@example.com')
FROM   so;

-- B2. PHONG: 32 dong PH00000011 - PH00000042, tang 1-4 so x03 - x10, loai
--     xoay vong LP01 - LP10. Trang thai khop voi phieu o B3.
INSERT INTO PHONG (MaPhong, MaLoaiPhong, SoPhong, Tang, TrangThai)
WITH RECURSIVE so (n) AS (
    SELECT 11 UNION ALL SELECT n + 1 FROM so WHERE n < 42
)
SELECT CONCAT('PH', LPAD(n, 8, '0')),
       CONCAT('LP', LPAD((n - 11) MOD 10 + 1, 8, '0')),
       CONCAT((n - 11) DIV 8 + 1, LPAD((n - 11) MOD 8 + 3, 2, '0')),
       (n - 11) DIV 8 + 1,
       CASE WHEN n <= 22 THEN 'DaDat'        -- nhom 1: khach nhan hom nay
            WHEN n <= 31 THEN 'DangSuDung'   -- nhom 2: khach tra hom nay
            WHEN n <= 40 THEN 'DangDon'      -- nhom 3: khach vua tra sang nay
            ELSE              'Trong'
       END
FROM   so;

-- B3. Bang tam gom moi phieu don them, dung chung cho B4 - B8.
--     So hieu phieu: nhom 1 = 11-22, nhom 2 = 23-31, nhom 4 = 32-79,
--     nhom 3 = 90-98 (giu dung so hieu cua du lieu gia trong Demo).
DROP TEMPORARY TABLE IF EXISTS tmp_PhieuMau;
CREATE TEMPORARY TABLE tmp_PhieuMau AS
WITH RECURSIVE so (n) AS (
    SELECT 0 UNION ALL SELECT n + 1 FROM so WHERE n < 47
),
phieu AS (
    -- Nhom 1: 12 phieu DaDat nhan phong hom nay.
    SELECT 11 + n AS SoHieu, 11 + n AS SoKH, 11 + n AS SoPhong,
           @HomNay AS NgayIn, 2 + n MOD 3 AS SoDem, 'DaDat' AS TrangThai
    FROM   so WHERE n < 12
    UNION  ALL
    -- Nhom 2: 9 phieu DangO tra phong hom nay.
    SELECT 23 + n, 23 + n, 23 + n,
           @HomNay - INTERVAL (2 + n MOD 3) DAY, 2 + n MOD 3, 'DangO'
    FROM   so WHERE n < 9
    UNION  ALL
    -- Nhom 3: 9 phieu HoanTat, tra phong va thanh toan sang nay.
    SELECT 90 + n, 32 + n, 32 + n,
           @HomNay - INTERVAL 2 DAY, 2, 'HoanTat'
    FROM   so WHERE n < 9
    UNION  ALL
    -- Nhom 4: 48 phieu HoanTat lich su, moi tuan mot phieu lui dan tu hom
    --         nay. Phong PH32 - PH42 lap lai sau 11 phieu (77 ngay) nen khong
    --         bao gio trung ngay, ke ca voi nhom 3.
    SELECT 32 + n, 11 + (32 + n) MOD 50, 32 + (32 + n) MOD 11,
           @HomNay - INTERVAL (10 + 7 * n) DAY, 2, 'HoanTat'
    FROM   so
)
SELECT p.SoHieu,
       CONCAT('DP', LPAD(p.SoHieu, 8, '0'))   AS MaDatPhong,
       CONCAT('KH', LPAD(p.SoKH,   8, '0'))   AS MaKH,
       ph.MaPhong,
       ph.SoPhong,
       p.NgayIn,
       p.NgayIn + INTERVAL p.SoDem DAY         AS NgayOut,
       p.SoDem,
       p.TrangThai,
       lp.DonGiaNgay                           AS DonGia,
       CONCAT('DV', LPAD(p.SoHieu MOD 10 + 1, 8, '0')) AS MaDV,
       1 + p.SoHieu MOD 3                      AS SoLuongDV
FROM   phieu      p
JOIN   PHONG      ph ON ph.MaPhong     = CONCAT('PH', LPAD(p.SoPhong, 8, '0'))
JOIN   LOAI_PHONG lp ON lp.MaLoaiPhong = ph.MaLoaiPhong;

-- B4. PHIEU_DAT_PHONG: 78 dong. Coc truoc mot dem, lap phieu truoc 7 ngay.
INSERT INTO PHIEU_DAT_PHONG
    (MaDatPhong, MaKH, MaTK, NgayLap, NgayCheckIn, NgayCheckOut, TienCoc, TrangThai)
SELECT MaDatPhong,
       MaKH,
       IF(SoHieu MOD 2 = 0, 'TK00000002', 'TK00000003'),
       TIMESTAMP(NgayIn - INTERVAL 7 DAY, '09:00:00'),
       NgayIn,
       NgayOut,
       DonGia,
       TrangThai
FROM   tmp_PhieuMau
ORDER  BY SoHieu;

-- B5. CHI_TIET_DAT_PHONG: 78 dong, moi phieu mot phong, gia = DonGiaNgay.
INSERT INTO CHI_TIET_DAT_PHONG (MaDatPhong, MaPhong, GiaThueThoiDiem, SoDem)
SELECT MaDatPhong, MaPhong, DonGia, SoDem
FROM   tmp_PhieuMau
ORDER  BY SoHieu;

-- B6. SU_DUNG_DICH_VU: moi phieu DangO / HoanTat mot dong, toi ngay nhan phong.
--     DonGiaThoiDiem = 0 de trg_SDDV_TinhThanhTien chot gia tu DICH_VU.
INSERT INTO SU_DUNG_DICH_VU
    (MaSuDungDV, MaDatPhong, MaDV, NgaySuDung, SoLuong, DonGiaThoiDiem)
SELECT CONCAT('SD', LPAD(SoHieu, 8, '0')),
       MaDatPhong,
       MaDV,
       TIMESTAMP(NgayIn, '19:00:00'),
       SoLuongDV,
       0
FROM   tmp_PhieuMau
WHERE  TrangThai IN ('DangO', 'HoanTat')
ORDER  BY SoHieu;

-- B7. HOA_DON: moi phieu DangO / HoanTat mot hoa don. Phieu DangO: hoa don
--     nhap lap sang nay. Phieu HoanTat: da thanh toan luc tra phong.
--     TongTien de 0, trg_CTHD_CapNhatTongTien tinh lai o B8.
INSERT INTO HOA_DON
    (MaHoaDon, MaDatPhong, NgayLap, TongTien, LoaiThanhToan, TrangThai)
SELECT CONCAT('HD', LPAD(SoHieu, 8, '0')),
       MaDatPhong,
       CASE WHEN TrangThai = 'DangO'  THEN TIMESTAMP(@HomNay, '08:00:00')
            WHEN NgayOut   = @HomNay  THEN TIMESTAMP(NgayOut, '09:00:00')
            ELSE                           TIMESTAMP(NgayOut, '11:00:00')
       END,
       0,
       IF(TrangThai = 'HoanTat',
          ELT(SoHieu MOD 3 + 1, 'TienMat', 'ChuyenKhoan', 'The'), NULL),
       IF(TrangThai = 'HoanTat', 'DaThanhToan', 'ChuaThanhToan')
FROM   tmp_PhieuMau
WHERE  TrangThai IN ('DangO', 'HoanTat')
ORDER  BY SoHieu;

-- B8. CHI_TIET_HOA_DON: TienPhong, DichVu, roi GiamTru = - tien coc.
INSERT INTO CHI_TIET_HOA_DON (MaCTHD, MaHoaDon, LoaiKhoanMuc, SoTien, GhiChu)
SELECT CONCAT('CT', LPAD(t.SoHieu * 10 + 1, 8, '0')),
       CONCAT('HD', LPAD(t.SoHieu, 8, '0')),
       'TienPhong',
       ct.ThanhTien,
       CONCAT('Phong ', t.SoPhong, ': ', t.SoDem, ' dem')
FROM   tmp_PhieuMau       t
JOIN   CHI_TIET_DAT_PHONG ct ON ct.MaDatPhong = t.MaDatPhong
WHERE  t.TrangThai IN ('DangO', 'HoanTat');

INSERT INTO CHI_TIET_HOA_DON (MaCTHD, MaHoaDon, LoaiKhoanMuc, SoTien, GhiChu)
SELECT CONCAT('CT', LPAD(t.SoHieu * 10 + 2, 8, '0')),
       CONCAT('HD', LPAD(t.SoHieu, 8, '0')),
       'DichVu',
       sd.ThanhTien,
       dv.TenDV
FROM   tmp_PhieuMau    t
JOIN   SU_DUNG_DICH_VU sd ON sd.MaSuDungDV = CONCAT('SD', LPAD(t.SoHieu, 8, '0'))
JOIN   DICH_VU         dv ON dv.MaDV       = sd.MaDV;

INSERT INTO CHI_TIET_HOA_DON (MaCTHD, MaHoaDon, LoaiKhoanMuc, SoTien, GhiChu)
SELECT CONCAT('CT', LPAD(t.SoHieu * 10 + 3, 8, '0')),
       CONCAT('HD', LPAD(t.SoHieu, 8, '0')),
       'GiamTru',
       -pd.TienCoc,
       CONCAT('Tru tien coc cua phieu ', t.MaDatPhong)
FROM   tmp_PhieuMau    t
JOIN   PHIEU_DAT_PHONG pd ON pd.MaDatPhong = t.MaDatPhong
WHERE  t.TrangThai IN ('DangO', 'HoanTat');

-- B9. DON_PHONG / SUA_PHONG: hom qua va hom nay, de nhat ky buong phong co
--     dong. SUA0000011 chua co chi phi = su co dang xu ly.
INSERT INTO DON_PHONG (MaDon, MaPhong, MaTK, ThoiGian, GhiChu) VALUES
('DON0000011', 'PH00000023', 'TK00000004', TIMESTAMP(@HomNay, '09:50:00'),                   'Don phong sau khi khach tra'),
('DON0000012', 'PH00000024', 'TK00000005', TIMESTAMP(@HomNay, '10:15:00'),                   'Thay ga giuong va khan tam'),
('DON0000013', 'PH00000011', 'TK00000004', TIMESTAMP(@HomNay, '08:30:00'),                   'Chuan bi phong don khach trong ngay'),
('DON0000014', 'PH00000012', 'TK00000005', TIMESTAMP(@HomNay, '08:45:00'),                   'Chuan bi phong don khach trong ngay'),
('DON0000015', 'PH00000025', 'TK00000004', TIMESTAMP(@HomNay - INTERVAL 1 DAY, '14:20:00'), 'Ve sinh dinh ky'),
('DON0000016', 'PH00000026', 'TK00000005', TIMESTAMP(@HomNay - INTERVAL 1 DAY, '15:00:00'), 'Bo sung minibar');

INSERT INTO SUA_PHONG (MaSua, MaPhong, MaTK, ThoiGian, ChiPhi, MoTaLoi) VALUES
('SUA0000011', 'PH00000027', 'TK00000006', TIMESTAMP(@HomNay, '08:10:00'),                        0.00, 'May lanh khong chay, dang kiem tra'),
('SUA0000012', 'PH00000028', 'TK00000006', TIMESTAMP(@HomNay - INTERVAL 1 DAY, '16:30:00'), 320000.00, 'Thay voi sen phong tam');

DROP TEMPORARY TABLE tmp_PhieuMau;
```

`$BK/kiem_tra_07.sql` — khối Kiểm tra mới, nối vào cuối file:

```sql

-- Kiem tra phan B. Mong doi, chay ngay nao cung vay: 42 | 60 | 12 | 9 | 0 | 0.
SELECT (SELECT COUNT(*) FROM PHONG)                                AS SoPhong,
       (SELECT COUNT(*) FROM KHACH_HANG)                           AS SoKhach,
       (SELECT COUNT(*) FROM PHIEU_DAT_PHONG
        WHERE  TrangThai = 'DaDat'   AND NgayCheckIn  = CURDATE()) AS NhanHomNay,
       (SELECT COUNT(*) FROM PHIEU_DAT_PHONG
        WHERE  TrangThai = 'DangO'   AND NgayCheckOut = CURDATE()) AS TraHomNay,
       (SELECT COUNT(*) FROM PHIEU_DAT_PHONG
        WHERE  TrangThai = 'HoanTat' AND NgayCheckOut > CURDATE()) AS HoanTatTuongLai,
       (SELECT COUNT(*) FROM PHIEU_DAT_PHONG
        WHERE  TrangThai = 'DaDat'   AND NgayCheckIn  < CURDATE()) AS DaDatQuaHan;

-- Kiem tra doanh thu hom nay. Mong doi, chay ngay nao cung vay: 1 dong,
-- 10 hoa don, doanh thu thuan 50.530.000.
CALL sp_BaoCaoDoanhThu(CURDATE(), CURDATE());
```

`$BK/bien_doi_07.py`:

```python
"""Viet lai 07_Sample_Data.sql theo spec phase 1 muc 3.

Chay: python3 bien_doi_07.py <duong-dan-07> <file-phan-B> <file-kiem-tra>
Sua tai cho, chi them / thay dung nhung cho da neo; cho neo nao khong thay
dung mot lan thi dung lai, khong ghi gi.
"""
import re
import sys

duong_dan, file_b, file_kt = sys.argv[1:4]
s = open(duong_dan, encoding="utf-8").read()
phan_b = open(file_b, encoding="utf-8").read()
kiem_tra = open(file_kt, encoding="utf-8").read()


def thay_mot_lan(s, cu, moi):
    if s.count(cu) != 1:
        sys.exit(f"Khong thay dung mot cho neo: {cu[:60]!r} (thay {s.count(cu)} lan)")
    return s.replace(cu, moi)


# 1. Giai thich cach tinh ngay ngay duoi dau file.
s = thay_mot_lan(
    s,
    "-- Nap sau khi da co trigger: du lieu mau di qua dung cac rang buoc that.\n",
    "-- Nap sau khi da co trigger: du lieu mau di qua dung cac rang buoc that.\n"
    "--\n"
    "-- Ngay thang tinh theo ngay chay script, de mo demo ngay nao cung co khach\n"
    "-- nhan / tra phong hom nay:\n"
    "--   A. 10 dong goc moi bang: ngay viet theo moc 16/09/2026, cong them @Lech\n"
    "--      = so ngay tu moc do den hom nay. Chay dung ngay 16/09/2026 thi ra\n"
    "--      nguyen ban cu.\n"
    "--   B. Phan don them cho demo: viet thang theo @HomNay = CURDATE().\n"
    "-- Can mot bo so co dinh (kiem thu, so trong bao cao) thi chay truoc\n"
    "--     SET timestamp = UNIX_TIMESTAMP('2026-09-23 10:00:00');\n"
    "-- de CURDATE() = 23/09/2026; cac khoi Kiem tra cuoi file ghi so theo ngay do.\n",
)

# 2a. Chuoi sinh bang CONCAT o phan B phai cung collation voi bang (file 01),
#     neu khong so sanh voi cot CHAR bi loi 1267.
s = thay_mot_lan(
    s,
    "SET NAMES utf8mb4;\n",
    "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;   -- cung collation voi file 01\n",
)

# 2. Hai bien moc ngay, dat truoc giao dich.
s = thay_mot_lan(
    s,
    "\nSTART TRANSACTION;\n",
    "\nSET @HomNay = CURDATE();\n"
    "SET @Lech   = DATEDIFF(@HomNay, '2026-09-16');\n"
    "\nSTART TRANSACTION;\n"
    "\n-- =====================================================================\n"
    "-- A. 10 DONG GOC MOI BANG. Ngay theo moc 16/09/2026, dich them @Lech ngay.\n"
    "-- =====================================================================\n",
)

# 3. Dich moi ngay trong cac dong VALUES cua phan A (dong bat dau bang '(').
dau, giua = s.split("\nSTART TRANSACTION;\n", 1)
than, cuoi = giua.split("\nCOMMIT;\n", 1)
NGAY = re.compile(r"'(\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2}:\d{2})?)'")
dong_moi = []
so_ngay = 0
for dong in than.split("\n"):
    if dong.startswith("("):
        dong, n = NGAY.subn(r"'\1' + INTERVAL @Lech DAY", dong)
        so_ngay += n
    dong_moi.append(dong)
than = "\n".join(dong_moi)

# 4. Phan B ngay truoc COMMIT, khoi Kiem tra moi o cuoi file.
s = dau + "\nSTART TRANSACTION;\n" + than + phan_b + "\nCOMMIT;\n" + cuoi.rstrip("\n") + "\n" + kiem_tra
open(duong_dan, "w", encoding="utf-8", newline="\n").write(s)
print(f"Da dich {so_ngay} gia tri ngay o phan A")
```

`$BK/sua_06.py`:

```python
"""Cap nhat khoi so lieu mong doi cua 5 bao cao o cuoi 06_Procedures.sql.

Chay: python3 sua_06.py <duong-dan-06>
"""
import sys

p = sys.argv[1]
s = open(p, encoding="utf-8").read()
cu = """-- So lieu mong doi cua bao cao voi du lieu mau file 07:
--   sp_BaoCaoDoanhThu(NULL, NULL)                  4 thang, T09/2026 = 8.560.000
--   sp_BaoCaoCongSuat('2026-09-01', '2026-09-30')  7 / 300 dem, cong suat 2,33%
--   sp_BaoCaoKhachHang(NULL, NULL)                 6 khach, cao nhat KH00000004
--   sp_BaoCaoBuongPhong(NULL, NULL)                PRES-01 chi phi sua cao nhat
--   sp_BaoCaoCongNo(NULL, CURDATE())               1 hoa don: HD00000006
"""
moi = """-- So lieu mong doi cua bao cao voi du lieu mau file 07, nap sau
--     SET timestamp = UNIX_TIMESTAMP('2026-09-23 10:00:00');
--   sp_BaoCaoDoanhThu(NULL, NULL)                  12 thang 2025-10 - 2026-09, T09/2026 = 63.690.000
--   sp_BaoCaoCongSuat('2026-09-01', '2026-09-30')  56 / 1260 dem, cong suat 4,44%
--   sp_BaoCaoKhachHang(NULL, NULL)                 54 khach, 18 khach quay lai, cao nhat KH00000040
--   sp_BaoCaoBuongPhong(NULL, NULL)                42 phong, PRES-01 chi phi sua cao nhat
--   sp_BaoCaoCongNo(NULL, CURDATE())               10 hoa don: HD00000006 va HD00000023 - HD00000031
"""
if s.count(cu) != 1:
    sys.exit(f"Khong thay dung mot khoi so lieu mong doi cu (thay {s.count(cu)} lan)")
open(p, "w", encoding="utf-8", newline="\n").write(s.replace(cu, moi))
print("Da cap nhat khoi so lieu mong doi")
```

- [ ] **Step 6: Biến đổi `07` và `06`, rồi đối chiếu với bản sao lưu**

```bash
python3 "$BK/bien_doi_07.py" "$QLKS_SCRIPTS_DIR/07_Sample_Data.sql" "$BK/phan_b.sql" "$BK/kiem_tra_07.sql"
python3 "$BK/sua_06.py" "$QLKS_SCRIPTS_DIR/06_Procedures.sql"
diff "$BK/07_Sample_Data.sql" "$QLKS_SCRIPTS_DIR/07_Sample_Data.sql" > "$BK/07.diff"; echo "07: xoa=$(grep -c '^<' "$BK/07.diff") them=$(grep -c '^>' "$BK/07.diff")"
diff "$BK/06_Procedures.sql" "$QLKS_SCRIPTS_DIR/06_Procedures.sql" | grep -c '^[<>]'
file "$QLKS_SCRIPTS_DIR/07_Sample_Data.sql"; LC_ALL=C grep -c '[^ -~]' "$QLKS_SCRIPTS_DIR/07_Sample_Data.sql"; grep -c $'\r' "$QLKS_SCRIPTS_DIR/07_Sample_Data.sql"
```

Expected: `Da dich 90 gia tri ngay o phan A`, `Da cap nhat khoi so lieu mong doi`, `07: xoa=61 them=282` (61 dòng bị thay = 60 dòng có ngày + dòng `SET NAMES`), `13` dòng đổi ở `06`, `ASCII text`, `0`, `0`. Nếu `07` của nhóm đã khác bản dùng khi lập plan thì số `xoa` / `them` có thể lệch. Khi đó mở `$BK/07.diff` ra đọc: mọi dòng `<` phải là dòng VALUES có ngày hoặc dòng `SET NAMES`.

- [ ] **Step 7: Chạy lại test**

Run: `npx vitest run src/db/du-lieu-mau.test.ts src/db/bao-cao.test.ts`
Expected: 27 passed. (`globalSetup` dựng lại CSDL test từ `07` mới.)

- [ ] **Step 8: Kiểm tay ở hai ngày khác mốc (Review Focus #5)**

```bash
cd /Users/anhpham/PA/UIT/Demo
for NGAY in '2026-10-01 07:00:00' '2027-03-01 22:00:00'; do
  ( set -a; source .env.local; set +a
    DATABASE_URL_TEST='mysql://root:@127.0.0.1:3306/QuanLyKhachSan_ngaykhac' DB_NGAY_CO_DINH="$NGAY" bash scripts/db-test-setup.sh )
  mysql -uroot -h127.0.0.1 -N --init-command="SET timestamp = UNIX_TIMESTAMP('$NGAY')" QuanLyKhachSan_ngaykhac -e "
    SELECT CURDATE(),
      (SELECT COUNT(*) FROM PHIEU_DAT_PHONG WHERE TrangThai = 'DaDat'   AND NgayCheckIn  = CURDATE()),
      (SELECT COUNT(*) FROM PHIEU_DAT_PHONG WHERE TrangThai = 'DangO'   AND NgayCheckOut = CURDATE()),
      (SELECT COUNT(*) FROM PHIEU_DAT_PHONG WHERE TrangThai = 'HoanTat' AND NgayCheckOut > CURDATE()),
      (SELECT COUNT(*) FROM PHIEU_DAT_PHONG WHERE TrangThai = 'DaDat'   AND NgayCheckIn  < CURDATE());
    CALL sp_BaoCaoDoanhThu(CURDATE(), CURDATE());"
done
mysql -uroot -h127.0.0.1 -e "DROP DATABASE QuanLyKhachSan_ngaykhac"
```

Expected: hai lần in `<ngay> 12 9 0 0`, và dòng doanh thu hôm nay `… 10 43100000.00 7430000.00 0.00 0.00 50530000.00`.

- [ ] **Step 9: Cả bộ test, commit**

Run: `npm test` → Expected: tất cả pass (test mock cũ không phụ thuộc CSDL).

```bash
git add src/db/du-lieu-mau.test.ts src/db/bao-cao.test.ts
git commit -m "test: kiem du lieu mau 07 theo ngay chay va 5 thu tuc bao cao

07_Sample_Data.sql va khoi so lieu mong doi cua 06 nam o Scripts/ (ngoai git)
duoc sua cung luc: ngay dich theo CURDATE(), them 42 phong, 60 khach, 88 phieu.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Thông báo lỗi CSDL và "hôm nay" của CSDL

**Files:**
- Create: `src/db/loi.ts`, `src/lib/queries/ngay.ts`
- Test: `src/db/loi.test.ts`, `src/lib/queries/ngay.test.ts`

**Interfaces:**
- Consumes: `pool` của `@/db` (Task 1).
- Produces:
  - `thongBaoCsdl(err: unknown): string` — `errno 1644` → `"CSDL từ chối: " + sqlMessage` (bỏ `"Loi: "`), lỗi khác ném tiếp.
  - `getNgayHienTai(): Promise<string>` (`'YYYY-MM-DD'`), `getGioHienTai(): Promise<string>` (`'HH:MM'`).

- [ ] **Step 1: Viết test hỏng `src/db/loi.test.ts`**

```ts
import { describe, expect, it } from "vitest";

import { pool } from "@/db";
import { thongBaoCsdl } from "@/db/loi";

describe("thongBaoCsdl", () => {
  it("loi SIGNAL 45000 giu nguyen van thong bao cua CSDL", () => {
    expect(
      thongBaoCsdl({ errno: 1644, sqlMessage: "Tai khoan dang o trang thai TamNghi, khong the dang nhap" }),
    ).toBe("CSDL từ chối: Tai khoan dang o trang thai TamNghi, khong the dang nhap");
  });

  it("bo tien to 'Loi: ' ma mot so thu tuc tu them", () => {
    expect(thongBaoCsdl({ errno: 1644, sqlMessage: "Loi: Ma phong khong ton tai!" })).toBe(
      "CSDL từ chối: Ma phong khong ton tai!",
    );
  });

  // Review Focus #3
  it("loi khong phai loi nghiep vu thi nem tiep, khong gia lam thong bao", () => {
    const matKetNoi = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:3306"), {
      code: "ECONNREFUSED",
      errno: -61,
    });
    expect(() => thongBaoCsdl(matKetNoi)).toThrow(matKetNoi);
    expect(() => thongBaoCsdl("khong phai loi")).toThrow();
  });

  it("dung voi loi that cua mysql2: SIGNAL thi thanh thong bao, loi 1292 thi nem tiep", async () => {
    const loi = await pool
      .query("CALL sp_TraCuuPhongTrong('2026-10-03', '2026-10-01', NULL)")
      .catch((e: unknown) => e);
    expect(thongBaoCsdl(loi)).toBe("CSDL từ chối: Ngay tra phong phai sau ngay nhan phong");

    const loiNgay = await pool.query("CALL sp_TraCuuPhongTrong('', '', NULL)").catch((e: unknown) => e);
    expect(() => thongBaoCsdl(loiNgay)).toThrow("Incorrect date value");
  });
});
```

- [ ] **Step 2: Viết test hỏng `src/lib/queries/ngay.test.ts`**

```ts
import { describe, expect, it } from "vitest";

import { getGioHienTai, getNgayHienTai } from "@/lib/queries/ngay";

describe("getNgayHienTai", () => {
  it("la CURDATE() cua CSDL, bi dong bang 23/09/2026 khi kiem thu", async () => {
    expect(await getNgayHienTai()).toBe("2026-09-23");
  });
});

describe("getGioHienTai", () => {
  it("la NOW() cua CSDL dang HH:MM", async () => {
    expect(await getGioHienTai()).toBe("10:00");
  });
});
```

- [ ] **Step 3: Chạy, xác nhận hỏng**

Run: `npx vitest run src/db/loi.test.ts src/lib/queries/ngay.test.ts`
Expected: FAIL `Failed to resolve import "@/db/loi"` và `"@/lib/queries/ngay"`.

- [ ] **Step 4: Viết `src/db/loi.ts`**

```ts
/**
 * Doi loi cua mysql2 thanh cau hien len giao dien.
 *
 * SIGNAL SQLSTATE '45000' trong thu tuc / trigger (errno 1644) la loi nghiep
 * vu: giu nguyen van MESSAGE_TEXT de nguoi xem thay quy tac nam o tang CSDL,
 * chi bo tien to "Loi: " ma mot so thu tuc tu them.
 *
 * Loi khac (mat ket noi, sai kieu du lieu, sai cu phap) khong phai loi cua
 * nguoi dung nen nem tiep, de hien o error.tsx thay vi gia lam thong bao.
 */
export function thongBaoCsdl(err: unknown): string {
  if (laLoiNghiepVu(err)) {
    return `CSDL từ chối: ${err.sqlMessage.replace(/^Loi:\s*/, "")}`;
  }
  throw err;
}

/** errno 1644 = ER_SIGNAL_EXCEPTION, loi do SIGNAL SQLSTATE '45000' sinh ra. */
function laLoiNghiepVu(err: unknown): err is { errno: 1644; sqlMessage: string } {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { errno?: unknown; sqlMessage?: unknown };
  return e.errno === 1644 && typeof e.sqlMessage === "string";
}
```

- [ ] **Step 5: Viết `src/lib/queries/ngay.ts`**

```ts
import "server-only";

import type { RowDataPacket } from "mysql2";

import { pool } from "@/db";

/**
 * "Hom nay" cua ca he thong la CURDATE() cua CSDL, khong phai dong ho cua may
 * chay Next: sp_DatPhong, sp_XacNhanDatCoc va v_TinhTrangPhongHomNay deu so
 * voi CURDATE(), nen app phai doc cung mot dong ho. Khi kiem thu, dong ho nay
 * bi dong bang bang DB_NGAY_CO_DINH (src/db/index.ts).
 */
export async function getNgayHienTai(): Promise<string> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT CURDATE() AS ngay");
  return rows[0].ngay as string;
}

/** Gio phut hien tai cua CSDL, dang 'HH:MM', cho dong "Cap nhat" tren Topbar. */
export async function getGioHienTai(): Promise<string> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT DATE_FORMAT(NOW(), '%H:%i') AS gio");
  return rows[0].gio as string;
}
```

- [ ] **Step 6: Chạy lại**

Run: `npx vitest run src/db/loi.test.ts src/lib/queries/ngay.test.ts` → Expected: 6 passed.
Run: `npm test` → Expected: 0 failed, tiến trình tự thoát.
Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.

- [ ] **Step 7: Commit**

```bash
git add src/db/loi.ts src/db/loi.test.ts src/lib/queries/ngay.ts src/lib/queries/ngay.test.ts
git commit -m "feat: thongBaoCsdl va ngay hien tai lay tu CSDL

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: `queries/rooms` đọc từ MySQL

**Files:**
- Modify: `src/lib/queries/rooms.ts` (thay toàn bộ)
- Test: `src/lib/queries/rooms.test.ts` (thay toàn bộ)

**Interfaces:**
- Consumes: `db` của `@/db`; `TRANG_THAI_PHONG`, `nhanTrangThaiPhong` của `@/lib/status`.
- Produces (chữ ký giữ nguyên): `getSoDoPhong(): Promise<PhongTrenSoDo[]>`, `getThongKePhongTheoTrangThai(): Promise<{ ma; nhan; soLuong }[]>`, `getNhatKyBuongPhong()` (mảng `{ ngayGio, soPhong, loai: "DonPhong" | "SuaPhong", nhanVien, ghiChu, chiPhi: string | null }`, mới nhất trước). Thêm hàm thuần `gopThongKeTrangThai(dem: { ma: string; soLuong: number }[])`.

- [ ] **Step 1: Viết test hỏng `src/lib/queries/rooms.test.ts`** (thay toàn bộ nội dung)

```ts
import { describe, expect, it } from "vitest";

import {
  getNhatKyBuongPhong,
  getSoDoPhong,
  getThongKePhongTheoTrangThai,
  gopThongKeTrangThai,
} from "@/lib/queries/rooms";

describe("getSoDoPhong", () => {
  it("tra du 42 phong kem loai phong da noi bang", async () => {
    const ds = await getSoDoPhong();
    expect(ds).toHaveLength(42);
    expect(ds[0]).toEqual({
      maPhong: "PH00000001",
      soPhong: "101",
      tang: 1,
      tenLoaiPhong: "Standard Single",
      donGiaNgay: "600000.00",
      trangThai: "Trong",
    });
  });

  it("sap xep theo so phong tang dan", async () => {
    const so = (await getSoDoPhong()).map((p) => p.soPhong);
    expect(so).toEqual([...so].sort());
  });
});

describe("getThongKePhongTheoTrangThai", () => {
  it("dem dung 5 trang thai, theo thu tu TRANG_THAI_PHONG", async () => {
    const tk = await getThongKePhongTheoTrangThai();
    expect(tk.map((t) => [t.ma, t.soLuong])).toEqual([
      ["Trong", 5],
      ["DaDat", 15],
      ["DangSuDung", 10],
      ["DangDon", 10],
      ["BaoTri", 2],
    ]);
    expect(tk[0].nhan).toBe("Trống");
  });
});

describe("gopThongKeTrangThai", () => {
  // Man hinh phai xu ly duoc truong hop dem ra 0.
  it("trang thai khong co phong nao van co dong voi soLuong 0", () => {
    const tk = gopThongKeTrangThai([{ ma: "Trong", soLuong: 3 }]);
    expect(tk.map((t) => [t.ma, t.soLuong])).toEqual([
      ["Trong", 3],
      ["DaDat", 0],
      ["DangSuDung", 0],
      ["DangDon", 0],
      ["BaoTri", 0],
    ]);
  });
});

describe("getNhatKyBuongPhong", () => {
  it("gop 16 lan don va 12 lan sua, moi nhat len dau", async () => {
    const nk = await getNhatKyBuongPhong();
    expect(nk).toHaveLength(28);
    expect(nk.filter((n) => n.loai === "DonPhong")).toHaveLength(16);
    const gio = nk.map((n) => n.ngayGio);
    expect(gio).toEqual([...gio].sort().reverse());
    expect(nk[0]).toEqual({
      ngayGio: "2026-09-23 12:00:00",
      soPhong: "301",
      loai: "DonPhong",
      nhanVien: "TK00000004",
      ghiChu: "Dang don tong quat sau check-out",
      chiPhi: null,
    });
  });

  it("su co chua co chi phi mang chiPhi '0.00' de man Tong quan nhan ra phong dang hong", async () => {
    const nk = await getNhatKyBuongPhong();
    expect(nk.find((n) => n.loai === "SuaPhong" && n.chiPhi === "0.00")).toMatchObject({
      soPhong: "303",
      ghiChu: "May lanh khong chay, dang kiem tra",
    });
  });
});
```

- [ ] **Step 2: Chạy, xác nhận hỏng**

Run: `npx vitest run src/lib/queries/rooms.test.ts`
Expected: FAIL — `gopThongKeTrangThai is not a function`, và số phòng theo trạng thái / nhật ký lệch vì vẫn đọc mock.

- [ ] **Step 3: Viết `src/lib/queries/rooms.ts`** (thay toàn bộ nội dung)

```ts
import "server-only";

import { asc, count, eq } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { TRANG_THAI_PHONG, nhanTrangThaiPhong } from "@/lib/status";

/** Mat tien doc du lieu phong tu CSDL. Chu ky giu nguyen tu giai doan du lieu gia. */

export type PhongTrenSoDo = {
  maPhong: string;
  soPhong: string;
  tang: number;
  tenLoaiPhong: string;
  donGiaNgay: string;
  trangThai: string;
};

export async function getSoDoPhong(): Promise<PhongTrenSoDo[]> {
  return db
    .select({
      maPhong: schema.phong.maPhong,
      soPhong: schema.phong.soPhong,
      tang: schema.phong.tang,
      tenLoaiPhong: schema.loaiPhong.tenLoaiPhong,
      donGiaNgay: schema.loaiPhong.donGiaNgay,
      trangThai: schema.phong.trangThai,
    })
    .from(schema.phong)
    .innerJoin(schema.loaiPhong, eq(schema.phong.maLoaiPhong, schema.loaiPhong.maLoaiPhong))
    .orderBy(asc(schema.phong.soPhong));
}

/**
 * Duyet theo TRANG_THAI_PHONG chu khong theo ket qua GROUP BY, de trang thai
 * khong co phong nao van hien mot chip voi so 0 dung nhu artboard.
 */
export function gopThongKeTrangThai(dem: { ma: string; soLuong: number }[]) {
  const theoMa = new Map(dem.map((d) => [d.ma, d.soLuong]));
  return TRANG_THAI_PHONG.map((ma) => ({
    ma,
    nhan: nhanTrangThaiPhong(ma).nhan,
    soLuong: theoMa.get(ma) ?? 0,
  }));
}

export async function getThongKePhongTheoTrangThai() {
  const dem = await db
    .select({ ma: schema.phong.trangThai, soLuong: count() })
    .from(schema.phong)
    .groupBy(schema.phong.trangThai);
  return gopThongKeTrangThai(dem);
}

export async function getNhatKyBuongPhong() {
  // DON_PHONG va SUA_PHONG cung dung cot ThoiGian; SUA_PHONG co MoTaLoi va
  // ChiPhi (NOT NULL, mac dinh '0.00'), DON_PHONG co GhiChu va khong co chi phi.
  const [don, sua] = await Promise.all([
    db
      .select({
        ngayGio: schema.donPhong.thoiGian,
        soPhong: schema.phong.soPhong,
        nhanVien: schema.donPhong.maTk,
        ghiChu: schema.donPhong.ghiChu,
      })
      .from(schema.donPhong)
      .innerJoin(schema.phong, eq(schema.donPhong.maPhong, schema.phong.maPhong)),
    db
      .select({
        ngayGio: schema.suaPhong.thoiGian,
        soPhong: schema.phong.soPhong,
        nhanVien: schema.suaPhong.maTk,
        ghiChu: schema.suaPhong.moTaLoi,
        chiPhi: schema.suaPhong.chiPhi,
      })
      .from(schema.suaPhong)
      .innerJoin(schema.phong, eq(schema.suaPhong.maPhong, schema.phong.maPhong)),
  ]);

  return [
    ...don.map((d) => ({
      ngayGio: d.ngayGio,
      soPhong: d.soPhong,
      loai: "DonPhong" as const,
      nhanVien: d.nhanVien,
      ghiChu: d.ghiChu ?? "",
      chiPhi: null as string | null,
    })),
    ...sua.map((x) => ({
      ngayGio: x.ngayGio,
      soPhong: x.soPhong,
      loai: "SuaPhong" as const,
      nhanVien: x.nhanVien,
      ghiChu: x.ghiChu ?? "",
      chiPhi: x.chiPhi as string | null,
    })),
  ].sort((a, b) => b.ngayGio.localeCompare(a.ngayGio));
}
```

- [ ] **Step 4: Chạy lại**

Run: `npx vitest run src/lib/queries/rooms.test.ts` → Expected: 6 passed.
Run: `npm test` → Expected: 0 failed, tiến trình tự thoát.
Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/rooms.ts src/lib/queries/rooms.test.ts
git commit -m "feat: queries/rooms doc tu MySQL

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: `queries/bookings` đọc từ MySQL, tra phòng trống bằng `sp_TraCuuPhongTrong`

**Files:**
- Modify: `src/lib/queries/bookings.ts` (thay toàn bộ), `src/app/(app)/services/page.tsx`, `src/db/procedures.ts` (chú thích)
- Test: `src/lib/queries/bookings.test.ts` (thay toàn bộ)

**Interfaces:**
- Consumes: `db` (`@/db`), `callProcedure` (`@/db/procedures`), `thongBaoCsdl` (Task 3), `congTien` (`@/lib/tinh-toan`).
- Produces:
  - Chữ ký giữ nguyên: `PhieuTomTat`, `getPhieuNhanHomNay()`, `getPhieuTraHomNay()`, `getPhieuTheoMa(ma): Promise<PhieuTomTat | null>`, `getLoaiPhongConTrong(checkIn, checkOut): Promise<LoaiPhongConTrong[]>`, `traCuuPhongTrongAnToan(checkIn, checkOut): Promise<{ ok: true; data: LoaiPhongConTrong[] } | { ok: false; loi: string }>`.
  - Mới: `getPhieuDangO(): Promise<PhieuTomTat[]>`, type `LoaiPhongConTrong = { maLoaiPhong; tenLoaiPhong; donGiaNgay; soPhongTrong: number }`.
  - `booking-form.tsx` chỉ dùng `r.ok` / `r.data`, nên thông báo `loi` đổi sang lời CSDL không ảnh hưởng giao diện.

- [ ] **Step 1: Viết test hỏng `src/lib/queries/bookings.test.ts`** (thay toàn bộ nội dung)

```ts
import { describe, expect, it } from "vitest";

import {
  getLoaiPhongConTrong,
  getPhieuDangO,
  getPhieuNhanHomNay,
  getPhieuTheoMa,
  getPhieuTraHomNay,
  traCuuPhongTrongAnToan,
} from "@/lib/queries/bookings";

const HOM_NAY = "2026-09-23";

describe("getPhieuNhanHomNay", () => {
  it("dung 12 phieu DaDat co ngay nhan la hom nay", async () => {
    const ds = await getPhieuNhanHomNay();
    expect(ds).toHaveLength(12);
    for (const p of ds) {
      expect(p.ngayCheckIn).toBe(HOM_NAY);
      expect(p.trangThai).toBe("DaDat");
    }
  });

  it("kem khach, phong, loai phong, so dem va tien phong", async () => {
    const [p] = await getPhieuNhanHomNay();
    expect(p).toEqual({
      maDatPhong: "DP00000011",
      maKh: "KH00000011",
      hoTenKhach: "Nguyen Thi An",
      cccd: "079300000011",
      sdt: "0910000011",
      ngayCheckIn: "2026-09-23",
      ngayCheckOut: "2026-09-25",
      soDem: 2,
      trangThai: "DaDat",
      tienCoc: "600000.00",
      soPhong: ["103"],
      tenLoaiPhong: "Standard Single",
      tongTienPhong: "1200000.00",
    });
  });
});

describe("getPhieuTraHomNay", () => {
  it("dung 9 phieu DangO co ngay tra la hom nay", async () => {
    const ds = await getPhieuTraHomNay();
    expect(ds).toHaveLength(9);
    for (const p of ds) {
      expect(p.ngayCheckOut).toBe(HOM_NAY);
      expect(p.trangThai).toBe("DangO");
    }
  });
});

describe("getPhieuDangO", () => {
  it("moi phieu dang o, ke ca phieu chua den ngay tra (DP00000006)", async () => {
    const ds = await getPhieuDangO();
    expect(ds).toHaveLength(10);
    expect(ds.every((p) => p.trangThai === "DangO")).toBe(true);
    expect(ds.map((p) => p.maDatPhong)).toContain("DP00000006");
  });
});

describe("getPhieuTheoMa", () => {
  it("phieu nhieu phong: du so phong va cong tien tung phong", async () => {
    const p = await getPhieuTheoMa("DP00000008");
    expect(p).toMatchObject({
      soPhong: ["402", "501"],
      tenLoaiPhong: "Executive Suite",
      tongTienPhong: "13720000.00",
    });
  });

  it("tra null khi ma khong ton tai, khong nem loi", async () => {
    await expect(getPhieuTheoMa("DP99999999")).resolves.toBeNull();
  });
});

describe("getLoaiPhongConTrong", () => {
  it("du 10 loai phong kem so phong con trong theo sp_TraCuuPhongTrong", async () => {
    const ds = await getLoaiPhongConTrong("2026-10-01", "2026-10-03");
    expect(ds[0]).toEqual({
      maLoaiPhong: "LP00000001",
      tenLoaiPhong: "Standard Single",
      donGiaNgay: "600000.00",
      soPhongTrong: 5,
    });
    expect(ds.map((l) => l.soPhongTrong)).toEqual([5, 4, 3, 2, 2, 3, 3, 3, 3, 2]);
  });

  it("phong DangDon va BaoTri khong bao gio duoc tinh la trong: 42 - 10 - 2 = 30", async () => {
    const ds = await getLoaiPhongConTrong("2026-10-01", "2026-10-03");
    expect(ds.reduce((s, l) => s + l.soPhongTrong, 0)).toBe(30);
  });

  it("phong dang co phieu giu trong khoang ngay thi khong con trong", async () => {
    // DP00000007 giu phong 401 (Junior Suite, LP00000007) tu 12/10 den 15/10.
    const trung = await getLoaiPhongConTrong("2026-10-13", "2026-10-14");
    expect(trung.find((l) => l.maLoaiPhong === "LP00000007")!.soPhongTrong).toBe(2);
  });

  it("nem loi cua CSDL khi ngay tra khong sau ngay nhan", async () => {
    await expect(getLoaiPhongConTrong("2026-10-03", "2026-10-01")).rejects.toThrow(
      "Ngay tra phong phai sau ngay nhan phong",
    );
  });
});

describe("traCuuPhongTrongAnToan", () => {
  it("ngay hop le thi tra ok kem danh sach", async () => {
    const r = await traCuuPhongTrongAnToan("2026-10-01", "2026-10-03");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toHaveLength(10);
  });

  it("ngay sai thu tu thi tra ok:false kem thong bao cua CSDL, khong nem", async () => {
    await expect(traCuuPhongTrongAnToan("2026-10-03", "2026-10-01")).resolves.toEqual({
      ok: false,
      loi: "CSDL từ chối: Ngay tra phong phai sau ngay nhan phong",
    });
  });

  // Review Focus #1
  it("o ngay bi xoa trong hoac ngay khong co that thi tra ok:false, khong nem", async () => {
    const khongHopLe = { ok: false, loi: "Ngày không hợp lệ" };
    await expect(traCuuPhongTrongAnToan("", "2026-10-03")).resolves.toEqual(khongHopLe);
    await expect(traCuuPhongTrongAnToan("2026-10-01", "")).resolves.toEqual(khongHopLe);
    await expect(traCuuPhongTrongAnToan("2026-02-30", "2026-03-02")).resolves.toEqual(khongHopLe);
  });
});
```

- [ ] **Step 2: Chạy, xác nhận hỏng**

Run: `npx vitest run src/lib/queries/bookings.test.ts`
Expected: FAIL — `getPhieuDangO is not a function`; tổng phòng trống khác 30 (mock chỉ loại phòng `BaoTri`, còn `sp_TraCuuPhongTrong` loại thêm `DangDon`); thông báo lỗi không phải `"CSDL từ chối: …"`.

- [ ] **Step 3: Viết `src/lib/queries/bookings.ts`** (thay toàn bộ nội dung)

```ts
import "server-only";

import { and, asc, eq, inArray, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { thongBaoCsdl } from "@/db/loi";
import { callProcedure } from "@/db/procedures";
import * as schema from "@/db/schema";
import { congTien } from "@/lib/tinh-toan";

/**
 * Mat tien doc phieu dat phong. "Hom nay" la CURDATE() cua CSDL (xem
 * queries/ngay.ts). Tra cuu phong trong goi sp_TraCuuPhongTrong, dung vi tu
 * kha dung cua sp_DatPhong, nen so phong trong luon khop voi luc dat that.
 */

export type PhieuTomTat = {
  maDatPhong: string;
  maKh: string;
  hoTenKhach: string;
  cccd: string;
  sdt: string | null;
  ngayCheckIn: string;
  ngayCheckOut: string;
  soDem: number;
  trangThai: string;
  tienCoc: string;
  soPhong: string[];
  tenLoaiPhong: string;
  tongTienPhong: string;
};

export type LoaiPhongConTrong = {
  maLoaiPhong: string;
  tenLoaiPhong: string;
  donGiaNgay: string;
  soPhongTrong: number;
};

const pdp = schema.phieuDatPhong;
const kh = schema.khachHang;
const ctdp = schema.chiTietDatPhong;

/** Doc cac phieu thoa dieu kien, kem khach, phong va loai phong, theo ma phieu. */
async function docPhieu(dieuKien: SQL | undefined): Promise<PhieuTomTat[]> {
  const phieu = await db
    .select({
      maDatPhong: pdp.maDatPhong,
      maKh: pdp.maKh,
      hoTenKhach: kh.hoTen,
      cccd: kh.cccd,
      sdt: kh.sdt,
      ngayCheckIn: pdp.ngayCheckIn,
      ngayCheckOut: pdp.ngayCheckOut,
      soDem: sql<number>`DATEDIFF(${pdp.ngayCheckOut}, ${pdp.ngayCheckIn})`.mapWith(Number),
      trangThai: pdp.trangThai,
      tienCoc: pdp.tienCoc,
    })
    .from(pdp)
    .innerJoin(kh, eq(kh.maKh, pdp.maKh))
    .where(dieuKien)
    .orderBy(asc(pdp.maDatPhong));
  if (phieu.length === 0) return [];

  const chiTiet = await db
    .select({
      maDatPhong: ctdp.maDatPhong,
      soPhong: schema.phong.soPhong,
      tenLoaiPhong: schema.loaiPhong.tenLoaiPhong,
      thanhTien: ctdp.thanhTien,
    })
    .from(ctdp)
    .innerJoin(schema.phong, eq(schema.phong.maPhong, ctdp.maPhong))
    .innerJoin(schema.loaiPhong, eq(schema.loaiPhong.maLoaiPhong, schema.phong.maLoaiPhong))
    .where(inArray(ctdp.maDatPhong, phieu.map((p) => p.maDatPhong)))
    .orderBy(asc(schema.phong.soPhong));

  return phieu.map((p) => {
    const cua = chiTiet.filter((c) => c.maDatPhong === p.maDatPhong);
    return {
      ...p,
      soPhong: cua.map((c) => c.soPhong),
      tenLoaiPhong: cua[0]?.tenLoaiPhong ?? "—",
      // thanhTien la cot sinh (generatedAlwaysAs) nen kieu la string | null.
      tongTienPhong: congTien(...cua.map((c) => c.thanhTien ?? "0.00")),
    };
  });
}

export async function getPhieuNhanHomNay(): Promise<PhieuTomTat[]> {
  return docPhieu(and(eq(pdp.trangThai, "DaDat"), eq(pdp.ngayCheckIn, sql`CURDATE()`)));
}

export async function getPhieuTraHomNay(): Promise<PhieuTomTat[]> {
  return docPhieu(and(eq(pdp.trangThai, "DangO"), eq(pdp.ngayCheckOut, sql`CURDATE()`)));
}

/** Moi phieu dang o, khong rieng phieu tra hom nay: man Dich vu ghi cho phieu nao cung duoc. */
export async function getPhieuDangO(): Promise<PhieuTomTat[]> {
  return docPhieu(eq(pdp.trangThai, "DangO"));
}

export async function getPhieuTheoMa(ma: string): Promise<PhieuTomTat | null> {
  const [p] = await docPhieu(eq(pdp.maDatPhong, ma));
  return p ?? null;
}

/**
 * So phong con trong theo tung loai trong [checkIn, checkOut). LOAI_PHONG lam
 * goc de loai het phong van co dong soPhongTrong = 0. Ngay sai thi
 * sp_TraCuuPhongTrong SIGNAL va ham nay nem loi do.
 */
export async function getLoaiPhongConTrong(
  checkIn: string,
  checkOut: string,
): Promise<LoaiPhongConTrong[]> {
  const [loai, phongTrong] = await Promise.all([
    db
      .select({
        maLoaiPhong: schema.loaiPhong.maLoaiPhong,
        tenLoaiPhong: schema.loaiPhong.tenLoaiPhong,
        donGiaNgay: schema.loaiPhong.donGiaNgay,
      })
      .from(schema.loaiPhong)
      .orderBy(asc(schema.loaiPhong.maLoaiPhong)),
    callProcedure<{ MaLoaiPhong: string }>("sp_TraCuuPhongTrong", [checkIn, checkOut, null]),
  ]);

  return loai.map((l) => ({
    ...l,
    soPhongTrong: phongTrong.filter((p) => p.MaLoaiPhong === l.maLoaiPhong).length,
  }));
}

const NGAY_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Ngay 'YYYY-MM-DD' co that tren lich; chan chuoi rong va ngay nhu 2026-02-30. */
function laNgayHopLe(s: string): boolean {
  if (!NGAY_ISO.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/**
 * Ban an toan cua getLoaiPhongConTrong: khong nem loi ma tra ve ket qua co gan
 * nhan, de Server Action goi tu form dat phong khong lam vo trang khi nguoi
 * dung go ngay sai.
 */
export async function traCuuPhongTrongAnToan(
  checkIn: string,
  checkOut: string,
): Promise<{ ok: true; data: LoaiPhongConTrong[] } | { ok: false; loi: string }> {
  // O ngay cua trinh duyet cho xoa trong. Ngay rong / sai den MySQL la loi
  // 1292 chu khong phai SIGNAL, thongBaoCsdl se nem tiep, nen phai chan truoc.
  if (!laNgayHopLe(checkIn) || !laNgayHopLe(checkOut)) {
    return { ok: false, loi: "Ngày không hợp lệ" };
  }
  try {
    return { ok: true, data: await getLoaiPhongConTrong(checkIn, checkOut) };
  } catch (err) {
    return { ok: false, loi: thongBaoCsdl(err) };
  }
}
```

- [ ] **Step 4: Màn Dịch vụ liệt kê mọi phiếu đang ở (spec §2.6 lỗi 2), cập nhật chú thích `procedures.ts`**

`src/app/(app)/services/page.tsx` — tìm:

```tsx
import { getPhieuTraHomNay } from "@/lib/queries/bookings";
```

thay bằng:

```tsx
import { getPhieuDangO } from "@/lib/queries/bookings";
```

`src/app/(app)/services/page.tsx` — tìm:

```tsx
const [dichVu, phieu] = await Promise.all([getDanhMucDichVu(), getPhieuTraHomNay()]);
```

thay bằng:

```tsx
const [dichVu, phieu] = await Promise.all([getDanhMucDichVu(), getPhieuDangO()]);
```

`src/db/procedures.ts` — tìm:

```ts
 * Chua duoc su dung o dau — day la khung cho cac man hinh nghiep vu sau nay.
```

thay bằng:

```ts
 * Dang dung cho sp_TraCuuPhongTrong, sp_BaoCaoDoanhThu va sp_DangNhap.
```

- [ ] **Step 5: Chạy lại**

Run: `npx vitest run src/lib/queries/bookings.test.ts` → Expected: 13 passed.
Run: `npm test` → Expected: 0 failed, tiến trình tự thoát.
Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.

- [ ] **Step 6: Commit**

```bash
git add src/lib/queries/bookings.ts src/lib/queries/bookings.test.ts "src/app/(app)/services/page.tsx" src/db/procedures.ts
git commit -m "feat: queries/bookings doc tu MySQL, tra phong trong bang sp_TraCuuPhongTrong

Man Dich vu liet ke moi phieu dang o thay vi chi phieu tra hom nay.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: `queries/customers` đọc từ MySQL

**Files:**
- Modify: `src/lib/queries/customers.ts` (thay toàn bộ)
- Test: `src/lib/queries/customers.test.ts` (thay toàn bộ)

**Interfaces:**
- Consumes: `db`, `pool` (`@/db`).
- Produces (giữ nguyên): `KhachHangTrenBang`, `getDanhSachKhachHang(): Promise<KhachHangTrenBang[]>` (theo `maKh`), `getThongKeKhachHang(): Promise<{ tongHoSo; khachMoiThangNay; dangLuuTru; tyLeQuayLai }>`.

**Bẫy đã gặp khi lập plan:** trong câu `select` chỉ có một bảng, Drizzle in `${kh.maKh}` thành `` `MaKH` `` mà không kèm tên bảng. Vì vậy subquery tương quan phải viết rõ `KHACH_HANG.MaKH`. Nếu không, `p.MaKH = MaKH` là so một cột với chính nó: mọi khách đều thành "đang lưu trú", và KH00000001 có 72 lần lưu trú.

- [ ] **Step 1: Viết test hỏng `src/lib/queries/customers.test.ts`** (thay toàn bộ nội dung)

```ts
import { describe, expect, it } from "vitest";
import type { RowDataPacket } from "mysql2";

import { pool } from "@/db";
import { getDanhSachKhachHang, getThongKeKhachHang } from "@/lib/queries/customers";

describe("getDanhSachKhachHang", () => {
  it("du 60 khach theo ma, so lan luu tru va chi tieu tinh tu bang khac", async () => {
    const ds = await getDanhSachKhachHang();
    expect(ds).toHaveLength(60);
    expect(ds[0]).toEqual({
      maKh: "KH00000001",
      hoTen: "Nguyen Hoang Long",
      cccd: "079201000001",
      sdt: "0901234501",
      email: "long.nguyen@example.com",
      soLanLuuTru: 1,
      tongChiTieu: "1960000.00",
      dangLuuTru: false,
      conNo: false,
    });
  });

  it("khach dang o, hoa don chua thanh toan: chi tieu 0.00, dang luu tru, con no", async () => {
    const k = (await getDanhSachKhachHang()).find((x) => x.maKh === "KH00000006");
    expect(k).toMatchObject({ soLanLuuTru: 1, tongChiTieu: "0.00", dangLuuTru: true, conNo: true });
  });

  it("khach moi dat, chua o lan nao: so lan 0 va chi tieu 0.00", async () => {
    const k = (await getDanhSachKhachHang()).find((x) => x.maKh === "KH00000007");
    expect(k).toMatchObject({ soLanLuuTru: 0, tongChiTieu: "0.00", dangLuuTru: false });
  });

  it("so lan luu tru va chi tieu khop voi sp_BaoCaoKhachHang cho moi khach", async () => {
    const ds = await getDanhSachKhachHang();
    const [kq] = await pool.query<RowDataPacket[][]>("CALL sp_BaoCaoKhachHang(NULL, NULL)");
    const baoCao = new Map(kq[0].map((r) => [r.MaKH as string, r]));
    for (const k of ds) {
      const r = baoCao.get(k.maKh);
      expect([k.maKh, k.soLanLuuTru, k.tongChiTieu]).toEqual([
        k.maKh,
        r ? r.SoLanLuuTru : 0,
        r ? r.TongChiTieu : "0.00",
      ]);
    }
  });
});

describe("getThongKeKhachHang", () => {
  it("tong ho so, khach moi thang nay, dang luu tru va ty le quay lai", async () => {
    expect(await getThongKeKhachHang()).toEqual({
      tongHoSo: 60,
      khachMoiThangNay: 8,
      dangLuuTru: 10,
      tyLeQuayLai: 30,
    });
  });
});
```

- [ ] **Step 2: Chạy, xác nhận hỏng**

Run: `npx vitest run src/lib/queries/customers.test.ts`
Expected: FAIL — ví dụ KH00000001 `tongChiTieu` là `"1360000.00"` (mock cộng `TongTien`, tức đã trừ cọc) thay vì `"1960000.00"`.

- [ ] **Step 3: Viết `src/lib/queries/customers.ts`** (thay toàn bộ nội dung)

```ts
import "server-only";

import { asc, sql } from "drizzle-orm";
import type { RowDataPacket } from "mysql2";

import { db, pool } from "@/db";
import * as schema from "@/db/schema";

/**
 * Mat tien doc khach hang.
 *
 * Luu y: bang KHACH_HANG chi co MaKH, HoTen, CCCD, SDT, Email. Hai cot
 * "Lan luu tru" va "Tong chi tieu" tren artboard KHONG phai cot trong bang —
 * chung duoc tinh tu PHIEU_DAT_PHONG va HOA_DON, nen kieu tra ve la view-model
 * chu khong phai $inferSelect tran.
 */

export type KhachHangTrenBang = {
  maKh: string;
  hoTen: string;
  cccd: string;
  sdt: string | null;
  email: string | null;
  soLanLuuTru: number;
  tongChiTieu: string;
  dangLuuTru: boolean;
  conNo: boolean;
};

const kh = schema.khachHang;

// Cac subquery duoi day tuong quan voi dong KHACH_HANG dang doc, nen phai viet
// ro KHACH_HANG.MaKH: trong select mot bang, Drizzle in ${kh.maKh} thanh `MaKH`
// khong kem ten bang, va `p.MaKH = MaKH` thanh so sanh cot voi chinh no.

export async function getDanhSachKhachHang(): Promise<KhachHangTrenBang[]> {
  return db
    .select({
      maKh: kh.maKh,
      hoTen: kh.hoTen,
      cccd: kh.cccd,
      sdt: kh.sdt,
      email: kh.email,
      // Chi tinh la mot lan luu tru khi khach thuc su den o (dang o hoac da xong).
      soLanLuuTru: sql<number>`(
        SELECT COUNT(*) FROM PHIEU_DAT_PHONG p
        WHERE  p.MaKH = KHACH_HANG.MaKH AND p.TrangThai IN ('DangO', 'HoanTat'))`.mapWith(Number),
      // Cung quy tac voi sp_BaoCaoKhachHang: hoa don da thanh toan, cong
      // TienPhong + DichVu + PhuThu + GiamGia. GiamTru la tien coc bu tru,
      // khong phai chi tieu bot di, nen khong cong.
      tongChiTieu: sql<string>`(
        SELECT COALESCE(SUM(ct.SoTien), 0)
        FROM   PHIEU_DAT_PHONG  p
        JOIN   HOA_DON          hd ON hd.MaDatPhong = p.MaDatPhong
                                  AND hd.TrangThai  = 'DaThanhToan'
        JOIN   CHI_TIET_HOA_DON ct ON ct.MaHoaDon   = hd.MaHoaDon
                                  AND ct.LoaiKhoanMuc IN ('TienPhong', 'DichVu', 'PhuThu', 'GiamGia')
        WHERE  p.MaKH = KHACH_HANG.MaKH)`,
      dangLuuTru: sql<boolean>`EXISTS (
        SELECT 1 FROM PHIEU_DAT_PHONG p
        WHERE  p.MaKH = KHACH_HANG.MaKH AND p.TrangThai = 'DangO')`.mapWith(Boolean),
      conNo: sql<boolean>`EXISTS (
        SELECT 1 FROM PHIEU_DAT_PHONG p
        JOIN   HOA_DON hd ON hd.MaDatPhong = p.MaDatPhong
        WHERE  p.MaKH = KHACH_HANG.MaKH AND hd.TrangThai = 'ChuaThanhToan' AND hd.TongTien > 0)`.mapWith(Boolean),
    })
    .from(kh)
    .orderBy(asc(kh.maKh));
}

export async function getThongKeKhachHang() {
  // Bang KHACH_HANG khong co cot ngay tao ho so, nen "khach moi thang nay" duoc
  // hieu la khach co phieu dat DAU TIEN roi vao thang cua CURDATE().
  const [ds, [moi]] = await Promise.all([
    getDanhSachKhachHang(),
    pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) AS n
      FROM   (SELECT MaKH, MIN(NgayLap) AS LanDau FROM PHIEU_DAT_PHONG GROUP BY MaKH) x
      WHERE  DATE_FORMAT(x.LanDau, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')`),
  ]);

  const quayLai = ds.filter((k) => k.soLanLuuTru >= 2).length;

  return {
    tongHoSo: ds.length,
    khachMoiThangNay: Number(moi[0].n),
    dangLuuTru: ds.filter((k) => k.dangLuuTru).length,
    tyLeQuayLai: ds.length === 0 ? 0 : Math.round((quayLai / ds.length) * 100),
  };
}
```

- [ ] **Step 4: Chạy lại**

Run: `npx vitest run src/lib/queries/customers.test.ts` → Expected: 5 passed.
Run: `npm test` → Expected: 0 failed, tiến trình tự thoát.
Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/customers.ts src/lib/queries/customers.test.ts
git commit -m "feat: queries/customers doc tu MySQL, chi tieu cung quy tac sp_BaoCaoKhachHang

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: `queries/invoices` và `queries/services` đọc từ MySQL

**Files:**
- Modify: `src/lib/queries/invoices.ts`, `src/lib/queries/services.ts` (thay toàn bộ)
- Test: `src/lib/queries/invoices.test.ts` (thay toàn bộ), `src/lib/queries/services.test.ts` (mới)

**Interfaces:**
- Consumes: `db` (`@/db`), `congTien` (test).
- Produces (giữ nguyên): `HoaDonDayDu`, `getHoaDon(ma): Promise<HoaDonDayDu | null>` (khoản mục theo `MaCTHD`), `getDanhSachHoaDon()` (mới nhất trước, cùng giờ thì theo mã giảm dần), `getDanhMucDichVu()`, `getSuDungDichVuTheoPhieu(maDatPhong)`.

- [ ] **Step 1: Viết test hỏng `src/lib/queries/invoices.test.ts`** (thay toàn bộ nội dung)

```ts
import { describe, expect, it } from "vitest";

import { getDanhSachHoaDon, getHoaDon } from "@/lib/queries/invoices";
import { congTien } from "@/lib/tinh-toan";

describe("getHoaDon", () => {
  it("tra hoa don kem khach, phieu va khoan muc theo thu tu ma", async () => {
    expect(await getHoaDon("HD00000001")).toEqual({
      maHoaDon: "HD00000001",
      maDatPhong: "DP00000001",
      ngayLap: "2026-01-19 11:00:00",
      trangThai: "DaThanhToan",
      loaiThanhToan: "The",
      tongTien: "1360000.00",
      khach: { hoTen: "Nguyen Hoang Long", maKh: "KH00000001", cccd: "079201000001", sdt: "0901234501" },
      phieu: {
        ngayCheckIn: "2026-01-17",
        ngayCheckOut: "2026-01-19",
        soDem: 2,
        soPhong: ["101"],
        tenLoaiPhong: "Standard Single",
      },
      khoanMuc: [
        { loaiKhoanMuc: "TienPhong", ghiChu: "Phong 101: 600.000 x 2 dem", soTien: "1200000.00" },
        { loaiKhoanMuc: "DichVu", ghiChu: "Buffet, giat ui va minibar", soTien: "760000.00" },
        { loaiKhoanMuc: "PhuThu", ghiChu: "Phu thu nhan phong som", soTien: "100000.00" },
        { loaiKhoanMuc: "GiamGia", ghiChu: "Giam gia khach hang thanh vien", soTien: "-100000.00" },
        { loaiKhoanMuc: "GiamTru", ghiChu: "Tru tien coc cua phieu DP00000001", soTien: "-600000.00" },
      ],
    });
  });

  it("tong cac khoan muc bang tong tien, voi moi hoa don", async () => {
    for (const { maHoaDon } of await getDanhSachHoaDon()) {
      const hd = await getHoaDon(maHoaDon);
      expect([maHoaDon, congTien(...hd!.khoanMuc.map((k) => k.soTien))]).toEqual([maHoaDon, hd!.tongTien]);
    }
  });

  // Review Focus #4
  it("hoa don nhap chua co khoan muc nao: danh sach rong, tong 0.00, van co phong", async () => {
    const hd = await getHoaDon("HD00000007");
    expect(hd).toMatchObject({ trangThai: "ChuaThanhToan", tongTien: "0.00", khoanMuc: [] });
    expect(hd?.phieu.soPhong).toEqual(["401"]);
  });

  it("tra null khi ma hoa don khong ton tai", async () => {
    await expect(getHoaDon("HD99999999")).resolves.toBeNull();
  });
});

describe("getDanhSachHoaDon", () => {
  it("du 76 hoa don, moi nhat truoc", async () => {
    const ds = await getDanhSachHoaDon();
    expect(ds).toHaveLength(76);
    expect(ds[0]).toEqual({
      maHoaDon: "HD00000005",
      maDatPhong: "DP00000005",
      ngayLap: "2026-09-23 11:15:00",
      tongTien: "1500000.00",
      trangThai: "DaThanhToan",
      hoTenKhach: "Vo Quoc Bao",
    });
    const lap = ds.map((h) => h.ngayLap);
    expect(lap).toEqual([...lap].sort().reverse());
  });
});
```

- [ ] **Step 2: Viết `src/lib/queries/services.test.ts`**

```ts
import { describe, expect, it } from "vitest";

import { getDanhMucDichVu, getSuDungDichVuTheoPhieu } from "@/lib/queries/services";

describe("getDanhMucDichVu", () => {
  it("du 10 dich vu theo ma", async () => {
    const ds = await getDanhMucDichVu();
    expect(ds).toHaveLength(10);
    expect(ds[0]).toEqual({ maDv: "DV00000001", tenDv: "Giat ui", donViTinh: "Kg", giaDv: "80000.00" });
  });
});

describe("getSuDungDichVuTheoPhieu", () => {
  it("cac lan dung dich vu cua phieu, theo thoi gian, gia chot luc dung", async () => {
    expect(await getSuDungDichVuTheoPhieu("DP00000001")).toEqual([
      { maDv: "DV00000002", tenDv: "Buffet sang", donViTinh: "Suat", giaDv: "250000.00", soLuong: 2, thanhTien: "500000.00" },
      { maDv: "DV00000001", tenDv: "Giat ui", donViTinh: "Kg", giaDv: "80000.00", soLuong: 2, thanhTien: "160000.00" },
      { maDv: "DV00000005", tenDv: "Minibar", donViTinh: "SanPham", giaDv: "100000.00", soLuong: 1, thanhTien: "100000.00" },
    ]);
  });

  it("phieu chua dung dich vu nao thi tra mang rong", async () => {
    expect(await getSuDungDichVuTheoPhieu("DP00000011")).toEqual([]);
  });
});
```

- [ ] **Step 3: Chạy, xác nhận hỏng**

Run: `npx vitest run src/lib/queries/invoices.test.ts src/lib/queries/services.test.ts`
Expected: `invoices` FAIL, vì `ngayLap` của HD00000001 trong mock là `2026-01-12 11:00:00`, không phải ngày đã dịch `2026-01-19 11:00:00`, và số hóa đơn lệch. `services` có thể pass ngay trên mock, vì danh mục và 3 dòng dịch vụ của DP00000001 không đổi. Đây là test giữ hành vi khi đổi nguồn dữ liệu.

- [ ] **Step 4: Viết `src/lib/queries/invoices.ts`** (thay toàn bộ nội dung)

```ts
import "server-only";

import { asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";

/** Mat tien doc hoa don. Lap / thanh toan hoa don la viec cua phase 2 (sp_LapHoaDon, sp_ThanhToanHoaDon). */

export type HoaDonDayDu = {
  maHoaDon: string;
  maDatPhong: string;
  ngayLap: string;
  trangThai: string;
  loaiThanhToan: string | null;
  tongTien: string;
  khach: { hoTen: string; maKh: string; cccd: string; sdt: string | null };
  phieu: {
    ngayCheckIn: string;
    ngayCheckOut: string;
    soDem: number;
    soPhong: string[];
    tenLoaiPhong: string;
  };
  khoanMuc: { loaiKhoanMuc: string; ghiChu: string | null; soTien: string }[];
};

const hoaDon = schema.hoaDon;
const pdp = schema.phieuDatPhong;
const kh = schema.khachHang;

export async function getHoaDon(ma: string): Promise<HoaDonDayDu | null> {
  const [hd] = await db
    .select({
      maHoaDon: hoaDon.maHoaDon,
      maDatPhong: hoaDon.maDatPhong,
      ngayLap: hoaDon.ngayLap,
      trangThai: hoaDon.trangThai,
      loaiThanhToan: hoaDon.loaiThanhToan,
      tongTien: hoaDon.tongTien,
      hoTen: kh.hoTen,
      maKh: kh.maKh,
      cccd: kh.cccd,
      sdt: kh.sdt,
      ngayCheckIn: pdp.ngayCheckIn,
      ngayCheckOut: pdp.ngayCheckOut,
      soDem: sql<number>`DATEDIFF(${pdp.ngayCheckOut}, ${pdp.ngayCheckIn})`.mapWith(Number),
    })
    .from(hoaDon)
    .innerJoin(pdp, eq(pdp.maDatPhong, hoaDon.maDatPhong))
    .innerJoin(kh, eq(kh.maKh, pdp.maKh))
    .where(eq(hoaDon.maHoaDon, ma));
  if (!hd) return null;

  const [dsPhong, khoanMuc] = await Promise.all([
    db
      .select({ soPhong: schema.phong.soPhong, tenLoaiPhong: schema.loaiPhong.tenLoaiPhong })
      .from(schema.chiTietDatPhong)
      .innerJoin(schema.phong, eq(schema.phong.maPhong, schema.chiTietDatPhong.maPhong))
      .innerJoin(schema.loaiPhong, eq(schema.loaiPhong.maLoaiPhong, schema.phong.maLoaiPhong))
      .where(eq(schema.chiTietDatPhong.maDatPhong, hd.maDatPhong))
      .orderBy(asc(schema.phong.soPhong)),
    db
      .select({
        loaiKhoanMuc: schema.chiTietHoaDon.loaiKhoanMuc,
        ghiChu: schema.chiTietHoaDon.ghiChu,
        soTien: schema.chiTietHoaDon.soTien,
      })
      .from(schema.chiTietHoaDon)
      .where(eq(schema.chiTietHoaDon.maHoaDon, ma))
      .orderBy(asc(schema.chiTietHoaDon.maCthd)),
  ]);

  return {
    maHoaDon: hd.maHoaDon,
    maDatPhong: hd.maDatPhong,
    ngayLap: hd.ngayLap,
    trangThai: hd.trangThai,
    loaiThanhToan: hd.loaiThanhToan,
    tongTien: hd.tongTien,
    khach: { hoTen: hd.hoTen, maKh: hd.maKh, cccd: hd.cccd, sdt: hd.sdt },
    phieu: {
      ngayCheckIn: hd.ngayCheckIn,
      ngayCheckOut: hd.ngayCheckOut,
      soDem: hd.soDem,
      soPhong: dsPhong.map((p) => p.soPhong),
      tenLoaiPhong: dsPhong[0]?.tenLoaiPhong ?? "—",
    },
    khoanMuc,
  };
}

/** Danh sach cho trang /invoices (muc "Hoa don" tren thanh dieu huong), moi nhat truoc. */
export async function getDanhSachHoaDon() {
  return db
    .select({
      maHoaDon: hoaDon.maHoaDon,
      maDatPhong: hoaDon.maDatPhong,
      ngayLap: hoaDon.ngayLap,
      tongTien: hoaDon.tongTien,
      trangThai: hoaDon.trangThai,
      hoTenKhach: kh.hoTen,
    })
    .from(hoaDon)
    .innerJoin(pdp, eq(pdp.maDatPhong, hoaDon.maDatPhong))
    .innerJoin(kh, eq(kh.maKh, pdp.maKh))
    // Nhieu hoa don cung gio lap (hoa don nhap sang nay), them ma de thu tu on dinh.
    .orderBy(desc(hoaDon.ngayLap), desc(hoaDon.maHoaDon));
}
```

- [ ] **Step 5: Viết `src/lib/queries/services.ts`** (thay toàn bộ nội dung)

```ts
import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";

/** Mat tien doc dich vu. Ghi nhan dich vu la viec cua phase 2 (sp_GhiNhanDichVu). */

export async function getDanhMucDichVu(): Promise<(typeof schema.dichVu.$inferSelect)[]> {
  return db.select().from(schema.dichVu).orderBy(asc(schema.dichVu.maDv));
}

export async function getSuDungDichVuTheoPhieu(maDatPhong: string) {
  const ds = await db
    .select({
      maDv: schema.suDungDichVu.maDv,
      tenDv: schema.dichVu.tenDv,
      donViTinh: schema.dichVu.donViTinh,
      giaDv: schema.suDungDichVu.donGiaThoiDiem,
      soLuong: schema.suDungDichVu.soLuong,
      thanhTien: schema.suDungDichVu.thanhTien,
    })
    .from(schema.suDungDichVu)
    .innerJoin(schema.dichVu, eq(schema.dichVu.maDv, schema.suDungDichVu.maDv))
    .where(eq(schema.suDungDichVu.maDatPhong, maDatPhong))
    .orderBy(asc(schema.suDungDichVu.ngaySuDung));
  // thanhTien la cot sinh nen kieu la string | null.
  return ds.map((s) => ({ ...s, thanhTien: s.thanhTien ?? "0.00" }));
}
```

- [ ] **Step 6: Chạy lại**

Run: `npx vitest run src/lib/queries/invoices.test.ts src/lib/queries/services.test.ts` → Expected: 8 passed.
Run: `npm test` → Expected: 0 failed, tiến trình tự thoát.
Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.

- [ ] **Step 7: Commit**

```bash
git add src/lib/queries/invoices.ts src/lib/queries/invoices.test.ts src/lib/queries/services.ts src/lib/queries/services.test.ts
git commit -m "feat: queries/invoices va services doc tu MySQL

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Doanh thu lấy từ `sp_BaoCaoDoanhThu`, không trừ tiền cọc

**Files:**
- Modify: `src/lib/queries/reports.ts` (thay toàn bộ), `src/components/reports/period-picker.tsx`
- Test: `src/lib/queries/reports.test.ts` (thay toàn bộ)

**Interfaces:**
- Consumes: `callProcedure`, `pool`, `getPhieuNhanHomNay` / `getPhieuTraHomNay` (Task 5), `getNgayHienTai` (Task 3).
- Produces:
  - `getDoanhThuTheoThang(): Promise<DoanhThuThang[]>`; `DoanhThuThang = { thang; tienPhong; dichVu; phuThu; giamGia; tong }` (**`giamTru` → `giamGia`**, spec §2.6).
  - `getChiSoTongQuan()` giữ nguyên các trường; `doanhThuHomNay` giờ là doanh thu thuần.
  - Mới: `gopDoanhThu12Thang(homNay: string, dong: DongDoanhThu[]): DoanhThuThang[]`, type `DongDoanhThu`.

- [ ] **Step 1: Viết test hỏng `src/lib/queries/reports.test.ts`** (thay toàn bộ nội dung)

```ts
import { describe, expect, it } from "vitest";
import type { RowDataPacket } from "mysql2";

import { pool } from "@/db";
import { getChiSoTongQuan, getDoanhThuTheoThang, gopDoanhThu12Thang } from "@/lib/queries/reports";
import { congTien } from "@/lib/tinh-toan";

describe("getDoanhThuTheoThang", () => {
  it("du 12 thang tinh den hom nay, cu nhat truoc", async () => {
    const ds = await getDoanhThuTheoThang();
    expect(ds.map((d) => d.thang)).toEqual([
      "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03",
      "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09",
    ]);
  });

  it("so cua thang lay dung tu sp_BaoCaoDoanhThu", async () => {
    const ds = await getDoanhThuTheoThang();
    expect(ds.at(-1)).toEqual({
      thang: "2026-09",
      tienPhong: "51060000.00",
      dichVu: "12630000.00",
      phuThu: "0.00",
      giamGia: "0.00",
      tong: "63690000.00",
    });
    expect(ds.find((d) => d.thang === "2026-01")).toEqual({
      thang: "2026-01",
      tienPhong: "8700000.00",
      dichVu: "5210000.00",
      phuThu: "100000.00",
      giamGia: "-100000.00",
      tong: "13910000.00",
    });
  });

  it("khong tru tien coc: tong = tien phong + dich vu + phu thu + giam gia", async () => {
    // Thang 09 co tien coc bu tru that tren hoa don da thanh toan; neu bi tru
    // vao doanh thu thi tong se nho hon 63.690.000.
    const [r] = await pool.query<RowDataPacket[]>(`
      SELECT SUM(ct.SoTien) AS coc
      FROM   CHI_TIET_HOA_DON ct JOIN HOA_DON hd ON hd.MaHoaDon = ct.MaHoaDon
      WHERE  hd.TrangThai = 'DaThanhToan' AND ct.LoaiKhoanMuc = 'GiamTru'
        AND  DATE_FORMAT(hd.NgayLap, '%Y-%m') = '2026-09'`);
    expect(Number(r[0].coc)).toBeLessThan(0);

    for (const d of await getDoanhThuTheoThang()) {
      expect([d.thang, congTien(d.tienPhong, d.dichVu, d.phuThu, d.giamGia)]).toEqual([d.thang, d.tong]);
      expect(Number(d.tienPhong)).toBeGreaterThanOrEqual(0);
      expect(Number(d.dichVu)).toBeGreaterThanOrEqual(0);
      expect(Number(d.phuThu)).toBeGreaterThanOrEqual(0);
      expect(Number(d.giamGia)).toBeLessThanOrEqual(0);
    }
  });
});

describe("gopDoanhThu12Thang", () => {
  // Review Focus #2
  it("thang khong co hoa don nao van co cot, moi so la '0.00'", () => {
    const ds = gopDoanhThu12Thang("2026-03-05", [
      {
        Thang: "2026-01",
        SoHoaDon: 1,
        TienPhong: "100.00",
        DichVu: "0.00",
        PhuThu: "0.00",
        GiamGia: "0.00",
        DoanhThuThuan: "100.00",
      },
    ]);
    expect(ds).toHaveLength(12);
    expect([ds[0].thang, ds.at(-1)!.thang]).toEqual(["2025-04", "2026-03"]);
    expect(ds.find((d) => d.thang === "2026-01")!.tong).toBe("100.00");
    expect(ds.find((d) => d.thang === "2026-02")).toEqual({
      thang: "2026-02",
      tienPhong: "0.00",
      dichVu: "0.00",
      phuThu: "0.00",
      giamGia: "0.00",
      tong: "0.00",
    });
  });

  it("dem lui qua moc nam, ke ca khi hom nay la ngay 31", () => {
    const ds = gopDoanhThu12Thang("2026-01-31", []);
    expect([ds[0].thang, ds.at(-1)!.thang]).toEqual(["2025-02", "2026-01"]);
  });
});

describe("getChiSoTongQuan", () => {
  it("so lieu cua hom nay, doanh thu la doanh thu thuan (khong phai so con phai thu)", async () => {
    expect(await getChiSoTongQuan()).toEqual({
      congSuat: 24,
      khachLuuTru: 10,
      doanhThuHomNay: "50530000.00",
      soHoaDonHomNay: 10,
      soNhanHomNay: 12,
      soTraHomNay: 9,
      hoaDonChuaThanhToan: 12,
      soPhong: 42,
      soPhongDangSuDung: 10,
    });
  });
});
```

- [ ] **Step 2: Chạy, xác nhận hỏng**

Run: `npx vitest run src/lib/queries/reports.test.ts`
Expected: FAIL — `gopDoanhThu12Thang is not a function`, thiếu trường `giamGia`, `doanhThuHomNay` sai.

- [ ] **Step 3: Viết `src/lib/queries/reports.ts`** (thay toàn bộ nội dung)

```ts
import "server-only";

import type { RowDataPacket } from "mysql2";

import { pool } from "@/db";
import { callProcedure } from "@/db/procedures";
import { getPhieuNhanHomNay, getPhieuTraHomNay } from "@/lib/queries/bookings";
import { getNgayHienTai } from "@/lib/queries/ngay";

/**
 * Mat tien so lieu bao cao. Doanh thu lay tu sp_BaoCaoDoanhThu: chi hoa don
 * DaThanhToan, doanh thu thuan = TienPhong + DichVu + PhuThu + GiamGia.
 * GiamTru la tien coc bu tru tren hoa don, KHONG phai giam doanh thu, nen
 * khong co mat o day.
 */

export type DoanhThuThang = {
  thang: string;
  tienPhong: string;
  dichVu: string;
  phuThu: string;
  giamGia: string;
  tong: string;
};

/** Mot dong ket qua cua sp_BaoCaoDoanhThu. */
export type DongDoanhThu = {
  Thang: string;
  SoHoaDon: number;
  TienPhong: string;
  DichVu: string;
  PhuThu: string;
  GiamGia: string;
  DoanhThuThuan: string;
};

/** 12 thang gan nhat tinh den homNay, dang 'YYYY-MM', cu nhat truoc. */
function muoiHaiThang(homNay: string): string[] {
  const [nam, thang] = homNay.split("-").map(Number);
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(nam, thang - 1, 1));
    d.setUTCMonth(d.getUTCMonth() - (11 - i));
    return d.toISOString().slice(0, 7);
  });
}

/**
 * Ghep ket qua sp_BaoCaoDoanhThu vao du 12 thang. Thu tuc chi tra thang CO hoa
 * don, nen thang trong phai tu dien "0.00" de bieu do luon du 12 cot.
 */
export function gopDoanhThu12Thang(homNay: string, dong: DongDoanhThu[]): DoanhThuThang[] {
  const theoThang = new Map(dong.map((d) => [d.Thang, d]));
  return muoiHaiThang(homNay).map((thang) => {
    const d = theoThang.get(thang);
    return {
      thang,
      tienPhong: d?.TienPhong ?? "0.00",
      dichVu: d?.DichVu ?? "0.00",
      phuThu: d?.PhuThu ?? "0.00",
      giamGia: d?.GiamGia ?? "0.00",
      tong: d?.DoanhThuThuan ?? "0.00",
    };
  });
}

export async function getDoanhThuTheoThang(): Promise<DoanhThuThang[]> {
  const homNay = await getNgayHienTai();
  const tuNgay = `${muoiHaiThang(homNay)[0]}-01`;
  const dong = await callProcedure<DongDoanhThu>("sp_BaoCaoDoanhThu", [tuNgay, homNay]);
  return gopDoanhThu12Thang(homNay, dong);
}

export async function getChiSoTongQuan() {
  const homNay = await getNgayHienTai();
  const [nhan, tra, doanhThu, [dem]] = await Promise.all([
    getPhieuNhanHomNay(),
    getPhieuTraHomNay(),
    callProcedure<DongDoanhThu>("sp_BaoCaoDoanhThu", [homNay, homNay]),
    pool.query<RowDataPacket[]>(`
      SELECT (SELECT COUNT(*) FROM PHONG)                                    AS soPhong,
             (SELECT COUNT(*) FROM PHONG WHERE TrangThai = 'DangSuDung')     AS soPhongDangSuDung,
             (SELECT COUNT(DISTINCT MaKH) FROM PHIEU_DAT_PHONG
              WHERE  TrangThai = 'DangO')                                    AS khachLuuTru,
             (SELECT COUNT(*) FROM HOA_DON WHERE TrangThai = 'ChuaThanhToan') AS hoaDonChuaThanhToan`),
  ]);

  const d = dem[0];
  const soPhong = Number(d.soPhong);
  const soPhongDangSuDung = Number(d.soPhongDangSuDung);
  // Hom nay chua co hoa don nao thanh toan thi thu tuc khong tra dong nao.
  const homNayDt = doanhThu[0];

  return {
    congSuat: soPhong === 0 ? 0 : Math.round((soPhongDangSuDung / soPhong) * 100),
    khachLuuTru: Number(d.khachLuuTru),
    doanhThuHomNay: homNayDt?.DoanhThuThuan ?? "0.00",
    soHoaDonHomNay: homNayDt?.SoHoaDon ?? 0,
    soNhanHomNay: nhan.length,
    soTraHomNay: tra.length,
    hoaDonChuaThanhToan: Number(d.hoaDonChuaThanhToan),
    soPhong,
    soPhongDangSuDung,
  };
}
```

- [ ] **Step 4: Sửa `period-picker.tsx` theo kiểu mới** (6 chỗ)

`src/components/reports/period-picker.tsx` — tìm:

```tsx
  giamTru: string;
  tong: string;
```

thay bằng:

```tsx
  giamGia: string;
  tong: string;
```

`src/components/reports/period-picker.tsx` — tìm:

```tsx
  const tongGiamTru = congTien(...hienThi.map((d) => d.giamTru));
```

thay bằng:

```tsx
  const tongGiamGia = congTien(...hienThi.map((d) => d.giamGia));
```

`src/components/reports/period-picker.tsx` — tìm:

```tsx
<TheSo nhan="Giảm trừ & giảm giá" giaTri={formatVnd(tongGiamTru)} phu="Tiền cọc đã thu, khuyến mãi" />
```

thay bằng:

```tsx
<TheSo nhan="Giảm giá" giaTri={formatVnd(tongGiamGia)} phu="Khoản mục GiamGia" />
```

`src/components/reports/period-picker.tsx` — tìm:

```tsx
Chiều cao cột = tổng sau giảm trừ
```

thay bằng:

```tsx
Chiều cao cột = doanh thu thuần
```

`src/components/reports/period-picker.tsx` — tìm:

```tsx
>Giảm trừ</th>
```

thay bằng:

```tsx
>Giảm giá</th>
```

`src/components/reports/period-picker.tsx` — tìm:

```tsx
{formatVnd(d.giamTru)}
```

thay bằng:

```tsx
{formatVnd(d.giamGia)}
```

- [ ] **Step 5: Chạy lại**

Run: `npx vitest run src/lib/queries/reports.test.ts` → Expected: 6 passed.
Run: `npm test` → Expected: 0 failed, tiến trình tự thoát.
Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.

- [ ] **Step 6: Commit**

```bash
git add src/lib/queries/reports.ts src/lib/queries/reports.test.ts src/components/reports/period-picker.tsx
git commit -m "fix: doanh thu lay tu sp_BaoCaoDoanhThu, khong tru tien coc

The \"Giam tru & giam gia\" doi thanh \"Giam gia\"; tien coc (GiamTru) la bu
tru tren hoa don, khong phai giam doanh thu.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Đăng nhập gọi `sp_DangNhap` qua Server Action

**Files:**
- Modify: `src/lib/queries/accounts.ts` (thay toàn bộ), `src/components/auth/login-form.tsx`, `src/app/(app)/layout.tsx` (thay toàn bộ)
- Create: `src/app/(auth)/login/actions.ts`
- Test: `src/lib/queries/accounts.test.ts` (thay toàn bộ)

**Interfaces:**
- Consumes: `callProcedure`, `thongBaoCsdl`, `db`.
- Produces:
  - `PhienDangNhap` (giữ nguyên), `dangNhap(ten, matKhau): Promise<PhienDangNhap>` (thay `dangNhapGia`; lỗi là lỗi mysql2 của `SIGNAL`), `dangNhapAnToan(ten, matKhau): Promise<{ ok: true; phien } | { ok: false; loi }>`, `getNhanVienMacDinh(): Promise<PhienDangNhap>` (thay hằng `NHAN_VIEN_MAC_DINH`).
  - Server Action `xacThucDangNhap(ten, matKhau): Promise<{ ok: true } | { ok: false; loi: string }>`.
  - `(app)/layout.tsx` gọi `await connection()`, nên mọi route bên trong render theo request (spec §2.4).

- [ ] **Step 1: Viết test hỏng `src/lib/queries/accounts.test.ts`** (thay toàn bộ nội dung)

```ts
import { describe, expect, it } from "vitest";

import { dangNhap, dangNhapAnToan, getNhanVienMacDinh } from "@/lib/queries/accounts";

describe("dangNhap", () => {
  it("dung ten va mat khau thi tra phien cua sp_DangNhap", async () => {
    expect(await dangNhap("admin", "Admin@123")).toEqual({
      maTk: "TK00000001",
      tenDangNhap: "admin",
      hoTen: "Nguyen Minh Anh",
      maLoaiTk: "LTK0000001",
      vaiTro: "Quan tri vien",
    });
  });

  it("sai mat khau va ten khong ton tai bao cung mot loi", async () => {
    await expect(dangNhap("admin", "sai")).rejects.toThrow("Ten dang nhap hoac mat khau khong dung");
    await expect(dangNhap("khongcoai", "gi do")).rejects.toThrow("Ten dang nhap hoac mat khau khong dung");
  });

  it("tai khoan TamNghi, NghiViec bi tu choi du dung mat khau", async () => {
    await expect(dangNhap("kythuat.son", "KyThuat@456")).rejects.toThrow(
      "Tai khoan dang o trang thai TamNghi, khong the dang nhap",
    );
    await expect(dangNhap("cskh.uyen", "CSKH@123")).rejects.toThrow(
      "Tai khoan dang o trang thai NghiViec, khong the dang nhap",
    );
  });
});

describe("dangNhapAnToan", () => {
  it("dung thi ok kem phien, sai thi ok:false kem thong bao cua CSDL", async () => {
    const dung = await dangNhapAnToan("letan.lan", "LeTan@123");
    expect(dung.ok && dung.phien.hoTen).toBe("Tran Ngoc Lan");
    await expect(dangNhapAnToan("letan.lan", "sai")).resolves.toEqual({
      ok: false,
      loi: "CSDL từ chối: Ten dang nhap hoac mat khau khong dung",
    });
  });
});

describe("getNhanVienMacDinh", () => {
  it("la letan.lan doc tu TAI_KHOAN, khop voi ket qua cua sp_DangNhap", async () => {
    expect(await getNhanVienMacDinh()).toEqual(await dangNhap("letan.lan", "LeTan@123"));
  });
});
```

- [ ] **Step 2: Chạy, xác nhận hỏng**

Run: `npx vitest run src/lib/queries/accounts.test.ts`
Expected: FAIL — `dangNhap is not a function` (module mới chỉ có `dangNhapGia`).

- [ ] **Step 3: Viết `src/lib/queries/accounts.ts`** (thay toàn bộ nội dung)

```ts
import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { thongBaoCsdl } from "@/db/loi";
import { callProcedure } from "@/db/procedures";
import * as schema from "@/db/schema";

/**
 * Dang nhap qua sp_DangNhap: CSDL doi chieu SHA2(mat khau, 256) voi cot
 * MatKhau, app khong giu hay bam mat khau o dau ca. Chua tao phien (phase 3).
 */

export type PhienDangNhap = {
  maTk: string;
  tenDangNhap: string;
  hoTen: string;
  maLoaiTk: string;
  vaiTro: string;
};

/** Mot dong ket qua cua sp_DangNhap khi dang nhap dung. */
type DongDangNhap = {
  MaTK: string;
  TenDangNhap: string;
  HoTen: string;
  MaLoaiTK: string;
  VaiTro: string;
};

/**
 * Sai ten / sai mat khau / tai khoan khong con lam viec: sp_DangNhap SIGNAL va
 * ham nay nem nguyen loi do. Sai ten va sai mat khau cung mot thong bao, de
 * khong lo tai khoan nao co that.
 */
export async function dangNhap(tenDangNhap: string, matKhau: string): Promise<PhienDangNhap> {
  const [d] = await callProcedure<DongDangNhap>("sp_DangNhap", [tenDangNhap, matKhau]);
  return {
    maTk: d.MaTK,
    tenDangNhap: d.TenDangNhap,
    hoTen: d.HoTen,
    maLoaiTk: d.MaLoaiTK,
    vaiTro: d.VaiTro,
  };
}

/** Ban an toan cho Server Action: loi nghiep vu thanh { ok: false, loi }. */
export async function dangNhapAnToan(
  tenDangNhap: string,
  matKhau: string,
): Promise<{ ok: true; phien: PhienDangNhap } | { ok: false; loi: string }> {
  try {
    return { ok: true, phien: await dangNhap(tenDangNhap, matKhau) };
  } catch (err) {
    return { ok: false, loi: thongBaoCsdl(err) };
  }
}

/**
 * Nhan vien hien tren sidebar khi chua co phien dang nhap that (phase 3 thay
 * bang nguoi trong phien). Doc tu chinh TAI_KHOAN chu khong go tay, de ten va
 * vai tro khong lech voi du lieu.
 */
export async function getNhanVienMacDinh(): Promise<PhienDangNhap> {
  const [nv] = await db
    .select({
      maTk: schema.taiKhoan.maTk,
      tenDangNhap: schema.taiKhoan.tenDangNhap,
      hoTen: schema.taiKhoan.hoTen,
      maLoaiTk: schema.taiKhoan.maLoaiTk,
      vaiTro: schema.loaiTaiKhoan.tenLoaiTk,
    })
    .from(schema.taiKhoan)
    .innerJoin(schema.loaiTaiKhoan, eq(schema.loaiTaiKhoan.maLoaiTk, schema.taiKhoan.maLoaiTk))
    .where(eq(schema.taiKhoan.tenDangNhap, "letan.lan"));
  return nv;
}
```

- [ ] **Step 4: Tạo `src/app/(auth)/login/actions.ts`**

```ts
"use server";

import { dangNhapAnToan } from "@/lib/queries/accounts";

/**
 * Form dang nhap goi ham nay tren server, nen sp_DangNhap va mat khau khong
 * di qua bundle trinh duyet. Chua tao phien: thanh cong thi client tu chuyen
 * ve "/" (phase 3 moi ghi cookie va chan route).
 */
export async function xacThucDangNhap(
  tenDangNhap: string,
  matKhau: string,
): Promise<{ ok: true } | { ok: false; loi: string }> {
  const r = await dangNhapAnToan(tenDangNhap, matKhau);
  return r.ok ? { ok: true } : r;
}
```

- [ ] **Step 5: Sửa `login-form.tsx`** (3 chỗ)

`src/components/auth/login-form.tsx` — tìm:

```tsx
import { dangNhapGia } from "@/lib/queries/accounts";
```

thay bằng:

```tsx
import { xacThucDangNhap } from "@/app/(auth)/login/actions";
```

`src/components/auth/login-form.tsx` — tìm:

```tsx
 * Goi dangNhapGia ngay phia client vi day la du lieu gia (spec muc 6). Khi noi
 * CSDL that, doi thanh Server Action goi sp_DangNhap — luc do mat khau va danh
 * sach tai khoan se khong con nam trong bundle trinh duyet nua.
```

thay bằng:

```tsx
 * Goi Server Action xacThucDangNhap, nen sp_DangNhap chay tren server va mat
 * khau khong di qua bundle trinh duyet. Chua tao phien: dang nhap dung thi
 * chuyen ve "/" (phase 3 moi ghi cookie va chan route).
```

`src/components/auth/login-form.tsx` — tìm:

```tsx
    try {
      await dangNhapGia(tenDangNhap, matKhau);
      router.push("/");
    } catch (err) {
      setLoi(err instanceof Error ? err.message : String(err));
      setDangGui(false);
    }
```

thay bằng:

```tsx
    try {
      const r = await xacThucDangNhap(tenDangNhap, matKhau);
      if (r.ok) {
        router.push("/");
        return;
      }
      setLoi(r.loi);
    } catch {
      // Loi khong phai loi nghiep vu (vi du mat ket noi CSDL) nem ra tu server.
      setLoi("Không kết nối được máy chủ, vui lòng thử lại");
    }
    setDangGui(false);
```

- [ ] **Step 6: Viết lại `src/app/(app)/layout.tsx`** (thay toàn bộ nội dung)

```tsx
import { connection } from "next/server";

import { Sidebar } from "@/components/layout/sidebar";
import { getNhanVienMacDinh } from "@/lib/queries/accounts";

/**
 * Khung chung cua 8 man hinh nghiep vu: sidebar 248px + vung noi dung.
 * Chua co phien dang nhap that (phase 3), nen nhan vien la tai khoan mac dinh
 * doc tu TAI_KHOAN roi truyen xuong Sidebar bang prop.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Moi trang ben trong doc CSDL, nen phai render theo tung request. Khong co
  // dong nay thi next build prerender trang va dong bang du lieu luc build.
  await connection();
  const nv = await getNhanVienMacDinh();

  return (
    <div className="flex h-screen min-w-[1280px]">
      <Sidebar hoTen={nv.hoTen} vaiTro={nv.vaiTro} maTk={nv.maTk} />
      <div className="flex min-w-0 flex-grow flex-col">{children}</div>
    </div>
  );
}
```

- [ ] **Step 7: Chạy lại**

Run: `npx vitest run src/lib/queries/accounts.test.ts` → Expected: 5 passed.
Run: `npm test` → Expected: 0 failed, tiến trình tự thoát.
Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.

- [ ] **Step 8: Commit**

```bash
git add src/lib/queries/accounts.ts src/lib/queries/accounts.test.ts "src/app/(auth)/login/actions.ts" src/components/auth/login-form.tsx "src/app/(app)/layout.tsx"
git commit -m "feat: dang nhap goi sp_DangNhap qua Server Action

Sidebar doc nhan vien mac dinh tu TAI_KHOAN; layout (app) render theo request.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Các trang lấy ngày từ CSDL, xóa dữ liệu giả

**Files:**
- Modify: `src/app/(app)/page.tsx`, `front-desk/page.tsx`, `bookings/new/page.tsx`, `reports/page.tsx`, `rooms/page.tsx`, `src/app/db-check/page.tsx`, `src/components/front-desk/booking-picker.tsx`
- Delete: `src/lib/mock/` (`data.ts`, `data.test.ts`, `now.ts`)

**Interfaces:**
- Consumes: `getNgayHienTai`, `getGioHienTai` (Task 3); các query của Task 4–9.
- Produces: không còn import nào tới `@/lib/mock`.

Task này không có test đơn vị mới. Hành vi được kiểm bằng `tsc`, `next build` (route phải là ƒ Dynamic) và các chuỗi trên trang ở Task 11.

- [ ] **Step 1: Thay `NGAY_HIEN_TAI` bằng ngày của CSDL; sửa các dòng chữ không còn đúng** (19 chỗ)

`src/app/(app)/page.tsx` — xóa dòng:

```tsx
import { NGAY_HIEN_TAI } from "@/lib/mock/now";
```

`src/app/(app)/page.tsx` — tìm:

```tsx
import { getChiSoTongQuan } from "@/lib/queries/reports";
```

thay bằng:

```tsx
import { getNgayHienTai } from "@/lib/queries/ngay";
import { getChiSoTongQuan } from "@/lib/queries/reports";
```

`src/app/(app)/page.tsx` — tìm:

```tsx
  const [chiSo, thongKe, phong, nhan, tra, nhatKy] = await Promise.all([
```

thay bằng:

```tsx
  const [homNay, chiSo, thongKe, phong, nhan, tra, nhatKy] = await Promise.all([
    getNgayHienTai(),
```

`src/app/(app)/page.tsx` — tìm:

```tsx
const thu = THU[new Date(`${NGAY_HIEN_TAI}T00:00:00Z`).getUTCDay()];
```

thay bằng:

```tsx
const thu = THU[new Date(`${homNay}T00:00:00Z`).getUTCDay()];
```

`src/app/(app)/page.tsx` — tìm:

```tsx
phu={`${thu}, ${formatNgay(NGAY_HIEN_TAI)} · Ca sáng`}
```

thay bằng:

```tsx
phu={`${thu}, ${formatNgay(homNay)} · Ca sáng`}
```

`src/app/(app)/front-desk/page.tsx` — tìm:

```tsx
import { NGAY_HIEN_TAI } from "@/lib/mock/now";
import { getPhieuNhanHomNay, getPhieuTraHomNay } from "@/lib/queries/bookings";
```

thay bằng:

```tsx
import { getPhieuNhanHomNay, getPhieuTraHomNay } from "@/lib/queries/bookings";
import { getNgayHienTai } from "@/lib/queries/ngay";
```

`src/app/(app)/front-desk/page.tsx` — tìm:

```tsx
  const [nhan, tra] = await Promise.all([getPhieuNhanHomNay(), getPhieuTraHomNay()]);
```

thay bằng:

```tsx
  const [homNay, nhan, tra] = await Promise.all([
    getNgayHienTai(),
    getPhieuNhanHomNay(),
    getPhieuTraHomNay(),
  ]);
```

`src/app/(app)/front-desk/page.tsx` — tìm:

```tsx
phu={`${formatNgay(NGAY_HIEN_TAI)} · ${nhan.length} lượt nhận · ${tra.length} lượt trả`}
```

thay bằng:

```tsx
phu={`${formatNgay(homNay)} · ${nhan.length} lượt nhận · ${tra.length} lượt trả`}
```

`src/app/(app)/bookings/new/page.tsx` — tìm:

```tsx
import { NGAY_HIEN_TAI } from "@/lib/mock/now";
import { getLoaiPhongConTrong } from "@/lib/queries/bookings";
import { getDanhSachKhachHang } from "@/lib/queries/customers";
```

thay bằng:

```tsx
import { getLoaiPhongConTrong } from "@/lib/queries/bookings";
import { getDanhSachKhachHang } from "@/lib/queries/customers";
import { getNgayHienTai } from "@/lib/queries/ngay";
```

`src/app/(app)/bookings/new/page.tsx` — tìm:

```tsx
  const [loaiPhong, khach] = await Promise.all([
    getLoaiPhongConTrong(NGAY_HIEN_TAI, sauHaiDem(NGAY_HIEN_TAI)),
```

thay bằng:

```tsx
  const homNay = await getNgayHienTai();
  const [loaiPhong, khach] = await Promise.all([
    getLoaiPhongConTrong(homNay, sauHaiDem(homNay)),
```

`src/app/(app)/bookings/new/page.tsx` — tìm:

```tsx
            Dữ liệu giả — phiếu không được lưu
```

thay bằng:

```tsx
            Chức năng lưu phiếu chưa được nối với CSDL
```

`src/app/(app)/bookings/new/page.tsx` — tìm:

```tsx
          ngayMacDinh={NGAY_HIEN_TAI}
```

thay bằng:

```tsx
          ngayMacDinh={homNay}
```

`src/app/(app)/reports/page.tsx` — tìm:

```tsx
import { NGAY_HIEN_TAI } from "@/lib/mock/now";
```

thay bằng:

```tsx
import { getNgayHienTai } from "@/lib/queries/ngay";
```

`src/app/(app)/reports/page.tsx` — tìm:

```tsx
  const duLieu = await getDoanhThuTheoThang();
```

thay bằng:

```tsx
  const [homNay, duLieu] = await Promise.all([getNgayHienTai(), getDoanhThuTheoThang()]);
```

`src/app/(app)/reports/page.tsx` — tìm:

```tsx
phu={`Kỳ 12 tháng · tính đến ${formatNgay(NGAY_HIEN_TAI)}`}
```

thay bằng:

```tsx
phu={`Kỳ 12 tháng · tính đến ${formatNgay(homNay)}`}
```

`src/app/(app)/rooms/page.tsx` — tìm:

```tsx
import { NGAY_HIEN_TAI } from "@/lib/mock/now";
```

thay bằng:

```tsx
import { getGioHienTai, getNgayHienTai } from "@/lib/queries/ngay";
```

`src/app/(app)/rooms/page.tsx` — tìm:

```tsx
  const [phong, nhatKy] = await Promise.all([getSoDoPhong(), getNhatKyBuongPhong()]);
```

thay bằng:

```tsx
  const [homNay, gio, phong, nhatKy] = await Promise.all([
    getNgayHienTai(),
    getGioHienTai(),
    getSoDoPhong(),
    getNhatKyBuongPhong(),
  ]);
```

`src/app/(app)/rooms/page.tsx` — tìm:

```tsx
phu={`Cập nhật 10:42 · ${formatNgay(NGAY_HIEN_TAI)}`}
```

thay bằng:

```tsx
phu={`Cập nhật ${gio} · ${formatNgay(homNay)}`}
```

`src/app/db-check/page.tsx` — tìm:

```tsx
          Trang tiện ích, không nằm trong thanh điều hướng. Chín màn hình nghiệp
          vụ dùng dữ liệu giả trong <code className="font-mono">src/lib/mock/</code>;
          trang này là chỗ duy nhất đọc thẳng MySQL qua Drizzle.
```

thay bằng:

```tsx
          Trang tiện ích, không nằm trong thanh điều hướng: đọc thẳng MySQL qua
          Drizzle để kiểm tra kết nối và số dòng của từng bảng.
```

`src/components/front-desk/booking-picker.tsx` — tìm:

```tsx
                Bản demo dùng dữ liệu giả — thao tác không được lưu lại.
```

thay bằng:

```tsx
                Các nút thao tác chưa được nối với CSDL.
```

- [ ] **Step 2: Xóa dữ liệu giả, kiểm không còn chỗ nào dùng**

```bash
git rm -r src/lib/mock
grep -rn "lib/mock\|NGAY_HIEN_TAI\|dangNhapGia\|NHAN_VIEN_MAC_DINH" src; echo "grep_exit=$?"
grep -rn "giamTru" src/lib/queries src/components/reports; echo "grep_exit=$?"
```

Expected: không in dòng nào, cả hai lần `grep_exit=1`. (`giamTru` trong `src/app/(app)/invoices/[maHoaDon]/page.tsx` là tổng khoản âm **trên một hóa đơn**, gồm tiền cọc bị trừ. Đó là đúng nghiệp vụ, nên không nằm trong phạm vi grep.)

- [ ] **Step 3: Kiểm kiểu, lint, test, build**

Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.
Run: `npm test` → Expected: `Test Files 16 passed`, `Tests 109 passed`.
Run: `npm run build` → Expected: build xong, bảng route như sau (○ chỉ ở `/_not-found` và `/login`):

```
┌ ƒ /
├ ○ /_not-found
├ ƒ /bookings/new
├ ƒ /customers
├ ƒ /db-check
├ ƒ /front-desk
├ ƒ /invoices
├ ƒ /invoices/[maHoaDon]
├ ○ /login
├ ƒ /reports
├ ƒ /rooms
└ ƒ /services
```

- [ ] **Step 4: Commit**

```bash
git add -A src
git commit -m "feat: cac trang lay ngay tu CSDL, render theo request, xoa du lieu gia

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Cài lại CSDL dev và kiểm trên giao diện

**Files:**
- Không sửa code. Có thể có `src/db/schema.ts` / `src/db/meta/*` do `npm run db:pull` sinh lại.

**Interfaces:**
- Consumes: toàn bộ Task 1–10.
- Produces: CSDL dev `QuanLyKhachSan` đúng bộ script mới; 9 màn hình hiện dữ liệu thật.

- [ ] **Step 1: Hỏi người dùng trước khi xóa CSDL dev**

`01_Create_Database.sql` chạy `DROP DATABASE QuanLyKhachSan`. Gửi người dùng câu hỏi sau, và **chỉ làm tiếp khi họ trả lời đồng ý**:

> CSDL dev `QuanLyKhachSan` sẽ bị xóa và tạo lại từ `01`–`07`. Dữ liệu hiện có (14 bảng mẫu và 5 thủ tục báo cáo) sẽ mất, nhưng được sao lưu bằng `mysqldump` trước. Đồng ý chạy không?

- [ ] **Step 2: Sao lưu rồi cài lại**

```bash
cd /Users/anhpham/PA/UIT/Demo
set -a; source .env.local; set +a
BK=$(mktemp -d); mysqldump -uroot -h127.0.0.1 --routines --triggers QuanLyKhachSan > "$BK/QuanLyKhachSan-truoc-phase1.sql" && echo "Sao luu: $BK"
for f in 01_Create_Database 02_Functions 03_Views 04_Triggers 05_Cursors 06_Procedures 07_Sample_Data; do
  mysql -uroot -h127.0.0.1 --default-character-set=utf8mb4 < "$QLKS_SCRIPTS_DIR/$f.sql" > /dev/null || { echo "LOI o $f"; break; }
done
mysql -uroot -h127.0.0.1 -N QuanLyKhachSan -e "
  SELECT CURDATE(),
    (SELECT COUNT(*) FROM PHIEU_DAT_PHONG WHERE TrangThai = 'DaDat' AND NgayCheckIn  = CURDATE()),
    (SELECT COUNT(*) FROM PHIEU_DAT_PHONG WHERE TrangThai = 'DangO' AND NgayCheckOut = CURDATE()),
    (SELECT COUNT(*) FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE()),
    (SELECT COUNT(*) FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE()),
    (SELECT COUNT(*) FROM information_schema.VIEWS    WHERE TABLE_SCHEMA   = DATABASE());"
```

Expected: không có dòng `LOI o …`; dòng cuối là `<hôm nay> 12 9 24 13 3`.

- [ ] **Step 3: Sinh lại schema Drizzle (spec §2.8)**

Run: `npm run db:pull && git status --short src/db && git diff --stat src/db`
Expected (đã chạy thử khi lập plan trên CSDL có đủ `01`–`07`):
- chỉ `src/db/schema.ts` đổi: import thêm `mysqlView, bigint, text` và thêm cuối file 3 view `vPhieudatdanghieuluc`, `vPhongkhadung`, `vTinhtrangphonghomnay`;
- `relations.ts` và `meta/*` không đổi;
- drizzle-kit in `No SQL generated, you already have migrations in project`.

Chạy `npx tsc --noEmit && npm test` (Expected: không lỗi, 109 passed), rồi commit như dưới. Không sửa tay `schema.ts`. Phase 1 không dùng 3 view này; câu SQL định nghĩa view trong file có chứa tên CSDL `quanlykhachsan`, đó là do drizzle-kit sinh ra và không ảnh hưởng truy vấn.

```bash
git add src/db
git commit -m "chore: cap nhat schema sinh boi db:pull sau khi cai lai CSDL

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Kiểm các trang bằng `curl`**

Dev server: nếu `:3000` đang chạy sẵn thì dùng luôn. Nếu chưa, mở trong Terminal panel của người dùng bằng `npm run dev`; không dùng preview pane, vì người dùng đã từ chối.

```bash
for p in / /rooms /bookings/new /front-desk /customers /services /invoices /invoices/HD00000001 /reports /db-check /login; do
  printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3000$p")" "$p"
done
curl -s http://localhost:3000/ | grep -o "12 / 9\|50.530.000\|12 phiếu chờ nhận phòng" | sort -u
curl -s http://localhost:3000/front-desk | grep -o "12 lượt nhận · 9 lượt trả"
curl -s http://localhost:3000/rooms | grep -o "Cập nhật [0-9:]*"
curl -s http://localhost:3000/reports | grep -c "Giảm trừ"
```

Expected:
- mọi route trả `200`;
- trang `/` in đủ ba chuỗi `12 / 9`, `50.530.000`, `12 phiếu chờ nhận phòng` (ngày nào cũng vậy, Task 2 Step 8);
- `/front-desk` in `12 lượt nhận · 9 lượt trả`;
- `/rooms` in `Cập nhật HH:MM` theo giờ hiện tại, không còn `10:42`;
- `/reports` in `0`.

- [ ] **Step 5: Kiểm trên trình duyệt, gửi ảnh cho người dùng**

Mở bằng trình duyệt (hỏi người dùng trước nếu dùng browser pane) các màn Tổng quan, Nhận & trả phòng, Báo cáo, Khách hàng, rồi chụp màn hình từng màn. Thử `/login`:
- sai mật khẩu `admin` / `sai` → hiện `CSDL từ chối: Ten dang nhap hoac mat khau khong dung`;
- `letan.lan` / `LeTan@123` → chuyển về `/`.

Gửi các ảnh chụp cho người dùng.

- [ ] **Step 6: Kiểm lần cuối**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: tất cả qua; `git status --short` sạch; `git log --oneline main..` liệt kê các commit của Task 1–10 (và commit `db:pull` nếu có).
