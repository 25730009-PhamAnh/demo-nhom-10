# Demo — Quản lý khách sạn

Project demo cho đồ án môn Quản lý thông tin (Nhóm 10).
Stack: **Next.js 16** (App Router) · **Drizzle ORM** · **shadcn/ui** · **MySQL**.

Hiện tại project mới chỉ là **khung**: đã nối được tới database `QuanLyKhachSan`
và có một trang kiểm tra kết nối. Chưa có màn hình nghiệp vụ nào.

---

## Chạy lần đầu

Cần có Node.js 20+ và MySQL đang chạy với database `QuanLyKhachSan`.

```bash
cd Demo
npm install
cp .env.example .env.local   # rồi sửa user/password cho đúng máy bạn
npm run dev
```

Mở http://localhost:3000 — nếu thấy danh sách phòng và số dòng của 14 bảng
thì kết nối đã thông.

### Nếu chưa có database

Chạy script của nhóm theo thứ tự, từ thư mục `Đồ án/`:

```bash
mysql -u root -p < Scripts/01_Create_Database.sql
mysql -u root -p QuanLyKhachSan < Scripts/02_Sample_Data.sql
```

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
- **Ghi** (nhận phòng, ghi dịch vụ, lập hóa đơn, thanh toán): gọi stored
  procedure qua `callProcedure()` trong `src/db/procedures.ts`, để trigger và
  ràng buộc ở tầng CSDL còn hiệu lực — đó là phần chính của Chương 4.

```ts
// Mẫu, chưa dùng ở đâu:
await callProcedure("sp_NhanPhong", [maDatPhong, maPhong, maTk]);
```

---

## Cấu trúc

```
Demo/
├── drizzle.config.ts       # cấu hình introspect, trỏ vào QuanLyKhachSan
├── .env.local              # DATABASE_URL (KHÔNG commit)
├── .env.example            # mẫu cho cả nhóm
└── src/
    ├── db/
    │   ├── schema.ts       # sinh ra bởi db:pull
    │   ├── relations.ts    # sinh ra bởi db:pull
    │   ├── index.ts        # connection pool + export db
    │   └── procedures.ts   # helper gọi CALL sp_*
    ├── lib/
    │   ├── db-check.ts     # query cho trang kiểm tra kết nối
    │   └── format.ts       # format tiền VND
    ├── components/ui/      # shadcn: button, card, table, badge
    └── app/page.tsx        # trang kiểm tra kết nối
```

## Lệnh

| Lệnh | Việc |
|------|------|
| `npm run dev` | Chạy dev server ở cổng 3000 |
| `npm run build` | Build production, có type-check |
| `npm run lint` | ESLint |
| `npm run db:pull` | Introspect lại schema từ MySQL |
| `npm run db:studio` | Mở Drizzle Studio để xem dữ liệu |

---

## Việc chưa làm

- Nạp stored procedure / function / trigger vào database. Hiện các script nằm
  rời ở `../Scripts/Viet's task/` và `../Scripts/Vu Anh's task/`, và **có trùng
  tên giữa hai thư mục** (`sp_LapHoaDon`, `sp_GhiNhanDichVu`, `fn_TienPhong`,
  `trg_SDDV_TinhThanhTien`…). Phải chốt bản nào dùng trước khi nạp.
- Dropdown chọn vai trò (lấy từ bảng `TAI_KHOAN`) để gán `MaTK` cho các phiếu.
- Các màn hình nghiệp vụ: sơ đồ phòng, đặt phòng, check-in/out, dịch vụ, hóa đơn.

---

## Lưu ý: OneDrive và `node_modules`

Thư mục này nằm trong OneDrive, nên OneDrive sẽ cố sync `node_modules`
(khoảng 30.000 file). Hệ quả: OneDrive chạy nền liên tục, và build có thể chậm.

Cách xử lý, chọn một:

1. **Loại trừ khỏi sync** — OneDrive → Preferences → Account → Choose folders,
   bỏ chọn `Demo`. Đổi lại là file demo không được backup lên cloud.
2. **Sống chung** — không làm gì. Vẫn chạy được, chỉ tốn pin và băng thông.
3. **Chuyển project ra ngoài OneDrive** và chỉ giữ `Scripts/` + `Report.docx`
   trong này. Sạch nhất nếu nhóm đã dùng Git để chia sẻ code.

`node_modules` đã nằm trong `.gitignore`, nhưng OneDrive không đọc file đó.
