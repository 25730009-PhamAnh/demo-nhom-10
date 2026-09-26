# Nối CSDL — Phase 3: đăng nhập thật + tài khoản MySQL theo vai trò

Ngày: 2026-09-26 · Trạng thái: đã duyệt spec (26/09/2026)
Cần xong trước: phase 1 (`…-phase-1-doc-design.md`) và phase 2 (`…-phase-2-ghi-design.md`)

## 1. Mục tiêu

Sau phase 2 app vẫn chạy mọi truy vấn bằng `root` và ghi `MaTK` mặc định (`letan.lan`).
Phase này:

1. Đăng nhập bằng `sp_DangNhap`, giữ phiên bằng cookie, chưa đăng nhập thì không vào được app.
2. Mọi truy vấn và mọi `CALL` sau khi đăng nhập chạy bằng **tài khoản MySQL ứng với vai trò**
   của người dùng. Nhờ vậy GRANT trong `Scripts/setup_database/08_Security_Roles.sql` được
   chính MySQL thực thi.
3. `MaTK` truyền vào thủ tục là tài khoản trong phiên.

Nhóm đã chọn **để CSDL là lớp chặn**: app chỉ chặn *chưa đăng nhập*, không ẩn menu hay chặn
route theo vai trò. Người dùng vào màn nào cũng được. Phần nào vai trò không có quyền thì
MySQL từ chối, và app hiện đúng lời từ chối đó.

**Thành công nghĩa là:**

1. Chưa đăng nhập, mở bất kỳ route nào trong `(app)` → về `/login`. Đăng nhập xong → về
   đúng trang định mở.
2. Đăng nhập lần lượt 6 vai trò (§2). Mỗi vai trò thấy và làm được đúng những gì GRANT cho
   phép; phần còn lại hiện thông báo "không có quyền" kèm nguyên văn lời từ chối của MySQL.
3. Cảnh demo: đăng nhập `quanly.khanh` xem được mọi màn, nhưng bấm "Xác nhận nhận phòng" thì
   MySQL từ chối (`execute command denied … sp_NhanPhong`).
4. Không còn chỗ nào trong app chạy lúc runtime bằng `root`. `root` chỉ còn phục vụ
   `drizzle-kit` và bước dựng DB test.
5. `npm test`, `npm run lint`, `npm run build` không lỗi.

## 2. Vai trò → tài khoản MySQL

Theo mục D của `08`, dựa vào `TAI_KHOAN.MaLoaiTK`:

| MaLoaiTK | Vai trò | Tài khoản MySQL | Role | Người dùng mẫu |
|---|---|---|---|---|
| LTK0000001 | Quản trị viên | `admin` | r_quantri | admin |
| LTK0000002 | Lễ tân | `letan.lan` | r_letan | letan.lan, letan.huy |
| LTK0000003 | Buồng phòng | `buong.mai` | r_buongphong | buong.mai, buong.thao |
| LTK0000004 | Kỹ thuật | `kythuat.nam` | r_kythuat | kythuat.nam (kythuat.son đang `TamNghi`) |
| LTK0000005 | Kế toán | `ketoan.hoa` | r_ketoan | ketoan.hoa |
| LTK0000006 | Quản lý khách sạn | `quanly.khanh` | r_quanly | quanly.khanh |
| LTK0000007–10 | Nhà hàng, Spa, Bảo vệ, CSKH | *(không có)* | — | đăng nhập bị từ chối: "Vai trò <tên> chưa được cấp tài khoản CSDL" |

Hai người cùng vai trò dùng chung một tài khoản MySQL. Người thực hiện vẫn được ghi đúng qua
tham số `MaTK`. Đổi tên tài khoản MySQL thành tên vai trò nằm ngoài phạm vi: sẽ lệch với phần
bảo mật đã viết trong báo cáo.

## 3. Sửa `08_Security_Roles.sql`

1. **Tài khoản đăng nhập `app_dangnhap`@`localhost`**, chỉ có `EXECUTE ON PROCEDURE
   sp_DangNhap`. Dùng ở bước đăng nhập, khi app chưa biết vai trò. Đây là tài khoản dịch vụ,
   nên đặt `PASSWORD EXPIRE NEVER` (không theo chính sách 90 ngày của tài khoản người).
2. **Điều chỉnh GRANT — đã duyệt ngày 26/09/2026.** Lấy quyền đọc mà mỗi
   màn hình cần đối chiếu với GRANT hiện có, thấy các chỗ vai trò thiếu quyền cho chính việc
   của mình:

   | # | Chỗ thiếu | Hệ quả | Quyết định |
   |---|---|---|---|
   | G1 | `r_ketoan` không có `SELECT` trên `PHONG`, `LOAI_PHONG` | Kế toán không mở được chi tiết hóa đơn (hóa đơn in số phòng, loại phòng) | **Cấp thêm** `SELECT` hai bảng này |
   | G2 | `r_kythuat` không có `SELECT` trên `LOAI_PHONG` | Kỹ thuật không xem được Sơ đồ phòng (sơ đồ nối loại phòng) | **Cấp thêm**; đây là danh mục, không nhạy cảm |
   | G3 | `r_letan` không có `EXECUTE` trên `sp_BaoCaoDoanhThu` | Thẻ "Doanh thu hôm nay" ở Tổng quan bị chặn với lễ tân | **Giữ nguyên**: đúng phân công lễ tân không xem báo cáo; thẻ hiện "không có quyền" |

   G1 và G2 thêm vào mục B của `08`, theo quy ước của file. G3 không đổi gì: thẻ doanh thu của
   lễ tân hiện "không có quyền" — đúng thiết kế.
3. Đọc lại file ngay trước khi sửa, vì nhóm đang sửa `Scripts/` song song.

## 4. Quyết định kiến trúc

Theo `node_modules/next/dist/docs/01-app/02-guides/authentication.md` của Next 16.

### 4.1 Phiên

- `src/lib/phien.ts` (`server-only`): ký / kiểm cookie bằng `jose` (thêm dependency; tài liệu
  Next khuyên dùng), thuật toán HS256, khóa `SESSION_SECRET` trong `.env.local`.
- Nội dung: `maTk`, `tenDangNhap`, `hoTen`, `maLoaiTk`, `vaiTro`. Không chứa mật khẩu.
- Cookie `phien`: `httpOnly`, `sameSite: 'lax'`, `secure` khi production, `path: '/'`, hết hạn
  sau 8 giờ (một ca làm). Không gia hạn tự động.
- Hàm: `taoPhien(phien)`, `docPhien()` (hỏng / hết hạn / bị sửa → `null`), `xoaPhien()`.

### 4.2 Chặn chưa đăng nhập

- `src/proxy.ts` (Next 16 đổi tên middleware thành proxy, chạy Node runtime): route không
  phải `/login` hoặc tài nguyên tĩnh mà thiếu cookie `phien` → chuyển tới
  `/login?tiep=<đường dẫn>`. Chỉ là kiểm lạc quan.
- Kiểm thật nằm ở tầng truy cập dữ liệu (§4.3): cookie hỏng hoặc hết hạn → `redirect('/login')`.
- `tiep` chỉ nhận đường dẫn tương đối bắt đầu bằng `/`, để không bị lợi dụng chuyển hướng ra
  trang ngoài.

### 4.3 Pool theo tài khoản MySQL

- `src/db/vai-tro.ts`: bảng ánh xạ ở §2 (`MaLoaiTK` → tên biến môi trường chứa URL kết nối).
- `.env.local` có một URL cho mỗi tài khoản: `DATABASE_URL_DANGNHAP`, `DATABASE_URL_QUANTRI`,
  `…_LETAN`, `…_BUONGPHONG`, `…_KYTHUAT`, `…_KETOAN`, `…_QUANLY`. `.env.example` ghi sẵn
  mật khẩu học tập của `08` (đã công khai trong script).
- Mỗi tài khoản một pool, tạo khi dùng lần đầu, cache trên `globalThis` như
  `src/db/index.ts` đang làm; `connectionLimit` nhỏ (3). Giữ `dateStrings` và
  `DB_NGAY_CO_DINH` của phase 1.
- `dbTheoPhien()` (`src/db/theo-phien.ts`, bọc `cache()` của React nên mỗi request chỉ đọc
  phiên một lần): đọc phiên → chọn pool → trả `db` (Drizzle) và `callProcedure` gắn với pool
  đó.
- Mọi hàm `queries/` và `thao-tac/` lấy `db` qua `dbTheoPhien()`. Chữ ký giữ nguyên.
- `DATABASE_URL` (root) chỉ còn dùng cho `drizzle.config.ts` và `scripts/db-test-setup.sh`.
  `/db-check` cũng chuyển sang `dbTheoPhien()`.

### 4.4 Đăng nhập, đăng xuất

- Action đăng nhập (phase 1) gọi `sp_DangNhap` bằng pool `app_dangnhap`. Thành công mà
  `MaLoaiTK` không có trong bảng ánh xạ thì từ chối (§2). Còn lại thì `taoPhien` rồi
  `redirect(tiep ?? '/')`.
- Sidebar hiện `hoTen` và `vaiTro` của phiên (bỏ `getNhanVienMacDinh()`), thêm nút Đăng
  xuất (`xoaPhien` → `/login`).
- `MaTK` ở phase 2 (§3.4 của spec đó) đổi sang `phien.maTk`.

### 4.5 Khi MySQL từ chối quyền

Mã lỗi: `1142` (bảng / view), `1143` (cột), `1370` (thủ tục).

- **Đọc:** tầng truy cập dữ liệu đổi các lỗi này thành `KhongCoQuyenError` kèm nguyên văn
  thông báo của MySQL. Trang đọc từng khối qua `thuDoc(() => …)`, nhận
  `{ ok: true, data } | { ok: false, thongBao }`; khối bị chặn hiện component
  `<KhongCoQuyen thongBao=… />` (`src/components/shared/`), ví dụ "Vai trò của bạn không có
  quyền xem mục này · SELECT command denied to user 'ketoan.hoa'@'localhost' for table
  'phong'". Các khối khác của trang vẫn hiện.
- **Nhật ký buồng phòng** đọc `DON_PHONG` và `SUA_PHONG` thành hai lần đọc độc lập, rồi gộp
  phần nào đọc được. Buồng phòng thấy dòng dọn phòng, kỹ thuật thấy dòng sửa chữa, kèm một
  dòng chú thích cho phần bị ẩn.
- **Ghi:** `thongBaoCsdl` thêm nhánh cho ba mã trên → `"CSDL từ chối quyền: <message>"`, hiện
  dưới nút như lỗi nghiệp vụ ở phase 2.
- Lỗi khác vẫn nổi lên như trước, không bị nuốt thành "không có quyền".

## 5. Thay đổi theo file

| File | Việc |
|---|---|
| `Scripts/setup_database/08_Security_Roles.sql` | §3 |
| `package.json` | thêm `jose` |
| `src/lib/phien.ts` *(mới)* | §4.1 |
| `src/proxy.ts` *(mới)* | §4.2 |
| `src/db/vai-tro.ts`, `src/db/theo-phien.ts` *(mới)*, `src/db/index.ts` | §4.3 |
| `src/db/loi.ts` | `KhongCoQuyenError`, nhánh 1142 / 1143 / 1370 |
| `src/lib/queries/*.ts`, `src/lib/thao-tac/*.ts`, `src/lib/db-check.ts` | dùng `dbTheoPhien()` |
| `src/app/(auth)/login/actions.ts`, `login-form.tsx` | §4.4, đọc `tiep` |
| `src/app/(app)/layout.tsx`, `src/components/layout/sidebar.tsx` | người dùng trong phiên, Đăng xuất |
| `src/app/(app)/**/page.tsx` | đọc từng khối qua `thuDoc` |
| `src/components/shared/khong-co-quyen.tsx` *(mới)* | §4.5 |
| `.env.example` | `SESSION_SECRET`, 7 URL tài khoản |
| `scripts/db-test-setup.sh` | chạy thêm `08` (đổi tên DB như `01`–`07`) |

## 6. Kiểm thử

- **Phiên:** tạo rồi đọc lại được; đổi 1 ký tự của cookie → `null`; quá hạn → `null`.
- **Đăng nhập:**
  - đúng thì ra phiên đúng vai trò;
  - sai mật khẩu, và tên không tồn tại, ra cùng một thông báo của `sp_DangNhap`;
  - `kythuat.son` (`TamNghi`) và `cskh.uyen` (`NghiViec`) bị từ chối với thông báo trạng thái;
  - tài khoản `DangLamViec` thuộc LTK0000007 (thêm trong test) bị từ chối vì vai trò chưa có
    tài khoản CSDL.
- **Ma trận quyền:** mỗi vai trò chạy một bộ thao tác đọc / ghi mẫu bằng chính pool của mình,
  kỳ vọng rút từ GRANT của `08`. Ví dụ:
  - kế toán gọi `sp_NhanPhong` → 1370;
  - lễ tân gọi `sp_BaoCaoDoanhThu` → 1370;
  - buồng phòng đọc `SUA_PHONG` → 1142;
  - quản lý đọc mọi bảng được, gọi `sp_NhanPhong` → 1370.

  Viết đủ bảng kỳ vọng khi lập plan (G1–G3 đã chốt ở §3).
- **Chặn route:** kiểm tay bằng `curl` trên `next dev`: không có cookie → 307 tới `/login`;
  `tiep=https://…` bị bỏ qua.
- **Kiểm tay trên trình duyệt:** đăng nhập lần lượt 6 vai trò, chụp màn Tổng quan và một màn
  đặc trưng của vai trò đó.

`08` chạy trên DB test qua `sed` (đổi tên schema). Role và user là **toàn server**, nên dựng DB
test cũng tạo user thật trên MySQL local — cùng những user mà DB dev cần.

## 7. Rủi ro — kiểm đầu tiên khi triển khai

1. **`'x'@'localhost'` có nhận kết nối TCP tới `127.0.0.1` không.** Nếu không, cấu hình kết
   nối qua socket (`socketPath`) thay vì TCP.
2. **`FAILED_LOGIN_ATTEMPTS 5 PASSWORD_LOCK_TIME 1`:** URL sai mật khẩu trong `.env.local`
   thì pool thử kết nối nhiều lần, và MySQL khóa tài khoản đó 1 ngày. Lỗi `1045` không được
   thử lại, và phải báo rõ biến môi trường nào sai. Mở khóa: `ALTER USER … ACCOUNT UNLOCK`.
3. **`PASSWORD EXPIRE INTERVAL 90 DAY`:** 90 ngày sau khi chạy `08`, tài khoản người bị hết
   hạn mật khẩu (lỗi `1862`). Đủ cho học kỳ; ghi chú trong `.env.example`.
4. **Chạy `08` tạo user thật trên MySQL server local** — hỏi người dùng trước khi chạy, cả
   cho DB dev lẫn DB test.

## 8. Ngoài phạm vi

- Ẩn menu hoặc chặn route theo vai trò trong app (nhóm chọn để CSDL là lớp chặn).
- Đổi mật khẩu, quản lý tài khoản, khóa sau nhiều lần đăng nhập sai ở tầng app.
- Phiên lưu trong CSDL, đăng xuất khỏi mọi thiết bị.
- Vai trò `r_khachhang` và `r_giamsatbuongphong`: có role trong `08` nhưng chưa có tài khoản
  MySQL hay loại tài khoản tương ứng.
