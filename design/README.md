# Thiết kế giao diện — Hotel Management System

Bản thiết kế đầy đủ nằm trên canvas (bản chính, có lịch sử version):
<https://claude.ai/artifact/MKfJRhZfB66F8MZKaDLVLt>

Thư mục này là **bản sao mã nguồn** của canvas để tiện đối chiếu khi viết code.

> **Lưu ý:** các file `.dc.html` là Design Component, chúng nạp `./support.js` do canvas
> cung cấp. Mở trực tiếp bằng trình duyệt sẽ **không** render — hãy xem trên link canvas.
> Có thể đọc thẳng mã nguồn để lấy màu, kích thước, khoảng cách chính xác.

## Bản đồ màn hình

| Artboard | Màn hình | Route gợi ý | Thủ tục / view dùng tới |
|---|---|---|---|
| `Login.dc.html` | Đăng nhập | `/login` | `sp_DangNhap` |
| `Main.dc.html` | Tổng quan | `/` | `v_TinhTrangPhongHomNay`, `v_PhieuDatDangHieuLuc` |
| `Rooms.dc.html` | Sơ đồ phòng | `/rooms` | `v_TinhTrangPhongHomNay`, `sp_GhiNhanDonPhong`, `sp_GhiNhanSuaPhong` |
| `Booking.dc.html` | Đặt phòng | `/bookings/new` | `sp_TraCuuPhongTrong`, `v_PhongKhaDung`, `sp_DatPhong`, `sp_XacNhanDatCoc`, `fn_SoDem`, `fn_DonGiaPhongTheoNgay` |
| `CheckInOut.dc.html` | Nhận & trả phòng | `/front-desk` | `sp_NhanPhong`, `sp_TraPhong`, `sp_HuyPhieuDat`, `sp_XuLyNoShow` |
| `Customers.dc.html` | Khách hàng | `/customers` | `KHACH_HANG` |
| `Services.dc.html` | Dịch vụ | `/services` | `DICH_VU`, `sp_GhiNhanDichVu`, `fn_TienDichVu` |
| `Invoice.dc.html` | Hóa đơn | `/invoices/[maHoaDon]` | `sp_LapHoaDon`, `sp_LapChiTietHoaDon`, `sp_ThanhToanHoaDon`, `fn_TienPhong` |
| `Reports.dc.html` | Báo cáo doanh thu | `/reports` | tổng hợp `HOA_DON`, `CHI_TIET_HOA_DON` |
| `Style.dc.html` | Hệ thống thiết kế | — | token, kiểu chữ, thành phần dùng chung |

`canvas.json` giữ vị trí từng artboard trên canvas và các ghi chú — không cần cho việc code.

## Token màu (dán vào `src/app/globals.css`, thay khối `:root` mặc định của shadcn)

```css
:root {
  --radius: 0.625rem;
  --background: #F3EFE8;   --foreground: #1B1916;
  --card: #FFFFFF;         --card-foreground: #1B1916;
  --popover: #FFFFFF;      --popover-foreground: #1B1916;
  --primary: #14483F;      --primary-foreground: #FFFFFF;
  --secondary: #FAF7F1;    --secondary-foreground: #14483F;
  --muted: #FAF7F1;        --muted-foreground: #7B7269;
  --accent: #F1F7F4;       --accent-foreground: #14483F;
  --destructive: #8C3A31;
  --border: #E5DED3;       --input: #DCD5C9;      --ring: #14483F;
  --chart-1: #1B8A6A;      --chart-2: #B57C10;    --chart-3: #4A72C0;
  --sidebar: #13332E;              --sidebar-foreground: #9FB5AE;
  --sidebar-primary: #C9A227;      --sidebar-primary-foreground: #13332E;
  --sidebar-accent: #1E5146;       --sidebar-accent-foreground: #FFFFFF;
  --sidebar-border: #24463F;       --sidebar-ring: #C9A227;
}
```

Tailwind v4 nhận cả hex lẫn `oklch()`, giữ nguyên định dạng trên là chạy được.
Chưa định nghĩa chế độ tối — nếu cần, lấy lại từng bậc từ cùng dải màu chứ đừng đảo ngược.

## Màu trạng thái phòng (`PHONG.TrangThai`)

| Giá trị | Nhãn | Chữ | Nền | Chấm |
|---|---|---|---|---|
| `Trong` | Trống | `#14664B` | `#E3F0E9` | `#1B8A6A` |
| `DaDat` | Đã đặt | `#2A5480` | `#E6EDF6` | `#4A72C0` |
| `DangSuDung` | Đang sử dụng | `#8A5A0E` | `#F7EFDD` | `#B57C10` |
| `DangDon` | Đang dọn | `#5B4B85` | `#ECE9F5` | `#7561A8` |
| `BaoTri` | Bảo trì | `#8C3A31` | `#F8E8E5` | `#B04A3E` |

## Kiểu chữ

- **Playfair Display** 500/600/700 — tiêu đề trang, số liệu lớn, tên khách sạn. Dự phòng `Georgia, serif`.
- **Be Vietnam Pro** 400/500/600/700 — toàn bộ nhãn, đoạn văn, điều khiển.
- **JetBrains Mono** 400/500 — mã khóa, số phòng, ngày giờ, mọi con số tiền.

Nạp qua một thẻ `<link>` Google Fonts duy nhất.

## Bố cục

Sidebar 248px · thanh tiêu đề 76px · lề nội dung 28/32px · khoảng cách giữa thẻ 20px ·
đệm trong thẻ 20–22px · bo góc thẻ 14px, nút 10px, nhãn tròn · dòng bảng 48–60px.

## Chỗ còn để trống, cần nhóm điền

- Tên và nhận diện khách sạn — **"Sen Vàng" chỉ là tên tạm**.
- Địa chỉ, số điện thoại, mã số thuế trên mẫu hóa đơn (`Invoice.dc.html`, đang là `[…]`).
- Dịch vụ `DV04`–`DV06` là ví dụ thêm để minh hoạ danh mục nhiều dòng;
  `DV01`–`DV03` lấy đúng từ `9_TEST DATA.sql`.
- Diện tích / số giường của từng loại phòng (hiển thị trên thẻ chọn loại phòng ở
  `Booking.dc.html`) chưa có cột tương ứng trong `LOAI_PHONG`.
