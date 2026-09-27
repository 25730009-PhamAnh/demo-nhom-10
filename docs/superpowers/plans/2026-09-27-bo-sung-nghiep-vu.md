# Bổ sung nghiệp vụ: khách hàng, buồng phòng – bảo trì, bảng giá theo ngày — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm 5 chức năng còn thiếu: thêm / sửa khách (trang Khách hàng và ngay trong form đặt phòng), tìm khách theo tên / SĐT / CCCD, hai màn làm việc cho buồng phòng và kỹ thuật, báo dọn / báo bảo trì trên Sơ đồ phòng, và màn cấu hình giá theo ngày. Giá khi đặt phòng là trung bình giá các đêm, cùng một công thức ở mọi nơi.

**Architecture:** Không đổi schema (vẫn 14 bảng). Mọi thao tác ghi đi qua thủ tục mới hoặc thủ tục được viết lại trong `02` / `04` / `06` của nhóm (thư mục OneDrive, ngoài git). Các file đó được sửa bằng script Python chỉ thay đúng những đoạn đã neo. App giữ hai tầng ghi của phase 2: `src/lib/thao-tac/*.ts` gọi thủ tục và trả `KetQua<T>`, đây là tầng được test; `actions.ts` cạnh route là Server Action mỏng, chỉ kiểm hình thức rồi `refresh()`. Đọc bằng Drizzle, hoặc SQL thô khi cần view hay hàm của CSDL.

**Tech Stack:** Next.js 16.3.5 (App Router, Server Actions, `refresh()` của `next/cache`, `searchParams` dạng Promise), React 19, Drizzle ORM 0.45 + mysql2 3.24, MySQL 9.7, Vitest 5, Python 3 (script sửa SQL), Chrome headless + CDP (kiểm giao diện).

**Spec:** `docs/superpowers/specs/2026-09-27-bo-sung-nghiep-vu-design.md`. Các dòng *Bổ sung khi lập plan* trong spec gồm:
- collation khi tìm khách;
- regex SĐT `{9,14}`;
- thủ tục nội bộ `sp_ChuanHoaKhachHang`;
- nút trên Sơ đồ phòng không khóa theo trạng thái;
- thẻ "báo hỏng" ở Tổng quan.

**Trạng thái:** Đã xong, Task 0–16 và bản sửa sau review cuối (commit `bd4e691`..`c1e778a`, đã vào `main`). `02`, `04`, `06`, `08` sửa ngoài git, trong thư mục Scripts trên OneDrive; đã cài vào CSDL dev, cả `08`.

## Global Constraints

- AGENTS.md: Next 16 có thay đổi phá vỡ, nên đọc `node_modules/next/dist/docs/` trước khi viết code Next. Plan này đã đọc sẵn:
  - `01-app/03-api-reference/04-functions/refresh.md`: `refresh()` chỉ gọi được trong Server Action;
  - `01-app/01-getting-started/03-layouts-and-pages.md`: `searchParams` là `Promise`, kiểu `PageProps<'/route'>` do `next typegen` sinh.
- Chữ hiển thị trên giao diện: tiếng Việt có dấu. Chú thích trong code (TS và SQL): tiếng Việt **không dấu**. `MESSAGE_TEXT` của SQL: không dấu.
- Không sửa tay `src/db/schema.ts`. Không thêm thư viện. **Không đổi schema** (không sửa `01`, `07`).
- **Không lặp quy tắc nghiệp vụ ở app.**
  - Server Action chỉ kiểm hình thức: mã `CHAR(10)` đúng tiền tố (`laMa`), chuỗi đúng độ dài (`laChuoi`), tiền không âm (`laTien`), ngày `YYYY-MM-DD` (`laNgay`).
  - Trạng thái phòng, trùng CCCD, khoảng giá… để thủ tục quyết định.
  - Nút **không** khóa theo trạng thái phòng. Nút chỉ khóa khi đang chạy (`dangChay`) hoặc form thiếu dữ liệu bắt buộc (chưa chọn khách, chưa có nhân viên).
- Mọi thao tác ghi đi qua thủ tục. App không `INSERT` / `UPDATE` / `DELETE` thẳng. Chỉ test mới được ghi thẳng để dựng tình huống.
- Thông báo lỗi: `thongBaoCsdl` có sẵn.
  - `SIGNAL 45000` thành `"CSDL từ chối: " + MESSAGE_TEXT` (bỏ tiền tố `"Loi: "`).
  - Lỗi CSDL khác thành `"Lỗi CSDL (<errno>): …"`.
- `MaTK`:
  - Sơ đồ phòng dùng `getNhanVienMacDinh().maTk` (`letan.lan`).
  - Màn Buồng phòng và Bảo trì dùng mã chọn ở ô "Nhân viên thực hiện", action kiểm `laMa(maTk, "TK")`.
  - Hàm `thao-tac` luôn nhận `maTk` làm tham số.
- `Scripts/` nằm ngoài git (thư mục OneDrive) và nhóm có thể đang sửa song song. Vì vậy:
  - sao lưu cả thư mục ở Task 0;
  - trước mỗi lần sửa, `grep -c` lại các chỗ neo;
  - script sửa chỉ thay đoạn đã neo, mỗi đoạn phải xuất hiện đúng 1 lần, thiếu neo thì script dừng;
  - gặp số neo khác mong đợi thì **dừng lại, báo người dùng**.
- Script SQL: ASCII, LF, căn cột theo quy ước của file.
- CSDL dev:
  - Không chạy `01` vào CSDL dev.
  - Chỉ ở Task 16 mới chạy `02 → 04 → 06` vào CSDL dev, và phải hỏi người dùng trước.
  - `08` tạo user MySQL thật trên server: hỏi riêng trước khi chạy.
- Commit: thông điệp tiếng Việt không dấu dạng `feat: …` / `test: …` / `fix: …` / `docs: …`, kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Nhánh làm việc `bo-sung-nghiep-vu` (đã tạo, commit `bd4e691` là spec). Mốc ban đầu: `npm test` → `Test Files 32 passed`, `Tests 186 passed`.
- CSDL kiểm thử đóng băng ngày 23/09/2026 10:00. Số liệu mẫu các task dựa vào:
  - **Khách:** 60 khách, mã mới đầu tiên `KH00000061`. KH00000001 có CCCD `079201000001`, email `long.nguyen@example.com`. KH00000006 là "Dang Thuy Linh", SĐT `0901234506`.
  - **Phòng:**

    | Phòng | Mã | Trạng thái | Ghi chú |
    |---|---|---|---|
    | 101 | `PH00000001` | Trống | có `SUA0000001` 250.000đ |
    | 202 | `PH00000004` | Bảo trì | phiếu mở `SUA0000004` 900.000đ, "Sua he thong nuoc nong", 20/09 15:20, TK00000007 |
    | 301 | `PH00000005` | Đang dọn | |
    | 302 | `PH00000006` | Đang sử dụng | |
    | PRES-01 | `PH00000010` | Bảo trì | `SUA0000010` 1.500.000đ, 22/09 09:40 |
    | 103 | `PH00000011` | Đã đặt | DP00000011 nhận hôm nay, khách "Nguyen Thi An" |
    | 303 | `PH00000027` | Đang sử dụng | có `SUA0000011` 0đ "May lanh khong chay, dang kiem tra" |

    Phòng Đang dọn: 301, 308, 309, 310, 403–408 (10 phòng, không phòng nào có khách hôm nay).
  - **Nhân viên:**

    | Vai trò | Nhân viên |
    |---|---|
    | Buồng phòng | TK00000004 Pham Thi Mai, TK00000005 Vo Thanh Thao |
    | Kỹ thuật | TK00000006 Do Hoang Nam (TK00000007 Bui Minh Son đang `TamNghi`) |
    | Lễ tân | TK00000002 Tran Ngoc Lan |
    | CSKH | TK00000010 (`NghiViec`) |
  - **Nhật ký:** `SUA_PHONG` 12 dòng (mã mới `SUA0000013`), `DON_PHONG` 16 dòng (mã mới `DON0000017`).
  - **Giá:** mỗi loại phòng có đúng 1 khoảng giá từ 08/01/2026 đến 07/01/2027 (BG00000001–10), mã mới `BG00000011`.
    - LP00000002: giá gốc 800.000, bảng giá 880.000 (×1,10).
    - LP00000005: giá gốc 1.500.000, bảng giá 1.500.000.
  - **Phiếu:** mã mới `DP00000099`.

## Review Focus

1. **Gõ ký tự đặc biệt hay có dấu vào ô tìm khách.** Gõ `%`, `_`, `-` phải ra danh sách rỗng, không ra cả bảng. Gõ "Đặng Thùy" phải ra "Dang Thuy Linh". Gõ "0901 234.506" phải ra khách có SĐT `0901234506`. Test ở Task 2.
2. **Hai khách mới cùng bỏ trống SĐT và email.** Cả hai lưu `NULL`, khách thứ hai không bị `UQ_KHACH_HANG_Email` chặn vì chuỗi `''`. Test ở Task 1.
3. **Bấm cùng một thao tác hai lần, hoặc tab khác vừa làm trên cùng phòng** (báo dọn, báo bảo trì, sửa xong): lần sau CSDL từ chối, không ghi trùng, trạng thái giữ đúng. Test ở Task 5.
4. **Phủ giá lên một đoạn một ngày nằm đúng mép đầu hoặc mép cuối của khoảng cũ.** Kết quả không chồng, không hở, giá từng ngày quanh mép đúng. Test ở Task 12.
5. **Server Action nhận object, mảng hay số thay cho chuỗi**, hoặc đơn giá dạng `"1.500.000"` hay `undefined`. Phải trả `"… không hợp lệ"` mà không chạm CSDL. `null` chỉ hợp lệ ở ô đơn giá, nghĩa là "về giá gốc". Có `actions.test.ts` ở Task 3, 7, 8, 9, 13.

## Cấu trúc file

| File | Trách nhiệm |
|---|---|
| `$BK/vasql.py`, `$BK/sua_*.py` *(thư mục tạm, ngoài repo)* | Sửa `Scripts/` theo neo, giống cách làm ở phase 2 |
| `$QLKS_SCRIPTS_DIR/02_Functions.sql` | `fn_DonGiaTrungBinh` |
| `$QLKS_SCRIPTS_DIR/04_Triggers.sql` | `trg_CTDP_TinhThanhTien_BI` dùng `fn_DonGiaTrungBinh` |
| `$QLKS_SCRIPTS_DIR/06_Procedures.sql` | 7 thủ tục mới; viết lại `sp_GhiNhanDonPhong`, `sp_GhiNhanSuaPhong`; `sp_DatPhong`, `sp_TraCuuPhongTrong` dùng hàm trung bình |
| `$QLKS_SCRIPTS_DIR/08_Security_Roles.sql` | quyền cho các thủ tục, hàm, view mới |
| `src/lib/vai-tro.ts` *(mới)* | mã loại tài khoản Buồng phòng, Kỹ thuật |
| `src/lib/chi-tiet-gia.ts` *(mới)* | `gopDoanGia`: gộp các đêm liền nhau cùng giá |
| `src/lib/format.ts` | `formatNgayNgan` ('27/09') |
| `src/lib/queries/customers.ts` | `timKhachHang` |
| `src/lib/queries/buong-phong.ts` *(mới)* | nhân viên theo vai trò, phòng chờ dọn, phòng đang bảo trì, nhật ký dọn / sửa |
| `src/lib/queries/rooms.ts` | nhật ký hiện họ tên nhân viên |
| `src/lib/queries/bang-gia.ts` *(mới)* | bảng giá theo loại, lịch giá N ngày |
| `src/lib/queries/bookings.ts` | đơn giá qua `fn_DonGiaTrungBinh`, `chiTietGia` |
| `src/lib/thao-tac/khach-hang.ts`, `bang-gia.ts` *(mới)*; `buong-phong.ts` | mỗi hàm một thủ tục |
| `src/app/(app)/customers/actions.ts` *(mới)* | thêm, sửa, tìm khách |
| `src/app/(app)/housekeeping/{actions.ts,page.tsx}` *(mới)* | màn Buồng phòng |
| `src/app/(app)/maintenance/{actions.ts,page.tsx}` *(mới)* | màn Bảo trì |
| `src/app/(app)/pricing/{actions.ts,page.tsx}` *(mới)* | màn Bảng giá |
| `src/app/(app)/rooms/{actions.ts,page.tsx}` | báo dọn, báo bảo trì; nhật ký chỉ xem |
| `src/app/(app)/page.tsx` | Tổng quan: thẻ chờ dọn / đang bảo trì |
| `src/app/(app)/bookings/new/page.tsx` | bỏ nạp danh sách khách |
| `src/components/customers/khach-hang-form.tsx` *(mới)*, `customer-table.tsx` | form thêm / sửa, nút trên bảng |
| `src/components/bookings/chon-khach.tsx` *(mới)*, `booking-form.tsx` | tìm / tạo khách trong form đặt phòng; chi tiết giá |
| `src/components/shared/chon-nhan-vien.tsx` *(mới)* | ô chọn nhân viên thực hiện |
| `src/components/housekeeping/buong-phong-ban.tsx`, `maintenance/bao-tri-ban.tsx` *(mới)* | thẻ làm việc của hai vai trò |
| `src/components/rooms/thao-tac-phong.tsx` *(mới)*, `room-filter.tsx`; xóa `nhat-ky-form.tsx` | chọn phòng, báo dọn / báo bảo trì |
| `src/components/pricing/{dat-gia-form,lich-gia,cac-khoang-gia}.tsx` *(mới)* | ba thẻ của màn Bảng giá |
| `src/lib/nav.ts` | Buồng phòng, Bảo trì, Bảng giá |
| `README.md` | màn mới, thứ tự chạy lại script |

---

### Task 0: Chuẩn bị: commit plan, sao lưu `Scripts/`, thư viện sửa SQL

**Files:**
- Không sửa file trong repo (spec và plan đã commit khi lập plan).
- Create (ngoài repo): `$BK/goc/` (bản sao `Scripts/setup_database`), `$BK/vasql.py`

**Interfaces:**
- Produces: biến `BK` là thư mục tạm của phiên, **giữ nguyên cho mọi task sau**. Trong `$BK` có:
  - `goc/`: bản gốc 8 file;
  - `vasql.py`: lớp `Tep(thu_muc, ten)`, gồm `thay(cu, moi)`, `thay_doan(bat_dau, ket_thuc, moi, phai_co)`, `chen_truoc(neo, doan)`, `chen_sau(neo, doan)`, `luu()`. Mỗi neo phải xuất hiện đúng 1 lần, không thì `sys.exit`. `thay_doan` ghi đoạn cũ ra `$BK/<tep>.<n>.cu` để đọc lại.

- [x] **Step 1: Đang ở nhánh `bo-sung-nghiep-vu`, cây làm việc sạch**

Spec đã bổ sung và plan này đã được commit khi lập plan (commit ngay sau `bd4e691`).

```bash
cd /Users/anhpham/PA/UIT/Demo
git branch --show-current
git status --short
git log --oneline -3
```

Expected: `bo-sung-nghiep-vu`; `git status` không in gì; commit mới nhất là `docs: bo sung spec khi lap plan va plan bo sung nghiep vu`.

- [x] **Step 2: Sao lưu `Scripts/setup_database`**

Đặt `BK` là thư mục tạm của phiên (scratchpad; không có thì `mktemp -d`).

```bash
cd /Users/anhpham/PA/UIT/Demo
set -a; source .env.local; set +a
BK="<thu muc tam cua phien>/bo-sung"; mkdir -p "$BK/goc"
cp "$QLKS_SCRIPTS_DIR"/0*.sql "$BK/goc/"
ls -la "$QLKS_SCRIPTS_DIR"; file "$BK"/goc/*.sql; grep -c $'\r' "$BK"/goc/*.sql
```

Expected: 8 file `01`…`08`, tất cả `ASCII text`, mọi số đếm `\r` đều `0`.

- [x] **Step 3: Lưu thư viện sửa SQL vào `$BK/vasql.py`**

```python
"""Thu vien nho cho cac script sua Scripts/setup_database (plan bo sung nghiep vu).

Moi script goi Tep(ten).thay(cu, moi) cho tung doan neo: doan neo phai xuat hien
DUNG 1 lan, khong thi dung lai va bao loi (nhom co the da sua file). Tep.luu()
ghi lai ASCII, LF.
"""
import os
import sys


class Tep:
    def __init__(self, thu_muc, ten):
        self.duong_dan = os.path.join(thu_muc, ten)
        with open(self.duong_dan, encoding="ascii", newline="") as f:
            self.s = f.read()
        assert "\r" not in self.s, f"{ten} phai la LF"
        self.ten = ten
        self.dem = 0

    def thay(self, cu, moi):
        n = self.s.count(cu)
        if n != 1:
            sys.exit(f"LOI {self.ten}: doan neo xuat hien {n} lan (can 1):\n{cu}")
        self.s = self.s.replace(cu, moi)
        self.dem += 1

    def thay_doan(self, bat_dau, ket_thuc, moi, phai_co):
        """Thay tu bat_dau (gom ca no) toi ngay truoc ket_thuc. Hai moc phai duy
        nhat, va doan cu phai con du cac dong trong phai_co (dau hieu nhom chua
        viet lai thu tuc). Doan cu ghi ra <tep>.<n>.cu de doc lai."""
        for moc in (bat_dau, ket_thuc):
            n = self.s.count(moc)
            if n != 1:
                sys.exit(f"LOI {self.ten}: moc xuat hien {n} lan (can 1):\n{moc}")
        i = self.s.index(bat_dau)
        j = self.s.index(ket_thuc)
        if j <= i:
            sys.exit(f"LOI {self.ten}: moc ket thuc nam truoc moc bat dau")
        cu = self.s[i:j]
        for dong in phai_co:
            if dong not in cu:
                sys.exit(f"LOI {self.ten}: doan cu khong con dong:\n{dong}")
        self.dem += 1
        # Doan cu ghi canh vasql.py (thu muc sao luu), khong ghi vao Scripts/.
        ban_cu = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                              f"{self.ten}.{self.dem}.cu")
        with open(ban_cu, "w", encoding="ascii") as f:
            f.write(cu)
        self.s = self.s[:i] + moi + self.s[j:]

    def chen_truoc(self, neo, doan):
        self.thay(neo, doan + neo)

    def chen_sau(self, neo, doan):
        self.thay(neo, neo + doan)

    def luu(self):
        self.s.encode("ascii")
        with open(self.duong_dan, "w", encoding="ascii", newline="\n") as f:
            f.write(self.s)
        print(f"Da sua {self.ten}: {self.dem} doan")
```

Run: `python3 -c "import sys; sys.path.insert(0, '$BK'); import vasql; print('ok')"` → Expected: `ok`.

---

### Task 1: Thủ tục và thao tác thêm / sửa khách hàng

**Files:**
- Modify (ngoài git): `$QLKS_SCRIPTS_DIR/06_Procedures.sql`, `$QLKS_SCRIPTS_DIR/08_Security_Roles.sql`
- Create: `src/lib/thao-tac/khach-hang.ts`
- Test: `src/lib/thao-tac/khach-hang.test.ts`

**Interfaces:**
- Consumes: `callProcedure`, `callProcedureOut` (`src/db/procedures.ts`); `thucHien`, `KetQua` (`src/lib/thao-tac/ket-qua.ts`); `dong` (`src/test/csdl.ts`); `napLaiDuLieuMau` (`src/test/nap-lai-mau.ts`); `vasql.py` (Task 0).
- Produces:
  - Thủ tục:
    - `sp_ChuanHoaKhachHang(p_MaKH, INOUT hoTen, cccd, sdt, email)`: nội bộ.
    - `sp_ThemKhachHang(hoTen, cccd, sdt, email, OUT p_MaKH)`: result set là dòng vừa thêm.
    - `sp_SuaKhachHang(maKH, hoTen, cccd, sdt, email)`: result set là dòng sau khi sửa.
  - `export type HoSoKhach = { hoTen: string; cccd: string; sdt: string; email: string }`
  - `export type KhachDaLuu = { maKh: string; hoTen: string; cccd: string; sdt: string | null; email: string | null }`
  - `themKhachHang(v: HoSoKhach): Promise<KetQua<KhachDaLuu>>`
  - `suaKhachHang(maKh: string, v: HoSoKhach): Promise<KetQua<KhachDaLuu>>`

- [x] **Step 1: Viết test hỏng `src/lib/thao-tac/khach-hang.test.ts`**

```ts
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { suaKhachHang, themKhachHang, type HoSoKhach } from "@/lib/thao-tac/khach-hang";
import { dong } from "@/test/csdl";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

beforeEach(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

// Du lieu mau: 60 khach. KH00000001 co CCCD 079201000001, email long.nguyen@example.com.
const MOI: HoSoKhach = {
  hoTen: "  Nguyễn Văn Mới ",
  cccd: " 079299000061 ",
  sdt: "0903 118.274",
  email: " Moi.Nguyen@Example.com ",
};
const soKhach = async () => (await dong("SELECT COUNT(*) AS n FROM KHACH_HANG")).n;

describe("themKhachHang", () => {
  it("chuan hoa ho so roi luu, ma moi KH00000061", async () => {
    expect(await themKhachHang(MOI)).toEqual({
      ok: true,
      data: {
        maKh: "KH00000061",
        hoTen: "Nguyễn Văn Mới",
        cccd: "079299000061",
        sdt: "0903118274",
        email: "moi.nguyen@example.com",
      },
    });
    expect(await soKhach()).toBe(61);
  });

  // Review Focus #2
  it("hai khach cung de trong SDT va email: ca hai luu NULL, khong vuong UQ_KHACH_HANG_Email", async () => {
    const trong = { hoTen: "Khach A", cccd: "079299000071", sdt: "", email: "" };
    expect((await themKhachHang(trong)).ok).toBe(true);
    expect((await themKhachHang({ ...trong, hoTen: "Khach B", cccd: "B12345678" })).ok).toBe(true);
    expect(
      await dong(
        `SELECT COUNT(*) AS n FROM KHACH_HANG
         WHERE MaKH IN ('KH00000061', 'KH00000062') AND SDT IS NULL AND Email IS NULL`,
      ),
    ).toEqual({ n: 2 });
  });

  it("CCCD da co thi tu choi kem ma khach da co, khong ghi", async () => {
    expect(await themKhachHang({ ...MOI, cccd: "079201000001" })).toEqual({
      ok: false,
      loi: "CSDL từ chối: CCCD da co trong ho so KH00000001",
    });
    expect(await soKhach()).toBe(60);
  });

  it("email da co (khac hoa thuong) thi tu choi", async () => {
    expect(await themKhachHang({ ...MOI, email: "LONG.NGUYEN@example.com" })).toEqual({
      ok: false,
      loi: "CSDL từ chối: Email da co trong ho so KH00000001",
    });
  });

  it("ho so sai dinh dang thi CSDL tu choi tung truong, khong ghi", async () => {
    const loi = async (v: Partial<HoSoKhach>) => {
      const r = await themKhachHang({ ...MOI, ...v });
      return r.ok ? "ok" : r.loi;
    };
    expect(await loi({ hoTen: "   " })).toBe("CSDL từ chối: Ho ten khach hang khong duoc de trong");
    expect(await loi({ cccd: "0792" })).toBe(
      "CSDL từ chối: CCCD / ho chieu phai gom 9-20 chu so hoac chu cai",
    );
    expect(await loi({ cccd: "0792-9900-0061" })).toBe(
      "CSDL từ chối: CCCD / ho chieu phai gom 9-20 chu so hoac chu cai",
    );
    expect(await loi({ sdt: "12ab" })).toBe(
      "CSDL từ chối: So dien thoai phai gom 9-14 chu so, co the co dau + o dau",
    );
    expect(await loi({ email: "a@b" })).toBe("CSDL từ chối: Email khong dung dinh dang");
    expect(await soKhach()).toBe(60);
  });

  it("nhan ho chieu co chu (doi sang chu hoa) va SDT co dau +", async () => {
    expect(await themKhachHang({ ...MOI, cccd: "c1234567x", sdt: "+84 903 118 274" })).toMatchObject({
      ok: true,
      data: { cccd: "C1234567X", sdt: "+84903118274" },
    });
  });
});

describe("suaKhachHang", () => {
  it("sua ho so, giu nguyen ma; email de trong thanh NULL", async () => {
    expect(
      await suaKhachHang("KH00000002", {
        hoTen: "Trần Thị Bảo Châu",
        cccd: "079202000002",
        sdt: "0909 000 002",
        email: "",
      }),
    ).toEqual({
      ok: true,
      data: {
        maKh: "KH00000002",
        hoTen: "Trần Thị Bảo Châu",
        cccd: "079202000002",
        sdt: "0909000002",
        email: null,
      },
    });
  });

  it("giu nguyen CCCD va email cua chinh minh thi khong bi coi la trung", async () => {
    const r = await suaKhachHang("KH00000001", {
      hoTen: "Nguyen Hoang Long",
      cccd: "079201000001",
      sdt: "0901234501",
      email: "long.nguyen@example.com",
    });
    expect(r.ok).toBe(true);
  });

  it("CCCD trung khach khac thi tu choi, ho so giu nguyen", async () => {
    expect(
      await suaKhachHang("KH00000002", { hoTen: "X", cccd: "079201000001", sdt: "", email: "" }),
    ).toEqual({ ok: false, loi: "CSDL từ chối: CCCD da co trong ho so KH00000001" });
    expect(await dong("SELECT HoTen FROM KHACH_HANG WHERE MaKH = 'KH00000002'")).toEqual({
      HoTen: "Tran Thi Bao Chau",
    });
  });

  it("ma khach khong ton tai thi tu choi", async () => {
    expect(await suaKhachHang("KH99999999", MOI)).toEqual({
      ok: false,
      loi: "CSDL từ chối: Khach hang khong ton tai",
    });
  });
});
```

- [x] **Step 2: Chạy, xác nhận hỏng vì chưa có module**

Run: `npx vitest run src/lib/thao-tac/khach-hang.test.ts`
Expected: FAIL, `Failed to resolve import "@/lib/thao-tac/khach-hang"`.

- [x] **Step 3: Viết `src/lib/thao-tac/khach-hang.ts`**

```ts
import "server-only";

import { callProcedure, callProcedureOut } from "@/db/procedures";

import { thucHien, type KetQua } from "./ket-qua";

/**
 * Them / sua ho so khach (sp_ThemKhachHang, sp_SuaKhachHang). Chuan hoa (trim,
 * bo khoang trang trong SDT, chu thuong email, rong -> NULL) va moi quy tac
 * (dinh dang, trung CCCD / email) nam trong sp_ChuanHoaKhachHang, app gui
 * nguyen van nguoi dung go.
 */

export type HoSoKhach = { hoTen: string; cccd: string; sdt: string; email: string };

export type KhachDaLuu = {
  maKh: string;
  hoTen: string;
  cccd: string;
  sdt: string | null;
  email: string | null;
};

type DongKhach = { MaKH: string; HoTen: string; CCCD: string; SDT: string | null; Email: string | null };

const sangKhach = (d: DongKhach): KhachDaLuu => ({
  maKh: d.MaKH,
  hoTen: d.HoTen,
  cccd: d.CCCD,
  sdt: d.SDT,
  email: d.Email,
});

export function themKhachHang(v: HoSoKhach): Promise<KetQua<KhachDaLuu>> {
  return thucHien(async () => {
    const { rows } = await callProcedureOut<DongKhach>(
      "sp_ThemKhachHang",
      [v.hoTen, v.cccd, v.sdt, v.email],
      1,
    );
    return sangKhach(rows[0]);
  });
}

export function suaKhachHang(maKh: string, v: HoSoKhach): Promise<KetQua<KhachDaLuu>> {
  return thucHien(async () => {
    const [d] = await callProcedure<DongKhach>("sp_SuaKhachHang", [maKh, v.hoTen, v.cccd, v.sdt, v.email]);
    return sangKhach(d);
  });
}
```

- [x] **Step 4: Chạy, xác nhận hỏng vì CSDL chưa có thủ tục**

Run: `npx vitest run src/lib/thao-tac/khach-hang.test.ts`
Expected: 10 FAIL. Các ca thành công nhận `{ ok: false, loi: "Lỗi CSDL (1305): PROCEDURE QuanLyKhachSan_test.sp_ThemKhachHang does not exist" }`.

- [x] **Step 5: Đọc lại chỗ neo ngay trước khi sửa**

```bash
cd /Users/anhpham/PA/UIT/Demo
set -a; source .env.local; set +a
F6="$QLKS_SCRIPTS_DIR/06_Procedures.sql"; F8="$QLKS_SCRIPTS_DIR/08_Security_Roles.sql"
grep -c "^DROP PROCEDURE IF EXISTS sp_HuyPhieuDat;$" "$F6"
grep -c "^-- THU TUC BAO CAO (muc 4.3), chi doc." "$F6"
grep -c "^-- Mong doi: 12 thu tuc nghiep vu.$" "$F6"
grep -c "^GRANT EXECUTE ON PROCEDURE QuanLyKhachSan.sp_DangNhap TO$" "$F8"
grep -c "sp_ThemKhachHang" "$F6" "$F8"
```

Expected: bốn số `1`, rồi `0` cho cả hai file (chưa sửa). Khác thì **dừng lại, báo người dùng**.

- [x] **Step 6: Lưu script sửa vào `$BK/sua_a_khach_hang.py`**

```python
"""Phan A (spec bo sung nghiep vu muc 3.1): them / sua khach hang.

06: sp_ChuanHoaKhachHang (noi bo), sp_ThemKhachHang, sp_SuaKhachHang.
08: EXECUTE hai thu tuc cong khai cho r_letan.
Dung: python3 sua_a_khach_hang.py "$QLKS_SCRIPTS_DIR"
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vasql import Tep  # noqa: E402

thu_muc = sys.argv[1]

t06 = Tep(thu_muc, "06_Procedures.sql")

t06.chen_sau("DROP PROCEDURE IF EXISTS sp_HuyPhieuDat;\n", """DROP PROCEDURE IF EXISTS sp_ChuanHoaKhachHang;
DROP PROCEDURE IF EXISTS sp_ThemKhachHang;
DROP PROCEDURE IF EXISTS sp_SuaKhachHang;
""")

t06.chen_truoc("-- THU TUC BAO CAO (muc 4.3), chi doc.", """-- Noi bo cua sp_ThemKhachHang / sp_SuaKhachHang: chuan hoa roi kiem mot ho so
-- khach. p_MaKH = NULL khi them moi; khac NULL thi bo qua chinh khach do khi
-- kiem trung. SDT / Email rong thanh NULL: UQ_KHACH_HANG_Email cho nhieu NULL
-- nhung khong cho hai chuoi ''.
CREATE PROCEDURE sp_ChuanHoaKhachHang (
    IN    p_MaKH  CHAR(10),
    INOUT p_HoTen VARCHAR(100),
    INOUT p_CCCD  VARCHAR(20),
    INOUT p_SDT   VARCHAR(20),
    INOUT p_Email VARCHAR(100)
)
SQL SECURITY DEFINER
BEGIN
    DECLARE v_MaTrung  CHAR(10) DEFAULT NULL;
    DECLARE v_ThongBao VARCHAR(128);

    SET p_HoTen = TRIM(p_HoTen);
    SET p_CCCD  = UPPER(TRIM(p_CCCD));
    SET p_SDT   = NULLIF(REGEXP_REPLACE(COALESCE(p_SDT, ''), '[ .-]', ''), '');
    SET p_Email = NULLIF(LOWER(TRIM(p_Email)), '');

    IF p_HoTen IS NULL OR p_HoTen = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Ho ten khach hang khong duoc de trong';
    END IF;

    IF p_CCCD IS NULL OR NOT REGEXP_LIKE(p_CCCD, '^[0-9A-Z]{9,20}$', 'c') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'CCCD / ho chieu phai gom 9-20 chu so hoac chu cai';
    END IF;

    IF p_SDT IS NOT NULL AND NOT REGEXP_LIKE(p_SDT, '^[+]?[0-9]{9,14}$') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'So dien thoai phai gom 9-14 chu so, co the co dau + o dau';
    END IF;

    IF p_Email IS NOT NULL AND NOT REGEXP_LIKE(p_Email, '^[^@ ]+@[^@ ]+[.][^@ ]+$') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email khong dung dinh dang';
    END IF;

    SELECT MaKH INTO v_MaTrung
    FROM   KHACH_HANG
    WHERE  CCCD = p_CCCD
      AND  (p_MaKH IS NULL OR MaKH <> p_MaKH)
    LIMIT  1;

    IF v_MaTrung IS NOT NULL THEN
        SET v_ThongBao = CONCAT('CCCD da co trong ho so ', v_MaTrung);
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_ThongBao;
    END IF;

    IF p_Email IS NOT NULL THEN
        SELECT MaKH INTO v_MaTrung
        FROM   KHACH_HANG
        WHERE  Email = p_Email
          AND  (p_MaKH IS NULL OR MaKH <> p_MaKH)
        LIMIT  1;

        IF v_MaTrung IS NOT NULL THEN
            SET v_ThongBao = CONCAT('Email da co trong ho so ', v_MaTrung);
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_ThongBao;
        END IF;
    END IF;
END$$

CREATE PROCEDURE sp_ThemKhachHang (
    IN  p_HoTen VARCHAR(100),
    IN  p_CCCD  VARCHAR(20),
    IN  p_SDT   VARCHAR(20),
    IN  p_Email VARCHAR(100),
    OUT p_MaKH  CHAR(10)
)
SQL SECURITY DEFINER
BEGIN
    DECLARE v_Next INT;

    SET p_MaKH = NULL;

    CALL sp_ChuanHoaKhachHang(NULL, p_HoTen, p_CCCD, p_SDT, p_Email);

    SELECT COALESCE(MAX(CAST(SUBSTRING(MaKH, 3) AS UNSIGNED)), 0) + 1
    INTO   v_Next
    FROM   KHACH_HANG;

    SET p_MaKH = CONCAT('KH', LPAD(v_Next, 8, '0'));

    INSERT INTO KHACH_HANG (MaKH, HoTen, CCCD, SDT, Email)
    VALUES (p_MaKH, p_HoTen, p_CCCD, p_SDT, p_Email);

    SELECT MaKH, HoTen, CCCD, SDT, Email
    FROM   KHACH_HANG
    WHERE  MaKH = p_MaKH;
END$$

CREATE PROCEDURE sp_SuaKhachHang (
    IN p_MaKH  CHAR(10),
    IN p_HoTen VARCHAR(100),
    IN p_CCCD  VARCHAR(20),
    IN p_SDT   VARCHAR(20),
    IN p_Email VARCHAR(100)
)
SQL SECURITY DEFINER
BEGIN
    IF NOT EXISTS (SELECT 1 FROM KHACH_HANG WHERE MaKH = p_MaKH) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Khach hang khong ton tai';
    END IF;

    CALL sp_ChuanHoaKhachHang(p_MaKH, p_HoTen, p_CCCD, p_SDT, p_Email);

    UPDATE KHACH_HANG
    SET    HoTen = p_HoTen,
           CCCD  = p_CCCD,
           SDT   = p_SDT,
           Email = p_Email
    WHERE  MaKH = p_MaKH;

    SELECT MaKH, HoTen, CCCD, SDT, Email
    FROM   KHACH_HANG
    WHERE  MaKH = p_MaKH;
END$$

""")

t06.thay("""-- Mong doi: 12 thu tuc nghiep vu.
SELECT ROUTINE_NAME
FROM   information_schema.ROUTINES
WHERE  ROUTINE_SCHEMA = 'QuanLyKhachSan' AND ROUTINE_TYPE = 'PROCEDURE'
  AND  ROUTINE_NAME IN ('sp_DangNhap', 'sp_TraCuuPhongTrong', 'sp_DatPhong',
                       'sp_XacNhanDatCoc', 'sp_NhanPhong', 'sp_GhiNhanDichVu',
                       'sp_LapHoaDon', 'sp_ThanhToanHoaDon', 'sp_TraPhong',
                       'sp_GhiNhanDonPhong', 'sp_GhiNhanSuaPhong', 'sp_HuyPhieuDat')
ORDER  BY ROUTINE_NAME;
""", """-- Mong doi: 12 thu tuc nghiep vu.
SELECT ROUTINE_NAME
FROM   information_schema.ROUTINES
WHERE  ROUTINE_SCHEMA = 'QuanLyKhachSan' AND ROUTINE_TYPE = 'PROCEDURE'
  AND  ROUTINE_NAME IN ('sp_DangNhap', 'sp_TraCuuPhongTrong', 'sp_DatPhong',
                       'sp_XacNhanDatCoc', 'sp_NhanPhong', 'sp_GhiNhanDichVu',
                       'sp_LapHoaDon', 'sp_ThanhToanHoaDon', 'sp_TraPhong',
                       'sp_GhiNhanDonPhong', 'sp_GhiNhanSuaPhong', 'sp_HuyPhieuDat')
ORDER  BY ROUTINE_NAME;

-- Mong doi: thu tuc bo sung (khach hang, buong phong, bang gia).
SELECT ROUTINE_NAME
FROM   information_schema.ROUTINES
WHERE  ROUTINE_SCHEMA = 'QuanLyKhachSan' AND ROUTINE_TYPE = 'PROCEDURE'
  AND  ROUTINE_NAME IN ('sp_ChuanHoaKhachHang', 'sp_ThemKhachHang',
                       'sp_SuaKhachHang')
ORDER  BY ROUTINE_NAME;
""")

t06.luu()

t08 = Tep(thu_muc, "08_Security_Roles.sql")
t08.chen_truoc("GRANT EXECUTE ON PROCEDURE QuanLyKhachSan.sp_DangNhap TO\n", """-- Them / sua ho so khach (sp_ChuanHoaKhachHang la noi bo, khong cap).
GRANT EXECUTE ON PROCEDURE QuanLyKhachSan.sp_ThemKhachHang TO r_letan;
GRANT EXECUTE ON PROCEDURE QuanLyKhachSan.sp_SuaKhachHang  TO r_letan;

""")
t08.luu()
```

- [x] **Step 7: Sửa `06` và `08`, đối chiếu với bản sao lưu**

```bash
python3 "$BK/sua_a_khach_hang.py" "$QLKS_SCRIPTS_DIR"
diff "$BK/goc/06_Procedures.sql" "$QLKS_SCRIPTS_DIR/06_Procedures.sql" | grep -c '^[<>]'
diff "$BK/goc/08_Security_Roles.sql" "$QLKS_SCRIPTS_DIR/08_Security_Roles.sql" | grep -c '^[<>]'
file "$QLKS_SCRIPTS_DIR/06_Procedures.sql" "$QLKS_SCRIPTS_DIR/08_Security_Roles.sql"
```

Expected: `Da sua 06_Procedures.sql: 3 doan`, `Da sua 08_Security_Roles.sql: 1 doan`, `132`, `4`, cả hai file `ASCII text`.

- [x] **Step 8: Chạy lại** (globalSetup dựng lại CSDL kiểm thử từ `06` mới)

Run: `npx vitest run src/lib/thao-tac/khach-hang.test.ts` → Expected: `Tests 10 passed`.
Run: `npm test` → Expected: `Test Files 33 passed`, `Tests 196 passed`.

- [x] **Step 9: Commit**

```bash
git add src/lib/thao-tac/khach-hang.ts src/lib/thao-tac/khach-hang.test.ts
git commit -m "feat: them / sua khach hang goi sp_ThemKhachHang, sp_SuaKhachHang

06_Procedures.sql, 08_Security_Roles.sql (Scripts/, ngoai git) sua cung luc:
sp_ChuanHoaKhachHang (noi bo) chuan hoa va kiem trung CCCD / email.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Tìm khách theo họ tên, SĐT, CCCD

**Files:**
- Modify: `src/lib/queries/customers.ts`
- Test: `src/lib/queries/customers.test.ts`

**Interfaces:**
- Consumes: `db`, `schema.khachHang`.
- Produces:
  - `export type KhachTimThay = { maKh: string; hoTen: string; cccd: string; sdt: string | null; email: string | null; soLanLuuTru: number }`
  - `timKhachHang(q: string): Promise<KhachTimThay[]>`, tối đa 10 dòng:
    - `q` rỗng: 10 khách mã lớn nhất;
    - họ tên so `COLLATE utf8mb4_0900_ai_ci` (không phân biệt dấu, Đ = D);
    - SĐT / CCCD so với `q` đã bỏ khoảng trắng, `.`, `-`;
    - trùng khít CCCD hoặc SĐT xếp đầu.
  - `soLanLuuTru` dùng chung một subquery với `getDanhSachKhachHang`.

- [x] **Step 1: Thêm test hỏng vào cuối `src/lib/queries/customers.test.ts`**

Sửa dòng import thành:

```ts
import { getDanhSachKhachHang, getThongKeKhachHang, timKhachHang } from "@/lib/queries/customers";
```

Thêm vào cuối file:

```ts
describe("timKhachHang", () => {
  it("tu khoa rong: 10 khach moi nhat theo ma", async () => {
    expect((await timKhachHang("  ")).map((k) => k.maKh)).toEqual([
      "KH00000060", "KH00000059", "KH00000058", "KH00000057", "KH00000056",
      "KH00000055", "KH00000054", "KH00000053", "KH00000052", "KH00000051",
    ]);
  });

  // Review Focus #1
  it("ho ten go co dau van ra ban khong dau, ke ca chu Đ", async () => {
    expect(await timKhachHang("Đặng Thùy")).toEqual([
      {
        maKh: "KH00000006",
        hoTen: "Dang Thuy Linh",
        cccd: "079206000006",
        sdt: "0901234506",
        email: "linh.dang@example.com",
        soLanLuuTru: 1,
      },
    ]);
    const nguyen = await timKhachHang("nguyễn");
    expect(nguyen).toHaveLength(6);
    expect(nguyen.every((k) => k.hoTen.startsWith("Nguyen"))).toBe(true);
  });

  it("SDT go co khoang trang / dau cham; CCCD, ma khach trung khit xep dau", async () => {
    expect((await timKhachHang("0901 234.506")).map((k) => k.maKh)).toEqual(["KH00000006"]);
    expect((await timKhachHang("079206000006"))[0].maKh).toBe("KH00000006");
    expect((await timKhachHang("KH00000006"))[0].maKh).toBe("KH00000006");
  });

  // Review Focus #1
  it("ky tu dac biet cua LIKE khong tra ca bang", async () => {
    expect(await timKhachHang("%")).toEqual([]);
    expect(await timKhachHang("_")).toEqual([]);
    expect(await timKhachHang("-")).toEqual([]);
  });

  it("toi da 10 dong", async () => {
    expect(await timKhachHang("0901")).toHaveLength(10);
  });
});
```

- [x] **Step 2: Chạy, xác nhận hỏng**

Run: `npx vitest run src/lib/queries/customers.test.ts`
Expected: 5 FAIL mới, `timKhachHang is not a function`. 5 test cũ vẫn pass.

- [x] **Step 3: Sửa `src/lib/queries/customers.ts`**

Sửa import đầu file thành:

```ts
import { asc, desc, like, or, sql } from "drizzle-orm";
```

Ngay dưới dòng `const kh = schema.khachHang;`, thêm:

```ts
// Chi tinh la mot lan luu tru khi khach thuc su den o (dang o hoac da xong).
// Dung chung cho bang khach hang va o tim khach cua form dat phong.
const SO_LAN_LUU_TRU = sql<number>`(
  SELECT COUNT(*) FROM PHIEU_DAT_PHONG p
  WHERE  p.MaKH = KHACH_HANG.MaKH AND p.TrangThai IN ('DangO', 'HoanTat'))`.mapWith(Number);
```

Trong `getDanhSachKhachHang`, thay khối:

```ts
      // Chi tinh la mot lan luu tru khi khach thuc su den o (dang o hoac da xong).
      soLanLuuTru: sql<number>`(
        SELECT COUNT(*) FROM PHIEU_DAT_PHONG p
        WHERE  p.MaKH = KHACH_HANG.MaKH AND p.TrangThai IN ('DangO', 'HoanTat'))`.mapWith(Number),
```

bằng:

```ts
      soLanLuuTru: SO_LAN_LUU_TRU,
```

Thêm vào cuối file:

```ts
export type KhachTimThay = {
  maKh: string;
  hoTen: string;
  cccd: string;
  sdt: string | null;
  email: string | null;
  soLanLuuTru: number;
};

/** Boc %...% sau khi escape ky tu dac biet cua LIKE (\ % _), de go "%" khong ra ca bang. */
function chuaChuoi(s: string): string {
  return `%${s.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/**
 * O tim khach cua form dat phong: toi da 10 khach khop ho ten, ma khach, SDT
 * hoac CCCD. Ho ten so bang utf8mb4_0900_ai_ci vi collation cua cot
 * (utf8mb4_unicode_ci) coi "e" = "e" nhung KHONG coi "Đ" = "D", nen go "Đặng"
 * khong ra "Dang". SDT / CCCD so voi tu khoa da bo khoang trang, dau cham,
 * gach ngang; trung khit xep dau. Tu khoa rong: 10 khach moi nhat.
 */
export async function timKhachHang(q: string): Promise<KhachTimThay[]> {
  const tu = q.trim();
  const so = tu.replace(/[\s.-]/g, "");
  const chon = db
    .select({
      maKh: kh.maKh,
      hoTen: kh.hoTen,
      cccd: kh.cccd,
      sdt: kh.sdt,
      email: kh.email,
      soLanLuuTru: SO_LAN_LUU_TRU,
    })
    .from(kh);

  if (tu === "") return chon.orderBy(desc(kh.maKh)).limit(10);

  const dieuKien = [
    sql`${kh.hoTen} COLLATE utf8mb4_0900_ai_ci LIKE ${chuaChuoi(tu)}`,
    like(kh.maKh, chuaChuoi(tu)),
  ];
  // Tu khoa chi toan dau cham / gach thi `so` rong: bo qua, khong thi LIKE '%%' ra ca bang.
  if (so !== "") dieuKien.push(like(kh.cccd, chuaChuoi(so)), like(kh.sdt, chuaChuoi(so)));

  return chon
    .where(or(...dieuKien))
    .orderBy(sql`(${kh.cccd} = ${so} OR ${kh.sdt} = ${so}) DESC`, asc(kh.hoTen), asc(kh.maKh))
    .limit(10);
}
```

- [x] **Step 4: Chạy lại, kiểm kiểu, lint**

Run: `npx vitest run src/lib/queries/customers.test.ts` → Expected: `Tests 10 passed`.
Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi. Nếu `tsc` báo thiếu `PageProps` / `LayoutProps`, chạy `npx next typegen` rồi chạy lại.

- [x] **Step 5: Commit**

```bash
git add src/lib/queries/customers.ts src/lib/queries/customers.test.ts
git commit -m "feat: timKhachHang tim theo ho ten khong dau, SDT, CCCD

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 3: Server Action khách hàng, form thêm / sửa, trang Khách hàng

**Files:**
- Create: `src/app/(app)/customers/actions.ts`, `src/components/customers/khach-hang-form.tsx`
- Modify: `src/components/customers/customer-table.tsx`
- Test: `src/app/(app)/customers/actions.test.ts`

**Interfaces:**
- Consumes: `themKhachHang`, `suaKhachHang`, `KhachDaLuu` (Task 1); `timKhachHang` (Task 2); `laMa`, `laChuoi`, `khongHopLe` (`kiem-tra.ts`); `thucHien`; `lamMoiNeuXong`; `ThongBao`, `useThaoTac`.
- Produces:
  - Server Action (tham số kiểu `unknown`):
    - `themKhachHang(hoTen, cccd, sdt, email)`
    - `suaKhachHang(maKh, hoTen, cccd, sdt, email)`
    - `timKhach(q)`: trả `KetQua<KhachTimThay[]>`, không `refresh()`.
  - `<KhachHangForm ban? khiXong? khiDong? />`. Có `ban: KhachDaLuu` là form sửa. `khiXong(k: KhachDaLuu)` được gọi sau khi lưu thành công. Các ô có `name` là `hoTen`, `cccd`, `sdt`, `email`.
  - Bảng khách có nút "Thêm khách hàng" ở đầu thẻ và nút "Sửa" ở mỗi dòng.
  - Sắp xếp "Mới cập nhật" đổi sang mã giảm dần, để khách vừa thêm hiện ở đầu bảng.

- [x] **Step 1: Viết test hỏng `src/app/(app)/customers/actions.test.ts`**

```ts
import { describe, expect, it } from "vitest";

import { suaKhachHang, themKhachHang, timKhach } from "@/app/(app)/customers/actions";

// Review Focus #5: Server Action la diem vao ai cung POST toi duoc.
describe("Server Action khach hang: tham so sai hinh thuc", () => {
  it("tu choi truoc khi cham CSDL", async () => {
    await expect(themKhachHang({ $ne: "" }, "079299000061", "", "")).resolves.toEqual({
      ok: false,
      loi: "Họ tên không hợp lệ",
    });
    await expect(themKhachHang("A", ["079299000061"], "", "")).resolves.toEqual({
      ok: false,
      loi: "CCCD / hộ chiếu không hợp lệ",
    });
    await expect(themKhachHang("A", "079299000061", "0".repeat(21), "")).resolves.toEqual({
      ok: false,
      loi: "Số điện thoại không hợp lệ",
    });
    await expect(themKhachHang("A", "079299000061", "", 5)).resolves.toEqual({
      ok: false,
      loi: "Email không hợp lệ",
    });
    await expect(suaKhachHang("KH1", "A", "079299000061", "", "")).resolves.toEqual({
      ok: false,
      loi: "Mã khách hàng không hợp lệ",
    });
    await expect(timKhach({ q: "Nguyen" })).resolves.toEqual({
      ok: false,
      loi: "Từ khóa tìm kiếm không hợp lệ",
    });
  });

  it("timKhach hop le thi tra ket qua, khong refresh", async () => {
    const r = await timKhach("Đặng Thùy");
    expect(r).toMatchObject({ ok: true, data: [{ maKh: "KH00000006" }] });
  });
});
```

- [x] **Step 2: Chạy, xác nhận hỏng**

Run: `npx vitest run "src/app/(app)/customers/actions.test.ts"`
Expected: FAIL, `Failed to resolve import "@/app/(app)/customers/actions"`.

- [x] **Step 3: Viết `src/app/(app)/customers/actions.ts`**

```ts
"use server";

import { lamMoiNeuXong } from "@/lib/lam-moi";
import { timKhachHang } from "@/lib/queries/customers";
import { thucHien } from "@/lib/thao-tac/ket-qua";
import * as khachHang from "@/lib/thao-tac/khach-hang";
import { khongHopLe, laChuoi, laMa } from "@/lib/thao-tac/kiem-tra";

/**
 * Them / sua ho so khach (trang Khach hang, buoc 1 cua form dat phong) va o
 * tim khach. Chi kiem kieu va do dai cot; dinh dang CCCD / SDT / email va trung
 * ho so do sp_ChuanHoaKhachHang quyet dinh. SDT cho toi 20 ky tu vi con khoang
 * trang, thu tuc bo di roi moi kiem.
 */
function docHoSo(
  hoTen: unknown,
  cccd: unknown,
  sdt: unknown,
  email: unknown,
): khachHang.HoSoKhach | { ok: false; loi: string } {
  if (!laChuoi(hoTen, 100)) return khongHopLe("Họ tên");
  if (!laChuoi(cccd, 20)) return khongHopLe("CCCD / hộ chiếu");
  if (!laChuoi(sdt, 20)) return khongHopLe("Số điện thoại");
  if (!laChuoi(email, 100)) return khongHopLe("Email");
  return { hoTen, cccd, sdt, email };
}

export async function themKhachHang(hoTen: unknown, cccd: unknown, sdt: unknown, email: unknown) {
  const v = docHoSo(hoTen, cccd, sdt, email);
  if ("ok" in v) return v;
  return lamMoiNeuXong(await khachHang.themKhachHang(v));
}

export async function suaKhachHang(
  maKh: unknown,
  hoTen: unknown,
  cccd: unknown,
  sdt: unknown,
  email: unknown,
) {
  if (!laMa(maKh, "KH")) return khongHopLe("Mã khách hàng");
  const v = docHoSo(hoTen, cccd, sdt, email);
  if ("ok" in v) return v;
  return lamMoiNeuXong(await khachHang.suaKhachHang(maKh, v));
}

/** O tim khach cua form dat phong: chi doc, nen khong refresh(). */
export async function timKhach(q: unknown) {
  if (!laChuoi(q, 100)) return khongHopLe("Từ khóa tìm kiếm");
  return thucHien(() => timKhachHang(q));
}
```

- [x] **Step 4: Chạy lại**

Run: `npx vitest run "src/app/(app)/customers/actions.test.ts"` → Expected: `Tests 2 passed`.

- [x] **Step 5: Viết `src/components/customers/khach-hang-form.tsx`**

```tsx
"use client";

import { useId, useState } from "react";

import { suaKhachHang, themKhachHang } from "@/app/(app)/customers/actions";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";
import type { KhachDaLuu } from "@/lib/thao-tac/khach-hang";

/**
 * Form them / sua mot ho so khach. Co `ban` thi la form sua (ma khach chi doc),
 * khong thi la form them. Moi quy tac (dinh dang CCCD / SDT / email, trung ho
 * so) do sp_ChuanHoaKhachHang quyet dinh; loi cua CSDL hien ngay duoi nut.
 * `khiXong` nhan ho so da luu: form dat phong dung de chon luon khach vua tao.
 */
export function KhachHangForm({
  ban,
  khiXong,
  khiDong,
}: {
  ban?: KhachDaLuu;
  khiXong?: (k: KhachDaLuu) => void;
  khiDong?: () => void;
}) {
  const id = useId();
  const [hoTen, setHoTen] = useState(ban?.hoTen ?? "");
  const [cccd, setCccd] = useState(ban?.cccd ?? "");
  const [sdt, setSdt] = useState(ban?.sdt ?? "");
  const [email, setEmail] = useState(ban?.email ?? "");
  const tt = useThaoTac();

  const luu = () =>
    tt.chay(
      () =>
        ban
          ? suaKhachHang(ban.maKh, hoTen, cccd, sdt, email)
          : themKhachHang(hoTen, cccd, sdt, email),
      (k) => {
        khiXong?.(k);
        if (ban) return `Đã lưu hồ sơ ${k.maKh} · ${k.hoTen}.`;
        setHoTen("");
        setCccd("");
        setSdt("");
        setEmail("");
        return `Đã thêm khách ${k.hoTen} · ${k.maKh}.`;
      },
    );

  const o = "border-input bg-card h-10 rounded-[10px] border px-3 text-[13px]";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        luu();
      }}
      aria-label={ban ? `Sửa hồ sơ ${ban.maKh}` : "Thêm khách hàng"}
      className="border-border flex flex-col gap-3 rounded-[10px] border p-4"
    >
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Truong id={`${id}-ten`} nhan="Họ tên *">
          <input id={`${id}-ten`} name="hoTen" required maxLength={100} value={hoTen}
            onChange={(e) => setHoTen(e.target.value)} className={o} />
        </Truong>
        <Truong id={`${id}-cccd`} nhan="CCCD / hộ chiếu *">
          <input id={`${id}-cccd`} name="cccd" required maxLength={20} value={cccd}
            onChange={(e) => setCccd(e.target.value)} className={`${o} font-mono`} />
        </Truong>
        <Truong id={`${id}-sdt`} nhan="Số điện thoại">
          <input id={`${id}-sdt`} name="sdt" inputMode="tel" maxLength={20} value={sdt}
            onChange={(e) => setSdt(e.target.value)} className={`${o} font-mono`} />
        </Truong>
        <Truong id={`${id}-email`} nhan="Email">
          <input id={`${id}-email`} name="email" type="email" maxLength={100} value={email}
            onChange={(e) => setEmail(e.target.value)} className={o} />
        </Truong>
      </div>
      <div className="flex items-center gap-3">
        {ban ? <span className="text-muted-foreground font-mono text-[12px]">{ban.maKh}</span> : null}
        <span className="flex-grow" />
        {khiDong ? (
          <button type="button" onClick={khiDong} className="text-muted-foreground h-10 px-3 text-[13px]">
            Đóng
          </button>
        ) : null}
        <button
          type="submit"
          disabled={tt.dangChay}
          className="bg-primary text-primary-foreground h-10 rounded-[10px] px-5 text-[13px] font-semibold disabled:opacity-45"
        >
          {tt.dangChay ? "Đang lưu…" : ban ? "Lưu thay đổi" : "Lưu khách hàng"}
        </button>
      </div>
      <ThongBao tb={tt.thongBao} />
    </form>
  );
}

function Truong({ id, nhan, children }: { id: string; nhan: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label htmlFor={id} className="text-muted-foreground text-[12px]">
        {nhan}
      </label>
      {children}
    </div>
  );
}
```

- [x] **Step 6: Sửa `src/components/customers/customer-table.tsx`**

Thay 5 dòng import đầu file (từ `import { useMemo, useState } from "react";` tới `import type { KhachHangTrenBang } …`) bằng:

```tsx
import { useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";

import { KhachHangForm } from "@/components/customers/khach-hang-form";
import { EmptyState } from "@/components/shared/empty-state";
import { formatVnd } from "@/lib/format";
import type { KhachHangTrenBang } from "@/lib/queries/customers";
```

Ngay dưới khối `const TAB: …[] = [ … ];`, thêm:

```tsx
/** Form dang mo ngay trong the: them moi, sua mot khach, hoac khong mo. */
type Form = { cheDo: "them" } | { cheDo: "sua"; khach: KhachHangTrenBang } | null;
```

Thay chú thích và ba dòng đầu thân hàm:

```tsx
/** Bang khach hang co loc theo tab va sap xep, theo design/Customers.dc.html. */
export function CustomerTable({ khach }: { khach: KhachHangTrenBang[] }) {
  const [tab, setTab] = useState<Tab>("TatCa");
  const [sapXep, setSapXep] = useState<SapXep>("MoiCapNhat");
```

bằng:

```tsx
/**
 * Bang khach hang co loc theo tab va sap xep, theo design/Customers.dc.html.
 * Nut "Them khach hang" (mockup dat o topbar) nam o dau the de dung chung state
 * voi bang; "Sua" o moi dong mo cung form, dien san ho so.
 */
export function CustomerTable({ khach }: { khach: KhachHangTrenBang[] }) {
  const [tab, setTab] = useState<Tab>("TatCa");
  const [sapXep, setSapXep] = useState<SapXep>("MoiCapNhat");
  const [form, setForm] = useState<Form>(null);
```

Thay dòng sắp xếp mặc định:

```tsx
      return a.maKh.localeCompare(b.maKh);
```

bằng (ma lon hon la ho so moi tao hon):

```tsx
      return b.maKh.localeCompare(a.maKh);
```

Thay khối `</select>\n      </div>` ở cuối phần đầu thẻ, tức ô chọn sắp xếp:

```tsx
          <option value="LuuTruNhieu">Số lần lưu trú nhiều nhất</option>
        </select>
      </div>
```

bằng:

```tsx
          <option value="LuuTruNhieu">Số lần lưu trú nhiều nhất</option>
        </select>
        <button
          type="button"
          onClick={() => setForm(form?.cheDo === "them" ? null : { cheDo: "them" })}
          aria-pressed={form?.cheDo === "them"}
          className="bg-primary text-primary-foreground flex h-[30px] items-center gap-[6px] rounded-lg px-[13px] text-[12.5px] font-semibold"
        >
          <Plus size={14} strokeWidth={2} />
          Thêm khách hàng
        </button>
      </div>

      {form ? (
        <KhachHangForm
          key={form.cheDo === "sua" ? form.khach.maKh : "them"}
          ban={form.cheDo === "sua" ? form.khach : undefined}
          khiDong={() => setForm(null)}
        />
      ) : null}
```

Thay ô tiêu đề cột cuối:

```tsx
              <th className="border-border bg-card sticky top-0 border-b pb-[9px] font-semibold">
                Trạng thái
              </th>
            </tr>
```

bằng:

```tsx
              <th className="border-border bg-card sticky top-0 border-b pb-[9px] font-semibold">
                Trạng thái
              </th>
              <th className="border-border bg-card sticky top-0 border-b pb-[9px]">
                <span className="sr-only">Thao tác</span>
              </th>
            </tr>
```

Thay phần cuối của mỗi dòng:

```tsx
                  ) : (
                    <span className="text-muted-foreground text-[12px]">—</span>
                  )}
                </td>
              </tr>
```

bằng:

```tsx
                  ) : (
                    <span className="text-muted-foreground text-[12px]">—</span>
                  )}
                </td>
                <td className="border-border border-b py-[11px] text-right">
                  <button
                    type="button"
                    onClick={() => setForm({ cheDo: "sua", khach: k })}
                    aria-label={`Sửa hồ sơ ${k.hoTen}`}
                    className="text-primary inline-flex items-center gap-[5px] text-[12.5px] font-semibold"
                  >
                    <Pencil size={13} strokeWidth={2} />
                    Sửa
                  </button>
                </td>
              </tr>
```

- [x] **Step 7: Kiểm kiểu, lint, cả bộ test**

Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.
Run: `npm test` → Expected: `Test Files 34 passed`, `Tests 203 passed`.

- [x] **Step 8: Commit**

```bash
git add "src/app/(app)/customers" src/components/customers
git commit -m "feat: them / sua khach hang ngay tren trang Khach hang

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Form đặt phòng: tìm khách hoặc tạo khách mới ngay tại chỗ

**Files:**
- Create: `src/components/bookings/chon-khach.tsx`
- Modify: `src/components/bookings/booking-form.tsx`, `src/app/(app)/bookings/new/page.tsx`

**Interfaces:**
- Consumes: Server Action `timKhach` (Task 3); `KhachHangForm` (Task 3); `KhachTimThay` (Task 2).
- Produces:
  - `<ChonKhach khach onChon />`: nút chuyển "Khách đã có | Khách mới". Ô tìm `#timkh` có `role="combobox"`, listbox kết quả, phím ↑ ↓ Enter Esc. Có thẻ khách đã chọn kèm "Đổi khách".
  - `BookingForm` bỏ prop `khach`. Mặc định chưa chọn khách, nút "Lập phiếu đặt phòng" khóa tới khi chọn.

Không có test tự động cho component (repo chưa có hạ tầng test UI). Logic tìm khách đã test ở Task 2–3. Tương tác kiểm trên trình duyệt ở Task 16.

- [x] **Step 1: Viết `src/components/bookings/chon-khach.tsx`**

```tsx
"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { Search } from "lucide-react";

import { timKhach } from "@/app/(app)/customers/actions";
import { KhachHangForm } from "@/components/customers/khach-hang-form";
import type { KhachTimThay } from "@/lib/queries/customers";

type CheDo = "co" | "moi";

/**
 * Buoc 1 cua form dat phong, theo design/Booking.dc.html dong 73-103. "Khach da
 * co" tim theo ho ten / SDT / CCCD (timKhach, 250 ms sau lan go cuoi); "Khach
 * moi" tao ho so ngay tai cho roi chon luon khach vua tao.
 */
export function ChonKhach({
  khach,
  onChon,
}: {
  khach: KhachTimThay | null;
  onChon: (k: KhachTimThay | null) => void;
}) {
  const [cheDo, setCheDo] = useState<CheDo>("co");

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Loại khách" className="bg-background flex gap-1 self-start rounded-[9px] p-[3px]">
        {([
          ["co", "Khách đã có"],
          ["moi", "Khách mới"],
        ] as const).map(([k, nhan]) => (
          <button
            key={k}
            type="button"
            onClick={() => setCheDo(k)}
            aria-pressed={cheDo === k}
            className={`h-[30px] rounded-[7px] px-[14px] text-[12.5px] ${
              cheDo === k ? "bg-card text-foreground font-semibold" : "text-muted-foreground"
            }`}
          >
            {nhan}
          </button>
        ))}
      </div>

      {cheDo === "moi" ? (
        <KhachHangForm
          khiXong={(k) => {
            onChon({ ...k, soLanLuuTru: 0 });
            setCheDo("co");
          }}
        />
      ) : khach ? (
        <TheKhach khach={khach} onDoi={() => onChon(null)} />
      ) : (
        <TimKhach onChon={onChon} onTaoMoi={() => setCheDo("moi")} />
      )}
    </div>
  );
}

function TheKhach({ khach: k, onDoi }: { khach: KhachTimThay; onDoi: () => void }) {
  const chuCai = k.hoTen
    .split(" ")
    .slice(-2)
    .map((t) => t[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex items-center gap-[14px] rounded-[11px] border border-[#C9E2D5] bg-[#F1F7F4] px-4 py-[14px]">
      <span className="bg-primary font-display flex size-[42px] shrink-0 items-center justify-center rounded-full text-[16px] font-semibold text-white">
        {chuCai}
      </span>
      <div className="flex flex-grow flex-col gap-[3px]">
        <div className="flex items-center gap-[9px]">
          <span className="text-[14.5px] font-semibold">{k.hoTen}</span>
          <span className="rounded-full bg-[#E3F0E9] px-2 py-[2px] text-[11px] font-semibold text-[#14664B]">
            {k.soLanLuuTru > 0 ? `Đã lưu trú ${k.soLanLuuTru} lần` : "Chưa lưu trú lần nào"}
          </span>
        </div>
        <span className="font-mono text-[12.5px] text-[#57504A]">
          {k.maKh} · CCCD {k.cccd}
          {k.sdt ? ` · ${k.sdt}` : ""}
        </span>
      </div>
      <button
        type="button"
        onClick={onDoi}
        className="h-[34px] rounded-lg border border-[#C9E2D5] bg-white px-[14px] text-[12.5px] font-semibold text-[#14483F]"
      >
        Đổi khách
      </button>
    </div>
  );
}

function TimKhach({
  onChon,
  onTaoMoi,
}: {
  onChon: (k: KhachTimThay) => void;
  onTaoMoi: () => void;
}) {
  const id = useId();
  const [q, setQ] = useState("");
  const [ketQua, setKetQua] = useState<KhachTimThay[]>([]);
  const [mo, setMo] = useState(false);
  const [chiSo, setChiSo] = useState(0);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangTim, chuyenTiep] = useTransition();

  // Tim lai 250 ms sau lan go cuoi. Ket qua cua lan go cu tra ve muon thi bo.
  // Tu khoa rong cung tim: may chu tra 10 khach moi nhat, hien khi bam vao o.
  useEffect(() => {
    let conHieuLuc = true;
    const hen = setTimeout(() => {
      chuyenTiep(async () => {
        const r = await timKhach(q);
        if (!conHieuLuc) return;
        if (r.ok) {
          setKetQua(r.data);
          setChiSo(0);
          setLoi(null);
        } else {
          setLoi(r.loi);
        }
      });
    }, 250);
    return () => {
      conHieuLuc = false;
      clearTimeout(hen);
    };
  }, [q]);

  const ds = `${id}-ds`;
  const dangChon = mo ? ketQua[chiSo] : undefined;
  const chon = (k: KhachTimThay) => {
    setMo(false);
    onChon(k);
  };

  return (
    <div className="relative flex flex-col gap-2">
      <div className="bg-muted border-border flex h-11 items-center gap-[9px] rounded-[10px] border px-[14px]">
        <Search size={16} strokeWidth={1.9} className="shrink-0 text-[#857C73]" />
        <label htmlFor="timkh" className="sr-only">
          Tìm khách hàng
        </label>
        <input
          id="timkh"
          type="search"
          role="combobox"
          aria-expanded={mo && ketQua.length > 0}
          aria-controls={ds}
          aria-autocomplete="list"
          aria-activedescendant={dangChon ? `${id}-${dangChon.maKh}` : undefined}
          autoComplete="off"
          placeholder="Nhập CCCD, số điện thoại hoặc họ tên…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setMo(true);
          }}
          onFocus={() => setMo(true)}
          onBlur={() => setMo(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setMo(true);
              setChiSo((i) => Math.min(i + 1, ketQua.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setChiSo((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && dangChon) {
              e.preventDefault();
              chon(dangChon);
            } else if (e.key === "Escape") {
              setMo(false);
            }
          }}
          className="text-foreground min-w-0 flex-grow border-0 bg-transparent text-[13.5px] outline-none"
        />
        {dangTim ? <span className="text-muted-foreground text-[11.5px]">Đang tìm…</span> : null}
      </div>

      {mo && ketQua.length > 0 ? (
        <ul
          id={ds}
          role="listbox"
          aria-label="Khách hàng tìm thấy"
          className="bg-card border-border absolute inset-x-0 top-[48px] z-10 m-0 flex max-h-[320px] list-none flex-col overflow-auto rounded-[10px] border p-1 shadow-lg"
        >
          {ketQua.map((k, i) => (
            <li
              key={k.maKh}
              id={`${id}-${k.maKh}`}
              role="option"
              aria-selected={i === chiSo}
              onMouseDown={(e) => {
                e.preventDefault();
                chon(k);
              }}
              onMouseEnter={() => setChiSo(i)}
              className={`flex cursor-pointer flex-col gap-px rounded-lg px-3 py-2 ${i === chiSo ? "bg-accent" : ""}`}
            >
              <span className="text-[13px] font-medium">{k.hoTen}</span>
              <span className="text-muted-foreground font-mono text-[11.5px]">
                {k.maKh} · CCCD {k.cccd}
                {k.sdt ? ` · ${k.sdt}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {q.trim() !== "" && ketQua.length === 0 && !dangTim ? (
        <p className="text-muted-foreground m-0 text-[12.5px]">
          Không tìm thấy khách nào.{" "}
          <button type="button" onClick={onTaoMoi} className="text-primary font-semibold">
            Tạo hồ sơ khách mới
          </button>
        </p>
      ) : null}
      {loi ? (
        <p role="alert" className="m-0 text-[12.5px] text-[#8C3A31]">
          {loi}
        </p>
      ) : null}
    </div>
  );
}
```

- [x] **Step 2: Sửa `src/components/bookings/booking-form.tsx`**

Thay:

```tsx
import { datPhong, traCuuPhongTrong } from "@/app/(app)/bookings/new/actions";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";
import { formatVnd } from "@/lib/format";
```

bằng:

```tsx
import { datPhong, traCuuPhongTrong } from "@/app/(app)/bookings/new/actions";
import { ChonKhach } from "@/components/bookings/chon-khach";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";
import { formatVnd } from "@/lib/format";
import type { KhachTimThay } from "@/lib/queries/customers";
```

Xóa dòng (và dòng trống ngay sau nó):

```tsx
type Khach = { maKh: string; hoTen: string; cccd: string; sdt: string | null };
```

Thay:

```tsx
export function BookingForm({
  loaiPhong: loaiPhongBanDau,
  khach,
  ngayMacDinh,
}: {
  loaiPhong: LoaiPhong[];
  khach: Khach[];
  ngayMacDinh: string;
}) {
```

bằng:

```tsx
export function BookingForm({
  loaiPhong: loaiPhongBanDau,
  ngayMacDinh,
}: {
  loaiPhong: LoaiPhong[];
  ngayMacDinh: string;
}) {
```

Thay `  const [maKh, setMaKh] = useState(khach[0]?.maKh ?? "");` bằng:

```tsx
  // Chua chon khach thi chua lap phieu duoc: truoc day form tu chon khach dau
  // tien, de lap nham phieu cho nguoi khac.
  const [khach, setKhach] = useState<KhachTimThay | null>(null);
```

Xóa dòng `  const khachDaChon = khach.find((k) => k.maKh === maKh);`.

Thay cả khối `<Buoc so={1} tieuDe="Thông tin khách hàng">` … `</Buoc>` đầu tiên (từ `<label htmlFor="kh"` tới hết thẻ `khachDaChon`) bằng:

```tsx
        <Buoc so={1} tieuDe="Thông tin khách hàng">
          <ChonKhach khach={khach} onChon={setKhach} />
        </Buoc>
```

Trong `<dl>` của thẻ Tạm tính, thêm dòng đầu tiên ngay trước `<Dong nhan="Loại phòng" …/>`:

```tsx
          <Dong nhan="Khách hàng" giaTri={khach?.hoTen ?? "Chưa chọn"} />
```

Thay:

```tsx
          disabled={tamTinh.loi !== null || !loai || loai.soPhongTrong === 0 || lap.dangChay}
          onClick={() =>
            lap.chay(
              () => datPhong(maKh, ngayNhan, ngayTra, maLoai),
```

bằng:

```tsx
          disabled={!khach || tamTinh.loi !== null || !loai || loai.soPhongTrong === 0 || lap.dangChay}
          onClick={() =>
            lap.chay(
              () => datPhong(khach?.maKh ?? "", ngayNhan, ngayTra, maLoai),
```

- [x] **Step 3: Viết lại `src/app/(app)/bookings/new/page.tsx`**

```tsx
import { BookingForm } from "@/components/bookings/booking-form";
import { Topbar } from "@/components/layout/topbar";
import { getLoaiPhongConTrong } from "@/lib/queries/bookings";
import { getNgayHienTai } from "@/lib/queries/ngay";

/** Khoang ngay mac dinh cua form: nhan hom nay, tra sau hai dem. */
function sauHaiDem(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 2);
  return d.toISOString().slice(0, 10);
}

export default async function DatPhongPage() {
  const homNay = await getNgayHienTai();
  // Khach khong nap san: buoc 1 tim khach qua Server Action timKhach.
  const loaiPhong = await getLoaiPhongConTrong(homNay, sauHaiDem(homNay));

  return (
    <>
      <Topbar tieuDe="Lập phiếu đặt phòng" phu="Phiếu mới · chọn khách, ngày và loại phòng" />

      <main className="flex min-h-0 flex-grow overflow-auto px-8 py-7">
        <BookingForm loaiPhong={loaiPhong} ngayMacDinh={homNay} />
      </main>
    </>
  );
}
```

- [x] **Step 4: Kiểm kiểu, lint, cả bộ test**

Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi (không còn `maKh`, `khachDaChon`, `Khach` trong `booking-form.tsx`).
Run: `npm test` → Expected: `Test Files 34 passed`, `Tests 203 passed`.

- [x] **Step 5: Commit**

```bash
git add src/components/bookings "src/app/(app)/bookings/new/page.tsx"
git commit -m "feat: form dat phong tim khach theo ten / SDT / CCCD, tao khach moi tai cho

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 5: Thủ tục và thao tác buồng phòng: báo dọn, báo bảo trì, sửa xong, dọn xong

**Files:**
- Modify (ngoài git): `$QLKS_SCRIPTS_DIR/06_Procedures.sql`, `$QLKS_SCRIPTS_DIR/08_Security_Roles.sql`
- Modify: `src/lib/thao-tac/buong-phong.ts`
- Test: `src/lib/thao-tac/buong-phong.test.ts` (viết lại), `src/db/thu-tuc.test.ts` (sửa 1 ca)

**Interfaces:**
- Consumes: `callProcedure`, `thucHien`, `dong`, `napLaiDuLieuMau`; `vasql.py`; phần A đã có trong `06` (neo khối Mong doi của Task 1).
- Produces: vòng đời ở spec §4.1.
  - Thủ tục mới:
    - `sp_BaoDonPhong(p_MaPhong)`: Trống / Đã đặt → Đang dọn.
    - `sp_BaoBaoTri(p_MaPhong, p_MaTK, p_MoTa)`: Trống / Đã đặt / Đang dọn → Bảo trì, thêm dòng `SUA_PHONG` 0đ. Result set `{ MaSua, MaPhong }`.
  - Viết lại, giữ nguyên tham số:
    - `sp_GhiNhanSuaPhong`: chỉ nhận phòng Bảo trì. Cập nhật phiếu đang mở (dòng `SUA_PHONG` mới nhất, `ORDER BY ThoiGian DESC, MaSua DESC`): chi phí, `MaTK`, `ThoiGian = NOW()`, mô tả (rỗng thì giữ mô tả cũ). Phòng → Đang dọn.
    - `sp_GhiNhanDonPhong`: chỉ phòng Đang dọn đổi trạng thái, sang Đã đặt nếu còn phiếu `DaDat` giữ phòng, không thì sang Trống. Phòng Bảo trì chỉ ghi nhật ký.
  - Cả hai thủ tục viết lại đều từ chối tài khoản không còn làm việc.
  - `baoDonPhong(maPhong: string): Promise<KetQua<null>>`
  - `baoBaoTri(maPhong: string, maTk: string, moTa: string): Promise<KetQua<{ maSua: string }>>`
  - `ghiDonPhong`, `ghiSuaPhong` giữ nguyên chữ ký.

- [x] **Step 1: Viết lại `src/lib/thao-tac/buong-phong.test.ts` (test hỏng)**

```ts
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { callProcedure } from "@/db/procedures";
import { baoBaoTri, baoDonPhong, ghiDonPhong, ghiSuaPhong } from "@/lib/thao-tac/buong-phong";
import { dong } from "@/test/csdl";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

beforeEach(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

// Moc 23/09/2026. 101 PH00000001 Trong; 202 PH00000004 BaoTri (phieu mo
// SUA0000004, 900.000d); 301 PH00000005 DangDon; 302 PH00000006 DangSuDung;
// 103 PH00000011 DaDat (DP00000011 nhan hom nay); PRES-01 PH00000010 BaoTri
// (SUA0000010). SUA_PHONG 12 dong, DON_PHONG 16 dong.
const LE_TAN = "TK00000002";
const BUONG = "TK00000004";
const KY_THUAT = "TK00000006";
const KY_THUAT_NGHI = "TK00000007"; // TamNghi
const phong = async (ma: string) =>
  (await dong("SELECT TrangThai FROM PHONG WHERE MaPhong = ?", [ma])).TrangThai;
const dem = async (bang: "SUA_PHONG" | "DON_PHONG") =>
  (await dong(`SELECT COUNT(*) AS n FROM ${bang}`)).n;

describe("baoDonPhong", () => {
  it("phong Trong va phong DaDat sang DangDon", async () => {
    expect(await baoDonPhong("PH00000001")).toEqual({ ok: true, data: null });
    expect(await baoDonPhong("PH00000011")).toEqual({ ok: true, data: null });
    expect([await phong("PH00000001"), await phong("PH00000011")]).toEqual(["DangDon", "DangDon"]);
  });

  // Review Focus #3: bao lan hai (phong da DangDon) bi tu choi.
  it("phong co khach, dang bao tri, da cho don thi CSDL tu choi, trang thai giu nguyen", async () => {
    expect(await baoDonPhong("PH00000006")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phong dang co khach: buong phong ghi nhan don truc tiep",
    });
    expect(await baoDonPhong("PH00000004")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phong dang bao tri, se sang cho don khi ky thuat sua xong",
    });
    expect(await baoDonPhong("PH00000005")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phong da nam trong danh sach cho don",
    });
    expect([await phong("PH00000006"), await phong("PH00000004"), await phong("PH00000005")]).toEqual([
      "DangSuDung",
      "BaoTri",
      "DangDon",
    ]);
  });
});

describe("baoBaoTri", () => {
  it("phong Trong: mo phieu 0d mang MaTK nguoi bao, phong sang BaoTri", async () => {
    expect(await baoBaoTri("PH00000001", LE_TAN, "  Voi sen ri nuoc ")).toEqual({
      ok: true,
      data: { maSua: "SUA0000013" },
    });
    expect(await phong("PH00000001")).toBe("BaoTri");
    expect(
      await dong("SELECT MaPhong, MaTK, ThoiGian, ChiPhi, MoTaLoi FROM SUA_PHONG WHERE MaSua = 'SUA0000013'"),
    ).toEqual({
      MaPhong: "PH00000001",
      MaTK: LE_TAN,
      ThoiGian: "2026-09-23 10:00:00",
      ChiPhi: "0.00",
      MoTaLoi: "Voi sen ri nuoc",
    });
  });

  it("phong dang cho don cung bao duoc (buong phong thay hong khi don)", async () => {
    expect((await baoBaoTri("PH00000005", BUONG, "Bong den chay")).ok).toBe(true);
    expect(await phong("PH00000005")).toBe("BaoTri");
  });

  // Review Focus #3
  it("bao hai lan: lan sau bi tu choi vi da co phieu dang mo, khong them dong", async () => {
    await baoBaoTri("PH00000001", LE_TAN, "Voi sen ri nuoc");
    expect(await baoBaoTri("PH00000001", LE_TAN, "Voi sen ri nuoc")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phong dang bao tri, da co phieu dang mo",
    });
    expect(await dem("SUA_PHONG")).toBe(13);
  });

  it("phong co khach, mo ta rong, tai khoan tam nghi thi CSDL tu choi", async () => {
    expect(await baoBaoTri("PH00000006", LE_TAN, "May lanh")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phong dang co khach luu tru, khong the dua vao bao tri",
    });
    expect(await baoBaoTri("PH00000001", LE_TAN, "   ")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phai mo ta su co can bao tri",
    });
    expect(await baoBaoTri("PH00000001", KY_THUAT_NGHI, "Khoa tu")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Tai khoan bao su co khong ton tai hoac khong con lam viec",
    });
    expect(await dem("SUA_PHONG")).toBe(12);
  });
});

describe("ghiSuaPhong (sua xong)", () => {
  it("phong BaoTri: cap nhat phieu dang mo, phong sang DangDon, khong them dong", async () => {
    expect(await ghiSuaPhong("PH00000004", KY_THUAT, "950000", "Thay binh nong lanh")).toEqual({
      ok: true,
      data: null,
    });
    expect(await phong("PH00000004")).toBe("DangDon");
    expect(
      await dong("SELECT MaTK, ThoiGian, ChiPhi, MoTaLoi FROM SUA_PHONG WHERE MaSua = 'SUA0000004'"),
    ).toEqual({
      MaTK: KY_THUAT,
      ThoiGian: "2026-09-23 10:00:00",
      ChiPhi: "950000.00",
      MoTaLoi: "Thay binh nong lanh",
    });
    expect(await dem("SUA_PHONG")).toBe(12);
  });

  it("mo ta de trong thi giu mo ta cu cua phieu", async () => {
    await ghiSuaPhong("PH00000010", KY_THUAT, "0", "  ");
    expect(await dong("SELECT ChiPhi, MoTaLoi FROM SUA_PHONG WHERE MaSua = 'SUA0000010'")).toEqual({
      ChiPhi: "0.00",
      MoTaLoi: "Bao tri he thong am thanh",
    });
  });

  // Review Focus #3
  it("sua xong hai lan: lan sau bi tu choi vi phong da sang DangDon", async () => {
    await ghiSuaPhong("PH00000004", KY_THUAT, "950000", "");
    expect(await ghiSuaPhong("PH00000004", KY_THUAT, "950000", "")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phong khong o trang thai bao tri, hay bao bao tri truoc",
    });
  });

  it("phong khong BaoTri, tai khoan tam nghi thi CSDL tu choi, phong giu nguyen", async () => {
    expect(await ghiSuaPhong("PH00000001", KY_THUAT, "0", "Thay voi sen")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Phong khong o trang thai bao tri, hay bao bao tri truoc",
    });
    expect(await ghiSuaPhong("PH00000010", KY_THUAT_NGHI, "0", "")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Tai khoan ky thuat khong con lam viec",
    });
    expect([await phong("PH00000001"), await phong("PH00000010")]).toEqual(["Trong", "BaoTri"]);
  });
});

describe("ghiDonPhong (don xong)", () => {
  it("phong DangDon: ghi nhat ky, phong ve Trong", async () => {
    expect(await ghiDonPhong("PH00000005", BUONG, "Don xong")).toEqual({ ok: true, data: null });
    expect(await phong("PH00000005")).toBe("Trong");
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

  it("phong DangDon con phieu DaDat giu thi ve DaDat", async () => {
    await baoDonPhong("PH00000011");
    await ghiDonPhong("PH00000011", BUONG, "");
    expect(await phong("PH00000011")).toBe("DaDat");
  });

  it("phong BaoTri van BaoTri (phai sua xong truoc), van ghi nhat ky", async () => {
    expect(await ghiDonPhong("PH00000004", BUONG, "")).toEqual({ ok: true, data: null });
    expect(await phong("PH00000004")).toBe("BaoTri");
    expect(await dem("DON_PHONG")).toBe(17);
  });

  it("phong dang co khach (DangSuDung) va dang giu (DaDat) giu nguyen, van ghi nhat ky", async () => {
    await ghiDonPhong("PH00000006", BUONG, "Don giua ky");
    await ghiDonPhong("PH00000011", BUONG, "");
    expect([await phong("PH00000006"), await phong("PH00000011")]).toEqual(["DangSuDung", "DaDat"]);
    expect(await dem("DON_PHONG")).toBe(18);
  });

  it("ghi chu rong luu NULL", async () => {
    await ghiDonPhong("PH00000005", BUONG, "   ");
    expect(await dong("SELECT GhiChu FROM DON_PHONG WHERE MaDon = 'DON0000017'")).toEqual({ GhiChu: null });
  });

  it("phong khong ton tai, tai khoan nghi viec thi CSDL tu choi", async () => {
    expect(await ghiDonPhong("PH99999999", BUONG, "")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Ma phong khong ton tai!",
    });
    expect(await ghiDonPhong("PH00000005", "TK00000010", "")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Tai khoan nhan vien khong con lam viec",
    });
  });
});

describe("mot su co di tron vong", () => {
  it("bao bao tri -> sua xong -> don xong: phong Trong, SUA_PHONG them dung 1 dong", async () => {
    await baoBaoTri("PH00000001", LE_TAN, "Khoa tu hong");
    await ghiSuaPhong("PH00000001", KY_THUAT, "150000", "");
    expect(await phong("PH00000001")).toBe("DangDon");
    await ghiDonPhong("PH00000001", BUONG, "Don sau sua");
    expect(await phong("PH00000001")).toBe("Trong");
    expect(await dem("SUA_PHONG")).toBe(13);
    expect(await dong("SELECT MaTK, ChiPhi, MoTaLoi FROM SUA_PHONG WHERE MaSua = 'SUA0000013'")).toEqual({
      MaTK: KY_THUAT,
      ChiPhi: "150000.00",
      MoTaLoi: "Khoa tu hong",
    });
    // Moi su co mot dong: phong 101 co SUA0000001 (250.000) va su co nay.
    const baoCao = await callProcedure<{ SoPhong: string; SoLanSua: number; TongChiPhiSua: string }>(
      "sp_BaoCaoBuongPhong",
      [null, null],
    );
    expect(baoCao.find((r) => r.SoPhong === "101")).toMatchObject({ SoLanSua: 2, TongChiPhiSua: "400000.00" });
  });

  it("phong DaDat di het vong thi ve DaDat", async () => {
    await baoBaoTri("PH00000011", LE_TAN, "Ri nuoc");
    await ghiSuaPhong("PH00000011", KY_THUAT, "0", "");
    await ghiDonPhong("PH00000011", BUONG, "");
    expect(await phong("PH00000011")).toBe("DaDat");
  });
});
```

- [x] **Step 2: Sửa ca cũ của `sp_GhiNhanDonPhong` trong `src/db/thu-tuc.test.ts`**

Thay:

```ts
  it("phong DangDon va BaoTri van ve Trong", async () => {
    await callProcedure("sp_GhiNhanDonPhong", ["PH00000005", BUONG, null]);
    await callProcedure("sp_GhiNhanDonPhong", ["PH00000004", BUONG, null]);
    expect(await phong("PH00000005")).toEqual({ TrangThai: "Trong" });
    expect(await phong("PH00000004")).toEqual({ TrangThai: "Trong" });
  });
```

bằng:

```ts
  // Spec bo sung nghiep vu 4.2: phong BaoTri phai sua xong (sp_GhiNhanSuaPhong) truoc.
  it("phong DangDon ve Trong; phong BaoTri giu BaoTri", async () => {
    await callProcedure("sp_GhiNhanDonPhong", ["PH00000005", BUONG, null]);
    await callProcedure("sp_GhiNhanDonPhong", ["PH00000004", BUONG, null]);
    expect(await phong("PH00000005")).toEqual({ TrangThai: "Trong" });
    expect(await phong("PH00000004")).toEqual({ TrangThai: "BaoTri" });
  });
```

- [x] **Step 3: Thêm hai hàm vào cuối `src/lib/thao-tac/buong-phong.ts`**

```ts
/** Bao phong can don: Trong / DaDat -> DangDon (sp_BaoDonPhong). */
export function baoDonPhong(maPhong: string): Promise<KetQua<null>> {
  return thucHien(async () => {
    await callProcedure("sp_BaoDonPhong", [maPhong]);
    return null;
  });
}

/** Mo phieu bao tri 0d, phong -> BaoTri (sp_BaoBaoTri). Mo ta rong do thu tuc tu choi. */
export function baoBaoTri(
  maPhong: string,
  maTk: string,
  moTa: string,
): Promise<KetQua<{ maSua: string }>> {
  return thucHien(async () => {
    const [d] = await callProcedure<{ MaSua: string }>("sp_BaoBaoTri", [maPhong, maTk, moTa]);
    return { maSua: d.MaSua };
  });
}
```

- [x] **Step 4: Chạy trên thủ tục cũ, xác nhận hỏng đúng lý do**

Run: `npx vitest run src/lib/thao-tac/buong-phong.test.ts src/db/thu-tuc.test.ts`
Expected: FAIL. Các ca `baoDonPhong` / `baoBaoTri` nhận `Lỗi CSDL (1305): PROCEDURE … does not exist`. Ca `phong BaoTri van BaoTri` và ca sửa ở `thu-tuc.test.ts` nhận `'Trong'` thay vì `'BaoTri'`. Ca `phong DangDon: ghi nhat ky` vẫn pass.

- [x] **Step 5: Đọc lại chỗ neo ngay trước khi sửa**

```bash
cd /Users/anhpham/PA/UIT/Demo
set -a; source .env.local; set +a
F6="$QLKS_SCRIPTS_DIR/06_Procedures.sql"; F8="$QLKS_SCRIPTS_DIR/08_Security_Roles.sql"
grep -c "^DROP PROCEDURE IF EXISTS sp_GhiNhanSuaPhong;$" "$F6"
grep -c "^CREATE PROCEDURE sp_GhiNhanDonPhong ($" "$F6"
grep -c "^-- RB-10, RB-11. Phong chi ve Trong khi khong con phieu hieu luc nao khac giu.$" "$F6"
grep -c "'sp_SuaKhachHang')" "$F6"
grep -c "^-- C. QUYEN GHI CHI QUA THU TUC" "$F8"
grep -c "^GRANT EXECUTE ON PROCEDURE QuanLyKhachSan.sp_DangNhap TO$" "$F8"
grep -c "sp_BaoBaoTri" "$F6" "$F8"
```

Expected: sáu số `1`, rồi `0` cho cả hai file. Khác thì **dừng lại, báo người dùng**.

- [x] **Step 6: Lưu script sửa vào `$BK/sua_b_buong_phong.py`**

```python
"""Phan B (spec bo sung nghiep vu muc 4.2): bao don / bao bao tri, sua xong, don xong.

06: them sp_BaoDonPhong, sp_BaoBaoTri; viet lai sp_GhiNhanDonPhong,
    sp_GhiNhanSuaPhong (giu nguyen tham so).
08: quyen cho le tan, buong phong, giam sat buong phong, ky thuat.
Dung: python3 sua_b_buong_phong.py "$QLKS_SCRIPTS_DIR"
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vasql import Tep  # noqa: E402

thu_muc = sys.argv[1]

t06 = Tep(thu_muc, "06_Procedures.sql")

t06.chen_sau("DROP PROCEDURE IF EXISTS sp_GhiNhanSuaPhong;\n", """DROP PROCEDURE IF EXISTS sp_BaoDonPhong;
DROP PROCEDURE IF EXISTS sp_BaoBaoTri;
""")

t06.thay_doan(
    "CREATE PROCEDURE sp_GhiNhanDonPhong (",
    "-- RB-10, RB-11. Phong chi ve Trong khi khong con phieu hieu luc nao khac giu.",
    """-- Vong doi buong phong (spec bo sung nghiep vu muc 4.1):
--   sp_BaoDonPhong      Trong / DaDat            -> DangDon
--   sp_BaoBaoTri        Trong / DaDat / DangDon  -> BaoTri (mo phieu SUA_PHONG 0d)
--   sp_GhiNhanSuaPhong  BaoTri                   -> DangDon (dong phieu dang mo)
--   sp_GhiNhanDonPhong  DangDon                  -> DaDat neu con phieu DaDat giu phong, khong thi Trong
-- Phieu bao tri dang mo cua mot phong BaoTri la dong SUA_PHONG moi nhat cua
-- phong do (ThoiGian DESC, MaSua DESC).

-- Khong co bang luu nguoi bao don, nen khong nhan MaTK.
CREATE PROCEDURE sp_BaoDonPhong (
    IN p_MaPhong CHAR(10)
)
SQL SECURITY DEFINER
BEGIN
    DECLARE v_TrangThai VARCHAR(20) DEFAULT NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT TrangThai INTO v_TrangThai
    FROM   PHONG
    WHERE  MaPhong = p_MaPhong
    FOR    UPDATE;

    IF v_TrangThai IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phong khong ton tai';
    END IF;

    IF v_TrangThai = 'DangDon' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Phong da nam trong danh sach cho don';
    END IF;

    IF v_TrangThai = 'DangSuDung' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Phong dang co khach: buong phong ghi nhan don truc tiep';
    END IF;

    IF v_TrangThai = 'BaoTri' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Phong dang bao tri, se sang cho don khi ky thuat sua xong';
    END IF;

    UPDATE PHONG
    SET    TrangThai = 'DangDon'
    WHERE  MaPhong = p_MaPhong;

    COMMIT;

    SELECT MaPhong, SoPhong, TrangThai
    FROM   PHONG
    WHERE  MaPhong = p_MaPhong;
END$$

-- Mo phieu bao tri: mot dong SUA_PHONG chi phi 0, MaTK la nguoi bao.
CREATE PROCEDURE sp_BaoBaoTri (
    IN p_MaPhong CHAR(10),
    IN p_MaTK    CHAR(10),
    IN p_MoTa    VARCHAR(200)
)
SQL SECURITY DEFINER
BEGIN
    DECLARE v_TrangThai VARCHAR(20) DEFAULT NULL;
    DECLARE v_MaSua     CHAR(10);
    DECLARE v_Next      INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SET p_MoTa = TRIM(p_MoTa);

    IF p_MoTa IS NULL OR p_MoTa = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phai mo ta su co can bao tri';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM TAI_KHOAN
                   WHERE MaTK = p_MaTK AND TrangThai = 'DangLamViec') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Tai khoan bao su co khong ton tai hoac khong con lam viec';
    END IF;

    START TRANSACTION;

    SELECT TrangThai INTO v_TrangThai
    FROM   PHONG
    WHERE  MaPhong = p_MaPhong
    FOR    UPDATE;

    IF v_TrangThai IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phong khong ton tai';
    END IF;

    IF v_TrangThai = 'DangSuDung' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Phong dang co khach luu tru, khong the dua vao bao tri';
    END IF;

    IF v_TrangThai = 'BaoTri' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Phong dang bao tri, da co phieu dang mo';
    END IF;

    SELECT IFNULL(MAX(CAST(SUBSTRING(MaSua, 4) AS UNSIGNED)), 0) + 1
    INTO   v_Next
    FROM   SUA_PHONG;

    SET v_MaSua = CONCAT('SUA', LPAD(v_Next, 7, '0'));

    INSERT INTO SUA_PHONG (MaSua, MaPhong, MaTK, ThoiGian, ChiPhi, MoTaLoi)
    VALUES (v_MaSua, p_MaPhong, p_MaTK, NOW(), 0, p_MoTa);

    UPDATE PHONG
    SET    TrangThai = 'BaoTri'
    WHERE  MaPhong = p_MaPhong;

    COMMIT;

    SELECT v_MaSua AS MaSua, p_MaPhong AS MaPhong;
END$$

CREATE PROCEDURE sp_GhiNhanDonPhong (
    IN p_MaPhong CHAR(10),
    IN p_MaTK    CHAR(10),
    IN p_GhiChu  VARCHAR(200)
)
SQL SECURITY DEFINER
BEGIN
    DECLARE v_MaDon   CHAR(10);
    DECLARE v_NextVal INT DEFAULT 1;

    IF NOT EXISTS (SELECT 1 FROM TAI_KHOAN WHERE MaTK = p_MaTK) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Loi: Ma tai khoan nhan vien khong ton tai!';
    END IF;

    IF EXISTS (SELECT 1 FROM TAI_KHOAN
               WHERE MaTK = p_MaTK AND TrangThai <> 'DangLamViec') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Tai khoan nhan vien khong con lam viec';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM PHONG WHERE MaPhong = p_MaPhong) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Loi: Ma phong khong ton tai!';
    END IF;

    SELECT IFNULL(MAX(CAST(SUBSTRING(MaDon, 4) AS UNSIGNED)), 0) + 1
    INTO   v_NextVal
    FROM   DON_PHONG;

    SET v_MaDon = CONCAT('DON', LPAD(v_NextVal, 7, '0'));

    INSERT INTO DON_PHONG (MaDon, MaPhong, MaTK, ThoiGian, GhiChu)
    VALUES (v_MaDon, p_MaPhong, p_MaTK, NOW(), p_GhiChu);

    -- Chi phong cho don (DangDon) doi trang thai: ve DaDat neu con phieu DaDat
    -- giu phong, khong thi ve Trong. Phong BaoTri phai sua xong truoc
    -- (sp_GhiNhanSuaPhong dua sang DangDon); phong co khach, dang giu hay dang
    -- trong chi ghi nhat ky.
    UPDATE PHONG p
    SET    p.TrangThai = IF(EXISTS (SELECT 1
                                    FROM   CHI_TIET_DAT_PHONG ct
                                    JOIN   PHIEU_DAT_PHONG    pd ON pd.MaDatPhong = ct.MaDatPhong
                                    WHERE  ct.MaPhong   = p.MaPhong
                                      AND  pd.TrangThai = 'DaDat'),
                            'DaDat', 'Trong')
    WHERE  p.MaPhong   = p_MaPhong
      AND  p.TrangThai = 'DangDon';

    SELECT CONCAT('Da ghi nhan don phong thanh cong. Ma don: ', v_MaDon) AS KetQua;
END$$

-- Ky thuat ghi nhan da sua xong: cap nhat phieu dang mo (chi phi, nguoi sua,
-- gio sua xong; mo ta rong thi giu mo ta cu) roi dua phong BaoTri -> DangDon.
-- Moi su co mot dong, nen sp_BaoCaoBuongPhong khong dem doi.
CREATE PROCEDURE sp_GhiNhanSuaPhong (
    IN p_MaPhong CHAR(10),
    IN p_MaTK    CHAR(10),
    IN p_ChiPhi  DECIMAL(18,2),
    IN p_MoTaLoi VARCHAR(200)
)
SQL SECURITY DEFINER
BEGIN
    DECLARE v_TrangThai VARCHAR(20) DEFAULT NULL;
    DECLARE v_MaSua     CHAR(10)    DEFAULT NULL;
    DECLARE v_NextVal   INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_ChiPhi IS NULL OR p_ChiPhi < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Chi phi sua chua khong duoc am';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM TAI_KHOAN WHERE MaTK = p_MaTK) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Loi: Ma tai khoan ky thuat khong ton tai!';
    END IF;

    IF EXISTS (SELECT 1 FROM TAI_KHOAN
               WHERE MaTK = p_MaTK AND TrangThai <> 'DangLamViec') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Tai khoan ky thuat khong con lam viec';
    END IF;

    SET p_MoTaLoi = NULLIF(TRIM(p_MoTaLoi), '');

    START TRANSACTION;

    SELECT TrangThai INTO v_TrangThai
    FROM   PHONG
    WHERE  MaPhong = p_MaPhong
    FOR    UPDATE;

    IF v_TrangThai IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Loi: Ma phong khong ton tai!';
    END IF;

    IF v_TrangThai <> 'BaoTri' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Phong khong o trang thai bao tri, hay bao bao tri truoc';
    END IF;

    SELECT MaSua INTO v_MaSua
    FROM   SUA_PHONG
    WHERE  MaPhong = p_MaPhong
    ORDER  BY ThoiGian DESC, MaSua DESC
    LIMIT  1
    FOR    UPDATE;

    IF v_MaSua IS NULL THEN
        -- Phong BaoTri ma chua co dong nao (chi xay ra khi sua tay CSDL).
        SELECT IFNULL(MAX(CAST(SUBSTRING(MaSua, 4) AS UNSIGNED)), 0) + 1
        INTO   v_NextVal
        FROM   SUA_PHONG;

        SET v_MaSua = CONCAT('SUA', LPAD(v_NextVal, 7, '0'));

        INSERT INTO SUA_PHONG (MaSua, MaPhong, MaTK, ThoiGian, ChiPhi, MoTaLoi)
        VALUES (v_MaSua, p_MaPhong, p_MaTK, NOW(), p_ChiPhi, p_MoTaLoi);
    ELSE
        UPDATE SUA_PHONG
        SET    MaTK     = p_MaTK,
               ThoiGian = NOW(),
               ChiPhi   = p_ChiPhi,
               MoTaLoi  = COALESCE(p_MoTaLoi, MoTaLoi)
        WHERE  MaSua = v_MaSua;
    END IF;

    UPDATE PHONG
    SET    TrangThai = 'DangDon'
    WHERE  MaPhong = p_MaPhong;

    COMMIT;

    SELECT CONCAT('Da ghi nhan sua phong thanh cong. Ma sua: ', v_MaSua) AS KetQua;
END$$

""",
    phai_co=[
        "CREATE PROCEDURE sp_GhiNhanSuaPhong (",
        "INSERT INTO DON_PHONG (MaDon, MaPhong, MaTK, ThoiGian, GhiChu)",
        "INSERT INTO SUA_PHONG (MaSua, MaPhong, MaTK, ThoiGian, ChiPhi, MoTaLoi)",
        "SET TrangThai = 'BaoTri'",
    ],
)

t06.thay("""  AND  ROUTINE_NAME IN ('sp_ChuanHoaKhachHang', 'sp_ThemKhachHang',
                       'sp_SuaKhachHang')""", """  AND  ROUTINE_NAME IN ('sp_ChuanHoaKhachHang', 'sp_ThemKhachHang',
                       'sp_SuaKhachHang', 'sp_BaoDonPhong', 'sp_BaoBaoTri')""")

t06.luu()

t08 = Tep(thu_muc, "08_Security_Roles.sql")
t08.chen_truoc("-- C. QUYEN GHI CHI QUA THU TUC", """-- Man Buong phong / Bao tri: ten nguoi bao, nguoi lam; ky thuat xem phong co
-- khach nhan hom nay.
GRANT SELECT (MaTK, HoTen) ON QuanLyKhachSan.TAI_KHOAN TO r_buongphong, r_kythuat;
GRANT SELECT ON QuanLyKhachSan.v_TinhTrangPhongHomNay   TO r_kythuat;

""")
t08.chen_truoc("GRANT EXECUTE ON PROCEDURE QuanLyKhachSan.sp_DangNhap TO\n", """-- Bao don / bao bao tri (sua xong va don xong van la sp_GhiNhanSuaPhong /
-- sp_GhiNhanDonPhong o tren).
GRANT EXECUTE ON PROCEDURE QuanLyKhachSan.sp_BaoDonPhong
      TO r_letan, r_giamsatbuongphong;
GRANT EXECUTE ON PROCEDURE QuanLyKhachSan.sp_BaoBaoTri
      TO r_letan, r_buongphong, r_giamsatbuongphong;

""")
t08.luu()
```

- [x] **Step 7: Sửa `06` và `08`, đọc lại đoạn cũ bị thay**

```bash
cp "$QLKS_SCRIPTS_DIR/06_Procedures.sql" "$BK/06_truoc_b.sql"; cp "$QLKS_SCRIPTS_DIR/08_Security_Roles.sql" "$BK/08_truoc_b.sql"
python3 "$BK/sua_b_buong_phong.py" "$QLKS_SCRIPTS_DIR"
diff "$BK/06_truoc_b.sql" "$QLKS_SCRIPTS_DIR/06_Procedures.sql" | grep -c '^[<>]'
diff "$BK/08_truoc_b.sql" "$QLKS_SCRIPTS_DIR/08_Security_Roles.sql" | grep -c '^[<>]'
cat "$BK/06_Procedures.sql.2.cu"
```

Expected:
- `Da sua 06_Procedures.sql: 3 doan`, `Da sua 08_Security_Roles.sql: 2 doan`, `244`, `12`.
- `06_Procedures.sql.2.cu` phải là **đúng** hai thủ tục cũ `sp_GhiNhanDonPhong` và `sp_GhiNhanSuaPhong`, không có gì khác. Nếu có đoạn khác thì khôi phục `$BK/06_truoc_b.sql` rồi báo người dùng.

- [x] **Step 8: Chạy lại**

Run: `npx vitest run src/lib/thao-tac/buong-phong.test.ts src/db/thu-tuc.test.ts` → Expected: `Tests 24 passed` (18 + 6).
Run: `npm test` → Expected: `Test Files 34 passed`, `Tests 213 passed`.

`src/app/(app)/rooms/actions.test.ts` chỉ kiểm hình thức nên vẫn pass. Form "Ghi nhận sửa chữa" cũ trên Sơ đồ phòng sẽ bị CSDL từ chối với phòng không Bảo trì, Task 9 thay form này.

- [x] **Step 9: Commit**

```bash
git add src/lib/thao-tac/buong-phong.ts src/lib/thao-tac/buong-phong.test.ts src/db/thu-tuc.test.ts
git commit -m "feat: bao don / bao bao tri; sua xong dong phieu dang mo, don xong tra phong DaDat

06_Procedures.sql, 08_Security_Roles.sql (Scripts/, ngoai git) sua cung luc:
them sp_BaoDonPhong, sp_BaoBaoTri; viet lai sp_GhiNhanSuaPhong (chi nhan phong
BaoTri, cap nhat phieu SUA_PHONG dang mo, phong sang DangDon) va
sp_GhiNhanDonPhong (phong BaoTri khong con ve Trong khi don).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Đọc cho buồng phòng: nhân viên theo vai trò, phòng chờ dọn, phòng đang bảo trì, nhật ký

**Files:**
- Create: `src/lib/vai-tro.ts`, `src/lib/queries/buong-phong.ts`
- Modify: `src/lib/queries/rooms.ts` (`getNhatKyBuongPhong` hiện họ tên)
- Test: `src/lib/queries/buong-phong.test.ts`, `src/lib/queries/rooms.test.ts`

**Interfaces:**
- Consumes: `db`, `pool`, `schema`; `baoDonPhong` (Task 5, chỉ trong test).
- Produces:
  - `LOAI_TK_BUONG_PHONG = "LTK0000003"`, `LOAI_TK_KY_THUAT = "LTK0000004"`
  - `type NhanVien = { maTk: string; hoTen: string }`; `getNhanVienTheoLoai(maLoaiTk): Promise<NhanVien[]>`, chỉ nhân viên `DangLamViec`, xếp theo họ tên.
  - `type KhachHomNay = { maDatPhong: string; hoTen: string } | null`
  - `type PhongChoDon = { maPhong; soPhong; tang: number; tenLoaiPhong; khachHomNay: KhachHomNay }`; `getPhongChoDon()`: phòng có khách hôm nay xếp đầu, rồi theo số phòng.
  - `type PhieuBaoTri = { maSua; moTaLoi: string | null; chiPhi: string; thoiGian: string; nguoiGhi: string; soNgayCho: number }`
  - `type PhongDangBaoTri = PhongChoDon & { phieu: PhieuBaoTri | null }`; `getPhongDangBaoTri()`: phòng có khách hôm nay xếp đầu, rồi phiếu cũ nhất trước.
  - `getNhatKyDon(n = 20)` trả `{ maDon, thoiGian, soPhong, nhanVien, ghiChu: string | null }[]`
  - `getNhatKySua(n = 20)` trả `{ maSua, thoiGian, soPhong, nhanVien, chiPhi, moTaLoi: string | null }[]`
  - `nhanVien` là họ tên.

`v_TinhTrangPhongHomNay` đọc bằng SQL thô với đúng tên hoa / thường. Drizzle introspect ra tên chữ thường (`v_tinhtrangphonghomnay`), tên này chỉ chạy được trên macOS.

- [x] **Step 1: Viết test hỏng `src/lib/queries/buong-phong.test.ts`**

```ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  getNhanVienTheoLoai,
  getNhatKyDon,
  getNhatKySua,
  getPhongChoDon,
  getPhongDangBaoTri,
} from "@/lib/queries/buong-phong";
import { baoDonPhong } from "@/lib/thao-tac/buong-phong";
import { LOAI_TK_BUONG_PHONG, LOAI_TK_KY_THUAT } from "@/lib/vai-tro";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

// Ca cuoi file ghi vao CSDL (bao don phong 103), nen nap lai truoc va sau file.
beforeAll(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

describe("getNhanVienTheoLoai", () => {
  it("chi nhan vien dang lam viec cua dung vai tro, theo ho ten", async () => {
    expect(await getNhanVienTheoLoai(LOAI_TK_BUONG_PHONG)).toEqual([
      { maTk: "TK00000004", hoTen: "Pham Thi Mai" },
      { maTk: "TK00000005", hoTen: "Vo Thanh Thao" },
    ]);
    // kythuat.son (TK00000007) dang TamNghi.
    expect(await getNhanVienTheoLoai(LOAI_TK_KY_THUAT)).toEqual([
      { maTk: "TK00000006", hoTen: "Do Hoang Nam" },
    ]);
  });
});

describe("getPhongDangBaoTri", () => {
  it("moi phong BaoTri kem phieu dang mo (dong SUA_PHONG moi nhat), phieu cu len truoc", async () => {
    expect(await getPhongDangBaoTri()).toEqual([
      {
        maPhong: "PH00000004",
        soPhong: "202",
        tang: 2,
        tenLoaiPhong: "Superior Double",
        khachHomNay: null,
        phieu: {
          maSua: "SUA0000004",
          moTaLoi: "Sua he thong nuoc nong",
          chiPhi: "900000.00",
          thoiGian: "2026-09-20 15:20:00",
          nguoiGhi: "Bui Minh Son",
          soNgayCho: 3,
        },
      },
      {
        maPhong: "PH00000010",
        soPhong: "PRES-01",
        tang: 6,
        tenLoaiPhong: "Presidential Suite",
        khachHomNay: null,
        phieu: {
          maSua: "SUA0000010",
          moTaLoi: "Bao tri he thong am thanh",
          chiPhi: "1500000.00",
          thoiGian: "2026-09-22 09:40:00",
          nguoiGhi: "Bui Minh Son",
          soNgayCho: 1,
        },
      },
    ]);
  });
});

describe("nhat ky", () => {
  it("getNhatKyDon: moi nhat len dau, kem ho ten nhan vien", async () => {
    const nk = await getNhatKyDon();
    expect(nk).toHaveLength(16);
    expect(nk[0]).toEqual({
      maDon: "DON0000005",
      thoiGian: "2026-09-23 12:00:00",
      soPhong: "301",
      nhanVien: "Pham Thi Mai",
      ghiChu: "Dang don tong quat sau check-out",
    });
    expect(await getNhatKyDon(3)).toHaveLength(3);
  });

  it("getNhatKySua: moi nhat len dau, kem chi phi", async () => {
    expect(await getNhatKySua(1)).toEqual([
      {
        maSua: "SUA0000011",
        thoiGian: "2026-09-23 08:10:00",
        soPhong: "303",
        nhanVien: "Do Hoang Nam",
        chiPhi: "0.00",
        moTaLoi: "May lanh khong chay, dang kiem tra",
      },
    ]);
  });
});

describe("getPhongChoDon", () => {
  it("moi phong DangDon theo so phong", async () => {
    const ds = await getPhongChoDon();
    expect(ds.map((p) => p.soPhong)).toEqual([
      "301", "308", "309", "310", "403", "404", "405", "406", "407", "408",
    ]);
    expect(ds[0]).toEqual({
      maPhong: "PH00000005",
      soPhong: "301",
      tang: 3,
      tenLoaiPhong: "Deluxe King",
      khachHomNay: null,
    });
  });

  it("phong co khach nhan hom nay len dau (ca nay ghi CSDL: bao don phong 103)", async () => {
    expect((await baoDonPhong("PH00000011")).ok).toBe(true);
    const [dau] = await getPhongChoDon();
    expect(dau).toMatchObject({
      soPhong: "103",
      khachHomNay: { maDatPhong: "DP00000011", hoTen: "Nguyen Thi An" },
    });
  });
});
```

- [x] **Step 2: Sửa kỳ vọng `nhanVien` trong `src/lib/queries/rooms.test.ts`**

Trong ca `gop 16 lan don va 12 lan sua, moi nhat len dau`, thay `      nhanVien: "TK00000004",` bằng `      nhanVien: "Pham Thi Mai",`.

- [x] **Step 3: Chạy, xác nhận hỏng**

Run: `npx vitest run src/lib/queries/buong-phong.test.ts src/lib/queries/rooms.test.ts`
Expected: FAIL. `Failed to resolve import "@/lib/queries/buong-phong"`, và `rooms.test.ts` nhận `'TK00000004'` thay vì `'Pham Thi Mai'`.

- [x] **Step 4: Viết `src/lib/vai-tro.ts`**

```ts
/**
 * Ma loai tai khoan (LOAI_TAI_KHOAN) cua cac vai tro co man lam viec rieng.
 * Chua co phien dang nhap (phase 3): o "Nhan vien thuc hien" loc theo cac ma nay.
 */
export const LOAI_TK_BUONG_PHONG = "LTK0000003";
export const LOAI_TK_KY_THUAT = "LTK0000004";
```

- [x] **Step 5: Viết `src/lib/queries/buong-phong.ts`**

```ts
import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import type { RowDataPacket } from "mysql2";

import { db, pool } from "@/db";
import * as schema from "@/db/schema";

/**
 * Mat tien doc cua man Buong phong va Bao tri (spec bo sung nghiep vu 4.3).
 *
 * Hang cho la chinh PHONG.TrangThai: DangDon = cho don, BaoTri = cho sua. Phieu
 * bao tri dang mo cua mot phong BaoTri la dong SUA_PHONG moi nhat cua phong do
 * (ThoiGian DESC, MaSua DESC), dung thu tu sp_GhiNhanSuaPhong chon.
 *
 * v_TinhTrangPhongHomNay doc bang SQL tho voi dung ten hoa / thuong: Drizzle
 * introspect ra ten chu thuong, chi chay duoc tren may khong phan biet hoa thuong.
 */

export type NhanVien = { maTk: string; hoTen: string };

export async function getNhanVienTheoLoai(maLoaiTk: string): Promise<NhanVien[]> {
  const tk = schema.taiKhoan;
  return db
    .select({ maTk: tk.maTk, hoTen: tk.hoTen })
    .from(tk)
    .where(and(eq(tk.maLoaiTk, maLoaiTk), eq(tk.trangThai, "DangLamViec")))
    .orderBy(asc(tk.hoTen));
}

/** Phieu DaDat / DangO phu hom nay cua mot phong (v_TinhTrangPhongHomNay). */
export type KhachHomNay = { maDatPhong: string; hoTen: string } | null;

export type PhongChoDon = {
  maPhong: string;
  soPhong: string;
  tang: number;
  tenLoaiPhong: string;
  khachHomNay: KhachHomNay;
};

export type PhieuBaoTri = {
  maSua: string;
  moTaLoi: string | null;
  chiPhi: string;
  thoiGian: string;
  nguoiGhi: string;
  soNgayCho: number;
};

export type PhongDangBaoTri = PhongChoDon & { phieu: PhieuBaoTri | null };

const sangPhong = (r: RowDataPacket): PhongChoDon => ({
  maPhong: r.MaPhong,
  soPhong: r.SoPhong,
  tang: Number(r.Tang),
  tenLoaiPhong: r.TenLoaiPhong,
  khachHomNay: r.MaDatPhong ? { maDatPhong: r.MaDatPhong, hoTen: r.KhachLuuTru } : null,
});

/** Phong cho don; phong co khach nhan hom nay len dau de don truoc. */
export async function getPhongChoDon(): Promise<PhongChoDon[]> {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT MaPhong, SoPhong, Tang, TenLoaiPhong, MaDatPhong, KhachLuuTru
    FROM   v_TinhTrangPhongHomNay
    WHERE  TrangThai = 'DangDon'
    ORDER  BY MaDatPhong IS NULL, SoPhong`);
  return rows.map(sangPhong);
}

/** Phong dang bao tri kem phieu dang mo; co khach hom nay len dau, roi phieu cu nhat. */
export async function getPhongDangBaoTri(): Promise<PhongDangBaoTri[]> {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT v.MaPhong, v.SoPhong, v.Tang, v.TenLoaiPhong, v.MaDatPhong, v.KhachLuuTru,
           s.MaSua, s.MoTaLoi, s.ChiPhi, s.ThoiGian, tk.HoTen AS NguoiGhi,
           DATEDIFF(CURDATE(), DATE(s.ThoiGian)) AS SoNgayCho
    FROM   v_TinhTrangPhongHomNay v
    LEFT   JOIN (SELECT sp.*,
                        ROW_NUMBER() OVER (PARTITION BY sp.MaPhong
                                           ORDER BY sp.ThoiGian DESC, sp.MaSua DESC) AS Thu
                 FROM   SUA_PHONG sp) s ON s.MaPhong = v.MaPhong AND s.Thu = 1
    LEFT   JOIN TAI_KHOAN tk ON tk.MaTK = s.MaTK
    WHERE  v.TrangThai = 'BaoTri'
    ORDER  BY v.MaDatPhong IS NULL, s.ThoiGian, v.SoPhong`);
  return rows.map((r) => ({
    ...sangPhong(r),
    phieu: r.MaSua
      ? {
          maSua: r.MaSua,
          moTaLoi: r.MoTaLoi,
          chiPhi: r.ChiPhi,
          thoiGian: r.ThoiGian,
          nguoiGhi: r.NguoiGhi,
          soNgayCho: Number(r.SoNgayCho),
        }
      : null,
  }));
}

export async function getNhatKyDon(n = 20) {
  const don = schema.donPhong;
  return db
    .select({
      maDon: don.maDon,
      thoiGian: don.thoiGian,
      soPhong: schema.phong.soPhong,
      nhanVien: schema.taiKhoan.hoTen,
      ghiChu: don.ghiChu,
    })
    .from(don)
    .innerJoin(schema.phong, eq(schema.phong.maPhong, don.maPhong))
    .innerJoin(schema.taiKhoan, eq(schema.taiKhoan.maTk, don.maTk))
    .orderBy(desc(don.thoiGian), desc(don.maDon))
    .limit(n);
}

export async function getNhatKySua(n = 20) {
  const sua = schema.suaPhong;
  return db
    .select({
      maSua: sua.maSua,
      thoiGian: sua.thoiGian,
      soPhong: schema.phong.soPhong,
      nhanVien: schema.taiKhoan.hoTen,
      chiPhi: sua.chiPhi,
      moTaLoi: sua.moTaLoi,
    })
    .from(sua)
    .innerJoin(schema.phong, eq(schema.phong.maPhong, sua.maPhong))
    .innerJoin(schema.taiKhoan, eq(schema.taiKhoan.maTk, sua.maTk))
    .orderBy(desc(sua.thoiGian), desc(sua.maSua))
    .limit(n);
}
```

- [x] **Step 6: `getNhatKyBuongPhong` hiện họ tên nhân viên (`src/lib/queries/rooms.ts`)**

Trong `getNhatKyBuongPhong`, thay hai truy vấn trong `Promise.all`:

```ts
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
```

bằng:

```ts
    db
      .select({
        ngayGio: schema.donPhong.thoiGian,
        soPhong: schema.phong.soPhong,
        nhanVien: schema.taiKhoan.hoTen,
        ghiChu: schema.donPhong.ghiChu,
      })
      .from(schema.donPhong)
      .innerJoin(schema.phong, eq(schema.donPhong.maPhong, schema.phong.maPhong))
      .innerJoin(schema.taiKhoan, eq(schema.donPhong.maTk, schema.taiKhoan.maTk)),
    db
      .select({
        ngayGio: schema.suaPhong.thoiGian,
        soPhong: schema.phong.soPhong,
        nhanVien: schema.taiKhoan.hoTen,
        ghiChu: schema.suaPhong.moTaLoi,
        chiPhi: schema.suaPhong.chiPhi,
      })
      .from(schema.suaPhong)
      .innerJoin(schema.phong, eq(schema.suaPhong.maPhong, schema.phong.maPhong))
      .innerJoin(schema.taiKhoan, eq(schema.suaPhong.maTk, schema.taiKhoan.maTk)),
```

- [x] **Step 7: Chạy lại, kiểm kiểu, lint**

Run: `npx vitest run src/lib/queries/buong-phong.test.ts src/lib/queries/rooms.test.ts` → Expected: `Tests 12 passed` (6 + 6).
Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.
Run: `npm test` → Expected: `Test Files 35 passed`, `Tests 219 passed`.

- [x] **Step 8: Commit**

```bash
git add src/lib/vai-tro.ts src/lib/queries/buong-phong.ts src/lib/queries/buong-phong.test.ts src/lib/queries/rooms.ts src/lib/queries/rooms.test.ts
git commit -m "feat: doc phong cho don, phong dang bao tri, nhat ky kem ho ten nhan vien

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Màn Buồng phòng (`/housekeeping`)

**Files:**
- Create: `src/app/(app)/housekeeping/actions.ts`, `src/app/(app)/housekeeping/page.tsx`, `src/components/shared/chon-nhan-vien.tsx`, `src/components/housekeeping/buong-phong-ban.tsx`
- Modify: `src/lib/nav.ts`
- Test: `src/app/(app)/housekeeping/actions.test.ts`, `src/lib/nav.test.ts`

**Interfaces:**
- Consumes: `ghiDonPhong`, `baoBaoTri` (Task 5); `getNhanVienTheoLoai`, `getPhongChoDon`, `getNhatKyDon`, `NhanVien`, `PhongChoDon` (Task 6); `LOAI_TK_BUONG_PHONG`; `getSoDoPhong`, `getNgayHienTai`; `SectionCard`, `EmptyState`, `ThongBao`, `useThaoTac`, `Topbar`.
- Produces:
  - Server Action `donXong(maPhong, maTk, ghiChu)` và `baoHong(maPhong, maTk, moTa)`.
  - `<ChonNhanVien nhanVien maTk onChon nhan? />`: ô chọn nhân viên thực hiện, Task 8 dùng lại.
  - Sidebar có mục "Buồng phòng" (`/housekeeping`, icon `SprayCan`) ngay sau "Sơ đồ phòng".
  - Mỗi ô phòng chờ dọn có `role="group"` và `aria-label="Phòng <số>"`, dùng khi kiểm trên trình duyệt.

Kết quả thao tác hiện ở đầu thẻ, không nằm trong ô phòng. Lý do: dọn xong thì trang đọc lại CSDL, phòng rời danh sách và ô phòng biến mất.

- [x] **Step 1: Viết test hỏng**

`src/app/(app)/housekeeping/actions.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { baoHong, donXong } from "@/app/(app)/housekeeping/actions";

// Review Focus #5
describe("Server Action buong phong: tham so sai hinh thuc", () => {
  it("tu choi truoc khi cham CSDL", async () => {
    await expect(donXong(["PH00000005"], "TK00000004", "")).resolves.toEqual({
      ok: false,
      loi: "Phòng không hợp lệ",
    });
    await expect(donXong("PH00000005", { maTk: "TK00000004" }, "")).resolves.toEqual({
      ok: false,
      loi: "Nhân viên không hợp lệ",
    });
    await expect(donXong("PH00000005", "TK00000004", "x".repeat(201))).resolves.toEqual({
      ok: false,
      loi: "Ghi chú không hợp lệ",
    });
    await expect(baoHong("PH00000005", "TK00000004", null)).resolves.toEqual({
      ok: false,
      loi: "Mô tả sự cố không hợp lệ",
    });
  });
});
```

Trong `src/lib/nav.test.ts`, thay ca đầu:

```ts
  it("dung 8 muc, dung thu tu cua artboard", () => {
    expect(MUC_DIEU_HUONG.map((m) => m.nhan)).toEqual([
      "Tổng quan",
      "Sơ đồ phòng",
      "Đặt phòng",
```

bằng:

```ts
  it("8 muc cua artboard, them Buong phong sau So do phong", () => {
    expect(MUC_DIEU_HUONG.map((m) => m.nhan)).toEqual([
      "Tổng quan",
      "Sơ đồ phòng",
      "Buồng phòng",
      "Đặt phòng",
```

Run: `npx vitest run "src/app/(app)/housekeeping/actions.test.ts" src/lib/nav.test.ts`
Expected: FAIL. Không resolve được `housekeeping/actions`; `nav.test.ts` thiếu "Buồng phòng".

- [x] **Step 2: Viết `src/app/(app)/housekeeping/actions.ts`**

```ts
"use server";

import { lamMoiNeuXong } from "@/lib/lam-moi";
import * as buongPhong from "@/lib/thao-tac/buong-phong";
import { khongHopLe, laChuoi, laMa } from "@/lib/thao-tac/kiem-tra";

/**
 * Man Buong phong. Nguoi thuc hien la nhan vien chon o dau man (chua co phien
 * dang nhap, phase 3 lay nguoi trong phien); thu tuc kiem tai khoan con lam viec.
 */

export async function donXong(maPhong: unknown, maTk: unknown, ghiChu: unknown) {
  if (!laMa(maPhong, "PH")) return khongHopLe("Phòng");
  if (!laMa(maTk, "TK")) return khongHopLe("Nhân viên");
  if (!laChuoi(ghiChu, 200)) return khongHopLe("Ghi chú");
  return lamMoiNeuXong(await buongPhong.ghiDonPhong(maPhong, maTk, ghiChu));
}

export async function baoHong(maPhong: unknown, maTk: unknown, moTa: unknown) {
  if (!laMa(maPhong, "PH")) return khongHopLe("Phòng");
  if (!laMa(maTk, "TK")) return khongHopLe("Nhân viên");
  if (!laChuoi(moTa, 200)) return khongHopLe("Mô tả sự cố");
  return lamMoiNeuXong(await buongPhong.baoBaoTri(maPhong, maTk, moTa));
}
```

- [x] **Step 3: Thêm mục vào `src/lib/nav.ts`**

Trong import từ `lucide-react`, thêm `SprayCan,` sau `Receipt,`. Trong `MUC_DIEU_HUONG`, ngay sau dòng `Sơ đồ phòng`, thêm:

```ts
  { nhan: "Buồng phòng",      href: "/housekeeping", icon: SprayCan },
```

Run: `npx vitest run "src/app/(app)/housekeeping/actions.test.ts" src/lib/nav.test.ts` → Expected: `Tests 4 passed`.

- [x] **Step 4: Viết `src/components/shared/chon-nhan-vien.tsx`**

```tsx
"use client";

import type { NhanVien } from "@/lib/queries/buong-phong";

/**
 * O chon nguoi thuc hien o dau man Buong phong / Bao tri, khi chua co phien
 * dang nhap. Phase 3 bo o nay va lay nguoi trong phien.
 */
export function ChonNhanVien({
  nhanVien,
  maTk,
  onChon,
  nhan = "Nhân viên thực hiện",
}: {
  nhanVien: NhanVien[];
  maTk: string;
  onChon: (maTk: string) => void;
  nhan?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-[12.5px]">
      <span className="text-muted-foreground">{nhan}</span>
      <select
        value={maTk}
        onChange={(e) => onChon(e.target.value)}
        disabled={nhanVien.length === 0}
        className="border-input bg-card h-9 rounded-[10px] border px-3 text-[13px]"
      >
        {nhanVien.length === 0 ? <option value="">Không có nhân viên đang làm việc</option> : null}
        {nhanVien.map((n) => (
          <option key={n.maTk} value={n.maTk}>
            {n.hoTen} · {n.maTk}
          </option>
        ))}
      </select>
    </label>
  );
}
```

- [x] **Step 5: Viết `src/components/housekeeping/buong-phong-ban.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Brush, TriangleAlert } from "lucide-react";

import { baoHong, donXong } from "@/app/(app)/housekeeping/actions";
import { ChonNhanVien } from "@/components/shared/chon-nhan-vien";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";
import type { NhanVien, PhongChoDon } from "@/lib/queries/buong-phong";
import { nhanTrangThaiPhong } from "@/lib/status";

type Phong = { maPhong: string; soPhong: string; trangThai: string };
type ThaoTac = ReturnType<typeof useThaoTac>;

/**
 * Man lam viec cua nhan vien buong phong: chon nguoi thuc hien mot lan o dau
 * the, roi bam "Don xong" / "Bao hong" tren tung phong cho don. Thanh cong thi
 * trang doc lai CSDL va phong roi khoi danh sach, nen dong ket qua nam o the
 * (useThaoTac dung chung) chu khong nam trong o phong.
 */
export function BuongPhongBan({
  nhanVien,
  choDon,
  phong,
}: {
  nhanVien: NhanVien[];
  choDon: PhongChoDon[];
  phong: Phong[];
}) {
  const [maTk, setMaTk] = useState(nhanVien[0]?.maTk ?? "");
  const tt = useThaoTac();

  return (
    <>
      <SectionCard
        tieuDe="Phòng chờ dọn"
        phu={`${choDon.length} phòng`}
        hanhDong={<ChonNhanVien nhanVien={nhanVien} maTk={maTk} onChon={setMaTk} />}
      >
        <ThongBao tb={tt.thongBao} />
        {choDon.length === 0 ? (
          <EmptyState thongDiep="Không có phòng nào chờ dọn" />
        ) : (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {choDon.map((p) => (
              <OPhongChoDon key={p.maPhong} phong={p} maTk={maTk} tt={tt} />
            ))}
          </div>
        )}
      </SectionCard>
      <DonPhongKhac phong={phong} maTk={maTk} />
    </>
  );
}

function OPhongChoDon({ phong: p, maTk, tt }: { phong: PhongChoDon; maTk: string; tt: ThaoTac }) {
  const [ghiChu, setGhiChu] = useState("");
  // null = o "Bao hong" dang dong.
  const [moTa, setMoTa] = useState<string | null>(null);
  const khoa = tt.dangChay || !maTk;

  return (
    <div role="group" aria-label={`Phòng ${p.soPhong}`} className="border-border flex flex-col gap-[10px] rounded-[10px] border p-[14px]">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[15px] font-medium">{p.soPhong}</span>
        <span className="text-muted-foreground text-[12px]">
          Tầng {p.tang} · {p.tenLoaiPhong}
        </span>
      </div>
      {p.khachHomNay ? (
        <span
          className="self-start rounded-full px-[9px] py-[3px] text-[11.5px] font-medium"
          style={{ color: "#8A5A0E", background: "#F7EFDD" }}
        >
          Khách hôm nay · {p.khachHomNay.maDatPhong} · {p.khachHomNay.hoTen}
        </span>
      ) : null}
      <input
        aria-label={`Ghi chú dọn phòng ${p.soPhong}`}
        placeholder="Ghi chú (tùy chọn)"
        maxLength={200}
        value={ghiChu}
        onChange={(e) => setGhiChu(e.target.value)}
        className="border-input bg-card h-9 rounded-[8px] border px-3 text-[12.5px]"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={khoa}
          onClick={() => tt.chay(() => donXong(p.maPhong, maTk, ghiChu), () => `Đã ghi nhận dọn xong phòng ${p.soPhong}.`)}
          className="bg-primary text-primary-foreground flex h-9 flex-grow items-center justify-center gap-[6px] rounded-[8px] text-[12.5px] font-semibold disabled:opacity-45"
        >
          <Brush size={14} strokeWidth={2} />
          Dọn xong
        </button>
        <button
          type="button"
          onClick={() => setMoTa(moTa === null ? "" : null)}
          aria-pressed={moTa !== null}
          className="border-border bg-card flex h-9 items-center gap-[6px] rounded-[8px] border px-3 text-[12.5px] text-[#8C3A31]"
        >
          <TriangleAlert size={14} strokeWidth={2} />
          Báo hỏng
        </button>
      </div>
      {moTa !== null ? (
        <div className="flex gap-2">
          <input
            aria-label={`Mô tả sự cố phòng ${p.soPhong}`}
            placeholder="Mô tả sự cố"
            maxLength={200}
            value={moTa}
            onChange={(e) => setMoTa(e.target.value)}
            className="border-input bg-card h-9 min-w-0 flex-grow rounded-[8px] border px-3 text-[12.5px]"
          />
          <button
            type="button"
            disabled={khoa}
            onClick={() =>
              tt.chay(
                () => baoHong(p.maPhong, maTk, moTa),
                () => `Đã báo hỏng phòng ${p.soPhong}, phòng chuyển sang bảo trì.`,
              )
            }
            className="h-9 rounded-[8px] px-3 text-[12.5px] font-semibold text-white disabled:opacity-45"
            style={{ background: "#8C3A31" }}
          >
            Gửi báo hỏng
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DonPhongKhac({ phong, maTk }: { phong: Phong[]; maTk: string }) {
  const [maPhong, setMaPhong] = useState(phong[0]?.maPhong ?? "");
  const [ghiChu, setGhiChu] = useState("");
  const tt = useThaoTac();
  const soPhong = phong.find((p) => p.maPhong === maPhong)?.soPhong ?? "";

  return (
    <SectionCard tieuDe="Ghi nhận dọn phòng khác" phu="Ví dụ phòng đang có khách · chỉ ghi nhật ký">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-[6px] text-[12px]">
          <span className="text-muted-foreground">Phòng</span>
          <select
            value={maPhong}
            onChange={(e) => setMaPhong(e.target.value)}
            className="border-input bg-card h-10 w-[220px] rounded-[10px] border px-3 text-[13px]"
          >
            {phong.map((p) => (
              <option key={p.maPhong} value={p.maPhong}>
                {p.soPhong} · {nhanTrangThaiPhong(p.trangThai).nhan}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[240px] flex-grow flex-col gap-[6px] text-[12px]">
          <span className="text-muted-foreground">Ghi chú</span>
          <input
            maxLength={200}
            value={ghiChu}
            onChange={(e) => setGhiChu(e.target.value)}
            className="border-input bg-card h-10 rounded-[10px] border px-3 text-[13px]"
          />
        </label>
        <button
          type="button"
          disabled={tt.dangChay || !maPhong || !maTk}
          onClick={() =>
            tt.chay(
              () => donXong(maPhong, maTk, ghiChu),
              () => {
                setGhiChu("");
                return `Đã ghi nhận dọn phòng ${soPhong}.`;
              },
            )
          }
          className="bg-primary text-primary-foreground h-10 rounded-[10px] px-5 text-[13px] font-semibold disabled:opacity-45"
        >
          Ghi nhận dọn
        </button>
      </div>
      <ThongBao tb={tt.thongBao} />
    </SectionCard>
  );
}
```

- [x] **Step 6: Viết `src/app/(app)/housekeeping/page.tsx`**

```tsx
import Link from "next/link";
import { BedDouble } from "lucide-react";

import { BuongPhongBan } from "@/components/housekeeping/buong-phong-ban";
import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { formatNgay, formatNgayGio } from "@/lib/format";
import { getNhanVienTheoLoai, getNhatKyDon, getPhongChoDon } from "@/lib/queries/buong-phong";
import { getNgayHienTai } from "@/lib/queries/ngay";
import { getSoDoPhong } from "@/lib/queries/rooms";
import { LOAI_TK_BUONG_PHONG } from "@/lib/vai-tro";

export default async function BuongPhongPage() {
  const [homNay, nhanVien, choDon, phong, nhatKy] = await Promise.all([
    getNgayHienTai(),
    getNhanVienTheoLoai(LOAI_TK_BUONG_PHONG),
    getPhongChoDon(),
    getSoDoPhong(),
    getNhatKyDon(),
  ]);

  return (
    <>
      <Topbar
        tieuDe="Buồng phòng"
        phu={`${choDon.length} phòng chờ dọn · ${formatNgay(homNay)}`}
        hanhDong={
          <Link
            href="/rooms"
            className="border-border bg-card text-primary flex h-10 items-center gap-2 rounded-[10px] border px-[18px] text-[13.5px] font-semibold no-underline"
          >
            <BedDouble size={16} strokeWidth={1.8} />
            <span>Sơ đồ phòng</span>
          </Link>
        }
      />

      <main className="flex min-h-0 flex-grow flex-col gap-5 overflow-auto px-8 py-7">
        <BuongPhongBan
          nhanVien={nhanVien}
          choDon={choDon}
          phong={phong.map((p) => ({ maPhong: p.maPhong, soPhong: p.soPhong, trangThai: p.trangThai }))}
        />

        <SectionCard tieuDe="Nhật ký dọn phòng" phu={`${nhatKy.length} lần gần nhất`}>
          {nhatKy.length === 0 ? (
            <EmptyState thongDiep="Chưa có lần dọn phòng nào" />
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="text-[11px] font-semibold tracking-[0.06em] text-[#857C73] uppercase">
                  <th className="border-border border-b pb-[9px] font-semibold">Thời gian</th>
                  <th className="border-border border-b pb-[9px] font-semibold">Phòng</th>
                  <th className="border-border border-b pb-[9px] font-semibold">Nhân viên</th>
                  <th className="border-border border-b pb-[9px] font-semibold">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {nhatKy.map((n) => (
                  <tr key={n.maDon} className="text-[13px]">
                    <td className="border-border border-b py-[11px] font-mono text-[12.5px]">
                      {formatNgayGio(n.thoiGian)}
                    </td>
                    <td className="border-border border-b py-[11px] font-mono text-[12.5px]">{n.soPhong}</td>
                    <td className="border-border border-b py-[11px]">{n.nhanVien}</td>
                    <td className="border-border text-muted-foreground border-b py-[11px]">{n.ghiChu ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      </main>
    </>
  );
}
```

- [x] **Step 7: Kiểm kiểu, lint, cả bộ test**

Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.
Run: `npm test` → Expected: `Test Files 36 passed`, `Tests 220 passed`.

- [x] **Step 8: Commit**

```bash
git add "src/app/(app)/housekeeping" src/components/housekeeping src/components/shared/chon-nhan-vien.tsx src/lib/nav.ts src/lib/nav.test.ts
git commit -m "feat: man Buong phong: phong cho don, don xong, bao hong

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Màn Bảo trì (`/maintenance`)

**Files:**
- Create: `src/app/(app)/maintenance/actions.ts`, `src/app/(app)/maintenance/page.tsx`, `src/components/maintenance/bao-tri-ban.tsx`
- Modify: `src/lib/nav.ts`
- Test: `src/app/(app)/maintenance/actions.test.ts`, `src/lib/nav.test.ts`

**Interfaces:**
- Consumes: `ghiSuaPhong` (Task 5); `getNhanVienTheoLoai`, `getPhongDangBaoTri`, `getNhatKySua`, `PhongDangBaoTri` (Task 6); `LOAI_TK_KY_THUAT`; `ChonNhanVien` (Task 7); `docSoTien` (`tinh-toan.ts`); `laTien`.
- Produces:
  - Server Action `suaXong(maPhong, maTk, chiPhi, moTaLoi)`.
  - Sidebar có mục "Bảo trì" (`/maintenance`, icon `Wrench`) ngay sau "Buồng phòng".
  - Mỗi phòng đang bảo trì có `role="group"` và `aria-label="Phòng <số>"`. Ô `name="chiPhi"` điền sẵn chi phí của phiếu, bỏ `.00`. Ô `name="moTaLoi"` điền sẵn mô tả của phiếu.

- [x] **Step 1: Viết test hỏng**

`src/app/(app)/maintenance/actions.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { suaXong } from "@/app/(app)/maintenance/actions";

// Review Focus #5
describe("Server Action bao tri: tham so sai hinh thuc", () => {
  it("tu choi truoc khi cham CSDL", async () => {
    await expect(suaXong({}, "TK00000006", "0", "")).resolves.toEqual({
      ok: false,
      loi: "Phòng không hợp lệ",
    });
    await expect(suaXong("PH00000004", "LTK0000004", "0", "")).resolves.toEqual({
      ok: false,
      loi: "Kỹ thuật viên không hợp lệ",
    });
    await expect(suaXong("PH00000004", "TK00000006", "-5", "")).resolves.toEqual({
      ok: false,
      loi: "Chi phí không hợp lệ",
    });
    await expect(suaXong("PH00000004", "TK00000006", "0", 42)).resolves.toEqual({
      ok: false,
      loi: "Mô tả không hợp lệ",
    });
  });
});
```

Trong `src/lib/nav.test.ts`, thay:

```ts
  it("8 muc cua artboard, them Buong phong sau So do phong", () => {
    expect(MUC_DIEU_HUONG.map((m) => m.nhan)).toEqual([
      "Tổng quan",
      "Sơ đồ phòng",
      "Buồng phòng",
```

bằng:

```ts
  it("8 muc cua artboard, them Buong phong va Bao tri sau So do phong", () => {
    expect(MUC_DIEU_HUONG.map((m) => m.nhan)).toEqual([
      "Tổng quan",
      "Sơ đồ phòng",
      "Buồng phòng",
      "Bảo trì",
```

Run: `npx vitest run "src/app/(app)/maintenance/actions.test.ts" src/lib/nav.test.ts` → Expected: FAIL.

- [x] **Step 2: Viết `src/app/(app)/maintenance/actions.ts`**

```ts
"use server";

import { lamMoiNeuXong } from "@/lib/lam-moi";
import * as buongPhong from "@/lib/thao-tac/buong-phong";
import { khongHopLe, laChuoi, laMa, laTien } from "@/lib/thao-tac/kiem-tra";

/**
 * Man Bao tri: ky thuat vien (chon o dau man) ghi nhan da sua xong. Phong phai
 * dang BaoTri va tai khoan con lam viec: sp_GhiNhanSuaPhong quyet dinh.
 */
export async function suaXong(maPhong: unknown, maTk: unknown, chiPhi: unknown, moTaLoi: unknown) {
  if (!laMa(maPhong, "PH")) return khongHopLe("Phòng");
  if (!laMa(maTk, "TK")) return khongHopLe("Kỹ thuật viên");
  if (!laTien(chiPhi)) return khongHopLe("Chi phí");
  if (!laChuoi(moTaLoi, 200)) return khongHopLe("Mô tả");
  return lamMoiNeuXong(await buongPhong.ghiSuaPhong(maPhong, maTk, chiPhi, moTaLoi));
}
```

- [x] **Step 3: Thêm mục vào `src/lib/nav.ts`**

Trong import từ `lucide-react`, thêm `Wrench,` sau `Users,`. Ngay sau dòng `Buồng phòng`, thêm:

```ts
  { nhan: "Bảo trì",          href: "/maintenance",  icon: Wrench },
```

Run: `npx vitest run "src/app/(app)/maintenance/actions.test.ts" src/lib/nav.test.ts` → Expected: `Tests 4 passed`.

- [x] **Step 4: Viết `src/components/maintenance/bao-tri-ban.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Wrench } from "lucide-react";

import { suaXong } from "@/app/(app)/maintenance/actions";
import { ChonNhanVien } from "@/components/shared/chon-nhan-vien";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";
import { formatNgayGio } from "@/lib/format";
import type { NhanVien, PhongDangBaoTri } from "@/lib/queries/buong-phong";
import { docSoTien } from "@/lib/tinh-toan";

type ThaoTac = ReturnType<typeof useThaoTac>;

/**
 * Man lam viec cua ky thuat: moi phong BaoTri kem phieu dang mo. "Sua xong" mo
 * o chi phi va mo ta, dien san tu phieu (phieu cu cua du lieu mau da co chi phi,
 * de trong thi ghi de mat so do). Thanh cong thi phong sang DangDon, roi khoi
 * danh sach, nen dong ket qua nam o dau the.
 */
export function BaoTriBan({ nhanVien, baoTri }: { nhanVien: NhanVien[]; baoTri: PhongDangBaoTri[] }) {
  const [maTk, setMaTk] = useState(nhanVien[0]?.maTk ?? "");
  const tt = useThaoTac();

  return (
    <SectionCard
      tieuDe="Phòng đang bảo trì"
      phu={`${baoTri.length} phòng`}
      hanhDong={<ChonNhanVien nhan="Kỹ thuật viên" nhanVien={nhanVien} maTk={maTk} onChon={setMaTk} />}
    >
      <ThongBao tb={tt.thongBao} />
      {baoTri.length === 0 ? (
        <EmptyState thongDiep="Không có phòng nào đang bảo trì" />
      ) : (
        <div className="flex flex-col gap-3">
          {baoTri.map((p) => (
            <DongBaoTri key={p.maPhong} phong={p} maTk={maTk} tt={tt} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function DongBaoTri({ phong: p, maTk, tt }: { phong: PhongDangBaoTri; maTk: string; tt: ThaoTac }) {
  const [mo, setMo] = useState(false);
  const [chiPhi, setChiPhi] = useState(p.phieu ? p.phieu.chiPhi.replace(/\.00$/, "") : "0");
  const [moTa, setMoTa] = useState(p.phieu?.moTaLoi ?? "");

  return (
    <div role="group" aria-label={`Phòng ${p.soPhong}`} className="border-border flex flex-col gap-3 rounded-[10px] border p-4">
      <div className="flex items-start gap-4">
        <div className="flex w-[130px] shrink-0 flex-col gap-px">
          <span className="font-mono text-[15px] font-medium">{p.soPhong}</span>
          <span className="text-muted-foreground text-[11.5px]">
            Tầng {p.tang} · {p.tenLoaiPhong}
          </span>
        </div>
        <div className="flex min-w-0 flex-grow flex-col gap-1">
          <span className="text-[13px] font-medium">{p.phieu?.moTaLoi || "Chưa có mô tả sự cố"}</span>
          {p.phieu ? (
            <span className="text-muted-foreground text-[12px]">
              Ghi bởi {p.phieu.nguoiGhi} · {formatNgayGio(p.phieu.thoiGian)} · chờ {p.phieu.soNgayCho} ngày
            </span>
          ) : null}
          {p.khachHomNay ? (
            <span
              className="self-start rounded-full px-[9px] py-[3px] text-[11.5px] font-medium"
              style={{ color: "#8A5A0E", background: "#F7EFDD" }}
            >
              Khách hôm nay · {p.khachHomNay.maDatPhong} · {p.khachHomNay.hoTen}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setMo(!mo)}
          aria-pressed={mo}
          className="bg-primary text-primary-foreground flex h-9 shrink-0 items-center gap-[6px] rounded-[8px] px-4 text-[12.5px] font-semibold"
        >
          <Wrench size={14} strokeWidth={2} />
          Sửa xong
        </button>
      </div>
      {mo ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-[6px] text-[12px]">
            <span className="text-muted-foreground">Chi phí (đ)</span>
            <input
              name="chiPhi"
              inputMode="decimal"
              value={chiPhi}
              onChange={(e) => setChiPhi(e.target.value)}
              className="border-input bg-card h-10 w-[150px] rounded-[10px] border px-3 font-mono text-[13px]"
            />
          </label>
          <label className="flex min-w-[260px] flex-grow flex-col gap-[6px] text-[12px]">
            <span className="text-muted-foreground">Mô tả (để trống thì giữ mô tả cũ)</span>
            <input
              name="moTaLoi"
              maxLength={200}
              value={moTa}
              onChange={(e) => setMoTa(e.target.value)}
              className="border-input bg-card h-10 rounded-[10px] border px-3 text-[13px]"
            />
          </label>
          <button
            type="button"
            disabled={tt.dangChay || !maTk}
            onClick={() =>
              tt.chay(
                () => suaXong(p.maPhong, maTk, docSoTien(chiPhi) || "0", moTa),
                () => `Phòng ${p.soPhong} chuyển sang Đang dọn, chờ buồng phòng.`,
              )
            }
            className="bg-primary text-primary-foreground h-10 rounded-[10px] px-5 text-[13px] font-semibold disabled:opacity-45"
          >
            Xác nhận sửa xong
          </button>
        </div>
      ) : null}
    </div>
  );
}
```

- [x] **Step 5: Viết `src/app/(app)/maintenance/page.tsx`**

```tsx
import Link from "next/link";
import { BedDouble } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { BaoTriBan } from "@/components/maintenance/bao-tri-ban";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { formatNgay, formatNgayGio, formatVnd } from "@/lib/format";
import { getNhanVienTheoLoai, getNhatKySua, getPhongDangBaoTri } from "@/lib/queries/buong-phong";
import { getNgayHienTai } from "@/lib/queries/ngay";
import { LOAI_TK_KY_THUAT } from "@/lib/vai-tro";

export default async function BaoTriPage() {
  const [homNay, nhanVien, baoTri, nhatKy] = await Promise.all([
    getNgayHienTai(),
    getNhanVienTheoLoai(LOAI_TK_KY_THUAT),
    getPhongDangBaoTri(),
    getNhatKySua(),
  ]);

  return (
    <>
      <Topbar
        tieuDe="Bảo trì"
        phu={`${baoTri.length} phòng đang bảo trì · ${formatNgay(homNay)}`}
        hanhDong={
          <Link
            href="/rooms"
            className="border-border bg-card text-primary flex h-10 items-center gap-2 rounded-[10px] border px-[18px] text-[13.5px] font-semibold no-underline"
          >
            <BedDouble size={16} strokeWidth={1.8} />
            <span>Sơ đồ phòng</span>
          </Link>
        }
      />

      <main className="flex min-h-0 flex-grow flex-col gap-5 overflow-auto px-8 py-7">
        <BaoTriBan nhanVien={nhanVien} baoTri={baoTri} />

        <SectionCard tieuDe="Nhật ký sửa chữa" phu={`${nhatKy.length} lần gần nhất`}>
          {nhatKy.length === 0 ? (
            <EmptyState thongDiep="Chưa có lần sửa chữa nào" />
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="text-[11px] font-semibold tracking-[0.06em] text-[#857C73] uppercase">
                  <th className="border-border border-b pb-[9px] font-semibold">Thời gian</th>
                  <th className="border-border border-b pb-[9px] font-semibold">Phòng</th>
                  <th className="border-border border-b pb-[9px] font-semibold">Nhân viên</th>
                  <th className="border-border border-b pb-[9px] font-semibold">Mô tả</th>
                  <th className="border-border border-b pb-[9px] text-right font-semibold">Chi phí</th>
                </tr>
              </thead>
              <tbody>
                {nhatKy.map((n) => (
                  <tr key={n.maSua} className="text-[13px]">
                    <td className="border-border border-b py-[11px] font-mono text-[12.5px]">
                      {formatNgayGio(n.thoiGian)}
                    </td>
                    <td className="border-border border-b py-[11px] font-mono text-[12.5px]">{n.soPhong}</td>
                    <td className="border-border border-b py-[11px]">{n.nhanVien}</td>
                    <td className="border-border text-muted-foreground border-b py-[11px]">{n.moTaLoi ?? ""}</td>
                    <td className="border-border border-b py-[11px] text-right font-mono text-[12.5px]">
                      {formatVnd(n.chiPhi)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      </main>
    </>
  );
}
```

- [x] **Step 6: Kiểm kiểu, lint, cả bộ test**

Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.
Run: `npm test` → Expected: `Test Files 37 passed`, `Tests 221 passed`.

- [x] **Step 7: Commit**

```bash
git add "src/app/(app)/maintenance" src/components/maintenance src/lib/nav.ts src/lib/nav.test.ts
git commit -m "feat: man Bao tri: phong dang bao tri kem phieu dang mo, sua xong

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Sơ đồ phòng (báo dọn / báo bảo trì) và thẻ việc cần làm ở Tổng quan

**Files:**
- Create: `src/components/rooms/thao-tac-phong.tsx`
- Modify: `src/app/(app)/rooms/actions.ts` (viết lại), `src/app/(app)/rooms/page.tsx` (viết lại), `src/components/rooms/room-filter.tsx`, `src/app/(app)/page.tsx`
- Delete: `src/components/rooms/nhat-ky-form.tsx`
- Test: `src/app/(app)/rooms/actions.test.ts` (viết lại)

**Interfaces:**
- Consumes: `baoDonPhong`, `baoBaoTri` (Task 5); `getPhongDangBaoTri` (Task 6); `getNhanVienMacDinh`; `StatusBadge`, `ThongBao`, `useThaoTac`.
- Produces:
  - Server Action `baoDonPhong(maPhong)`, `baoBaoTri(maPhong, moTa)`. Người báo là nhân viên mặc định.
  - `RoomFilter` nhận thêm `suCo: Record<string, string>` (mã phòng → mô tả sự cố đang mở). Ô phòng là `<button aria-label="Phòng <số>, <trạng thái>" aria-pressed>`.
  - `<ThaoTacPhong phong suCo? onDong />`: ô `name="moTaSuCo"`, nút "Báo dọn phòng" và "Báo bảo trì" **không khóa theo trạng thái**.
  - Tổng quan: thẻ chờ dọn dẫn tới `/housekeeping`. Thẻ "N phòng đang bảo trì" lấy từ `getPhongDangBaoTri()`, dẫn tới `/maintenance`.

- [x] **Step 1: Viết lại test `src/app/(app)/rooms/actions.test.ts` (test hỏng)**

```ts
import { describe, expect, it } from "vitest";

import { baoBaoTri, baoDonPhong } from "@/app/(app)/rooms/actions";

// Review Focus #5
describe("Server Action So do phong: tham so sai hinh thuc", () => {
  it("tu choi truoc khi cham CSDL", async () => {
    await expect(baoDonPhong({ MaPhong: "PH00000001" })).resolves.toEqual({
      ok: false,
      loi: "Phòng không hợp lệ",
    });
    await expect(baoDonPhong("PH1")).resolves.toEqual({ ok: false, loi: "Phòng không hợp lệ" });
    await expect(baoBaoTri("PH00000001", "x".repeat(201))).resolves.toEqual({
      ok: false,
      loi: "Mô tả sự cố không hợp lệ",
    });
    await expect(baoBaoTri("PH00000001", ["Voi sen"])).resolves.toEqual({
      ok: false,
      loi: "Mô tả sự cố không hợp lệ",
    });
  });
});
```

Run: `npx vitest run "src/app/(app)/rooms/actions.test.ts"` → Expected: FAIL, `baoDonPhong is not a function`.

- [x] **Step 2: Viết lại `src/app/(app)/rooms/actions.ts`**

```ts
"use server";

import { lamMoiNeuXong } from "@/lib/lam-moi";
import { getNhanVienMacDinh } from "@/lib/queries/accounts";
import * as buongPhong from "@/lib/thao-tac/buong-phong";
import { khongHopLe, laChuoi, laMa } from "@/lib/thao-tac/kiem-tra";

/**
 * Khung thao tac cua mot phong tren So do phong. Nguoi bao tam la nhan vien
 * mac dinh (phase 3 doi sang phien). "Don xong" / "Sua xong" nam o man Buong
 * phong va Bao tri.
 */

export async function baoDonPhong(maPhong: unknown) {
  if (!laMa(maPhong, "PH")) return khongHopLe("Phòng");
  return lamMoiNeuXong(await buongPhong.baoDonPhong(maPhong));
}

export async function baoBaoTri(maPhong: unknown, moTa: unknown) {
  if (!laMa(maPhong, "PH")) return khongHopLe("Phòng");
  if (!laChuoi(moTa, 200)) return khongHopLe("Mô tả sự cố");
  const nv = await getNhanVienMacDinh();
  return lamMoiNeuXong(await buongPhong.baoBaoTri(maPhong, nv.maTk, moTa));
}
```

Run: `npx vitest run "src/app/(app)/rooms/actions.test.ts"` → Expected: `Tests 1 passed`.

- [x] **Step 3: Viết `src/components/rooms/thao-tac-phong.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Brush, Wrench, X } from "lucide-react";

import { baoBaoTri, baoDonPhong } from "@/app/(app)/rooms/actions";
import { StatusBadge } from "@/components/shared/status-badge";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";
import type { PhongTrenSoDo } from "@/lib/queries/rooms";

/**
 * Khung thao tac cua phong dang chon tren So do phong: bao don (sp_BaoDonPhong)
 * va bao bao tri (sp_BaoBaoTri). Nut khong khoa theo trang thai phong: bam sai
 * trang thai thi thu tuc tu choi va cau cua CSDL hien ngay duoi nut.
 */
export function ThaoTacPhong({
  phong: p,
  suCo,
  onDong,
}: {
  phong: PhongTrenSoDo;
  suCo?: string;
  onDong: () => void;
}) {
  const [moTa, setMoTa] = useState("");
  const tt = useThaoTac();

  return (
    <section
      aria-label={`Thao tác phòng ${p.soPhong}`}
      className="bg-card border-border flex shrink-0 flex-col gap-3 rounded-[14px] border p-5"
    >
      <div className="flex items-center gap-3">
        <h2 className="m-0 font-mono text-[16px] font-medium">Phòng {p.soPhong}</h2>
        <span className="text-muted-foreground text-[12.5px]">
          Tầng {p.tang} · {p.tenLoaiPhong}
        </span>
        <StatusBadge trangThai={p.trangThai} />
        <span className="flex-grow" />
        <button type="button" aria-label="Đóng khung thao tác" onClick={onDong} className="text-muted-foreground">
          <X size={18} strokeWidth={1.8} />
        </button>
      </div>
      {suCo ? (
        <p className="m-0 text-[12.5px]" style={{ color: "#8C3A31" }}>
          Sự cố đang mở: {suCo}
        </p>
      ) : null}
      <div className="flex flex-wrap items-end gap-3">
        <button
          type="button"
          disabled={tt.dangChay}
          onClick={() =>
            tt.chay(
              () => baoDonPhong(p.maPhong),
              () => `Đã báo dọn phòng ${p.soPhong}, phòng vào danh sách chờ dọn.`,
            )
          }
          className="border-border bg-card text-primary flex h-10 items-center gap-2 rounded-[10px] border px-4 text-[13px] font-semibold disabled:opacity-45"
        >
          <Brush size={15} strokeWidth={2} />
          Báo dọn phòng
        </button>
        <label className="flex min-w-[280px] flex-grow flex-col gap-[6px] text-[12px]">
          <span className="text-muted-foreground">Mô tả sự cố</span>
          <input
            name="moTaSuCo"
            maxLength={200}
            value={moTa}
            onChange={(e) => setMoTa(e.target.value)}
            placeholder="Ví dụ: vòi sen rỉ nước"
            className="border-input bg-card h-10 rounded-[10px] border px-3 text-[13px]"
          />
        </label>
        <button
          type="button"
          disabled={tt.dangChay}
          onClick={() =>
            tt.chay(
              () => baoBaoTri(p.maPhong, moTa),
              () => {
                setMoTa("");
                return `Đã báo bảo trì phòng ${p.soPhong}.`;
              },
            )
          }
          className="bg-primary text-primary-foreground flex h-10 items-center gap-2 rounded-[10px] px-4 text-[13px] font-semibold disabled:opacity-45"
        >
          <Wrench size={15} strokeWidth={2} />
          Báo bảo trì
        </button>
      </div>
      <ThongBao tb={tt.thongBao} />
    </section>
  );
}
```

- [x] **Step 4: Sửa `src/components/rooms/room-filter.tsx`**

Sau `import { EmptyState } from "@/components/shared/empty-state";`, thêm:

```tsx
import { ThaoTacPhong } from "@/components/rooms/thao-tac-phong";
```

Thay:

```tsx
export function RoomFilter({
  phong,
  loaiPhong,
}: {
  phong: PhongTrenSoDo[];
  loaiPhong: { maLoaiPhong: string; tenLoaiPhong: string }[];
}) {
  const [trangThai, setTrangThai] = useState<string>(TAT_CA);
```

bằng:

```tsx
export function RoomFilter({
  phong,
  loaiPhong,
  suCo,
}: {
  phong: PhongTrenSoDo[];
  loaiPhong: { maLoaiPhong: string; tenLoaiPhong: string }[];
  /** Ma phong -> mo ta su co dang mo, chi co cho phong BaoTri. */
  suCo: Record<string, string>;
}) {
  const [trangThai, setTrangThai] = useState<string>(TAT_CA);
  // Giu ma chu khong giu object: sau moi lan ghi, trang doc lai CSDL va
  // khung thao tac hien dung trang thai moi cua phong.
  const [maDangChon, setMaDangChon] = useState<string | null>(null);
  const dangChon = phong.find((p) => p.maPhong === maDangChon);
```

Thay (chỗ nối giữa thanh lọc và lưới):

```tsx
      </section>

      <section className="bg-card border-border flex shrink-0 flex-col gap-4 rounded-[14px] border p-5">
```

bằng:

```tsx
      </section>

      {dangChon ? (
        <ThaoTacPhong
          key={dangChon.maPhong}
          phong={dangChon}
          suCo={suCo[dangChon.maPhong]}
          onDong={() => setMaDangChon(null)}
        />
      ) : null}

      <section className="bg-card border-border flex shrink-0 flex-col gap-4 rounded-[14px] border p-5">
```

Thay ô phòng:

```tsx
                      return (
                        <div
                          key={p.maPhong}
                          className="flex flex-col gap-[3px] rounded-[10px] px-3 py-[10px]"
                          style={{ background: mau.bg }}
                        >
```

bằng:

```tsx
                      const on = p.maPhong === maDangChon;
                      return (
                        <button
                          key={p.maPhong}
                          type="button"
                          onClick={() => setMaDangChon(on ? null : p.maPhong)}
                          aria-pressed={on}
                          aria-label={`Phòng ${p.soPhong}, ${mau.nhan}`}
                          className="flex flex-col gap-[3px] rounded-[10px] px-3 py-[10px] text-left"
                          style={{
                            background: mau.bg,
                            outline: on ? `2px solid ${mau.dot}` : undefined,
                            outlineOffset: 1,
                          }}
                        >
```

và thẻ đóng tương ứng ngay sau `{formatVnd(p.donGiaNgay)}`:

```tsx
                          </span>
                        </div>
                      );
```

bằng:

```tsx
                          </span>
                        </button>
                      );
```

- [x] **Step 5: Viết lại `src/app/(app)/rooms/page.tsx`, xóa `nhat-ky-form.tsx`**

```tsx
import Link from "next/link";
import { Plus } from "lucide-react";

import { RoomFilter } from "@/components/rooms/room-filter";
import { Topbar } from "@/components/layout/topbar";
import { SectionCard } from "@/components/shared/section-card";
import { formatNgay, formatNgayGio, formatVnd } from "@/lib/format";
import { getPhongDangBaoTri } from "@/lib/queries/buong-phong";
import { getGioHienTai, getNgayHienTai } from "@/lib/queries/ngay";
import { getNhatKyBuongPhong, getSoDoPhong } from "@/lib/queries/rooms";

export default async function SoDoPhongPage() {
  const [homNay, gio, phong, nhatKy, baoTri] = await Promise.all([
    getNgayHienTai(),
    getGioHienTai(),
    getSoDoPhong(),
    getNhatKyBuongPhong(),
    getPhongDangBaoTri(),
  ]);

  // Danh sach loai phong cho o chon, lay tu chinh cac phong dang co.
  const loaiPhong = [...new Map(phong.map((p) => [p.tenLoaiPhong, p])).values()]
    .map((p) => ({ maLoaiPhong: p.tenLoaiPhong, tenLoaiPhong: p.tenLoaiPhong }))
    .sort((a, b) => a.tenLoaiPhong.localeCompare(b.tenLoaiPhong));
  const suCo = Object.fromEntries(baoTri.map((p) => [p.maPhong, p.phieu?.moTaLoi ?? ""]));

  return (
    <>
      <Topbar
        tieuDe="Sơ đồ phòng"
        phu={`Cập nhật ${gio} · ${formatNgay(homNay)} · bấm vào phòng để báo dọn / báo bảo trì`}
        hanhDong={
          <Link
            href="/bookings/new"
            className="bg-primary text-primary-foreground flex h-10 items-center gap-2 rounded-[10px] px-[18px] text-[13.5px] font-semibold no-underline"
          >
            <Plus size={16} strokeWidth={2} />
            <span>Tra cứu phòng trống</span>
          </Link>
        }
      />

      <main className="flex min-h-0 flex-grow flex-col gap-5 overflow-auto px-8 py-7">
        <RoomFilter phong={phong} loaiPhong={loaiPhong} suCo={suCo} />

        <SectionCard
          tieuDe="Nhật ký buồng phòng & sửa chữa"
          phu={`${nhatKy.length} ghi nhận`}
          hanhDong={
            <span className="flex gap-4 text-[12.5px] font-semibold">
              <Link href="/housekeeping" className="text-primary no-underline">
                Buồng phòng →
              </Link>
              <Link href="/maintenance" className="text-primary no-underline">
                Bảo trì →
              </Link>
            </span>
          }
        >
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-[11px] font-semibold tracking-[0.06em] text-[#857C73] uppercase">
                <th className="border-border border-b pb-[9px] font-semibold">Thời gian</th>
                <th className="border-border border-b pb-[9px] font-semibold">Phòng</th>
                <th className="border-border border-b pb-[9px] font-semibold">Loại ghi nhận</th>
                <th className="border-border border-b pb-[9px] font-semibold">Nhân viên</th>
                <th className="border-border border-b pb-[9px] font-semibold">Ghi chú</th>
                <th className="border-border border-b pb-[9px] text-right font-semibold">Chi phí</th>
              </tr>
            </thead>
            <tbody>
              {nhatKy.slice(0, 12).map((n, i) => (
                <tr key={`${n.loai}-${n.ngayGio}-${i}`} className="text-[13px]">
                  <td className="border-border border-b py-[11px] font-mono text-[12.5px]">
                    {formatNgayGio(n.ngayGio)}
                  </td>
                  <td className="border-border border-b py-[11px] font-mono text-[12.5px]">{n.soPhong}</td>
                  <td className="border-border border-b py-[11px]">
                    <span
                      className="rounded-full px-[9px] py-[3px] text-[11.5px] font-medium"
                      style={
                        n.loai === "DonPhong"
                          ? { color: "#5B4B85", background: "#ECE9F5" }
                          : { color: "#8C3A31", background: "#F8E8E5" }
                      }
                    >
                      {n.loai === "DonPhong" ? "Dọn phòng" : "Sửa chữa"}
                    </span>
                  </td>
                  <td className="border-border border-b py-[11px]">{n.nhanVien}</td>
                  <td className="border-border text-muted-foreground border-b py-[11px]">{n.ghiChu}</td>
                  <td className="border-border border-b py-[11px] text-right font-mono text-[12.5px]">
                    {n.chiPhi === null ? "—" : formatVnd(n.chiPhi)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      </main>
    </>
  );
}
```

```bash
git rm src/components/rooms/nhat-ky-form.tsx
```

- [x] **Step 6: Tổng quan: thẻ chờ dọn và thẻ đang bảo trì (`src/app/(app)/page.tsx`)**

Thay:

```tsx
import {
  getNhatKyBuongPhong,
  getSoDoPhong,
  getThongKePhongTheoTrangThai,
} from "@/lib/queries/rooms";
```

bằng:

```tsx
import { getPhongDangBaoTri } from "@/lib/queries/buong-phong";
import { getSoDoPhong, getThongKePhongTheoTrangThai } from "@/lib/queries/rooms";
```

Thay `const [homNay, chiSo, thongKe, phong, nhan, tra, nhatKy] = await Promise.all([` bằng `const [homNay, chiSo, thongKe, phong, nhan, tra, baoTri] = await Promise.all([`. Trong mảng đó, thay `    getNhatKyBuongPhong(),` bằng `    getPhongDangBaoTri(),`.

Xóa hai dòng:

```tsx
  // Phieu sua chua chua co chi phi = viec dang xu ly, chua xong.
  const dangHong = nhatKy.filter((n) => n.loai === "SuaPhong" && n.chiPhi === "0.00");
```

Thay thẻ chờ dọn:

```tsx
              <ViecCanLam
                href="/rooms"
                mau="#ECE9F5"
```

bằng:

```tsx
              <ViecCanLam
                href="/housekeeping"
                mau="#ECE9F5"
```

Thay thẻ báo hỏng:

```tsx
              <ViecCanLam
                href="/rooms"
                mau="#F8E8E5"
                mauChu="#8C3A31"
                icon={<AlertTriangle size={18} strokeWidth={1.8} />}
                tieuDe={
                  dangHong.length > 0
                    ? `Phòng ${dangHong[0].soPhong} báo hỏng`
                    : "Không có phòng nào báo hỏng"
                }
                phu={dangHong[0]?.ghiChu ?? "Mọi thiết bị đang hoạt động"}
              />
```

bằng:

```tsx
              {/* Phieu bao tri dang mo (phong BaoTri), khong phai moi dong SUA_PHONG 0d. */}
              <ViecCanLam
                href="/maintenance"
                mau="#F8E8E5"
                mauChu="#8C3A31"
                icon={<AlertTriangle size={18} strokeWidth={1.8} />}
                tieuDe={
                  baoTri.length > 0 ? `${baoTri.length} phòng đang bảo trì` : "Không có phòng nào bảo trì"
                }
                phu={
                  baoTri.map((p) => `${p.soPhong}: ${p.phieu?.moTaLoi ?? "chưa có mô tả"}`).join(" · ") ||
                  "Mọi thiết bị đang hoạt động"
                }
              />
```

- [x] **Step 7: Kiểm kiểu, lint, cả bộ test**

Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi. Không còn import `NhatKyForm`, `getNhatKyBuongPhong` trong `(app)/page.tsx`, `dangHong`.
Run: `grep -rn "nhat-ky-form" src; grep -rln "ghiSuaPhong" src/app src/components` → Expected: không có dòng `nhat-ky-form` nào; chỉ còn `src/app/(app)/maintenance/actions.ts` gọi `ghiSuaPhong`.
Run: `npm test` → Expected: `Test Files 37 passed`, `Tests 221 passed`.

- [x] **Step 8: Commit**

```bash
git add -A "src/app/(app)/rooms" "src/app/(app)/page.tsx" src/components/rooms
git commit -m "feat: So do phong bao don / bao bao tri; Tong quan dan toi Buong phong, Bao tri

Nhat ky tren So do phong chi con de xem, don xong / sua xong chuyen sang hai
man nhan vien. The bao hong o Tong quan lay phieu bao tri dang mo thay cho moi
dong SUA_PHONG 0d.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 10: Một công thức giá trung bình (`fn_DonGiaTrungBinh`)

**Files:**
- Modify (ngoài git): `$QLKS_SCRIPTS_DIR/02_Functions.sql`, `04_Triggers.sql`, `06_Procedures.sql`, `08_Security_Roles.sql`
- Test: `src/db/thu-tuc.test.ts` (thêm 3 ca)

**Interfaces:**
- Consumes: `callProcedure`, `callProcedureOut`, `pool`, `dong`; `vasql.py`.
- Produces:
  - Hàm `fn_DonGiaTrungBinh(p_MaLoaiPhong, p_CheckIn, p_CheckOut) RETURNS DECIMAL(18,2)`: trung bình `fn_DonGiaPhongTheoNgay` của từng đêm `[in, out)`, `ROUND(…, 2)`. Ngày `NULL` hoặc `out <= in` thì trả `NULL`.
  - `sp_DatPhong` (giá chốt vào `CHI_TIET_DAT_PHONG`), `sp_TraCuuPhongTrong` (`DonGiaMotDem`, `TamTinh`) và `trg_CTDP_TinhThanhTien_BI` (khi truyền giá 0) cùng gọi hàm này.
  - `08`: `EXECUTE` hai hàm giá cho `r_khachhang`, `r_letan`, `r_quanly`.

Task 11 đổi query của form đặt phòng sang hàm này.

- [x] **Step 1: Thêm test hỏng vào `src/db/thu-tuc.test.ts`**

Thêm `import { pool } from "@/db";` lên đầu nhóm import. Thêm vào cuối file:

```ts
describe("fn_DonGiaTrungBinh: mot cong thuc gia trung binh", () => {
  // LP00000002: bang gia 880.000 den het 07/01/2027, sau do lui ve gia goc 800.000.
  it("trung binh tung dem, lam tron 2 chu so; ngay sai tra NULL", async () => {
    expect(await dong("SELECT fn_DonGiaTrungBinh('LP00000002', '2027-01-06', '2027-01-10') AS g")).toEqual({
      g: "840000.00",
    });
    // (880.000 + 880.000 + 800.000) / 3 = 853.333,33...
    expect(await dong("SELECT fn_DonGiaTrungBinh('LP00000002', '2027-01-06', '2027-01-09') AS g")).toEqual({
      g: "853333.33",
    });
    expect(await dong("SELECT fn_DonGiaTrungBinh('LP00000002', '2026-10-03', '2026-10-01') AS g")).toEqual({
      g: null,
    });
  });

  it("sp_TraCuuPhongTrong bao dung don gia sp_DatPhong se chot", async () => {
    const [p] = await callProcedure<{ MaPhong: string; DonGiaMotDem: string; TamTinh: string }>(
      "sp_TraCuuPhongTrong",
      ["2027-01-06", "2027-01-09", "LP00000002"],
    );
    expect(p).toMatchObject({ DonGiaMotDem: "853333.33", TamTinh: "2559999.99" });
    const { out } = await callProcedureOut(
      "sp_DatPhong",
      ["KH00000001", LE_TAN, "2027-01-06", "2027-01-09", p.MaPhong, 0],
      1,
    );
    expect(
      await dong("SELECT GiaThueThoiDiem, SoDem FROM CHI_TIET_DAT_PHONG WHERE MaDatPhong = ?", [out[0]]),
    ).toEqual({ GiaThueThoiDiem: "853333.33", SoDem: 3 });
  });

  it("trigger: chen chi tiet voi gia 0 thi tu dien gia trung binh, khong phai gia ngay nhan", async () => {
    await pool.query(
      `INSERT INTO PHIEU_DAT_PHONG (MaDatPhong, MaKH, MaTK, NgayCheckIn, NgayCheckOut, TienCoc, TrangThai)
       VALUES ('DP00000200', 'KH00000001', ?, '2027-01-06', '2027-01-10', 0, 'DaDat')`,
      [LE_TAN],
    );
    await pool.query(
      "INSERT INTO CHI_TIET_DAT_PHONG (MaDatPhong, MaPhong, GiaThueThoiDiem, SoDem) VALUES ('DP00000200', 'PH00000002', 0, 0)",
    );
    expect(
      await dong("SELECT GiaThueThoiDiem, SoDem FROM CHI_TIET_DAT_PHONG WHERE MaDatPhong = 'DP00000200'"),
    ).toEqual({ GiaThueThoiDiem: "840000.00", SoDem: 4 });
  });
});
```

- [x] **Step 2: Chạy trên script cũ, xác nhận hỏng đúng lý do**

Run: `npx vitest run src/db/thu-tuc.test.ts`
Expected: 3 FAIL:
- ca đầu: `FUNCTION QuanLyKhachSan_test.fn_DonGiaTrungBinh does not exist`;
- ca `sp_TraCuuPhongTrong`: `DonGiaMotDem: "880000.00"` (giá ngày nhận) thay vì `"853333.33"`;
- ca trigger: `GiaThueThoiDiem: "880000.00"`.

6 ca cũ pass.

- [x] **Step 3: Đọc lại chỗ neo ngay trước khi sửa**

```bash
cd /Users/anhpham/PA/UIT/Demo
set -a; source .env.local; set +a
D="$QLKS_SCRIPTS_DIR"
grep -c "^DROP FUNCTION IF EXISTS fn_TienDichVu;$" "$D/02_Functions.sql"
grep -c "^-- p_MaLoaiPhong = NULL: moi loai phong.$" "$D/02_Functions.sql"
grep -c "^-- Mong doi: 5 ham.$" "$D/02_Functions.sql"
grep -c "^-- 04. TRIGGER (muc 4.1.2, Bang 4.2). Can: 01.$" "$D/04_Triggers.sql"
grep -c "^        SELECT bg.DonGia INTO v_Gia$" "$D/04_Triggers.sql"
grep -c "^-- Cung vi tu phong kha dung voi sp_DatPhong va fn_SoPhongKhaDung.$" "$D/06_Procedures.sql"
grep -c "fn_DonGiaPhongTheoNgay(p.MaLoaiPhong, p_NgayCheckIn) AS DonGiaMotDem," "$D/06_Procedures.sql"
grep -c "^-- Don gia = trung binh gia tung dem, chot vao GiaThueThoiDiem.$" "$D/06_Procedures.sql"
grep -c "^    WITH RECURSIVE CacDem (Ngay) AS ($" "$D/06_Procedures.sql"
grep -c "^GRANT EXECUTE ON PROCEDURE QuanLyKhachSan.sp_DangNhap TO$" "$D/08_Security_Roles.sql"
grep -c "fn_DonGiaTrungBinh" "$D/02_Functions.sql" "$D/04_Triggers.sql" "$D/06_Procedures.sql"
```

Expected: mười số `1`, rồi `0` cho cả ba file. Khác thì **dừng lại, báo người dùng**.

- [x] **Step 4: Lưu script sửa vào `$BK/sua_c1_gia_trung_binh.py`**

```python
"""Phan C (spec bo sung nghiep vu muc 5.1): mot cong thuc gia trung binh.

02: fn_DonGiaTrungBinh.
04: trg_CTDP_TinhThanhTien_BI dung fn_DonGiaTrungBinh.
06: sp_DatPhong, sp_TraCuuPhongTrong dung fn_DonGiaTrungBinh.
08: EXECUTE hai ham gia cho r_khachhang, r_letan, r_quanly.
Dung: python3 sua_c1_gia_trung_binh.py "$QLKS_SCRIPTS_DIR"
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vasql import Tep  # noqa: E402

thu_muc = sys.argv[1]

t02 = Tep(thu_muc, "02_Functions.sql")
t02.chen_sau("DROP FUNCTION IF EXISTS fn_TienDichVu;\n",
             "DROP FUNCTION IF EXISTS fn_DonGiaTrungBinh;\n")
t02.chen_truoc("-- p_MaLoaiPhong = NULL: moi loai phong.\n", """-- RB-06. Don gia mot dem cua phieu: trung binh fn_DonGiaPhongTheoNgay cua tung
-- dem [p_CheckIn, p_CheckOut), lam tron 2 chu so. sp_DatPhong,
-- sp_TraCuuPhongTrong va trg_CTDP_TinhThanhTien_BI cung dung ham nay.
CREATE FUNCTION fn_DonGiaTrungBinh (
    p_MaLoaiPhong CHAR(10),
    p_CheckIn     DATE,
    p_CheckOut    DATE
)
RETURNS DECIMAL(18,2)
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
    DECLARE v_Ngay  DATE;
    DECLARE v_Tong  DECIMAL(24,2) DEFAULT 0;
    DECLARE v_SoDem INT           DEFAULT 0;

    IF p_CheckIn IS NULL OR p_CheckOut IS NULL OR p_CheckOut <= p_CheckIn THEN
        RETURN NULL;
    END IF;

    SET v_Ngay = p_CheckIn;

    WHILE v_Ngay < p_CheckOut DO
        SET v_Tong  = v_Tong + fn_DonGiaPhongTheoNgay(p_MaLoaiPhong, v_Ngay);
        SET v_SoDem = v_SoDem + 1;
        SET v_Ngay  = v_Ngay + INTERVAL 1 DAY;
    END WHILE;

    RETURN ROUND(v_Tong / v_SoDem, 2);
END$$

""")
t02.thay("-- Mong doi: 5 ham.", "-- Mong doi: 6 ham.")
t02.luu()

t04 = Tep(thu_muc, "04_Triggers.sql")
t04.thay("-- 04. TRIGGER (muc 4.1.2, Bang 4.2). Can: 01.",
         "-- 04. TRIGGER (muc 4.1.2, Bang 4.2). Can: 01, 02.")
t04.thay("""        SELECT bg.DonGia INTO v_Gia
        FROM   BANG_GIA_PHONG bg
        WHERE  bg.MaLoaiPhong = v_MaLoaiPhong
          AND  v_NgayIn BETWEEN bg.ApDungTuNgay AND bg.DenNgay
        ORDER  BY bg.ApDungTuNgay DESC
        LIMIT  1;

        IF v_Gia IS NULL THEN
            SELECT DonGiaNgay INTO v_Gia
            FROM   LOAI_PHONG
            WHERE  MaLoaiPhong = v_MaLoaiPhong;
        END IF;

        SET NEW.GiaThueThoiDiem = COALESCE(v_Gia, 0);""", """        -- RB-06: trung binh gia tung dem, cung cong thuc voi sp_DatPhong.
        SET v_Gia = fn_DonGiaTrungBinh(v_MaLoaiPhong, v_NgayIn, v_NgayOut);

        SET NEW.GiaThueThoiDiem = COALESCE(v_Gia, 0);""")
t04.luu()

t06 = Tep(thu_muc, "06_Procedures.sql")
t06.thay("-- Cung vi tu phong kha dung voi sp_DatPhong va fn_SoPhongKhaDung.\n",
         "-- Cung vi tu phong kha dung voi sp_DatPhong va fn_SoPhongKhaDung; don gia la\n"
         "-- fn_DonGiaTrungBinh, dung so sp_DatPhong se chot.\n")
t06.thay("""           fn_DonGiaPhongTheoNgay(p.MaLoaiPhong, p_NgayCheckIn) AS DonGiaMotDem,
           fn_SoDem(p_NgayCheckIn, p_NgayCheckOut)              AS SoDem,
           fn_DonGiaPhongTheoNgay(p.MaLoaiPhong, p_NgayCheckIn)
               * fn_SoDem(p_NgayCheckIn, p_NgayCheckOut)        AS TamTinh,""", """           fn_DonGiaTrungBinh(p.MaLoaiPhong, p_NgayCheckIn, p_NgayCheckOut) AS DonGiaMotDem,
           fn_SoDem(p_NgayCheckIn, p_NgayCheckOut)                          AS SoDem,
           fn_DonGiaTrungBinh(p.MaLoaiPhong, p_NgayCheckIn, p_NgayCheckOut)
               * fn_SoDem(p_NgayCheckIn, p_NgayCheckOut)                    AS TamTinh,""")
t06.thay("-- Don gia = trung binh gia tung dem, chot vao GiaThueThoiDiem.\n",
         "-- Don gia = fn_DonGiaTrungBinh (trung binh gia tung dem), chot vao GiaThueThoiDiem.\n")
t06.thay_doan(
    """    INSERT INTO CHI_TIET_DAT_PHONG
        (MaDatPhong, MaPhong, GiaThueThoiDiem, SoDem)
    WITH RECURSIVE CacDem (Ngay) AS (""",
    """    UPDATE PHONG
    SET    TrangThai = 'DaDat'
    WHERE  MaPhong IN (SELECT MaPhong FROM tmp_PhongDat)""",
    """    INSERT INTO CHI_TIET_DAT_PHONG
        (MaDatPhong, MaPhong, GiaThueThoiDiem, SoDem)
    SELECT p_MaDatPhong,
           ph.MaPhong,
           fn_DonGiaTrungBinh(ph.MaLoaiPhong, p_NgayCheckIn, p_NgayCheckOut),
           v_SoDem
    FROM   PHONG        ph
    JOIN   tmp_PhongDat t ON t.MaPhong = ph.MaPhong;

""",
    phai_co=[
        "ROUND(AVG(COALESCE(",
        "GROUP  BY ph.MaPhong, ph.MaLoaiPhong, lp.DonGiaNgay;",
    ],
)
t06.luu()

t08 = Tep(thu_muc, "08_Security_Roles.sql")
t08.chen_truoc("GRANT EXECUTE ON PROCEDURE QuanLyKhachSan.sp_DangNhap TO\n", """-- Form dat phong va man Bang gia goi thang hai ham gia khi doc.
GRANT EXECUTE ON FUNCTION QuanLyKhachSan.fn_DonGiaTrungBinh
      TO r_khachhang, r_letan, r_quanly;
GRANT EXECUTE ON FUNCTION QuanLyKhachSan.fn_DonGiaPhongTheoNgay
      TO r_khachhang, r_letan, r_quanly;

""")
t08.luu()
```

- [x] **Step 5: Sửa bốn file, đọc lại đoạn cũ bị thay**

```bash
for f in 02_Functions 04_Triggers 06_Procedures 08_Security_Roles; do cp "$D/$f.sql" "$BK/${f}_truoc_c1.sql"; done
python3 "$BK/sua_c1_gia_trung_binh.py" "$D"
for f in 02_Functions 04_Triggers 06_Procedures 08_Security_Roles; do
  printf '%s %s\n' "$f" "$(diff "$BK/${f}_truoc_c1.sql" "$D/$f.sql" | grep -c '^[<>]')"
done
cat "$BK/06_Procedures.sql.4.cu"
```

Expected:
- `Da sua 02_Functions.sql: 3 doan`, `Da sua 04_Triggers.sql: 2 doan`, `Da sua 06_Procedures.sql: 4 doan`, `Da sua 08_Security_Roles.sql: 1 doan`.
- Số dòng đổi: `02_Functions 34`, `04_Triggers 16`, `06_Procedures 36`, `08_Security_Roles 6`.
- `06_Procedures.sql.4.cu` chỉ gồm câu `INSERT INTO CHI_TIET_DAT_PHONG … WITH RECURSIVE CacDem … GROUP BY …` cũ của `sp_DatPhong`.

- [x] **Step 6: Chạy lại, và cả bộ test hồi quy giá**

Run: `npx vitest run src/db/thu-tuc.test.ts` → Expected: `Tests 9 passed`.
Run: `npm test` → Expected: `Test Files 37 passed`, `Tests 224 passed`.

`dat-phong.test.ts`, `bookings.test.ts` (đơn giá `840000.00` qua mép bảng giá) và `bao-cao.test.ts` vẫn pass: giá chốt vào phiếu và số liệu báo cáo không đổi.

- [x] **Step 7: Commit**

```bash
git add src/db/thu-tuc.test.ts
git commit -m "test: mot cong thuc gia trung binh fn_DonGiaTrungBinh

02_Functions.sql, 04_Triggers.sql, 06_Procedures.sql, 08_Security_Roles.sql
(Scripts/, ngoai git) sua cung luc: sp_DatPhong, sp_TraCuuPhongTrong va
trg_CTDP_TinhThanhTien_BI cung goi fn_DonGiaTrungBinh; truoc day
sp_TraCuuPhongTrong va trigger lay gia ngay nhan phong.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Đọc bảng giá, lịch giá, chi tiết giá từng đêm

**Files:**
- Create: `src/lib/chi-tiet-gia.ts`, `src/lib/queries/bang-gia.ts`
- Modify: `src/lib/format.ts` (`formatNgayNgan`), `src/lib/queries/bookings.ts` (`getLoaiPhongConTrong`)
- Test: `src/lib/chi-tiet-gia.test.ts`, `src/lib/queries/bang-gia.test.ts`, `src/lib/format.test.ts`, `src/lib/queries/bookings.test.ts`

**Interfaces:**
- Consumes: `fn_DonGiaTrungBinh` (Task 10), `fn_DonGiaPhongTheoNgay`; `db`, `schema`.
- Produces:
  - `type GiaDem = { ngay: string; donGia: string }`, `type DoanGia = { tuNgay: string; denNgay: string; donGia: string; soDem: number }` (`denNgay` là đêm cuối của đoạn, tính cả đêm đó); `gopDoanGia(dem: GiaDem[]): DoanGia[]`.
  - `formatNgayNgan('2026-09-27') === '27/09'`.
  - `type KhoangGia = { maBangGia; apDungTuNgay; denNgay; donGia; heSo }` (mọi trường là chuỗi).
  - `type LoaiPhongGia = { maLoaiPhong; tenLoaiPhong; donGiaNgay; khoang: KhoangGia[] }`; `getBangGia(): Promise<LoaiPhongGia[]>`.
  - `type LichGia = { ngay: string[]; loai: { maLoaiPhong; tenLoaiPhong; donGiaNgay; gia: { donGia: string; coKhaiGia: boolean }[] }[] }`; `getLichGia(tuNgay: string, soNgay = 14): Promise<LichGia>`.
  - `LoaiPhongConTrong` thêm trường `chiTietGia: DoanGia[]`. `donGiaNgay` lấy qua `fn_DonGiaTrungBinh`.

- [x] **Step 1: Viết test hỏng**

`src/lib/chi-tiet-gia.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { gopDoanGia } from "@/lib/chi-tiet-gia";

describe("gopDoanGia", () => {
  it("gop cac dem lien nhau cung gia thanh mot doan", () => {
    expect(
      gopDoanGia([
        { ngay: "2026-12-28", donGia: "1500000.00" },
        { ngay: "2026-12-29", donGia: "1500000.00" },
        { ngay: "2026-12-30", donGia: "1950000.00" },
      ]),
    ).toEqual([
      { tuNgay: "2026-12-28", denNgay: "2026-12-29", donGia: "1500000.00", soDem: 2 },
      { tuNgay: "2026-12-30", denNgay: "2026-12-30", donGia: "1950000.00", soDem: 1 },
    ]);
  });

  it("gia quay lai muc cu la doan moi, khong gop voi doan truoc", () => {
    const doan = gopDoanGia([
      { ngay: "2027-01-01", donGia: "1500000.00" },
      { ngay: "2027-01-02", donGia: "1950000.00" },
      { ngay: "2027-01-03", donGia: "1500000.00" },
    ]);
    expect(doan.map((d) => d.soDem)).toEqual([1, 1, 1]);
  });

  it("khong co dem nao thi khong co doan", () => {
    expect(gopDoanGia([])).toEqual([]);
  });
});
```

`src/lib/queries/bang-gia.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { getBangGia, getLichGia } from "@/lib/queries/bang-gia";

describe("getBangGia", () => {
  it("10 loai phong theo ma, moi loai kem gia goc va cac khoang gia", async () => {
    const ds = await getBangGia();
    expect(ds).toHaveLength(10);
    expect(ds[1]).toEqual({
      maLoaiPhong: "LP00000002",
      tenLoaiPhong: "Standard Double",
      donGiaNgay: "800000.00",
      khoang: [
        {
          maBangGia: "BG00000002",
          apDungTuNgay: "2026-01-08",
          denNgay: "2027-01-07",
          donGia: "880000.00",
          heSo: "1.10",
        },
      ],
    });
  });
});

describe("getLichGia", () => {
  it("gia tung ngay, co danh dau ngay nao roi ve gia goc", async () => {
    const lich = await getLichGia("2027-01-06", 3);
    expect(lich.ngay).toEqual(["2027-01-06", "2027-01-07", "2027-01-08"]);
    expect(lich.loai).toHaveLength(10);
    expect(lich.loai[1]).toEqual({
      maLoaiPhong: "LP00000002",
      tenLoaiPhong: "Standard Double",
      donGiaNgay: "800000.00",
      gia: [
        { donGia: "880000.00", coKhaiGia: true },
        { donGia: "880000.00", coKhaiGia: true },
        { donGia: "800000.00", coKhaiGia: false },
      ],
    });
  });

  it("mac dinh 14 ngay tinh tu ngay dau", async () => {
    const { ngay } = await getLichGia("2026-09-23");
    expect([ngay.length, ngay[0], ngay[13]]).toEqual([14, "2026-09-23", "2026-10-06"]);
  });
});
```

Trong `src/lib/format.test.ts`, đổi dòng import thành `import { formatNgay, formatNgayGio, formatNgayNgan, formatSo, formatVnd } from "@/lib/format";` rồi thêm vào cuối file:

```ts
describe("formatNgayNgan", () => {
  it("doi ISO (hoac DATETIME) sang dd/MM", () => {
    expect(formatNgayNgan("2026-09-27")).toBe("27/09");
    expect(formatNgayNgan("2026-09-27 08:00:00")).toBe("27/09");
  });
});
```

Trong `src/lib/queries/bookings.test.ts`, ca `du 10 loai phong kem so phong con trong theo sp_TraCuuPhongTrong`, thay:

```ts
      donGiaNgay: "600000.00",
      soPhongTrong: 5,
    });
```

bằng:

```ts
      donGiaNgay: "600000.00",
      soPhongTrong: 5,
      chiTietGia: [{ tuNgay: "2026-10-01", denNgay: "2026-10-02", donGia: "600000.00", soDem: 2 }],
    });
```

Trong cùng `describe("getLoaiPhongConTrong")`, ngay sau ca `khoang ngay vuot qua bang gia thi lay trung binh tung dem nhu sp_DatPhong`, thêm:

```ts
  it("chiTietGia gop cac dem cung gia, dung cac dem da tinh trung binh", async () => {
    const ds = await getLoaiPhongConTrong("2027-01-06", "2027-01-10");
    expect(ds.find((l) => l.maLoaiPhong === "LP00000002")!.chiTietGia).toEqual([
      { tuNgay: "2027-01-06", denNgay: "2027-01-07", donGia: "880000.00", soDem: 2 },
      { tuNgay: "2027-01-08", denNgay: "2027-01-09", donGia: "800000.00", soDem: 2 },
    ]);
  });
```

Run: `npx vitest run src/lib/chi-tiet-gia.test.ts src/lib/queries/bang-gia.test.ts src/lib/format.test.ts src/lib/queries/bookings.test.ts`
Expected: FAIL. Không resolve được `chi-tiet-gia`, `bang-gia`; `formatNgayNgan is not a function`; hai ca `getLoaiPhongConTrong` thiếu `chiTietGia`.

- [x] **Step 2: Viết `src/lib/chi-tiet-gia.ts`**

```ts
/**
 * Chi tiet gia tung dem cua mot khoang luu tru, gop cac dem lien nhau cung gia
 * thanh doan de hien "27/09-28/09 · 1.500.000 x 2 dem". Chi de hien thi: don gia
 * trung binh luon lay tu CSDL (fn_DonGiaTrungBinh), khong tinh lai o day.
 */

export type GiaDem = { ngay: string; donGia: string };

/** Mot doan dem lien nhau cung gia; denNgay la dem cuoi (tinh ca dem do). */
export type DoanGia = { tuNgay: string; denNgay: string; donGia: string; soDem: number };

/** Dau vao la cac dem lien nhau, theo ngay tang dan. */
export function gopDoanGia(dem: GiaDem[]): DoanGia[] {
  const doan: DoanGia[] = [];
  for (const d of dem) {
    const cuoi = doan[doan.length - 1];
    if (cuoi && cuoi.donGia === d.donGia) {
      cuoi.denNgay = d.ngay;
      cuoi.soDem += 1;
    } else {
      doan.push({ tuNgay: d.ngay, denNgay: d.ngay, donGia: d.donGia, soDem: 1 });
    }
  }
  return doan;
}
```

- [x] **Step 3: Thêm `formatNgayNgan` vào `src/lib/format.ts`**

Ngay sau hàm `formatNgay`, thêm:

```ts
/** '2026-09-27' -> '27/09'. Nhan ca chuoi DATETIME. */
export function formatNgayNgan(iso: string): string {
  const [d, m] = tachNgay(iso);
  return `${d}/${m}`;
}
```

- [x] **Step 4: Viết `src/lib/queries/bang-gia.ts`**

```ts
import "server-only";

import { asc, sql } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";

/**
 * Mat tien doc cua man Bang gia. Gia mot ngay luon hoi fn_DonGiaPhongTheoNgay
 * (khoang BANG_GIA_PHONG phu ngay do, khong co thi LOAI_PHONG.DonGiaNgay), dung
 * ham ma sp_DatPhong dung qua fn_DonGiaTrungBinh.
 */

export type KhoangGia = {
  maBangGia: string;
  apDungTuNgay: string;
  denNgay: string;
  donGia: string;
  heSo: string;
};

export type LoaiPhongGia = {
  maLoaiPhong: string;
  tenLoaiPhong: string;
  donGiaNgay: string;
  khoang: KhoangGia[];
};

export async function getBangGia(): Promise<LoaiPhongGia[]> {
  const lp = schema.loaiPhong;
  const bg = schema.bangGiaPhong;
  const [loai, khoang] = await Promise.all([
    db
      .select({ maLoaiPhong: lp.maLoaiPhong, tenLoaiPhong: lp.tenLoaiPhong, donGiaNgay: lp.donGiaNgay })
      .from(lp)
      .orderBy(asc(lp.maLoaiPhong)),
    db
      .select({
        maLoaiPhong: bg.maLoaiPhong,
        maBangGia: bg.maBangGia,
        apDungTuNgay: bg.apDungTuNgay,
        denNgay: bg.denNgay,
        donGia: bg.donGia,
        heSo: bg.heSo,
      })
      .from(bg)
      .orderBy(asc(bg.apDungTuNgay)),
  ]);

  return loai.map((l) => ({
    ...l,
    khoang: khoang
      .filter((k) => k.maLoaiPhong === l.maLoaiPhong)
      .map((k) => ({
        maBangGia: k.maBangGia,
        apDungTuNgay: k.apDungTuNgay,
        denNgay: k.denNgay,
        donGia: k.donGia,
        heSo: k.heSo,
      })),
  }));
}

export type LichGia = {
  ngay: string[];
  loai: {
    maLoaiPhong: string;
    tenLoaiPhong: string;
    donGiaNgay: string;
    gia: { donGia: string; coKhaiGia: boolean }[];
  }[];
};

type DongLich = {
  maLoaiPhong: string;
  tenLoaiPhong: string;
  donGiaNgay: string;
  ngay: string;
  donGia: string;
  coKhaiGia: number;
};

/** Loai phong x ngay trong [tuNgay, tuNgay + soNgay); coKhaiGia = ngay do co khoang BANG_GIA_PHONG phu. */
export async function getLichGia(tuNgay: string, soNgay = 14): Promise<LichGia> {
  const [rows] = await db.execute(sql`
    WITH RECURSIVE CacNgay (Ngay) AS (
      SELECT CAST(${tuNgay} AS DATE)
      UNION ALL
      SELECT Ngay + INTERVAL 1 DAY FROM CacNgay
      WHERE  Ngay < CAST(${tuNgay} AS DATE) + INTERVAL ${soNgay - 1} DAY
    )
    SELECT   lp.MaLoaiPhong AS maLoaiPhong,
             lp.TenLoaiPhong AS tenLoaiPhong,
             lp.DonGiaNgay AS donGiaNgay,
             DATE_FORMAT(d.Ngay, '%Y-%m-%d') AS ngay,
             fn_DonGiaPhongTheoNgay(lp.MaLoaiPhong, d.Ngay) AS donGia,
             EXISTS (SELECT 1 FROM BANG_GIA_PHONG bg
                     WHERE  bg.MaLoaiPhong = lp.MaLoaiPhong
                       AND  d.Ngay BETWEEN bg.ApDungTuNgay AND bg.DenNgay) AS coKhaiGia
    FROM     LOAI_PHONG lp CROSS JOIN CacNgay d
    ORDER BY lp.MaLoaiPhong, d.Ngay`);

  const dong = rows as unknown as DongLich[];
  const theoLoai = new Map<string, LichGia["loai"][number]>();
  for (const r of dong) {
    let l = theoLoai.get(r.maLoaiPhong);
    if (!l) {
      l = { maLoaiPhong: r.maLoaiPhong, tenLoaiPhong: r.tenLoaiPhong, donGiaNgay: r.donGiaNgay, gia: [] };
      theoLoai.set(r.maLoaiPhong, l);
    }
    l.gia.push({ donGia: r.donGia, coKhaiGia: Boolean(r.coKhaiGia) });
  }
  return { ngay: [...new Set(dong.map((r) => r.ngay))], loai: [...theoLoai.values()] };
}
```

- [x] **Step 5: `getLoaiPhongConTrong` lấy đơn giá qua hàm và trả chi tiết giá (`src/lib/queries/bookings.ts`)**

Thêm import (theo thứ tự alias như file đang có):

```ts
import { gopDoanGia, type DoanGia, type GiaDem } from "@/lib/chi-tiet-gia";
```

Thay khai báo `LoaiPhongConTrong`:

```ts
export type LoaiPhongConTrong = {
  maLoaiPhong: string;
  tenLoaiPhong: string;
  /**
   * Don gia mot dem ma sp_DatPhong se chot cho dung khoang ngay nay (RB-06):
   * trung binh gia BANG_GIA_PHONG tung dem, dem chua khai gia thi lui ve
   * LOAI_PHONG.DonGiaNgay. Form dat phong tam tinh va tinh tien coc theo so nay.
   */
  donGiaNgay: string;
  soPhongTrong: number;
};
```

bằng:

```ts
export type LoaiPhongConTrong = {
  maLoaiPhong: string;
  tenLoaiPhong: string;
  /**
   * Don gia mot dem ma sp_DatPhong se chot cho dung khoang ngay nay (RB-06):
   * fn_DonGiaTrungBinh, cung ham sp_DatPhong goi. Form dat phong tam tinh va
   * tinh tien coc theo so nay.
   */
  donGiaNgay: string;
  soPhongTrong: number;
  /** Gia tung dem gop thanh doan, chi de hien "Chi tiet gia". */
  chiTietGia: DoanGia[];
};
```

Thay toàn bộ thân `getLoaiPhongConTrong` (từ `  const [[loai], phongTrong] = await Promise.all([` tới hết `}));` của nó) bằng:

```ts
  const [[loai], [dem], phongTrong] = await Promise.all([
    db.execute(sql`
      SELECT   MaLoaiPhong AS maLoaiPhong,
               TenLoaiPhong AS tenLoaiPhong,
               fn_DonGiaTrungBinh(MaLoaiPhong, ${checkIn}, ${checkOut}) AS donGiaNgay
      FROM     LOAI_PHONG
      ORDER BY MaLoaiPhong`),
    db.execute(sql`
      WITH RECURSIVE CacDem (Ngay) AS (
        SELECT CAST(${checkIn} AS DATE)
        UNION ALL
        SELECT Ngay + INTERVAL 1 DAY FROM CacDem WHERE Ngay + INTERVAL 1 DAY < ${checkOut}
      )
      SELECT   lp.MaLoaiPhong AS maLoaiPhong,
               DATE_FORMAT(d.Ngay, '%Y-%m-%d') AS ngay,
               fn_DonGiaPhongTheoNgay(lp.MaLoaiPhong, d.Ngay) AS donGia
      FROM     LOAI_PHONG lp CROSS JOIN CacDem d
      ORDER BY lp.MaLoaiPhong, d.Ngay`),
    callProcedure<{ MaLoaiPhong: string }>("sp_TraCuuPhongTrong", [checkIn, checkOut, null]),
  ]);

  const giaDem = dem as unknown as (GiaDem & { maLoaiPhong: string })[];
  type DongLoai = Pick<LoaiPhongConTrong, "maLoaiPhong" | "tenLoaiPhong" | "donGiaNgay">;
  return (loai as unknown as DongLoai[]).map((l) => ({
    ...l,
    soPhongTrong: phongTrong.filter((p) => p.MaLoaiPhong === l.maLoaiPhong).length,
    chiTietGia: gopDoanGia(
      giaDem
        .filter((d) => d.maLoaiPhong === l.maLoaiPhong)
        .map((d) => ({ ngay: d.ngay, donGia: d.donGia })),
    ),
  }));
```

Giữ nguyên chú thích JSDoc phía trên hàm. Giữ nguyên giới hạn 1000 đêm của `traCuuPhongTrongAnToan`, vì CTE đệ quy của phần chi tiết vẫn dừng ở `cte_max_recursion_depth`.

- [x] **Step 6: Chạy lại, kiểm kiểu, lint**

Run: `npx vitest run src/lib/chi-tiet-gia.test.ts src/lib/queries/bang-gia.test.ts src/lib/format.test.ts src/lib/queries/bookings.test.ts` → Expected: `Tests 31 passed` (3 + 3 + 7 + 18).
Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi. `booking-form.tsx` vẫn chạy được vì trường mới chỉ thêm vào.
Run: `npm test` → Expected: `Test Files 39 passed`, `Tests 232 passed`.

- [x] **Step 7: Commit**

```bash
git add src/lib/chi-tiet-gia.ts src/lib/chi-tiet-gia.test.ts src/lib/format.ts src/lib/format.test.ts src/lib/queries/bang-gia.ts src/lib/queries/bang-gia.test.ts src/lib/queries/bookings.ts src/lib/queries/bookings.test.ts
git commit -m "feat: doc bang gia, lich gia N ngay; form dat phong kem chi tiet gia tung doan

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Thủ tục ghi bảng giá (`sp_DatGiaPhong`, `sp_CapNhatGiaLoaiPhong`)

**Files:**
- Modify (ngoài git): `$QLKS_SCRIPTS_DIR/06_Procedures.sql`, `08_Security_Roles.sql`
- Create: `src/lib/thao-tac/bang-gia.ts`
- Test: `src/lib/thao-tac/bang-gia.test.ts`

**Interfaces:**
- Consumes: `KhoangGia`, `getLoaiPhongConTrong` (Task 11); `datPhong` (`thao-tac/dat-phong.ts`); `callProcedure`, `thucHien`, `dong`, `napLaiDuLieuMau`; `vasql.py`; khối Mong doi của Task 5.
- Produces:
  - `sp_DatGiaPhong(p_MaLoaiPhong, p_TuNgay, p_DenNgay, p_DonGia)`: `p_DonGia = NULL` là về giá gốc. Result set là mọi khoảng của loại phòng, theo `ApDungTuNgay`.
  - `sp_CapNhatGiaLoaiPhong(p_MaLoaiPhong, p_DonGiaNgay)`.
  - `datGiaPhong(maLoaiPhong, tuNgay, denNgay, donGia: string | null): Promise<KetQua<KhoangGia[]>>`
  - `capNhatGiaGoc(maLoaiPhong, donGiaNgay): Promise<KetQua<null>>`

Mã `BANG_GIA_PHONG` sinh theo `MAX + 1` sau khi xóa. Vì vậy mã của khoảng vừa xóa có thể được dùng lại (không có khóa ngoại nào trỏ vào bảng này). Phần đuôi của khoảng bị tách được chèn trước khoảng mới, nên phần đuôi nhận mã nhỏ hơn.

- [x] **Step 1: Viết test hỏng `src/lib/thao-tac/bang-gia.test.ts`**

```ts
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { getLoaiPhongConTrong } from "@/lib/queries/bookings";
import { capNhatGiaGoc, datGiaPhong } from "@/lib/thao-tac/bang-gia";
import { datPhong } from "@/lib/thao-tac/dat-phong";
import { dong } from "@/test/csdl";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

beforeEach(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

// Moc 23/09/2026. Moi loai phong co 1 khoang gia 08/01/2026 - 07/01/2027 (BG00000001-10).
// LP00000005 Deluxe King: gia goc 1.500.000, bang gia 1.500.000.
// LP00000002 Standard Double: gia goc 800.000, bang gia 880.000 (x1,10).
const gia = async (loai: string, ngay: string) =>
  (await dong("SELECT fn_DonGiaPhongTheoNgay(?, ?) AS g", [loai, ngay])).g;
const k = (maBangGia: string, apDungTuNgay: string, denNgay: string, donGia: string, heSo: string) => ({
  maBangGia,
  apDungTuNgay,
  denNgay,
  donGia,
  heSo,
});
const DAU_LP05 = k("BG00000005", "2026-01-08", "2026-12-29", "1500000.00", "1.00");
const DUOI_LP05 = k("BG00000011", "2027-01-02", "2027-01-07", "1500000.00", "1.00");

describe("datGiaPhong", () => {
  it("phu giua khoang ca nam: tach thanh 3 khoang lien mach, gia tung ngay dung o hai mep", async () => {
    expect(await datGiaPhong("LP00000005", "2026-12-30", "2027-01-01", "1950000")).toEqual({
      ok: true,
      data: [DAU_LP05, k("BG00000012", "2026-12-30", "2027-01-01", "1950000.00", "1.30"), DUOI_LP05],
    });
    expect([
      await gia("LP00000005", "2026-12-29"),
      await gia("LP00000005", "2026-12-30"),
      await gia("LP00000005", "2027-01-01"),
      await gia("LP00000005", "2027-01-02"),
    ]).toEqual(["1500000.00", "1950000.00", "1950000.00", "1500000.00"]);
  });

  it("phu trung khit mot khoang: thay gia, khong them khoang", async () => {
    await datGiaPhong("LP00000005", "2026-12-30", "2027-01-01", "1950000");
    expect(await datGiaPhong("LP00000005", "2026-12-30", "2027-01-01", "2100000")).toEqual({
      ok: true,
      data: [DAU_LP05, k("BG00000012", "2026-12-30", "2027-01-01", "2100000.00", "1.40"), DUOI_LP05],
    });
  });

  it("lan dau va lan cuoi, phu qua nhieu khoang", async () => {
    await datGiaPhong("LP00000005", "2026-12-30", "2027-01-01", "1950000");
    expect(await datGiaPhong("LP00000005", "2026-12-25", "2027-01-03", "1800000")).toEqual({
      ok: true,
      data: [
        k("BG00000005", "2026-01-08", "2026-12-24", "1500000.00", "1.00"),
        k("BG00000012", "2026-12-25", "2027-01-03", "1800000.00", "1.20"),
        k("BG00000011", "2027-01-04", "2027-01-07", "1500000.00", "1.00"),
      ],
    });
  });

  // Review Focus #4
  it("doan mot ngay trung mep dau / mep cuoi khoang cu: khong chong, khong ho", async () => {
    await datGiaPhong("LP00000005", "2026-12-30", "2027-01-01", "1950000");
    expect(await datGiaPhong("LP00000005", "2026-12-30", "2026-12-30", "2000000")).toEqual({
      ok: true,
      data: [
        DAU_LP05,
        k("BG00000013", "2026-12-30", "2026-12-30", "2000000.00", "1.33"),
        k("BG00000012", "2026-12-31", "2027-01-01", "1950000.00", "1.30"),
        DUOI_LP05,
      ],
    });

    await datGiaPhong("LP00000002", "2027-01-07", "2027-01-07", "1000000");
    expect([
      await gia("LP00000002", "2027-01-06"),
      await gia("LP00000002", "2027-01-07"),
      await gia("LP00000002", "2027-01-08"),
    ]).toEqual(["880000.00", "1000000.00", "800000.00"]);
  });

  it("ve gia goc: doan do roi ve LOAI_PHONG.DonGiaNgay", async () => {
    expect(await datGiaPhong("LP00000002", "2026-12-30", "2027-01-01", null)).toEqual({
      ok: true,
      data: [
        k("BG00000002", "2026-01-08", "2026-12-29", "880000.00", "1.10"),
        k("BG00000011", "2027-01-02", "2027-01-07", "880000.00", "1.10"),
      ],
    });
    expect([
      await gia("LP00000002", "2026-12-29"),
      await gia("LP00000002", "2026-12-30"),
      await gia("LP00000002", "2027-01-02"),
    ]).toEqual(["880000.00", "800000.00", "880000.00"]);
  });

  it("tu choi: ngay da qua, den truoc tu, don gia 0, loai khong ton tai, vuot 99,99 lan gia goc", async () => {
    const loi = async (...a: Parameters<typeof datGiaPhong>) => {
      const r = await datGiaPhong(...a);
      return r.ok ? "ok" : r.loi;
    };
    expect(await loi("LP00000005", "2026-09-22", "2026-09-30", "1500000")).toBe(
      "CSDL từ chối: Khong sua gia cho ngay da qua",
    );
    expect(await loi("LP00000005", "2026-10-05", "2026-10-01", "1500000")).toBe(
      "CSDL từ chối: Den ngay phai bang hoac sau tu ngay",
    );
    expect(await loi("LP00000005", "2026-10-01", "2026-10-05", "0")).toBe("CSDL từ chối: Don gia phai lon hon 0");
    expect(await loi("LP99999999", "2026-10-01", "2026-10-05", "1500000")).toBe(
      "CSDL từ chối: Loai phong khong ton tai",
    );
    expect(await loi("LP00000001", "2026-10-01", "2026-10-05", "60000000")).toBe(
      "CSDL từ chối: Don gia vuot 99,99 lan gia goc cua loai phong",
    );
    expect(await dong("SELECT COUNT(*) AS n FROM BANG_GIA_PHONG")).toEqual({ n: 10 });
  });

  it("phieu dat sau khi doi gia: GiaThueThoiDiem = don gia form hien = trung binh tung dem", async () => {
    await datGiaPhong("LP00000005", "2026-12-30", "2027-01-01", "1950000");
    const loai = (await getLoaiPhongConTrong("2026-12-28", "2026-12-31")).find(
      (l) => l.maLoaiPhong === "LP00000005",
    )!;
    // (1.500.000 x 2 + 1.950.000) / 3
    expect(loai.donGiaNgay).toBe("1650000.00");
    expect(loai.chiTietGia).toEqual([
      { tuNgay: "2026-12-28", denNgay: "2026-12-29", donGia: "1500000.00", soDem: 2 },
      { tuNgay: "2026-12-30", denNgay: "2026-12-30", donGia: "1950000.00", soDem: 1 },
    ]);
    expect(
      await datPhong({
        maKh: "KH00000001",
        maTk: "TK00000002",
        ngayNhan: "2026-12-28",
        ngayTra: "2026-12-31",
        maLoaiPhong: "LP00000005",
      }),
    ).toEqual({ ok: true, data: { maDatPhong: "DP00000099", soPhong: "107", tienCoc: "1650000.00" } });
    expect(await dong("SELECT GiaThueThoiDiem FROM CHI_TIET_DAT_PHONG WHERE MaDatPhong = 'DP00000099'")).toEqual({
      GiaThueThoiDiem: "1650000.00",
    });
  });
});

describe("capNhatGiaGoc", () => {
  it("sua gia goc: HeSo tinh lai, DonGia cac khoang giu nguyen", async () => {
    expect(await capNhatGiaGoc("LP00000002", "1000000")).toEqual({ ok: true, data: null });
    expect(await dong("SELECT DonGiaNgay FROM LOAI_PHONG WHERE MaLoaiPhong = 'LP00000002'")).toEqual({
      DonGiaNgay: "1000000.00",
    });
    expect(await dong("SELECT HeSo, DonGia FROM BANG_GIA_PHONG WHERE MaBangGia = 'BG00000002'")).toEqual({
      HeSo: "0.88",
      DonGia: "880000.00",
    });
  });

  it("tu choi gia goc 0 va gia goc lam he so vuot 99,99", async () => {
    expect(await capNhatGiaGoc("LP00000001", "0")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Gia goc phai lon hon 0",
    });
    expect(await capNhatGiaGoc("LP00000001", "6000")).toEqual({
      ok: false,
      loi: "CSDL từ chối: Co khoang gia vuot 99,99 lan gia goc moi",
    });
  });
});
```

- [x] **Step 2: Viết `src/lib/thao-tac/bang-gia.ts`**

```ts
import "server-only";

import { callProcedure } from "@/db/procedures";
import type { KhoangGia } from "@/lib/queries/bang-gia";

import { thucHien, type KetQua } from "./ket-qua";

type DongKhoang = {
  MaBangGia: string;
  ApDungTuNgay: string;
  DenNgay: string;
  DonGia: string;
  HeSo: string;
};

/**
 * Phu gia len [tuNgay, denNgay] cua mot loai phong (sp_DatGiaPhong); donGia
 * null = tra doan do ve gia goc. Tra moi khoang gia cua loai do sau khi doi.
 */
export function datGiaPhong(
  maLoaiPhong: string,
  tuNgay: string,
  denNgay: string,
  donGia: string | null,
): Promise<KetQua<KhoangGia[]>> {
  return thucHien(async () => {
    const rows = await callProcedure<DongKhoang>("sp_DatGiaPhong", [maLoaiPhong, tuNgay, denNgay, donGia]);
    return rows.map((r) => ({
      maBangGia: r.MaBangGia,
      apDungTuNgay: r.ApDungTuNgay,
      denNgay: r.DenNgay,
      donGia: r.DonGia,
      heSo: r.HeSo,
    }));
  });
}

/** Sua gia goc (sp_CapNhatGiaLoaiPhong); HeSo cac khoang tinh lai, DonGia giu nguyen. */
export function capNhatGiaGoc(maLoaiPhong: string, donGiaNgay: string): Promise<KetQua<null>> {
  return thucHien(async () => {
    await callProcedure("sp_CapNhatGiaLoaiPhong", [maLoaiPhong, donGiaNgay]);
    return null;
  });
}
```

- [x] **Step 3: Chạy, xác nhận hỏng vì CSDL chưa có thủ tục**

Run: `npx vitest run src/lib/thao-tac/bang-gia.test.ts`
Expected: 9 FAIL. Các ca nhận `Lỗi CSDL (1305): PROCEDURE QuanLyKhachSan_test.sp_DatGiaPhong does not exist`, hoặc `sp_CapNhatGiaLoaiPhong`.

- [x] **Step 4: Đọc lại chỗ neo ngay trước khi sửa**

```bash
cd /Users/anhpham/PA/UIT/Demo
set -a; source .env.local; set +a
F6="$QLKS_SCRIPTS_DIR/06_Procedures.sql"; F8="$QLKS_SCRIPTS_DIR/08_Security_Roles.sql"
grep -c "^DROP PROCEDURE IF EXISTS sp_HuyPhieuDat;$" "$F6"
grep -c "^-- THU TUC BAO CAO (muc 4.3), chi doc." "$F6"
grep -c "'sp_SuaKhachHang', 'sp_BaoDonPhong', 'sp_BaoBaoTri')" "$F6"
grep -c "^GRANT EXECUTE ON PROCEDURE QuanLyKhachSan.sp_DangNhap TO$" "$F8"
grep -c "sp_DatGiaPhong" "$F6" "$F8"
```

Expected: bốn số `1`, rồi `0` cho cả hai file. Khác thì **dừng lại, báo người dùng**.

- [x] **Step 5: Lưu script sửa vào `$BK/sua_c2_bang_gia.py`**

```python
"""Phan C (spec bo sung nghiep vu muc 5.2): thu tuc ghi bang gia.

06: sp_DatGiaPhong, sp_CapNhatGiaLoaiPhong.
08: EXECUTE hai thu tuc cho r_quanly.
Dung: python3 sua_c2_bang_gia.py "$QLKS_SCRIPTS_DIR"
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vasql import Tep  # noqa: E402

thu_muc = sys.argv[1]

t06 = Tep(thu_muc, "06_Procedures.sql")
t06.chen_sau("DROP PROCEDURE IF EXISTS sp_HuyPhieuDat;\n", """DROP PROCEDURE IF EXISTS sp_DatGiaPhong;
DROP PROCEDURE IF EXISTS sp_CapNhatGiaLoaiPhong;
""")

t06.chen_truoc("-- THU TUC BAO CAO (muc 4.3), chi doc.", """-- RB-12. Phu gia p_DonGia len doan [p_TuNgay, p_DenNgay] (tinh ca hai dau) cua
-- mot loai phong; p_DonGia = NULL tra doan do ve LOAI_PHONG.DonGiaNgay. Khoang
-- cu bi chong duoc xoa / cat / tach theo thu tu chi thu hep roi moi chen, nen
-- trg_BangGia_KhongGiaoNhau khong bao gio bao chong. Phieu da lap giu gia da
-- chot trong CHI_TIET_DAT_PHONG (QT-06).
CREATE PROCEDURE sp_DatGiaPhong (
    IN p_MaLoaiPhong CHAR(10),
    IN p_TuNgay      DATE,
    IN p_DenNgay     DATE,
    IN p_DonGia      DECIMAL(18,2)      -- NULL = ve gia goc
)
SQL SECURITY DEFINER
BEGIN
    DECLARE v_GiaGoc   DECIMAL(18,2) DEFAULT NULL;
    DECLARE v_HeSo     DECIMAL(24,2) DEFAULT NULL;
    DECLARE v_MaTach   CHAR(10)      DEFAULT NULL;
    DECLARE v_TachDen  DATE;
    DECLARE v_TachGia  DECIMAL(18,2);
    DECLARE v_TachHeSo DECIMAL(4,2);
    DECLARE v_Next     INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_TuNgay IS NULL OR p_DenNgay IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phai nhap tu ngay va den ngay';
    END IF;

    IF p_DenNgay < p_TuNgay THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Den ngay phai bang hoac sau tu ngay';
    END IF;

    IF p_TuNgay < CURDATE() THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Khong sua gia cho ngay da qua';
    END IF;

    IF p_DonGia IS NOT NULL AND p_DonGia <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Don gia phai lon hon 0';
    END IF;

    START TRANSACTION;

    -- Khoa loai phong: cac lan sua gia cua cung mot loai chay lan luot.
    SELECT DonGiaNgay INTO v_GiaGoc
    FROM   LOAI_PHONG
    WHERE  MaLoaiPhong = p_MaLoaiPhong
    FOR    UPDATE;

    IF v_GiaGoc IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Loai phong khong ton tai';
    END IF;

    IF p_DonGia IS NOT NULL AND v_GiaGoc > 0 THEN
        SET v_HeSo = ROUND(p_DonGia / v_GiaGoc, 2);

        IF v_HeSo > 99.99 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Don gia vuot 99,99 lan gia goc cua loai phong';
        END IF;
    END IF;

    -- 1. Khoang chua tron doan: nho lai de chen phan duoi o buoc 5.
    SELECT MaBangGia, DenNgay, DonGia, HeSo
    INTO   v_MaTach, v_TachDen, v_TachGia, v_TachHeSo
    FROM   BANG_GIA_PHONG
    WHERE  MaLoaiPhong  = p_MaLoaiPhong
      AND  ApDungTuNgay < p_TuNgay
      AND  DenNgay      > p_DenNgay
    LIMIT  1;

    -- 2. Khoang nam tron trong doan.
    DELETE FROM BANG_GIA_PHONG
    WHERE  MaLoaiPhong  =  p_MaLoaiPhong
      AND  ApDungTuNgay >= p_TuNgay
      AND  DenNgay      <= p_DenNgay;

    -- 3. Khoang lan dau doan (ke ca khoang o buoc 1): ket thuc truoc p_TuNgay.
    UPDATE BANG_GIA_PHONG
    SET    DenNgay = p_TuNgay - INTERVAL 1 DAY
    WHERE  MaLoaiPhong  =  p_MaLoaiPhong
      AND  ApDungTuNgay <  p_TuNgay
      AND  DenNgay      >= p_TuNgay;

    -- 4. Khoang lan cuoi doan: bat dau sau p_DenNgay.
    UPDATE BANG_GIA_PHONG
    SET    ApDungTuNgay = p_DenNgay + INTERVAL 1 DAY
    WHERE  MaLoaiPhong  =  p_MaLoaiPhong
      AND  ApDungTuNgay >= p_TuNgay
      AND  ApDungTuNgay <= p_DenNgay
      AND  DenNgay      >  p_DenNgay;

    SELECT COALESCE(MAX(CAST(SUBSTRING(MaBangGia, 3) AS UNSIGNED)), 0) + 1
    INTO   v_Next
    FROM   BANG_GIA_PHONG;

    -- 5. Phan duoi cua khoang o buoc 1, giu gia va he so cu.
    IF v_MaTach IS NOT NULL THEN
        INSERT INTO BANG_GIA_PHONG
            (MaBangGia, MaLoaiPhong, HeSo, ApDungTuNgay, DenNgay, DonGia)
        VALUES
            (CONCAT('BG', LPAD(v_Next, 8, '0')), p_MaLoaiPhong, v_TachHeSo,
             p_DenNgay + INTERVAL 1 DAY, v_TachDen, v_TachGia);

        SET v_Next = v_Next + 1;
    END IF;

    -- 6. Khoang moi. Gia goc 0 thi khong tinh duoc he so, ghi 1.00.
    IF p_DonGia IS NOT NULL THEN
        INSERT INTO BANG_GIA_PHONG
            (MaBangGia, MaLoaiPhong, HeSo, ApDungTuNgay, DenNgay, DonGia)
        VALUES
            (CONCAT('BG', LPAD(v_Next, 8, '0')), p_MaLoaiPhong,
             GREATEST(COALESCE(v_HeSo, 1.00), 0.01), p_TuNgay, p_DenNgay, p_DonGia);
    END IF;

    COMMIT;

    SELECT MaBangGia, ApDungTuNgay, DenNgay, DonGia, HeSo
    FROM   BANG_GIA_PHONG
    WHERE  MaLoaiPhong = p_MaLoaiPhong
    ORDER  BY ApDungTuNgay;
END$$

-- Sua gia goc cua loai phong. HeSo cua moi khoang tinh lai theo gia goc moi;
-- DonGia giu nguyen nen gia that khong doi ngam.
CREATE PROCEDURE sp_CapNhatGiaLoaiPhong (
    IN p_MaLoaiPhong CHAR(10),
    IN p_DonGiaNgay  DECIMAL(18,2)
)
SQL SECURITY DEFINER
BEGIN
    DECLARE v_Co      INT DEFAULT 0;
    DECLARE v_HeSoMax DECIMAL(24,2);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_DonGiaNgay IS NULL OR p_DonGiaNgay <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Gia goc phai lon hon 0';
    END IF;

    START TRANSACTION;

    SELECT COUNT(*) INTO v_Co
    FROM   LOAI_PHONG
    WHERE  MaLoaiPhong = p_MaLoaiPhong
    FOR    UPDATE;

    IF v_Co = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Loai phong khong ton tai';
    END IF;

    SELECT MAX(ROUND(DonGia / p_DonGiaNgay, 2))
    INTO   v_HeSoMax
    FROM   BANG_GIA_PHONG
    WHERE  MaLoaiPhong = p_MaLoaiPhong;

    IF v_HeSoMax > 99.99 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Co khoang gia vuot 99,99 lan gia goc moi';
    END IF;

    UPDATE LOAI_PHONG
    SET    DonGiaNgay = p_DonGiaNgay
    WHERE  MaLoaiPhong = p_MaLoaiPhong;

    UPDATE BANG_GIA_PHONG
    SET    HeSo = GREATEST(ROUND(DonGia / p_DonGiaNgay, 2), 0.01)
    WHERE  MaLoaiPhong = p_MaLoaiPhong;

    COMMIT;

    SELECT MaLoaiPhong, TenLoaiPhong, DonGiaNgay
    FROM   LOAI_PHONG
    WHERE  MaLoaiPhong = p_MaLoaiPhong;
END$$

""")

t06.thay("""                       'sp_SuaKhachHang', 'sp_BaoDonPhong', 'sp_BaoBaoTri')""",
         """                       'sp_SuaKhachHang', 'sp_BaoDonPhong', 'sp_BaoBaoTri',
                       'sp_DatGiaPhong', 'sp_CapNhatGiaLoaiPhong')""")
t06.luu()

t08 = Tep(thu_muc, "08_Security_Roles.sql")
t08.chen_truoc("GRANT EXECUTE ON PROCEDURE QuanLyKhachSan.sp_DangNhap TO\n", """-- Man Bang gia: quan ly dat gia theo khoang ngay va sua gia goc.
GRANT EXECUTE ON PROCEDURE QuanLyKhachSan.sp_DatGiaPhong         TO r_quanly;
GRANT EXECUTE ON PROCEDURE QuanLyKhachSan.sp_CapNhatGiaLoaiPhong TO r_quanly;

""")
t08.luu()
```

- [x] **Step 6: Sửa `06` và `08`, đối chiếu**

```bash
cp "$F6" "$BK/06_truoc_c2.sql"; cp "$F8" "$BK/08_truoc_c2.sql"
python3 "$BK/sua_c2_bang_gia.py" "$QLKS_SCRIPTS_DIR"
diff "$BK/06_truoc_c2.sql" "$F6" | grep -c '^[<>]'
diff "$BK/08_truoc_c2.sql" "$F8" | grep -c '^[<>]'
```

Expected: `Da sua 06_Procedures.sql: 3 doan`, `Da sua 08_Security_Roles.sql: 1 doan`, `189`, `4`.

- [x] **Step 7: Chạy lại**

Run: `npx vitest run src/lib/thao-tac/bang-gia.test.ts` → Expected: `Tests 9 passed`.
Run: `npm test` → Expected: `Test Files 40 passed`, `Tests 241 passed`.

- [x] **Step 8: Commit**

```bash
git add src/lib/thao-tac/bang-gia.ts src/lib/thao-tac/bang-gia.test.ts
git commit -m "feat: phu gia theo khoang ngay (sp_DatGiaPhong), sua gia goc (sp_CapNhatGiaLoaiPhong)

06_Procedures.sql, 08_Security_Roles.sql (Scripts/, ngoai git) sua cung luc.
Khoang cu bi chong duoc xoa / cat / tach truoc khi chen, nen RB-12 giu nguyen.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Màn Bảng giá (`/pricing`)

**Files:**
- Create: `src/app/(app)/pricing/actions.ts`, `src/app/(app)/pricing/page.tsx`, `src/components/pricing/dat-gia-form.tsx`, `src/components/pricing/lich-gia.tsx`, `src/components/pricing/cac-khoang-gia.tsx`
- Modify: `src/lib/nav.ts`, `src/components/layout/sidebar.tsx` (thanh điều hướng cuộn được)
- Test: `src/app/(app)/pricing/actions.test.ts`, `src/lib/nav.test.ts`

**Interfaces:**
- Consumes: `datGiaPhong`, `capNhatGiaGoc` (Task 12); `getBangGia`, `getLichGia`, `LoaiPhongGia`, `LichGia` (Task 11); `laMa`, `laNgay`, `laTien`; `docSoTien`, `themNgay`; `formatNgay`, `formatVnd`, `formatSo`.
- Produces:
  - Server Action `datGia(maLoai, tuNgay, denNgay, donGia)`. `donGia` là `null` (về giá gốc) hoặc chuỗi tiền.
  - Server Action `capNhatGiaGoc(maLoai, donGia)`.
  - Trang `/pricing?tu=YYYY-MM-DD`: `tu` sai định dạng hoặc thiếu thì lấy hôm nay.
  - Form đặt giá có ô `#bg-loai`, `#bg-tu`, `#bg-den`, `#bg-gia`.
  - Sidebar có mục "Bảng giá" (`/pricing`, icon `Tags`) ngay trước "Báo cáo".

- [x] **Step 1: Viết test hỏng**

`src/app/(app)/pricing/actions.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { capNhatGiaGoc, datGia } from "@/app/(app)/pricing/actions";

// Review Focus #5: null chi hop le o o don gia (ve gia goc).
describe("Server Action bang gia: tham so sai hinh thuc", () => {
  it("tu choi truoc khi cham CSDL", async () => {
    await expect(datGia({ ma: 1 }, "2026-10-01", "2026-10-03", "1500000")).resolves.toEqual({
      ok: false,
      loi: "Loại phòng không hợp lệ",
    });
    await expect(datGia("LP00000005", "2026-02-30", "2026-10-03", "1500000")).resolves.toEqual({
      ok: false,
      loi: "Khoảng ngày không hợp lệ",
    });
    await expect(datGia("LP00000005", "2026-10-01", "2026-10-03", "1.500.000")).resolves.toEqual({
      ok: false,
      loi: "Đơn giá không hợp lệ",
    });
    await expect(datGia("LP00000005", "2026-10-01", "2026-10-03", undefined)).resolves.toEqual({
      ok: false,
      loi: "Đơn giá không hợp lệ",
    });
    await expect(capNhatGiaGoc("LP00000005", -1)).resolves.toEqual({
      ok: false,
      loi: "Giá gốc không hợp lệ",
    });
  });
});
```

Trong `src/lib/nav.test.ts`, thay:

```ts
  it("8 muc cua artboard, them Buong phong va Bao tri sau So do phong", () => {
```

bằng:

```ts
  it("8 muc cua artboard, them Buong phong, Bao tri sau So do phong va Bang gia truoc Bao cao", () => {
```

và trong mảng kỳ vọng, thay `      "Hóa đơn",\n      "Báo cáo",` bằng:

```ts
      "Hóa đơn",
      "Bảng giá",
      "Báo cáo",
```

Run: `npx vitest run "src/app/(app)/pricing/actions.test.ts" src/lib/nav.test.ts` → Expected: FAIL.

- [x] **Step 2: Viết `src/app/(app)/pricing/actions.ts`**

```ts
"use server";

import { lamMoiNeuXong } from "@/lib/lam-moi";
import * as bangGia from "@/lib/thao-tac/bang-gia";
import { khongHopLe, laMa, laNgay, laTien } from "@/lib/thao-tac/kiem-tra";

/**
 * Man Bang gia. donGia null = tra doan ngay ve gia goc. Ngay da qua, den truoc
 * tu, he so vuot 99,99... do sp_DatGiaPhong / sp_CapNhatGiaLoaiPhong quyet dinh.
 */

export async function datGia(maLoai: unknown, tuNgay: unknown, denNgay: unknown, donGia: unknown) {
  if (!laMa(maLoai, "LP")) return khongHopLe("Loại phòng");
  if (!laNgay(tuNgay) || !laNgay(denNgay)) return khongHopLe("Khoảng ngày");
  const gia = donGia === null ? null : laTien(donGia) ? donGia : undefined;
  if (gia === undefined) return khongHopLe("Đơn giá");
  return lamMoiNeuXong(await bangGia.datGiaPhong(maLoai, tuNgay, denNgay, gia));
}

export async function capNhatGiaGoc(maLoai: unknown, donGia: unknown) {
  if (!laMa(maLoai, "LP")) return khongHopLe("Loại phòng");
  if (!laTien(donGia)) return khongHopLe("Giá gốc");
  return lamMoiNeuXong(await bangGia.capNhatGiaGoc(maLoai, donGia));
}
```

- [x] **Step 3: Thêm mục vào `src/lib/nav.ts`; thanh điều hướng cuộn được**

Trong import từ `lucide-react`, thêm `Tags,` sau `SprayCan,`. Ngay trước dòng `Báo cáo`, thêm:

```ts
  { nhan: "Bảng giá",         href: "/pricing",      icon: Tags },
```

Sidebar giờ có 11 mục. Trong `src/components/layout/sidebar.tsx`, thay `className="flex flex-grow flex-col gap-[2px] px-[14px] py-[6px]"` bằng `className="flex min-h-0 flex-grow flex-col gap-[2px] overflow-y-auto px-[14px] py-[6px]"`, để màn thấp không đẩy khung người dùng ra khỏi màn hình.

Run: `npx vitest run "src/app/(app)/pricing/actions.test.ts" src/lib/nav.test.ts` → Expected: `Tests 4 passed`.

- [x] **Step 4: Viết `src/components/pricing/dat-gia-form.tsx`**

```tsx
"use client";

import { useState } from "react";

import { datGia } from "@/app/(app)/pricing/actions";
import { SectionCard } from "@/components/shared/section-card";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";
import { formatNgay, formatVnd } from "@/lib/format";
import { docSoTien, themNgay } from "@/lib/tinh-toan";

type LoaiPhong = { maLoaiPhong: string; tenLoaiPhong: string; donGiaNgay: string };

/**
 * The "Dat gia theo khoang ngay": phu mot don gia len [tu, den] cua mot loai
 * phong (sp_DatGiaPhong), hoac tra doan do ve gia goc. He so chi de xem truoc;
 * thu tuc tu tinh lai va quyet dinh moi quy tac (ngay da qua, vuot 99,99 lan...).
 */
export function DatGiaForm({ loaiPhong, homNay }: { loaiPhong: LoaiPhong[]; homNay: string }) {
  const [maLoai, setMaLoai] = useState(loaiPhong[0]?.maLoaiPhong ?? "");
  const [tuNgay, setTuNgay] = useState(homNay);
  const [denNgay, setDenNgay] = useState(themNgay(homNay, 2));
  const [donGia, setDonGia] = useState("");
  const tt = useThaoTac();

  const loai = loaiPhong.find((l) => l.maLoaiPhong === maLoai);
  const so = Number(docSoTien(donGia));
  const heSo = loai && so > 0 && Number(loai.donGiaNgay) > 0 ? so / Number(loai.donGiaNgay) : null;
  const doan = () => `${loai?.tenLoaiPhong} từ ${formatNgay(tuNgay)} đến ${formatNgay(denNgay)}`;
  const o = "border-input bg-card h-10 rounded-[10px] border px-3 text-[13px]";

  return (
    <SectionCard tieuDe="Đặt giá theo khoảng ngày" phu="Khoảng cũ bị chồng tự được cắt / tách">
      <div className="flex flex-wrap items-end gap-3">
        <label htmlFor="bg-loai" className="flex flex-col gap-[6px] text-[12px]">
          <span className="text-muted-foreground">Loại phòng</span>
          <select id="bg-loai" value={maLoai} onChange={(e) => setMaLoai(e.target.value)} className={`${o} w-[220px]`}>
            {loaiPhong.map((l) => (
              <option key={l.maLoaiPhong} value={l.maLoaiPhong}>
                {l.tenLoaiPhong} · gốc {formatVnd(l.donGiaNgay)}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="bg-tu" className="flex flex-col gap-[6px] text-[12px]">
          <span className="text-muted-foreground">Từ ngày</span>
          <input id="bg-tu" type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} className={`${o} font-mono`} />
        </label>
        <label htmlFor="bg-den" className="flex flex-col gap-[6px] text-[12px]">
          <span className="text-muted-foreground">Đến ngày (tính cả ngày này)</span>
          <input id="bg-den" type="date" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} className={`${o} font-mono`} />
        </label>
        <label htmlFor="bg-gia" className="flex flex-col gap-[6px] text-[12px]">
          <span className="text-muted-foreground">Đơn giá / đêm (đ)</span>
          <input
            id="bg-gia"
            inputMode="decimal"
            placeholder="1.950.000"
            value={donGia}
            onChange={(e) => setDonGia(e.target.value)}
            className={`${o} w-[150px] font-mono`}
          />
        </label>
        <span className="text-muted-foreground h-10 font-mono text-[12.5px] leading-10">
          {heSo === null ? "" : `×${heSo.toFixed(2).replace(".", ",")} giá gốc`}
        </span>
        <span className="flex-grow" />
        <button
          type="button"
          disabled={tt.dangChay || !maLoai}
          onClick={() =>
            tt.chay(
              () => datGia(maLoai, tuNgay, denNgay, null),
              () => `Đã trả ${doan()} về giá gốc ${formatVnd(loai?.donGiaNgay ?? "0")}.`,
            )
          }
          className="border-border bg-card text-primary h-10 rounded-[10px] border px-4 text-[13px] font-semibold disabled:opacity-45"
        >
          Về giá gốc
        </button>
        <button
          type="button"
          disabled={tt.dangChay || !maLoai || donGia.trim() === ""}
          onClick={() =>
            tt.chay(
              () => datGia(maLoai, tuNgay, denNgay, docSoTien(donGia)),
              () => `Đã đặt giá ${doan()}: ${formatVnd(docSoTien(donGia))} / đêm.`,
            )
          }
          className="bg-primary text-primary-foreground h-10 rounded-[10px] px-5 text-[13px] font-semibold disabled:opacity-45"
        >
          Áp dụng
        </button>
      </div>
      <ThongBao tb={tt.thongBao} />
    </SectionCard>
  );
}
```

- [x] **Step 5: Viết `src/components/pricing/lich-gia.tsx`**

```tsx
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { SectionCard } from "@/components/shared/section-card";
import { formatSo, formatVnd } from "@/lib/format";
import type { LichGia as LichGiaKieu } from "@/lib/queries/bang-gia";
import { themNgay } from "@/lib/tinh-toan";

const THU = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** Mau o theo gia / gia goc: bang gia goc trung tinh, cao hon am dan, thap hon lanh. */
function mauO(tyLe: number) {
  if (tyLe < 0.995) return { bg: "#E6EDF6", fg: "#2A5480" };
  if (tyLe <= 1.005) return { bg: "#FAF7F1", fg: "#57504A" };
  if (tyLe <= 1.15) return { bg: "#F7EFDD", fg: "#8A5A0E" };
  if (tyLe <= 1.3) return { bg: "#F1DDB8", fg: "#7A4A08" };
  return { bg: "#F8E8E5", fg: "#8C3A31" };
}

/**
 * Lich gia 14 ngay (Server Component): dong la loai phong, cot la ngay, o la gia
 * tung ngay (nghin dong) theo fn_DonGiaPhongTheoNgay. Lui / tien bang ?tu=.
 */
export function LichGia({ lich, tuNgay, homNay }: { lich: LichGiaKieu; tuNgay: string; homNay: string }) {
  const nut = "border-border bg-card flex size-8 items-center justify-center rounded-lg border text-[#57504A]";

  return (
    <SectionCard
      tieuDe={`Lịch giá ${lich.ngay.length} ngày`}
      phu="Nghìn đồng / đêm · màu theo mức so với giá gốc"
      hanhDong={
        <span className="flex items-center gap-2">
          <Link href={`/pricing?tu=${themNgay(tuNgay, -14)}`} aria-label="Lùi 14 ngày" className={nut}>
            <ChevronLeft size={16} strokeWidth={1.9} />
          </Link>
          <Link href="/pricing" className="text-primary text-[12.5px] font-semibold no-underline">
            Hôm nay
          </Link>
          <Link href={`/pricing?tu=${themNgay(tuNgay, 14)}`} aria-label="Tiến 14 ngày" className={nut}>
            <ChevronRight size={16} strokeWidth={1.9} />
          </Link>
        </span>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="text-[11px] font-semibold text-[#857C73]">
              <th className="border-border bg-card sticky left-0 border-b pr-3 pb-[9px] tracking-[0.06em] uppercase">
                Loại phòng
              </th>
              {lich.ngay.map((n) => (
                <th
                  key={n}
                  className="border-border border-b px-1 pb-[9px] text-center font-mono font-medium"
                  style={n === homNay ? { color: "#14483F" } : undefined}
                >
                  <span className="block">{THU[new Date(`${n}T00:00:00Z`).getUTCDay()]}</span>
                  <span className="block">
                    {n.slice(8, 10)}/{n.slice(5, 7)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lich.loai.map((l) => (
              <tr key={l.maLoaiPhong} className="text-[12.5px]">
                <td className="border-border bg-card sticky left-0 border-b py-2 pr-3">
                  <span className="flex flex-col gap-px">
                    <span className="font-medium whitespace-nowrap">{l.tenLoaiPhong}</span>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      gốc {formatSo(Math.round(Number(l.donGiaNgay) / 1000))}
                    </span>
                  </span>
                </td>
                {l.gia.map((g, i) => {
                  const m = mauO(Number(g.donGia) / Number(l.donGiaNgay));
                  return (
                    <td key={lich.ngay[i]} className="border-border border-b p-[3px]">
                      <span
                        title={`${formatVnd(g.donGia)} · ${g.coKhaiGia ? "theo bảng giá" : "giá gốc"}`}
                        className="block rounded-md px-1 py-[6px] text-center font-mono text-[12px]"
                        style={{ background: m.bg, color: m.fg }}
                      >
                        {formatSo(Math.round(Number(g.donGia) / 1000))}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
```

- [x] **Step 6: Viết `src/components/pricing/cac-khoang-gia.tsx`**

```tsx
"use client";

import { useState } from "react";

import { capNhatGiaGoc, datGia } from "@/app/(app)/pricing/actions";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";
import { formatNgay, formatVnd } from "@/lib/format";
import type { LoaiPhongGia } from "@/lib/queries/bang-gia";
import { docSoTien } from "@/lib/tinh-toan";

/**
 * Moi loai phong mot the: sua gia goc tai cho, danh sach khoang gia. "Xoa" mot
 * khoang = tra khoang do ve gia goc tu max(ngay bat dau, hom nay), vi
 * sp_DatGiaPhong khong cho sua gia ngay da qua. Khoang da qua het chi de xem.
 */
export function CacKhoangGia({ bangGia, homNay }: { bangGia: LoaiPhongGia[]; homNay: string }) {
  return (
    <section className="grid shrink-0 grid-cols-1 gap-5 xl:grid-cols-2">
      {bangGia.map((l) => (
        <TheLoaiPhong key={l.maLoaiPhong} loai={l} homNay={homNay} />
      ))}
    </section>
  );
}

const heSo = (h: string) => `×${Number(h).toFixed(2).replace(".", ",")}`;

function TheLoaiPhong({ loai: l, homNay }: { loai: LoaiPhongGia; homNay: string }) {
  const [giaGoc, setGiaGoc] = useState(l.donGiaNgay.replace(/\.00$/, ""));
  const tt = useThaoTac();

  return (
    <div className="bg-card border-border flex flex-col gap-3 rounded-[14px] border p-5">
      <div className="flex items-center gap-3">
        <h2 className="m-0 flex-grow text-[15px] font-semibold">{l.tenLoaiPhong}</h2>
        <span className="text-muted-foreground font-mono text-[11.5px]">{l.maLoaiPhong}</span>
      </div>
      <div className="flex items-end gap-2">
        <label className="flex flex-col gap-[6px] text-[12px]">
          <span className="text-muted-foreground">Giá gốc / đêm (đ)</span>
          <input
            inputMode="decimal"
            aria-label={`Giá gốc ${l.tenLoaiPhong}`}
            value={giaGoc}
            onChange={(e) => setGiaGoc(e.target.value)}
            className="border-input bg-card h-9 w-[160px] rounded-[8px] border px-3 font-mono text-[13px]"
          />
        </label>
        <button
          type="button"
          disabled={tt.dangChay}
          onClick={() =>
            tt.chay(
              () => capNhatGiaGoc(l.maLoaiPhong, docSoTien(giaGoc)),
              () => `Đã đổi giá gốc ${l.tenLoaiPhong} thành ${formatVnd(docSoTien(giaGoc))}.`,
            )
          }
          className="border-border bg-card text-primary h-9 rounded-[8px] border px-3 text-[12.5px] font-semibold disabled:opacity-45"
        >
          Lưu giá gốc
        </button>
      </div>
      {l.khoang.length === 0 ? (
        <p className="text-muted-foreground m-0 text-[12.5px]">Chưa có khoảng giá: mọi ngày tính theo giá gốc.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-[6px] p-0">
          {l.khoang.map((k) => {
            const daQua = k.denNgay < homNay;
            const tu = k.apDungTuNgay < homNay ? homNay : k.apDungTuNgay;
            return (
              <li
                key={k.maBangGia}
                className={`border-border flex items-center gap-3 rounded-[8px] border px-3 py-2 text-[12.5px] ${daQua ? "opacity-50" : ""}`}
              >
                <span className="font-mono">
                  {formatNgay(k.apDungTuNgay)} – {formatNgay(k.denNgay)}
                </span>
                <span className="font-mono font-medium">{formatVnd(k.donGia)}</span>
                <span className="text-muted-foreground font-mono">({heSo(k.heSo)})</span>
                <span className="flex-grow" />
                {daQua ? (
                  <span className="text-muted-foreground text-[11.5px]">Đã qua</span>
                ) : (
                  <button
                    type="button"
                    disabled={tt.dangChay}
                    onClick={() => {
                      const cau = `${formatNgay(tu)} – ${formatNgay(k.denNgay)} của ${l.tenLoaiPhong}`;
                      if (!window.confirm(`Trả ${cau} về giá gốc?`)) return;
                      tt.chay(() => datGia(l.maLoaiPhong, tu, k.denNgay, null), () => `Đã trả ${cau} về giá gốc.`);
                    }}
                    className="text-[12px] font-semibold text-[#8C3A31] disabled:opacity-45"
                  >
                    Xóa
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <ThongBao tb={tt.thongBao} />
    </div>
  );
}
```

- [x] **Step 7: Viết `src/app/(app)/pricing/page.tsx`**

```tsx
import { Topbar } from "@/components/layout/topbar";
import { CacKhoangGia } from "@/components/pricing/cac-khoang-gia";
import { DatGiaForm } from "@/components/pricing/dat-gia-form";
import { LichGia } from "@/components/pricing/lich-gia";
import { getBangGia, getLichGia } from "@/lib/queries/bang-gia";
import { getNgayHienTai } from "@/lib/queries/ngay";
import { laNgay } from "@/lib/thao-tac/kiem-tra";

export default async function BangGiaPage({ searchParams }: PageProps<"/pricing">) {
  const [{ tu }, homNay] = await Promise.all([searchParams, getNgayHienTai()]);
  // ?tu= sai dinh dang (go tay tren thanh dia chi) thi ve hom nay, khong vo trang.
  const tuNgay = typeof tu === "string" && laNgay(tu) ? tu : homNay;
  const [bangGia, lich] = await Promise.all([getBangGia(), getLichGia(tuNgay)]);

  return (
    <>
      <Topbar
        tieuDe="Bảng giá phòng"
        phu="Giá theo ngày · chỉ áp dụng cho phiếu đặt mới"
        hanhDong={
          <span className="text-muted-foreground text-[12.5px]">Phiếu đã lập giữ giá đã chốt (QT-06)</span>
        }
      />

      <main className="flex min-h-0 flex-grow flex-col gap-5 overflow-auto px-8 py-7">
        <DatGiaForm
          loaiPhong={bangGia.map(({ maLoaiPhong, tenLoaiPhong, donGiaNgay }) => ({
            maLoaiPhong,
            tenLoaiPhong,
            donGiaNgay,
          }))}
          homNay={homNay}
        />
        <LichGia lich={lich} tuNgay={tuNgay} homNay={homNay} />
        <CacKhoangGia bangGia={bangGia} homNay={homNay} />
      </main>
    </>
  );
}
```

- [x] **Step 8: Kiểm kiểu, lint, cả bộ test**

Run: `npx next typegen && npx tsc --noEmit && npm run lint` → Expected: không lỗi. `typegen` sinh `PageProps<"/pricing">` cho route mới.
Run: `npm test` → Expected: `Test Files 41 passed`, `Tests 242 passed`.

- [x] **Step 9: Commit**

```bash
git add "src/app/(app)/pricing" src/components/pricing src/lib/nav.ts src/lib/nav.test.ts src/components/layout/sidebar.tsx
git commit -m "feat: man Bang gia: dat gia theo khoang ngay, lich gia 14 ngay, sua gia goc

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Form đặt phòng hiện chi tiết giá từng đoạn

**Files:**
- Modify: `src/components/bookings/booking-form.tsx`

**Interfaces:**
- Consumes: `LoaiPhongConTrong.chiTietGia`, `DoanGia` (Task 11); `formatNgayNgan` (Task 11).
- Produces: thẻ "Tạm tính" có nhãn "Đơn giá / đêm (trung bình)" và khối "Chi tiết giá". Mỗi dòng có dạng `27/09–28/09 · 1.500.000 ₫ × 2 đêm`; đoạn chỉ có 1 đêm thì không có `–`.

- [x] **Step 1: Sửa `src/components/bookings/booking-form.tsx`**

Thay `import { formatVnd } from "@/lib/format";` bằng:

```tsx
import type { DoanGia } from "@/lib/chi-tiet-gia";
import { formatNgayNgan, formatVnd } from "@/lib/format";
```

Trong `type LoaiPhong`, thay `  soPhongTrong: number;\n};` bằng:

```tsx
  soPhongTrong: number;
  chiTietGia: DoanGia[];
};
```

Thay:

```tsx
          <Dong
            nhan="Đơn giá / đêm"
            giaTri={formatVnd(loai?.donGiaNgay ?? "0.00")}
            mono
          />
```

bằng:

```tsx
          <Dong
            nhan="Đơn giá / đêm (trung bình)"
            giaTri={formatVnd(loai?.donGiaNgay ?? "0.00")}
            mono
          />
          {!tamTinh.loi && loai && loai.chiTietGia.length > 0 ? (
            <div className="bg-muted flex flex-col gap-1 rounded-[10px] px-3 py-[10px]">
              <span className="text-muted-foreground text-[11.5px]">Chi tiết giá</span>
              {loai.chiTietGia.map((d) => (
                <span key={d.tuNgay} className="font-mono text-[12px]">
                  {formatNgayNgan(d.tuNgay)}
                  {d.soDem > 1 ? `–${formatNgayNgan(d.denNgay)}` : ""} · {formatVnd(d.donGia)} × {d.soDem} đêm
                </span>
              ))}
            </div>
          ) : null}
```

- [x] **Step 2: Kiểm kiểu, lint, cả bộ test**

Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.
Run: `npm test` → Expected: `Test Files 41 passed`, `Tests 242 passed`.

- [x] **Step 3: Commit**

```bash
git add src/components/bookings/booking-form.tsx
git commit -m "feat: form dat phong hien chi tiet gia tung doan va don gia trung binh

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 15: README và kiểm cả nhánh trước khi đụng CSDL dev

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: toàn bộ Task 1–14.
- Produces: README mô tả đủ các màn và thứ tự chạy lại script. Nhánh qua được test, lint và build.

- [x] **Step 1: Sửa `README.md`**

Thay đoạn mở đầu (dòng 6–11):

```markdown
9 màn hình nghiệp vụ (Tổng quan, Sơ đồ phòng, Đặt phòng, Nhận & trả phòng, Khách
hàng, Dịch vụ, Hóa đơn, Báo cáo, Đăng nhập) **đọc dữ liệu thật** từ database
`QuanLyKhachSan`. Mọi nút ghi (đặt phòng, thu cọc, nhận / trả phòng, hủy phiếu,
ghi dịch vụ, lập hóa đơn, thanh toán, dọn / sửa phòng) gọi đúng thủ tục của
`06_Procedures.sql`. Phiên đăng nhập và tài khoản MySQL theo vai trò là phase 3.
Thiết kế: `docs/superpowers/specs/2026-09-26-noi-csdl-phase-*.md`.
```

bằng:

```markdown
12 màn hình nghiệp vụ (Tổng quan, Sơ đồ phòng, Buồng phòng, Bảo trì, Đặt phòng,
Nhận & trả phòng, Khách hàng, Dịch vụ, Hóa đơn, Bảng giá, Báo cáo, Đăng nhập)
**đọc dữ liệu thật** từ database `QuanLyKhachSan`. Mọi nút ghi (thêm / sửa khách,
đặt phòng, thu cọc, nhận / trả phòng, hủy phiếu, ghi dịch vụ, lập hóa đơn, thanh
toán, báo dọn / báo bảo trì, dọn xong / sửa xong, đặt giá theo khoảng ngày) gọi
đúng thủ tục của `06_Procedures.sql`. Giá khi đặt phòng là trung bình giá các đêm
(`fn_DonGiaTrungBinh`). Phiên đăng nhập và tài khoản MySQL theo vai trò là phase 3.
Thiết kế: `docs/superpowers/specs/2026-09-26-noi-csdl-phase-*.md`,
`docs/superpowers/specs/2026-09-27-bo-sung-nghiep-vu-design.md`.
```

Thay đoạn (dòng 48–50):

```markdown
Khi nhóm sửa thủ tục, chỉ cần chạy lại `06`: file chỉ `DROP` / `CREATE` thủ tục,
không đụng dữ liệu. Nhưng MySQL xóa luôn quyền `EXECUTE` đã cấp trên thủ tục bị
`DROP`, nên máy nào đã chạy `08` thì chạy lại `08` ngay sau `06`.
```

bằng:

```markdown
Khi nhóm sửa hàm, trigger hay thủ tục, chỉ cần chạy lại `02`, `04`, `06` theo đúng
thứ tự đó (trigger `trg_CTDP_TinhThanhTien_BI` ở `04` gọi `fn_DonGiaTrungBinh` của
`02`). Ba file chỉ `DROP` / `CREATE`, không đụng dữ liệu. Nhưng MySQL xóa luôn quyền
`EXECUTE` đã cấp trên hàm / thủ tục bị `DROP`, nên máy nào đã chạy `08` thì chạy lại
`08` ngay sau.
```

Trong khối "Cấu trúc", thay `# mặt tiền đọc dữ liệu cho 9 màn hình` bằng `# mặt tiền đọc dữ liệu cho 12 màn hình`, và `# (app)/ 8 màn nghiệp vụ, (auth)/login, db-check` bằng `# (app)/ 11 màn nghiệp vụ, (auth)/login, db-check`.

Trong "Việc chưa làm", thêm dòng sau dòng Phase 3:

```markdown
- Yêu cầu dọn cho phòng đang có khách, mức ưu tiên và phân công việc buồng phòng /
  bảo trì: cần bảng yêu cầu riêng, nhóm đã chọn chưa đổi schema (spec bổ sung
  nghiệp vụ §4.1).
```

- [x] **Step 2: Kiểm kiểu, lint, test, build**

Run: `npx tsc --noEmit && npm run lint` → Expected: không lỗi.
Run: `npm test` → Expected: `Test Files 41 passed`, `Tests 242 passed`.
Run: `npm run build` → Expected: build xong. Danh sách route có `/housekeeping`, `/maintenance`, `/pricing`, tất cả là `ƒ` (dynamic).

- [x] **Step 3: Rà diff cả nhánh**

Run: `git diff main --stat` → Expected: chỉ có file trong `src/`, `docs/superpowers/`, `README.md`. Không có `.env*`, `src/db/schema.ts`, `src/db/relations.ts`.
Run: `diff -r "$BK/goc" "$QLKS_SCRIPTS_DIR" --exclude='0[1357]_*'` rồi đọc lại toàn bộ thay đổi của `02`, `04`, `06`, `08`. Expected: chỉ có các đoạn của Task 1, 5, 10, 12. `diff "$BK/goc/01_Create_Database.sql" "$QLKS_SCRIPTS_DIR/01_Create_Database.sql"` và `07` không có dòng nào (schema không đổi).

- [x] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: README: man Buong phong, Bao tri, Bang gia; chay lai 02, 04, 06 roi 08

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Cài script mới vào CSDL dev, đi ba kịch bản của spec trên giao diện

**Files:**
- Không sửa code. Script kiểm và ảnh chụp để trong `$BK`.

**Interfaces:**
- Consumes: toàn bộ Task 1–15; `npm run db:mau`; `scripts/doc-url-mysql.sh`.
- Produces:
  - CSDL dev có 6 hàm và 26 thủ tục (19 cũ + 7 mới).
  - Ảnh chụp ba kịch bản ở tiêu chí 1–3 của spec §1, để gửi người dùng.
  - Kết thúc bằng dữ liệu mẫu nạp lại.

- [x] **Step 1: Hỏi người dùng trước khi ghi vào CSDL dev**

Gửi câu hỏi sau, và **chỉ làm tiếp khi người dùng đồng ý**:

> Sẽ chạy lại `02_Functions.sql`, `04_Triggers.sql`, `06_Procedures.sql` vào CSDL dev `QuanLyKhachSan`. Ba file chỉ thay hàm, trigger và thủ tục, không đụng bảng hay dữ liệu.
>
> Sau đó `npm run db:mau`, rồi đi ba kịch bản trên giao diện:
> 1. thêm / sửa khách, tìm khách, tạo khách ngay trong form đặt phòng;
> 2. báo bảo trì → sửa xong → dọn xong;
> 3. đặt giá 3 ngày cho Deluxe King rồi đặt phòng vắt qua 3 ngày đó.
>
> Các kịch bản này ghi dữ liệu thử vào CSDL dev, cuối cùng `npm run db:mau` lần nữa để trả về dữ liệu mẫu.
>
> Riêng `08_Security_Roles.sql` (cấp quyền cho thủ tục / hàm mới) sẽ tạo hoặc cập nhật user MySQL thật trên server. Có chạy `08` luôn không?

- [x] **Step 2: Cài `02 → 04 → 06`, nạp lại dữ liệu mẫu**

```bash
cd /Users/anhpham/PA/UIT/Demo
set -a; source .env.local; set +a
source scripts/doc-url-mysql.sh; doc_url_mysql "$DATABASE_URL" DATABASE_URL
for f in 02_Functions 04_Triggers 06_Procedures; do
  mysql -u"$NGUOI_DUNG" -h"$MAY" -P"$CONG" --default-character-set=utf8mb4 < "$QLKS_SCRIPTS_DIR/$f.sql" > /dev/null \
    && echo "$f ok" || break
done
mysql -u"$NGUOI_DUNG" -h"$MAY" -P"$CONG" -N "$TEN_CSDL" -e "
  SELECT ROUTINE_TYPE, COUNT(*) FROM information_schema.ROUTINES
  WHERE ROUTINE_SCHEMA = DATABASE() GROUP BY ROUTINE_TYPE ORDER BY ROUTINE_TYPE;
  SELECT COUNT(*) FROM information_schema.ROUTINES
  WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_NAME = 'sp_GhiNhanSuaPhong'
    AND ROUTINE_DEFINITION LIKE '%hay bao bao tri truoc%';
  SELECT COUNT(*) FROM information_schema.TRIGGERS
  WHERE TRIGGER_SCHEMA = DATABASE() AND TRIGGER_NAME = 'trg_CTDP_TinhThanhTien_BI'
    AND ACTION_STATEMENT LIKE '%fn_DonGiaTrungBinh%';"
npm run db:mau
```

Expected:
- `02_Functions ok`, `04_Triggers ok`, `06_Procedures ok`;
- `FUNCTION 6`, `PROCEDURE 26`;
- `1` (bản `sp_GhiNhanSuaPhong` mới), `1` (trigger mới);
- `Da nap lai du lieu mau vao QuanLyKhachSan: hom nay <dd/mm/yyyy> co 12 luot nhan, 9 luot tra phong`.

- [x] **Step 3: Chạy `08` nếu người dùng đồng ý ở Step 1**

```bash
mysql -u"$NGUOI_DUNG" -h"$MAY" -P"$CONG" --default-character-set=utf8mb4 < "$QLKS_SCRIPTS_DIR/08_Security_Roles.sql" > /dev/null && echo "08 ok"
mysql -u"$NGUOI_DUNG" -h"$MAY" -P"$CONG" -N -e "SHOW GRANTS FOR r_letan" | grep -ci "sp_ThemKhachHang\|sp_BaoDonPhong\|fn_DonGiaTrungBinh"
```

Expected: `08 ok`, rồi `3` (MySQL có thể in tên thủ tục chữ thường, nên `grep -i`). Người dùng không đồng ý thì bỏ qua bước này, ghi lại trong báo cáo cuối.

- [x] **Step 4: Dev server và kiểm nhanh bằng `curl`**

Nếu `:3000` đang chạy thì dùng luôn (HMR đã nạp code mới). Nếu chưa, mở `npm run dev` trong Terminal panel của người dùng. Không dùng preview pane, vì ở phase 2 người dùng đã từ chối.

```bash
for p in / /rooms /housekeeping /maintenance /bookings/new /front-desk /customers /services /invoices /pricing "/pricing?tu=abc" /reports /login; do
  printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3000$p")" "$p"
done
curl -s http://localhost:3000/housekeeping | grep -o "Phòng chờ dọn" | head -1
curl -s http://localhost:3000/maintenance | grep -o "Sua he thong nuoc nong" | head -1
curl -s http://localhost:3000/pricing | grep -o "Lịch giá 14 ngày" | head -1
```

Expected: mọi route `200` (kể cả `?tu=abc`, trang lấy hôm nay). Ba dòng `grep` đều in ra chữ tìm.

- [x] **Step 5: Đi ba kịch bản bằng Chrome headless**

Lưu script sau vào `$BK/kiem-bo-sung.mjs`. Script dùng Chrome của máy với một profile tạm riêng, không đụng profile của người dùng.

```js
// Di 3 kich ban cua spec bo sung nghiep vu tren giao dien bang Chrome headless + CDP.
// node kiem-bo-sung.mjs <thu-muc-anh> <thu-muc-profile-tam> [http://localhost:3000]
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const [OUT, PROF, BASE = "http://localhost:3000"] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--disable-gpu", "--hide-scrollbars", `--user-data-dir=${PROF}`,
  "--remote-debugging-port=9337", "--window-size=1440,900", "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const S = JSON.stringify;
const cong = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
let so = 0;
const ketQua = {};
try {
  let targets;
  for (let i = 0; i < 50; i++) {
    try { targets = await (await fetch("http://127.0.0.1:9337/json/list")).json(); break; } catch { await sleep(200); }
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
    if (m.method === "Page.javascriptDialogOpening") gui("Page.handleJavaScriptDialog", { accept: true });
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
  // Bam nut dau tien co chu `chu` trong vung `pham` (bieu thuc JS), bo qua nut dang khoa.
  const bam = async (chu, pham = "document") => {
    const r = await js(`(() => { const goc = ${pham}; const el = goc && [...goc.querySelectorAll("button")].find(e => e.textContent.includes(${S(chu)}) && !e.disabled); if (!el) return false; el.click(); return true; })()`);
    if (!r) throw new Error("khong thay nut: " + chu);
  };
  // Dat gia tri o nhap / o chon theo selector; React nhan su kien input / change.
  const nhap = (chon, v) => js(`(() => { const el = document.querySelector(${S(chon)}); const p = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(p, "value").set.call(el, ${S(v)}); el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? "change" : "input", { bubbles: true })); return el.value; })()`);
  const nhom = (soPhong) => `document.querySelector(${S(`[role=group][aria-label="Phòng ${soPhong}"]`)})`;
  const thongBao = async (chua) => {
    await doiDen(`[...document.querySelectorAll('[role=status],[role=alert]')].some(e => e.textContent.includes(${S(chua)}))`);
    const t = await js(`[...document.querySelectorAll('[role=status],[role=alert]')].map(e => e.textContent.trim()).join(" | ")`);
    console.log("   ->", t);
    return t;
  };
  const chup = async (ten) => {
    const a = await gui("Page.captureScreenshot", { format: "png" });
    writeFileSync(`${OUT}/${String(++so).padStart(2, "0")}-${ten}.png`, Buffer.from(a.result.data, "base64"));
  };
  const chonKhachDang = async () => {
    await js(`document.querySelector("#timkh").focus()`);
    await nhap("#timkh", "Đặng Thùy");
    await doiDen(`[...document.querySelectorAll("[role=option]")].some(o => o.textContent.includes("Dang Thuy Linh"))`);
    await js(`[...document.querySelectorAll("[role=option]")].find(o => o.textContent.includes("Dang Thuy Linh")).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))`);
    await doiDen(`[...document.querySelectorAll("button")].some(b => b.textContent.includes("Đổi khách"))`);
  };

  await gui("Page.enable"); await gui("Runtime.enable");
  await gui("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  console.log("A1. Them khach hang");
  await moi("/customers");
  await bam("Thêm khách hàng");
  await doiDen(`!!document.querySelector("input[name=hoTen]")`);
  await nhap("input[name=hoTen]", "Nguyễn Thử Nghiệm");
  await nhap("input[name=cccd]", "079299009999");
  await nhap("input[name=sdt]", "0909 123 456");
  await bam("Lưu khách hàng");
  ketQua.khachMoi = (await thongBao("Đã thêm khách")).match(/KH\d{8}/)[0];
  await chup("them-khach");

  console.log("A2. Sua khach vua them");
  await moi("/customers");
  await js(`document.querySelector(${S('button[aria-label="Sửa hồ sơ Nguyễn Thử Nghiệm"]')}).click()`);
  await doiDen(`document.querySelector("input[name=sdt]")?.value === "0909123456"`);
  await nhap("input[name=sdt]", "0909 654 321");
  await bam("Lưu thay đổi");
  await thongBao("Đã lưu hồ sơ");
  await chup("sua-khach");

  console.log("A3. Trung CCCD: CSDL tu choi");
  await bam("Thêm khách hàng");
  await doiDen(`document.querySelector("input[name=hoTen]")?.value === ""`);
  await nhap("input[name=hoTen]", "Khách Trùng");
  await nhap("input[name=cccd]", "079201000001");
  await bam("Lưu khách hàng");
  await thongBao("CCCD da co trong ho so KH00000001");
  await chup("trung-cccd");

  console.log("A4. Dat phong: tim khach 'Đặng Thùy'");
  await moi("/bookings/new");
  await chonKhachDang();
  await chup("tim-khach");

  console.log("A5. Khach moi ngay trong form dat phong, lap phieu");
  await bam("Đổi khách");
  await bam("Khách mới");
  await doiDen(`!!document.querySelector("input[name=hoTen]")`);
  await nhap("input[name=hoTen]", "Trần Khách Mới");
  await nhap("input[name=cccd]", "079299008888");
  await bam("Lưu khách hàng");
  await doiDen(`document.body.textContent.includes("Trần Khách Mới") && document.body.textContent.includes("Đổi khách")`);
  await doiDen(`[...document.querySelectorAll("button")].some(b => b.textContent.includes("Lập phiếu đặt phòng") && !b.disabled)`);
  await bam("Lập phiếu đặt phòng");
  await thongBao("Đã lập phiếu");
  await chup("dat-phong-khach-moi");

  console.log("B1. So do phong: bao bao tri mot phong Trong");
  await moi("/rooms");
  ketQua.phong = await js(`(() => { const b = [...document.querySelectorAll("button[aria-label^='Phòng ']")].find(b => b.getAttribute("aria-label").endsWith(", Trống")); b.click(); return b.getAttribute("aria-label").match(/^Phòng (.+), Trống$/)[1]; })()`);
  console.log("   phong", ketQua.phong);
  await doiDen(`!!document.querySelector("input[name=moTaSuCo]")`);
  await nhap("input[name=moTaSuCo]", "Vòi sen rỉ nước (kiểm thử)");
  await bam("Báo bảo trì");
  await thongBao("Đã báo bảo trì");
  await bam("Báo dọn phòng");
  await thongBao("Phong dang bao tri");
  await chup("bao-bao-tri");

  console.log("B2. Bao tri: sua xong");
  await moi("/maintenance");
  await doiDen(`!!${nhom(ketQua.phong)}`);
  await bam("Sửa xong", nhom(ketQua.phong));
  await doiDen(`!!${nhom(ketQua.phong)}.querySelector("input[name=chiPhi]")`);
  await nhap(`[role=group][aria-label="Phòng ${ketQua.phong}"] input[name=chiPhi]`, "250.000");
  await bam("Xác nhận sửa xong", nhom(ketQua.phong));
  await thongBao("chuyển sang Đang dọn");
  await chup("sua-xong");

  console.log("B3. Buong phong: don xong");
  await moi("/housekeeping");
  await doiDen(`!!${nhom(ketQua.phong)}`);
  await bam("Dọn xong", nhom(ketQua.phong));
  await thongBao("Đã ghi nhận dọn xong");
  await chup("don-xong");

  console.log("B4. So do phong: phong ve Trong");
  await moi("/rooms");
  await doiDen(`!!document.querySelector(${S(`button[aria-label="Phòng ${ketQua.phong}, Trống"]`)})`);
  await chup("so-do-sau-vong");

  console.log("C1. Bang gia: Deluxe King tu +10 den +12 ngay, 1.950.000");
  await moi("/pricing");
  ketQua.homNay = await js(`document.querySelector("#bg-tu").value`);
  await nhap("#bg-loai", "LP00000005");
  await nhap("#bg-tu", cong(ketQua.homNay, 10));
  await nhap("#bg-den", cong(ketQua.homNay, 12));
  await nhap("#bg-gia", "1.950.000");
  await bam("Áp dụng");
  await thongBao("Đã đặt giá");
  await chup("dat-gia");
  await moi(`/pricing?tu=${cong(ketQua.homNay, 7)}`);
  await chup("lich-gia");

  console.log("C2. Dat phong tu +9 den +13: 1 dem gia goc + 3 dem gia moi");
  await moi("/bookings/new");
  await chonKhachDang();
  await nhap("#nhan", cong(ketQua.homNay, 9));
  await nhap("#tra", cong(ketQua.homNay, 13));
  await doiDen(`[...document.querySelectorAll("button")].some(b => b.textContent.includes("Deluxe King") && b.textContent.includes("1.837.500"))`);
  await bam("Deluxe King");
  await doiDen(`document.body.textContent.includes("× 3 đêm") && document.body.textContent.includes("× 1 đêm")`);
  await chup("chi-tiet-gia");
  await bam("Lập phiếu đặt phòng");
  ketQua.phieuGia = (await thongBao("Đã lập phiếu")).match(/DP\d{8}/)[0];
  await chup("dat-phong-gia-trung-binh");

  writeFileSync(`${OUT}/ket-qua.json`, JSON.stringify(ketQua, null, 2));
  console.log("XONG", ketQua);
  ws.close();
} finally {
  chrome.kill();
}
```

```bash
node "$BK/kiem-bo-sung.mjs" "$BK/anh" "$BK/chrome-profile"
```

Expected:
- Log đi hết `A1` … `C2` rồi in `XONG { khachMoi: 'KH00000061', phong: '<số phòng>', homNay: '<hôm nay>', phieuGia: 'DP000000..' }`.
- Không có dòng `LOI JS`.
- Có 13 ảnh trong `$BK/anh`.
- Mở từng ảnh ra xem: dòng thông báo xanh hoặc đỏ đúng như tên ảnh. Ảnh `lich-gia` có ba ô Deluxe King hiện `1.950` màu ấm.

Nếu một bước hết giờ chờ: chụp màn hình lúc đó (`chup("loi")`), đọc thông báo trên trang, sửa rồi chạy lại từ `npm run db:mau` (Step 2).

- [x] **Step 6: Đối chiếu CSDL dev**

```bash
PHIEU=$(node -e "console.log(require('$BK/anh/ket-qua.json').phieuGia)")
mysql -u"$NGUOI_DUNG" -h"$MAY" -P"$CONG" "$TEN_CSDL" -t -e "
  SELECT MaKH, HoTen, CCCD, SDT, Email FROM KHACH_HANG WHERE CCCD IN ('079299009999', '079299008888') ORDER BY MaKH;
  SELECT ct.GiaThueThoiDiem, ct.SoDem, pd.TienCoc FROM CHI_TIET_DAT_PHONG ct
  JOIN PHIEU_DAT_PHONG pd ON pd.MaDatPhong = ct.MaDatPhong WHERE ct.MaDatPhong = '$PHIEU';
  SELECT MaSua, MaTK, ChiPhi, MoTaLoi FROM SUA_PHONG ORDER BY MaSua DESC LIMIT 1;"
```

Expected:
- Hai khách: `KH00000061` "Nguyễn Thử Nghiệm" SĐT `0909654321` email `NULL`, và `KH00000062` "Trần Khách Mới".
- Phiếu giá: `1837500.00 | 4 | 1837500.00`, tức (1.500.000 + 3 × 1.950.000) / 4, cọc một đêm.
- Dòng `SUA_PHONG` mới nhất: `MaTK` `TK00000006`, `ChiPhi` `250000.00`, mô tả "Vòi sen rỉ nước (kiểm thử)".

- [x] **Step 7: Trả CSDL dev về dữ liệu mẫu, báo người dùng**

Run: `npm run db:mau` → Expected: `Da nap lai du lieu mau …`.

Gửi người dùng các ảnh trong `$BK/anh` (SendUserFile) kèm tóm tắt:
- đã cài `02`, `04`, `06` vào CSDL dev (và `08` nếu người dùng đồng ý);
- ba kịch bản đã đi xong;
- phần báo cáo nhóm cần tự sửa, theo spec §8: Bảng 4.1, 4.2, 4.3.

Sau đó dùng superpowers:finishing-a-development-branch để chọn cách gộp nhánh.
