# Demo QLKS — 9 màn hình UI với dữ liệu giả · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Biến 9 artboard trong `design/` thành 9 route Next.js chạy được, đúng token màu / font / bố cục, dùng dữ liệu giả, chưa nối MySQL.

**Architecture:** Trang là Server Component, gọi mặt tiền `src/lib/queries/*`; mặt tiền đọc `src/lib/mock/data.ts` (kiểu lấy từ `src/db/schema.ts` bằng `$inferSelect`). Logic tính tiền tách riêng vào `src/lib/tinh-toan.ts` để test được và để mô phỏng đúng các function trong `Scripts/03b_Functions.sql`. Ba chỗ tương tác tách thành Client Component.

**Tech Stack:** Next.js 16.3.5 (App Router), React 19.2.8, TypeScript 5, Tailwind CSS v4, shadcn/ui (style `radix-nova`), lucide-react, Vitest (thêm mới ở Task 1).

**Spec:** `docs/superpowers/specs/2026-09-24-demo-ui-mock-design.md`

**Trạng thái:** Đã xong, 18/18 task (commit `5868712`..`026c857`, đã vào `main`).

## Global Constraints

- Chữ hiển thị trên giao diện: **tiếng Việt có dấu**, đúng câu chữ trong artboard tương ứng.
- Chú thích trong code: **tiếng Việt không dấu**, theo lối đang dùng ở `src/db/index.ts`, `src/lib/db-check.ts`, `drizzle.config.ts`.
- Tiền giữ dạng `string` đúng như `DECIMAL(18,2)` MySQL trả về. Không đổi sang `number` khi lưu trữ.
- Mã khóa `CHAR(10)`: tiền tố `PH` / `KH` / `DP` / `HD` / `LP` / `TK` / `DV` + chữ số cho đủ 10 ký tự.
- "Hôm nay" = hằng `NGAY_HIEN_TAI = "2026-09-23"`, không dùng `new Date()`.
- **Không** sửa `src/db/schema.ts` (file sinh tự động bằng `drizzle-kit pull`).
- **Không** đụng tới `Scripts/` ở giai đoạn này.
- **Không** nối MySQL, không gọi stored procedure, không import `@/db` (chỉ `import type` từ `@/db/schema`).
- Desktop-first, tối ưu từ 1280px. Không làm giao diện điện thoại, không làm chế độ tối.
- Token màu và font lấy đúng bảng trong `design/README.md`.
- Không thêm thư viện biểu đồ — biểu đồ cột vẽ bằng `div` + CSS.
- Trạng thái phòng chỉ nhận 5 giá trị của `CK_PHONG_TrangThai`: `Trong`, `DaDat`, `DangSuDung`, `DangDon`, `BaoTri`.

## Review Focus

Năm chỗ spec ngụ ý nhưng không task nào tự nhiên chạm tới; mỗi dòng đã được gắn test vào task sở hữu đoạn code đó:

1. **Ngày trả ≤ ngày nhận** → `soDem()` phải ném lỗi chứ không trả số âm hay 0 âm thầm; form đặt phòng phải hiện lỗi thay vì tính tiền âm. *(Test ở Task 3 và Task 13.)*
2. **Trạng thái lạ ngoài 5 giá trị CHECK** → `nhanTrangThaiPhong()` phải trả nhãn dự phòng chứ không `undefined` làm vỡ trang. *(Test ở Task 2.)*
3. **Danh sách rỗng sau khi lọc** → sơ đồ phòng và bảng khách hàng phải hiện `empty-state` chứ không lưới trắng. *(Test ở Task 12 và Task 15.)*
4. **`/invoices/<mã không tồn tại>`** → gọi `notFound()` trả trang 404, không ném lỗi chưa bắt. *(Test ở Task 8 và Task 16.)*
5. **Tài khoản `TrangThai` khác `DangLamViec`** → đăng nhập phải bị từ chối kèm thông báo đúng như `sp_DangNhap`, dù mật khẩu đúng (dữ liệu mẫu có `kythuat.son` = `TamNghi`, `cskh.uyen` = `NghiViec`). *(Test ở Task 6.)*

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `vitest.config.ts` | Cấu hình test, map alias `@/` |
| `src/lib/format.ts` | Định dạng tiền, ngày, giờ, số (mở rộng file sẵn có) |
| `src/lib/status.ts` | Trạng thái → nhãn tiếng Việt + lớp màu |
| `src/lib/tinh-toan.ts` | Mô phỏng `fn_SoDem`, `fn_DonGiaPhongTheoNgay`, `fn_TienPhong`, `fn_TienDichVu` |
| `src/lib/mock/now.ts` | `NGAY_HIEN_TAI` |
| `src/lib/mock/data.ts` | Dòng thô mọi bảng: 10 dòng gốc + phần độn cho demo |
| `src/lib/queries/*.ts` | Mặt tiền đọc dữ liệu, sau này thay bằng Drizzle |
| `src/lib/nav.ts` | Danh sách mục điều hướng |
| `src/components/layout/*` | Sidebar, Topbar, PageHeader |
| `src/components/shared/*` | StatCard, StatusBadge, EmptyState |
| `src/components/{rooms,bookings,front-desk,customers,services,reports,auth}/*` | Client Component từng màn |
| `src/app/(app)/**` | 8 route trong shell |
| `src/app/(auth)/login/page.tsx` | Route đăng nhập |

---

### Task 1: Vitest + mở rộng `format.ts`

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (thêm `test`, devDependency `vitest`)
- Modify: `src/lib/format.ts`
- Test: `src/lib/format.test.ts`

**Interfaces:**
- Consumes: không
- Produces: `formatVnd(v: string | number): string`, `formatNgay(iso: string): string`, `formatNgayGio(iso: string): string`, `formatSo(v: number): string`

- [x] **Step 1: Cài Vitest**

```bash
npm install -D vitest
```

- [x] **Step 2: Tạo `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

- [x] **Step 3: Thêm script test vào `package.json`**

Trong `"scripts"`, thêm: `"test": "vitest run"` và `"test:watch": "vitest"`.

- [x] **Step 4: Viết test thất bại**

```ts
// src/lib/format.test.ts
import { describe, expect, it } from "vitest";
import { formatNgay, formatNgayGio, formatSo, formatVnd } from "@/lib/format";

describe("formatVnd", () => {
  it("dinh dang chuoi DECIMAL cua MySQL", () => {
    expect(formatVnd("1000000.00")).toBe("1.000.000 ₫");
  });
  it("khong lam tron sai voi so le", () => {
    expect(formatVnd("1500000.50")).toBe("1.500.001 ₫");
  });
});

describe("formatNgay", () => {
  it("doi ISO sang dd/MM/yyyy", () => {
    expect(formatNgay("2026-09-23")).toBe("23/09/2026");
  });
  it("chap nhan ca chuoi DATETIME", () => {
    expect(formatNgay("2026-09-23 11:42:00")).toBe("23/09/2026");
  });
});

describe("formatNgayGio", () => {
  it("doi DATETIME sang HH:mm · dd/MM/yyyy", () => {
    expect(formatNgayGio("2026-09-23 11:42:00")).toBe("11:42 · 23/09/2026");
  });
});

describe("formatSo", () => {
  it("dung dau cham phan cach hang nghin", () => {
    expect(formatSo(1284)).toBe("1.284");
  });
});
```

- [x] **Step 5: Chạy test, xác nhận thất bại**

Run: `npm test -- src/lib/format.test.ts`
Expected: FAIL — `formatNgay`, `formatNgayGio`, `formatSo` chưa tồn tại.

- [x] **Step 6: Bổ sung `src/lib/format.ts`**

Giữ nguyên `formatVnd` sẵn có, thêm bên dưới:

```ts
const so = new Intl.NumberFormat("vi-VN");

/** Tach phan ngay khoi chuoi DATE hoac DATETIME cua MySQL. */
function tachNgay(iso: string): [string, string, string] {
  const [ngay] = iso.split(/[ T]/);
  const [y, m, d] = ngay.split("-");
  return [d, m, y];
}

/** '2026-09-23' -> '23/09/2026'. Nhan ca chuoi DATETIME. */
export function formatNgay(iso: string): string {
  const [d, m, y] = tachNgay(iso);
  return `${d}/${m}/${y}`;
}

/** '2026-09-23 11:42:00' -> '11:42 · 23/09/2026'. */
export function formatNgayGio(iso: string): string {
  const gio = iso.split(/[ T]/)[1]?.slice(0, 5) ?? "00:00";
  return `${gio} · ${formatNgay(iso)}`;
}

/** 1284 -> '1.284'. */
export function formatSo(v: number): string {
  return so.format(v);
}
```

- [x] **Step 7: Chạy test, xác nhận đạt**

Run: `npm test -- src/lib/format.test.ts`
Expected: PASS, 5 test.

- [x] **Step 8: Commit**

```bash
git add vitest.config.ts package.json package-lock.json src/lib/format.ts src/lib/format.test.ts
git commit -m "test: them Vitest va mo rong lib/format"
```

---

### Task 2: `lib/status.ts` — trạng thái sang nhãn và màu

**Files:**
- Create: `src/lib/status.ts`
- Test: `src/lib/status.test.ts`

**Interfaces:**
- Consumes: không
- Produces:
  - `type KieuTrangThai = { nhan: string; fg: string; bg: string; dot: string }`
  - `nhanTrangThaiPhong(ma: string): KieuTrangThai`
  - `nhanTrangThaiPhieu(ma: string): KieuTrangThai`
  - `nhanTrangThaiHoaDon(ma: string): KieuTrangThai`
  - `TRANG_THAI_PHONG: readonly ["Trong","DaDat","DangSuDung","DangDon","BaoTri"]`

- [x] **Step 1: Viết test thất bại**

```ts
// src/lib/status.test.ts
import { describe, expect, it } from "vitest";
import {
  TRANG_THAI_PHONG,
  nhanTrangThaiHoaDon,
  nhanTrangThaiPhieu,
  nhanTrangThaiPhong,
} from "@/lib/status";

describe("nhanTrangThaiPhong", () => {
  it("tra dung nhan va mau cua design/README.md", () => {
    expect(nhanTrangThaiPhong("Trong")).toEqual({
      nhan: "Trống", fg: "#14664B", bg: "#E3F0E9", dot: "#1B8A6A",
    });
    expect(nhanTrangThaiPhong("BaoTri").nhan).toBe("Bảo trì");
  });

  // Review Focus #2
  it("tra nhan du phong khi gap gia tri la, khong tra undefined", () => {
    const r = nhanTrangThaiPhong("GiaTriLa");
    expect(r.nhan).toBe("GiaTriLa");
    expect(r.fg).toBeTruthy();
    expect(r.bg).toBeTruthy();
  });

  it("phu du 5 gia tri cua rang buoc CHECK", () => {
    expect(TRANG_THAI_PHONG).toHaveLength(5);
    for (const ma of TRANG_THAI_PHONG) {
      expect(nhanTrangThaiPhong(ma).nhan).not.toBe(ma);
    }
  });
});

describe("nhanTrangThaiPhieu", () => {
  it("phu cac gia tri cua PHIEU_DAT_PHONG", () => {
    expect(nhanTrangThaiPhieu("DaDat").nhan).toBe("Đã đặt");
    expect(nhanTrangThaiPhieu("DangO").nhan).toBe("Đang ở");
    expect(nhanTrangThaiPhieu("HoanTat").nhan).toBe("Hoàn tất");
    expect(nhanTrangThaiPhieu("DaHuy").nhan).toBe("Đã hủy");
  });
});

describe("nhanTrangThaiHoaDon", () => {
  it("phu cac gia tri cua HOA_DON", () => {
    expect(nhanTrangThaiHoaDon("ChuaThanhToan").nhan).toBe("Chưa thanh toán");
    expect(nhanTrangThaiHoaDon("DaThanhToan").nhan).toBe("Đã thanh toán");
  });
});
```

- [x] **Step 2: Chạy test, xác nhận thất bại**

Run: `npm test -- src/lib/status.test.ts`
Expected: FAIL — không tìm thấy module `@/lib/status`.

- [x] **Step 3: Viết `src/lib/status.ts`**

```ts
export type KieuTrangThai = { nhan: string; fg: string; bg: string; dot: string };

/** 5 gia tri cua rang buoc CK_PHONG_TrangThai. */
export const TRANG_THAI_PHONG = [
  "Trong", "DaDat", "DangSuDung", "DangDon", "BaoTri",
] as const;

// Bang mau lay dung tu design/README.md, muc "Mau trang thai phong".
const PHONG: Record<string, KieuTrangThai> = {
  Trong:      { nhan: "Trống",        fg: "#14664B", bg: "#E3F0E9", dot: "#1B8A6A" },
  DaDat:      { nhan: "Đã đặt",       fg: "#2A5480", bg: "#E6EDF6", dot: "#4A72C0" },
  DangSuDung: { nhan: "Đang sử dụng", fg: "#8A5A0E", bg: "#F7EFDD", dot: "#B57C10" },
  DangDon:    { nhan: "Đang dọn",     fg: "#5B4B85", bg: "#ECE9F5", dot: "#7561A8" },
  BaoTri:     { nhan: "Bảo trì",      fg: "#8C3A31", bg: "#F8E8E5", dot: "#B04A3E" },
};

const PHIEU: Record<string, KieuTrangThai> = {
  DaDat:   { nhan: "Đã đặt",   fg: "#2A5480", bg: "#E6EDF6", dot: "#4A72C0" },
  DangO:   { nhan: "Đang ở",   fg: "#8A5A0E", bg: "#F7EFDD", dot: "#B57C10" },
  HoanTat: { nhan: "Hoàn tất", fg: "#14664B", bg: "#E3F0E9", dot: "#1B8A6A" },
  DaHuy:   { nhan: "Đã hủy",   fg: "#8C3A31", bg: "#F8E8E5", dot: "#B04A3E" },
};

const HOA_DON: Record<string, KieuTrangThai> = {
  ChuaThanhToan: { nhan: "Chưa thanh toán", fg: "#8A5A0E", bg: "#F7EFDD", dot: "#B57C10" },
  DaThanhToan:   { nhan: "Đã thanh toán",   fg: "#14664B", bg: "#E3F0E9", dot: "#1B8A6A" },
  DaHuy:         { nhan: "Đã hủy",          fg: "#8C3A31", bg: "#F8E8E5", dot: "#B04A3E" },
};

// Du lieu co the chua gia tri ngoai danh sach (vi du sau nay them trang thai
// moi trong CSDL). Tra ve chinh ma kem mau trung tinh thay vi undefined,
// de trang khong vo.
const DU_PHONG = (ma: string): KieuTrangThai => ({
  nhan: ma, fg: "#57504A", bg: "#F3EFE8", dot: "#7B7269",
});

export const nhanTrangThaiPhong   = (ma: string) => PHONG[ma]   ?? DU_PHONG(ma);
export const nhanTrangThaiPhieu   = (ma: string) => PHIEU[ma]   ?? DU_PHONG(ma);
export const nhanTrangThaiHoaDon  = (ma: string) => HOA_DON[ma] ?? DU_PHONG(ma);
```

- [x] **Step 4: Chạy test, xác nhận đạt**

Run: `npm test -- src/lib/status.test.ts`
Expected: PASS, 5 test.

- [x] **Step 5: Commit**

```bash
git add src/lib/status.ts src/lib/status.test.ts
git commit -m "feat: them lib/status anh xa trang thai sang nhan va mau"
```

---

### Task 3: `lib/tinh-toan.ts` — mô phỏng các function của CSDL

**Files:**
- Create: `src/lib/tinh-toan.ts`
- Test: `src/lib/tinh-toan.test.ts`

**Interfaces:**
- Consumes: không
- Produces:
  - `soDem(checkIn: string, checkOut: string): number` — mô phỏng `fn_SoDem`
  - `tienPhong(donGia: string, soDem: number): string` — mô phỏng `fn_TienPhong`
  - `tienDichVu(giaDv: string, soLuong: number): string` — mô phỏng `fn_TienDichVu`
  - `congTien(...cac: string[]): string`

Ghi chú: tiền vào/ra đều là `string` dạng `DECIMAL(18,2)`. Tính bằng số nguyên **xu** rồi đổi ngược lại, tránh sai số dấu phẩy động khi cộng dồn hóa đơn.

- [x] **Step 1: Viết test thất bại**

```ts
// src/lib/tinh-toan.test.ts
import { describe, expect, it } from "vitest";
import { congTien, soDem, tienDichVu, tienPhong } from "@/lib/tinh-toan";

describe("soDem", () => {
  it("dem so dem giua hai ngay", () => {
    expect(soDem("2026-09-23", "2026-09-26")).toBe(3);
  });
  it("vat qua ranh gioi thang", () => {
    expect(soDem("2026-09-30", "2026-10-02")).toBe(2);
  });

  // Review Focus #1
  it("nem loi khi ngay tra khong sau ngay nhan", () => {
    expect(() => soDem("2026-09-26", "2026-09-23")).toThrow(
      "Ngay tra phong phai sau ngay nhan phong",
    );
    expect(() => soDem("2026-09-23", "2026-09-23")).toThrow(
      "Ngay tra phong phai sau ngay nhan phong",
    );
  });
});

describe("tienPhong", () => {
  it("nhan don gia voi so dem", () => {
    expect(tienPhong("1000000.00", 3)).toBe("3000000.00");
  });
  it("giu dung hai chu so thap phan", () => {
    expect(tienPhong("1150000.50", 2)).toBe("2301001.00");
  });
});

describe("tienDichVu", () => {
  it("nhan don gia dich vu voi so luong", () => {
    expect(tienDichVu("100000.00", 2)).toBe("200000.00");
  });
  it("so luong 0 cho thanh tien 0", () => {
    expect(tienDichVu("100000.00", 0)).toBe("0.00");
  });
});

describe("congTien", () => {
  it("cong khong bi sai so dau phay dong", () => {
    expect(congTien("0.10", "0.20")).toBe("0.30");
  });
  it("cong nhieu khoan muc cua hoa don", () => {
    expect(congTien("3000000.00", "200000.00", "-150000.00")).toBe("3050000.00");
  });
  it("khong doi so nao thi tra 0", () => {
    expect(congTien()).toBe("0.00");
  });
});
```

- [x] **Step 2: Chạy test, xác nhận thất bại**

Run: `npm test -- src/lib/tinh-toan.test.ts`
Expected: FAIL — không tìm thấy module `@/lib/tinh-toan`.

- [x] **Step 3: Viết `src/lib/tinh-toan.ts`**

```ts
/**
 * Mo phong cac function trong Scripts/03b_Functions.sql de man hinh tinh
 * duoc so lieu khi chua noi CSDL. Giai doan sau se goi thang function that,
 * nen chu ky ham o day co y giu giong tham so cua chung.
 *
 * Tien luon o dang chuoi DECIMAL(18,2). Moi phep tinh quy ve so nguyen XU
 * roi doi nguoc, de cong don hoa don khong bi sai so dau phay dong.
 */

const MOT_NGAY = 86_400_000;

/** Doi chuoi DECIMAL(18,2) sang so nguyen xu. */
function sangXu(tien: string): number {
  const [nguyen, thapPhan = ""] = tien.trim().split(".");
  const am = nguyen.startsWith("-");
  const xu = Number(`${nguyen.replace("-", "")}${thapPhan.padEnd(2, "0").slice(0, 2)}`);
  return am ? -xu : xu;
}

/** Doi so nguyen xu nguoc ve chuoi DECIMAL(18,2). */
function sangChuoi(xu: number): string {
  const am = xu < 0;
  const s = String(Math.round(Math.abs(xu))).padStart(3, "0");
  return `${am ? "-" : ""}${s.slice(0, -2)}.${s.slice(-2)}`;
}

/** Mo phong fn_SoDem. Ngay dang 'YYYY-MM-DD'. */
export function soDem(checkIn: string, checkOut: string): number {
  const a = Date.parse(`${checkIn}T00:00:00Z`);
  const b = Date.parse(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) {
    throw new Error("Ngay khong hop le");
  }
  if (b <= a) {
    throw new Error("Ngay tra phong phai sau ngay nhan phong");
  }
  return Math.round((b - a) / MOT_NGAY);
}

/** Mo phong fn_TienPhong: don gia mot dem nhan so dem. */
export function tienPhong(donGia: string, dem: number): string {
  return sangChuoi(sangXu(donGia) * dem);
}

/** Mo phong fn_TienDichVu: don gia dich vu nhan so luong. */
export function tienDichVu(giaDv: string, soLuong: number): string {
  return sangChuoi(sangXu(giaDv) * soLuong);
}

/** Cong nhieu khoan tien. Khoan giam gia truyen vao duoi dang am. */
export function congTien(...cac: string[]): string {
  return sangChuoi(cac.reduce((t, x) => t + sangXu(x), 0));
}
```

- [x] **Step 4: Chạy test, xác nhận đạt**

Run: `npm test -- src/lib/tinh-toan.test.ts`
Expected: PASS, 9 test.

- [x] **Step 5: Commit**

```bash
git add src/lib/tinh-toan.ts src/lib/tinh-toan.test.ts
git commit -m "feat: mo phong fn_SoDem, fn_TienPhong, fn_TienDichVu"
```

---

### Task 4: Dữ liệu giả — `mock/now.ts` và `mock/data.ts`

**Files:**
- Create: `src/lib/mock/now.ts`
- Create: `src/lib/mock/data.ts`
- Test: `src/lib/mock/data.test.ts`

**Interfaces:**
- Consumes: `import type * as schema from "@/db/schema"`
- Produces các mảng, mỗi mảng kiểu `(typeof schema.<bang>.$inferSelect)[]`:
  `LOAI_TAI_KHOAN`, `TAI_KHOAN`, `KHACH_HANG`, `LOAI_PHONG`, `BANG_GIA_PHONG`, `PHONG`, `PHIEU_DAT_PHONG`, `CHI_TIET_DAT_PHONG`, `DON_PHONG`, `SUA_PHONG`, `DICH_VU`, `SU_DUNG_DICH_VU`, `HOA_DON`, `CHI_TIET_HOA_DON`; và `NGAY_HIEN_TAI` từ `now.ts`.

- [x] **Step 1: Viết `src/lib/mock/now.ts`**

```ts
/**
 * Artboard trong design/ lay moc "Thu Tu, 23/09/2026" va du lieu gia cung xoay
 * quanh moc do. Neu dung ngay that cua may thi moi ngay mo len so lieu lai lech
 * va cac phieu dat se thanh qua han. Khi noi CSDL that thi doi thanh new Date().
 */
export const NGAY_HIEN_TAI = "2026-09-23";
```

- [x] **Step 2: Viết test thất bại**

```ts
// src/lib/mock/data.test.ts
import { describe, expect, it } from "vitest";
import * as mock from "@/lib/mock/data";
import { TRANG_THAI_PHONG } from "@/lib/status";
import { NGAY_HIEN_TAI } from "@/lib/mock/now";

const MA = /^[A-Z]{2}\d{8}$/;

describe("du lieu goc tu 02_Sample_Data.sql", () => {
  it("giu du 10 dong goc cua moi bang chinh", () => {
    expect(mock.LOAI_PHONG).toHaveLength(10);
    expect(mock.DICH_VU).toHaveLength(10);
    expect(mock.TAI_KHOAN).toHaveLength(10);
    expect(mock.LOAI_TAI_KHOAN).toHaveLength(10);
  });
  it("giu dung ma va gia cua loai phong goc", () => {
    const lp = mock.LOAI_PHONG.find((x) => x.maLoaiPhong === "LP00000001");
    expect(lp?.tenLoaiPhong).toBe("Standard Single");
    expect(lp?.donGiaNgay).toBe("600000.00");
  });
});

describe("phan don them cho demo", () => {
  it("co du phong de lap day tang 1-4", () => {
    expect(mock.PHONG.length).toBeGreaterThanOrEqual(40);
    expect(new Set(mock.PHONG.map((p) => p.tang))).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  });
  it("co phieu dat nhan phong dung ngay hien tai", () => {
    const nhanHomNay = mock.PHIEU_DAT_PHONG.filter(
      (p) => p.ngayCheckIn === NGAY_HIEN_TAI && p.trangThai === "DaDat",
    );
    expect(nhanHomNay.length).toBeGreaterThanOrEqual(5);
  });
  it("co phieu dang o de tra phong hom nay", () => {
    const dangO = mock.PHIEU_DAT_PHONG.filter((p) => p.trangThai === "DangO");
    expect(dangO.length).toBeGreaterThanOrEqual(5);
  });
});

describe("toan ven du lieu", () => {
  it("moi ma khoa dung dang CHAR(10)", () => {
    for (const p of mock.PHONG) expect(p.maPhong).toMatch(MA);
    for (const k of mock.KHACH_HANG) expect(k.maKh).toMatch(MA);
    for (const d of mock.PHIEU_DAT_PHONG) expect(d.maDatPhong).toMatch(MA);
    for (const h of mock.HOA_DON) expect(h.maHoaDon).toMatch(MA);
  });
  it("khong co ma trung", () => {
    const ma = mock.PHONG.map((p) => p.maPhong);
    expect(new Set(ma).size).toBe(ma.length);
  });
  it("moi phong tro toi mot loai phong co that", () => {
    const loai = new Set(mock.LOAI_PHONG.map((l) => l.maLoaiPhong));
    for (const p of mock.PHONG) expect(loai.has(p.maLoaiPhong)).toBe(true);
  });
  it("moi phieu dat tro toi mot khach hang co that", () => {
    const kh = new Set(mock.KHACH_HANG.map((k) => k.maKh));
    for (const d of mock.PHIEU_DAT_PHONG) expect(kh.has(d.maKh)).toBe(true);
  });
  it("moi hoa don tro toi mot phieu dat co that", () => {
    const dp = new Set(mock.PHIEU_DAT_PHONG.map((d) => d.maDatPhong));
    for (const h of mock.HOA_DON) expect(dp.has(h.maDatPhong)).toBe(true);
  });
  it("trang thai phong chi nhan 5 gia tri cua rang buoc CHECK", () => {
    for (const p of mock.PHONG) {
      expect(TRANG_THAI_PHONG).toContain(p.trangThai);
    }
  });
  it("tien luon la chuoi hai chu so thap phan", () => {
    for (const l of mock.LOAI_PHONG) expect(l.donGiaNgay).toMatch(/^\d+\.\d{2}$/);
    for (const d of mock.DICH_VU) expect(d.giaDv).toMatch(/^\d+\.\d{2}$/);
  });
});
```

- [x] **Step 3: Chạy test, xác nhận thất bại**

Run: `npm test -- src/lib/mock/data.test.ts`
Expected: FAIL — không tìm thấy module `@/lib/mock/data`.

- [x] **Step 4: Viết `src/lib/mock/data.ts`**

Cách làm, theo đúng thứ tự:

1. Mở `../Scripts/02_Sample_Data.sql`. Chép **nguyên văn** 10 dòng của mỗi bảng sang dạng object TypeScript, đặt dưới chú thích `// ---- TU 02_Sample_Data.sql ----`.
2. Tên trường lấy theo `src/db/schema.ts` (camelCase: `maPhong`, `soPhong`, `tang`, `maLoaiPhong`, `trangThai`, `donGiaNgay`, `maKh`, `hoTen`, `cccd`, `sdt`, `email`, `maDatPhong`, `ngayCheckIn`, `ngayCheckOut`, `maDv`, `tenDv`, `donViTinh`, `giaDv`, `maHoaDon`, `ngayLap`, `tongTien`…). Kiểm lại bằng cách mở `src/db/schema.ts`.
3. Bên dưới, thêm chú thích `// ---- DON THEM CHO DEMO ----` và sinh phần độn:
   - **Phòng**: thêm từ `PH00000011` cho tới khi đủ ≥ 40 phòng. Số phòng theo quy tắc `<tầng><2 chữ số>`: tầng 1 → `101`…`110`, tầng 2 → `201`…`210`, tầng 3 → `301`…`310`, tầng 4 → `401`…`410`. `maLoaiPhong` xoay vòng trong 10 loại sẵn có. `trangThai` rải đều 5 giá trị sao cho có khoảng 24 phòng `DangSuDung`, 3 `DangDon`, 2 `BaoTri`, còn lại `Trong`/`DaDat`.
   - **Khách hàng**: thêm từ `KH00000011` đến `KH00000060`. `hoTen` là tên tiếng Việt có dấu, `cccd` 12 chữ số **duy nhất**, `sdt` dạng `09xxxxxxxx`, `email` duy nhất.
   - **Phiếu đặt phòng**: thêm từ `DP00000011`. Cần ít nhất 12 phiếu `trangThai: "DaDat"` với `ngayCheckIn: "2026-09-23"` (lượt nhận hôm nay) và ít nhất 9 phiếu `trangThai: "DangO"` với `ngayCheckOut: "2026-09-23"` (lượt trả hôm nay), cộng thêm phiếu `HoanTat` rải từ tháng 10/2025 đến 09/2026 để màn Báo cáo có 12 tháng dữ liệu.
   - **Chi tiết đặt phòng**: mỗi phiếu ít nhất một dòng, `giaThueThoiDiem` lấy `donGiaNgay` của loại phòng, `soDem` tính bằng `soDem()` ở Task 3, `thanhTien` = `tienPhong(...)`.
   - **Hóa đơn + chi tiết hóa đơn**: mỗi phiếu `HoanTat` một hóa đơn `DaThanhToan`; phiếu `DangO` đang trả hôm nay thì một hóa đơn `ChuaThanhToan`. `LoaiKhoanMuc` chỉ dùng các giá trị của ràng buộc `CK_CHI_TIET_HOA_DON_LoaiKhoanMuc`: `TienPhong`, `DichVu`, `PhuThu`, `GiamGia`, `GiamTru`, `TongHop`. Nhớ ràng buộc `CK_CHI_TIET_HOA_DON_SoTienTheoLoai`: `GiamGia`/`GiamTru` phải **âm**, các loại còn lại phải **≥ 0**.
   - **Dọn phòng / sửa phòng**: đủ dòng cho bảng nhật ký màn Sơ đồ phòng (≥ 8 dòng, có `NgayGio` quanh 23/09/2026).
   - **Sử dụng dịch vụ**: gắn vào các phiếu `DangO`, để màn Dịch vụ và Hóa đơn có dòng.
4. Hai cột **sinh tự động** (`generatedAlwaysAs`) vẫn nằm trong `$inferSelect` với kiểu `string | null`, nên phải có mặt trong dữ liệu giả: `CHI_TIET_DAT_PHONG.thanhTien` và `SU_DUNG_DICH_VU.thanhTien`. Điền bằng kết quả của `tienPhong()` / `tienDichVu()`.
5. Mỗi mảng khai báo kiểu tường minh, ví dụ:

```ts
import type * as schema from "@/db/schema";

type Phong = typeof schema.phong.$inferSelect;

export const PHONG: Phong[] = [
  // ---- TU 02_Sample_Data.sql ----
  { maPhong: "PH00000001", soPhong: "101", tang: 1, maLoaiPhong: "LP00000001", trangThai: "Trong" },
  // ... 9 dong goc con lai
  // ---- DON THEM CHO DEMO ----
  { maPhong: "PH00000011", soPhong: "102", tang: 1, maLoaiPhong: "LP00000002", trangThai: "DangSuDung" },
  // ...
];
```

- [x] **Step 5: Chạy test, xác nhận đạt**

Run: `npm test -- src/lib/mock/data.test.ts`
Expected: PASS, 12 test. Sửa dữ liệu cho tới khi mọi ràng buộc toàn vẹn đều đạt.

- [x] **Step 6: Kiểm TypeScript**

Run: `npx tsc --noEmit`
Expected: không lỗi. Nếu báo sai tên trường thì sửa theo `src/db/schema.ts`, **không** sửa `schema.ts`.

- [x] **Step 7: Commit**

```bash
git add src/lib/mock/
git commit -m "feat: du lieu gia mo phong bang that, tach dong goc va dong don them"
```

---

### Task 5: `queries/rooms.ts` — sơ đồ phòng và thống kê

**Files:**
- Create: `src/lib/queries/rooms.ts`
- Test: `src/lib/queries/rooms.test.ts`

**Interfaces:**
- Consumes: `@/lib/mock/data`, `@/lib/status`
- Produces:
  - `type PhongTrenSoDo = { maPhong: string; soPhong: string; tang: number; tenLoaiPhong: string; donGiaNgay: string; trangThai: string }`
  - `getSoDoPhong(): Promise<PhongTrenSoDo[]>`
  - `getThongKePhongTheoTrangThai(): Promise<{ ma: string; nhan: string; soLuong: number }[]>`
  - `getNhatKyBuongPhong(): Promise<{ ngayGio: string; soPhong: string; loai: "DonPhong" | "SuaPhong"; nhanVien: string; ghiChu: string; chiPhi: string | null }[]>`

- [x] **Step 1: Viết test thất bại**

```ts
// src/lib/queries/rooms.test.ts
import { describe, expect, it } from "vitest";
import * as mock from "@/lib/mock/data";
import { TRANG_THAI_PHONG } from "@/lib/status";
import {
  getNhatKyBuongPhong,
  getSoDoPhong,
  getThongKePhongTheoTrangThai,
} from "@/lib/queries/rooms";

describe("getSoDoPhong", () => {
  it("tra du moi phong kem ten loai phong da noi bang", async () => {
    const ds = await getSoDoPhong();
    expect(ds).toHaveLength(mock.PHONG.length);
    expect(ds[0].tenLoaiPhong).toBeTruthy();
    expect(ds[0].donGiaNgay).toMatch(/^\d+\.\d{2}$/);
  });
  it("sap xep theo so phong tang dan", async () => {
    const ds = await getSoDoPhong();
    const so = ds.map((p) => p.soPhong);
    expect(so).toEqual([...so].sort());
  });
});

describe("getThongKePhongTheoTrangThai", () => {
  it("dem du 5 trang thai, ke ca trang thai khong co phong nao", async () => {
    const tk = await getThongKePhongTheoTrangThai();
    expect(tk.map((t) => t.ma)).toEqual([...TRANG_THAI_PHONG]);
  });
  it("tong so luong bang tong so phong", async () => {
    const tk = await getThongKePhongTheoTrangThai();
    const tong = tk.reduce((s, t) => s + t.soLuong, 0);
    expect(tong).toBe(mock.PHONG.length);
  });

  // Review Focus #3 — man hinh phai xu ly duoc truong hop dem ra 0
  it("trang thai khong co phong nao van tra ve dong voi soLuong 0", async () => {
    const tk = await getThongKePhongTheoTrangThai();
    for (const t of tk) expect(t.soLuong).toBeGreaterThanOrEqual(0);
    expect(tk).toHaveLength(5);
  });
});

describe("getNhatKyBuongPhong", () => {
  it("gop don phong va sua phong, moi nhat len dau", async () => {
    const nk = await getNhatKyBuongPhong();
    expect(nk.length).toBeGreaterThan(0);
    const gio = nk.map((n) => n.ngayGio);
    expect(gio).toEqual([...gio].sort().reverse());
    expect(new Set(nk.map((n) => n.loai))).toEqual(new Set(["DonPhong", "SuaPhong"]));
  });
});
```

- [x] **Step 2: Chạy test, xác nhận thất bại**

Run: `npm test -- src/lib/queries/rooms.test.ts`
Expected: FAIL — không tìm thấy module `@/lib/queries/rooms`.

- [x] **Step 3: Viết `src/lib/queries/rooms.ts`**

```ts
import * as mock from "@/lib/mock/data";
import { TRANG_THAI_PHONG, nhanTrangThaiPhong } from "@/lib/status";

/**
 * Mat tien doc du lieu phong. Hom nay doc tu du lieu gia; giai doan sau doi
 * than ham sang Drizzle (v_TinhTrangPhongHomNay) ma khong doi chu ky.
 * Vi vay moi ham deu async du hien tai khong cho gi.
 */

export type PhongTrenSoDo = {
  maPhong: string;
  soPhong: string;
  tang: number;
  tenLoaiPhong: string;
  donGiaNgay: string;
  trangThai: string;
};

export async function getSoDoPhong(): Promise<PhongTrenSoDo[]> {
  const loai = new Map(mock.LOAI_PHONG.map((l) => [l.maLoaiPhong, l]));
  return mock.PHONG
    .map((p) => ({
      maPhong: p.maPhong,
      soPhong: p.soPhong,
      tang: p.tang,
      tenLoaiPhong: loai.get(p.maLoaiPhong)?.tenLoaiPhong ?? "—",
      donGiaNgay: loai.get(p.maLoaiPhong)?.donGiaNgay ?? "0.00",
      trangThai: p.trangThai,
    }))
    .sort((a, b) => a.soPhong.localeCompare(b.soPhong));
}

export async function getThongKePhongTheoTrangThai() {
  // Duyet theo TRANG_THAI_PHONG chu khong theo du lieu, de trang thai khong co
  // phong nao van hien mot chip voi so 0 dung nhu artboard.
  return TRANG_THAI_PHONG.map((ma) => ({
    ma,
    nhan: nhanTrangThaiPhong(ma).nhan,
    soLuong: mock.PHONG.filter((p) => p.trangThai === ma).length,
  }));
}

export async function getNhatKyBuongPhong() {
  const soPhong = new Map(mock.PHONG.map((p) => [p.maPhong, p.soPhong]));
  // DON_PHONG va SUA_PHONG cung dung cot ThoiGian; SUA_PHONG co MoTaLoi va
  // ChiPhi (NOT NULL, mac dinh '0.00'), DON_PHONG co GhiChu va khong co chi phi.
  const don = mock.DON_PHONG.map((d) => ({
    ngayGio: d.thoiGian,
    soPhong: soPhong.get(d.maPhong) ?? "—",
    loai: "DonPhong" as const,
    nhanVien: d.maTk,
    ghiChu: d.ghiChu ?? "",
    chiPhi: null as string | null,
  }));
  const sua = mock.SUA_PHONG.map((x) => ({
    ngayGio: x.thoiGian,
    soPhong: soPhong.get(x.maPhong) ?? "—",
    loai: "SuaPhong" as const,
    nhanVien: x.maTk,
    ghiChu: x.moTaLoi ?? "",
    chiPhi: x.chiPhi as string | null,
  }));
  return [...don, ...sua].sort((a, b) => b.ngayGio.localeCompare(a.ngayGio));
}
```

Tên trường đã đối chiếu `src/db/schema.ts`: `donPhong` có `maDon, maPhong, maTk, thoiGian, ghiChu`; `suaPhong` có `maSua, maPhong, maTk, thoiGian, chiPhi, moTaLoi`. `ngayGio` chỉ là tên trường của view-model trả ra, không phải tên cột.

- [x] **Step 4: Chạy test, xác nhận đạt**

Run: `npm test -- src/lib/queries/rooms.test.ts`
Expected: PASS, 6 test.

- [x] **Step 5: Commit**

```bash
git add src/lib/queries/rooms.ts src/lib/queries/rooms.test.ts
git commit -m "feat: mat tien queries/rooms"
```

---

### Task 6: `queries/accounts.ts` — đăng nhập giả

**Files:**
- Create: `src/lib/queries/accounts.ts`
- Test: `src/lib/queries/accounts.test.ts`

**Interfaces:**
- Consumes: `@/lib/mock/data`
- Produces:
  - `type PhienDangNhap = { maTk: string; tenDangNhap: string; hoTen: string; maLoaiTk: string; vaiTro: string }`
  - `dangNhapGia(tenDangNhap: string, matKhau: string): Promise<PhienDangNhap>` — ném `Error` khi sai
  - `NHAN_VIEN_MAC_DINH: PhienDangNhap`

Mật khẩu để **dạng thô** vì đây là dữ liệu giả — chưa có SHA2, chưa có phiên thật.

- [x] **Step 1: Viết test thất bại**

```ts
// src/lib/queries/accounts.test.ts
import { describe, expect, it } from "vitest";
import { NHAN_VIEN_MAC_DINH, dangNhapGia } from "@/lib/queries/accounts";

describe("dangNhapGia", () => {
  it("dang nhap dung thi tra thong tin phien", async () => {
    const p = await dangNhapGia("admin", "Admin@123");
    expect(p.maTk).toBe("TK00000001");
    expect(p.vaiTro).toBe("Quan tri vien");
  });

  it("le tan dang nhap duoc", async () => {
    const p = await dangNhapGia("letan.lan", "LeTan@123");
    expect(p.hoTen).toBe("Tran Ngoc Lan");
  });

  it("sai mat khau thi bao loi giong sp_DangNhap", async () => {
    await expect(dangNhapGia("admin", "sai")).rejects.toThrow(
      "Tên đăng nhập hoặc mật khẩu không đúng",
    );
  });

  it("khong co tai khoan thi bao cung mot loi, khong lo tai khoan nao ton tai", async () => {
    await expect(dangNhapGia("khongcoai", "gi do")).rejects.toThrow(
      "Tên đăng nhập hoặc mật khẩu không đúng",
    );
  });

  // Review Focus #5
  it("tai khoan TamNghi bi tu choi du mat khau dung", async () => {
    await expect(dangNhapGia("kythuat.son", "KyThuat@456")).rejects.toThrow(
      "Tài khoản đang ở trạng thái TamNghi, không thể đăng nhập",
    );
  });

  it("tai khoan NghiViec bi tu choi du mat khau dung", async () => {
    await expect(dangNhapGia("cskh.uyen", "CSKH@123")).rejects.toThrow(
      "Tài khoản đang ở trạng thái NghiViec, không thể đăng nhập",
    );
  });
});

describe("NHAN_VIEN_MAC_DINH", () => {
  it("dung nhan vien nhu artboard ve tren sidebar", () => {
    expect(NHAN_VIEN_MAC_DINH.hoTen).toBeTruthy();
    expect(NHAN_VIEN_MAC_DINH.vaiTro).toBeTruthy();
  });
});
```

Ghi chú: mật khẩu thô của `kythuat.son` và `cskh.uyen` phải lấy đúng từ `Scripts/02_Sample_Data.sql` (đối số của `SHA2(...)`), không được đoán.

- [x] **Step 2: Chạy test, xác nhận thất bại**

Run: `npm test -- src/lib/queries/accounts.test.ts`
Expected: FAIL — không tìm thấy module.

- [x] **Step 3: Viết `src/lib/queries/accounts.ts`**

```ts
import * as mock from "@/lib/mock/data";

/**
 * Mo phong sp_DangNhap bang du lieu gia. Mat khau de dang THO vi day la du
 * lieu gia; sp_DangNhap that so bang SHA2(?, 256). Giai doan sau thay than
 * ham nay bang callProcedure('sp_DangNhap', [...]).
 */

export type PhienDangNhap = {
  maTk: string;
  tenDangNhap: string;
  hoTen: string;
  maLoaiTk: string;
  vaiTro: string;
};

// Mat khau tho tuong ung voi SHA2(...) trong Scripts/02_Sample_Data.sql.
const MAT_KHAU: Record<string, string> = {
  admin: "Admin@123",
  "letan.lan": "LeTan@123",
  // ... chep not tu 02_Sample_Data.sql
};

export async function dangNhapGia(
  tenDangNhap: string,
  matKhau: string,
): Promise<PhienDangNhap> {
  const tk = mock.TAI_KHOAN.find((t) => t.tenDangNhap === tenDangNhap);

  // Sai tai khoan va sai mat khau tra cung mot thong bao, giong sp_DangNhap,
  // de khong lo tai khoan nao co that.
  if (!tk || MAT_KHAU[tenDangNhap] !== matKhau) {
    throw new Error("Tên đăng nhập hoặc mật khẩu không đúng");
  }

  if (tk.trangThai !== "DangLamViec") {
    throw new Error(
      `Tài khoản đang ở trạng thái ${tk.trangThai}, không thể đăng nhập`,
    );
  }

  const loai = mock.LOAI_TAI_KHOAN.find((l) => l.maLoaiTk === tk.maLoaiTk);
  return {
    maTk: tk.maTk,
    tenDangNhap: tk.tenDangNhap,
    hoTen: tk.hoTen,
    maLoaiTk: tk.maLoaiTk,
    vaiTro: loai?.tenLoaiTk ?? "—",
  };
}

/** Nhan vien hien tren sidebar khi chua co phien dang nhap that. */
export const NHAN_VIEN_MAC_DINH: PhienDangNhap = {
  maTk: "TK00000002",
  tenDangNhap: "letan.lan",
  hoTen: "Trần Ngọc Lan",
  maLoaiTk: "LTK0000002",
  vaiTro: "Lễ tân",
};
```

- [x] **Step 4: Chạy test, xác nhận đạt**

Run: `npm test -- src/lib/queries/accounts.test.ts`
Expected: PASS, 7 test.

- [x] **Step 5: Commit**

```bash
git add src/lib/queries/accounts.ts src/lib/queries/accounts.test.ts
git commit -m "feat: mo phong sp_DangNhap bang du lieu gia"
```

---

### Task 7: `queries/bookings.ts` — phiếu đặt phòng

**Files:**
- Create: `src/lib/queries/bookings.ts`
- Test: `src/lib/queries/bookings.test.ts`

**Interfaces:**
- Consumes: `@/lib/mock/data`, `@/lib/mock/now`, `@/lib/tinh-toan`
- Produces:
  - `type PhieuTomTat = { maDatPhong: string; maKh: string; hoTenKhach: string; cccd: string; sdt: string | null; ngayCheckIn: string; ngayCheckOut: string; soDem: number; trangThai: string; tienCoc: string; soPhong: string[]; tenLoaiPhong: string; tongTienPhong: string }`
  - `getPhieuNhanHomNay(): Promise<PhieuTomTat[]>`
  - `getPhieuTraHomNay(): Promise<PhieuTomTat[]>`
  - `getPhieuTheoMa(ma: string): Promise<PhieuTomTat | null>`
  - `getLoaiPhongConTrong(checkIn: string, checkOut: string): Promise<{ maLoaiPhong: string; tenLoaiPhong: string; donGiaNgay: string; soPhongTrong: number }[]>`

- [x] **Step 1: Viết test thất bại**

```ts
// src/lib/queries/bookings.test.ts
import { describe, expect, it } from "vitest";
import { NGAY_HIEN_TAI } from "@/lib/mock/now";
import {
  getLoaiPhongConTrong,
  getPhieuNhanHomNay,
  getPhieuTheoMa,
  getPhieuTraHomNay,
} from "@/lib/queries/bookings";

describe("getPhieuNhanHomNay", () => {
  it("chi tra phieu DaDat co ngay nhan dung hom nay", async () => {
    const ds = await getPhieuNhanHomNay();
    expect(ds.length).toBeGreaterThanOrEqual(5);
    for (const p of ds) {
      expect(p.ngayCheckIn).toBe(NGAY_HIEN_TAI);
      expect(p.trangThai).toBe("DaDat");
    }
  });
  it("kem ten khach va so dem da tinh san", async () => {
    const [p] = await getPhieuNhanHomNay();
    expect(p.hoTenKhach).toBeTruthy();
    expect(p.soDem).toBeGreaterThan(0);
    expect(p.soPhong.length).toBeGreaterThan(0);
  });
});

describe("getPhieuTraHomNay", () => {
  it("chi tra phieu DangO co ngay tra dung hom nay", async () => {
    const ds = await getPhieuTraHomNay();
    expect(ds.length).toBeGreaterThanOrEqual(5);
    for (const p of ds) {
      expect(p.ngayCheckOut).toBe(NGAY_HIEN_TAI);
      expect(p.trangThai).toBe("DangO");
    }
  });
});

describe("getPhieuTheoMa", () => {
  it("tra dung phieu khi ma co that", async () => {
    const [mau] = await getPhieuNhanHomNay();
    const p = await getPhieuTheoMa(mau.maDatPhong);
    expect(p?.maDatPhong).toBe(mau.maDatPhong);
  });
  it("tra null khi ma khong ton tai, khong nem loi", async () => {
    await expect(getPhieuTheoMa("DP99999999")).resolves.toBeNull();
  });
});

describe("getLoaiPhongConTrong", () => {
  it("tra moi loai phong kem so phong con trong", async () => {
    const ds = await getLoaiPhongConTrong("2026-10-01", "2026-10-03");
    expect(ds).toHaveLength(10);
    for (const l of ds) expect(l.soPhongTrong).toBeGreaterThanOrEqual(0);
  });
  it("nem loi khi ngay tra khong sau ngay nhan", async () => {
    await expect(getLoaiPhongConTrong("2026-10-03", "2026-10-01")).rejects.toThrow(
      "Ngay tra phong phai sau ngay nhan phong",
    );
  });
});
```

- [x] **Step 2: Chạy test, xác nhận thất bại**

Run: `npm test -- src/lib/queries/bookings.test.ts`
Expected: FAIL — không tìm thấy module.

- [x] **Step 3: Viết `src/lib/queries/bookings.ts`**

```ts
import * as mock from "@/lib/mock/data";
import { NGAY_HIEN_TAI } from "@/lib/mock/now";
import { congTien, soDem } from "@/lib/tinh-toan";

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

/** Noi mot phieu dat voi khach, chi tiet dat phong, phong va loai phong. */
function dungPhieu(p: (typeof mock.PHIEU_DAT_PHONG)[number]): PhieuTomTat {
  const khach = mock.KHACH_HANG.find((k) => k.maKh === p.maKh);
  const chiTiet = mock.CHI_TIET_DAT_PHONG.filter((c) => c.maDatPhong === p.maDatPhong);
  const phong = chiTiet.map((c) => mock.PHONG.find((x) => x.maPhong === c.maPhong));
  const loai = mock.LOAI_PHONG.find((l) => l.maLoaiPhong === phong[0]?.maLoaiPhong);

  return {
    maDatPhong: p.maDatPhong,
    maKh: p.maKh,
    hoTenKhach: khach?.hoTen ?? "—",
    cccd: khach?.cccd ?? "",
    sdt: khach?.sdt ?? null,
    ngayCheckIn: p.ngayCheckIn,
    ngayCheckOut: p.ngayCheckOut,
    soDem: soDem(p.ngayCheckIn, p.ngayCheckOut),
    trangThai: p.trangThai,
    tienCoc: p.tienCoc,
    soPhong: phong.map((x) => x?.soPhong ?? "—"),
    tenLoaiPhong: loai?.tenLoaiPhong ?? "—",
    // thanhTien la cot sinh (generatedAlwaysAs) nen kieu la string | null.
    tongTienPhong: congTien(...chiTiet.map((c) => c.thanhTien ?? "0.00")),
  };
}

export async function getPhieuNhanHomNay(): Promise<PhieuTomTat[]> {
  return mock.PHIEU_DAT_PHONG
    .filter((p) => p.ngayCheckIn === NGAY_HIEN_TAI && p.trangThai === "DaDat")
    .map(dungPhieu);
}

export async function getPhieuTraHomNay(): Promise<PhieuTomTat[]> {
  return mock.PHIEU_DAT_PHONG
    .filter((p) => p.ngayCheckOut === NGAY_HIEN_TAI && p.trangThai === "DangO")
    .map(dungPhieu);
}

export async function getPhieuTheoMa(ma: string): Promise<PhieuTomTat | null> {
  const p = mock.PHIEU_DAT_PHONG.find((x) => x.maDatPhong === ma);
  return p ? dungPhieu(p) : null;
}

export async function getLoaiPhongConTrong(checkIn: string, checkOut: string) {
  // Goi soDem TRUOC de loi ngay sai noi len dung thong bao cua fn_SoDem,
  // thay vi tra ve danh sach rong mot cach am tham.
  soDem(checkIn, checkOut);

  // Vi tu kha dung giong sp_TraCuuPhongTrong: mot phong bi chiem neu thuoc mot
  // phieu chua huy co khoang ngay giao voi [checkIn, checkOut).
  const biChiem = new Set(
    mock.PHIEU_DAT_PHONG
      .filter(
        (p) =>
          p.trangThai !== "DaHuy" &&
          p.ngayCheckIn < checkOut &&
          p.ngayCheckOut > checkIn,
      )
      .flatMap((p) =>
        mock.CHI_TIET_DAT_PHONG
          .filter((c) => c.maDatPhong === p.maDatPhong)
          .map((c) => c.maPhong),
      ),
  );

  return mock.LOAI_PHONG.map((l) => ({
    maLoaiPhong: l.maLoaiPhong,
    tenLoaiPhong: l.tenLoaiPhong,
    donGiaNgay: l.donGiaNgay,
    soPhongTrong: mock.PHONG.filter(
      (p) =>
        p.maLoaiPhong === l.maLoaiPhong &&
        p.trangThai !== "BaoTri" &&
        !biChiem.has(p.maPhong),
    ).length,
  }));
}
```

- [x] **Step 4: Chạy test, xác nhận đạt**

Run: `npm test -- src/lib/queries/bookings.test.ts`
Expected: PASS, 7 test.

- [x] **Step 5: Commit**

```bash
git add src/lib/queries/bookings.ts src/lib/queries/bookings.test.ts
git commit -m "feat: mat tien queries/bookings"
```

---

### Task 8: `queries/` còn lại — customers, services, invoices, reports

**Files:**
- Create: `src/lib/queries/customers.ts`, `src/lib/queries/services.ts`, `src/lib/queries/invoices.ts`, `src/lib/queries/reports.ts`
- Test: `src/lib/queries/customers.test.ts`, `src/lib/queries/invoices.test.ts`, `src/lib/queries/reports.test.ts`

**Interfaces:**
- Produces:
  - `getDanhSachKhachHang(): Promise<KhachHangTrenBang[]>` với `type KhachHangTrenBang = { maKh: string; hoTen: string; cccd: string; sdt: string | null; email: string | null; soLanLuuTru: number; tongChiTieu: string; dangLuuTru: boolean; conNo: boolean }`
  - `getThongKeKhachHang(): Promise<{ tongHoSo: number; khachMoiThangNay: number; dangLuuTru: number; tyLeQuayLai: number }>`
  - `getDanhMucDichVu(): Promise<(typeof schema.dichVu.$inferSelect)[]>`
  - `getSuDungDichVuTheoPhieu(maDatPhong: string): Promise<{ maDv: string; tenDv: string; donViTinh: string | null; giaDv: string; soLuong: number; thanhTien: string }[]>`
  - `getHoaDon(ma: string): Promise<HoaDonDayDu | null>` với `type HoaDonDayDu = { maHoaDon: string; maDatPhong: string; ngayLap: string; trangThai: string; tongTien: string; khach: { hoTen: string; maKh: string; cccd: string; sdt: string | null }; phieu: { ngayCheckIn: string; ngayCheckOut: string; soDem: number; soPhong: string[]; tenLoaiPhong: string }; khoanMuc: { loaiKhoanMuc: string; ghiChu: string | null; soTien: string }[] }`
  - `getDoanhThuTheoThang(): Promise<{ thang: string; tienPhong: string; dichVu: string; phuThu: string; tong: string }[]>`
  - `getChiSoTongQuan(): Promise<{ congSuat: number; khachLuuTru: number; doanhThuHomNay: string; soNhanHomNay: number; soTraHomNay: number; hoaDonChuaThanhToan: number }>`

- [x] **Step 1: Viết test thất bại cho customers**

```ts
// src/lib/queries/customers.test.ts
import { describe, expect, it } from "vitest";
import { getDanhSachKhachHang, getThongKeKhachHang } from "@/lib/queries/customers";

describe("getDanhSachKhachHang", () => {
  it("tinh so lan luu tru va tong chi tieu tu bang khac", async () => {
    const ds = await getDanhSachKhachHang();
    expect(ds.length).toBeGreaterThanOrEqual(10);
    for (const k of ds) {
      expect(k.soLanLuuTru).toBeGreaterThanOrEqual(0);
      expect(k.tongChiTieu).toMatch(/^-?\d+\.\d{2}$/);
    }
  });
  it("khach chua tung dat phong thi so lan 0 va chi tieu 0.00", async () => {
    const ds = await getDanhSachKhachHang();
    const chuaDat = ds.filter((k) => k.soLanLuuTru === 0);
    for (const k of chuaDat) expect(k.tongChiTieu).toBe("0.00");
  });
  it("co it nhat mot khach dang luu tru", async () => {
    const ds = await getDanhSachKhachHang();
    expect(ds.some((k) => k.dangLuuTru)).toBe(true);
  });
});

describe("getThongKeKhachHang", () => {
  it("tong ho so bang so dong trong danh sach", async () => {
    const [tk, ds] = await Promise.all([getThongKeKhachHang(), getDanhSachKhachHang()]);
    expect(tk.tongHoSo).toBe(ds.length);
    expect(tk.tyLeQuayLai).toBeGreaterThanOrEqual(0);
    expect(tk.tyLeQuayLai).toBeLessThanOrEqual(100);
  });
});
```

- [x] **Step 2: Viết test thất bại cho invoices**

```ts
// src/lib/queries/invoices.test.ts
import { describe, expect, it } from "vitest";
import * as mock from "@/lib/mock/data";
import { congTien } from "@/lib/tinh-toan";
import { getHoaDon } from "@/lib/queries/invoices";

describe("getHoaDon", () => {
  it("tra hoa don kem khach, phieu va khoan muc", async () => {
    const ma = mock.HOA_DON[0].maHoaDon;
    const hd = await getHoaDon(ma);
    expect(hd?.maHoaDon).toBe(ma);
    expect(hd?.khach.hoTen).toBeTruthy();
    expect(hd?.phieu.soDem).toBeGreaterThan(0);
    expect(hd?.khoanMuc.length).toBeGreaterThan(0);
  });

  it("tong cac khoan muc bang tong tien cua hoa don", async () => {
    for (const goc of mock.HOA_DON) {
      const hd = await getHoaDon(goc.maHoaDon);
      const tong = congTien(...hd!.khoanMuc.map((k) => k.soTien));
      expect(tong).toBe(hd!.tongTien);
    }
  });

  // Review Focus #4
  it("tra null khi ma hoa don khong ton tai", async () => {
    await expect(getHoaDon("HD99999999")).resolves.toBeNull();
  });
});
```

- [x] **Step 3: Viết test thất bại cho reports**

```ts
// src/lib/queries/reports.test.ts
import { describe, expect, it } from "vitest";
import { congTien } from "@/lib/tinh-toan";
import { getChiSoTongQuan, getDoanhThuTheoThang } from "@/lib/queries/reports";

describe("getDoanhThuTheoThang", () => {
  it("tra dung 12 thang, cu nhat truoc", async () => {
    const ds = await getDoanhThuTheoThang();
    expect(ds).toHaveLength(12);
    const thang = ds.map((d) => d.thang);
    expect(thang).toEqual([...thang].sort());
  });
  it("tong bang tong ba cot thanh phan", async () => {
    for (const d of await getDoanhThuTheoThang()) {
      expect(congTien(d.tienPhong, d.dichVu, d.phuThu)).toBe(d.tong);
    }
  });
});

describe("getChiSoTongQuan", () => {
  it("cong suat nam trong khoang 0-100", async () => {
    const cs = await getChiSoTongQuan();
    expect(cs.congSuat).toBeGreaterThanOrEqual(0);
    expect(cs.congSuat).toBeLessThanOrEqual(100);
  });
  it("so luot nhan va tra khop voi queries/bookings", async () => {
    const cs = await getChiSoTongQuan();
    expect(cs.soNhanHomNay).toBeGreaterThan(0);
    expect(cs.soTraHomNay).toBeGreaterThan(0);
  });
});
```

- [x] **Step 4: Chạy 3 test, xác nhận thất bại**

Run: `npm test -- src/lib/queries/`
Expected: FAIL — thiếu 4 module.

- [x] **Step 5: Viết 4 file `queries/`**

Theo đúng mẫu của `queries/rooms.ts`: nối bảng bằng `Map`, mọi phép cộng tiền dùng `congTien()`, mọi phép nhân dùng `tienPhong()` / `tienDichVu()`. `getDoanhThuTheoThang()` gom `CHI_TIET_HOA_DON` theo `YYYY-MM` của `HOA_DON.ngayLap`, tách ba cột theo `LoaiKhoanMuc` (`TienPhong` → `tienPhong`, `DichVu` → `dichVu`, phần còn lại → `phuThu`), sinh đủ 12 tháng lùi từ `NGAY_HIEN_TAI` kể cả tháng không có hóa đơn (điền `"0.00"`).

- [x] **Step 6: Chạy test, xác nhận đạt**

Run: `npm test`
Expected: PASS toàn bộ.

- [x] **Step 7: Commit**

```bash
git add src/lib/queries/
git commit -m "feat: mat tien queries cho khach hang, dich vu, hoa don, bao cao"
```

---

### Task 9: Token màu, font và dọn route cũ

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/app/db-check/page.tsx` (chuyển nội dung từ `src/app/page.tsx`)
- Delete: `src/app/page.tsx` (sẽ được Task 11 tạo lại trong `(app)/`)

**Interfaces:**
- Produces: biến CSS `--font-display`, `--font-sans`, `--font-mono`; toàn bộ token màu trong `:root`

- [x] **Step 1: Thay khối `:root` trong `src/app/globals.css`**

Chép nguyên khối `:root` trong `design/README.md` mục "Token màu", thay cho khối `:root` mặc định của shadcn đang có. Giữ nguyên `@import`, `@custom-variant` và `@theme inline` ở đầu file.

- [x] **Step 2: Bổ sung ánh xạ font trong `@theme inline`**

```css
  --font-display: var(--font-playfair);
  --font-sans: var(--font-be-vietnam);
  --font-mono: var(--font-jetbrains);
  --font-heading: var(--font-playfair);
```

- [x] **Step 3: Đổi font trong `src/app/layout.tsx`**

```tsx
import { Be_Vietnam_Pro, JetBrains_Mono, Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
});

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
});
```

Thay `className` trên `<html>` thành:
`` `${playfair.variable} ${beVietnam.variable} ${jetbrains.variable} h-full antialiased` ``

Đổi `<body>` thành `className="min-h-full bg-background text-foreground font-sans"`.

- [x] **Step 4: Chuyển trang kiểm tra kết nối**

```bash
mkdir -p src/app/db-check
git mv src/app/page.tsx src/app/db-check/page.tsx
```

Sửa tiêu đề trong file mới thành "Kiểm tra kết nối database" và ghi chú rằng trang này không nằm trong thanh điều hướng.

- [x] **Step 5: Kiểm tra build**

Run: `npm run build`
Expected: thành công. `/` sẽ tạm 404 cho tới Task 11 — đúng như dự kiến.

- [x] **Step 6: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/app/db-check/ src/app/page.tsx
git commit -m "feat: ap token mau va font cua ban thiet ke, chuyen trang kiem tra ket noi sang /db-check"
```

---

### Task 10: App shell — sidebar, topbar, layout

**Files:**
- Create: `src/lib/nav.ts`
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/topbar.tsx`
- Create: `src/components/layout/page-header.tsx`
- Create: `src/app/(app)/layout.tsx`
- Test: `src/lib/nav.test.ts`

**Interfaces:**
- Consumes: `@/lib/queries/accounts` (`NHAN_VIEN_MAC_DINH`)
- Produces:
  - `MUC_DIEU_HUONG: { nhan: string; href: string; icon: LucideIcon }[]`
  - `<Sidebar />`, `<Topbar tieuDe={...} phu={...} hanhDong={...} />`

- [x] **Step 1: Viết test thất bại**

```ts
// src/lib/nav.test.ts
import { describe, expect, it } from "vitest";
import { MUC_DIEU_HUONG } from "@/lib/nav";

describe("MUC_DIEU_HUONG", () => {
  it("dung 8 muc, dung thu tu cua artboard", () => {
    expect(MUC_DIEU_HUONG.map((m) => m.nhan)).toEqual([
      "Tổng quan",
      "Sơ đồ phòng",
      "Đặt phòng",
      "Nhận & trả phòng",
      "Khách hàng",
      "Dịch vụ",
      "Hóa đơn",
      "Báo cáo",
    ]);
  });
  it("moi muc co href bat dau bang /", () => {
    for (const m of MUC_DIEU_HUONG) expect(m.href.startsWith("/")).toBe(true);
  });
  it("khong co href trung", () => {
    const hrefs = MUC_DIEU_HUONG.map((m) => m.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
```

- [x] **Step 2: Chạy test, xác nhận thất bại**

Run: `npm test -- src/lib/nav.test.ts`
Expected: FAIL — không tìm thấy `@/lib/nav`.

- [x] **Step 3: Viết `src/lib/nav.ts`**

```ts
import {
  BedDouble, CalendarPlus, FileText, LayoutGrid,
  LogIn, Receipt, TrendingUp, Users,
} from "lucide-react";

/** Thu tu dung nhu thanh dieu huong trong design/Main.dc.html. */
export const MUC_DIEU_HUONG = [
  { nhan: "Tổng quan",        href: "/",              icon: LayoutGrid },
  { nhan: "Sơ đồ phòng",      href: "/rooms",         icon: BedDouble },
  { nhan: "Đặt phòng",        href: "/bookings/new",  icon: CalendarPlus },
  { nhan: "Nhận & trả phòng", href: "/front-desk",    icon: LogIn },
  { nhan: "Khách hàng",       href: "/customers",     icon: Users },
  { nhan: "Dịch vụ",          href: "/services",      icon: Receipt },
  { nhan: "Hóa đơn",          href: "/invoices",      icon: FileText },
  { nhan: "Báo cáo",          href: "/reports",       icon: TrendingUp },
] as const;
```

- [x] **Step 4: Chạy test, xác nhận đạt**

Run: `npm test -- src/lib/nav.test.ts`
Expected: PASS, 3 test.

- [x] **Step 5: Dựng Sidebar**

Đọc `design/Main.dc.html` dòng **21–55** (khối `<aside>`): logo "SEN VÀNG / Hotel Management", danh sách mục, khối nhân viên ở đáy, link Đăng xuất.

`sidebar.tsx` là Client Component (cần `usePathname()` để tô mục đang mở):

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MUC_DIEU_HUONG } from "@/lib/nav";
import { NHAN_VIEN_MAC_DINH } from "@/lib/queries/accounts";
```

Mục đang mở: `pathname === href` (riêng `/` phải so bằng tuyệt đối để không khớp mọi route).
Kích thước theo artboard: `aside` rộng 248px, nền `--sidebar`; mỗi mục cao 44px, bo góc 9px, chữ 13.5px.

- [x] **Step 6: Dựng Topbar và PageHeader**

Đọc `design/Main.dc.html` dòng **57–76**. `topbar.tsx` là Server Component nhận props:

```tsx
export function Topbar({
  tieuDe, phu, hanhDong,
}: {
  tieuDe: string;
  phu: string;
  hanhDong?: React.ReactNode;
}) { /* ... */ }
```

Cao 76px, nền `--card`, viền dưới `--border`, đệm ngang 32px. Tiêu đề dùng `font-display` 22px/600, dòng phụ 12.5px màu `--muted-foreground`. Ô tìm kiếm có `<label>` ẩn bằng lớp `.sr-only`.

- [x] **Step 7: Viết `src/app/(app)/layout.tsx`**

```tsx
import { Sidebar } from "@/components/layout/sidebar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex h-screen min-w-[1280px]">
      <Sidebar />
      <div className="flex min-w-0 flex-grow flex-col">{children}</div>
    </div>
  );
}
```

- [x] **Step 8: Thêm component shadcn còn thiếu**

```bash
npx shadcn@latest add input label select separator tabs avatar
```

- [x] **Step 9: Kiểm tra build**

Run: `npm run lint && npm run build`
Expected: không lỗi.

- [x] **Step 10: Commit**

```bash
git add src/lib/nav.ts src/lib/nav.test.ts src/components/layout/ src/components/ui/ src/app/\(app\)/
git commit -m "feat: app shell voi sidebar va topbar theo ban thiet ke"
```

---

### Task 11: `/` — Tổng quan

**Files:**
- Create: `src/app/(app)/page.tsx`
- Create: `src/components/shared/stat-card.tsx`
- Create: `src/components/shared/status-badge.tsx`
- Create: `src/components/shared/empty-state.tsx`

**Interfaces:**
- Consumes: `getChiSoTongQuan`, `getThongKePhongTheoTrangThai`, `getSoDoPhong`, `getPhieuNhanHomNay`, `getPhieuTraHomNay`
- Produces: `<StatCard nhan phanTram giaTri phu />`, `<StatusBadge trangThai loai />`, `<EmptyState thongDiep />`

- [x] **Step 1: Đọc artboard**

Mở `design/Main.dc.html`. Bốn khối của `<main>`:
- dòng **79–118** — hàng 4 thẻ chỉ số, cao 116px
- dòng **119–193** — lưới tình trạng phòng + chú giải, cao 304px
- dòng **194–280** — bảng "Nhận & trả sắp tới"
- khối "Cần xử lý hôm nay" nằm bên phải khối 304px

- [x] **Step 2: Viết 3 component dùng chung**

`StatCard`: nền trắng, viền `--border`, bo 14px, đệm 20px; nhãn 12.5px `--muted-foreground`, giá trị `font-display` 28px, chip phần trăm nền `--accent`.
`StatusBadge`: gọi `nhanTrangThaiPhong` / `nhanTrangThaiPhieu` / `nhanTrangThaiHoaDon` theo prop `loai`, đặt màu bằng `style={{ color: t.fg, background: t.bg }}` và chấm tròn 6px màu `t.dot`.
`EmptyState`: căn giữa, chữ 13px `--muted-foreground`.

- [x] **Step 3: Viết `src/app/(app)/page.tsx`**

```tsx
import { Topbar } from "@/components/layout/topbar";
import { getChiSoTongQuan } from "@/lib/queries/reports";
import { getThongKePhongTheoTrangThai, getSoDoPhong } from "@/lib/queries/rooms";
import { getPhieuNhanHomNay, getPhieuTraHomNay } from "@/lib/queries/bookings";

export default async function TongQuanPage() {
  const [chiSo, thongKe, phong, nhan, tra] = await Promise.all([
    getChiSoTongQuan(),
    getThongKePhongTheoTrangThai(),
    getSoDoPhong(),
    getPhieuNhanHomNay(),
    getPhieuTraHomNay(),
  ]);
  // ... dung 4 khoi theo artboard
}
```

Mọi con số hiển thị lấy từ `chiSo`, **không** viết cứng số của artboard.

- [x] **Step 4: Xem bằng mắt**

Run: `npm run dev`, mở `http://localhost:3000/`
Đối chiếu với `design/Main.dc.html`: 4 thẻ chỉ số, lưới phòng có chú giải 5 màu, bảng nhận/trả, danh sách cần xử lý. Kiểm font tiêu đề là Playfair, số tiền là JetBrains Mono.

- [x] **Step 5: Lint và build**

Run: `npm run lint && npm run build`
Expected: không lỗi.

- [x] **Step 6: Commit**

```bash
git add src/app/\(app\)/page.tsx src/components/shared/
git commit -m "feat: man hinh Tong quan"
```

---

### Task 12: `/rooms` — Sơ đồ phòng

**Files:**
- Create: `src/app/(app)/rooms/page.tsx`
- Create: `src/components/rooms/room-filter.tsx`

**Interfaces:**
- Consumes: `getSoDoPhong`, `getThongKePhongTheoTrangThai`, `getNhatKyBuongPhong`
- Produces: `<RoomFilter phong={PhongTrenSoDo[]} />`

- [x] **Step 1: Đọc artboard**

`design/Rooms.dc.html`: dòng **80–108** hàng chip đếm + bộ lọc tầng/loại; dòng **109–140** lưới thẻ phòng; dòng **141–cuối** bảng nhật ký.

- [x] **Step 2: Viết `room-filter.tsx`**

Client Component giữ 3 state: `trangThai` (mặc định `"TatCa"`), `tang`, `maLoaiPhong`. Lọc trên mảng `phong` truyền từ server.

Yêu cầu quan trọng (Review Focus #3): khi kết quả lọc rỗng phải hiện `<EmptyState thongDiep="Không có phòng phù hợp bộ lọc" />` — đúng câu chữ trong artboard — chứ không để lưới trắng.

Chip đếm phải đếm lại **theo kết quả lọc tầng/loại hiện hành**, không phải luôn đếm toàn bộ.

- [x] **Step 3: Viết `page.tsx`**

Server Component: `await` 3 query, truyền xuống `<RoomFilter />`, và tự dựng bảng nhật ký bên dưới.

- [x] **Step 4: Xem bằng mắt và bấm thử**

Run: `npm run dev`, mở `/rooms`
- Bấm từng chip trạng thái → lưới lọc đúng, số trên chip đổi theo
- Chọn tầng không có phòng nào ở trạng thái đang lọc → thấy dòng "Không có phòng phù hợp bộ lọc"

- [x] **Step 5: Lint và build**

Run: `npm run lint && npm run build`

- [x] **Step 6: Commit**

```bash
git add src/app/\(app\)/rooms/ src/components/rooms/
git commit -m "feat: man hinh So do phong voi bo loc"
```

---

### Task 13: `/bookings/new` — Đặt phòng

**Files:**
- Create: `src/app/(app)/bookings/new/page.tsx`
- Create: `src/components/bookings/booking-form.tsx`

**Interfaces:**
- Consumes: `getLoaiPhongConTrong`, `getDanhSachKhachHang`, `soDem`, `tienPhong`, `congTien`
- Produces: `<BookingForm loaiPhong={...} khach={...} />`

- [x] **Step 1: Đọc artboard**

`design/Booking.dc.html`: dòng **73–104** bước 1 khách hàng; **105–139** bước 2 thời gian lưu trú (có nút − / + số đêm, dòng 123 và 125); **140–189** bước 3 chọn loại phòng; **190–cuối** cột phải tạm tính.

- [x] **Step 2: Viết `booking-form.tsx`**

Client Component giữ state: `ngayNhan`, `ngayTra`, `maLoaiPhong`, `soKhach`, `tienCoc`.

Tính tiền:

```tsx
const ketQua = useMemo(() => {
  try {
    const dem = soDem(ngayNhan, ngayTra);
    const gia = loaiPhong.find((l) => l.maLoaiPhong === maLoaiPhong)?.donGiaNgay ?? "0.00";
    return { dem, tong: tienPhong(gia, dem), loi: null as string | null };
  } catch (e) {
    return { dem: 0, tong: "0.00", loi: e instanceof Error ? e.message : String(e) };
  }
}, [ngayNhan, ngayTra, maLoaiPhong, loaiPhong]);
```

Review Focus #1: khi `ketQua.loi` khác `null`, cột tạm tính hiện thông báo lỗi **bằng tiếng Việt có dấu** ("Ngày trả phòng phải sau ngày nhận phòng") và nút "Lập phiếu đặt phòng" bị `disabled`. Không được hiện tiền âm.

Nút − / + đổi `ngayTra` (cộng/trừ một ngày), không đổi số đêm trực tiếp — số đêm luôn suy ra từ hai ngày, để không bao giờ lệch nhau.

- [x] **Step 3: Viết `page.tsx`**

`await getLoaiPhongConTrong(NGAY_HIEN_TAI, <NGAY_HIEN_TAI + 2 ngày>)` và `getDanhSachKhachHang()`, truyền xuống form.

- [x] **Step 4: Xem bằng mắt và bấm thử**

Run: `npm run dev`, mở `/bookings/new`
- Đổi loại phòng → tạm tính đổi theo
- Bấm + số đêm → số đêm và thành tiền tăng đúng
- Đặt ngày trả **trước** ngày nhận → hiện lỗi, nút lập phiếu mờ đi, không có số âm

- [x] **Step 5: Lint và build**

Run: `npm run lint && npm run build`

- [x] **Step 6: Commit**

```bash
git add src/app/\(app\)/bookings/ src/components/bookings/
git commit -m "feat: man hinh Dat phong voi tinh tien truc tiep"
```

---

### Task 14: `/front-desk` — Nhận & trả phòng

**Files:**
- Create: `src/app/(app)/front-desk/page.tsx`
- Create: `src/components/front-desk/booking-picker.tsx`

**Interfaces:**
- Consumes: `getPhieuNhanHomNay`, `getPhieuTraHomNay`
- Produces: `<BookingPicker nhan={PhieuTomTat[]} tra={PhieuTomTat[]} />`

- [x] **Step 1: Đọc artboard**

`design/CheckInOut.dc.html`: dòng **73–96** hai tab Nhận/Trả + cảnh báo phiếu quá giờ; **97–120** danh sách phiếu bên trái (rộng 480px); **121–cuối** khung chi tiết bên phải.

- [x] **Step 2: Viết `booking-picker.tsx`**

Client Component, state: `tab` (`"nhan" | "tra"`) và `maDangChon`. Đổi tab thì `maDangChon` nhảy về phiếu đầu của danh sách mới.

Danh sách rỗng → `<EmptyState thongDiep="Không có phiếu nào" />` và khung chi tiết bên phải cũng hiện trạng thái rỗng thay vì đọc `undefined`.

- [x] **Step 3: Viết `page.tsx`**

- [x] **Step 4: Xem bằng mắt và bấm thử**

Run: `npm run dev`, mở `/front-desk`
- Bấm một phiếu khác trong danh sách → khung chi tiết bên phải đổi theo
- Chuyển tab Nhận ↔ Trả → danh sách và chi tiết đều đổi

- [x] **Step 5: Lint và build**

Run: `npm run lint && npm run build`

- [x] **Step 6: Commit**

```bash
git add src/app/\(app\)/front-desk/ src/components/front-desk/
git commit -m "feat: man hinh Nhan va tra phong"
```

---

### Task 15: `/customers` — Khách hàng

**Files:**
- Create: `src/app/(app)/customers/page.tsx`
- Create: `src/components/customers/customer-table.tsx`

**Interfaces:**
- Consumes: `getDanhSachKhachHang`, `getThongKeKhachHang`
- Produces: `<CustomerTable khach={KhachHangTrenBang[]} />`

- [x] **Step 1: Đọc artboard**

`design/Customers.dc.html`: dòng **80–102** hàng 4 thẻ chỉ số; **103–cuối** khối bảng, gồm tab lọc, ô sắp xếp, bảng và phân trang (dòng 304–315).

- [x] **Step 2: Viết `customer-table.tsx`**

Client Component, state: `tab` (`"TatCa" | "DangLuuTru" | "QuayLai" | "ConNo"`) và `sapXep` (`"MoiCapNhat" | "ChiTieuCao" | "LuuTruNhieu"`).

Review Focus #3: tab lọc ra 0 dòng → hiện `<EmptyState thongDiep="Không có khách hàng nào" />` trong thân bảng, giữ nguyên hàng tiêu đề.

Sắp xếp theo tiền phải so bằng **số**, không so chuỗi: `Number(a.tongChiTieu) - Number(b.tongChiTieu)`.

- [x] **Step 3: Viết `page.tsx`**

- [x] **Step 4: Xem bằng mắt và bấm thử**

Run: `npm run dev`, mở `/customers`
- Bấm từng tab → số dòng đổi
- Đổi ô sắp xếp sang "Tổng chi tiêu cao nhất" → dòng đầu đúng là khách chi nhiều nhất
- Chọn tab "Còn công nợ" nếu rỗng → thấy thông báo, không phải bảng trắng

- [x] **Step 5: Lint và build**

Run: `npm run lint && npm run build`

- [x] **Step 6: Commit**

```bash
git add src/app/\(app\)/customers/ src/components/customers/
git commit -m "feat: man hinh Khach hang voi loc va sap xep"
```

---

### Task 16: `/services` và `/invoices/[maHoaDon]`

**Files:**
- Create: `src/app/(app)/services/page.tsx`
- Create: `src/components/services/service-usage-form.tsx`
- Create: `src/app/(app)/invoices/page.tsx`
- Create: `src/app/(app)/invoices/[maHoaDon]/page.tsx`

**Interfaces:**
- Consumes: `getDanhMucDichVu`, `getSuDungDichVuTheoPhieu`, `getPhieuTraHomNay`, `getHoaDon`, `tienDichVu`, `congTien`

- [x] **Step 1: Đọc artboard**

`design/Services.dc.html`: dòng **73–140** bảng danh mục; **141–160** khối phụ; **161–cuối** cột phải ghi nhận sử dụng (nút − / + ở dòng 189 và 191).
`design/Invoice.dc.html`: dòng **76–219** mẫu hóa đơn; **220–cuối** cột phải tóm tắt + thanh toán.

- [x] **Step 2: Viết `service-usage-form.tsx`**

Client Component, state: `maDv`, `soLuong`. Thành tiền tính bằng `tienDichVu(gia, soLuong)` ngay khi đổi số lượng. `soLuong` chặn dưới ở 1, không cho về 0 hoặc âm.

- [x] **Step 3: Viết `/services/page.tsx`**

- [x] **Step 4: Viết `/invoices/page.tsx`**

Thanh điều hướng trỏ tới `/invoices` (không có mã), nên trang này liệt kê hóa đơn và link sang từng mã. Không có trang này thì mục "Hóa đơn" trên sidebar sẽ là link chết.

- [x] **Step 5: Viết `/invoices/[maHoaDon]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getHoaDon } from "@/lib/queries/invoices";

export default async function HoaDonPage({ params }: PageProps<"/invoices/[maHoaDon]">) {
  const { maHoaDon } = await params;
  const hd = await getHoaDon(maHoaDon);
  if (!hd) notFound();          // Review Focus #4
  // ... dung mau hoa don theo artboard
}
```

Phần đầu mẫu hóa đơn giữ nguyên chỗ trống như artboard và spec §10: tên khách sạn `SEN VÀNG`, bên dưới là `[Địa chỉ khách sạn] · [Số điện thoại]` và `Mã số thuế: [MST]`. **Không** bịa địa chỉ hay mã số thuế.

Bảng khoản mục hiện đúng `LoaiKhoanMuc` thô (`TienPhong`, `DichVu`, `PhuThu`…) ở cột đầu như artboard vẽ. Dòng `GiamGia` / `GiamTru` có số tiền âm — hiển thị trong ngoặc hoặc kèm dấu trừ, không được bỏ dấu.

- [x] **Step 6: Xem bằng mắt và bấm thử**

Run: `npm run dev`
- `/services` — đổi số lượng, thành tiền tính lại đúng
- `/invoices` — bấm một hóa đơn, sang đúng trang chi tiết
- `/invoices/HD99999999` — ra trang 404, **không** phải màn hình lỗi

- [x] **Step 7: Lint và build**

Run: `npm run lint && npm run build`

- [x] **Step 8: Commit**

```bash
git add src/app/\(app\)/services/ src/app/\(app\)/invoices/ src/components/services/
git commit -m "feat: man hinh Dich vu va Hoa don"
```

---

### Task 17: `/reports` và `/login`

**Files:**
- Create: `src/app/(app)/reports/page.tsx`
- Create: `src/components/reports/period-picker.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/components/auth/login-form.tsx`

**Interfaces:**
- Consumes: `getDoanhThuTheoThang`, `getChiSoTongQuan`, `dangNhapGia`

- [x] **Step 1: Đọc artboard**

`design/Reports.dc.html`: dòng **75–97** thanh chọn kỳ; **98–125** 4 thẻ chỉ số; **126–210** biểu đồ cột; **211–cuối** hai bảng cơ cấu.
`design/Login.dc.html`: toàn bộ 103 dòng — cột trái giới thiệu, cột phải form (nút hiện mật khẩu ở dòng 61).

- [x] **Step 2: Viết `period-picker.tsx`**

Client Component, state `ky` (`"HomNay" | "TuanNay" | "ThangNay" | "MuoiHaiThang"`). Lọc mảng 12 tháng đã nhận từ server theo kỳ, dựng lại biểu đồ.

Biểu đồ cột: mỗi cột là `div` cao theo tỉ lệ `Number(tong) / max * 100 + "%"`, ba màu xếp chồng dùng `var(--chart-1)`, `var(--chart-2)`, `var(--chart-3)` theo đúng thứ tự tiền phòng / dịch vụ / phụ thu. Không thêm thư viện biểu đồ.

Khi `max` bằng 0 thì mọi cột cao 0 — phải chặn chia cho 0.

- [x] **Step 3: Viết `/reports/page.tsx`**

- [x] **Step 4: Viết `login-form.tsx`**

Client Component:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { dangNhapGia } from "@/lib/queries/accounts";

export function LoginForm() {
  const router = useRouter();
  const [loi, setLoi] = useState<string | null>(null);
  // submit: goi dangNhapGia trong try/catch, dung thi router.push("/"),
  // sai thi setLoi(e.message)
}
```

Form dùng `<form onSubmit>` thật với `<label htmlFor>` thật cho cả hai trường. Nút "Hiện mật khẩu" đổi `type` của ô mật khẩu giữa `password` và `text`, có `aria-label`.

- [x] **Step 5: Viết `/login/page.tsx`**

Route này nằm trong `(auth)`, **ngoài** shell — không có sidebar, không có topbar.

- [x] **Step 6: Xem bằng mắt và bấm thử**

Run: `npm run dev`
- `/reports` — đổi kỳ, biểu đồ và số liệu đổi theo
- `/login` — đăng nhập `admin` / `Admin@123` → vào `/`
- `/login` — đăng nhập `admin` / `sai` → hiện "Tên đăng nhập hoặc mật khẩu không đúng"
- `/login` — đăng nhập `kythuat.son` với mật khẩu **đúng** → hiện thông báo tài khoản đang tạm nghỉ

- [x] **Step 7: Lint và build**

Run: `npm run lint && npm run build`

- [x] **Step 8: Commit**

```bash
git add src/app/\(app\)/reports/ src/app/\(auth\)/ src/components/reports/ src/components/auth/
git commit -m "feat: man hinh Bao cao doanh thu va Dang nhap"
```

---

### Task 18: Rà soát cuối

**Files:** không tạo file mới; sửa những gì rà ra.

- [x] **Step 1: Chạy toàn bộ test**

Run: `npm test`
Expected: PASS toàn bộ.

- [x] **Step 2: Lint và build**

Run: `npm run lint && npm run build`
Expected: không lỗi, không cảnh báo mới.

- [x] **Step 3: Đi hết 9 route**

Run: `npm run dev`. Mở lần lượt và đối chiếu với artboard:

| Route | Artboard |
|---|---|
| `/login` | `design/Login.dc.html` |
| `/` | `design/Main.dc.html` |
| `/rooms` | `design/Rooms.dc.html` |
| `/bookings/new` | `design/Booking.dc.html` |
| `/front-desk` | `design/CheckInOut.dc.html` |
| `/customers` | `design/Customers.dc.html` |
| `/services` | `design/Services.dc.html` |
| `/invoices/<mã bất kỳ>` | `design/Invoice.dc.html` |
| `/reports` | `design/Reports.dc.html` |

- [x] **Step 4: Bấm hết 8 mục trên sidebar**

Xác nhận không mục nào 404, và mục đang mở được tô sáng đúng.

- [x] **Step 5: Kiểm ba chỗ tương tác lần cuối**

Lọc sơ đồ phòng · tính tiền đặt phòng · đổi số lượng dịch vụ.

- [x] **Step 6: Commit phần sửa (nếu có)**

```bash
git add -A
git commit -m "fix: ra soat cuoi 9 man hinh"
```
