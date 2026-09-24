# Demo QLKS — dựng 9 màn hình giao diện với dữ liệu giả

Ngày: 2026-09-24 · Trạng thái: đã duyệt thiết kế, chờ duyệt spec

## 1. Bối cảnh & mục tiêu

Đồ án môn Quản lý thông tin (Nhóm 10) đã có:

- `Scripts/` — 14 bảng, 12 procedure, 3 view, 5 function, 13 trigger, 2 cursor-proc (MySQL 8+)
- `Demo/design/` — 9 artboard màn hình + 1 artboard hệ thống thiết kế, kèm bảng ánh xạ
  *màn hình → thủ tục/view* trong `design/README.md`
- `Demo/src/` — scaffold Next.js 16 + Drizzle + shadcn/ui, mới chỉ có một trang kiểm tra kết nối

**Mục tiêu của giai đoạn này:** biến 9 artboard thành 9 route Next.js chạy được, đúng token màu,
font và bố cục của bản thiết kế, dùng **dữ liệu giả**. Chưa nối MySQL.

**Thành công nghĩa là:** mở `npm run dev`, đi được hết 9 màn hình bằng thanh điều hướng trái,
mỗi màn hình trông đúng như artboard tương ứng, và ba chỗ tương tác (lọc phòng, tính tiền đặt
phòng, đổi số lượng dịch vụ) tính lại số thật khi bấm.

**Không phải mục tiêu:** nối MySQL, gọi stored procedure, phân quyền, lưu dữ liệu.

## 2. Quyết định kiến trúc

### 2.1 Dữ liệu giả nằm sau một mặt tiền

Trang **không bao giờ** import dữ liệu giả trực tiếp. Trang gọi hàm trong `src/lib/queries/`;
hôm nay thân hàm đọc từ `src/lib/mock/`, giai đoạn sau đổi thành Drizzle hoặc `callProcedure()`.

Lý do: giai đoạn sau là nối MySQL. Nếu rải dữ liệu giả trong từng trang thì lúc đó phải viết
lại cả 9 trang; với mặt tiền thì chỉ sửa một thư mục.

Mọi hàm trong `queries/` đều `async` dù hiện tại không chờ gì — để chữ ký hàm không đổi khi
thay bằng truy vấn thật.

### 2.2 Kiểu dữ liệu lấy thẳng từ schema thật

`src/db/schema.ts` được sinh ra từ database bằng `drizzle-kit pull`. Dữ liệu giả được gán kiểu
bằng chính schema đó:

```ts
import type * as schema from "@/db/schema";
type Phong = typeof schema.phong.$inferSelect;
```

Nhờ vậy dữ liệu giả **không thể** lệch tên cột hay kiểu so với bảng thật — TypeScript báo lỗi
ngay. `import type` nên không kéo theo `src/db/index.ts` (file này ném lỗi khi thiếu
`DATABASE_URL`), build vẫn chạy trên máy chưa cấu hình MySQL.

Tiền giữ nguyên dạng `string` đúng như `DECIMAL(18,2)` của MySQL trả về, không đổi sang `number`.

### 2.3 Dữ liệu giả = dữ liệu mẫu thật + phần độn, tách bạch

Dữ liệu mẫu trong `Scripts/02_Sample_Data.sql` chỉ có 10 phòng (mỗi loại đúng một phòng),
10 khách hàng, 10 phiếu đặt rải rác tháng 1 / 4 / 8 năm 2026, và không có phiếu nào nhận phòng
vào 23/09/2026. Nếu dựng UI đúng y dữ liệu đó thì màn Tổng quan và Nhận & trả phòng gần như
trống, không demo được gì.

**Quyết định:** `src/lib/mock/data.ts` chia làm hai phần, đánh dấu rõ bằng chú thích:

1. `-- TU 02_Sample_Data.sql --` — chép nguyên 10 dòng gốc của mỗi bảng, đúng mã, đúng giá trị
2. `-- DON THEM CHO DEMO --` — các dòng bổ sung, **theo đúng lược đồ và quy tắc sinh mã** của
   dữ liệu gốc, để màn hình đủ dày như artboard:
   - phòng `PH00000011`… lấp đầy tầng 1–4 (khoảng 40 phòng), dùng lại 10 `MaLoaiPhong` sẵn có
   - khách hàng `KH00000011`… cho đủ vài chục dòng bảng danh sách
   - phiếu đặt `DP00000011`… có `NgayCheckIn` / `NgayCheckOut` quanh 23/09/2026 để sinh ra các
     lượt nhận / trả trong ngày
   - hóa đơn `HD00000011`… tương ứng

Quy tắc mã giữ nguyên `CHAR(10)`: `PH` / `KH` / `DP` / `HD` / `LP` / `TK` + 8 chữ số.

Mọi con số tổng hợp (công suất, doanh thu, số phiếu chờ xử lý, tỷ lệ quay lại) **tính ra từ dữ
liệu này**, không chép số cứng trên artboard.

Lợi ích của việc tách bạch: đến giai đoạn nối MySQL, phần "độn thêm" chính là bản nháp sẵn có để
bổ sung vào `Scripts/02_Sample_Data.sql` — chỉ việc chuyển thành câu `INSERT`. Giai đoạn này
**không** sửa `Scripts/`.

Lưu ý về cột suy ra: `KHACH_HANG` chỉ có `MaKH, HoTen, CCCD, SDT, Email`. Hai cột "Lần lưu trú"
và "Tổng chi tiêu" trên artboard màn Khách hàng **không phải cột trong bảng** — phải tính từ
`PHIEU_DAT_PHONG` và `HOA_DON`. `queries/customers.ts` trả về kiểu view-model có hai trường đó,
không phải `typeof schema.khachHang.$inferSelect` trần.

### 2.4 "Hôm nay" là một hằng số

Artboard lấy mốc *Thứ Tư, 23/09/2026*. Dữ liệu mẫu cũng xoay quanh mốc đó. Nếu dùng ngày thật
của máy thì mỗi ngày mở lên số liệu lại lệch đi và phiếu đặt sẽ thành quá hạn.

`src/lib/mock/now.ts` xuất một hằng `NGAY_HIEN_TAI = "2026-09-23"`. Mọi tính toán "hôm nay"
đi qua hằng này. Khi nối DB thật thì đổi thành `new Date()`.

## 3. Cấu trúc thư mục

```
src/app/
  layout.tsx                          root: <html>, font, globals.css
  (auth)/login/page.tsx               /login — ngoài shell
  (app)/layout.tsx                    shell: Sidebar 248px + Topbar 76px
  (app)/page.tsx                      /                      Tổng quan
  (app)/rooms/page.tsx                /rooms                 Sơ đồ phòng
  (app)/bookings/new/page.tsx         /bookings/new          Đặt phòng
  (app)/front-desk/page.tsx           /front-desk            Nhận & trả phòng
  (app)/customers/page.tsx            /customers             Khách hàng
  (app)/services/page.tsx             /services              Dịch vụ
  (app)/invoices/[maHoaDon]/page.tsx  /invoices/HD00000001   Hóa đơn
  (app)/reports/page.tsx              /reports               Báo cáo doanh thu
  (app)/db-check/page.tsx             /db-check              trang kiểm tra kết nối (chuyển từ /)

src/lib/
  mock/
    now.ts          NGAY_HIEN_TAI
    data.ts         các mảng dòng thô, kiểu lấy từ schema, giá trị từ 02_Sample_Data.sql
  queries/
    rooms.ts        getSoDoPhong, getThongKePhongTheoTrangThai, getNhatKyBuongPhong
    bookings.ts     getPhieuDatDangHieuLuc, getLoaiPhongConTrong, getPhieuTheoMa
    customers.ts    getDanhSachKhachHang, getThongKeKhachHang
    services.ts     getDanhMucDichVu, getSuDungDichVuTheoPhieu
    invoices.ts     getHoaDon, getChiTietHoaDon
    reports.ts      getDoanhThuTheoThang, getChiSoTongQuan
    accounts.ts     dangNhapGia
  status.ts         TrangThai (phòng, phiếu, hóa đơn) → nhãn tiếng Việt + màu
  format.ts         formatVnd (đã có) + formatNgay, formatNgayGio, formatSo
  nav.ts            danh sách mục điều hướng (nhãn, href, icon)

src/components/
  layout/sidebar.tsx, topbar.tsx, page-header.tsx
  shared/stat-card.tsx, status-badge.tsx, empty-state.tsx
  rooms/room-filter.tsx            "use client"  lọc sơ đồ phòng
  bookings/booking-form.tsx        "use client"  tính tiền đặt phòng
  services/service-usage-form.tsx  "use client"  đổi số lượng dịch vụ
  front-desk/booking-picker.tsx    "use client"  chọn phiếu, đổi khung chi tiết
  customers/customer-table.tsx     "use client"  lọc theo tab + sắp xếp
  reports/period-picker.tsx        "use client"  đổi kỳ báo cáo
  auth/login-form.tsx              "use client"  kiểm tài khoản giả
  ui/                              shadcn — thêm input, label, select, separator, tabs, avatar
```

## 4. Hệ thống thiết kế

### 4.1 Token màu

Thay toàn bộ khối `:root` trong `src/app/globals.css` bằng bảng token trong `design/README.md`
(nền `#F3EFE8`, xanh thương hiệu `#14483F`, sidebar `#13332E`, đồng thau `#C9A227`…).
Không định nghĩa chế độ tối ở giai đoạn này.

### 4.2 Font

Bỏ Geist. Nạp qua `next/font/google`, subset `["latin", "vietnamese"]`:

| Vai trò | Font | Biến CSS |
|---|---|---|
| Hiển thị — tiêu đề trang, số liệu lớn | Playfair Display 500/600/700 | `--font-display` |
| Nội dung — nhãn, đoạn văn, điều khiển | Be Vietnam Pro 400/500/600/700 | `--font-sans` |
| Số & mã — mã khóa, số phòng, ngày giờ, tiền | JetBrains Mono 400/500 | `--font-mono` |

### 4.3 Bố cục

Sidebar 248px cố định · topbar 76px · lề nội dung 28/32px · khoảng cách thẻ 20px ·
đệm trong thẻ 20–22px · bo góc thẻ 14px, nút 10px · dòng bảng 48–60px.

Desktop-first, tối ưu từ 1280px. Nội dung co giãn theo cửa sổ, **không** đóng băng ở đúng 1440px.
Không làm giao diện điện thoại.

### 4.4 Màu trạng thái phòng

`src/lib/status.ts` giữ đúng bảng trong `design/README.md`, khóa theo giá trị của ràng buộc
`CK_PHONG_TrangThai`: `Trong`, `DaDat`, `DangSuDung`, `DangDon`, `BaoTri`.

## 5. Chín màn hình

Mỗi màn hình là Server Component, `await` hàm trong `queries/`. Cột "Tương tác" ghi phần phải
tách ra Client Component.

| # | Route | Khối chính | Tương tác |
|---|---|---|---|
| 1 | `/login` | Cột trái giới thiệu hệ thống; cột phải form đăng nhập (tên đăng nhập, mật khẩu, ghi nhớ) | `login-form.tsx` — kiểm với danh sách tài khoản giả, đúng thì `router.push("/")`, sai thì hiện lỗi |
| 2 | `/` | 4 thẻ chỉ số (công suất, khách lưu trú, doanh thu, nhận/trả); lưới tình trạng phòng + chú giải; bảng "Nhận & trả sắp tới"; danh sách "Cần xử lý hôm nay" | — |
| 3 | `/rooms` | Hàng chip đếm theo trạng thái; bộ lọc tầng + loại phòng; lưới thẻ phòng; bảng nhật ký buồng phòng & sửa chữa | `room-filter.tsx` — lọc theo trạng thái / tầng / loại, đếm lại chip, hiện `empty-state` khi rỗng |
| 4 | `/bookings/new` | 4 bước: (1) khách hàng, (2) thời gian lưu trú, (3) chọn loại phòng & phòng, (4) tạm tính + tiền cọc | `booking-form.tsx` — đổi ngày/số đêm/loại phòng → tính lại số đêm × đơn giá (mô phỏng `fn_SoDem`, `fn_DonGiaPhongTheoNgay`) |
| 5 | `/front-desk` | Hai tab Nhận phòng / Trả phòng; danh sách phiếu bên trái; chi tiết phiếu + gán phòng thực tế bên phải | Chọn phiếu trong danh sách → đổi khung chi tiết (client state) |
| 6 | `/customers` | 4 thẻ chỉ số; tab lọc (Tất cả / Đang lưu trú / Khách quay lại / Còn công nợ); ô sắp xếp; bảng khách hàng | Lọc theo tab + sắp xếp |
| 7 | `/services` | Bảng danh mục dịch vụ; khung ghi nhận sử dụng cho một phiếu đang lưu trú | `service-usage-form.tsx` — đổi số lượng → tính lại thành tiền (mô phỏng `fn_TienDichVu`) |
| 8 | `/invoices/[maHoaDon]` | Đầu trang có trạng thái + nút In / Tải PDF; mẫu hóa đơn: thông tin khách sạn, khách hàng, phiếu đặt, bảng khoản mục theo `LoaiKhoanMuc`, tổng cộng | — |
| 9 | `/reports` | Bộ chọn kỳ (Hôm nay / Tuần / Tháng / 12 tháng) + khoảng ngày + loại phòng; 4 thẻ chỉ số; biểu đồ cột doanh thu theo tháng; bảng cơ cấu doanh thu | Đổi kỳ → đổi số liệu |

Mã hiển thị trên giao diện dùng đúng dạng của dữ liệu thật (`DP00000011`, `PH00000023`,
`HD00000015`), không dùng dạng rút gọn `DP0142` như artboard vẽ minh hoạ.

Biểu đồ cột ở màn 9 vẽ bằng `div` + CSS thuần theo đúng artboard, không thêm thư viện biểu đồ.
Ba màu `--chart-1/2/3` dùng đúng thứ tự cố định: tiền phòng, dịch vụ, phụ thu.

## 6. Đăng nhập

`queries/accounts.ts` giữ danh sách tài khoản giả đúng như `02_Sample_Data.sql`
(`admin`/`Admin@123`, `letan.lan`/`LeTan@123`, `letan.huy`/`LeTan@456`…), so sánh mật khẩu
**dạng thô** — đây là dữ liệu giả, chưa có SHA2, chưa có phiên.

Route **chưa bị chặn**: mở thẳng `/` vẫn vào được mà không cần đăng nhập. Sidebar hiển thị
nhân viên cố định *Trần Lệ Thu · Lễ tân · TK0007* đúng như artboard.

## 7. Quy ước mã nguồn

- Chữ hiển thị trên giao diện: **tiếng Việt có dấu**, đúng câu chữ trong artboard.
- Chú thích trong code: **tiếng Việt không dấu**, theo đúng lối đang dùng trong `src/db/`,
  `src/lib/db-check.ts` và `drizzle.config.ts`.
- Không sửa `src/db/schema.ts` (file sinh tự động) và không đụng `Scripts/`.

## 8. Xác minh

Dự án chưa có framework test, và giai đoạn này là giao diện tĩnh với dữ liệu cố định — lập trình
viên sẽ kiểm bằng:

1. `npm run lint` — không lỗi
2. `npm run build` — không lỗi
3. Mở lần lượt 9 route trong trình duyệt, đối chiếu với artboard tương ứng: bố cục, màu, font,
   nội dung chữ
4. Bấm thử ba chỗ tương tác, xác nhận số tính lại đúng
5. Đi hết 9 mục trên sidebar, xác nhận không có link chết

## 9. Ngoài phạm vi (giai đoạn sau)

- Nạp `Scripts/03a`–`03e` vào MySQL (hiện database đang thiếu toàn bộ view / function /
  trigger / procedure)
- Thay thân hàm `queries/` bằng Drizzle và `callProcedure()`
- Phiên đăng nhập thật qua `sp_DangNhap`, chặn route, phân quyền theo `LOAI_TAI_KHOAN`
- Giao diện điện thoại, chế độ tối
- In hóa đơn ra PDF thật, xuất Excel báo cáo

## 10. Chỗ còn để trống, cần nhóm điền

Giữ nguyên như `design/README.md` đã đánh dấu:

- Tên khách sạn — **"Sen Vàng" chỉ là tên tạm**
- Địa chỉ, số điện thoại, mã số thuế trên mẫu hóa đơn — để `[…]`
- Diện tích / số giường từng loại phòng — chưa có cột tương ứng trong `LOAI_PHONG`
