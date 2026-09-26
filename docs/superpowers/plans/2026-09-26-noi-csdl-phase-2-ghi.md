# Nối CSDL — Phase 2: các nút ghi gọi thủ tục thật — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mọi nút ghi trên 9 màn hình gọi đúng thủ tục của `06_Procedures.sql` (12/12 thủ tục của Bảng 4.1 gọi được từ giao diện), đi trọn một vòng đặt phòng → trả phòng → dọn phòng ngay trên giao diện.

**Architecture:** Hai tầng như spec §3.1. `src/lib/thao-tac/*.ts` gọi thủ tục và trả `KetQua<T>`; đây là tầng được test trên CSDL kiểm thử. `actions.ts` cạnh từng route là Server Action mỏng: kiểm kiểu và định dạng đầu vào, gọi thao tác, thành công thì `refresh()`. `callProcedureOut` lấy tham số OUT trên cùng một connection. Bốn thủ tục lệch vòng đời được sửa trong `06` và có ca hồi quy riêng.

**Tech Stack:** Next.js 16.3.5 (App Router, Server Actions, `refresh()` của `next/cache`), React 19, Drizzle ORM 0.45 + mysql2 3.24, MySQL 9.7, Vitest 5, Python 3 (script sửa `06`), Chrome headless + CDP (kiểm giao diện).

**Spec:** `docs/superpowers/specs/2026-09-26-noi-csdl-phase-2-ghi-design.md`. Spec đã được bổ sung khi lập plan: hai dòng mới ở bảng §4, tiền cọc theo đơn giá phase 1, tab Trả liệt kê mọi phiếu `DangO`, lỗi `fatal` ở §3.3.

## Global Constraints

- AGENTS.md: Next 16 có thay đổi phá vỡ, nên đọc `node_modules/next/dist/docs/` trước khi viết code Next. Cho plan này đã đọc: `03-api-reference/04-functions/refresh.md`, `02-guides/server-actions.md`, `03-api-reference/01-directives/use-server.md`. `refresh()` chỉ gọi được trong Server Action; `redirect()` ném ngoại lệ điều khiển, nên đặt sau cùng.
- Chữ hiển thị trên giao diện: tiếng Việt có dấu. Chú thích trong code (TS và SQL): tiếng Việt **không dấu**.
- Không sửa tay `src/db/schema.ts`. Không thêm thư viện.
- **Không lặp quy tắc nghiệp vụ ở app** (spec §3.1). Server Action chỉ kiểm hình thức: mã `CHAR(10)` đúng tiền tố, số lượng nguyên dương, tiền không âm, ngày `YYYY-MM-DD`, chuỗi đúng độ dài. Trạng thái phiếu / phòng / hóa đơn do thủ tục và trigger quyết định, nên nút không bị khóa theo trạng thái (ví dụ "Xác nhận trả phòng" vẫn bấm được khi chưa thanh toán; CSDL từ chối).
- Mọi thao tác ghi đi qua thủ tục của `06`. App không `INSERT` / `UPDATE` / `DELETE` thẳng. Chỉ test mới được ghi thẳng để dựng tình huống.
- Thông báo lỗi (spec §3.3): `SIGNAL 45000` thành `"CSDL từ chối: " + MESSAGE_TEXT` (bỏ `"Loi: "`). Lỗi CSDL khác thành `"Lỗi CSDL (<errno>): <message>"` và ghi `console.error`. Lỗi không đến từ CSDL thì ném tiếp.
- `MaTK` của `sp_DatPhong`, `sp_NhanPhong`, `sp_GhiNhanDonPhong`, `sp_GhiNhanSuaPhong` = `getNhanVienMacDinh().maTk` (spec §3.4). Hàm `thao-tac` nhận `maTk` làm tham số, còn action lấy giá trị đó; phase 3 chỉ đổi action.
- `Scripts/` nằm ngoài git (thư mục OneDrive) và nhóm đang sửa song song: ngày 26/09 lúc 19:52–19:56 cả 8 file vừa được rút gọn chú thích. Vì vậy:
  - sao lưu và đọc lại file ngay trước khi sửa;
  - chỉ thay đoạn **code** đã neo (mỗi đoạn đúng 1 lần), không ghi đè cả file;
  - thiếu chỗ neo thì dừng lại và báo người dùng.
- Script SQL: chú thích không dấu, ASCII, xuống dòng LF.
- Không chạy `01` vào CSDL dev. Chỉ chạy lại `06` vào CSDL dev ở Task 17, sau khi hỏi người dùng. Không chạy `08` (phase 3). Chạy lại `06` làm mất quyền `EXECUTE` mà `08` đã cấp trên các thủ tục (Task 16 ghi vào README).
- Commit: thông điệp tiếng Việt không dấu dạng `feat: …` / `test: …` / `fix: …`, kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Phase 1 đã merge (`main` = `cb43450`). Trên `main`: `npm test` → 16 file, 112 test.

## Review Focus

1. **Tiền gõ theo kiểu Việt Nam**: ô "Thu thêm cọc" và "Chi phí" nhận `300.000` hay `1,500,000` như ba trăm nghìn đồng và một triệu rưỡi đồng. Không được hiểu thành 300 đồng, cũng không được báo "không hợp lệ". Test `docSoTien` ở Task 4.
2. **Server Action nhận object / mảng / số thay cho chuỗi** (POST tự chế, ví dụ `{ "$ne": "" }`): trả `"… không hợp lệ"` và không chạm CSDL. mysql2 dịch object thành `cot = gia tri` nếu để lọt. Có `kiem-tra.test.ts` ở Task 4, và `actions.test.ts` ở mỗi Task 11–15.
3. **MySQL tắt, hoặc connection bị ngắt giữa lúc bấm nút**: dưới nút hiện `Lỗi CSDL (…)`, trang không vỡ. mysql2 báo connection bị ngắt bằng lỗi `fatal` không có `errno`. Test ở Task 3.
4. **Bấm một nút hai lần, hoặc tab khác đã thao tác trên cùng phiếu**: lần sau CSDL từ chối, không ghi trùng, trạng thái giữ đúng. Test "gọi lần thứ hai" ở Task 8.
5. **Thủ tục lỗi liên tiếp (bấm sai thứ tự nhiều lần)**: connection luôn được trả về pool, nên sau hơn 10 lần lỗi (pool có 10 connection) app vẫn chạy. Test ở Task 2.

Review Focus #3 của phase 1 ("lỗi không phải nghiệp vụ thì ném tiếp") được spec phase 2 §3.3 **cố ý đảo lại** cho lỗi CSDL. Task 3 sửa test cũ theo spec.

## Cấu trúc file

| File | Trách nhiệm |
|---|---|
| `src/test/nap-lai-mau.ts` *(mới)* | `napLaiDuLieuMau()`: chạy lại `07` vào CSDL kiểm thử, dùng trong `beforeEach` / `afterAll` của mọi file test ghi |
| `src/test/csdl.ts` *(mới)* | `dong()`, `trangThai()`: đọc nhanh trạng thái phiếu / phòng / hóa đơn trong test |
| `vitest.config.mts` | `fileParallelism: false` |
| `src/db/procedures.ts` | `callProcedureOut` (tham số OUT); `callProcedure` bọc lại |
| `src/db/loi.ts` | nhánh lỗi CSDL chung, gồm lỗi `fatal` |
| `src/lib/thao-tac/kiem-tra.ts` *(mới)* | kiểm hình thức cho Server Action |
| `src/lib/thao-tac/ket-qua.ts` *(mới)* | `KetQua<T>`, `thucHien()` |
| `src/lib/thao-tac/{dat-phong,hoa-don,dich-vu,le-tan,buong-phong}.ts` *(mới)* | mỗi hàm một thủ tục |
| `src/lib/tinh-toan.ts` | `docSoTien()` |
| `src/lib/queries/bookings.ts` | dùng `laNgay`; `PhieuTomTat.hoaDon` |
| `src/lib/lam-moi.ts` *(mới)* | `lamMoiNeuXong()`: `refresh()` khi thao tác thành công |
| `src/components/shared/{thong-bao.tsx,use-thao-tac.ts}` *(mới)* | dòng kết quả dưới nút; hook chạy action trong transition |
| `src/app/(app)/{bookings/new,front-desk,invoices/[maHoaDon],services,rooms}/actions.ts` | Server Action (mới, trừ `bookings/new`) + `actions.test.ts` |
| `src/components/bookings/booking-form.tsx`, `front-desk/booking-picker.tsx`, `services/service-usage-form.tsx`, `invoices/thanh-toan-form.tsx` *(mới)*, `rooms/nhat-ky-form.tsx` *(mới)* | nối nút |
| `src/app/(app)/{bookings/new,front-desk,invoices/[maHoaDon],rooms}/page.tsx` | truyền dữ liệu, bỏ chữ "chưa được nối" |
| `src/db/thu-tuc.test.ts` *(mới)* | hồi quy 4 thủ tục sửa ở `06` |
| `$QLKS_SCRIPTS_DIR/06_Procedures.sql` | sửa `sp_NhanPhong`, `sp_GhiNhanDichVu`, `sp_GhiNhanDonPhong`, `sp_HuyPhieuDat` |
| `README.md` | phase 2 xong; chạy lại `06` thì phải chạy lại `08` |

---

### Task 0: Tạo nhánh làm việc

- [ ] **Step 1: Tạo nhánh từ `main`, commit spec đã bổ sung và plan**

```bash
cd /Users/anhpham/PA/UIT/Demo
git status --short
git switch -c noi-csdl-phase-2
git add docs/superpowers
git commit -m "docs: bo sung spec phase 2 khi lap plan va plan phase 2

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Expected: `git status --short` chỉ liệt kê file trong `docs/superpowers/`, là spec phase 2 và plan này. Sau đó hiện `Switched to a new branch 'noi-csdl-phase-2'` và có một commit docs.

---

### Task 1: Hạ tầng test ghi: nạp lại dữ liệu mẫu, chạy file tuần tự

**Files:**
- Create: `src/test/nap-lai-mau.ts`, `src/test/csdl.ts`
- Modify: `vitest.config.mts`
- Test: `src/test/nap-lai-mau.test.ts`

**Interfaces:**
- Consumes: `scripts/db-nap-lai-mau.sh` (phase 1): `bash scripts/db-nap-lai-mau.sh <url>` chạy lại `07` vào CSDL của `<url>`, và đóng băng ngày khi có `DB_NGAY_CO_DINH`. `NGAY_CO_DINH` (`src/test/ngay-co-dinh.ts`). `pool` (`@/db`).
- Produces:
  - `napLaiDuLieuMau(): void` (đồng bộ, khoảng 0,2 giây). Ném lỗi `"napLaiDuLieuMau chi chay tren CSDL kiem thu (DATABASE_URL_TEST)."` nếu `process.env.DATABASE_URL !== process.env.DATABASE_URL_TEST`.
  - `dong(cau: string, thamSo?: unknown[]): Promise<Record<string, unknown>>`: dòng đầu dạng object thường.
  - `trangThai(maDatPhong: string): Promise<{ phieu, phong, hoaDon }>`. `phong` là trạng thái các phòng nối bằng dấu phẩy; `hoaDon` là `null` khi chưa lập.
  - Mọi file test ghi sau này mở đầu bằng `beforeEach(napLaiDuLieuMau); afterAll(napLaiDuLieuMau);`.

Mỗi lần nạp lại chỉ mất khoảng 0,2 giây, nên test ghi nạp lại trước **từng ca** chứ không chỉ trước từng file như spec §6 ghi. Nhờ vậy các ca độc lập nhau. `afterAll` trả CSDL về dữ liệu gốc cho file test đọc chạy sau.

- [ ] **Step 1: Viết test hỏng `src/test/nap-lai-mau.test.ts`**

```ts
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
```

- [ ] **Step 2: Chạy, xác nhận hỏng**

Run: `npx vitest run src/test/nap-lai-mau.test.ts`
Expected: FAIL, `Cannot find package '@/test/nap-lai-mau'`.

- [ ] **Step 3: Viết `src/test/nap-lai-mau.ts` và `src/test/csdl.ts`**

`src/test/nap-lai-mau.ts`:

```ts
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
```

`src/test/csdl.ts`:

```ts
import type { RowDataPacket } from "mysql2";

import { pool } from "@/db";

/** Dong dau tien cua mot cau SELECT, dang object thuong (de so bang toEqual). */
export async function dong(cau: string, thamSo: unknown[] = []): Promise<Record<string, unknown>> {
  const [rows] = await pool.query<RowDataPacket[]>(cau, thamSo);
  return { ...rows[0] };
}

/** Trang thai hien tai cua mot phieu, cac phong cua no va hoa don cua no. */
export async function trangThai(maDatPhong: string) {
  return dong(
    `SELECT pd.TrangThai AS phieu,
            (SELECT GROUP_CONCAT(p.TrangThai ORDER BY p.SoPhong)
             FROM CHI_TIET_DAT_PHONG ct JOIN PHONG p ON p.MaPhong = ct.MaPhong
             WHERE ct.MaDatPhong = pd.MaDatPhong) AS phong,
            (SELECT TrangThai FROM HOA_DON WHERE MaDatPhong = pd.MaDatPhong) AS hoaDon
     FROM PHIEU_DAT_PHONG pd WHERE pd.MaDatPhong = ?`,
    [maDatPhong],
  );
}
```

- [ ] **Step 4: Cho file test chạy tuần tự**

`vitest.config.mts` — tìm:

```ts
    globalSetup: ["./src/test/dung-db-test.ts"],
```

thay bằng:

```ts
    globalSetup: ["./src/test/dung-db-test.ts"],
    // Test ghi (thao-tac/*) sua CSDL kiem thu dung chung, nen cac file chay
    // lan luot; moi file ghi tu nap lai du lieu mau (src/test/nap-lai-mau.ts).
    fileParallelism: false,
```

- [ ] **Step 5: Chạy lại**

Run: `npx vitest run src/test/nap-lai-mau.test.ts` → Expected: 2 passed.
Run: `npm test` → Expected: `Test Files 17 passed`, `Tests 114 passed`. Tổng thời gian dài hơn phase 1 (khoảng 6 giây) vì các file giờ chạy tuần tự.

- [ ] **Step 6: Commit**

```bash
git add src/test/nap-lai-mau.ts src/test/nap-lai-mau.test.ts src/test/csdl.ts vitest.config.mts
git commit -m "test: nap lai du lieu mau cho test ghi, chay file tuan tu

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `callProcedureOut`: tham số OUT trên cùng một connection

**Files:**
- Modify: `src/db/procedures.ts` (thay toàn bộ)
- Test: `src/db/procedures.test.ts`

**Interfaces:**
- Consumes: `pool` (`@/db`); `napLaiDuLieuMau` (Task 1).
- Produces:
  - `callProcedureOut<T>(name: string, params: unknown[], soThamSoOut: number): Promise<{ rows: T[]; out: (string | null)[] }>`. Các tham số OUT luôn đứng sau cùng; `out[i]` là giá trị của tham số OUT thứ `i + 1`.
  - `callProcedure<T>(name, params = []): Promise<T[]>` giữ nguyên chữ ký, nay bọc `callProcedureOut(name, params, 0)`.

Biến `@out1` sống theo connection (spec §3.2), nên `CALL` và `SELECT @out1` phải chạy trên cùng một connection lấy riêng từ pool. Connection đó phải được trả lại trong `finally`, kể cả khi thủ tục báo lỗi (Review Focus #5).

- [ ] **Step 1: Viết test hỏng `src/db/procedures.test.ts`**

```ts
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { callProcedure, callProcedureOut } from "@/db/procedures";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

beforeEach(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

describe("callProcedureOut", () => {
  it("tra tham so OUT cung result set dau tien", async () => {
    // DP00000006 da co hoa don nhap HD00000006: lap lai tra dung ma do.
    const r = await callProcedureOut<{ MaHoaDon: string }>("sp_LapHoaDon", ["DP00000006"], 1);
    expect(r.out).toEqual(["HD00000006"]);
    expect(r.rows[0].MaHoaDon).toBe("HD00000006");
  });

  it("thu tuc bi CSDL tu choi thi nem loi, va connection van tra ve pool", async () => {
    // Pool co 10 connection. Neu loi lam ro connection, lan goi thu 11 se treo.
    for (let i = 0; i < 12; i++) {
      await expect(callProcedureOut("sp_LapHoaDon", ["DP99999999"], 1)).rejects.toThrow(
        "Phieu dat phong khong ton tai",
      );
    }
    const r = await callProcedureOut("sp_LapHoaDon", ["DP00000006"], 1);
    expect(r.out).toEqual(["HD00000006"]);
  });
});

describe("callProcedure", () => {
  it("van tra result set dau tien nhu truoc", async () => {
    const rows = await callProcedure<{ MaPhong: string }>("sp_TraCuuPhongTrong", [
      "2026-10-01",
      "2026-10-03",
      "LP00000001",
    ]);
    expect(rows).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Chạy, xác nhận hỏng**

Run: `npx vitest run src/db/procedures.test.ts`
Expected: 2 FAIL `callProcedureOut is not a function`; ca `callProcedure` pass.

- [ ] **Step 3: Viết `src/db/procedures.ts`** (thay toàn bộ nội dung)

```ts
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
```

- [ ] **Step 4: Chạy lại**

Run: `npx vitest run src/db/procedures.test.ts` → Expected: 3 passed.
Run: `npm test` → Expected: `Test Files 18 passed`, `Tests 117 passed`.
Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi. Nếu `tsc` báo thiếu `PageProps` / `LayoutProps`, chạy `npx next typegen` rồi chạy lại.

- [ ] **Step 5: Commit**

```bash
git add src/db/procedures.ts src/db/procedures.test.ts
git commit -m "feat: callProcedureOut lay tham so OUT tren cung mot connection

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `thongBaoCsdl`: lỗi CSDL khác thành thông báo, không làm vỡ trang

**Files:**
- Modify: `src/db/loi.ts` (thay toàn bộ)
- Test: `src/db/loi.test.ts` (thay toàn bộ)

**Interfaces:**
- Consumes: không.
- Produces: `thongBaoCsdl(err: unknown): string`. Chữ ký giữ nguyên; hành vi mới:
  - `errno 1644` → `"CSDL từ chối: <message không có 'Loi: '>"`, không ghi log.
  - `Error` có `errno` kiểu số, hoặc có `fatal === true` → `"Lỗi CSDL (<errno | 'mất kết nối'>): <sqlMessage ?? message>"`, và ghi `console.error("Loi CSDL khong phai loi nghiep vu:", err)`.
  - Mọi thứ khác → ném tiếp.

Hai test cũ "lỗi không phải nghiệp vụ thì ném tiếp" và "lỗi 1292 thì ném tiếp" đổi theo spec §3.3; đây là thay đổi có chủ đích, không phải hồi quy. `traCuuPhongTrongAnToan` vẫn chặn ngày rỗng trước (Task 4), nên form đặt phòng vẫn báo "Ngày không hợp lệ" thay vì `Lỗi CSDL (1292)`.

- [ ] **Step 1: Viết test hỏng `src/db/loi.test.ts`** (thay toàn bộ nội dung)

```ts
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

import { pool } from "@/db";
import { thongBaoCsdl } from "@/db/loi";

describe("thongBaoCsdl", () => {
  let log: MockInstance<typeof console.error>;
  beforeEach(() => {
    log = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => log.mockRestore());

  it("loi SIGNAL 45000 giu nguyen van thong bao cua CSDL, khong ghi log", () => {
    expect(
      thongBaoCsdl({ errno: 1644, sqlMessage: "Tai khoan dang o trang thai TamNghi, khong the dang nhap" }),
    ).toBe("CSDL từ chối: Tai khoan dang o trang thai TamNghi, khong the dang nhap");
    expect(log).not.toHaveBeenCalled();
  });

  it("bo tien to 'Loi: ' ma mot so thu tuc tu them", () => {
    expect(thongBaoCsdl({ errno: 1644, sqlMessage: "Loi: Ma phong khong ton tai!" })).toBe(
      "CSDL từ chối: Ma phong khong ton tai!",
    );
  });

  it("loi CSDL khac (mat ket noi, sai kieu) thanh thong bao kem ma loi va ghi log tren server", () => {
    const matKetNoi = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:3306"), {
      code: "ECONNREFUSED",
      errno: -61,
    });
    expect(thongBaoCsdl(matKetNoi)).toBe("Lỗi CSDL (-61): connect ECONNREFUSED 127.0.0.1:3306");
    expect(log).toHaveBeenCalledWith("Loi CSDL khong phai loi nghiep vu:", matKetNoi);
  });

  // Review Focus: MySQL tat hoac connection bi ngat giua chung. mysql2 bao loi
  // "fatal" khong co errno; khong bat thi trang vo thay vi hien thong bao.
  it("connection bi ngat giua chung (fatal, khong errno) cung thanh thong bao", () => {
    const ngat = Object.assign(new Error("Can't add new command when connection is in closed state"), {
      fatal: true,
    });
    expect(thongBaoCsdl(ngat)).toBe(
      "Lỗi CSDL (mất kết nối): Can't add new command when connection is in closed state",
    );
  });

  it("loi khong den tu CSDL (loi lap trinh) van nem tiep", () => {
    const loiCode = new TypeError("Cannot read properties of undefined (reading 'maTk')");
    expect(() => thongBaoCsdl(loiCode)).toThrow(loiCode);
    expect(() => thongBaoCsdl("khong phai loi")).toThrow();
  });

  it("dung voi loi that cua mysql2: SIGNAL la 'CSDL tu choi', loi 1292 la 'Loi CSDL (1292)'", async () => {
    const loi = await pool
      .query("CALL sp_TraCuuPhongTrong('2026-10-03', '2026-10-01', NULL)")
      .catch((e: unknown) => e);
    expect(thongBaoCsdl(loi)).toBe("CSDL từ chối: Ngay tra phong phai sau ngay nhan phong");

    const loiNgay = await pool.query("CALL sp_TraCuuPhongTrong('', '', NULL)").catch((e: unknown) => e);
    expect(thongBaoCsdl(loiNgay)).toBe(
      "Lỗi CSDL (1292): Incorrect date value: '' for column 'p_NgayCheckIn' at row 1",
    );
  });
});
```

- [ ] **Step 2: Chạy, xác nhận hỏng**

Run: `npx vitest run src/db/loi.test.ts`
Expected: 3 FAIL:
- ca mất kết nối (hàm cũ ném lỗi `connect ECONNREFUSED`);
- ca `fatal` (hàm cũ ném `Can't add new command…`);
- ca lỗi thật `1292` (hàm cũ ném `Incorrect date value`).

3 ca còn lại pass.

- [ ] **Step 3: Viết `src/db/loi.ts`** (thay toàn bộ nội dung)

```ts
/**
 * Doi loi cua mysql2 thanh cau hien len giao dien, ngay duoi nut vua bam.
 *
 * SIGNAL SQLSTATE '45000' trong thu tuc / trigger (errno 1644) la loi nghiep
 * vu: giu nguyen van MESSAGE_TEXT de nguoi xem thay quy tac nam o tang CSDL,
 * chi bo tien to "Loi: " ma mot so thu tuc tu them.
 *
 * Loi CSDL khac (mat ket noi, sai kieu du lieu, sai cu phap...) cung thanh
 * mot cau kem ma loi, de mot nut bam loi khong lam vo ca trang; loi do con
 * duoc ghi console.error tren server vi la loi cua he thong, khong phai cua
 * nguoi dung. Loi khong den tu CSDL (loi lap trinh) thi nem tiep.
 */
export function thongBaoCsdl(err: unknown): string {
  if (laLoiNghiepVu(err)) {
    return `CSDL từ chối: ${err.sqlMessage.replace(/^Loi:\s*/, "")}`;
  }
  if (laLoiCsdl(err)) {
    console.error("Loi CSDL khong phai loi nghiep vu:", err);
    return `Lỗi CSDL (${err.errno ?? "mất kết nối"}): ${err.sqlMessage ?? err.message}`;
  }
  throw err;
}

/** errno 1644 = ER_SIGNAL_EXCEPTION, loi do SIGNAL SQLSTATE '45000' sinh ra. */
function laLoiNghiepVu(err: unknown): err is { errno: 1644; sqlMessage: string } {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { errno?: unknown; sqlMessage?: unknown };
  return e.errno === 1644 && typeof e.sqlMessage === "string";
}

/**
 * Loi cua mysql2: errno cua MySQL, errno am cua socket (ECONNREFUSED khi MySQL
 * tat), hoac loi `fatal` khong errno khi connection bi ngat giua chung.
 */
function laLoiCsdl(err: unknown): err is Error & { errno?: number; sqlMessage?: string } {
  if (!(err instanceof Error)) return false;
  const e = err as { errno?: unknown; fatal?: unknown };
  return typeof e.errno === "number" || e.fatal === true;
}
```

- [ ] **Step 4: Chạy lại**

Run: `npx vitest run src/db/loi.test.ts` → Expected: 6 passed.
Run: `npm test` → Expected: `Test Files 18 passed`, `Tests 119 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/db/loi.ts src/db/loi.test.ts
git commit -m "feat: thongBaoCsdl doi loi CSDL khac thanh thong bao, ghi log tren server

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Kiểm hình thức đầu vào, `KetQua`, đọc số tiền kiểu Việt Nam

**Files:**
- Create: `src/lib/thao-tac/kiem-tra.ts`, `src/lib/thao-tac/ket-qua.ts`
- Modify: `src/lib/tinh-toan.ts` (thêm `docSoTien`), `src/lib/queries/bookings.ts` (dùng `laNgay`)
- Test: `src/lib/thao-tac/kiem-tra.test.ts`, `src/lib/thao-tac/ket-qua.test.ts`, `src/lib/tinh-toan.test.ts`

**Interfaces:**
- Consumes: `thongBaoCsdl` (Task 3).
- Produces:
  - `laMa(x: unknown, tienTo: string): x is string`: dài đúng 10 ký tự, bắt đầu bằng `tienTo`, chỉ gồm chữ hoa rồi đến chữ số.
  - `laSoNguyenDuong(x: unknown): x is number`: số nguyên từ 1 đến 2 147 483 647.
  - `laTien(x: unknown): x is string`: chuỗi `^\d{1,16}(\.\d{1,2})?$`.
  - `laNgay(x: unknown): x is string`: ngày `YYYY-MM-DD` có thật trên lịch.
  - `laChuoi(x: unknown, toiDa: number): x is string`: chuỗi dài tối đa `toiDa` ký tự, chuỗi rỗng vẫn hợp lệ.
  - `khongHopLe(truong: string): { ok: false; loi: string }`, với `loi` là `"<truong> không hợp lệ"`.
  - `type KetQua<T> = { ok: true; data: T } | { ok: false; loi: string }`, và `thucHien<T>(viec: () => Promise<T>): Promise<KetQua<T>>`: lỗi CSDL thành `ok: false` qua `thongBaoCsdl`, lỗi khác ném tiếp.
  - `docSoTien(nhap: string): string` (`@/lib/tinh-toan`, dùng được ở client): bỏ `.`, `,` và khoảng trắng.
  - `bookings.ts` bỏ hàm riêng `laNgayHopLe`, dùng `laNgay`; hành vi không đổi.

- [ ] **Step 1: Viết test hỏng**

`src/lib/thao-tac/kiem-tra.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { laChuoi, laMa, laNgay, laSoNguyenDuong, laTien } from "@/lib/thao-tac/kiem-tra";

/**
 * Server Action la diem vao ai cung POST toi duoc, nen moi tham so phai kiem
 * KIEU truoc khi dua xuong CSDL: mot object gui len thay cho chuoi se bi mysql2
 * dich thanh `cot = gia tri` trong cau lenh (stringifyObjects mac dinh false).
 */
describe("laMa", () => {
  it("nhan ma CHAR(10) dung tien to", () => {
    expect(laMa("DP00000011", "DP")).toBe(true);
    expect(laMa("PH00000042", "PH")).toBe(true);
  });

  it("tu choi sai tien to, sai do dai, chu thuong va kieu khac chuoi", () => {
    expect(laMa("KH00000011", "DP")).toBe(false);
    expect(laMa("DP0000011", "DP")).toBe(false);
    expect(laMa("dp00000011", "DP")).toBe(false);
    expect(laMa("DP0000001'", "DP")).toBe(false);
    expect(laMa({ MaDatPhong: "DP00000011" }, "DP")).toBe(false);
    expect(laMa(["DP00000011"], "DP")).toBe(false);
    expect(laMa(undefined, "DP")).toBe(false);
  });
});

describe("laSoNguyenDuong", () => {
  it("chi nhan so nguyen tu 1 den gioi han INT", () => {
    expect(laSoNguyenDuong(1)).toBe(true);
    expect(laSoNguyenDuong(2_147_483_647)).toBe(true);
    for (const x of [0, -1, 1.5, 2_147_483_648, Number.NaN, "2", null]) {
      expect(laSoNguyenDuong(x)).toBe(false);
    }
  });
});

describe("laTien", () => {
  it("nhan chuoi so khong am, toi da 2 chu so thap phan, vua DECIMAL(18,2)", () => {
    for (const x of ["0", "600000", "600000.5", "600000.50", "9999999999999999.99"]) {
      expect(laTien(x)).toBe(true);
    }
  });

  it("tu choi so am, chuoi rong, dau phay, qua 16 chu so phan nguyen va kieu so", () => {
    for (const x of ["-1", "", "600.000", "1,5", "1.234", "10000000000000000", 600000]) {
      expect(laTien(x)).toBe(false);
    }
  });
});

describe("laNgay", () => {
  it("nhan ngay YYYY-MM-DD co that tren lich", () => {
    expect(laNgay("2026-09-23")).toBe(true);
    expect(laNgay("2028-02-29")).toBe(true);
  });

  it("tu choi chuoi rong, ngay khong co that va kieu khac chuoi", () => {
    for (const x of ["", "2026-02-30", "2026-9-23", "23/09/2026", 20260923, null]) {
      expect(laNgay(x)).toBe(false);
    }
  });
});

describe("laChuoi", () => {
  it("nhan chuoi toi da n ky tu, ke ca chuoi rong", () => {
    expect(laChuoi("", 200)).toBe(true);
    expect(laChuoi("Đã dọn xong, thay khăn", 200)).toBe(true);
    expect(laChuoi("x".repeat(200), 200)).toBe(true);
  });

  it("tu choi chuoi qua dai va kieu khac chuoi", () => {
    expect(laChuoi("x".repeat(201), 200)).toBe(false);
    expect(laChuoi(null, 200)).toBe(false);
    expect(laChuoi({ toString: () => "x" }, 200)).toBe(false);
  });
});
```

`src/lib/thao-tac/ket-qua.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

import { thucHien } from "@/lib/thao-tac/ket-qua";

describe("thucHien", () => {
  let log: MockInstance<typeof console.error>;
  beforeEach(() => {
    log = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => log.mockRestore());

  it("thanh cong thi ok kem du lieu", async () => {
    await expect(thucHien(async () => 42)).resolves.toEqual({ ok: true, data: 42 });
  });

  it("CSDL tu choi (SIGNAL) thi ok:false kem thong bao cua CSDL", async () => {
    const signal = Object.assign(new Error("Loi: Phong khong ton tai"), {
      errno: 1644,
      sqlMessage: "Loi: Phong khong ton tai",
    });
    await expect(
      thucHien(async () => {
        throw signal;
      }),
    ).resolves.toEqual({ ok: false, loi: "CSDL từ chối: Phong khong ton tai" });
  });

  it("loi lap trinh khong bi nuot, van nem ra", async () => {
    await expect(
      thucHien(async () => {
        throw new TypeError("sai");
      }),
    ).rejects.toThrow(TypeError);
  });
});
```

`src/lib/tinh-toan.test.ts` — tìm:

```ts
import { congTien, soDem, tamTinhDatPhong, themNgay, tienDichVu, tienPhong } from "@/lib/tinh-toan";
```

thay bằng:

```ts
import {
  congTien,
  docSoTien,
  soDem,
  tamTinhDatPhong,
  themNgay,
  tienDichVu,
  tienPhong,
} from "@/lib/tinh-toan";
```

`src/lib/tinh-toan.test.ts` — thêm vào cuối file:

```ts

// Review Focus: nguoi Viet go "300.000" nghia la ba tram nghin, khong phai 300.
describe("docSoTien", () => {
  it("bo dau cham, dau phay, khoang trang ngan cach hang nghin", () => {
    expect(docSoTien("300.000")).toBe("300000");
    expect(docSoTien("1,500,000")).toBe("1500000");
    expect(docSoTien(" 250 000 ")).toBe("250000");
  });

  it("giu nguyen ky tu la de Server Action bao khong hop le", () => {
    expect(docSoTien("-50.000")).toBe("-50000");
    expect(docSoTien("3tr")).toBe("3tr");
    expect(docSoTien("")).toBe("");
  });
});
```

- [ ] **Step 2: Chạy, xác nhận hỏng**

Run: `npx vitest run src/lib/thao-tac src/lib/tinh-toan.test.ts`
Expected: 2 file FAIL vì `Cannot find package '@/lib/thao-tac/kiem-tra'` và `'@/lib/thao-tac/ket-qua'`. Trong `tinh-toan.test.ts`, 2 ca `docSoTien` FAIL (`docSoTien is not a function`), 16 ca cũ pass.

- [ ] **Step 3: Viết hai module mới và `docSoTien`**

`src/lib/thao-tac/kiem-tra.ts`:

```ts
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
```

`src/lib/thao-tac/ket-qua.ts`:

```ts
import { thongBaoCsdl } from "@/db/loi";

/**
 * Ket qua cua mot thao tac ghi. Loi cua CSDL la mot ket qua binh thuong (nguoi
 * dung bam sai thu tu), khong phai ngoai le, nen tra ve cho client hien duoi
 * nut bam thay vi lam vo trang.
 */
export type KetQua<T> = { ok: true; data: T } | { ok: false; loi: string };

/** Chay `viec`; loi CSDL thanh { ok: false, loi } qua thongBaoCsdl, loi khac nem tiep. */
export async function thucHien<T>(viec: () => Promise<T>): Promise<KetQua<T>> {
  try {
    return { ok: true, data: await viec() };
  } catch (err) {
    return { ok: false, loi: thongBaoCsdl(err) };
  }
}
```

`src/lib/tinh-toan.ts` — tìm:

```ts
export function themNgay(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
```

thay bằng:

```ts
export function themNgay(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Doc so tien nguoi dung go o o nhap (VND, khong co phan le): bo dau cham, dau
 * phay va khoang trang ngan cach hang nghin, "300.000" -> "300000". Ky tu khac
 * (chu, dau tru) giu nguyen de Server Action bao "khong hop le".
 */
export function docSoTien(nhap: string): string {
  return nhap.replace(/[.,\s]/g, "");
}
```

- [ ] **Step 4: `bookings.ts` dùng `laNgay` thay hàm riêng**

`src/lib/queries/bookings.ts` — tìm:

```ts
import { congTien } from "@/lib/tinh-toan";
```

thay bằng:

```ts
import { laNgay } from "@/lib/thao-tac/kiem-tra";
import { congTien } from "@/lib/tinh-toan";
```

`src/lib/queries/bookings.ts` — tìm:

```ts
const NGAY_ISO = /^\d{4}-\d{2}-\d{2}$/;
const SO_DEM_TOI_DA = 1000;

/** Ngay 'YYYY-MM-DD' co that tren lich; chan chuoi rong va ngay nhu 2026-02-30. */
function laNgayHopLe(s: string): boolean {
  if (!NGAY_ISO.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
```

thay bằng:

```ts
const SO_DEM_TOI_DA = 1000;
```

`src/lib/queries/bookings.ts` — tìm:

```ts
  // O ngay cua trinh duyet cho xoa trong. Ngay rong / sai den MySQL la loi
  // 1292 chu khong phai SIGNAL, thongBaoCsdl se nem tiep, nen phai chan truoc.
  if (!laNgayHopLe(checkIn) || !laNgayHopLe(checkOut)) {
```

thay bằng:

```ts
  // O ngay cua trinh duyet cho xoa trong. Ngay rong / sai den MySQL la loi
  // 1292 chu khong phai SIGNAL; chan truoc de bao mot cau de hieu.
  if (!laNgay(checkIn) || !laNgay(checkOut)) {
```

- [ ] **Step 5: Chạy lại**

Run: `npx vitest run src/lib/thao-tac src/lib/tinh-toan.test.ts src/lib/queries/bookings.test.ts`
Expected: `kiem-tra` 9, `ket-qua` 3, `tinh-toan` 18, `bookings` 16 — tất cả pass.
Run: `npm test` → Expected: `Test Files 20 passed`, `Tests 133 passed`.
Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.

- [ ] **Step 6: Commit**

```bash
git add src/lib/thao-tac/kiem-tra.ts src/lib/thao-tac/kiem-tra.test.ts src/lib/thao-tac/ket-qua.ts src/lib/thao-tac/ket-qua.test.ts src/lib/tinh-toan.ts src/lib/tinh-toan.test.ts src/lib/queries/bookings.ts
git commit -m "feat: kiem hinh thuc tham so Server Action, KetQua, doc so tien kieu Viet Nam

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Sửa 4 thủ tục lệch vòng đời trong `06`

**Files:**
- Modify (ngoài git): `$QLKS_SCRIPTS_DIR/06_Procedures.sql`, gồm `sp_NhanPhong`, `sp_GhiNhanDichVu`, `sp_GhiNhanDonPhong`, `sp_HuyPhieuDat`
- Test: `src/db/thu-tuc.test.ts`

**Interfaces:**
- Consumes: `callProcedure`, `callProcedureOut` (Task 2); `dong`, `trangThai`, `napLaiDuLieuMau` (Task 1).
- Produces (hành vi mới của thủ tục, spec §4; các task sau dựa vào):
  - `sp_NhanPhong` nhận phòng `Trong` **hoặc `DaDat`**. Thông báo từ chối là `'Loi: Co phong chua san sang (phong phai Trong hoac DaDat)!'`.
  - `sp_GhiNhanDonPhong` chỉ đưa phòng `DangDon` / `BaoTri` về `Trong`. Phòng ở trạng thái khác giữ nguyên, nhật ký vẫn được ghi.
  - `sp_GhiNhanDichVu`: nếu phiếu đã có hóa đơn `ChuaThanhToan`, thủ tục tính lại hóa đơn ngay trong cùng giao dịch, nên `sp_ThanhToanHoaDon` qua được ngay sau đó. Result set **không đổi**, vẫn chỉ trả dòng dịch vụ vừa ghi.
  - `sp_HuyPhieuDat` chuyển hóa đơn `ChuaThanhToan` của phiếu sang `DaHuy`.

Dữ liệu mẫu ở mốc 23/09/2026 10:00 mà các test dựa vào:
- Phòng: 101 = `PH00000001` (`Trong`), 202 = `PH00000004` (`BaoTri`), 301 = `PH00000005` (`DangDon`), 302 = `PH00000006` (`DangSuDung`, thuộc DP00000006), 103 = `PH00000011` (`DaDat`, thuộc DP00000011 nhận hôm nay), 207 = `PH00000023` (`DangSuDung`, DP00000023 trả hôm nay).
- `DON_PHONG` có 16 dòng.
- Hóa đơn: HD00000023 `ChuaThanhToan` 3.100.000; HD00000007 là hóa đơn nháp của DP00000007 (phòng 401, nhận 12/10).
- Mã kế tiếp: DP00000099, HD00000099, SD00000099, DON0000017, SUA0000013.

- [ ] **Step 1: Viết test hỏng `src/db/thu-tuc.test.ts`**

```ts
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { callProcedure, callProcedureOut } from "@/db/procedures";
import { dong, trangThai } from "@/test/csdl";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

/**
 * Hoi quy cho 4 thu tuc sua o phase 2 (spec phase 2 muc 4). Moi ca da thay DO
 * tren 06_Procedures.sql cu truoc khi sua. Goi thang thu tuc, khong qua
 * src/lib/thao-tac, de loi nam o dau thi do ngay o day.
 */
beforeEach(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

const LE_TAN = "TK00000002";
const BUONG = "TK00000004";
const phong = (ma: string) => dong("SELECT TrangThai FROM PHONG WHERE MaPhong = ?", [ma]);

describe("sp_NhanPhong", () => {
  it("nhan duoc phieu vua dat bang sp_DatPhong (phong DaDat)", async () => {
    const { out } = await callProcedureOut(
      "sp_DatPhong",
      ["KH00000001", LE_TAN, "2026-09-23", "2026-09-24", "PH00000001", 0],
      1,
    );
    await callProcedure("sp_NhanPhong", [out[0], LE_TAN]);
    expect(await trangThai(out[0]!)).toEqual({ phieu: "DangO", phong: "DangSuDung", hoaDon: null });
  });

  it("van tu choi khi phong con khach cu chua tra (DangSuDung)", async () => {
    // Phong 207 (PH00000023): khach DP00000023 tra hom nay nen dat duoc cho
    // dem nay, nhung chua tra phong thi chua nhan duoc.
    const { out } = await callProcedureOut(
      "sp_DatPhong",
      ["KH00000001", LE_TAN, "2026-09-23", "2026-09-24", "PH00000023", 0],
      1,
    );
    await expect(callProcedure("sp_NhanPhong", [out[0], LE_TAN])).rejects.toThrow(
      "Co phong chua san sang (phong phai Trong hoac DaDat)",
    );
    expect(await trangThai(out[0]!)).toMatchObject({ phieu: "DaDat" });
  });
});

describe("sp_GhiNhanDonPhong", () => {
  it("phong co khach (DangSuDung) va phong dang giu (DaDat) giu nguyen trang thai, van ghi nhat ky", async () => {
    await callProcedure("sp_GhiNhanDonPhong", ["PH00000006", BUONG, "Don giua ky"]);
    await callProcedure("sp_GhiNhanDonPhong", ["PH00000011", BUONG, null]);
    expect(await phong("PH00000006")).toEqual({ TrangThai: "DangSuDung" });
    expect(await phong("PH00000011")).toEqual({ TrangThai: "DaDat" });
    expect(await dong("SELECT COUNT(*) AS n FROM DON_PHONG")).toEqual({ n: 18 });
  });

  it("phong DangDon va BaoTri van ve Trong", async () => {
    await callProcedure("sp_GhiNhanDonPhong", ["PH00000005", BUONG, null]);
    await callProcedure("sp_GhiNhanDonPhong", ["PH00000004", BUONG, null]);
    expect(await phong("PH00000005")).toEqual({ TrangThai: "Trong" });
    expect(await phong("PH00000004")).toEqual({ TrangThai: "Trong" });
  });
});

describe("sp_GhiNhanDichVu", () => {
  it("phieu da co hoa don nhap: tinh lai hoa don, thanh toan duoc ngay", async () => {
    // HD00000023: 3.100.000 truoc khi ghi them 1 luot giat ui 80.000.
    await callProcedureOut("sp_GhiNhanDichVu", ["DP00000023", "DV00000001", 1, null], 1);
    expect(await dong("SELECT TongTien FROM HOA_DON WHERE MaHoaDon = 'HD00000023'")).toEqual({
      TongTien: "3180000.00",
    });
    await expect(callProcedure("sp_ThanhToanHoaDon", ["HD00000023", "TienMat"])).resolves.toBeDefined();
  });
});

describe("sp_HuyPhieuDat", () => {
  it("huy phieu thi hoa don nhap cua phieu cung DaHuy", async () => {
    await callProcedure("sp_HuyPhieuDat", ["DP00000007"]);
    expect(await trangThai("DP00000007")).toEqual({ phieu: "DaHuy", phong: "Trong", hoaDon: "DaHuy" });
  });
});
```

- [ ] **Step 2: Chạy trên thủ tục cũ, xác nhận hỏng đúng lý do**

Run: `npx vitest run src/db/thu-tuc.test.ts`

Expected: 5 FAIL, 1 pass:
- `nhan duoc phieu vua dat` → `Error: Loi: Co phong chua san sang (phong khong o trang thai Trong)!`
- `van tu choi khi phong con khach cu` → thông báo cũ `…phong khong o trang thai Trong`, chưa phải `…phong phai Trong hoac DaDat`
- `giu nguyen trang thai` → `expected { TrangThai: 'Trong' } to deeply equal { TrangThai: 'DangSuDung' }`
- `tinh lai hoa don` → `expected { TongTien: '3100000.00' } … '3180000.00'`
- `huy phieu` → `hoaDon: 'ChuaThanhToan'` thay vì `'DaHuy'`

Ca `phong DangDon va BaoTri van ve Trong` pass từ đầu. Nó chặn trường hợp sửa quá tay.

- [ ] **Step 3: Sao lưu `06`, đọc lại chỗ neo ngay trước khi sửa**

Đặt `BK` là thư mục tạm của phiên (scratchpad; không có thì `mktemp -d`) và giữ nguyên cho các bước sau.

```bash
cd /Users/anhpham/PA/UIT/Demo
set -a; source .env.local; set +a
BK="<thu muc tam cua phien>/phase2-06"; mkdir -p "$BK"
cp "$QLKS_SCRIPTS_DIR/06_Procedures.sql" "$BK/06_truoc_phase2.sql"
ls -la "$QLKS_SCRIPTS_DIR"
F="$QLKS_SCRIPTS_DIR/06_Procedures.sql"
grep -c "AND p.TrangThai <> 'Trong';" "$F"
grep -c "(p_MaSuDungDV, p_MaDatPhong, p_MaDV, p_NgaySuDung, p_SoLuong, v_GiaDV);" "$F"
grep -c "SELECT CONCAT('Da ghi nhan don phong thanh cong. Ma don: ', v_MaDon) AS KetQua;" "$F"
grep -c "AND  pd2.TrangThai  IN ('DaDat', 'DangO'));" "$F"
grep -c "Hoa don nhap da co thi goi lai sp_LapHoaDon de cap nhat" "$F"
```

Expected: 4 số `1` đầu. Số cuối là `1` nếu chú thích đầu `sp_GhiNhanDichVu` còn, `0` nếu nhóm đã rút gọn (script bỏ qua đoạn đó). Có số `0` ở 4 dòng đầu, hoặc số nào lớn hơn 1, thì **dừng lại, báo người dùng**: nhóm đã sửa thủ tục.

- [ ] **Step 4: Lưu script sửa vào `$BK/sua_06_phase2.py`**

```python
"""Sua 4 thu tuc cua 06_Procedures.sql theo spec phase 2 muc 4.

Chi thay dung cac doan code da neo (moi doan phai xuat hien DUNG 1 lan); dong
chu thich dau thu tuc thi thay neu con (nhom co the da rut gon). ASCII, LF.
"""
import sys

f = sys.argv[1]
s = open(f, encoding="ascii", newline="").read()
assert "\r" not in s, "06 phai la LF"
dem = 0


def thay(cu, moi, bat_buoc=True):
    global s, dem
    n = s.count(cu)
    if n == 0 and not bat_buoc:
        return
    if n != 1:
        sys.exit(f"LOI: doan neo xuat hien {n} lan (can 1):\n{cu}")
    s = s.replace(cu, moi)
    dem += 1


# 1. sp_NhanPhong: nhan ca phong DaDat (sp_DatPhong buoc 3f de lai).
thay("""    SELECT COUNT(*) INTO v_CountPhongKhongHopLe
    FROM CHI_TIET_DAT_PHONG ctdp
    JOIN PHONG p ON ctdp.MaPhong = p.MaPhong
    WHERE ctdp.MaDatPhong = p_MaDatPhong
      AND p.TrangThai <> 'Trong';

    IF v_CountPhongKhongHopLe > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Loi: Co phong chua san sang (phong khong o trang thai Trong)!';
    END IF;
""", """    -- Phong phai Trong, hoac DaDat vi sp_DatPhong (buoc 3f) giu phong cho phieu
    -- bang cach chuyen sang DaDat. trg_CTDP_ChongTrungPhong bao dam khong co
    -- phieu hieu luc nao khac giu phong trong khoang ngay cua phieu nay.
    SELECT COUNT(*) INTO v_CountPhongKhongHopLe
    FROM CHI_TIET_DAT_PHONG ctdp
    JOIN PHONG p ON ctdp.MaPhong = p.MaPhong
    WHERE ctdp.MaDatPhong = p_MaDatPhong
      AND p.TrangThai NOT IN ('Trong', 'DaDat');

    IF v_CountPhongKhongHopLe > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Loi: Co phong chua san sang (phong phai Trong hoac DaDat)!';
    END IF;
""")

# 2. sp_GhiNhanDichVu: hoa don nhap da co thi tinh lai ngay trong giao dich.
thay("""-- Hoa don nhap da co thi goi lai sp_LapHoaDon de cap nhat.
CREATE PROCEDURE sp_GhiNhanDichVu (""", """-- Hoa don nhap da co thi tinh lai ngay trong giao dich nay (nhu sp_LapHoaDon
-- khi lap lai), de sp_ThanhToanHoaDon khong tu choi vi lech fn_TienDichVu.
CREATE PROCEDURE sp_GhiNhanDichVu (""", bat_buoc=False)
thay("""    DECLARE v_TrangThaiHD VARCHAR(20);
    DECLARE v_GiaDV       DECIMAL(18,2);
""", """    DECLARE v_TrangThaiHD VARCHAR(20);
    DECLARE v_MaHoaDon    CHAR(10);
    DECLARE v_GiaDV       DECIMAL(18,2);
""")
thay("""    SELECT TrangThai INTO v_TrangThaiHD
    FROM   HOA_DON
    WHERE  MaDatPhong = p_MaDatPhong;

    IF v_TrangThaiHD IS NOT NULL AND v_TrangThaiHD <> 'ChuaThanhToan' THEN""", """    SELECT MaHoaDon, TrangThai INTO v_MaHoaDon, v_TrangThaiHD
    FROM   HOA_DON
    WHERE  MaDatPhong = p_MaDatPhong;

    IF v_TrangThaiHD IS NOT NULL AND v_TrangThaiHD <> 'ChuaThanhToan' THEN""")
thay("""        (p_MaSuDungDV, p_MaDatPhong, p_MaDV, p_NgaySuDung, p_SoLuong, v_GiaDV);

    COMMIT;
""", """        (p_MaSuDungDV, p_MaDatPhong, p_MaDV, p_NgaySuDung, p_SoLuong, v_GiaDV);

    -- Hoa don nhap da lap: xoa cac dong tu sinh roi sinh lai (PhuThu / GiamGia
    -- nhap tay giu nguyen), cung cach sp_LapHoaDon lap lai. Khong CALL
    -- sp_LapHoaDon vi thu tuc do tu mo giao dich va tra them hai result set.
    IF v_TrangThaiHD = 'ChuaThanhToan' THEN
        DELETE FROM CHI_TIET_HOA_DON
        WHERE  MaHoaDon = v_MaHoaDon
          AND  LoaiKhoanMuc IN ('TienPhong', 'DichVu', 'GiamTru');

        CALL sp_LapChiTietHoaDon(v_MaHoaDon);
    END IF;

    COMMIT;
""")

# 3. sp_GhiNhanDonPhong: chi DangDon / BaoTri moi ve Trong.
thay("""    UPDATE PHONG
    SET TrangThai = 'Trong'
    WHERE MaPhong = p_MaPhong;

    SELECT CONCAT('Da ghi nhan don phong thanh cong. Ma don: ', v_MaDon) AS KetQua;""", """    -- Chi phong cho don (DangDon) hoac vua sua xong (BaoTri) moi ve Trong.
    -- Phong co khach (DangSuDung) hay dang giu cho khach (DaDat) giu nguyen
    -- trang thai, van ghi nhat ky don.
    UPDATE PHONG
    SET TrangThai = 'Trong'
    WHERE MaPhong = p_MaPhong
      AND TrangThai IN ('DangDon', 'BaoTri');

    SELECT CONCAT('Da ghi nhan don phong thanh cong. Ma don: ', v_MaDon) AS KetQua;""")

# 4. sp_HuyPhieuDat: hoa don nhap cua phieu huy theo.
thay("""                         AND  pd2.TrangThai  IN ('DaDat', 'DangO'));

    COMMIT;

    SELECT pd.MaDatPhong, pd.TrangThai, pd.TienCoc,""", """                         AND  pd2.TrangThai  IN ('DaDat', 'DangO'));

    -- Hoa don nhap cua phieu (lap tu luc DaDat) huy theo, de khong con bi dem
    -- la hoa don chua thanh toan.
    UPDATE HOA_DON
    SET    TrangThai = 'DaHuy'
    WHERE  MaDatPhong = p_MaDatPhong
      AND  TrangThai  = 'ChuaThanhToan';

    COMMIT;

    SELECT pd.MaDatPhong, pd.TrangThai, pd.TienCoc,""")

s.encode("ascii")
open(f, "w", encoding="ascii", newline="\n").write(s)
print(f"Da sua 4 thu tuc ({dem} doan) trong {f}")
```

- [ ] **Step 5: Sửa `06`, đối chiếu với bản sao lưu**

```bash
python3 "$BK/sua_06_phase2.py" "$QLKS_SCRIPTS_DIR/06_Procedures.sql"
diff "$BK/06_truoc_phase2.sql" "$QLKS_SCRIPTS_DIR/06_Procedures.sql" > "$BK/06.diff"; grep -c '^[<>]' "$BK/06.diff"
file "$QLKS_SCRIPTS_DIR/06_Procedures.sql"; grep -c $'\r' "$QLKS_SCRIPTS_DIR/06_Procedures.sql"
```

Expected: `Da sua 4 thu tuc (7 doan) trong …`, số dòng đổi `37`, `ASCII text`, `0`. Nếu chú thích đầu `sp_GhiNhanDichVu` đã bị nhóm bỏ thì là `6 doan` và `35`. Mở `$BK/06.diff` đọc: chỉ có 4 thủ tục trên bị đổi.

- [ ] **Step 6: Chạy lại** (globalSetup dựng lại CSDL kiểm thử từ `06` mới)

Run: `npx vitest run src/db/thu-tuc.test.ts` → Expected: 6 passed.
Run: `npm test` → Expected: `Test Files 21 passed`, `Tests 139 passed`.

- [ ] **Step 7: Commit**

```bash
git add src/db/thu-tuc.test.ts
git commit -m "test: hoi quy 4 thu tuc sua o phase 2

06_Procedures.sql (Scripts/, ngoai git) sua cung luc: sp_NhanPhong nhan phong
DaDat, sp_GhiNhanDonPhong chi dua DangDon / BaoTri ve Trong, sp_GhiNhanDichVu
tinh lai hoa don nhap, sp_HuyPhieuDat huy hoa don nhap.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Thao tác đặt phòng (`sp_TraCuuPhongTrong` + `sp_DatPhong`)

**Files:**
- Create: `src/lib/thao-tac/dat-phong.ts`
- Test: `src/lib/thao-tac/dat-phong.test.ts`

**Interfaces:**
- Consumes: `callProcedure`, `callProcedureOut` (Task 2); `thongBaoCsdl` (Task 3); `KetQua` (Task 4); `getLoaiPhongConTrong(checkIn, checkOut)` của phase 1. Trong đó `donGiaNgay` của mỗi loại **đã là giá `sp_DatPhong` sẽ chốt**: trung bình `BANG_GIA_PHONG` từng đêm.
- Produces:
  - `type DatPhongVao = { maKh; maTk; ngayNhan; ngayTra; maLoaiPhong }`, tất cả kiểu `string`.
  - `datPhong(v: DatPhongVao): Promise<KetQua<{ maDatPhong: string; soPhong: string; tienCoc: string }>>`.
  - Hết phòng trống của loại đó thì trả `{ ok: false, loi: "Loại phòng này đã hết phòng trống trong khoảng ngày đã chọn" }` và không gọi `sp_DatPhong`.

Phòng được đặt là **dòng đầu tiên** mà `sp_TraCuuPhongTrong(in, out, maLoai)` trả về. Thủ tục sắp theo `DonGiaNgay, SoPhong`, nên với một loại, đó là phòng có số nhỏ nhất (spec §2).

Tiền cọc là một đêm theo `donGiaNgay` ở trên, đúng con số form đang hiển thị (spec §2, đã bổ sung). Tiền cọc tính lại trên server, không nhận từ client.

- [ ] **Step 1: Viết test hỏng `src/lib/thao-tac/dat-phong.test.ts`**

```ts
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { datPhong, type DatPhongVao } from "@/lib/thao-tac/dat-phong";
import { dong } from "@/test/csdl";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

beforeEach(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

// Hom nay (CSDL kiem thu) la 23/09/2026.
const PHIEU: DatPhongVao = {
  maKh: "KH00000001",
  maTk: "TK00000002",
  ngayNhan: "2026-09-23",
  ngayTra: "2026-09-25",
  maLoaiPhong: "LP00000002",
};

describe("datPhong", () => {
  it("lap phieu DaDat cho phong trong dau tien, coc mot dem theo gia sp_DatPhong chot", async () => {
    const r = await datPhong(PHIEU);
    expect(r).toEqual({
      ok: true,
      data: { maDatPhong: "DP00000099", soPhong: "102", tienCoc: "880000.00" },
    });

    expect(
      await dong(
        `SELECT pd.TrangThai, pd.TienCoc, pd.MaKH, pd.MaTK, ct.MaPhong, ct.GiaThueThoiDiem, ct.SoDem,
                p.TrangThai AS phong
         FROM PHIEU_DAT_PHONG pd
         JOIN CHI_TIET_DAT_PHONG ct ON ct.MaDatPhong = pd.MaDatPhong
         JOIN PHONG p ON p.MaPhong = ct.MaPhong
         WHERE pd.MaDatPhong = 'DP00000099'`,
      ),
    ).toEqual({
      TrangThai: "DaDat",
      TienCoc: "880000.00",
      MaKH: "KH00000001",
      MaTK: "TK00000002",
      MaPhong: "PH00000002",
      GiaThueThoiDiem: "880000.00",
      SoDem: 2,
      phong: "DaDat",
    });
  });

  it("loai phong da het phong trong thi bao loi, khong ghi phieu nao", async () => {
    // LP00000004 hom nay chi con phong 208. Dat mot lan la het.
    const loai = { ...PHIEU, maLoaiPhong: "LP00000004" };
    expect((await datPhong(loai)).ok).toBe(true);

    expect(await datPhong({ ...loai, maKh: "KH00000002" })).toEqual({
      ok: false,
      loi: "Loại phòng này đã hết phòng trống trong khoảng ngày đã chọn",
    });
    expect(await dong("SELECT COUNT(*) AS n FROM PHIEU_DAT_PHONG")).toEqual({ n: 89 });
  });

  it("ngay nhan da qua thi CSDL tu choi", async () => {
    expect(await datPhong({ ...PHIEU, ngayNhan: "2026-09-22" })).toEqual({
      ok: false,
      loi: "CSDL từ chối: Khong the dat phong cho ngay da qua",
    });
  });

  it("khach hang khong ton tai thi CSDL tu choi", async () => {
    expect(await datPhong({ ...PHIEU, maKh: "KH99999999" })).toEqual({
      ok: false,
      loi: "CSDL từ chối: Khach hang khong ton tai",
    });
  });
});
```

- [ ] **Step 2: Chạy, xác nhận hỏng**

Run: `npx vitest run src/lib/thao-tac/dat-phong.test.ts`
Expected: FAIL `Cannot find package '@/lib/thao-tac/dat-phong'`.

- [ ] **Step 3: Viết `src/lib/thao-tac/dat-phong.ts`**

```ts
import "server-only";

import { thongBaoCsdl } from "@/db/loi";
import { callProcedure, callProcedureOut } from "@/db/procedures";
import { getLoaiPhongConTrong } from "@/lib/queries/bookings";

import type { KetQua } from "./ket-qua";

export type DatPhongVao = {
  maKh: string;
  maTk: string;
  ngayNhan: string;
  ngayTra: string;
  maLoaiPhong: string;
};

/**
 * Lap phieu dat mot phong thuoc loai da chon (sp_DatPhong).
 *
 * Phong: phong dau tien sp_TraCuuPhongTrong tra cho loai va khoang ngay do.
 * Tien coc: mot dem theo dung don gia form dang hien (getLoaiPhongConTrong),
 * tinh lai tren server, khong tin so client gui len. Moi quy tac con lai
 * (ngay da qua, khach khong ton tai, phong vua bi dat mat...) do sp_DatPhong
 * quyet dinh.
 */
export async function datPhong(
  v: DatPhongVao,
): Promise<KetQua<{ maDatPhong: string; soPhong: string; tienCoc: string }>> {
  try {
    const [phong, loai] = await Promise.all([
      callProcedure<{ MaPhong: string; SoPhong: string }>("sp_TraCuuPhongTrong", [
        v.ngayNhan,
        v.ngayTra,
        v.maLoaiPhong,
      ]),
      getLoaiPhongConTrong(v.ngayNhan, v.ngayTra),
    ]);
    const p = phong[0];
    if (!p) {
      return { ok: false, loi: "Loại phòng này đã hết phòng trống trong khoảng ngày đã chọn" };
    }
    const tienCoc = loai.find((l) => l.maLoaiPhong === v.maLoaiPhong)!.donGiaNgay;

    const { out } = await callProcedureOut(
      "sp_DatPhong",
      [v.maKh, v.maTk, v.ngayNhan, v.ngayTra, p.MaPhong, tienCoc],
      1,
    );
    return { ok: true, data: { maDatPhong: out[0]!, soPhong: p.SoPhong, tienCoc } };
  } catch (err) {
    return { ok: false, loi: thongBaoCsdl(err) };
  }
}
```

- [ ] **Step 4: Chạy lại**

Run: `npx vitest run src/lib/thao-tac/dat-phong.test.ts` → Expected: 4 passed.
Run: `npm test` → Expected: `Test Files 22 passed`, `Tests 143 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/thao-tac/dat-phong.ts src/lib/thao-tac/dat-phong.test.ts
git commit -m "feat: thao tac dat phong goi sp_DatPhong, coc mot dem tinh tren server

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Thao tác thanh toán và ghi dịch vụ

**Files:**
- Create: `src/lib/thao-tac/hoa-don.ts`, `src/lib/thao-tac/dich-vu.ts`
- Test: `src/lib/thao-tac/hoa-don.test.ts`, `src/lib/thao-tac/dich-vu.test.ts`

**Interfaces:**
- Consumes: `callProcedure`, `callProcedureOut` (Task 2); `thucHien`, `KetQua` (Task 4). Test dùng `dong` (Task 1). `sp_GhiNhanDichVu` đã sửa ở Task 5.
- Produces:
  - `thanhToan(maHoaDon: string, loaiThanhToan: string): Promise<KetQua<null>>`: gọi `sp_ThanhToanHoaDon`.
  - `ghiDichVu(maDatPhong: string, maDv: string, soLuong: number): Promise<KetQua<{ maSuDungDv: string }>>`: gọi `sp_GhiNhanDichVu(ma, maDv, soLuong, NULL, @out1)`, với thời điểm là `NOW()` của CSDL.

- [ ] **Step 1: Viết test hỏng**

`src/lib/thao-tac/hoa-don.test.ts`:

```ts
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { thanhToan } from "@/lib/thao-tac/hoa-don";
import { dong } from "@/test/csdl";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

beforeEach(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

describe("thanhToan", () => {
  it("hoa don chua thanh toan: sang DaThanhToan kem hinh thuc", async () => {
    expect(await thanhToan("HD00000023", "ChuyenKhoan")).toEqual({ ok: true, data: null });
    expect(
      await dong("SELECT TrangThai, LoaiThanhToan FROM HOA_DON WHERE MaHoaDon = 'HD00000023'"),
    ).toEqual({ TrangThai: "DaThanhToan", LoaiThanhToan: "ChuyenKhoan" });
  });

  it("hoa don da thanh toan thi CSDL tu choi", async () => {
    expect(await thanhToan("HD00000032", "TienMat")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Hoa don da duoc thanh toan",
    });
  });

  it("hoa don nhap chua co khoan muc thi CSDL tu choi", async () => {
    expect(await thanhToan("HD00000007", "TienMat")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Hoa don nhap chua co chi tiet, hay lap hoa don truoc",
    });
  });

  it("hinh thuc la thi CSDL tu choi, hoa don giu nguyen", async () => {
    expect(await thanhToan("HD00000023", "BitCoin")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Loai thanh toan phai la TienMat, ChuyenKhoan hoac The",
    });
    expect(await dong("SELECT TrangThai FROM HOA_DON WHERE MaHoaDon = 'HD00000023'")).toEqual({
      TrangThai: "ChuaThanhToan",
    });
  });
});
```

`src/lib/thao-tac/dich-vu.test.ts`:

```ts
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { ghiDichVu } from "@/lib/thao-tac/dich-vu";
import { thanhToan } from "@/lib/thao-tac/hoa-don";
import { dong } from "@/test/csdl";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

beforeEach(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

describe("ghiDichVu", () => {
  it("phieu dang o: ghi dong moi, chot don gia cua DICH_VU", async () => {
    expect(await ghiDichVu("DP00000006", "DV00000002", 2)).toEqual({
      ok: true,
      data: { maSuDungDv: "SD00000099" },
    });
    expect(
      await dong(
        "SELECT MaDatPhong, MaDV, SoLuong, DonGiaThoiDiem, ThanhTien, NgaySuDung FROM SU_DUNG_DICH_VU WHERE MaSuDungDV = 'SD00000099'",
      ),
    ).toEqual({
      MaDatPhong: "DP00000006",
      MaDV: "DV00000002",
      SoLuong: 2,
      DonGiaThoiDiem: "250000.00",
      ThanhTien: "500000.00",
      NgaySuDung: "2026-09-23 10:00:00",
    });
  });

  it("phieu chua nhan phong thi CSDL tu choi", async () => {
    expect(await ghiDichVu("DP00000011", "DV00000002", 1)).toEqual({
      ok: false,
      loi: "CSDL từ chối: Chi ghi nhan dich vu cho phieu dang o (DangO)",
    });
  });

  it("phieu da co hoa don nhap: ghi them dich vu roi thanh toan duoc ngay", async () => {
    const truoc = await dong("SELECT TongTien FROM HOA_DON WHERE MaHoaDon = 'HD00000023'");
    expect(await ghiDichVu("DP00000023", "DV00000001", 1)).toMatchObject({ ok: true });

    expect(await dong("SELECT TongTien FROM HOA_DON WHERE MaHoaDon = 'HD00000023'")).toEqual({
      TongTien: (Number(truoc.TongTien) + 80000).toFixed(2),
    });
    expect(await thanhToan("HD00000023", "TienMat")).toEqual({ ok: true, data: null });
  });
});
```

- [ ] **Step 2: Chạy, xác nhận hỏng**

Run: `npx vitest run src/lib/thao-tac/hoa-don.test.ts src/lib/thao-tac/dich-vu.test.ts`
Expected: 2 file FAIL `Cannot find package '@/lib/thao-tac/hoa-don'` / `'@/lib/thao-tac/dich-vu'`.

- [ ] **Step 3: Viết hai module**

`src/lib/thao-tac/hoa-don.ts`:

```ts
import "server-only";

import { callProcedure } from "@/db/procedures";

import { thucHien, type KetQua } from "./ket-qua";

/** Thanh toan hoa don (sp_ThanhToanHoaDon). Loai: TienMat, ChuyenKhoan hoac The. */
export function thanhToan(maHoaDon: string, loaiThanhToan: string): Promise<KetQua<null>> {
  return thucHien(async () => {
    await callProcedure("sp_ThanhToanHoaDon", [maHoaDon, loaiThanhToan]);
    return null;
  });
}
```

`src/lib/thao-tac/dich-vu.ts`:

```ts
import "server-only";

import { callProcedureOut } from "@/db/procedures";

import { thucHien, type KetQua } from "./ket-qua";

/**
 * Ghi mot lan su dung dich vu vao phieu dang o (sp_GhiNhanDichVu), thoi diem
 * la bay gio cua CSDL. Tra ma dong su dung vua sinh.
 */
export function ghiDichVu(
  maDatPhong: string,
  maDv: string,
  soLuong: number,
): Promise<KetQua<{ maSuDungDv: string }>> {
  return thucHien(async () => {
    const { out } = await callProcedureOut("sp_GhiNhanDichVu", [maDatPhong, maDv, soLuong, null], 1);
    return { maSuDungDv: out[0]! };
  });
}
```

- [ ] **Step 4: Chạy lại**

Run: `npx vitest run src/lib/thao-tac/hoa-don.test.ts src/lib/thao-tac/dich-vu.test.ts` → Expected: 4 + 3 passed.
Run: `npm test` → Expected: `Test Files 24 passed`, `Tests 150 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/thao-tac/hoa-don.ts src/lib/thao-tac/hoa-don.test.ts src/lib/thao-tac/dich-vu.ts src/lib/thao-tac/dich-vu.test.ts
git commit -m "feat: thao tac thanh toan hoa don va ghi nhan dich vu

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Thao tác lễ tân: nhận phòng, thu cọc, hủy phiếu, lập hóa đơn, trả phòng

**Files:**
- Create: `src/lib/thao-tac/le-tan.ts`
- Test: `src/lib/thao-tac/le-tan.test.ts`

**Interfaces:**
- Consumes: `callProcedure`, `callProcedureOut` (Task 2); `thucHien`, `KetQua` (Task 4); `thanhToan` (Task 7, dùng trong test); `sp_NhanPhong` và `sp_HuyPhieuDat` đã sửa ở Task 5.
- Produces:
  - `nhanPhong(maDatPhong: string, maTk: string): Promise<KetQua<null>>`
  - `thuThemCoc(maDatPhong: string, soTien: string): Promise<KetQua<{ tienCoc: string }>>`: `tienCoc` là tổng cọc mới của phiếu.
  - `huyPhieu(maDatPhong: string): Promise<KetQua<null>>`
  - `lapHoaDon(maDatPhong: string): Promise<KetQua<{ maHoaDon: string }>>`: lập mới, hoặc lập lại hóa đơn nháp (giữ mã cũ).
  - `traPhong(maDatPhong: string): Promise<KetQua<null>>`

- [ ] **Step 1: Viết test hỏng `src/lib/thao-tac/le-tan.test.ts`**

```ts
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { thanhToan } from "@/lib/thao-tac/hoa-don";
import { huyPhieu, lapHoaDon, nhanPhong, thuThemCoc, traPhong } from "@/lib/thao-tac/le-tan";
import { dong, trangThai } from "@/test/csdl";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

beforeEach(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

const LE_TAN = "TK00000002";

describe("nhanPhong", () => {
  it("phieu nhan hom nay (phong DaDat nhu sp_DatPhong de lai): phieu DangO, phong DangSuDung", async () => {
    expect(await nhanPhong("DP00000011", LE_TAN)).toEqual({ ok: true, data: null });
    expect(await trangThai("DP00000011")).toEqual({ phieu: "DangO", phong: "DangSuDung", hoaDon: null });
  });

  // Review Focus: bam hai lan, hoac tab khac da nhan phong truoc.
  it("goi lan thu hai cho cung phieu thi CSDL tu choi, khong ghi gi them", async () => {
    await nhanPhong("DP00000011", LE_TAN);
    expect(await nhanPhong("DP00000011", LE_TAN)).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phieu dat phong phai o trang thai DaDat moi duoc nhan phong!",
    });
    expect(await trangThai("DP00000011")).toEqual({ phieu: "DangO", phong: "DangSuDung", hoaDon: null });
  });

  it("phieu dang o thi CSDL tu choi, khong doi gi", async () => {
    expect(await nhanPhong("DP00000006", LE_TAN)).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phieu dat phong phai o trang thai DaDat moi duoc nhan phong!",
    });
    expect(await trangThai("DP00000006")).toEqual({
      phieu: "DangO",
      phong: "DangSuDung",
      hoaDon: "ChuaThanhToan",
    });
  });
});

describe("thuThemCoc", () => {
  it("cong don vao tien coc cua phieu", async () => {
    // DP00000011: coc 600.000, tien phong 1.200.000.
    expect(await thuThemCoc("DP00000011", "400000")).toEqual({ ok: true, data: { tienCoc: "1000000.00" } });
    expect(await dong("SELECT TienCoc FROM PHIEU_DAT_PHONG WHERE MaDatPhong = 'DP00000011'")).toEqual({
      TienCoc: "1000000.00",
    });
  });

  it("tong coc vuot tien phong thi CSDL tu choi, coc giu nguyen", async () => {
    expect(await thuThemCoc("DP00000011", "600000.01")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Tong tien coc (1200000.01) vuot tong tien phong (1200000.00)",
    });
    expect(await dong("SELECT TienCoc FROM PHIEU_DAT_PHONG WHERE MaDatPhong = 'DP00000011'")).toEqual({
      TienCoc: "600000.00",
    });
  });
});

describe("huyPhieu", () => {
  it("phieu DaDat sang DaHuy, phong khong con phieu nao giu thi ve Trong", async () => {
    expect(await huyPhieu("DP00000012")).toEqual({ ok: true, data: null });
    expect(await trangThai("DP00000012")).toEqual({ phieu: "DaHuy", phong: "Trong", hoaDon: null });
  });

  it("phieu co hoa don nhap (DP00000007) thi hoa don nhap cung DaHuy", async () => {
    expect(await huyPhieu("DP00000007")).toEqual({ ok: true, data: null });
    expect(await trangThai("DP00000007")).toEqual({ phieu: "DaHuy", phong: "Trong", hoaDon: "DaHuy" });
  });

  it("phieu dang o thi CSDL tu choi", async () => {
    expect(await huyPhieu("DP00000006")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phieu dang o, khong duoc huy. Hay dung nghiep vu tra phong",
    });
  });
});

describe("lapHoaDon", () => {
  it("phieu vua nhan phong chua co hoa don: lap moi, tru coc", async () => {
    await nhanPhong("DP00000011", LE_TAN);
    expect(await lapHoaDon("DP00000011")).toEqual({ ok: true, data: { maHoaDon: "HD00000099" } });
    expect(
      await dong("SELECT TrangThai, TongTien FROM HOA_DON WHERE MaHoaDon = 'HD00000099'"),
    ).toEqual({ TrangThai: "ChuaThanhToan", TongTien: "600000.00" });
  });

  it("phieu da co hoa don nhap: lap lai, van dung ma cu", async () => {
    expect(await lapHoaDon("DP00000023")).toEqual({ ok: true, data: { maHoaDon: "HD00000023" } });
  });

  it("hoa don da thanh toan thi CSDL tu choi lap lai", async () => {
    expect(await lapHoaDon("DP00000032")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Hoa don da thanh toan hoac da huy, khong the lap lai",
    });
  });
});

describe("traPhong", () => {
  // Spec phase 2 muc 1, tieu chi 2: lam sai thu tu thi hien loi, du lieu khong doi.
  it("hoa don chua thanh toan thi CSDL tu choi, phieu va phong giu nguyen", async () => {
    expect(await traPhong("DP00000023")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Hoa don chua duoc thanh toan, khong the hoan tat tra phong!",
    });
    expect(await trangThai("DP00000023")).toEqual({
      phieu: "DangO",
      phong: "DangSuDung",
      hoaDon: "ChuaThanhToan",
    });
  });

  it("hoa don da thanh toan: phieu HoanTat, phong DangDon", async () => {
    await thanhToan("HD00000023", "TienMat");
    expect(await traPhong("DP00000023")).toEqual({ ok: true, data: null });
    expect(await trangThai("DP00000023")).toEqual({
      phieu: "HoanTat",
      phong: "DangDon",
      hoaDon: "DaThanhToan",
    });
  });
});
```

- [ ] **Step 2: Chạy, xác nhận hỏng**

Run: `npx vitest run src/lib/thao-tac/le-tan.test.ts`
Expected: FAIL `Cannot find package '@/lib/thao-tac/le-tan'`.

- [ ] **Step 3: Viết `src/lib/thao-tac/le-tan.ts`**

```ts
import "server-only";

import { callProcedure, callProcedureOut } from "@/db/procedures";

import { thucHien, type KetQua } from "./ket-qua";

/** Mat tien ghi cua man Nhan & tra phong: moi ham mot thu tuc. */

export function nhanPhong(maDatPhong: string, maTk: string): Promise<KetQua<null>> {
  return thucHien(async () => {
    await callProcedure("sp_NhanPhong", [maDatPhong, maTk]);
    return null;
  });
}

/** Cong them tien coc (sp_XacNhanDatCoc), tra tong coc moi cua phieu. */
export function thuThemCoc(maDatPhong: string, soTien: string): Promise<KetQua<{ tienCoc: string }>> {
  return thucHien(async () => {
    const [r] = await callProcedure<{ TienCoc: string }>("sp_XacNhanDatCoc", [maDatPhong, soTien]);
    return { tienCoc: r.TienCoc };
  });
}

export function huyPhieu(maDatPhong: string): Promise<KetQua<null>> {
  return thucHien(async () => {
    await callProcedure("sp_HuyPhieuDat", [maDatPhong]);
    return null;
  });
}

/** Lap (hoac lap lai) hoa don cua phieu, tra ma hoa don de chuyen sang trang chi tiet. */
export function lapHoaDon(maDatPhong: string): Promise<KetQua<{ maHoaDon: string }>> {
  return thucHien(async () => {
    const { out } = await callProcedureOut("sp_LapHoaDon", [maDatPhong], 1);
    return { maHoaDon: out[0]! };
  });
}

export function traPhong(maDatPhong: string): Promise<KetQua<null>> {
  return thucHien(async () => {
    await callProcedure("sp_TraPhong", [maDatPhong]);
    return null;
  });
}
```

- [ ] **Step 4: Chạy lại**

Run: `npx vitest run src/lib/thao-tac/le-tan.test.ts` → Expected: 13 passed.
Run: `npm test` → Expected: `Test Files 25 passed`, `Tests 163 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/thao-tac/le-tan.ts src/lib/thao-tac/le-tan.test.ts
git commit -m "feat: thao tac le tan: nhan phong, thu coc, huy phieu, lap hoa don, tra phong

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Thao tác buồng phòng, và một phiếu đi trọn vòng đời

**Files:**
- Create: `src/lib/thao-tac/buong-phong.ts`
- Test: `src/lib/thao-tac/buong-phong.test.ts`, `src/lib/thao-tac/vong-doi.test.ts`

**Interfaces:**
- Consumes: `callProcedure` (Task 2); `thucHien`, `KetQua` (Task 4). `vong-doi.test.ts` dùng thêm `datPhong` (Task 6), `thanhToan` và `ghiDichVu` (Task 7), `lapHoaDon`, `nhanPhong`, `thuThemCoc`, `traPhong` (Task 8), cùng hai hàm phase 1 là `getChiSoTongQuan` và `getThongKePhongTheoTrangThai`.
- Produces:
  - `ghiDonPhong(maPhong: string, maTk: string, ghiChu: string): Promise<KetQua<null>>`
  - `ghiSuaPhong(maPhong: string, maTk: string, chiPhi: string, moTaLoi: string): Promise<KetQua<null>>`
  - Hai hàm lưu `NULL` khi ghi chú / mô tả chỉ có khoảng trắng.

`vong-doi.test.ts` là tiêu chí 1 của spec §1: một phiếu đi trọn 8 bước. Mỗi bước kiểm trạng thái, và kiểm số liệu mà màn Tổng quan / Sơ đồ phòng đọc. Các bước nối tiếp nhau, nên file này chỉ nạp lại dữ liệu một lần (`beforeAll`).

- [ ] **Step 1: Viết test hỏng**

`src/lib/thao-tac/buong-phong.test.ts`:

```ts
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { ghiDonPhong, ghiSuaPhong } from "@/lib/thao-tac/buong-phong";
import { dong } from "@/test/csdl";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

beforeEach(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

const BUONG = "TK00000004";
const KY_THUAT = "TK00000006";
const phong = (ma: string) => dong("SELECT TrangThai FROM PHONG WHERE MaPhong = ?", [ma]);

describe("ghiDonPhong", () => {
  it("phong DangDon: ghi nhat ky, phong ve Trong", async () => {
    // PH00000005 = phong 301.
    expect(await ghiDonPhong("PH00000005", BUONG, "Don xong")).toEqual({ ok: true, data: null });
    expect(await phong("PH00000005")).toEqual({ TrangThai: "Trong" });
    expect(
      await dong("SELECT MaDon, MaPhong, MaTK, ThoiGian, GhiChu FROM DON_PHONG WHERE MaDon = 'DON0000017'"),
    ).toEqual({
      MaDon: "DON0000017",
      MaPhong: "PH00000005",
      MaTK: BUONG,
      ThoiGian: "2026-09-23 10:00:00",
      GhiChu: "Don xong",
    });
  });

  it("phong BaoTri sua xong va don: ve Trong", async () => {
    // PH00000004 = phong 202.
    await ghiDonPhong("PH00000004", BUONG, "");
    expect(await phong("PH00000004")).toEqual({ TrangThai: "Trong" });
  });

  it("phong dang co khach (DangSuDung) van DangSuDung, van ghi nhat ky", async () => {
    // PH00000006 = phong 302 cua DP00000006.
    expect(await ghiDonPhong("PH00000006", BUONG, "Don giua ky")).toEqual({ ok: true, data: null });
    expect(await phong("PH00000006")).toEqual({ TrangThai: "DangSuDung" });
    expect(await dong("SELECT COUNT(*) AS n FROM DON_PHONG")).toEqual({ n: 17 });
  });

  it("phong dang giu cho khach nhan hom nay (DaDat) van DaDat", async () => {
    // PH00000011 = phong 103 cua DP00000011.
    await ghiDonPhong("PH00000011", BUONG, "");
    expect(await phong("PH00000011")).toEqual({ TrangThai: "DaDat" });
  });

  it("ghi chu rong luu NULL", async () => {
    await ghiDonPhong("PH00000005", BUONG, "   ");
    expect(await dong("SELECT GhiChu FROM DON_PHONG WHERE MaDon = 'DON0000017'")).toEqual({ GhiChu: null });
  });

  it("phong khong ton tai thi CSDL tu choi", async () => {
    expect(await ghiDonPhong("PH99999999", BUONG, "")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Ma phong khong ton tai!",
    });
  });
});

describe("ghiSuaPhong", () => {
  it("phong Trong: ghi nhat ky kem chi phi, phong sang BaoTri", async () => {
    expect(await ghiSuaPhong("PH00000001", KY_THUAT, "350000", "Thay voi sen")).toEqual({
      ok: true,
      data: null,
    });
    expect(await phong("PH00000001")).toEqual({ TrangThai: "BaoTri" });
    expect(
      await dong("SELECT MaPhong, MaTK, ChiPhi, MoTaLoi FROM SUA_PHONG WHERE MaSua = 'SUA0000013'"),
    ).toEqual({ MaPhong: "PH00000001", MaTK: KY_THUAT, ChiPhi: "350000.00", MoTaLoi: "Thay voi sen" });
  });

  it("phong dang co khach thi CSDL tu choi, phong giu nguyen", async () => {
    expect(await ghiSuaPhong("PH00000006", KY_THUAT, "0", "May lanh")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phong dang co khach luu tru, khong the dua vao bao tri!",
    });
    expect(await phong("PH00000006")).toEqual({ TrangThai: "DangSuDung" });
  });
});
```

`src/lib/thao-tac/vong-doi.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getChiSoTongQuan } from "@/lib/queries/reports";
import { getThongKePhongTheoTrangThai } from "@/lib/queries/rooms";
import { ghiDonPhong } from "@/lib/thao-tac/buong-phong";
import { datPhong } from "@/lib/thao-tac/dat-phong";
import { ghiDichVu } from "@/lib/thao-tac/dich-vu";
import { thanhToan } from "@/lib/thao-tac/hoa-don";
import { lapHoaDon, nhanPhong, thuThemCoc, traPhong } from "@/lib/thao-tac/le-tan";
import { dong, trangThai } from "@/test/csdl";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

// Mot phieu di tron vong doi, dung thu tu spec phase 2 muc 1: cac buoc noi
// tiep nhau nen dung chung mot lan nap du lieu, chay theo thu tu khai bao.
beforeAll(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

const LE_TAN = "TK00000002";
const soPhong = async (ma: string) =>
  (await getThongKePhongTheoTrangThai()).find((t) => t.ma === ma)!.soLuong;

describe("vong doi mot phieu dat phong", () => {
  let maDatPhong = "";
  let maHoaDon = "";

  it("1. dat phong nhan hom nay: phieu DaDat, phong 101 DaDat, coc mot dem", async () => {
    const r = await datPhong({
      maKh: "KH00000001",
      maTk: LE_TAN,
      ngayNhan: "2026-09-23",
      ngayTra: "2026-09-25",
      maLoaiPhong: "LP00000001",
    });
    if (!r.ok) throw new Error(r.loi);
    maDatPhong = r.data.maDatPhong;
    expect(r.data).toEqual({ maDatPhong: "DP00000099", soPhong: "101", tienCoc: "600000.00" });
    expect(await trangThai(maDatPhong)).toEqual({ phieu: "DaDat", phong: "DaDat", hoaDon: null });
    expect(await soPhong("DaDat")).toBe(16);
  });

  it("2. thu them coc: tong coc 900.000", async () => {
    expect(await thuThemCoc(maDatPhong, "300000")).toEqual({ ok: true, data: { tienCoc: "900000.00" } });
  });

  it("3. nhan phong: phieu DangO, phong DangSuDung, cong suat tang", async () => {
    expect(await nhanPhong(maDatPhong, LE_TAN)).toEqual({ ok: true, data: null });
    expect(await trangThai(maDatPhong)).toEqual({ phieu: "DangO", phong: "DangSuDung", hoaDon: null });
    expect((await getChiSoTongQuan()).soPhongDangSuDung).toBe(11);
  });

  it("4. ghi dich vu: 2 suat buffet sang", async () => {
    expect(await ghiDichVu(maDatPhong, "DV00000002", 2)).toMatchObject({ ok: true });
  });

  it("5. lap hoa don: tien phong + dich vu - coc", async () => {
    const r = await lapHoaDon(maDatPhong);
    if (!r.ok) throw new Error(r.loi);
    maHoaDon = r.data.maHoaDon;
    // 1.200.000 + 500.000 - 900.000
    expect(await dong("SELECT TrangThai, TongTien FROM HOA_DON WHERE MaHoaDon = ?", [maHoaDon])).toEqual({
      TrangThai: "ChuaThanhToan",
      TongTien: "800000.00",
    });
  });

  it("6. thanh toan: doanh thu hom nay tang dung tien phong + dich vu", async () => {
    const truoc = await getChiSoTongQuan();
    expect(await thanhToan(maHoaDon, "TienMat")).toEqual({ ok: true, data: null });
    const sau = await getChiSoTongQuan();
    expect(sau.soHoaDonHomNay).toBe(truoc.soHoaDonHomNay + 1);
    expect(Number(sau.doanhThuHomNay) - Number(truoc.doanhThuHomNay)).toBe(1_700_000);
  });

  it("7. tra phong: phieu HoanTat, phong cho don", async () => {
    expect(await traPhong(maDatPhong)).toEqual({ ok: true, data: null });
    expect(await trangThai(maDatPhong)).toEqual({ phieu: "HoanTat", phong: "DangDon", hoaDon: "DaThanhToan" });
    expect(await soPhong("DangDon")).toBe(11);
  });

  it("8. ghi nhan don phong: phong 101 ve Trong", async () => {
    expect(await ghiDonPhong("PH00000001", "TK00000004", "")).toEqual({ ok: true, data: null });
    expect(await trangThai(maDatPhong)).toMatchObject({ phong: "Trong" });
    expect(await soPhong("Trong")).toBe(5);
  });
});
```

- [ ] **Step 2: Chạy, xác nhận hỏng**

Run: `npx vitest run src/lib/thao-tac/buong-phong.test.ts src/lib/thao-tac/vong-doi.test.ts`
Expected: 2 file FAIL `Cannot find package '@/lib/thao-tac/buong-phong'`.

- [ ] **Step 3: Viết `src/lib/thao-tac/buong-phong.ts`**

```ts
import "server-only";

import { callProcedure } from "@/db/procedures";

import { thucHien, type KetQua } from "./ket-qua";

/** Ghi chu rong thi luu NULL, nhu du lieu mau. */
const hoacNull = (s: string) => (s.trim() === "" ? null : s.trim());

export function ghiDonPhong(maPhong: string, maTk: string, ghiChu: string): Promise<KetQua<null>> {
  return thucHien(async () => {
    await callProcedure("sp_GhiNhanDonPhong", [maPhong, maTk, hoacNull(ghiChu)]);
    return null;
  });
}

export function ghiSuaPhong(
  maPhong: string,
  maTk: string,
  chiPhi: string,
  moTaLoi: string,
): Promise<KetQua<null>> {
  return thucHien(async () => {
    await callProcedure("sp_GhiNhanSuaPhong", [maPhong, maTk, chiPhi, hoacNull(moTaLoi)]);
    return null;
  });
}
```

- [ ] **Step 4: Chạy lại**

Run: `npx vitest run src/lib/thao-tac` → Expected: 8 file, tất cả pass (`buong-phong` 8, `vong-doi` 8).
Run: `npm test` → Expected: `Test Files 27 passed`, `Tests 179 passed`.
Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.

- [ ] **Step 5: Commit**

```bash
git add src/lib/thao-tac/buong-phong.ts src/lib/thao-tac/buong-phong.test.ts src/lib/thao-tac/vong-doi.test.ts
git commit -m "feat: thao tac don / sua phong; test mot phieu di tron vong doi

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: `PhieuTomTat` kèm hóa đơn của phiếu

**Files:**
- Modify: `src/lib/queries/bookings.ts`
- Test: `src/lib/queries/bookings.test.ts`

**Interfaces:**
- Consumes: `schema.hoaDon` (Drizzle).
- Produces: `PhieuTomTat` thêm trường `hoaDon: { maHoaDon: string; trangThai: string } | null`; chỉ thêm, không đổi trường cũ (spec §2). Mọi hàm đọc phiếu (`getPhieuNhanHomNay`, `getPhieuTraHomNay`, `getPhieuDangO`, `getPhieuTheoMa`) đều có trường này. Mỗi phiếu có tối đa một hóa đơn (ràng buộc duy nhất ở `01`).

- [ ] **Step 1: Sửa test**

`src/lib/queries/bookings.test.ts` — tìm:

```ts
      tenLoaiPhong: "Standard Single",
      tongTienPhong: "1200000.00",
    });
  });
});
```

thay bằng:

```ts
      tenLoaiPhong: "Standard Single",
      tongTienPhong: "1200000.00",
      hoaDon: null,
    });
  });
});
```

`src/lib/queries/bookings.test.ts` — tìm:

```ts
    expect(ds.map((p) => p.maDatPhong)).toContain("DP00000006");
  });
});
```

thay bằng:

```ts
    expect(ds.map((p) => p.maDatPhong)).toContain("DP00000006");
  });

  it("kem hoa don cua phieu, de tab Tra phong biet dang o buoc nao", async () => {
    const ds = await getPhieuDangO();
    expect(ds.find((p) => p.maDatPhong === "DP00000023")!.hoaDon).toEqual({
      maHoaDon: "HD00000023",
      trangThai: "ChuaThanhToan",
    });
  });
});
```

- [ ] **Step 2: Chạy, xác nhận hỏng**

Run: `npx vitest run src/lib/queries/bookings.test.ts`
Expected: 2 FAIL: phiếu DP00000011 chưa có trường `hoaDon`, và `hoaDon` của DP00000023 là `undefined`. 15 ca còn lại pass.

- [ ] **Step 3: Đọc hóa đơn cùng phiếu**

`src/lib/queries/bookings.ts` — tìm:

```ts
  tenLoaiPhong: string;
  tongTienPhong: string;
};
```

thay bằng:

```ts
  tenLoaiPhong: string;
  tongTienPhong: string;
  /** Hoa don cua phieu (moi phieu toi da mot), null khi chua lap. */
  hoaDon: { maHoaDon: string; trangThai: string } | null;
};
```

`src/lib/queries/bookings.ts` — tìm:

```ts
      trangThai: pdp.trangThai,
      tienCoc: pdp.tienCoc,
    })
    .from(pdp)
    .innerJoin(kh, eq(kh.maKh, pdp.maKh))
```

thay bằng:

```ts
      trangThai: pdp.trangThai,
      tienCoc: pdp.tienCoc,
      maHoaDon: schema.hoaDon.maHoaDon,
      trangThaiHoaDon: schema.hoaDon.trangThai,
    })
    .from(pdp)
    .innerJoin(kh, eq(kh.maKh, pdp.maKh))
    .leftJoin(schema.hoaDon, eq(schema.hoaDon.maDatPhong, pdp.maDatPhong))
```

`src/lib/queries/bookings.ts` — tìm:

```ts
  return phieu.map((p) => {
    const cua = chiTiet.filter((c) => c.maDatPhong === p.maDatPhong);
    return {
      ...p,
```

thay bằng:

```ts
  return phieu.map(({ maHoaDon, trangThaiHoaDon, ...p }) => {
    const cua = chiTiet.filter((c) => c.maDatPhong === p.maDatPhong);
    return {
      ...p,
      hoaDon: maHoaDon && trangThaiHoaDon ? { maHoaDon, trangThai: trangThaiHoaDon } : null,
```

- [ ] **Step 4: Chạy lại**

Run: `npx vitest run src/lib/queries/bookings.test.ts` → Expected: 17 passed.
Run: `npm test` → Expected: `Test Files 27 passed`, `Tests 180 passed`.
Run: `npx tsc --noEmit` → Expected: không lỗi.

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/bookings.ts src/lib/queries/bookings.test.ts
git commit -m "feat: PhieuTomTat kem hoa don cua phieu

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Màn Đặt phòng: nút "Lập phiếu đặt phòng"

**Files:**
- Create: `src/lib/lam-moi.ts`, `src/components/shared/thong-bao.tsx`, `src/components/shared/use-thao-tac.ts`
- Modify: `src/app/(app)/bookings/new/actions.ts` (thay toàn bộ), `src/components/bookings/booking-form.tsx`, `src/app/(app)/bookings/new/page.tsx`
- Test: `src/app/(app)/bookings/new/actions.test.ts`

**Interfaces:**
- Consumes: `datPhong` (Task 6); `laMa`, `laNgay`, `khongHopLe`, `KetQua` (Task 4); `getNhanVienMacDinh` và `traCuuPhongTrongAnToan` của phase 1.
- Produces (các task 12–15 dùng lại):
  - `lamMoiNeuXong<T>(r: KetQua<T>): KetQua<T>` (`@/lib/lam-moi`, chỉ dùng trong Server Action): `r.ok` thì gọi `refresh()`, rồi trả `r`.
  - `<ThongBao tb={ThongBaoKieu | null} />` và `type ThongBaoKieu = { loai: "ok" | "loi"; noiDung: string }`. Dòng xanh có `role="status"`, dòng đỏ có `role="alert"`.
  - `useThaoTac()` trả `{ dangChay, thongBao, setThongBao, chay }`. `chay(viec: () => Promise<KetQua<T>>, khiXong: (data: T) => string)` xóa thông báo cũ, chạy `viec` trong transition, rồi đặt thông báo. Action gọi `redirect()` thì không có kết quả, nên hook bỏ qua.
  - Server Action `datPhong(maKh, ngayNhan, ngayTra, maLoaiPhong)`, cả bốn tham số kiểu `unknown`, cùng file với `traCuuPhongTrong` (giữ nguyên).

`refresh()` của `next/cache` chỉ chạy được trong Server Action, nên `lamMoiNeuXong` nằm riêng ở `src/lib/lam-moi.ts`, không nằm trong `thao-tac/*` là tầng test gọi thẳng. Test action chỉ đi các nhánh sai hình thức: action trả về trước khi chạm CSDL hay gọi `refresh()`.

- [ ] **Step 1: Viết test hỏng `src/app/(app)/bookings/new/actions.test.ts`**

```ts
import { describe, expect, it } from "vitest";

import { datPhong } from "@/app/(app)/bookings/new/actions";

// Review Focus: Server Action la diem vao ai cung POST toi duoc.
describe("Server Action dat phong: tham so sai hinh thuc", () => {
  it("tu choi truoc khi cham CSDL", async () => {
    await expect(datPhong({ $ne: "" }, "2026-09-23", "2026-09-25", "LP00000001")).resolves.toEqual({
      ok: false,
      loi: "Mã khách hàng không hợp lệ",
    });
    await expect(datPhong("KH00000001", "", "2026-09-25", "LP00000001")).resolves.toEqual({
      ok: false,
      loi: "Ngày nhận / trả phòng không hợp lệ",
    });
    await expect(datPhong("KH00000001", "2026-09-23", "2026-09-25", ["LP00000001"])).resolves.toEqual({
      ok: false,
      loi: "Loại phòng không hợp lệ",
    });
  });
});
```

- [ ] **Step 2: Chạy, xác nhận hỏng**

Run: `npx vitest run "src/app/(app)/bookings/new/actions.test.ts"`
Expected: FAIL `datPhong is not a function`.

- [ ] **Step 3: Viết ba module dùng chung**

`src/lib/lam-moi.ts`:

```ts
import "server-only";

import { refresh } from "next/cache";

import type { KetQua } from "@/lib/thao-tac/ket-qua";

/**
 * Goi o cuoi moi Server Action ghi: thanh cong thi refresh() de trang hien tai
 * doc lai CSDL ngay trong cung response (next/cache, chi chay trong Server
 * Action). Tach khoi thao-tac/* vi test goi thang tang do, ngoai request Next.
 */
export function lamMoiNeuXong<T>(r: KetQua<T>): KetQua<T> {
  if (r.ok) refresh();
  return r;
}
```

`src/components/shared/thong-bao.tsx`:

```tsx
import { CircleCheck, TriangleAlert } from "lucide-react";

export type ThongBaoKieu = { loai: "ok" | "loi"; noiDung: string };

/** Dong ket qua ngay duoi nut vua bam: xanh khi xong, do khi CSDL tu choi. */
export function ThongBao({ tb }: { tb: ThongBaoKieu | null }) {
  if (!tb) return null;
  const ok = tb.loai === "ok";
  const Icon = ok ? CircleCheck : TriangleAlert;
  return (
    <div
      className="flex items-start gap-2 rounded-[10px] px-3 py-[10px] text-[12.5px]"
      style={ok ? { background: "#E3F0E9", color: "#14664B" } : { background: "#F8E8E5", color: "#8C3A31" }}
      role={ok ? "status" : "alert"}
    >
      <Icon size={16} strokeWidth={1.9} className="mt-px shrink-0" />
      <span>{tb.noiDung}</span>
    </div>
  );
}
```

`src/components/shared/use-thao-tac.ts`:

```ts
"use client";

import { useState, useTransition } from "react";

import type { KetQua } from "@/lib/thao-tac/ket-qua";

import type { ThongBaoKieu } from "./thong-bao";

/**
 * Chay mot Server Action ghi trong transition: `dangChay` de khoa nut trong
 * luc cho, `thongBao` la ket qua hien duoi nut. Action thanh cong da tu
 * refresh() nen trang doc lai CSDL; `khiXong` chi viet cau bao va doi state.
 */
export function useThaoTac() {
  const [dangChay, chuyenTiep] = useTransition();
  const [thongBao, setThongBao] = useState<ThongBaoKieu | null>(null);

  function chay<T>(viec: () => Promise<KetQua<T>>, khiXong: (data: T) => string) {
    setThongBao(null);
    chuyenTiep(async () => {
      const r = await viec();
      // Action redirect() (Lap hoa don) chuyen trang, khong tra ket qua.
      if (!r) return;
      setThongBao(r.ok ? { loai: "ok", noiDung: khiXong(r.data) } : { loai: "loi", noiDung: r.loi });
    });
  }

  return { dangChay, thongBao, setThongBao, chay };
}
```

- [ ] **Step 4: Viết `src/app/(app)/bookings/new/actions.ts`** (thay toàn bộ nội dung)

```ts
"use server";

import { lamMoiNeuXong } from "@/lib/lam-moi";
import { getNhanVienMacDinh } from "@/lib/queries/accounts";
import { traCuuPhongTrongAnToan } from "@/lib/queries/bookings";
import * as datPhongTT from "@/lib/thao-tac/dat-phong";
import { khongHopLe, laMa, laNgay } from "@/lib/thao-tac/kiem-tra";

/**
 * Form dat phong goi lai moi khi nguoi dung doi ngay, de so phong con trong
 * luon dung voi khoang ngay dang chon. Truoc day danh sach chi duoc tinh mot
 * lan tren may chu cho khoang ngay mac dinh roi giu nguyen, nen form bao so
 * phong trong sai ngay khi doi ngay.
 */
export async function traCuuPhongTrong(checkIn: string, checkOut: string) {
  return traCuuPhongTrongAnToan(checkIn, checkOut);
}

/** Nut "Lap phieu dat phong". Nguoi lap tam la nhan vien mac dinh (phase 3 doi sang phien). */
export async function datPhong(maKh: unknown, ngayNhan: unknown, ngayTra: unknown, maLoaiPhong: unknown) {
  if (!laMa(maKh, "KH")) return khongHopLe("Mã khách hàng");
  if (!laNgay(ngayNhan) || !laNgay(ngayTra)) return khongHopLe("Ngày nhận / trả phòng");
  if (!laMa(maLoaiPhong, "LP")) return khongHopLe("Loại phòng");

  const nv = await getNhanVienMacDinh();
  return lamMoiNeuXong(
    await datPhongTT.datPhong({ maKh, maTk: nv.maTk, ngayNhan, ngayTra, maLoaiPhong }),
  );
}
```

- [ ] **Step 5: Chạy lại test action**

Run: `npx vitest run "src/app/(app)/bookings/new/actions.test.ts"` → Expected: 1 passed.

- [ ] **Step 6: Nối nút trong form**

Form làm bốn việc mới:
- gọi `datPhong`;
- khóa nút khi đang chờ, khi tạm tính lỗi, hoặc khi loại phòng đã chọn hết phòng;
- hiện thông báo tra cứu phòng trống khi `r.ok` là `false`. Phase 1 bỏ qua thông báo này, nên ô ngày sai không báo gì;
- lập phiếu xong thì tra cứu lại số phòng trống.

`src/components/bookings/booking-form.tsx` — tìm:

```tsx
import { useEffect, useMemo, useState, useTransition } from "react";
import { Minus, Plus, TriangleAlert } from "lucide-react";

import { traCuuPhongTrong } from "@/app/(app)/bookings/new/actions";
import { formatVnd } from "@/lib/format";
```

thay bằng:

```tsx
import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Minus, Plus, TriangleAlert } from "lucide-react";

import { datPhong, traCuuPhongTrong } from "@/app/(app)/bookings/new/actions";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";
import { formatVnd } from "@/lib/format";
```

`src/components/bookings/booking-form.tsx` — tìm:

```tsx
  const [soKhach, setSoKhach] = useState(2);
```

thay bằng:

```tsx
  const [soKhach, setSoKhach] = useState(2);
  const [loiTraCuu, setLoiTraCuu] = useState<string | null>(null);
  // Tang len sau moi lan lap phieu thanh cong, de tra cuu lai so phong trong.
  const [lanTraCuu, setLanTraCuu] = useState(0);
  const lap = useThaoTac();
```

`src/components/bookings/booking-form.tsx` — tìm:

```tsx
      const r = await traCuuPhongTrong(ngayNhan, ngayTra);
      if (conHieuLuc && r.ok) setLoaiPhong(r.data);
    });
    return () => {
      conHieuLuc = false;
    };
  }, [ngayNhan, ngayTra]);
```

thay bằng:

```tsx
      const r = await traCuuPhongTrong(ngayNhan, ngayTra);
      if (!conHieuLuc) return;
      if (r.ok) setLoaiPhong(r.data);
      setLoiTraCuu(r.ok ? null : r.loi);
    });
    return () => {
      conHieuLuc = false;
    };
  }, [ngayNhan, ngayTra, lanTraCuu]);
```

`src/components/bookings/booking-form.tsx` — tìm:

```tsx
  // Tien coc quy uoc bang mot dem, dung nhu du lieu mau.
```

thay bằng:

```tsx
  // Tien coc quy uoc bang mot dem, dung nhu du lieu mau. Server tinh lai
  // dung so nay khi lap phieu, khong nhan so tu day gui len.
```

`src/components/bookings/booking-form.tsx` — tìm:

```tsx
          <p className="text-muted-foreground m-0 text-[11.5px]">
            Đơn giá lấy theo bảng giá có hiệu lực ngày nhận phòng — hệ số hiện hành 1,00.
          </p>
```

thay bằng:

```tsx
          <p className="text-muted-foreground m-0 text-[11.5px]">
            Đơn giá / đêm là trung bình bảng giá của các đêm đã chọn, đúng số hệ thống ghi vào phiếu.
          </p>
```

`src/components/bookings/booking-form.tsx` — tìm:

```tsx
          <span className="text-muted-foreground text-[12px]">
            {dangTraCuu
              ? "Đang tra cứu phòng trống…"
              : `${loaiPhong.reduce((s, l) => s + l.soPhongTrong, 0)} phòng trống trong khoảng ngày đã chọn`}
          </span>
```

thay bằng:

```tsx
          <span className="text-muted-foreground text-[12px]">
            {dangTraCuu
              ? "Đang tra cứu phòng trống…"
              : `${loaiPhong.reduce((s, l) => s + l.soPhongTrong, 0)} phòng trống trong khoảng ngày đã chọn`}
          </span>
          {loiTraCuu ? <ThongBao tb={{ loai: "loi", noiDung: loiTraCuu }} /> : null}
```

`src/components/bookings/booking-form.tsx` — tìm:

```tsx
        <button
          type="button"
          disabled={tamTinh.loi !== null}
          className="bg-primary text-primary-foreground h-11 rounded-[10px] text-[13.5px] font-semibold disabled:cursor-not-allowed disabled:opacity-45"
        >
          Lập phiếu đặt phòng
        </button>
        <p className="text-muted-foreground m-0 text-[11px]">
          Nút lập phiếu chưa được nối với CSDL.
        </p>
```

thay bằng:

```tsx
        <button
          type="button"
          disabled={tamTinh.loi !== null || !loai || loai.soPhongTrong === 0 || lap.dangChay}
          onClick={() =>
            lap.chay(
              () => datPhong(maKh, ngayNhan, ngayTra, maLoai),
              (d) => {
                setLanTraCuu((n) => n + 1);
                return `Đã lập phiếu ${d.maDatPhong} · phòng ${d.soPhong} · cọc ${formatVnd(d.tienCoc)}`;
              },
            )
          }
          className="bg-primary text-primary-foreground h-11 rounded-[10px] text-[13.5px] font-semibold disabled:cursor-not-allowed disabled:opacity-45"
        >
          {lap.dangChay ? "Đang lập phiếu…" : "Lập phiếu đặt phòng"}
        </button>
        <ThongBao tb={lap.thongBao} />
        {lap.thongBao?.loai === "ok" ? (
          <Link href="/front-desk" className="text-primary text-[12.5px] font-semibold">
            Sang Nhận & trả phòng →
          </Link>
        ) : null}
```

`src/app/(app)/bookings/new/page.tsx` — tìm:

```tsx
      <Topbar
        tieuDe="Lập phiếu đặt phòng"
        phu="Phiếu mới · chưa lưu"
        hanhDong={
          <span className="text-muted-foreground text-[12.5px]">
            Chức năng lưu phiếu chưa được nối với CSDL
          </span>
        }
      />
```

thay bằng:

```tsx
      <Topbar tieuDe="Lập phiếu đặt phòng" phu="Phiếu mới · chọn khách, ngày và loại phòng" />
```

- [ ] **Step 7: Kiểm kiểu, lint, cả bộ test**

Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.
Run: `npm test` → Expected: `Test Files 28 passed`, `Tests 181 passed`.

- [ ] **Step 8: Commit**

```bash
git add src/lib/lam-moi.ts src/components/shared/thong-bao.tsx src/components/shared/use-thao-tac.ts "src/app/(app)/bookings/new" src/components/bookings/booking-form.tsx
git commit -m "feat: nut Lap phieu dat phong goi sp_DatPhong

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Màn Nhận & trả phòng: 5 nút, tab Trả liệt kê mọi phiếu đang ở

**Files:**
- Create: `src/app/(app)/front-desk/actions.ts`
- Modify: `src/app/(app)/front-desk/page.tsx` (thay toàn bộ), `src/components/front-desk/booking-picker.tsx` (thay toàn bộ)
- Test: `src/app/(app)/front-desk/actions.test.ts`

**Interfaces:**
- Consumes: `nhanPhong`, `thuThemCoc`, `huyPhieu`, `lapHoaDon`, `traPhong` (Task 8); `laMa`, `laTien`, `khongHopLe` (Task 4); `docSoTien` (Task 4); `lamMoiNeuXong`, `ThongBao`, `useThaoTac` (Task 11); `PhieuTomTat.hoaDon` (Task 10); `getPhieuDangO`, `getPhieuNhanHomNay`, `getNgayHienTai` của phase 1.
- Produces:
  - Server Action `nhanPhong(ma)`, `thuThemCoc(ma, soTien)`, `huyPhieu(ma)`, `lapHoaDon(ma)`, `traPhong(ma)`, tham số kiểu `unknown`. `lapHoaDon` thành công thì `redirect("/invoices/<maHoaDon>")`.
  - `BookingPicker` có thêm prop `homNay: string`. Prop `tra` giờ là **mọi** phiếu `DangO`, phiếu đến hạn trả trước (spec §2, đã bổ sung).
  - Topbar vẫn ghi `<n> lượt trả` = số phiếu trả hôm nay (9 trên dữ liệu mẫu).

Theo spec §3.1, nút không khóa theo trạng thái. "Xác nhận trả phòng" vẫn bấm được khi hóa đơn chưa thanh toán; CSDL từ chối, thông báo hiện dưới nút (tiêu chí 2 của spec §1).

"Hủy phiếu" hỏi lại bằng `window.confirm`. Nhận phòng xong thì chuyển sang tab Trả, vẫn chọn phiếu vừa nhận, để lễ tân đi tiếp sang lập hóa đơn. Ô cọc đọc số qua `docSoTien` (Review Focus #1).

- [ ] **Step 1: Viết test hỏng `src/app/(app)/front-desk/actions.test.ts`**

```ts
import { describe, expect, it } from "vitest";

import { huyPhieu, lapHoaDon, nhanPhong, thuThemCoc, traPhong } from "@/app/(app)/front-desk/actions";

describe("Server Action Nhan & tra phong: tham so sai hinh thuc", () => {
  it("object, mang, so gui thay cho ma phieu thi tu choi truoc khi cham CSDL", async () => {
    for (const sai of [{ MaDatPhong: "DP00000011" }, ["DP00000011"], 11, null, "DP00000011' OR 1=1"]) {
      await expect(nhanPhong(sai)).resolves.toEqual({ ok: false, loi: "Mã phiếu không hợp lệ" });
      await expect(huyPhieu(sai)).resolves.toEqual({ ok: false, loi: "Mã phiếu không hợp lệ" });
      await expect(lapHoaDon(sai)).resolves.toEqual({ ok: false, loi: "Mã phiếu không hợp lệ" });
      await expect(traPhong(sai)).resolves.toEqual({ ok: false, loi: "Mã phiếu không hợp lệ" });
    }
    await expect(thuThemCoc("DP00000011", { $gt: 0 })).resolves.toEqual({
      ok: false,
      loi: "Số tiền cọc không hợp lệ",
    });
  });
});
```

- [ ] **Step 2: Chạy, xác nhận hỏng**

Run: `npx vitest run "src/app/(app)/front-desk/actions.test.ts"`
Expected: FAIL `Cannot find package '@/app/(app)/front-desk/actions'` (hoặc `Failed to resolve import`).

- [ ] **Step 3: Viết `src/app/(app)/front-desk/actions.ts`**

```ts
"use server";

import { redirect } from "next/navigation";

import { lamMoiNeuXong } from "@/lib/lam-moi";
import { getNhanVienMacDinh } from "@/lib/queries/accounts";
import { khongHopLe, laMa, laTien } from "@/lib/thao-tac/kiem-tra";
import * as leTan from "@/lib/thao-tac/le-tan";

/** Cac nut cua man Nhan & tra phong. Moi ham kiem hinh thuc roi goi mot thu tuc. */

export async function nhanPhong(maDatPhong: unknown) {
  if (!laMa(maDatPhong, "DP")) return khongHopLe("Mã phiếu");
  const nv = await getNhanVienMacDinh();
  return lamMoiNeuXong(await leTan.nhanPhong(maDatPhong, nv.maTk));
}

export async function thuThemCoc(maDatPhong: unknown, soTien: unknown) {
  if (!laMa(maDatPhong, "DP")) return khongHopLe("Mã phiếu");
  if (!laTien(soTien)) return khongHopLe("Số tiền cọc");
  return lamMoiNeuXong(await leTan.thuThemCoc(maDatPhong, soTien));
}

export async function huyPhieu(maDatPhong: unknown) {
  if (!laMa(maDatPhong, "DP")) return khongHopLe("Mã phiếu");
  return lamMoiNeuXong(await leTan.huyPhieu(maDatPhong));
}

/** Lap (lai) hoa don roi chuyen sang trang chi tiet de thanh toan. */
export async function lapHoaDon(maDatPhong: unknown) {
  if (!laMa(maDatPhong, "DP")) return khongHopLe("Mã phiếu");
  const r = await leTan.lapHoaDon(maDatPhong);
  if (r.ok) redirect(`/invoices/${r.data.maHoaDon}`);
  return r;
}

export async function traPhong(maDatPhong: unknown) {
  if (!laMa(maDatPhong, "DP")) return khongHopLe("Mã phiếu");
  return lamMoiNeuXong(await leTan.traPhong(maDatPhong));
}
```

- [ ] **Step 4: Chạy lại test action**

Run: `npx vitest run "src/app/(app)/front-desk/actions.test.ts"` → Expected: 1 passed.

- [ ] **Step 5: Viết `src/app/(app)/front-desk/page.tsx`** (thay toàn bộ nội dung)

```tsx
import { BookingPicker } from "@/components/front-desk/booking-picker";
import { Topbar } from "@/components/layout/topbar";
import { formatNgay } from "@/lib/format";
import { getPhieuDangO, getPhieuNhanHomNay } from "@/lib/queries/bookings";
import { getNgayHienTai } from "@/lib/queries/ngay";

export default async function LeTanPage() {
  const [homNay, nhan, dangO] = await Promise.all([
    getNgayHienTai(),
    getPhieuNhanHomNay(),
    getPhieuDangO(),
  ]);

  // Tab Tra phong liet ke MOI phieu dang o (sp_TraPhong cho tra som), phieu
  // den han hom nay len truoc. Co vay phieu vua nhan phong hom nay moi di tiep
  // duoc toi lap hoa don / tra phong ngay tren man nay.
  const tra = [...dangO].sort(
    (a, b) => a.ngayCheckOut.localeCompare(b.ngayCheckOut) || a.maDatPhong.localeCompare(b.maDatPhong),
  );
  const traHomNay = tra.filter((p) => p.ngayCheckOut === homNay).length;

  return (
    <>
      <Topbar
        tieuDe="Nhận & trả phòng"
        phu={`${formatNgay(homNay)} · ${nhan.length} lượt nhận · ${traHomNay} lượt trả`}
      />
      <main className="flex min-h-0 flex-grow overflow-auto px-8 py-7">
        <BookingPicker nhan={nhan} tra={tra} homNay={homNay} />
      </main>
    </>
  );
}
```

- [ ] **Step 6: Viết `src/components/front-desk/booking-picker.tsx`** (thay toàn bộ nội dung)

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

import { huyPhieu, lapHoaDon, nhanPhong, thuThemCoc, traPhong } from "@/app/(app)/front-desk/actions";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";
import { formatNgay, formatVnd } from "@/lib/format";
import type { PhieuTomTat } from "@/lib/queries/bookings";
import { docSoTien } from "@/lib/tinh-toan";

type Tab = "nhan" | "tra";

/**
 * Danh sach phieu ben trai + khung chi tiet ben phai,
 * theo design/CheckInOut.dc.html dong 73-cuoi.
 *
 * Doi tab thi phieu dang chon nhay ve phieu dau cua danh sach moi, khong giu ma
 * cu (ma cu khong con trong danh sach thi khung ben phai se trong tron).
 *
 * Moi nut goi mot Server Action; thanh cong thi trang tu doc lai CSDL
 * (refresh), nen danh sach va trang thai luon la cua CSDL. Nhan phong xong thi
 * chuyen sang tab Tra phong, van chon phieu do, de di tiep toi lap hoa don.
 */
export function BookingPicker({
  nhan,
  tra,
  homNay,
}: {
  nhan: PhieuTomTat[];
  tra: PhieuTomTat[];
  homNay: string;
}) {
  const [tab, setTab] = useState<Tab>("nhan");
  const [maDangChon, setMaDangChon] = useState(nhan[0]?.maDatPhong ?? "");
  const [soTienCoc, setSoTienCoc] = useState("");
  const tt = useThaoTac();

  const danhSach = tab === "nhan" ? nhan : tra;
  const phieu = danhSach.find((p) => p.maDatPhong === maDangChon) ?? danhSach[0];

  const chon = (ma: string) => {
    setMaDangChon(ma);
    setSoTienCoc("");
    tt.setThongBao(null);
  };

  const doiTab = (t: Tab) => {
    setTab(t);
    const ds = t === "nhan" ? nhan : tra;
    chon(ds[0]?.maDatPhong ?? "");
  };

  return (
    <div className="flex min-h-0 flex-grow flex-col gap-5">
      <div className="flex shrink-0 gap-[6px]">
        {([
          ["nhan", `Nhận phòng · ${nhan.length}`],
          ["tra", `Trả phòng · ${tra.length}`],
        ] as const).map(([khoa, nhanNut]) => (
          <button
            key={khoa}
            type="button"
            onClick={() => doiTab(khoa)}
            aria-pressed={tab === khoa}
            className={`h-10 rounded-[10px] px-[18px] text-[13.5px] ${
              tab === khoa
                ? "bg-primary text-primary-foreground font-semibold"
                : "border-border bg-card border text-[#57504A]"
            }`}
          >
            {nhanNut}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-grow gap-5">
        <section className="bg-card border-border flex w-[480px] shrink-0 flex-col gap-[14px] rounded-[14px] border p-5">
          <h2 className="m-0 text-[15px] font-semibold">
            {tab === "nhan" ? "Phiếu chờ nhận phòng" : "Phiếu đang ở · đến hạn trả trước"}
          </h2>
          {danhSach.length === 0 ? (
            <EmptyState thongDiep="Không có phiếu nào" />
          ) : (
            <div className="flex min-h-0 flex-grow flex-col gap-2 overflow-auto">
              {danhSach.map((p) => {
                const on = p.maDatPhong === phieu?.maDatPhong;
                return (
                  <button
                    key={p.maDatPhong}
                    type="button"
                    onClick={() => chon(p.maDatPhong)}
                    aria-pressed={on}
                    className={`flex items-center gap-[11px] rounded-[10px] border px-3 py-[10px] text-left ${
                      on ? "border-primary bg-accent" : "border-border bg-card"
                    }`}
                  >
                    <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold">
                      {p.hoTenKhach
                        .split(" ")
                        .slice(-2)
                        .map((t) => t[0])
                        .join("")}
                    </span>
                    <span className="flex min-w-0 flex-grow flex-col gap-px">
                      <span className="truncate text-[13px] font-semibold">
                        {p.hoTenKhach}
                      </span>
                      <span className="text-muted-foreground truncate font-mono text-[11.5px]">
                        {p.maDatPhong} · Phòng {p.soPhong.join(", ")}
                        {tab === "tra"
                          ? ` · trả ${p.ngayCheckOut === homNay ? "hôm nay" : formatNgay(p.ngayCheckOut)}`
                          : ""}
                      </span>
                    </span>
                    <StatusBadge trangThai={p.trangThai} loai="phieu" />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-card border-border flex min-w-0 flex-grow flex-col gap-[18px] rounded-[14px] border p-6">
          {!phieu ? (
            <>
              <EmptyState thongDiep="Chọn một phiếu ở danh sách bên trái để xem chi tiết" />
              <ThongBao tb={tt.thongBao} />
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="m-0 text-[17px] font-semibold">{phieu.hoTenKhach}</h2>
                  <span className="text-muted-foreground font-mono text-[11.5px]">
                    {phieu.maDatPhong} · {phieu.maKh} · CCCD {phieu.cccd} · {phieu.sdt}
                  </span>
                </div>
                <span className="flex-grow" />
                <StatusBadge trangThai={phieu.trangThai} loai="phieu" />
              </div>

              <dl className="border-border m-0 grid grid-cols-4 gap-4 rounded-[10px] border p-4 text-[13px]">
                <O nhan="Loại phòng" giaTri={phieu.tenLoaiPhong} />
                <O
                  nhan="Nhận → Trả"
                  giaTri={`${formatNgay(phieu.ngayCheckIn)} → ${formatNgay(phieu.ngayCheckOut)}`}
                  mono
                />
                <O nhan="Số đêm" giaTri={`${phieu.soDem} đêm`} mono />
                <O nhan="Tiền cọc" giaTri={formatVnd(phieu.tienCoc)} mono />
              </dl>

              <div className="flex flex-col gap-2">
                <h3 className="m-0 text-[13px] font-semibold">Phòng thực tế</h3>
                <div className="flex flex-wrap gap-2">
                  {phieu.soPhong.map((so) => (
                    <span
                      key={so}
                      className="bg-accent text-accent-foreground rounded-[9px] px-3 py-2 font-mono text-[14px]"
                    >
                      {so}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-border flex items-baseline gap-2 border-t pt-4">
                <span className="text-muted-foreground flex-grow text-[13px]">
                  Tiền phòng tạm tính
                </span>
                <span className="font-mono text-[18px] font-medium">
                  {formatVnd(phieu.tongTienPhong)}
                </span>
              </div>

              {tab === "nhan" ? (
                <div className="flex items-center gap-2">
                  <label htmlFor="coc" className="text-muted-foreground text-[12.5px]">
                    Thu thêm cọc
                  </label>
                  <input
                    id="coc"
                    inputMode="decimal"
                    placeholder="Số tiền, ví dụ 300.000"
                    value={soTienCoc}
                    onChange={(e) => setSoTienCoc(e.target.value)}
                    className="border-input bg-card h-10 flex-grow rounded-[10px] border px-3 font-mono text-[13px]"
                  />
                  <button
                    type="button"
                    disabled={tt.dangChay || soTienCoc.trim() === ""}
                    onClick={() =>
                      tt.chay(
                        () => thuThemCoc(phieu.maDatPhong, docSoTien(soTienCoc)),
                        (d) => {
                          setSoTienCoc("");
                          return `Đã thu thêm cọc. Tổng cọc của ${phieu.maDatPhong}: ${formatVnd(d.tienCoc)}`;
                        },
                      )
                    }
                    className="border-border text-foreground h-10 rounded-[10px] border px-4 text-[13px] disabled:opacity-45"
                  >
                    Ghi nhận cọc
                  </button>
                </div>
              ) : (
                <div className="flex items-baseline gap-2 text-[13px]">
                  <span className="text-muted-foreground flex-grow">Hóa đơn</span>
                  {phieu.hoaDon ? (
                    <>
                      <Link
                        href={`/invoices/${phieu.hoaDon.maHoaDon}`}
                        className="text-primary font-mono text-[12.5px] font-semibold"
                      >
                        {phieu.hoaDon.maHoaDon}
                      </Link>
                      <StatusBadge trangThai={phieu.hoaDon.trangThai} loai="hoaDon" />
                    </>
                  ) : (
                    <span className="text-muted-foreground">Chưa lập</span>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={tt.dangChay}
                  onClick={() => {
                    const ma = phieu.maDatPhong;
                    if (tab === "nhan") {
                      tt.chay(
                        () => nhanPhong(ma),
                        () => {
                          setTab("tra");
                          setMaDangChon(ma);
                          return `Đã nhận phòng ${ma}. Phiếu chuyển sang tab Trả phòng.`;
                        },
                      );
                    } else {
                      tt.chay(
                        () => traPhong(ma),
                        () => `Đã trả phòng ${ma}. Phòng chuyển sang chờ dọn.`,
                      );
                    }
                  }}
                  className="bg-primary text-primary-foreground h-11 flex-grow rounded-[10px] text-[13.5px] font-semibold disabled:opacity-45"
                >
                  {tab === "nhan" ? "Xác nhận nhận phòng" : "Xác nhận trả phòng"}
                </button>
                <button
                  type="button"
                  disabled={tt.dangChay}
                  onClick={() => {
                    const ma = phieu.maDatPhong;
                    if (tab === "nhan") {
                      if (!window.confirm(`Hủy phiếu ${ma}? Phiếu chuyển sang Đã hủy, không xóa.`)) return;
                      tt.chay(() => huyPhieu(ma), () => `Đã hủy phiếu ${ma}.`);
                    } else {
                      tt.chay(() => lapHoaDon(ma), () => "");
                    }
                  }}
                  className="border-border text-foreground h-11 rounded-[10px] border px-5 text-[13.5px] disabled:opacity-45"
                >
                  {tab === "nhan" ? "Hủy phiếu" : "Lập hóa đơn"}
                </button>
              </div>
              <ThongBao tb={tt.thongBao} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function O({ nhan, giaTri, mono = false }: { nhan: string; giaTri: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground text-[11px] tracking-[0.06em] uppercase">
        {nhan}
      </dt>
      <dd className={`m-0 ${mono ? "font-mono text-[12.5px]" : "text-[13px]"}`}>
        {giaTri}
      </dd>
    </div>
  );
}
```

- [ ] **Step 7: Kiểm kiểu, lint, cả bộ test**

Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.
Run: `npm test` → Expected: `Test Files 29 passed`, `Tests 182 passed`.

- [ ] **Step 8: Commit**

```bash
git add "src/app/(app)/front-desk" src/components/front-desk/booking-picker.tsx
git commit -m "feat: man Nhan & tra phong goi 5 thu tuc; tab Tra liet ke moi phieu dang o

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Chi tiết hóa đơn: thanh toán

**Files:**
- Create: `src/app/(app)/invoices/[maHoaDon]/actions.ts`, `src/components/invoices/thanh-toan-form.tsx`
- Modify: `src/app/(app)/invoices/[maHoaDon]/page.tsx`
- Test: `src/app/(app)/invoices/[maHoaDon]/actions.test.ts`

**Interfaces:**
- Consumes: `thanhToan` (Task 7); `laMa`, `laChuoi`, `khongHopLe` (Task 4); `lamMoiNeuXong`, `ThongBao`, `useThaoTac` (Task 11).
- Produces:
  - Server Action `thanhToan(maHoaDon: unknown, loaiThanhToan: unknown)`.
  - `<ThanhToanForm maHoaDon trangThai />`. Khi `trangThai === "ChuaThanhToan"`, form hiện ba nút hình thức (`TienMat` / `ChuyenKhoan` / `The`) và nút "Xác nhận thanh toán". Khi đã thanh toán, form hiện đường dẫn "Về Nhận & trả phòng →" tới `/front-desk` (spec §3.5).

Action chỉ kiểm `loaiThanhToan` là chuỗi tối đa 20 ký tự. Ba giá trị hợp lệ do `sp_ThanhToanHoaDon` kiểm (spec §3.1).

- [ ] **Step 1: Viết test hỏng `src/app/(app)/invoices/[maHoaDon]/actions.test.ts`**

```ts
import { describe, expect, it } from "vitest";

import { thanhToan } from "@/app/(app)/invoices/[maHoaDon]/actions";

describe("Server Action thanh toan: tham so sai hinh thuc", () => {
  it("tu choi truoc khi cham CSDL", async () => {
    await expect(thanhToan({ MaHoaDon: "HD00000023" }, "TienMat")).resolves.toEqual({
      ok: false,
      loi: "Mã hóa đơn không hợp lệ",
    });
    await expect(thanhToan("HD00000023", { toString: () => "TienMat" })).resolves.toEqual({
      ok: false,
      loi: "Hình thức thanh toán không hợp lệ",
    });
  });
});
```

- [ ] **Step 2: Chạy, xác nhận hỏng**

Run: `npx vitest run "src/app/(app)/invoices/[maHoaDon]/actions.test.ts"`
Expected: FAIL, không tìm thấy module `actions`.

- [ ] **Step 3: Viết action và form**

`src/app/(app)/invoices/[maHoaDon]/actions.ts`:

```ts
"use server";

import { lamMoiNeuXong } from "@/lib/lam-moi";
import * as hoaDon from "@/lib/thao-tac/hoa-don";
import { khongHopLe, laChuoi, laMa } from "@/lib/thao-tac/kiem-tra";

/** Nut "Xac nhan thanh toan". Hinh thuc hop le hay khong do sp_ThanhToanHoaDon kiem. */
export async function thanhToan(maHoaDon: unknown, loaiThanhToan: unknown) {
  if (!laMa(maHoaDon, "HD")) return khongHopLe("Mã hóa đơn");
  if (!laChuoi(loaiThanhToan, 20)) return khongHopLe("Hình thức thanh toán");
  return lamMoiNeuXong(await hoaDon.thanhToan(maHoaDon, loaiThanhToan));
}
```

`src/components/invoices/thanh-toan-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

import { thanhToan } from "@/app/(app)/invoices/[maHoaDon]/actions";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";

/** Ba gia tri cua CK_HOA_DON_LoaiThanhToan. */
const HINH_THUC = [
  ["TienMat", "Tiền mặt"],
  ["ChuyenKhoan", "Chuyển khoản"],
  ["The", "Thẻ"],
] as const;

/**
 * Phan thanh toan cua trang chi tiet hoa don: chi hien khi hoa don con
 * ChuaThanhToan. Thanh toan xong trang tu doc lai CSDL va hien duong ve man
 * Nhan & tra phong, noi buoc tiep theo (tra phong) dang cho.
 */
export function ThanhToanForm({ maHoaDon, trangThai }: { maHoaDon: string; trangThai: string }) {
  const [loai, setLoai] = useState<string>(HINH_THUC[0][0]);
  const tt = useThaoTac();

  if (trangThai !== "ChuaThanhToan") {
    return (
      <>
        <ThongBao tb={tt.thongBao} />
        <Link href="/front-desk" className="text-primary text-[13px] font-semibold">
          Về Nhận & trả phòng →
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="flex gap-[6px]">
        {HINH_THUC.map(([ma, nhan]) => (
          <button
            key={ma}
            type="button"
            onClick={() => setLoai(ma)}
            aria-pressed={loai === ma}
            className={`h-9 flex-grow rounded-lg text-[12.5px] ${
              loai === ma
                ? "bg-primary text-primary-foreground font-semibold"
                : "border-border bg-card border text-[#57504A]"
            }`}
          >
            {nhan}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={tt.dangChay}
        onClick={() => tt.chay(() => thanhToan(maHoaDon, loai), () => `Đã thanh toán ${maHoaDon}.`)}
        className="bg-primary text-primary-foreground h-11 rounded-[10px] text-[13.5px] font-semibold disabled:opacity-45"
      >
        {tt.dangChay ? "Đang ghi…" : "Xác nhận thanh toán"}
      </button>
      <ThongBao tb={tt.thongBao} />
    </>
  );
}
```

- [ ] **Step 4: Đặt form vào trang**

`src/app/(app)/invoices/[maHoaDon]/page.tsx` — tìm:

```tsx
import { StatusBadge } from "@/components/shared/status-badge";
```

thay bằng:

```tsx
import { ThanhToanForm } from "@/components/invoices/thanh-toan-form";
import { StatusBadge } from "@/components/shared/status-badge";
```

`src/app/(app)/invoices/[maHoaDon]/page.tsx` — tìm:

```tsx
          {hd.trangThai === "ChuaThanhToan" ? (
            <button
              type="button"
              className="bg-primary text-primary-foreground h-11 rounded-[10px] text-[13.5px] font-semibold"
            >
              Xác nhận thanh toán
            </button>
          ) : null}
          <p className="text-muted-foreground m-0 text-[11px]">
            Nút thanh toán chưa được nối với CSDL.
          </p>
```

thay bằng:

```tsx
          <ThanhToanForm maHoaDon={hd.maHoaDon} trangThai={hd.trangThai} />
```

- [ ] **Step 5: Chạy lại, kiểm kiểu, lint**

Run: `npx vitest run "src/app/(app)/invoices/[maHoaDon]/actions.test.ts"` → Expected: 1 passed.
Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.
Run: `npm test` → Expected: `Test Files 30 passed`, `Tests 183 passed`.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/invoices/[maHoaDon]" src/components/invoices/thanh-toan-form.tsx
git commit -m "feat: thanh toan hoa don goi sp_ThanhToanHoaDon

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Màn Dịch vụ: "Ghi nhận dịch vụ"

**Files:**
- Create: `src/app/(app)/services/actions.ts`
- Modify: `src/components/services/service-usage-form.tsx`
- Test: `src/app/(app)/services/actions.test.ts`

**Interfaces:**
- Consumes: `ghiDichVu` (Task 7); `laMa`, `laSoNguyenDuong`, `khongHopLe` (Task 4); `lamMoiNeuXong`, `ThongBao`, `useThaoTac` (Task 11).
- Produces: Server Action `ghiDichVu(maDatPhong: unknown, maDv: unknown, soLuong: unknown)`.

- [ ] **Step 1: Viết test hỏng `src/app/(app)/services/actions.test.ts`**

```ts
import { describe, expect, it } from "vitest";

import { ghiDichVu } from "@/app/(app)/services/actions";

describe("Server Action ghi dich vu: tham so sai hinh thuc", () => {
  it("tu choi truoc khi cham CSDL", async () => {
    await expect(ghiDichVu(["DP00000006"], "DV00000002", 1)).resolves.toEqual({
      ok: false,
      loi: "Mã phiếu không hợp lệ",
    });
    await expect(ghiDichVu("DP00000006", "", 1)).resolves.toEqual({ ok: false, loi: "Mã dịch vụ không hợp lệ" });
    for (const sai of [0, -1, 1.5, "2"]) {
      await expect(ghiDichVu("DP00000006", "DV00000002", sai)).resolves.toEqual({
        ok: false,
        loi: "Số lượng không hợp lệ",
      });
    }
  });
});
```

- [ ] **Step 2: Chạy, xác nhận hỏng**

Run: `npx vitest run "src/app/(app)/services/actions.test.ts"`
Expected: FAIL, không tìm thấy module `actions`.

- [ ] **Step 3: Viết `src/app/(app)/services/actions.ts`**

```ts
"use server";

import { lamMoiNeuXong } from "@/lib/lam-moi";
import * as dichVu from "@/lib/thao-tac/dich-vu";
import { khongHopLe, laMa, laSoNguyenDuong } from "@/lib/thao-tac/kiem-tra";

/** Nut "Ghi nhan dich vu". */
export async function ghiDichVu(maDatPhong: unknown, maDv: unknown, soLuong: unknown) {
  if (!laMa(maDatPhong, "DP")) return khongHopLe("Mã phiếu");
  if (!laMa(maDv, "DV")) return khongHopLe("Mã dịch vụ");
  if (!laSoNguyenDuong(soLuong)) return khongHopLe("Số lượng");
  return lamMoiNeuXong(await dichVu.ghiDichVu(maDatPhong, maDv, soLuong));
}
```

- [ ] **Step 4: Nối nút trong form**

`src/components/services/service-usage-form.tsx` — tìm:

```tsx
import { formatVnd } from "@/lib/format";
import { tienDichVu } from "@/lib/tinh-toan";
```

thay bằng:

```tsx
import { ghiDichVu } from "@/app/(app)/services/actions";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";
import { formatVnd } from "@/lib/format";
import { tienDichVu } from "@/lib/tinh-toan";
```

`src/components/services/service-usage-form.tsx` — tìm:

```tsx
/**
 * Khung ghi nhan su dung dich vu, theo design/Services.dc.html dong 161-cuoi.
 * Thanh tien tinh lai ngay khi doi so luong (mo phong fn_TienDichVu).
 */
```

thay bằng:

```tsx
/**
 * Khung ghi nhan su dung dich vu, theo design/Services.dc.html dong 161-cuoi.
 * Thanh tien tinh lai ngay khi doi so luong (mo phong fn_TienDichVu). Nut ghi
 * goi sp_GhiNhanDichVu; phieu da co hoa don nhap thi thu tuc tu tinh lai.
 */
```

`src/components/services/service-usage-form.tsx` — tìm:

```tsx
  const [soLuong, setSoLuong] = useState(1);
```

thay bằng:

```tsx
  const [soLuong, setSoLuong] = useState(1);
  const tt = useThaoTac();
```

`src/components/services/service-usage-form.tsx` — tìm:

```tsx
      <button
        type="button"
        className="bg-primary text-primary-foreground h-11 rounded-[10px] text-[13.5px] font-semibold"
      >
        Ghi nhận dịch vụ
      </button>
      <p className="text-muted-foreground m-0 text-[11px]">
        Nút ghi nhận chưa được nối với CSDL.
      </p>
```

thay bằng:

```tsx
      <button
        type="button"
        disabled={tt.dangChay || !maDatPhong || !dv}
        onClick={() =>
          tt.chay(
            () => ghiDichVu(maDatPhong, maDv, soLuong),
            (d) => {
              setSoLuong(1);
              return `Đã ghi ${d.maSuDungDv}: ${soLuong} × ${dv?.tenDv} cho phiếu ${maDatPhong}.`;
            },
          )
        }
        className="bg-primary text-primary-foreground h-11 rounded-[10px] text-[13.5px] font-semibold disabled:opacity-45"
      >
        {tt.dangChay ? "Đang ghi…" : "Ghi nhận dịch vụ"}
      </button>
      <ThongBao tb={tt.thongBao} />
```

- [ ] **Step 5: Chạy lại, kiểm kiểu, lint**

Run: `npx vitest run "src/app/(app)/services/actions.test.ts"` → Expected: 1 passed.
Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.
Run: `npm test` → Expected: `Test Files 31 passed`, `Tests 184 passed`.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/services/actions.ts" "src/app/(app)/services/actions.test.ts" src/components/services/service-usage-form.tsx
git commit -m "feat: ghi nhan dich vu goi sp_GhiNhanDichVu

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Sơ đồ phòng: ghi nhận dọn phòng và sửa chữa

**Files:**
- Create: `src/app/(app)/rooms/actions.ts`, `src/components/rooms/nhat-ky-form.tsx`
- Modify: `src/app/(app)/rooms/page.tsx`
- Test: `src/app/(app)/rooms/actions.test.ts`

**Interfaces:**
- Consumes: `ghiDonPhong`, `ghiSuaPhong` (Task 9); `laMa`, `laChuoi`, `laTien`, `khongHopLe`, `docSoTien` (Task 4); `lamMoiNeuXong`, `ThongBao`, `useThaoTac` (Task 11); `SectionCard`, `nhanTrangThaiPhong` có sẵn.
- Produces:
  - Server Action `ghiDonPhong(maPhong, ghiChu)` và `ghiSuaPhong(maPhong, chiPhi, moTaLoi)`, tham số kiểu `unknown`.
  - `<NhatKyForm phong phu>{bảng nhật ký}</NhatKyForm>` thay cho `<SectionCard>` của thẻ "Nhật ký buồng phòng & sửa chữa". Hai nút ở đầu thẻ mở form ngay trong thẻ (spec §3.5).

Form dọn phòng tự gợi ý phòng `DangDon` đầu tiên. Ô chi phí để trống thì gửi `"0"`, và đọc số qua `docSoTien` (Review Focus #1). Bảng nhật ký vẫn do trang server vẽ và được truyền vào dưới dạng `children`.

- [ ] **Step 1: Viết test hỏng `src/app/(app)/rooms/actions.test.ts`**

```ts
import { describe, expect, it } from "vitest";

import { ghiDonPhong, ghiSuaPhong } from "@/app/(app)/rooms/actions";

describe("Server Action nhat ky buong phong: tham so sai hinh thuc", () => {
  it("tu choi truoc khi cham CSDL", async () => {
    await expect(ghiDonPhong({ MaPhong: "PH00000005" }, "")).resolves.toEqual({
      ok: false,
      loi: "Phòng không hợp lệ",
    });
    await expect(ghiDonPhong("PH00000005", "x".repeat(201))).resolves.toEqual({
      ok: false,
      loi: "Ghi chú không hợp lệ",
    });
    await expect(ghiSuaPhong("PH00000001", "-5", "Vo")).resolves.toEqual({
      ok: false,
      loi: "Chi phí không hợp lệ",
    });
    await expect(ghiSuaPhong("PH00000001", "0", null)).resolves.toEqual({
      ok: false,
      loi: "Mô tả lỗi không hợp lệ",
    });
  });
});
```

- [ ] **Step 2: Chạy, xác nhận hỏng**

Run: `npx vitest run "src/app/(app)/rooms/actions.test.ts"`
Expected: FAIL, không tìm thấy module `actions`.

- [ ] **Step 3: Viết action và form**

`src/app/(app)/rooms/actions.ts`:

```ts
"use server";

import { lamMoiNeuXong } from "@/lib/lam-moi";
import { getNhanVienMacDinh } from "@/lib/queries/accounts";
import * as buongPhong from "@/lib/thao-tac/buong-phong";
import { khongHopLe, laChuoi, laMa, laTien } from "@/lib/thao-tac/kiem-tra";

/** Hai form trong the "Nhat ky buong phong & sua chua". Nguoi ghi tam la nhan vien mac dinh. */

export async function ghiDonPhong(maPhong: unknown, ghiChu: unknown) {
  if (!laMa(maPhong, "PH")) return khongHopLe("Phòng");
  if (!laChuoi(ghiChu, 200)) return khongHopLe("Ghi chú");
  const nv = await getNhanVienMacDinh();
  return lamMoiNeuXong(await buongPhong.ghiDonPhong(maPhong, nv.maTk, ghiChu));
}

export async function ghiSuaPhong(maPhong: unknown, chiPhi: unknown, moTaLoi: unknown) {
  if (!laMa(maPhong, "PH")) return khongHopLe("Phòng");
  if (!laTien(chiPhi)) return khongHopLe("Chi phí");
  if (!laChuoi(moTaLoi, 200)) return khongHopLe("Mô tả lỗi");
  const nv = await getNhanVienMacDinh();
  return lamMoiNeuXong(await buongPhong.ghiSuaPhong(maPhong, nv.maTk, chiPhi, moTaLoi));
}
```

`src/components/rooms/nhat-ky-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Brush, Wrench } from "lucide-react";

import { ghiDonPhong, ghiSuaPhong } from "@/app/(app)/rooms/actions";
import { SectionCard } from "@/components/shared/section-card";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";
import { nhanTrangThaiPhong } from "@/lib/status";
import { docSoTien } from "@/lib/tinh-toan";

type Phong = { maPhong: string; soPhong: string; trangThai: string };
type CheDo = "don" | "sua";

/**
 * The "Nhat ky buong phong & sua chua": hai nut o dau the mo form ghi nhan
 * don phong (sp_GhiNhanDonPhong) hoac sua chua (sp_GhiNhanSuaPhong) ngay trong
 * the. Bang nhat ky (children) do trang server ve, doc lai sau moi lan ghi.
 */
export function NhatKyForm({
  phong,
  phu,
  children,
}: {
  phong: Phong[];
  phu: string;
  children: React.ReactNode;
}) {
  const [cheDo, setCheDo] = useState<CheDo | null>(null);
  const [maPhong, setMaPhong] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [chiPhi, setChiPhi] = useState("");
  const tt = useThaoTac();

  const mo = (c: CheDo) => {
    setCheDo(c);
    // Don phong: goi y phong dau tien dang cho don; sua chua: phong dau tien.
    setMaPhong((phong.find((p) => c === "don" && p.trangThai === "DangDon") ?? phong[0])?.maPhong ?? "");
    setGhiChu("");
    setChiPhi("");
    tt.setThongBao(null);
  };

  const soPhong = phong.find((p) => p.maPhong === maPhong)?.soPhong ?? "";

  const ghi = () => {
    if (cheDo === "don") {
      tt.chay(() => ghiDonPhong(maPhong, ghiChu), () => {
        setGhiChu("");
        return `Đã ghi nhận dọn phòng ${soPhong}.`;
      });
    } else {
      tt.chay(() => ghiSuaPhong(maPhong, docSoTien(chiPhi) || "0", ghiChu), () => {
        setGhiChu("");
        setChiPhi("");
        return `Đã ghi nhận sửa chữa phòng ${soPhong}, phòng chuyển sang bảo trì.`;
      });
    }
  };

  const nut = (c: CheDo, Icon: typeof Brush, nhan: string) => (
    <button
      type="button"
      onClick={() => (cheDo === c ? setCheDo(null) : mo(c))}
      aria-pressed={cheDo === c}
      className="text-primary flex items-center gap-[5px] text-[12.5px] font-semibold"
    >
      <Icon size={14} strokeWidth={2} />
      {nhan}
    </button>
  );

  return (
    <SectionCard
      tieuDe="Nhật ký buồng phòng & sửa chữa"
      phu={phu}
      hanhDong={
        <span className="flex gap-4">
          {nut("don", Brush, "Ghi nhận dọn phòng")}
          {nut("sua", Wrench, "Ghi nhận sửa chữa")}
        </span>
      }
    >
      {cheDo ? (
        <div className="border-border flex flex-col gap-3 rounded-[10px] border p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-[6px] text-[12px]">
              <span className="text-muted-foreground">Phòng</span>
              <select
                value={maPhong}
                onChange={(e) => setMaPhong(e.target.value)}
                className="border-input bg-card h-10 w-[200px] rounded-[10px] border px-3 text-[13px]"
              >
                {phong.map((p) => (
                  <option key={p.maPhong} value={p.maPhong}>
                    {p.soPhong} · {nhanTrangThaiPhong(p.trangThai).nhan}
                  </option>
                ))}
              </select>
            </label>
            {cheDo === "sua" ? (
              <label className="flex flex-col gap-[6px] text-[12px]">
                <span className="text-muted-foreground">Chi phí (đ)</span>
                <input
                  inputMode="decimal"
                  placeholder="0"
                  value={chiPhi}
                  onChange={(e) => setChiPhi(e.target.value)}
                  className="border-input bg-card h-10 w-[140px] rounded-[10px] border px-3 font-mono text-[13px]"
                />
              </label>
            ) : null}
            <label className="flex min-w-[240px] flex-grow flex-col gap-[6px] text-[12px]">
              <span className="text-muted-foreground">{cheDo === "don" ? "Ghi chú" : "Mô tả lỗi"}</span>
              <input
                maxLength={200}
                value={ghiChu}
                onChange={(e) => setGhiChu(e.target.value)}
                className="border-input bg-card h-10 rounded-[10px] border px-3 text-[13px]"
              />
            </label>
            <button
              type="button"
              disabled={tt.dangChay || !maPhong}
              onClick={ghi}
              className="bg-primary text-primary-foreground h-10 rounded-[10px] px-5 text-[13px] font-semibold disabled:opacity-45"
            >
              {cheDo === "don" ? "Ghi nhận dọn" : "Ghi nhận sửa"}
            </button>
          </div>
          <ThongBao tb={tt.thongBao} />
        </div>
      ) : (
        <ThongBao tb={tt.thongBao} />
      )}
      {children}
    </SectionCard>
  );
}
```

- [ ] **Step 4: Dùng form trong trang**

`src/app/(app)/rooms/page.tsx` — tìm:

```tsx
import { Brush, Plus } from "lucide-react";

import { RoomFilter } from "@/components/rooms/room-filter";
import { SectionCard } from "@/components/shared/section-card";
```

thay bằng:

```tsx
import { Plus } from "lucide-react";

import { NhatKyForm } from "@/components/rooms/nhat-ky-form";
import { RoomFilter } from "@/components/rooms/room-filter";
```

`src/app/(app)/rooms/page.tsx` — tìm:

```tsx
        <SectionCard
          tieuDe="Nhật ký buồng phòng & sửa chữa"
          phu={`${nhatKy.length} ghi nhận`}
          hanhDong={
            <span className="text-primary flex items-center gap-[5px] text-[12.5px] font-semibold">
              <Brush size={14} strokeWidth={2} />
              Ghi nhận dọn phòng
            </span>
          }
        >
```

thay bằng:

```tsx
        <NhatKyForm
          phong={phong.map((p) => ({ maPhong: p.maPhong, soPhong: p.soPhong, trangThai: p.trangThai }))}
          phu={`${nhatKy.length} ghi nhận`}
        >
```

`src/app/(app)/rooms/page.tsx` — tìm:

```tsx
          </table>
        </SectionCard>
```

thay bằng:

```tsx
          </table>
        </NhatKyForm>
```

- [ ] **Step 5: Chạy lại, kiểm kiểu, lint**

Run: `npx vitest run "src/app/(app)/rooms/actions.test.ts"` → Expected: 1 passed.
Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.
Run: `npm test` → Expected: `Test Files 32 passed`, `Tests 185 passed`.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/rooms" src/components/rooms/nhat-ky-form.tsx
git commit -m "feat: ghi nhan don phong va sua chua ngay tren So do phong

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: README, và kiểm cả nhánh trước khi đụng CSDL dev

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: toàn bộ Task 1–15.
- Produces: README mô tả phase 2 xong, hai tầng ghi, `callProcedureOut`. README cũng ghi rõ: chạy lại `06` thì phải chạy lại `08` (MySQL xóa quyền `EXECUTE` của thủ tục bị `DROP`).

- [ ] **Step 1: Sửa `README.md`** (6 chỗ)

`README.md` — tìm:

````markdown
9 màn hình nghiệp vụ (Tổng quan, Sơ đồ phòng, Đặt phòng, Nhận & trả phòng, Khách
hàng, Dịch vụ, Hóa đơn, Báo cáo, Đăng nhập) **đọc dữ liệu thật** từ database
`QuanLyKhachSan`. Các nút ghi (nhận phòng, lập phiếu, thanh toán…) chưa nối CSDL
— đó là phase 2. Phiên đăng nhập và tài khoản MySQL theo vai trò là phase 3.
````

thay bằng:

````markdown
9 màn hình nghiệp vụ (Tổng quan, Sơ đồ phòng, Đặt phòng, Nhận & trả phòng, Khách
hàng, Dịch vụ, Hóa đơn, Báo cáo, Đăng nhập) **đọc dữ liệu thật** từ database
`QuanLyKhachSan`. Mọi nút ghi (đặt phòng, thu cọc, nhận / trả phòng, hủy phiếu,
ghi dịch vụ, lập hóa đơn, thanh toán, dọn / sửa phòng) gọi đúng thủ tục của
`06_Procedures.sql`. Phiên đăng nhập và tài khoản MySQL theo vai trò là phase 3.
````

`README.md` — tìm:

````markdown
Rồi `npm run dev` và mở http://localhost:3000. Trang `/db-check` in số dòng
của 14 bảng để kiểm tra kết nối.
````

thay bằng:

````markdown
Rồi `npm run dev` và mở http://localhost:3000. Trang `/db-check` in số dòng
của 14 bảng để kiểm tra kết nối.

Khi nhóm sửa thủ tục, chỉ cần chạy lại `06`: file chỉ `DROP` / `CREATE` thủ tục,
không đụng dữ liệu. Nhưng MySQL xóa luôn quyền `EXECUTE` đã cấp trên thủ tục bị
`DROP`, nên máy nào đã chạy `08` thì chạy lại `08` ngay sau `06`.
````

`README.md` — tìm:

````markdown
- **Ghi** (nhận phòng, ghi dịch vụ, lập hóa đơn, thanh toán): gọi stored
  procedure qua `callProcedure()` trong `src/db/procedures.ts`, để trigger và
  ràng buộc ở tầng CSDL còn hiệu lực — đó là phần chính của Chương 4.

```ts
// Dang dung: tra phong trong, bao cao doanh thu, dang nhap.
const phong = await callProcedure("sp_TraCuuPhongTrong", [checkIn, checkOut, null]);
```
````

thay bằng:

````markdown
- **Ghi** (đặt phòng, nhận phòng, ghi dịch vụ, lập hóa đơn, thanh toán…): gọi
  stored procedure qua `callProcedure()` / `callProcedureOut()` trong
  `src/db/procedures.ts`, để trigger và ràng buộc ở tầng CSDL còn hiệu lực — đó
  là phần chính của Chương 4.

Một nút ghi đi qua hai tầng:

- `src/lib/thao-tac/*.ts`: mỗi hàm gọi một thủ tục, trả `{ ok: true, data }` hoặc
  `{ ok: false, loi }`. `loi` là câu của CSDL (`"CSDL từ chối: …"`), hiện ngay dưới
  nút. Test gọi thẳng tầng này.
- `actions.ts` cạnh route: Server Action chỉ kiểm **kiểu và định dạng** tham số
  (`src/lib/thao-tac/kiem-tra.ts`), gọi thao tác, thành công thì `refresh()`. Quy
  tắc nghiệp vụ (trạng thái phiếu, phòng, hóa đơn) để thủ tục quyết định.

```ts
// Tham so OUT (@out1...) doc tren cung connection voi CALL.
const { out } = await callProcedureOut("sp_LapHoaDon", [maDatPhong], 1);
```
````

`README.md` — tìm:

````markdown
    ├── lib/
    │   ├── queries/        # mặt tiền đọc dữ liệu cho 9 màn hình
    │   ├── db-check.ts     # query cho trang /db-check
    │   └── format.ts       # format tiền VND
````

thay bằng:

````markdown
    ├── lib/
    │   ├── queries/        # mặt tiền đọc dữ liệu cho 9 màn hình
    │   ├── thao-tac/       # mặt tiền ghi: mỗi hàm một thủ tục, trả { ok, data | loi }
    │   ├── lam-moi.ts      # refresh() sau khi Server Action ghi xong
    │   ├── db-check.ts     # query cho trang /db-check
    │   └── format.ts       # format tiền VND
    ├── test/               # dựng / nạp lại CSDL kiểm thử cho vitest
````

`README.md` — tìm:

````markdown
| `npm test` | Test tích hợp trên `DATABASE_URL_TEST` (dựng lại từ `01`–`07`, ngày đóng băng 23/09/2026) |
````

thay bằng:

````markdown
| `npm test` | Test tích hợp trên `DATABASE_URL_TEST` (dựng lại từ `01`–`07`, ngày đóng băng 23/09/2026; test ghi nạp lại dữ liệu mẫu trước từng ca, các file chạy tuần tự) |
````

`README.md` — xóa đoạn:

````markdown
- Phase 2: nối các nút ghi (đặt phòng, nhận / trả phòng, ghi dịch vụ, lập hóa
  đơn, thanh toán, dọn phòng) với 12 thủ tục của `06_Procedures.sql`.
````

- [ ] **Step 2: Không còn chữ "chưa được nối", không còn nút trang trí**

```bash
grep -rn "chưa được nối\|dữ liệu giả" src; echo "grep_exit=$?"
grep -rln "use server" "src/app/(app)"
```

Expected: lệnh `grep` đầu không in dòng nào, `grep_exit=1`. Lệnh sau in đủ 5 file `actions.ts` (`bookings/new`, `front-desk`, `invoices/[maHoaDon]`, `services`, `rooms`).

- [ ] **Step 3: Kiểm kiểu, lint, test, build**

Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.
Run: `npm test` → Expected: `Test Files 32 passed`, `Tests 185 passed`.
Run: `npm run build` → Expected: build xong, bảng route giữ như phase 1: mọi route `(app)` là `ƒ`, chỉ `/_not-found` và `/login` là `○`.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: README phase 2: hai tang ghi, callProcedureOut, chay lai 08 sau 06

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: Cài `06` mới vào CSDL dev, đi trọn một vòng trên giao diện

**Files:**
- Không sửa code. Ảnh chụp và script kiểm để trong thư mục tạm của phiên.

**Interfaces:**
- Consumes: toàn bộ Task 1–16; `npm run db:mau` (phase 1).
- Produces: CSDL dev có 17 thủ tục mới và dữ liệu mẫu nạp lại theo hôm nay. Có ảnh chụp từng bước của vòng ở tiêu chí 1 của spec §1 để gửi người dùng.

- [ ] **Step 1: Hỏi người dùng trước khi ghi vào CSDL dev**

Gửi câu hỏi sau, và **chỉ làm tiếp khi người dùng đồng ý**:

> Sẽ chạy lại `06_Procedures.sql` vào CSDL dev `QuanLyKhachSan`: chỉ thay 17 thủ tục, không đụng bảng hay dữ liệu, và chưa chạy `08`. Sau đó `npm run db:mau`, rồi đi trọn một vòng trên giao diện: đặt phòng, thu cọc, nhận phòng, dịch vụ, hóa đơn, thanh toán, trả phòng, dọn phòng, hủy một phiếu, ghi một lần sửa. Vòng này ghi dữ liệu thử vào CSDL dev. Cuối cùng `npm run db:mau` lần nữa để trả về dữ liệu mẫu. Đồng ý chạy không?

- [ ] **Step 2: Cài `06`, nạp lại dữ liệu mẫu**

```bash
cd /Users/anhpham/PA/UIT/Demo
set -a; source .env.local; set +a
mysql -uroot -h127.0.0.1 --default-character-set=utf8mb4 < "$QLKS_SCRIPTS_DIR/06_Procedures.sql" > /dev/null && echo "06 ok"
mysql -uroot -h127.0.0.1 -N QuanLyKhachSan -e "
  SELECT COUNT(*) FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE();
  SELECT COUNT(*) FROM information_schema.ROUTINES
  WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_NAME = 'sp_NhanPhong'
    AND ROUTINE_DEFINITION LIKE '%NOT IN (''Trong'', ''DaDat'')%';"
npm run db:mau
```

Expected: `06 ok`, rồi `24` (19 thủ tục + 5 hàm) và `1` (bản `sp_NhanPhong` mới). Sau đó `Da nap lai du lieu mau vao QuanLyKhachSan: hom nay <dd/mm/yyyy> co 12 luot nhan, 9 luot tra phong`.

- [ ] **Step 3: Dev server và kiểm nhanh bằng `curl`**

Nếu `:3000` đang chạy thì dùng luôn (HMR đã nạp code mới). Nếu chưa, mở `npm run dev` trong Terminal panel của người dùng. Không dùng preview pane, vì người dùng đã từ chối.

```bash
for p in / /rooms /bookings/new /front-desk /customers /services /invoices /invoices/HD00000023 /reports /login; do
  printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3000$p")" "$p"
done
curl -s http://localhost:3000/front-desk | grep -o "12 lượt nhận · 9 lượt trả\|Trả phòng · 10" | sort -u
curl -s http://localhost:3000/rooms | grep -o "Ghi nhận sửa chữa" | head -1
```

Expected: mọi route `200`. `/front-desk` in cả `12 lượt nhận · 9 lượt trả` (topbar vẫn đếm lượt trả hôm nay) lẫn `Trả phòng · 10` (tab Trả có mọi phiếu đang ở). `/rooms` in `Ghi nhận sửa chữa`.

- [ ] **Step 4: Đi trọn vòng bằng Chrome headless**

Lưu script sau vào thư mục tạm của phiên, ví dụ `$TMP/kiem-vong-doi.mjs`. Script dùng Chrome của máy với một profile tạm riêng, không đụng profile của người dùng.

```js
// Di tron vong doi phase 2 tren giao dien bang Chrome headless + CDP, chup man hinh tung buoc.
// node kiem-vong-doi.mjs <thu-muc-anh> <thu-muc-profile-tam> [http://localhost:3000]
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const [OUT, PROF, BASE = "http://localhost:3000"] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--disable-gpu", "--hide-scrollbars", `--user-data-dir=${PROF}`,
  "--remote-debugging-port=9336", "--window-size=1440,900", "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let so = 0;
try {
  let targets;
  for (let i = 0; i < 50; i++) {
    try { targets = await (await fetch("http://127.0.0.1:9336/json/list")).json(); break; } catch { await sleep(200); }
  }
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0; const cho = new Map(); const suKien = [];
  const gui = (method, params = {}) => new Promise((r) => { const k = ++id; cho.set(k, r); ws.send(JSON.stringify({ id: k, method, params })); });
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && cho.has(m.id)) { cho.get(m.id)(m); cho.delete(m.id); return; }
    if (!m.method) return;
    suKien.push(m.method);
    if (m.method === "Page.javascriptDialogOpening") {
      console.log("   hop thoai:", m.params.message);
      gui("Page.handleJavaScriptDialog", { accept: true });
    }
    if (m.method === "Runtime.exceptionThrown") console.log("   LOI JS:", m.params.exceptionDetails.exception?.description?.split("\n")[0]);
  });
  const js = async (bieuThuc) => {
    const r = await gui("Runtime.evaluate", { expression: bieuThuc, awaitPromise: true, returnByValue: true });
    if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? "loi js");
    return r.result.result.value;
  };
  const moi = async (duong) => {
    suKien.length = 0;
    await gui("Page.navigate", { url: BASE + duong });
    for (let i = 0; i < 100 && !suKien.includes("Page.loadEventFired"); i++) await sleep(100);
    await sleep(800);
  };
  const doiDen = async (dieuKien, ms = 10000) => {
    for (let t = 0; t < ms; t += 150) { if (await js(dieuKien)) return; await sleep(150); }
    throw new Error("het gio cho: " + dieuKien);
  };
  // Nut co chu chua `chu` (bamCo) hoac dung bang `chu` (bamDung), bo qua nut dang khoa.
  const bamCo = (chu, chon = "button") => js(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(chon)})].find(e => e.textContent.includes(${JSON.stringify(chu)}) && !e.disabled); if (!el) return false; el.click(); return true; })()`);
  const bamDung = (chu) => js(`(() => { const el = [...document.querySelectorAll("button")].find(e => e.textContent.trim() === ${JSON.stringify(chu)} && !e.disabled); if (!el) return false; el.click(); return true; })()`);
  const nhap = (chon, v) => js(`(() => { const el = document.querySelector(${JSON.stringify(chon)}); const p = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(p, "value").set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? "change" : "input", { bubbles: true })); return el.value; })()`);
  // Chon phong trong form nhat ky theo so phong hien tren o chon ("101 · Đang dọn").
  const chonPhong = (soPhong) => js(`(() => { const el = [...document.querySelectorAll("select")].find(s => [...s.options].some(o => o.value.startsWith("PH"))); const o = [...el.options].find(o => o.text.startsWith(${JSON.stringify(soPhong + " ·")})); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(el, o.value); el.dispatchEvent(new Event("change", { bubbles: true })); return o.text; })()`);
  const thongBao = async (chua) => {
    await doiDen(`[...document.querySelectorAll('[role=status],[role=alert]')].some(e => e.textContent.includes(${JSON.stringify(chua)}))`);
    const t = await js(`[...document.querySelectorAll('[role=status],[role=alert]')].map(e => e.textContent.trim()).join(" | ")`);
    console.log("   ->", t);
    return t;
  };
  const chup = async (ten) => {
    const a = await gui("Page.captureScreenshot", { format: "png" });
    writeFileSync(`${OUT}/${String(++so).padStart(2, "0")}-${ten}.png`, Buffer.from(a.result.data, "base64"));
  };
  const moTabTra = async (ma) => { await moi("/front-desk"); await bamCo("Trả phòng ·"); await sleep(300); await bamCo(ma); };

  await gui("Page.enable"); await gui("Runtime.enable");
  await gui("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  console.log("1. Dat phong (khach, ngay, loai mac dinh)");
  await moi("/bookings/new");
  await doiDen(`[...document.querySelectorAll('button')].some(b => b.textContent.includes('Lập phiếu đặt phòng') && !b.disabled)`);
  await bamCo("Lập phiếu đặt phòng");
  const tb1 = await thongBao("Đã lập phiếu");
  const ma = tb1.match(/DP\d{8}/)[0];
  const soPhong = tb1.match(/phòng (\S+)/)[1];
  await chup("dat-phong");

  console.log("2. Thu them coc '300.000', nhan phong", ma);
  await moi("/front-desk");
  await bamCo(ma);
  await nhap("#coc", "300.000");
  await bamCo("Ghi nhận cọc");
  await thongBao("Đã thu thêm cọc");
  await bamCo("Xác nhận nhận phòng");
  await thongBao("Đã nhận phòng");
  await chup("nhan-phong");

  console.log("3. Ghi 2 suat buffet sang");
  await moi("/services");
  await nhap("#phieu", ma);
  await nhap("#dv", "DV00000002");
  await bamCo("", "button[aria-label='Tăng số lượng']");
  await bamCo("Ghi nhận dịch vụ");
  await thongBao("Đã ghi");
  await chup("dich-vu");

  console.log("4. Lap hoa don");
  await moTabTra(ma);
  await bamCo("Lập hóa đơn");
  await doiDen(`location.pathname.startsWith('/invoices/HD')`);
  await sleep(800);
  const hd = await js("location.pathname.split('/').pop()");
  console.log("   ->", hd);
  await chup("hoa-don");

  console.log("5. Tra phong khi chua thanh toan: CSDL phai tu choi");
  await moTabTra(ma);
  await bamCo("Xác nhận trả phòng");
  await thongBao("CSDL từ chối");
  await chup("tra-phong-bi-tu-choi");

  console.log("6. Thanh toan chuyen khoan");
  await moi(`/invoices/${hd}`);
  await bamCo("Chuyển khoản");
  await bamCo("Xác nhận thanh toán");
  await thongBao("Đã thanh toán");
  await chup("thanh-toan");

  console.log("7. Tra phong");
  await moTabTra(ma);
  await bamCo("Xác nhận trả phòng");
  await thongBao("Đã trả phòng");
  await chup("tra-phong");

  console.log("8. Ghi nhan don phong vua tra");
  await moi("/rooms");
  await bamCo("Ghi nhận dọn phòng");
  await sleep(300);
  // Form tu goi y phong DangDon dau tien; chon dung phong cua phieu vua tra.
  console.log("   phong:", await chonPhong(soPhong));
  await bamDung("Ghi nhận dọn");
  await thongBao("Đã ghi nhận dọn phòng");
  await chup("don-phong");

  console.log("9. Huy mot phieu cho nhan (hop thoai xac nhan)");
  await moi("/front-desk");
  const phieuHuy = await js(`[...document.querySelectorAll('button')].map(b => b.textContent.match(/DP\\d{8}/)?.[0]).find(Boolean)`);
  await bamCo(phieuHuy);
  await bamCo("Hủy phiếu");
  await thongBao("Đã hủy phiếu");

  console.log("10. Ghi nhan sua chua phong 409, chi phi '250.000'");
  await moi("/rooms");
  await bamCo("Ghi nhận sửa chữa");
  await sleep(300);
  console.log("   phong:", await chonPhong("409"));
  await nhap("input[inputmode=decimal]", "250.000");
  await bamDung("Ghi nhận sửa");
  await thongBao("Đã ghi nhận sửa chữa");

  console.log("11. Tong quan sau vong");
  await moi("/");
  await chup("tong-quan");
  ws.close();
} catch (e) {
  console.log("THAT BAI sau anh", so, "-", e.message);
  process.exitCode = 1;
} finally {
  chrome.kill();
}
```

Run: `node "$TMP/kiem-vong-doi.mjs" "$TMP/anh-phase2" "$TMP/chrome-phase2" http://localhost:3000`

Expected (mã có thể khác nếu CSDL dev không vừa nạp lại):

```
1. Dat phong (khach, ngay, loai mac dinh)
   -> Đã lập phiếu DP00000099 · phòng 101 · cọc 600.000 ₫
2. Thu them coc '300.000', nhan phong DP00000099
   -> Đã thu thêm cọc. Tổng cọc của DP00000099: 900.000 ₫
   -> Đã nhận phòng DP00000099. Phiếu chuyển sang tab Trả phòng.
3. Ghi 2 suat buffet sang
   -> Đã ghi SD00000099: 2 × Buffet sang cho phiếu DP00000099.
4. Lap hoa don
   -> HD00000099
5. Tra phong khi chua thanh toan: CSDL phai tu choi
   -> CSDL từ chối: Hoa don chua duoc thanh toan, khong the hoan tat tra phong!
6. Thanh toan chuyen khoan
   -> Đã thanh toán HD00000099.
7. Tra phong
   -> Đã trả phòng DP00000099. Phòng chuyển sang chờ dọn.
8. Ghi nhan don phong vua tra
   phong: 101 · Đang dọn
   -> Đã ghi nhận dọn phòng 101.
9. Huy mot phieu cho nhan (hop thoai xac nhan)
   hop thoai: Hủy phiếu DP00000011? Phiếu chuyển sang Đã hủy, không xóa.
   -> Đã hủy phiếu DP00000011.
10. Ghi nhan sua chua phong 409, chi phi '250.000'
   phong: 409 · Trống
   -> Đã ghi nhận sửa chữa phòng 409, phòng chuyển sang bảo trì.
11. Tong quan sau vong
```

Không có dòng `THAT BAI` hay `LOI JS`. Mở từng ảnh trong `$TMP/anh-phase2/` để xem: thông báo nằm ngay dưới nút vừa bấm, ảnh 5 có dòng đỏ, các ảnh còn lại có dòng xanh.

- [ ] **Step 5: Gửi ảnh cho người dùng, trả CSDL dev về dữ liệu mẫu**

Gửi 9 ảnh chụp cho người dùng.

```bash
npm run db:mau
```

Expected: `… co 12 luot nhan, 9 luot tra phong`.

- [ ] **Step 6: Kiểm lần cuối**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: tất cả qua. `git status --short` sạch. `git log --oneline main..` liệt kê 17 commit (Task 0–16).
