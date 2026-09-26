# Nối CSDL — Phase 2: các nút ghi gọi thủ tục thật

Ngày: 2026-09-26 · Trạng thái: đã duyệt spec (26/09/2026)
Cần xong trước: `2026-09-26-noi-csdl-phase-1-doc-design.md`
Phase sau: `2026-09-26-noi-csdl-phase-3-dang-nhap-design.md`

## 1. Mục tiêu

Sau phase 1, 9 màn hình đọc CSDL thật nhưng mọi nút ghi vẫn chỉ để trang trí. Phase này nối
từng nút vào đúng thủ tục trong `Scripts/setup_database/06_Procedures.sql`. Hết phase,
**12/12 thủ tục của Bảng 4.1 đều gọi được từ giao diện** (`sp_DangNhap` và
`sp_TraCuuPhongTrong` đã nối ở phase 1).

**Thành công nghĩa là:**

1. Trên DB dev, đi trọn một vòng bằng giao diện: đặt phòng nhận hôm nay → thu thêm cọc →
   nhận phòng → ghi dịch vụ → lập hóa đơn → thanh toán → trả phòng → ghi nhận dọn phòng.
   Sau mỗi bước, số liệu ở các màn khác (Tổng quan, Sơ đồ phòng, Hóa đơn) đổi theo.
2. Làm sai thứ tự, ví dụ trả phòng khi hóa đơn chưa thanh toán: dưới nút hiện thông báo của
   CSDL, trang không vỡ, dữ liệu không đổi.
3. `npm test`, `npm run lint`, `npm run build` không lỗi.

**Không phải mục tiêu:** phiên đăng nhập, người thao tác thật, phân quyền (phase 3); thêm
khách hàng mới (không có thủ tục tương ứng; form đặt phòng chọn khách có sẵn).

## 2. Nút → thủ tục

| Màn hình | Thao tác | Thủ tục |
|---|---|---|
| Đặt phòng | Xác nhận đặt phòng | `sp_TraCuuPhongTrong(in, out, maLoai)` lấy phòng trống đầu tiên, rồi `sp_DatPhong(maKh, maTk, in, out, maPhong, tienCoc, @dp)` |
| Nhận & trả phòng — tab Nhận | Xác nhận nhận phòng | `sp_NhanPhong(ma, maTk)` |
| | Thu thêm cọc (ô số tiền + nút, trong khung chi tiết) | `sp_XacNhanDatCoc(ma, soTien)` |
| | Hủy phiếu (hộp xác nhận của trình duyệt) | `sp_HuyPhieuDat(ma)` |
| Nhận & trả phòng — tab Trả | Lập hóa đơn | `sp_LapHoaDon(ma, @hd)` rồi chuyển sang `/invoices/[hd]` |
| | Xác nhận trả phòng | `sp_TraPhong(ma)` |
| Chi tiết hóa đơn | Thanh toán (chọn Tiền mặt / Chuyển khoản / Thẻ) | `sp_ThanhToanHoaDon(hd, loai)` |
| Dịch vụ | Ghi nhận | `sp_GhiNhanDichVu(ma, maDv, soLuong, NULL, @sd)` |
| Sơ đồ phòng — thẻ Nhật ký | Ghi nhận dọn phòng | `sp_GhiNhanDonPhong(maPhong, maTk, ghiChu)` |
| | Ghi nhận sửa chữa | `sp_GhiNhanSuaPhong(maPhong, maTk, chiPhi, moTa)` |

**Luồng trả phòng** đi đúng thứ tự thủ tục bắt buộc: lập hóa đơn → thanh toán → trả phòng.
Khung chi tiết phiếu ở tab Trả hiện trạng thái hóa đơn của phiếu — *chưa lập* / *chưa thanh
toán* / *đã thanh toán* — để lễ tân biết đang ở bước nào. `PhieuTomTat` thêm trường
`hoaDon: { maHoaDon: string; trangThai: string } | null` (chỉ thêm, không đổi trường cũ).

**Tiền cọc khi đặt phòng** tính lại trên server bằng `LOAI_PHONG.DonGiaNgay` của loại đã chọn
(đúng con số form đang hiển thị); không tin số client gửi lên.
*Cập nhật khi lập plan (26/09/2026):* từ phase 1, form hiện đơn giá mà `sp_DatPhong` sẽ chốt
(trung bình `BANG_GIA_PHONG` từng đêm, lùi về `DonGiaNgay`), nên tiền cọc lấy đúng số đó từ
`getLoaiPhongConTrong` — vẫn là "con số form đang hiển thị".

**Tab Trả liệt kê mọi phiếu `DangO`** *(bổ sung khi lập plan)*, phiếu đến hạn hôm nay lên trước.
`sp_TraPhong` cho trả sớm. Nếu tab Trả chỉ có phiếu trả hôm nay thì phiếu vừa nhận phòng (sớm nhất
trả ngày mai) không đi tiếp được tới lập hóa đơn / trả phòng, và vòng ở mục 1 không làm được trên
giao diện. Topbar vẫn đếm lượt trả hôm nay.

## 3. Quyết định kiến trúc

### 3.1 Hai tầng: thao tác và Server Action

- `src/lib/thao-tac/*.ts` *(mới, song song với `queries/`)*: mỗi hàm gọi một thủ tục và trả
  `KetQua<T> = { ok: true; data: T } | { ok: false; loi: string }`. Đây là tầng được test.
- `actions.ts` cạnh từng route (theo mẫu `bookings/new/actions.ts` đang có): `"use server"`,
  kiểm kiểu và định dạng đầu vào, gọi hàm thao tác, thành công thì `refresh()` (từ
  `next/cache`) để trang đọc lại CSDL, hoặc `redirect()` với "Lập hóa đơn".

Tách tầng vì `refresh()` / `redirect()` chỉ chạy được trong request của Next, nên test gọi
thẳng tầng thao tác.

**Không lặp quy tắc nghiệp vụ ở app.** Server Action chỉ kiểm kiểu và định dạng: mã đúng
`CHAR(10)`, số lượng là số nguyên dương, tiền là số không âm, ngày đúng `YYYY-MM-DD`. Còn
trạng thái phiếu, phòng có sẵn sàng không, hóa đơn đã thanh toán chưa… để thủ tục và trigger
quyết định.

### 3.2 `callProcedure` hỗ trợ tham số OUT

Biến `@out` sống theo connection, nên phải `CALL` và `SELECT` trên cùng một connection:
`pool.getConnection()` → `CALL sp(?, …, @o1)` → `SELECT @o1` → `release()`. Chữ ký mới
trả `{ rows, out }`; chỗ gọi hiện có (chỉ đọc result set) giữ được bằng một hàm bọc.

### 3.3 Thông báo lỗi

Dùng `thongBaoCsdl(err)` (`src/db/loi.ts`, tạo ở phase 1):

- `errno 1644` (`SIGNAL SQLSTATE '45000'`) → `"CSDL từ chối: " + MESSAGE_TEXT` — đã có từ
  phase 1. Người xem thấy rõ quy tắc nằm ở tầng CSDL.
- **Thêm ở phase này:** lỗi khác không còn ném tiếp mà thành `"Lỗi CSDL (<errno>): <message>"`,
  đồng thời ghi `console.error` trên server, để một nút bấm lỗi không làm vỡ cả trang.
  Lỗi `fatal` không có `errno` (connection bị ngắt giữa chừng) cũng vào nhánh này, mã hiện là
  "mất kết nối". Lỗi không đến từ CSDL (lỗi lập trình) vẫn ném tiếp.

Thông báo hiện ngay dưới nút vừa bấm. Nút bị khóa trong lúc chờ (`useTransition` /
`useActionState`).

### 3.4 Người thao tác

Tham số `MaTK` của `sp_DatPhong`, `sp_NhanPhong`, `sp_GhiNhanDonPhong`,
`sp_GhiNhanSuaPhong` tạm lấy từ `getNhanVienMacDinh()` (`letan.lan`, phase 1). Phase 3 thay
bằng tài khoản trong phiên.

### 3.5 Giao diện

- Theo token và bố cục đang có; không thêm thư viện. Hai form dọn / sửa phòng mở gọn ngay
  trong thẻ "Nhật ký buồng phòng & sửa chữa" (dòng "Ghi nhận dọn phòng" đang là `<span>` sẽ
  thành nút).
- Chi tiết hóa đơn: phần thanh toán chỉ hiện khi hóa đơn `ChuaThanhToan`. Đã thanh toán thì
  hiện đường dẫn "Về Nhận & trả phòng".
- Bỏ các dòng "… chưa được nối với CSDL" mà phase 1 để lại thay cho "Bản demo dùng dữ liệu giả"
  (`booking-picker.tsx`, `booking-form.tsx`, trang Đặt phòng, chi tiết hóa đơn,
  `service-usage-form.tsx`).

## 4. Sửa thủ tục (lỗi tìm thấy khi khảo sát)

| Thủ tục | Lỗi | Sửa |
|---|---|---|
| `sp_NhanPhong` | Đòi mọi phòng của phiếu phải `'Trong'`, nhưng `sp_DatPhong` (bước 3f) đã chuyển phòng sang `'DaDat'` → **không phiếu nào đặt qua `sp_DatPhong` nhận phòng được** | Chấp nhận `TrangThai IN ('Trong', 'DaDat')`. An toàn vì `trg_CTDP_ChongTrungPhong` bảo đảm không có phiếu hiệu lực khác trùng khoảng ngày |
| `sp_GhiNhanDonPhong` | Luôn đưa phòng về `'Trong'`, kể cả phòng đang có khách (`DangSuDung`) hoặc đang giữ cho khách (`DaDat`) | Chỉ đổi sang `'Trong'` khi phòng đang `DangDon` hoặc `BaoTri`; trạng thái khác giữ nguyên, vẫn ghi nhật ký |
| `sp_GhiNhanDichVu` | Chú thích ghi "hóa đơn nháp đã có thì gọi lại `sp_LapHoaDon`" nhưng thân thủ tục không làm → ghi dịch vụ sau khi lập hóa đơn thì `sp_ThanhToanHoaDon` từ chối vì hóa đơn lệch `fn_TienDichVu` | Hóa đơn `ChuaThanhToan` đã có: trong cùng giao dịch, xóa các dòng tự sinh rồi gọi `sp_LapChiTietHoaDon` (cách `sp_LapHoaDon` lập lại). Không `CALL sp_LapHoaDon` vì thủ tục đó tự mở giao dịch và trả thêm hai result set |
| `sp_HuyPhieuDat` | Hủy phiếu nhưng hóa đơn nháp của phiếu (lập từ lúc `DaDat`) vẫn `ChuaThanhToan` → Tổng quan vẫn đếm nó là hóa đơn chờ xử lý | Hóa đơn `ChuaThanhToan` của phiếu chuyển sang `DaHuy` trong cùng giao dịch |

*Hai dòng cuối bổ sung khi lập plan (26/09/2026), theo quy tắc ngay dưới đây.*

Lúc triển khai, rà trọn vòng đời trạng thái phòng và phiếu qua 12 thủ tục + trigger. Gặp chỗ
lệch khác thì **ghi thêm vào bảng trên trước**, rồi mới sửa. Sửa theo quy ước của file: chú
thích không dấu, căn cột, cập nhật khối Kiểm tra nếu số mong đợi đổi. Đọc lại file ngay trước
khi sửa, vì nhóm đang sửa `Scripts/` song song.

## 5. Thay đổi theo file

| File | Việc |
|---|---|
| `Scripts/setup_database/06_Procedures.sql` | §4 |
| `src/db/procedures.ts` | tham số OUT (§3.2) |
| `src/db/loi.ts` | nhánh lỗi chung của `thongBaoCsdl` (§3.3) |
| `src/lib/thao-tac/{dat-phong,le-tan,hoa-don,dich-vu,buong-phong}.ts` *(mới)* | mỗi hàm một thủ tục |
| `src/lib/queries/bookings.ts` | thêm `hoaDon` vào `PhieuTomTat` |
| `src/app/(app)/bookings/new/actions.ts` | thêm `datPhong` |
| `src/app/(app)/front-desk/actions.ts` *(mới)* | nhận phòng, thu cọc, hủy phiếu, lập hóa đơn, trả phòng |
| `src/app/(app)/invoices/[maHoaDon]/actions.ts` *(mới)* | thanh toán |
| `src/app/(app)/services/actions.ts` *(mới)* | ghi dịch vụ |
| `src/app/(app)/rooms/actions.ts` *(mới)* | dọn phòng, sửa phòng |
| `src/components/bookings/booking-form.tsx`, `front-desk/booking-picker.tsx`, `services/service-usage-form.tsx` | nối nút, trạng thái chờ, thông báo |
| `src/components/rooms/nhat-ky-form.tsx` *(mới)*, `src/app/(app)/rooms/page.tsx` | form dọn / sửa |
| `src/app/(app)/invoices/[maHoaDon]/page.tsx` + component thanh toán *(mới)* | §3.5 |
| `vitest.config.mts` | chạy file test tuần tự (`fileParallelism: false`) vì test ghi vào DB chung |

## 6. Kiểm thử

Trên `QuanLyKhachSan_test`, ngày đóng băng 23/09/2026 10:00 (hạ tầng của phase 1).

- **Nạp lại dữ liệu mẫu** trước mỗi file test ghi: chạy lại `07` với `SET timestamp`. `07`
  vốn chạy lại được (TRUNCATE rồi nạp).
- **Mỗi hàm thao tác:** 1 ca thành công (kiểm cả dữ liệu sau khi ghi: trạng thái phiếu,
  phòng, tổng tiền…) và 1 ca bị CSDL từ chối (kiểm `ok: false` và thông báo đúng của thủ tục).
- **Hai lỗi ở §4:** mỗi lỗi một ca hồi quy, thấy đỏ trên thủ tục cũ trước khi sửa.
  1. Đặt phòng bằng `sp_DatPhong` rồi nhận phòng ngay.
  2. Ghi dọn phòng cho phòng `DangSuDung` → trạng thái vẫn `DangSuDung`.
- **Một ca đi trọn vòng** như mục 1 của §1, kiểm trạng thái sau từng bước.
- **Kiểm tay trên trình duyệt:** đi trọn vòng trên DB dev, chụp màn hình từng bước.

## 7. Rủi ro

- `sp_ThanhToanHoaDon` từ chối khi tiền trên hóa đơn lệch với `fn_TienPhong` /
  `fn_TienDichVu`, ví dụ dịch vụ ghi sau khi lập hóa đơn mà chưa lập lại. Khảo sát lúc lập plan
  cho thấy `sp_GhiNhanDichVu` chưa tự tính lại hóa đơn nháp như chú thích của nó ghi; sửa ở §4,
  và ca đi trọn vòng kiểm việc này.
- Hai người đặt cùng một phòng cùng lúc: `sp_DatPhong` khóa dòng `PHONG` và trigger chặn
  trùng. App chỉ việc hiện thông báo của CSDL.

## 8. Ngoài phạm vi

- Người thao tác thật, phân quyền → phase 3.
- Thêm / sửa khách hàng, danh mục dịch vụ, bảng giá (không có thủ tục; quản trị dữ liệu nằm
  ngoài 9 màn hình).
