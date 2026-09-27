# Bổ sung nghiệp vụ: khách hàng, buồng phòng – bảo trì, bảng giá theo ngày

Ngày: 2026-09-27 · Trạng thái: đã duyệt spec (27/09/2026); bổ sung khi lập plan (các dòng *Bổ sung khi lập plan*)
Cần xong trước: phase 2 (`2026-09-26-noi-csdl-phase-2-ghi-design.md`). Không phụ thuộc phase 3.

## 1. Mục tiêu

Demo đã đọc và ghi CSDL thật. Còn thiếu 5 chức năng, gom thành 3 phần:

| Phần | Yêu cầu |
|---|---|
| A. Khách hàng | (1) Thêm / sửa khách ở trang Khách hàng và thêm khách mới ngay ở form đặt phòng. (2) Form đặt phòng tìm khách theo họ tên, SĐT hoặc CCCD thay cho dropdown 30 khách đầu |
| B. Buồng phòng – bảo trì | (3) Màn làm việc cho nhân viên buồng phòng và kỹ thuật. (4) Báo dọn phòng và báo bảo trì cho một phòng |
| C. Bảng giá | (5) Cấu hình giá phòng theo ngày; giá khi đặt phòng là trung bình giá các đêm |

**Không đổi schema** (vẫn 14 bảng của `01`). Đã chốt với nhóm ngày 27/09/2026:

- Phần B dùng `PHONG.TrangThai` làm hàng đợi và dòng `SUA_PHONG` làm phiếu bảo trì, không thêm
  bảng yêu cầu (§4.1).
- Chưa có đăng nhập (phase 3): màn nhân viên có ô chọn nhân viên thực hiện (§4.4).
- Bảng giá đặt theo kiểu "phủ giá lên khoảng ngày" (§5.2).

**Thành công nghĩa là:**

1. Trang Khách hàng thêm được khách mới và sửa được khách có sẵn. Form đặt phòng tìm ra khách khi
   gõ một phần họ tên (có dấu hay không dấu), SĐT hoặc CCCD. Tạo khách mới ngay trong form rồi lập
   phiếu cho khách đó được luôn.
2. Trên DB dev, đi trọn một vòng bằng giao diện: báo bảo trì phòng Trống ở Sơ đồ phòng → phòng hiện
   ở màn Bảo trì → kỹ thuật bấm "Sửa xong" → phòng hiện ở màn Buồng phòng → bấm "Dọn xong" → Sơ đồ
   phòng thấy phòng Trống. Làm lại với một phòng Đã đặt thì phòng về Đã đặt.
3. Ở màn Bảng giá, đặt giá riêng cho 3 ngày nằm giữa khoảng giá cả năm của một loại phòng. Lịch giá
   hiện đúng giá từng ngày. Đặt phòng vắt qua 3 ngày đó thì form hiện chi tiết giá từng đoạn và đơn
   giá trung bình, và `GiaThueThoiDiem` ghi vào phiếu đúng bằng con số form hiện.
4. `npm test`, `npm run lint`, `npm run build` không lỗi.

## 2. Quy ước giữ nguyên

- Đọc bằng Drizzle, ghi bằng thủ tục. Một nút ghi đi qua `lib/thao-tac/*.ts` (trả `KetQua<T>`) và
  Server Action cạnh route (chỉ kiểm kiểu và định dạng, thành công thì `refresh()`). Quy tắc nghiệp
  vụ để thủ tục quyết định. Xem mục 3 của spec phase 2.
- Thủ tục mới viết theo quy ước của `06`: chú thích và `MESSAGE_TEXT` không dấu, căn cột, `SQL
  SECURITY DEFINER`, giao dịch có `EXIT HANDLER … ROLLBACK; RESIGNAL`, mã sinh theo mẫu tiền tố +
  `LPAD(max + 1, 8, '0')`, cập nhật khối "Mong doi" cuối file.
- Script của nhóm nằm ở thư mục OneDrive (`QLKS_SCRIPTS_DIR`), **ngoài git**. Trước khi sửa: đọc lại
  file (nhóm có thể đang sửa song song) và chép bản gốc sang scratchpad.
- Người báo trên Sơ đồ phòng là `getNhanVienMacDinh()` (`letan.lan`) cho tới phase 3.

## 3. Phần A — Khách hàng

### 3.1 Thủ tục mới (`06`)

`sp_ThemKhachHang(p_HoTen, p_CCCD, p_SDT, p_Email, OUT p_MaKH)` và
`sp_SuaKhachHang(p_MaKH, p_HoTen, p_CCCD, p_SDT, p_Email)`. Hai thủ tục kiểm cùng một bộ quy tắc,
mỗi vi phạm một `SIGNAL` riêng:

| Trường | Chuẩn hóa | Quy tắc |
|---|---|---|
| Họ tên | `TRIM` | Bắt buộc, tối đa 100 ký tự |
| CCCD | `TRIM`, `UPPER` | Bắt buộc, `^[0-9A-Z]{9,20}$` — nhận CMND 9 số, CCCD 12 số, hộ chiếu |
| SĐT | bỏ khoảng trắng, `.`, `-`; rỗng → `NULL` | Không bắt buộc, `^[+]?[0-9]{9,14}$` (vừa cột `VARCHAR(15)`) |
| Email | `TRIM`, `LOWER`; rỗng → `NULL` | Không bắt buộc, dạng `a@b.c` |

- Trùng CCCD hoặc email với khách **khác**: `SIGNAL` kèm mã khách đã có, ví dụ
  `'CCCD da co trong ho so KH00000012'`, thay cho lỗi 1062 của ràng buộc `UNIQUE`.
- Rỗng phải thành `NULL`: `UQ_KHACH_HANG_Email` cho nhiều `NULL` nhưng không cho hai chuỗi `''`.
- `sp_ThemKhachHang` sinh `MaKH = 'KH' + LPAD(max + 1, 8, '0')` (dữ liệu mẫu có 60 khách, khách mới
  đầu tiên là `KH00000061`), trả result set là dòng vừa thêm.
- `sp_SuaKhachHang`: `MaKH` không tồn tại thì từ chối. Cho sửa cả CCCD (sửa sai sót), vẫn kiểm trùng.
- Không làm xóa khách: `PHIEU_DAT_PHONG` tham chiếu `ON DELETE RESTRICT`, và QT-12 cấm xóa vật lý.
- *Bổ sung khi lập plan:* bộ quy tắc trên nằm trong một thủ tục nội bộ `sp_ChuanHoaKhachHang` (tham số
  `INOUT`, như `sp_LapChiTietHoaDon` là thủ tục nội bộ của `sp_LapHoaDon`), hai thủ tục công khai cùng
  gọi. Tham số SĐT rộng `VARCHAR(20)` vì còn khoảng trắng trước khi chuẩn hóa.

`08`: `GRANT EXECUTE` hai thủ tục cho `r_letan`.

### 3.2 Tìm khách

`timKhachHang(q)` trong `src/lib/queries/customers.ts`:

- `q` đã `trim`. Rỗng → 10 khách có mã lớn nhất (mới tạo gần đây).
- Khớp `LIKE '%q%'` trên `HoTen` và `MaKH`; `SDT` và `CCCD` so với `q` đã bỏ khoảng trắng, `.`, `-`.
  Escape `%`, `_`, `\` trong `q`.
- Không phân biệt dấu: so `HoTen COLLATE utf8mb4_0900_ai_ci`. *Bổ sung khi lập plan:* collation của cột
  (`utf8mb4_unicode_ci`) coi "ễ" là "e" nhưng **không** coi "Đ" là "D" ("Đặng" không ra "Dang");
  `utf8mb4_0900_ai_ci` coi cả hai là một.
- Trùng khít CCCD hoặc SĐT xếp đầu, rồi theo họ tên. Tối đa 10 dòng, mỗi dòng kèm `soLanLuuTru`
  (cùng định nghĩa với `getDanhSachKhachHang`).

### 3.3 App

- `src/lib/thao-tac/khach-hang.ts`: `themKhachHang`, `suaKhachHang`.
- `src/app/(app)/customers/actions.ts`: `themKhachHang`, `suaKhachHang` (kiểm `laMa`, `laChuoi` theo
  độ dài cột; SĐT cho tới 20 ký tự vì còn khoảng trắng), `timKhach(q)` (đọc, `laChuoi(q, 100)`).
  Form đặt phòng dùng chung các action này.
- `src/components/customers/khach-hang-form.tsx` *(mới)*: họ tên\*, CCCD / hộ chiếu\*, SĐT, email;
  chế độ thêm hoặc sửa (mã khách chỉ đọc). Dùng ở cả hai trang.
- **Trang Khách hàng:** nút "Thêm khách hàng" đặt ở đầu thẻ danh sách (mockup đặt ở topbar; đặt trong
  thẻ để khỏi chia state giữa hai component). Bấm thì form mở ngay trong thẻ. Mỗi dòng có nút "Sửa"
  mở cùng form, điền sẵn.
- **Form đặt phòng, bước 1**, theo `design/Booking.dc.html`:
  - Nút chuyển "Khách đã có | Khách mới".
  - *Khách đã có:* ô tìm "Nhập CCCD, số điện thoại hoặc họ tên…", debounce ~250 ms, gọi `timKhach`.
    Kết quả là listbox (`role="combobox"` / `listbox`, phím ↑ ↓ Enter Esc). Chọn xong thì hiện thẻ khách
    kèm badge "Đã lưu trú N lần" và nút "Đổi khách".
  - *Khách mới:* `KhachHangForm`. Lưu thành công thì chuyển về "Khách đã có" với khách vừa tạo đã chọn.
  - Mặc định chưa chọn khách; nút "Lập phiếu đặt phòng" khóa tới khi chọn. (Hiện form tự chọn khách
    đầu tiên, dễ lập nhầm phiếu.)
  - `bookings/new/page.tsx` bỏ việc nạp `getDanhSachKhachHang()`.

## 4. Phần B — Buồng phòng và bảo trì

### 4.1 Vòng đời phòng

| Thao tác | Ai, ở đâu | Thủ tục | Trạng thái phòng |
|---|---|---|---|
| Báo dọn phòng | Lễ tân, Sơ đồ phòng | `sp_BaoDonPhong` *(mới)* | Trống / Đã đặt → **Đang dọn** |
| Báo bảo trì | Lễ tân (Sơ đồ phòng); buồng phòng (màn Buồng phòng) | `sp_BaoBaoTri` *(mới)* | Trống / Đã đặt / Đang dọn → **Bảo trì**, thêm một dòng `SUA_PHONG` 0đ |
| Sửa xong | Kỹ thuật, màn Bảo trì | `sp_GhiNhanSuaPhong` *(đổi nghĩa)* | Bảo trì → **Đang dọn** |
| Dọn xong | Buồng phòng, màn Buồng phòng | `sp_GhiNhanDonPhong` *(sửa)* | Đang dọn → **Đã đặt** nếu còn phiếu `DaDat` giữ phòng, không thì **Trống** |
| Trả phòng *(có sẵn)* | Lễ tân | `sp_TraPhong` | Đang sử dụng → Đang dọn |

**Phiếu bảo trì đang mở** của một phòng Bảo trì là dòng `SUA_PHONG` mới nhất của phòng đó
(`ORDER BY ThoiGian DESC, MaSua DESC`). Dữ liệu mẫu đã theo đúng cách này (`SUA0000011`: 0đ,
"May lanh khong chay, dang kiem tra"). Phòng Bảo trì của dữ liệu mẫu cũ có dòng mới nhất đã mang
chi phí (ví dụ `SUA0000004`, 900.000đ), nên form "Sửa xong" điền sẵn chi phí hiện có.

**Hạn chế đã chấp nhận:** không lưu được yêu cầu dọn cho phòng đang có khách (nhân viên ghi thẳng
việc dọn, chỉ vào nhật ký); khi sửa xong, `MaTK` của phiếu đổi từ người báo sang kỹ thuật viên;
không có mức ưu tiên hay phân công.

### 4.2 Thủ tục

**`sp_BaoDonPhong(p_MaPhong)` *(mới)*.** Phòng phải tồn tại và đang `Trong` hoặc `DaDat` → `DangDon`.
Trạng thái khác bị từ chối với câu riêng: `DangDon` (đã chờ dọn), `DangSuDung` (có khách, ghi dọn
trực tiếp ở màn Buồng phòng), `BaoTri` (sẽ sang chờ dọn khi sửa xong). Không có tham số `MaTK`
vì không có bảng nào lưu người báo dọn.

**`sp_BaoBaoTri(p_MaPhong, p_MaTK, p_MoTa)` *(mới)*.** Trong giao dịch, khóa dòng `PHONG`:

- `p_MoTa` bắt buộc (sau `TRIM`), tối đa 200 ký tự. Tài khoản tồn tại và `DangLamViec`.
- Phòng `DangSuDung` → từ chối (giữ quy tắc của `sp_GhiNhanSuaPhong` cũ). Phòng `BaoTri` → từ chối
  (đã có phiếu đang mở).
- Thêm `SUA_PHONG (MaSua mới, MaPhong, MaTK = người báo, NOW(), ChiPhi = 0, MoTaLoi = p_MoTa)`,
  phòng → `BaoTri`. Trả result set gồm `MaSua`.

**`sp_GhiNhanSuaPhong(p_MaPhong, p_MaTK, p_ChiPhi, p_MoTaLoi)` — giữ tham số, đổi nghĩa** từ "ghi sửa
rồi đưa phòng vào bảo trì" sang "kỹ thuật ghi nhận đã sửa xong". Trong giao dịch:

- Tài khoản tồn tại và `DangLamViec`. `p_ChiPhi` không `NULL`, `>= 0`.
- Phòng phải `BaoTri`, không thì từ chối ("hãy báo bảo trì trước").
- Khóa phiếu đang mở và cập nhật: `ChiPhi = p_ChiPhi`, `MaTK = p_MaTK`, `ThoiGian = NOW()`,
  `MoTaLoi = p_MoTaLoi` nếu không rỗng, rỗng thì giữ mô tả cũ. Phòng Bảo trì mà chưa có dòng nào
  (chỉ xảy ra khi sửa tay CSDL) thì thêm một dòng mới.
- Phòng → `DangDon`. Mỗi sự cố vẫn đúng một dòng, nên `sp_BaoCaoBuongPhong` không đếm đôi.

**`sp_GhiNhanDonPhong(p_MaPhong, p_MaTK, p_GhiChu)` — sửa:**

- Thêm điều kiện tài khoản `DangLamViec`.
- Chỉ phòng `DangDon` đổi trạng thái: sang `DaDat` nếu còn phiếu `DaDat` giữ phòng (cùng điều kiện
  với `sp_HuyPhieuDat`), không thì `Trong`.
- Phòng `BaoTri` **không còn** về `Trong` (phải sửa xong trước), chỉ ghi nhật ký. Trạng thái khác
  giữ như phase 2: ghi nhật ký, không đổi trạng thái.

`08`:

- `EXECUTE sp_BaoDonPhong` cho `r_letan`, `r_giamsatbuongphong`.
- `EXECUTE sp_BaoBaoTri` cho `r_letan`, `r_buongphong`, `r_giamsatbuongphong`.
- `SELECT` trên `v_TinhTrangPhongHomNay` cho `r_kythuat` (badge khách hôm nay ở màn Bảo trì).
- `SELECT (MaTK, HoTen) ON TAI_KHOAN` cho `r_buongphong`, `r_kythuat` (tên người báo, người làm).

### 4.3 Đọc

`src/lib/queries/buong-phong.ts` *(mới)*:

- `getNhanVienTheoLoai(maLoaiTk)`: tài khoản `DangLamViec` thuộc loại đó, theo họ tên.
- `getPhongChoDon()`: phòng `DangDon` kèm loại phòng; nối `v_TinhTrangPhongHomNay` để biết phòng có
  phiếu phủ hôm nay (mã phiếu, tên khách). Phòng có khách hôm nay xếp đầu, rồi theo số phòng.
- `getPhongDangBaoTri()`: phòng `BaoTri` kèm phiếu đang mở (`ROW_NUMBER() OVER (PARTITION BY MaPhong
  …)`), họ tên người trên phiếu, số ngày đã chờ, và phiếu phủ hôm nay (cùng view).
- `getNhatKyDon(n = 20)`, `getNhatKySua(n = 20)`: nhật ký mới nhất, kèm họ tên nhân viên.

`getNhatKyBuongPhong()` (`queries/rooms.ts`) đổi cột nhân viên từ `MaTK` sang họ tên.

`src/lib/vai-tro.ts` *(mới)*: hằng `LOAI_TK_BUONG_PHONG = 'LTK0000003'`,
`LOAI_TK_KY_THUAT = 'LTK0000004'` (phase 3 dùng lại).

### 4.4 Màn hình

Hai màn mới, thêm vào sidebar ngay sau "Sơ đồ phòng". Đầu mỗi màn có ô **"Nhân viên thực hiện"**
chọn trong `getNhanVienTheoLoai` của đúng vai trò (`kythuat.son` đang `TamNghi` nên không hiện).
Phase 3 bỏ ô này, lấy người trong phiên.

**`/housekeeping` "Buồng phòng"**

- Thẻ "Phòng chờ dọn": mỗi phòng có số phòng, tầng, loại, badge "Khách hôm nay · DP… · tên" khi có;
  nút "Dọn xong" (ghi chú tùy chọn) → `sp_GhiNhanDonPhong`; nút "Báo hỏng" (ô mô tả) → `sp_BaoBaoTri`.
- Thẻ "Ghi nhận dọn phòng khác": chọn phòng bất kỳ (ví dụ phòng đang có khách) + ghi chú →
  `sp_GhiNhanDonPhong`, chỉ vào nhật ký.
- Thẻ "Nhật ký dọn phòng".

**`/maintenance` "Bảo trì"**

- Thẻ "Phòng đang bảo trì": sự cố, người báo, lúc báo, "chờ N ngày", badge khách hôm nay. Nút "Sửa
  xong" mở ô chi phí và ô mô tả, điền sẵn từ phiếu → `sp_GhiNhanSuaPhong`. Thành công: "Phòng 202
  chuyển sang Đang dọn, chờ buồng phòng".
- Thẻ "Nhật ký sửa chữa".

**Sơ đồ phòng**

- Ô phòng thành nút chọn. Chọn một phòng thì hiện khung thao tác ở đầu lưới: số phòng, loại, trạng
  thái; "Báo dọn phòng"; "Báo bảo trì" kèm ô mô tả. Phòng Bảo trì hiện sự cố đang mở (từ
  `getPhongDangBaoTri`).
- *Bổ sung khi lập plan:* nút **không** khóa theo trạng thái phòng (bản duyệt ghi "khóa, kèm lý do").
  Quy ước của repo là không lặp quy tắc nghiệp vụ ở app: bấm nút sai trạng thái thì thủ tục từ chối
  và câu của CSDL hiện ngay dưới nút, như mọi nút ghi của phase 2.
- Thẻ "Nhật ký buồng phòng & sửa chữa" chỉ còn để xem: bỏ hai nút ghi nhận (chuyển sang hai màn nhân
  viên), bỏ `nhat-ky-form.tsx`.

**Tổng quan** *(bổ sung khi lập plan)*: thẻ "N phòng chờ dọn" dẫn tới `/housekeeping`. Thẻ "Phòng … báo
hỏng" đang lấy dòng `SUA_PHONG` 0đ (gặp cả dòng cũ của phòng 303 đang có khách, không phải phiếu đang
mở), đổi thành "N phòng đang bảo trì" từ `getPhongDangBaoTri()`, dẫn tới `/maintenance`.

**Server Action**

| File | Action | Gọi |
|---|---|---|
| `rooms/actions.ts` | `baoDonPhong(maPhong)`, `baoBaoTri(maPhong, moTa)` — người báo mặc định | `sp_BaoDonPhong`, `sp_BaoBaoTri` |
| `housekeeping/actions.ts` *(mới)* | `donXong(maPhong, maTk, ghiChu)`, `baoHong(maPhong, maTk, moTa)` | `sp_GhiNhanDonPhong`, `sp_BaoBaoTri` |
| `maintenance/actions.ts` *(mới)* | `suaXong(maPhong, maTk, chiPhi, moTaLoi)` | `sp_GhiNhanSuaPhong` |

`maTk` gửi từ client được kiểm `laMa(maTk, "TK")`; thủ tục kiểm tài khoản tồn tại và đang làm việc.

## 5. Phần C — Bảng giá theo ngày

### 5.1 Một công thức giá trung bình

Hiện có bốn chỗ tính đơn giá một phiếu và chúng lệch nhau:

| Chỗ | Hiện tại |
|---|---|
| `sp_DatPhong` (chèn `CHI_TIET_DAT_PHONG`) | Trung bình giá các đêm (CTE đệ quy) |
| `getLoaiPhongConTrong` (form đặt phòng) | Trung bình giá các đêm (CTE đệ quy) |
| `sp_TraCuuPhongTrong` (`DonGiaMotDem`, `TamTinh`) | Giá ngày nhận phòng |
| `trg_CTDP_TinhThanhTien_BI` (khi truyền giá 0) | Giá ngày nhận phòng |

Thêm `fn_DonGiaTrungBinh(p_MaLoaiPhong, p_CheckIn, p_CheckOut) RETURNS DECIMAL(18,2)` vào `02`:
lặp `WHILE` qua từng đêm `[CheckIn, CheckOut)`, cộng `fn_DonGiaPhongTheoNgay`, trả
`ROUND(tổng / số đêm, 2)` — cùng kết quả với `ROUND(AVG(…), 2)` của `sp_DatPhong`. Ngày `NULL` hoặc
`CheckOut <= CheckIn` → `NULL`. Cả bốn chỗ trên chuyển sang gọi hàm này. Sửa `02`, `04`, `06`.

`08`: `EXECUTE ON FUNCTION fn_DonGiaTrungBinh` và `fn_DonGiaPhongTheoNgay` cho `r_letan`,
`r_khachhang`, `r_quanly` — app gọi thẳng hai hàm này khi đọc (form đặt phòng, lịch giá). `08` hiện
chưa cấp quyền cho hàm nào, nên query form đặt phòng hiện tại cũng sẽ lỗi ở phase 3 nếu thiếu.

### 5.2 Thủ tục ghi (`06`)

**`sp_DatGiaPhong(p_MaLoaiPhong, p_TuNgay, p_DenNgay, p_DonGia)`** phủ giá lên đoạn
`[TuNgay, DenNgay]` (tính cả hai đầu). `p_DonGia = NULL` là trả đoạn đó về giá gốc.

- Từ chối: loại phòng không tồn tại; thiếu ngày; `DenNgay < TuNgay`; `TuNgay < CURDATE()` (không sửa
  giá quá khứ); `p_DonGia <= 0`; hệ số `ROUND(p_DonGia / DonGiaNgay, 2) > 99.99` (giới hạn
  `DECIMAL(4,2)`).
- Trong giao dịch, khóa dòng `LOAI_PHONG` (tuần tự hóa mọi lần sửa giá của loại đó), rồi theo đúng
  thứ tự — chỉ thu hẹp rồi mới chèn, nên `trg_BangGia_KhongGiaoNhau` (RB-12) không bao giờ báo chồng:
  1. Nhớ khoảng *S* chứa trọn đoạn (`A < TuNgay AND B > DenNgay`, tối đa một khoảng).
  2. Xóa khoảng nằm trọn trong đoạn.
  3. Khoảng lấn đầu đoạn (gồm *S*): `DenNgay = TuNgay - 1`.
  4. Khoảng lấn cuối đoạn: `ApDungTuNgay = DenNgay + 1`.
  5. Có *S*: chèn phần đuôi `[DenNgay + 1, S.B]` với giá và hệ số của *S*.
  6. `p_DonGia` khác `NULL`: chèn `[TuNgay, DenNgay]`, `HeSo = GREATEST(ROUND(p_DonGia / DonGiaNgay, 2), 0.01)`.
- `MaBangGia` sinh theo mẫu `BG` + 8 chữ số. Trả result set là mọi khoảng giá của loại đó sau khi đổi.

**`sp_CapNhatGiaLoaiPhong(p_MaLoaiPhong, p_DonGiaNgay)`**: giá gốc `> 0`; hệ số mới của mọi khoảng
phải `<= 99.99`. Cập nhật `LOAI_PHONG.DonGiaNgay` rồi tính lại `HeSo` của mọi khoảng thuộc loại đó
(`DonGia` giữ nguyên, giá thật không đổi ngầm).

Phiếu đã lập không đổi: giá đã chốt trong `CHI_TIET_DAT_PHONG` (QT-06). Màn Bảng giá ghi rõ điều này.

`08`: `EXECUTE` hai thủ tục cho `r_quanly`.

### 5.3 App

- `src/lib/queries/bang-gia.ts` *(mới)*: `getBangGia()` (mỗi loại phòng: giá gốc, các khoảng giá
  theo ngày bắt đầu); `getLichGia(tuNgay, soNgay = 14)` (loại phòng × ngày, giá qua
  `fn_DonGiaPhongTheoNgay`, kèm cờ ngày có khai giá hay rơi về giá gốc).
- `src/lib/thao-tac/bang-gia.ts`, `src/app/(app)/pricing/actions.ts`: `datGia(maLoai, tuNgay,
  denNgay, donGia | null)`, `capNhatGiaGoc(maLoai, donGia)`.
- `getLoaiPhongConTrong` lấy `donGiaNgay` qua `fn_DonGiaTrungBinh` và trả thêm `chiTietGia`: các đoạn
  đêm liền nhau cùng giá, `{ tuNgay, denNgay, donGia, soDem }[]`. Đơn giá trung bình vẫn lấy từ CSDL,
  JS chỉ gộp đoạn để hiển thị. Giữ giới hạn 1000 đêm (CTE đệ quy của phần chi tiết).

**`/pricing` "Bảng giá"** (sidebar, trước "Báo cáo"):

1. **Đặt giá theo khoảng ngày:** loại phòng, từ ngày, đến ngày, đơn giá; hệ số so với giá gốc hiện
   ngay khi gõ. Nút "Áp dụng" (`datGia`) và "Về giá gốc" (`datGia` với `null`).
2. **Lịch giá 14 ngày:** dòng là loại phòng, cột là ngày, ô tô màu theo giá / giá gốc (bằng giá gốc
   trung tính, cao hơn ấm dần, thấp hơn lạnh). Nút ‹ › lùi / tiến 14 ngày qua `?tu=YYYY-MM-DD`.
3. **Theo loại phòng:** giá gốc sửa tại chỗ (`capNhatGiaGoc`); danh sách khoảng giá
   "26/09/2026 – 31/12/2026 · 1.380.000 (×1,20)", mỗi khoảng có nút "Xóa" = về giá gốc từ
   `max(ApDungTuNgay, hôm nay)` tới `DenNgay`. Khoảng đã qua hết hiện mờ, không có nút.

**Form đặt phòng:** thẻ "Tạm tính" thêm "Chi tiết giá", ví dụ "27/09–28/09 · 1.500.000 × 2 đêm;
29/09 · 1.950.000 × 1 đêm"; nhãn "Đơn giá / đêm" thành "Đơn giá / đêm (trung bình)".

## 6. Thay đổi theo file

| File | Việc |
|---|---|
| `Scripts/setup_database/02_Functions.sql` | `fn_DonGiaTrungBinh`, cập nhật khối Mong doi (6 hàm) |
| `Scripts/setup_database/04_Triggers.sql` | `trg_CTDP_TinhThanhTien_BI` dùng `fn_DonGiaTrungBinh` |
| `Scripts/setup_database/06_Procedures.sql` | 7 thủ tục mới, trong đó `sp_ChuanHoaKhachHang` nội bộ (§3.1, §4.2, §5.2); sửa `sp_DatPhong`, `sp_TraCuuPhongTrong`, `sp_GhiNhanDonPhong`, `sp_GhiNhanSuaPhong`; khối Mong doi |
| `Scripts/setup_database/08_Security_Roles.sql` | quyền ở §3.1, §4.2, §5.1, §5.2 |
| `src/lib/queries/{customers,bookings,rooms}.ts` | §3.2, §5.3, §4.3 |
| `src/lib/queries/{buong-phong,bang-gia}.ts`, `src/lib/vai-tro.ts` *(mới)* | §4.3, §5.3 |
| `src/lib/thao-tac/{khach-hang,bang-gia}.ts` *(mới)*, `buong-phong.ts` | mỗi hàm một thủ tục |
| `src/app/(app)/customers/actions.ts`, `housekeeping/`, `maintenance/`, `pricing/` *(mới)* | action, trang |
| `src/app/(app)/rooms/{actions.ts,page.tsx}`, `(app)/page.tsx`, `bookings/new/page.tsx` | §4.4, §3.3 |
| `src/components/customers/*`, `bookings/booking-form.tsx`, `rooms/*` | §3.3, §4.4, §5.3 |
| `src/components/{housekeeping,maintenance,pricing}/*`, `shared/chon-nhan-vien.tsx` *(mới)* | §4.4, §5.3 |
| `src/lib/nav.ts` | thêm Buồng phòng, Bảo trì, Bảng giá |
| `README.md` | màn mới, chạy lại `02 → 04 → 06 → 08` |

## 7. Kiểm thử

Trên `QuanLyKhachSan_test`, ngày đóng băng 23/09/2026 10:00, nạp lại dữ liệu mẫu trước mỗi ca ghi
(hạ tầng phase 1–2). Test gọi tầng `thao-tac` / `queries`.

- **A.** Thêm khách thành công ra `KH00000061`; trùng CCCD, trùng email, CCCD / SĐT / email sai dạng
  bị từ chối; hai khách để trống email vẫn lưu được; sửa được, sửa trùng CCCD của khách khác bị từ
  chối, mã không tồn tại bị từ chối. `timKhachHang`: "Nguyễn" ra "Nguyen", một phần SĐT / CCCD ra
  đúng khách, `%` không trả cả bảng, rỗng ra 10 khách mới nhất.
- **B.** Mỗi dòng của bảng §4.1, cả các trường hợp bị từ chối (báo dọn / báo bảo trì phòng có khách,
  báo bảo trì phòng đang Bảo trì, sửa xong phòng không Bảo trì, tài khoản `TamNghi`). Một vòng trọn:
  báo bảo trì → sửa xong → dọn xong → `Trong`, `SUA_PHONG` tăng đúng 1 dòng; phòng `DaDat` đi hết vòng
  về `DaDat`. Sửa xong phòng có phiếu cũ mang chi phí: chi phí mới ghi đè, mô tả rỗng giữ mô tả cũ.
  `getPhongChoDon` xếp phòng có khách hôm nay lên đầu.
- **C.** `sp_DatGiaPhong`: phủ giữa khoảng cả năm ra 3 khoảng liền mạch; phủ trùng khít; lấn đầu, lấn
  cuối, phủ qua nhiều khoảng; về giá gốc; các trường hợp bị từ chối — mỗi ca kiểm lại
  `fn_DonGiaPhongTheoNgay` từng ngày quanh hai mép. `sp_CapNhatGiaLoaiPhong` tính lại `HeSo`, giữ
  `DonGia`. Phiếu vắt qua hai mức giá: `GiaThueThoiDiem` = `fn_DonGiaTrungBinh` = `donGiaNgay` của
  `getLoaiPhongConTrong`, và `chiTietGia` đúng các đoạn. `sp_TraCuuPhongTrong` trả đơn giá trung bình.
- **Sửa test cũ** kỳ vọng hành vi cũ: dọn phòng Bảo trì thì về Trống; ghi sửa phòng Trống thì sang
  Bảo trì; số thủ tục / hàm trong khối kiểm tra.
- **Hồi quy:** giá trong phiếu mẫu và số liệu báo cáo (`bao-cao.test.ts`) không đổi.
- **Kiểm tay trên trình duyệt:** ba kịch bản ở §1 trên DB dev, chụp màn hình.

## 8. Triển khai và rủi ro

- Làm theo thứ tự A → B → C. Mỗi phần xong thì test xanh, kiểm trên trình duyệt, commit.
- Chạy script vào DB dev theo thứ tự `02 → 04 → 06 → 08` (chỉ `DROP` / `CREATE`, không mất dữ liệu).
  `08` tạo user MySQL thật trên server local: hỏi người dùng trước khi chạy.
- `sp_DatPhong` đổi cách tính giá: test hồi quy phải cho đúng giá như trước với mọi phiếu.
- Thư mục `Scripts/` ngoài git và nhóm có thể đang sửa: đọc lại ngay trước khi sửa, giữ bản gốc ở
  scratchpad.
- Báo cáo (nhóm tự sửa, app không đụng `Report.docx`): Bảng 4.1 thêm 7 thủ tục (1 nội bộ), sửa mô tả
  `sp_GhiNhanDonPhong`, `sp_GhiNhanSuaPhong`, `sp_TraCuuPhongTrong`; Bảng 4.2 mô tả trigger
  `trg_CTDP_TinhThanhTien_BI`; Bảng 4.3 thêm hàm thứ 6.

## 9. Ngoài phạm vi

- Bảng yêu cầu dọn / bảo trì riêng, mức ưu tiên, phân công, người duyệt (đã chọn không đổi schema).
- Xóa khách hàng; tìm kiếm trên bảng ở trang Khách hàng.
- Đăng nhập, ẩn menu theo vai trò → phase 3.
- Sửa danh mục loại phòng (thêm / xóa loại), sửa danh mục dịch vụ.
