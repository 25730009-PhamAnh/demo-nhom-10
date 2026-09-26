# Demo — Quản lý khách sạn

Project demo cho đồ án môn Quản lý thông tin (Nhóm 10).
Stack: **Next.js 16** (App Router) · **Drizzle ORM** · **shadcn/ui** · **MySQL**.

9 màn hình nghiệp vụ (Tổng quan, Sơ đồ phòng, Đặt phòng, Nhận & trả phòng, Khách
hàng, Dịch vụ, Hóa đơn, Báo cáo, Đăng nhập) **đọc dữ liệu thật** từ database
`QuanLyKhachSan`. Mọi nút ghi (đặt phòng, thu cọc, nhận / trả phòng, hủy phiếu,
ghi dịch vụ, lập hóa đơn, thanh toán, dọn / sửa phòng) gọi đúng thủ tục của
`06_Procedures.sql`. Phiên đăng nhập và tài khoản MySQL theo vai trò là phase 3.
Thiết kế: `docs/superpowers/specs/2026-09-26-noi-csdl-phase-*.md`.

---

## Chạy lần đầu

Cần có Node.js 20+ và MySQL 8.0.16+ đang chạy.

```bash
cd Demo
npm install
cp .env.example .env.local   # sửa user/password, và QLKS_SCRIPTS_DIR
```

`.env.local` cần ba biến (xem chú thích trong `.env.example`):

| Biến | Dùng cho |
|------|----------|
| `DATABASE_URL` | CSDL dev `QuanLyKhachSan` mà app đọc |
| `QLKS_SCRIPTS_DIR` | Thư mục `Scripts/setup_database` của nhóm (chứa `01`…`07`) |
| `DATABASE_URL_TEST` | CSDL kiểm thử, **khác** CSDL dev — `npm test` xóa và dựng lại nó |

### Tạo database

Chạy `01` → `07` trong `Scripts/setup_database/` theo thứ tự. `01` có
`DROP DATABASE QuanLyKhachSan`, nên mọi dữ liệu cũ sẽ mất:

```bash
cd "<QLKS_SCRIPTS_DIR>"
for f in 01_Create_Database 02_Functions 03_Views 04_Triggers 05_Cursors 06_Procedures 07_Sample_Data; do
  mysql -u root -p --default-character-set=utf8mb4 < "$f.sql" || break
done
```

Rồi `npm run dev` và mở http://localhost:3000. Trang `/db-check` in số dòng
của 14 bảng để kiểm tra kết nối.

Khi nhóm sửa thủ tục, chỉ cần chạy lại `06`: file chỉ `DROP` / `CREATE` thủ tục,
không đụng dữ liệu. Nhưng MySQL xóa luôn quyền `EXECUTE` đã cấp trên thủ tục bị
`DROP`, nên máy nào đã chạy `08` thì chạy lại `08` ngay sau `06`.

### Trước buổi demo: nạp lại dữ liệu mẫu

Ngày tháng trong `07_Sample_Data.sql` tính theo **ngày nạp** (`CURDATE()` lúc
chạy script). Nạp hôm nay thì hôm nay có 12 lượt nhận và 9 lượt trả phòng; sang
hôm sau các phiếu đó đã quá hạn và màn Tổng quan không còn lượt nào. Vì vậy,
vào ngày demo chạy:

```bash
npm run db:mau
```

Lệnh này chỉ chạy lại `07` vào CSDL dev (TRUNCATE rồi nạp lại), không đụng
bảng, thủ tục hay trigger. Mọi thay đổi đã ghi vào CSDL dev sẽ mất.

---

## Quy ước quan trọng của project này

### 1. Script SQL là nguồn chân lý, không phải Drizzle

Schema thật nằm ở `../Scripts/*.sql` — đó là thứ nhóm nộp. Drizzle chỉ **đọc
ngược** (introspect) từ database ra TypeScript để code có type:

```bash
npm run db:pull
```

Lệnh này sinh ra, trong `src/db/`:

| File | Vai trò |
|------|---------|
| `schema.ts` | 14 bảng dưới dạng Drizzle — **không sửa tay** |
| `relations.ts` | Quan hệ giữa các bảng — **không sửa tay** |
| `0000_*.sql` | Ảnh chụp DDL tại thời điểm pull |
| `meta/` | Snapshot nội bộ của drizzle-kit |

**Không dùng `drizzle-kit generate` / `migrate` / `push`.** Nếu dùng, Drizzle sẽ
thành nguồn schema thứ hai và sớm muộn cũng lệch với bài nộp.

Quy trình khi schema đổi: sửa `../Scripts/*.sql` → chạy lại script vào MySQL →
`npm run db:pull` → commit `src/db/` đã sinh lại.

### 2. Đọc bằng Drizzle, ghi bằng Stored Procedure

- **Đọc** (danh sách, chi tiết, báo cáo): query bằng Drizzle cho gọn và có type.
  Xem ví dụ ở `src/lib/db-check.ts`.
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

"Hôm nay" của app là `CURDATE()` của CSDL (`src/lib/queries/ngay.ts`), không
phải đồng hồ của máy chạy Next — thủ tục và view của nhóm cũng so với
`CURDATE()`.

---

## Cấu trúc

```
Demo/
├── drizzle.config.ts       # cấu hình introspect, trỏ vào QuanLyKhachSan
├── .env.local              # DATABASE_URL, QLKS_SCRIPTS_DIR, DATABASE_URL_TEST (KHÔNG commit)
├── .env.example            # mẫu cho cả nhóm
├── scripts/
│   ├── db-test-setup.sh    # dựng CSDL kiểm thử từ 01–07 (vitest gọi)
│   └── db-nap-lai-mau.sh   # npm run db:mau
└── src/
    ├── db/
    │   ├── schema.ts       # sinh ra bởi db:pull
    │   ├── relations.ts    # sinh ra bởi db:pull
    │   ├── index.ts        # connection pool + export db
    │   ├── procedures.ts   # helper gọi CALL sp_*
    │   └── loi.ts          # SIGNAL 45000 -> "CSDL từ chối: …"
    ├── lib/
    │   ├── queries/        # mặt tiền đọc dữ liệu cho 9 màn hình
    │   ├── thao-tac/       # mặt tiền ghi: mỗi hàm một thủ tục, trả { ok, data | loi }
    │   ├── lam-moi.ts      # refresh() sau khi Server Action ghi xong
    │   ├── db-check.ts     # query cho trang /db-check
    │   └── format.ts       # format tiền VND
    ├── test/               # dựng / nạp lại CSDL kiểm thử cho vitest
    ├── components/         # theo màn hình + shared/ + ui/ (shadcn)
    └── app/                # (app)/ 8 màn nghiệp vụ, (auth)/login, db-check
```

## Lệnh

| Lệnh | Việc |
|------|------|
| `npm run dev` | Chạy dev server ở cổng 3000 |
| `npm run build` | Build production, có type-check |
| `npm run lint` | ESLint |
| `npm test` | Test tích hợp trên `DATABASE_URL_TEST` (dựng lại từ `01`–`07`, ngày đóng băng 23/09/2026; test ghi nạp lại dữ liệu mẫu trước từng ca, các file chạy tuần tự) |
| `npm run db:mau` | Nạp lại dữ liệu mẫu `07` vào CSDL dev theo ngày hôm nay |
| `npm run db:pull` | Introspect lại schema từ MySQL |
| `npm run db:studio` | Mở Drizzle Studio để xem dữ liệu |

---

## Việc chưa làm

- Phase 3: phiên đăng nhập, chặn route, mỗi vai trò dùng tài khoản MySQL riêng
  của `08_Security_Roles.sql`.

---

## Lưu ý: OneDrive và `node_modules`

Nếu để `Demo/` trong OneDrive thì OneDrive sẽ cố sync `node_modules`
(khoảng 30.000 file). Hệ quả: OneDrive chạy nền liên tục, và build có thể chậm.

Cách xử lý, chọn một:

1. **Loại trừ khỏi sync** — OneDrive → Preferences → Account → Choose folders,
   bỏ chọn `Demo`. Đổi lại là file demo không được backup lên cloud.
2. **Sống chung** — không làm gì. Vẫn chạy được, chỉ tốn pin và băng thông.
3. **Chuyển project ra ngoài OneDrive** và chỉ giữ `Scripts/` + `Report.docx`
   trong này. Sạch nhất nếu nhóm đã dùng Git để chia sẻ code.

`node_modules` đã nằm trong `.gitignore`, nhưng OneDrive không đọc file đó.
