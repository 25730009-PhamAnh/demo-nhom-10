# Nối CSDL — Phase 1: 9 màn hình đọc từ MySQL

Ngày: 2026-09-26 · Trạng thái: đã duyệt spec (26/09/2026)
Phase tiếp theo: `2026-09-26-noi-csdl-phase-2-ghi-design.md`, `2026-09-26-noi-csdl-phase-3-dang-nhap-design.md`

## 1. Bối cảnh & mục tiêu

Hiện trạng (khảo sát ngày 26/09/2026):

- `Demo/` — 9 màn hình đọc dữ liệu qua mặt tiền `src/lib/queries/` (7 file). Thân hàm đọc
  `src/lib/mock/`; chữ ký được thiết kế sẵn để thay thân mà trang và component không đổi
  (spec `2026-09-24-demo-ui-mock-design.md` §2.1). `callProcedure()` có nhưng chưa dùng.
- `Scripts/setup_database/01`–`08` — bộ script mới của nhóm (14 bảng, 5 hàm, 3 view,
  13 trigger, 17 thủ tục gồm 5 báo cáo, role). `Scripts/` nằm ở thư mục OneDrive "Đồ án",
  **không** nằm cạnh `Demo/` (Demo ở `~/PA/UIT/Demo`).
- DB local `QuanLyKhachSan` **chưa theo kịp script**: chỉ có 14 bảng + 5 `sp_BaoCao*`.
- `07_Sample_Data.sql` có 10 dòng mỗi bảng, ngày cố định quanh mốc 16/09/2026. Hôm nay
  không có ai nhận / trả phòng, nên màn Tổng quan và Nhận & trả phòng sẽ trống.

**Mục tiêu:** 9 màn hình hiện dữ liệu thật từ MySQL; xóa hẳn `src/lib/mock/`.

**Thành công nghĩa là:**

1. `npm run dev`, mở vào ngày bất kỳ: màn Tổng quan có 12 lượt nhận và 9 lượt trả hôm nay,
   doanh thu hôm nay khác 0; Báo cáo có số liệu đủ 12 tháng.
2. `grep -r "lib/mock" src` không còn kết quả; thư mục `src/lib/mock/` không còn.
3. `npm test` xanh trên DB test; `npm run lint` và `npm run build` không lỗi.
4. Trong output của `npm run build`, mọi route của `(app)` là **ƒ (Dynamic)**.

**Không phải mục tiêu:** thao tác ghi (phase 2), phiên đăng nhập và phân quyền (phase 3).

## 2. Quyết định kiến trúc

### 2.1 "Hôm nay" lấy từ CSDL

Bỏ hằng `NGAY_HIEN_TAI` (`src/lib/mock/now.ts`). Thêm `getNgayHienTai()` trong
`src/lib/queries/ngay.ts`, trả `SELECT CURDATE()` dạng `'YYYY-MM-DD'`.

Lý do: `sp_DatPhong`, `sp_XacNhanDatCoc` và `v_TinhTrangPhongHomNay` so với `CURDATE()`.
Nếu app tự tính ngày thì app và CSDL có thể lệch nhau (múi giờ, hoặc ngày bị đóng băng
khi test — §2.5). Mọi truy vấn "hôm nay" viết thẳng `CURDATE()` trong SQL; trang chỉ gọi
`getNgayHienTai()` để hiển thị.

5 trang đang import `NGAY_HIEN_TAI` (Tổng quan, Nhận & trả phòng, Đặt phòng, Báo cáo, Sơ đồ
phòng) chuyển sang `await getNgayHienTai()`. Chuỗi "Cập nhật 10:42" viết cứng trên Sơ đồ
phòng đổi thành giờ `NOW()` của CSDL.

### 2.2 Mặt tiền giữ nguyên chữ ký

Mọi hàm trong `src/lib/queries/` giữ tên, tham số và kiểu trả về. Hợp đồng dữ liệu không đổi:

- Tiền là **chuỗi** 2 chữ số thập phân, đúng như `DECIMAL(18,2)` (`"0.00"`, không phải `"0"`).
- Ngày là chuỗi `'YYYY-MM-DD'`, ngày giờ là `'YYYY-MM-DD HH:MM:SS'`. Cột Drizzle đã khai
  `mode: 'string'`; riêng kết quả `CALL` và truy vấn viết bằng template `sql` thì pool bật
  `dateStrings: true`.

Quy ước đọc / ghi giữ như `src/db/procedures.ts`: đọc dùng Drizzle; những chỗ CSDL đã có
thủ tục đọc chuyên trách thì gọi thủ tục (tra phòng trống, báo cáo).

### 2.3 Nguồn dữ liệu của từng hàm

| Hàm | Nguồn |
|---|---|
| `rooms.getSoDoPhong` | `PHONG` ⋈ `LOAI_PHONG`, sắp theo `SoPhong` |
| `rooms.getThongKePhongTheoTrangThai` | `GROUP BY PHONG.TrangThai`; vẫn duyệt theo `TRANG_THAI_PHONG` để trạng thái 0 phòng có dòng |
| `rooms.getNhatKyBuongPhong` | `DON_PHONG` ∪ `SUA_PHONG` ⋈ `PHONG`, mới nhất trước |
| `bookings.getPhieuNhanHomNay` | phiếu `DaDat`, `NgayCheckIn = CURDATE()` ⋈ khách, chi tiết, phòng, loại |
| `bookings.getPhieuTraHomNay` | phiếu `DangO`, `NgayCheckOut = CURDATE()` |
| `bookings.getPhieuTheoMa` | theo mã; không có thì `null` |
| `bookings.getPhieuDangO` *(mới)* | mọi phiếu `DangO` — cho màn Dịch vụ (§2.6) |
| `bookings.getLoaiPhongConTrong` | `CALL sp_TraCuuPhongTrong(in, out, NULL)` gom theo loại; `LOAI_PHONG` làm gốc để loại hết phòng vẫn có dòng `soPhongTrong = 0` |
| `bookings.traCuuPhongTrongAnToan` | như trên; `SIGNAL 45000` → `{ ok: false, loi }` với thông báo của CSDL |
| `customers.getDanhSachKhachHang` | `KHACH_HANG` làm gốc. Số lần lưu trú = phiếu `DangO` / `HoanTat`. Chi tiêu = cùng quy tắc với `sp_BaoCaoKhachHang`: hóa đơn `DaThanhToan`, cộng `TienPhong + DichVu + PhuThu + GiamGia`, **không** cộng `GiamTru` |
| `customers.getThongKeKhachHang` | như hiện nay, tính trên CSDL; "khách mới tháng này" = phiếu đầu tiên rơi vào tháng của `CURDATE()` |
| `invoices.getHoaDon`, `getDanhSachHoaDon` | `HOA_DON` ⋈ phiếu, khách, chi tiết, phòng, loại, `CHI_TIET_HOA_DON` |
| `services.getDanhMucDichVu`, `getSuDungDichVuTheoPhieu` | `DICH_VU`; `SU_DUNG_DICH_VU` ⋈ `DICH_VU` |
| `reports.getDoanhThuTheoThang` | `CALL sp_BaoCaoDoanhThu(<ngày 1 của tháng cách đây 11 tháng>, CURDATE())`; TS lấp tháng không có hóa đơn bằng `"0.00"` để luôn đủ 12 cột |
| `reports.getChiSoTongQuan` | công suất = phòng `DangSuDung` / tổng phòng; khách lưu trú = số `MaKH` khác nhau có phiếu `DangO`; doanh thu và số hóa đơn hôm nay = `CALL sp_BaoCaoDoanhThu(CURDATE(), CURDATE())` |
| `accounts.dangNhapGia` → `dangNhap` | `CALL sp_DangNhap(ten, matKhau)` (§2.7) |
| `accounts.NHAN_VIEN_MAC_DINH` → `getNhanVienMacDinh()` | dòng `TAI_KHOAN` của `letan.lan` ⋈ `LOAI_TAI_KHOAN` |

### 2.4 Trang render động

Không có `cacheComponents` (`next.config.ts` trống), nên trang nào không gọi API động sẽ bị
prerender lúc `next build` — dữ liệu CSDL bị đóng băng tại thời điểm build. Mọi route trong
`(app)` phải render theo từng request. Cách làm cụ thể chọn khi viết plan, theo
`node_modules/next/dist/docs/` (ưu tiên `connection()` của `next/server`); tiêu chí kiểm là
mục 4 của §1.

### 2.5 DB test riêng, ngày đóng băng

- `scripts/db-test-setup.sh` (trong `Demo/`) dựng `QuanLyKhachSan_test` bằng cách chạy
  `01`→`07` qua `mysql` CLI (script có `DELIMITER` nên không nạp được bằng `mysql2`), thay
  `QuanLyKhachSan` → `QuanLyKhachSan_test` bằng `sed` trên luồng đầu vào. File gốc không bị
  sửa. Đường dẫn thư mục script đọc từ biến `QLKS_SCRIPTS_DIR` trong `.env.local`.
- Phiên nạp `07` được đặt `SET timestamp = UNIX_TIMESTAMP('2026-09-23 10:00:00')`, nên dữ
  liệu mẫu (viết theo `CURDATE()`, §3) luôn ra đúng một bộ.
- Vitest `globalSetup` gọi script này một lần mỗi lần `npm test`, và trỏ `DATABASE_URL`
  của tiến trình test sang `DATABASE_URL_TEST`.
- Pool của test đọc thêm biến `DB_NGAY_CO_DINH`; có biến này thì mỗi connection mới chạy
  `SET timestamp` về đúng ngày đó. Không có biến (dev, production) thì không làm gì.
- Vitest alias `server-only` sang một module rỗng, để test import được `src/db/`.
- Đã kiểm: `SET timestamp` đóng băng `CURDATE()` / `NOW()` / `CURRENT_TIMESTAMP()` theo phiên;
  script không dùng `SYSDATE()`.

DB dev `QuanLyKhachSan` không bao giờ bị test đụng tới.

### 2.6 Hai lỗi dữ liệu sửa luôn

1. **Báo cáo trừ tiền cọc vào doanh thu.** `getDoanhThuTheoThang` đang cộng mọi khoản âm,
   gồm cả `GiamTru` (tiền cọc bù trừ, không phải giảm doanh thu). Chuyển sang
   `sp_BaoCaoDoanhThu` là hết lỗi. Kiểu trả về đổi `giamTru` → `giamGia`; `period-picker.tsx`
   đổi thẻ "Giảm trừ & giảm giá" → "Giảm giá" (phụ đề "Khoản mục GiamGia"), cột bảng
   "Giảm trừ" → "Giảm giá", chú thích biểu đồ "Chiều cao cột = doanh thu thuần".
2. **Màn Dịch vụ liệt kê phiếu trả hôm nay** (`getPhieuTraHomNay`) thay vì mọi phiếu đang ở.
   Đổi sang `getPhieuDangO`.

### 2.7 Đăng nhập chạy trên server

`login-form.tsx` đang gọi `dangNhapGia` ở client (được vì là dữ liệu giả). Chuyển thành
Server Action `src/app/(auth)/login/actions.ts` gọi `sp_DangNhap`. Thành công thì client
chuyển về `/` như hiện nay; **chưa** tạo phiên (phase 3).

Thông báo lỗi đi qua một hàm dùng chung `thongBaoCsdl(err)` trong `src/db/loi.ts`. Với
`errno 1644` (`SIGNAL SQLSTATE '45000'`), hàm trả `"CSDL từ chối: " + MESSAGE_TEXT` nguyên
văn, bỏ tiền tố `"Loi: "` nếu có. Lỗi khác thì ném tiếp. Phase 2 và 3 mở rộng hàm này.

### 2.8 Schema

Sau khi cài lại DB, chạy `npm run db:pull`. Nếu `schema.ts` thay đổi (ví dụ thêm view) thì
nhận nguyên, không sửa tay.

## 3. Viết lại `Scripts/setup_database/07_Sample_Data.sql`

Nhóm đã đồng ý sửa script để phục vụ demo. Nhóm vẫn đang sửa thư mục `Scripts/` song song,
nên lúc triển khai phải đọc lại file ngay trước khi sửa.

**Mốc ngày:**

- 10 dòng gốc giữ nguyên ngày đang viết trong file, cộng thêm
  `@Lech = DATEDIFF(CURDATE(), '2026-09-16')`, ví dụ `'2026-01-10' + INTERVAL @Lech DAY`.
  16/09/2026 là mốc chính `07` ghi ("Trang thai xac dinh tai moc ngay 16/09/2026"), nên ngày
  nào chạy thì quan hệ giữa các dòng gốc với hôm nay cũng như lúc nhóm thiết kế.
- Phần độn viết thẳng theo `@HomNay = CURDATE()`.
- Mọi cột ngày đều dịch, kể cả `BANG_GIA_PHONG.ApDungTuNgay / DenNgay`.

**Phần độn** (chuyển quy tắc sinh của `src/lib/mock/data.ts`):

| Bảng | Nội dung |
|---|---|
| `KHACH_HANG` | KH00000011–KH00000060, tên ghép từ ba mảng họ / đệm / tên như mock |
| `PHONG` | PH00000011–PH00000042, tầng 1–4, số `x03`–`x10`, loại xoay vòng LP01–LP10 → tổng 42 phòng |
| `PHIEU_DAT_PHONG` + `CHI_TIET_DAT_PHONG` | nhóm 1: 12 phiếu `DaDat` nhận hôm nay (PH11–22) · nhóm 2: 9 phiếu `DangO` trả hôm nay (PH23–31) · nhóm 3: 9 phiếu `HoanTat` đã trả và thanh toán hôm nay (PH32–40) · nhóm 4: 48 phiếu `HoanTat` lịch sử, **mỗi tuần một phiếu lùi dần từ hôm nay**, không trùng khoảng ngày với phiếu khác trên cùng phòng (khác mock: mock dùng tháng cố định, chạy đầu tháng sẽ sinh phiếu `HoanTat` ở tương lai) |
| `SU_DUNG_DICH_VU` | mỗi phiếu `DangO` / `HoanTat` một dòng, như mock |
| `HOA_DON` + `CHI_TIET_HOA_DON` | mỗi phiếu `DangO` / `HoanTat` một hóa đơn: `TienPhong`, `DichVu`, `GiamTru = −TienCoc`. `DangO` → `ChuaThanhToan`, `HoanTat` → `DaThanhToan`. `NgayLap` = ngày trả phòng 11:00 |
| `DON_PHONG`, `SUA_PHONG` | vài dòng hôm qua và hôm nay để nhật ký buồng phòng có dữ liệu |

**Trạng thái phòng suy ra từ phiếu**, không dùng chu kỳ cố định của mock: phòng của nhóm 1 →
`DaDat` (đúng như `sp_DatPhong` để lại), nhóm 2 → `DangSuDung`, nhóm 3 → `DangDon`, còn lại
→ `Trong`. Có vậy các nút ở phase 2 mới chạy được trên dữ liệu mẫu.

**Cách viết:** `INSERT … SELECT` từ CTE đệ quy (`WITH RECURSIVE`), không tạo thủ tục tạm, để
file vẫn là SQL thuần và đi qua trigger thật như 10 dòng gốc. Mã giữ `CHAR(10)`: tiền tố +
số đệm 0.

**Thứ tự nạp:** phiếu → chi tiết phiếu → dịch vụ → hóa đơn → chi tiết hóa đơn.
`trg_SDDV_TinhThanhTien` chặn ghi dịch vụ khi hóa đơn đã thanh toán, nên dịch vụ phải vào
trước hóa đơn.

**Khối Kiểm tra:** khối cuối `07` và khối báo cáo cuối `06` ghi lại số mong đợi, kèm câu "khi
chạy `07` với `SET timestamp = UNIX_TIMESTAMP('2026-09-23 10:00:00')`".

## 4. Cài lại DB local

Chạy `01`→`07` vào `QuanLyKhachSan`. `01` có `DROP DATABASE` — **hỏi người dùng trước khi
chạy**. Chưa chạy `08` (phase 3).

## 5. Thay đổi theo file

| File | Việc |
|---|---|
| `Scripts/setup_database/07_Sample_Data.sql` | viết lại theo §3 |
| `Scripts/setup_database/06_Procedures.sql` | cập nhật số mong đợi trong khối Kiểm tra báo cáo |
| `scripts/db-test-setup.sh` *(mới)* | §2.5 |
| `vitest.config.mts` | `globalSetup`, alias `server-only`, biến môi trường test |
| `.env.example` | thêm `QLKS_SCRIPTS_DIR`, `DATABASE_URL_TEST`, `DB_NGAY_CO_DINH` (có chú thích) |
| `src/db/index.ts` | `dateStrings: true`; `SET timestamp` khi có `DB_NGAY_CO_DINH` |
| `src/db/loi.ts` *(mới)* | `thongBaoCsdl(err)` |
| `src/lib/queries/*.ts` | thay thân hàm theo §2.3; thêm `ngay.ts` |
| `src/app/(app)/**/page.tsx`, `layout.tsx` | `getNgayHienTai()`, `getNhanVienMacDinh()`, render động |
| `src/app/(auth)/login/actions.ts` *(mới)*, `src/components/auth/login-form.tsx` | §2.7 |
| `src/components/reports/period-picker.tsx` | `giamTru` → `giamGia` và nhãn (§2.6) |
| `src/app/(app)/services/page.tsx` | `getPhieuDangO` |
| `src/lib/mock/` | xóa cả thư mục, kể cả `data.test.ts` |

`src/lib/tinh-toan.ts` giữ nguyên: form đặt phòng vẫn dùng để tạm tính ở client.

## 6. Xử lý lỗi

- Không kết nối được CSDL: để lỗi nổi lên `error.tsx` mặc định của Next. Phase này không
  thêm màn lỗi riêng.
- `SIGNAL 45000` ở những chỗ đọc có thể gặp (tra phòng trống sai ngày, đăng nhập sai): trả
  `{ ok: false, loi }` với thông báo của CSDL, không làm vỡ trang.

## 7. Kiểm thử

- Test tích hợp trên `QuanLyKhachSan_test`, ngày đóng băng 23/09/2026 10:00.
- Các file `src/lib/queries/*.test.ts` giữ ý đồ từng ca đang có (lọc đúng trạng thái, gom
  đúng bảng, trạng thái 0 phòng vẫn có dòng…) nhưng số kỳ vọng tính lại theo dữ liệu mới.
- Thêm test cho `getNgayHienTai` (ra `'2026-09-23'` dưới ngày đóng băng) và cho doanh thu
  **không** trừ `GiamTru`.
- 21 ca kiểm 5 thủ tục báo cáo (viết lúc thêm báo cáo, hiện nằm ngoài repo) chuyển vào
  `reports.test.ts` với số mới.
- Kiểm tay: mở 9 route trên trình duyệt, đối chiếu số trên màn hình với truy vấn SQL tương ứng.

## 8. Rủi ro

- Dữ liệu độn có thể vướng trigger / CHECK chưa lường trước (ví dụ `CK_…SoTienTheoLoai`,
  chống trùng phòng). Xử lý: nạp thử vào DB test trước; lỗi nào thì sửa dữ liệu, không sửa
  trigger.
- `Report.docx` có thể đang in bảng dữ liệu mẫu 10 dòng. Nếu có, nhóm phải tự cập nhật; spec
  này không đụng báo cáo.

## 9. Ngoài phạm vi

- Mọi thao tác ghi → phase 2.
- Phiên đăng nhập, `proxy.ts`, tài khoản MySQL theo vai trò → phase 3.
