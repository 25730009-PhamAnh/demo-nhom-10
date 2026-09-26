import { mysqlTable, mysqlSchema, AnyMySqlColumn, index, foreignKey, primaryKey, check, char, decimal, date, int, varchar, unique, datetime, mysqlView, bigint, text } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const bangGiaPhong = mysqlTable("BANG_GIA_PHONG", {
	maBangGia: char("MaBangGia", { length: 10 }).notNull(),
	maLoaiPhong: char("MaLoaiPhong", { length: 10 }).notNull().references(() => loaiPhong.maLoaiPhong, { onDelete: "restrict", onUpdate: "cascade" } ),
	heSo: decimal("HeSo", { precision: 4, scale: 2 }).default('1.00').notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	apDungTuNgay: date("ApDungTuNgay", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	denNgay: date("DenNgay", { mode: 'string' }).notNull(),
	donGia: decimal("DonGia", { precision: 18, scale: 2 }).notNull(),
},
(table) => [
	index("IX_BANG_GIA_PHONG_Loai_Ngay").on(table.maLoaiPhong, table.apDungTuNgay, table.denNgay),
	primaryKey({ columns: [table.maBangGia], name: "BANG_GIA_PHONG_MaBangGia"}),
	check("CK_BANG_GIA_PHONG_DonGia", sql`(\`DonGia\` >= 0)`),
	check("CK_BANG_GIA_PHONG_HeSo", sql`(\`HeSo\` > 0)`),
	check("CK_BANG_GIA_PHONG_Ngay", sql`(\`DenNgay\` >= \`ApDungTuNgay\`)`),
]);

export const chiTietDatPhong = mysqlTable("CHI_TIET_DAT_PHONG", {
	maDatPhong: char("MaDatPhong", { length: 10 }).notNull().references(() => phieuDatPhong.maDatPhong, { onDelete: "cascade", onUpdate: "cascade" } ),
	maPhong: char("MaPhong", { length: 10 }).notNull().references(() => phong.maPhong, { onDelete: "restrict", onUpdate: "cascade" } ),
	giaThueThoiDiem: decimal("GiaThueThoiDiem", { precision: 18, scale: 2 }).notNull(),
	soDem: int("SoDem").notNull(),
	thanhTien: decimal("ThanhTien", { precision: 18, scale: 2 }).generatedAlwaysAs(sql`(\`GiaThueThoiDiem\` * \`SoDem\`)`, { mode: "stored" }),
},
(table) => [
	primaryKey({ columns: [table.maDatPhong, table.maPhong], name: "CHI_TIET_DAT_PHONG_MaDatPhong_MaPhong"}),
	check("CK_CHI_TIET_DAT_PHONG_Gia", sql`(\`GiaThueThoiDiem\` >= 0)`),
	check("CK_CHI_TIET_DAT_PHONG_SoDem", sql`(\`SoDem\` > 0)`),
]);

export const chiTietHoaDon = mysqlTable("CHI_TIET_HOA_DON", {
	maCthd: char("MaCTHD", { length: 10 }).notNull(),
	maHoaDon: char("MaHoaDon", { length: 10 }).notNull().references(() => hoaDon.maHoaDon, { onDelete: "cascade", onUpdate: "cascade" } ),
	loaiKhoanMuc: varchar("LoaiKhoanMuc", { length: 20 }).notNull(),
	soTien: decimal("SoTien", { precision: 18, scale: 2 }).notNull(),
	ghiChu: varchar("GhiChu", { length: 200 }),
},
(table) => [
	index("IX_CHI_TIET_HOA_DON_MaHoaDon").on(table.maHoaDon),
	primaryKey({ columns: [table.maCthd], name: "CHI_TIET_HOA_DON_MaCTHD"}),
	check("CK_CHI_TIET_HOA_DON_LoaiKhoanMuc", sql`(\`LoaiKhoanMuc\` in (_utf8mb4\'TienPhong\',_utf8mb4\'DichVu\',_utf8mb4\'PhuThu\',_utf8mb4\'GiamGia\',_utf8mb4\'GiamTru\',_utf8mb4\'TongHop\'))`),
	check("CK_CHI_TIET_HOA_DON_SoTienTheoLoai", sql`(((\`LoaiKhoanMuc\` in (_utf8mb4\'TienPhong\',_utf8mb4\'DichVu\',_utf8mb4\'PhuThu\',_utf8mb4\'TongHop\')) and (\`SoTien\` >= 0)) or ((\`LoaiKhoanMuc\` in (_utf8mb4\'GiamGia\',_utf8mb4\'GiamTru\')) and (\`SoTien\` <= 0)))`),
]);

export const dichVu = mysqlTable("DICH_VU", {
	maDv: char("MaDV", { length: 10 }).notNull(),
	tenDv: varchar("TenDV", { length: 100 }).notNull(),
	donViTinh: varchar("DonViTinh", { length: 20 }),
	giaDv: decimal("GiaDV", { precision: 18, scale: 2 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.maDv], name: "DICH_VU_MaDV"}),
	unique("UQ_DICH_VU_Ten").on(table.tenDv),
	check("CK_DICH_VU_Gia", sql`(\`GiaDV\` >= 0)`),
]);

export const donPhong = mysqlTable("DON_PHONG", {
	maDon: char("MaDon", { length: 10 }).notNull(),
	maPhong: char("MaPhong", { length: 10 }).notNull().references(() => phong.maPhong, { onDelete: "restrict", onUpdate: "cascade" } ),
	maTk: char("MaTK", { length: 10 }).notNull().references(() => taiKhoan.maTk, { onDelete: "restrict", onUpdate: "cascade" } ),
	thoiGian: datetime("ThoiGian", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	ghiChu: varchar("GhiChu", { length: 200 }),
},
(table) => [
	index("IX_DON_PHONG_MaPhong_ThoiGian").on(table.maPhong, table.thoiGian),
	primaryKey({ columns: [table.maDon], name: "DON_PHONG_MaDon"}),
]);

export const hoaDon = mysqlTable("HOA_DON", {
	maHoaDon: char("MaHoaDon", { length: 10 }).notNull(),
	maDatPhong: char("MaDatPhong", { length: 10 }).notNull().references(() => phieuDatPhong.maDatPhong, { onDelete: "restrict", onUpdate: "cascade" } ),
	ngayLap: datetime("NgayLap", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	tongTien: decimal("TongTien", { precision: 18, scale: 2 }).default('0.00').notNull(),
	loaiThanhToan: varchar("LoaiThanhToan", { length: 20 }),
	trangThai: varchar("TrangThai", { length: 20 }).default('ChuaThanhToan').notNull(),
},
(table) => [
	index("IX_HOA_DON_TrangThai").on(table.trangThai),
	primaryKey({ columns: [table.maHoaDon], name: "HOA_DON_MaHoaDon"}),
	unique("UQ_HOA_DON_MaDatPhong").on(table.maDatPhong),
	check("CK_HOA_DON_LoaiThanhToan", sql`((\`LoaiThanhToan\` is null) or (\`LoaiThanhToan\` in (_utf8mb4\'TienMat\',_utf8mb4\'ChuyenKhoan\',_utf8mb4\'The\')))`),
	check("CK_HOA_DON_ThanhToanHopLe", sql`((\`TrangThai\` <> _utf8mb4\'DaThanhToan\') or (\`LoaiThanhToan\` is not null))`),
	check("CK_HOA_DON_TongTien", sql`(\`TongTien\` >= 0)`),
	check("CK_HOA_DON_TrangThai", sql`(\`TrangThai\` in (_utf8mb4\'ChuaThanhToan\',_utf8mb4\'DaThanhToan\',_utf8mb4\'DaHuy\'))`),
]);

export const khachHang = mysqlTable("KHACH_HANG", {
	maKh: char("MaKH", { length: 10 }).notNull(),
	hoTen: varchar("HoTen", { length: 100 }).notNull(),
	cccd: varchar("CCCD", { length: 20 }).notNull(),
	sdt: varchar("SDT", { length: 15 }),
	email: varchar("Email", { length: 100 }),
},
(table) => [
	primaryKey({ columns: [table.maKh], name: "KHACH_HANG_MaKH"}),
	unique("UQ_KHACH_HANG_CCCD").on(table.cccd),
	unique("UQ_KHACH_HANG_Email").on(table.email),
]);

export const loaiPhong = mysqlTable("LOAI_PHONG", {
	maLoaiPhong: char("MaLoaiPhong", { length: 10 }).notNull(),
	tenLoaiPhong: varchar("TenLoaiPhong", { length: 50 }).notNull(),
	donGiaNgay: decimal("DonGiaNgay", { precision: 18, scale: 2 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.maLoaiPhong], name: "LOAI_PHONG_MaLoaiPhong"}),
	unique("UQ_LOAI_PHONG_Ten").on(table.tenLoaiPhong),
	check("CK_LOAI_PHONG_DonGia", sql`(\`DonGiaNgay\` >= 0)`),
]);

export const loaiTaiKhoan = mysqlTable("LOAI_TAI_KHOAN", {
	maLoaiTk: char("MaLoaiTK", { length: 10 }).notNull(),
	tenLoaiTk: varchar("TenLoaiTK", { length: 50 }).notNull(),
	moTa: varchar("MoTa", { length: 200 }),
},
(table) => [
	primaryKey({ columns: [table.maLoaiTk], name: "LOAI_TAI_KHOAN_MaLoaiTK"}),
	unique("UQ_LOAI_TAI_KHOAN_Ten").on(table.tenLoaiTk),
]);

export const phieuDatPhong = mysqlTable("PHIEU_DAT_PHONG", {
	maDatPhong: char("MaDatPhong", { length: 10 }).notNull(),
	maKh: char("MaKH", { length: 10 }).notNull().references(() => khachHang.maKh, { onDelete: "restrict", onUpdate: "cascade" } ),
	maTk: char("MaTK", { length: 10 }).notNull().references(() => taiKhoan.maTk, { onDelete: "restrict", onUpdate: "cascade" } ),
	ngayLap: datetime("NgayLap", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	ngayCheckIn: date("NgayCheckIn", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	ngayCheckOut: date("NgayCheckOut", { mode: 'string' }).notNull(),
	tienCoc: decimal("TienCoc", { precision: 18, scale: 2 }).default('0.00').notNull(),
	trangThai: varchar("TrangThai", { length: 20 }).default('DaDat').notNull(),
},
(table) => [
	index("IX_PHIEU_DAT_PHONG_MaKH").on(table.maKh),
	index("IX_PHIEU_DAT_PHONG_Ngay").on(table.ngayCheckIn, table.ngayCheckOut),
	primaryKey({ columns: [table.maDatPhong], name: "PHIEU_DAT_PHONG_MaDatPhong"}),
	check("CK_PHIEU_DAT_PHONG_Ngay", sql`(\`NgayCheckOut\` > \`NgayCheckIn\`)`),
	check("CK_PHIEU_DAT_PHONG_TienCoc", sql`(\`TienCoc\` >= 0)`),
	check("CK_PHIEU_DAT_PHONG_TrangThai", sql`(\`TrangThai\` in (_utf8mb4\'DaDat\',_utf8mb4\'DangO\',_utf8mb4\'HoanTat\',_utf8mb4\'DaHuy\'))`),
]);

export const phong = mysqlTable("PHONG", {
	maPhong: char("MaPhong", { length: 10 }).notNull(),
	maLoaiPhong: char("MaLoaiPhong", { length: 10 }).notNull().references(() => loaiPhong.maLoaiPhong, { onDelete: "restrict", onUpdate: "cascade" } ),
	soPhong: varchar("SoPhong", { length: 10 }).notNull(),
	tang: int("Tang").notNull(),
	trangThai: varchar("TrangThai", { length: 20 }).default('Trong').notNull(),
},
(table) => [
	index("IX_PHONG_TrangThai").on(table.trangThai),
	primaryKey({ columns: [table.maPhong], name: "PHONG_MaPhong"}),
	unique("UQ_PHONG_SoPhong").on(table.soPhong),
	check("CK_PHONG_Tang", sql`(\`Tang\` >= 1)`),
	check("CK_PHONG_TrangThai", sql`(\`TrangThai\` in (_utf8mb4\'Trong\',_utf8mb4\'DaDat\',_utf8mb4\'DangSuDung\',_utf8mb4\'DangDon\',_utf8mb4\'BaoTri\'))`),
]);

export const suDungDichVu = mysqlTable("SU_DUNG_DICH_VU", {
	maSuDungDv: char("MaSuDungDV", { length: 10 }).notNull(),
	maDatPhong: char("MaDatPhong", { length: 10 }).notNull().references(() => phieuDatPhong.maDatPhong, { onDelete: "cascade", onUpdate: "cascade" } ),
	maDv: char("MaDV", { length: 10 }).notNull().references(() => dichVu.maDv, { onDelete: "restrict", onUpdate: "cascade" } ),
	ngaySuDung: datetime("NgaySuDung", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	soLuong: int("SoLuong").notNull(),
	donGiaThoiDiem: decimal("DonGiaThoiDiem", { precision: 18, scale: 2 }).notNull(),
	thanhTien: decimal("ThanhTien", { precision: 18, scale: 2 }).generatedAlwaysAs(sql`(\`SoLuong\` * \`DonGiaThoiDiem\`)`, { mode: "stored" }),
},
(table) => [
	index("IX_SU_DUNG_DICH_VU_MaDatPhong").on(table.maDatPhong),
	primaryKey({ columns: [table.maSuDungDv], name: "SU_DUNG_DICH_VU_MaSuDungDV"}),
	check("CK_SU_DUNG_DICH_VU_DonGia", sql`(\`DonGiaThoiDiem\` >= 0)`),
	check("CK_SU_DUNG_DICH_VU_SoLuong", sql`(\`SoLuong\` > 0)`),
]);

export const suaPhong = mysqlTable("SUA_PHONG", {
	maSua: char("MaSua", { length: 10 }).notNull(),
	maPhong: char("MaPhong", { length: 10 }).notNull().references(() => phong.maPhong, { onDelete: "restrict", onUpdate: "cascade" } ),
	maTk: char("MaTK", { length: 10 }).notNull().references(() => taiKhoan.maTk, { onDelete: "restrict", onUpdate: "cascade" } ),
	thoiGian: datetime("ThoiGian", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	chiPhi: decimal("ChiPhi", { precision: 18, scale: 2 }).default('0.00').notNull(),
	moTaLoi: varchar("MoTaLoi", { length: 200 }),
},
(table) => [
	index("IX_SUA_PHONG_MaPhong_ThoiGian").on(table.maPhong, table.thoiGian),
	primaryKey({ columns: [table.maSua], name: "SUA_PHONG_MaSua"}),
	check("CK_SUA_PHONG_ChiPhi", sql`(\`ChiPhi\` >= 0)`),
]);

export const taiKhoan = mysqlTable("TAI_KHOAN", {
	maTk: char("MaTK", { length: 10 }).notNull(),
	maLoaiTk: char("MaLoaiTK", { length: 10 }).notNull().references(() => loaiTaiKhoan.maLoaiTk, { onDelete: "restrict", onUpdate: "cascade" } ),
	tenDangNhap: varchar("TenDangNhap", { length: 50 }).notNull(),
	matKhau: varchar("MatKhau", { length: 255 }).notNull(),
	hoTen: varchar("HoTen", { length: 100 }).notNull(),
	trangThai: varchar("TrangThai", { length: 20 }).default('DangLamViec').notNull(),
},
(table) => [
	primaryKey({ columns: [table.maTk], name: "TAI_KHOAN_MaTK"}),
	unique("UQ_TAI_KHOAN_TenDangNhap").on(table.tenDangNhap),
	check("CK_TAI_KHOAN_TrangThai", sql`(\`TrangThai\` in (_utf8mb4\'DangLamViec\',_utf8mb4\'TamNghi\',_utf8mb4\'NghiViec\'))`),
]);
export const vPhieudatdanghieuluc = mysqlView("v_phieudatdanghieuluc", {
	maDatPhong: char("MaDatPhong", { length: 10 }).notNull(),
	maKh: char("MaKH", { length: 10 }).notNull(),
	tenKhachHang: varchar("TenKhachHang", { length: 100 }).notNull(),
	sdt: varchar("SDT", { length: 15 }),
	maTk: char("MaTK", { length: 10 }).notNull(),
	ngayLap: datetime("NgayLap", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	ngayCheckIn: date("NgayCheckIn", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	ngayCheckOut: date("NgayCheckOut", { mode: 'string' }).notNull(),
	soDem: int("SoDem"),
	tienCoc: decimal("TienCoc", { precision: 18, scale: 2 }).default('0.00').notNull(),
	trangThai: varchar("TrangThai", { length: 20 }).default('DaDat').notNull(),
	soPhongGiu: bigint("SoPhongGiu", { mode: "number" }).notNull(),
	danhSachPhong: text("DanhSachPhong"),
}).algorithm("undefined").sqlSecurity("definer").as(sql`select \`pd\`.\`MaDatPhong\` AS \`MaDatPhong\`,\`pd\`.\`MaKH\` AS \`MaKH\`,\`kh\`.\`HoTen\` AS \`TenKhachHang\`,\`kh\`.\`SDT\` AS \`SDT\`,\`pd\`.\`MaTK\` AS \`MaTK\`,\`pd\`.\`NgayLap\` AS \`NgayLap\`,\`pd\`.\`NgayCheckIn\` AS \`NgayCheckIn\`,\`pd\`.\`NgayCheckOut\` AS \`NgayCheckOut\`,(to_days(\`pd\`.\`NgayCheckOut\`) - to_days(\`pd\`.\`NgayCheckIn\`)) AS \`SoDem\`,\`pd\`.\`TienCoc\` AS \`TienCoc\`,\`pd\`.\`TrangThai\` AS \`TrangThai\`,count(\`ct\`.\`MaPhong\`) AS \`SoPhongGiu\`,group_concat(\`p\`.\`SoPhong\` order by \`p\`.\`SoPhong\` ASC separator ', ') AS \`DanhSachPhong\` from (((\`quanlykhachsan\`.\`phieu_dat_phong\` \`pd\` join \`quanlykhachsan\`.\`khach_hang\` \`kh\` on((\`kh\`.\`MaKH\` = \`pd\`.\`MaKH\`))) left join \`quanlykhachsan\`.\`chi_tiet_dat_phong\` \`ct\` on((\`ct\`.\`MaDatPhong\` = \`pd\`.\`MaDatPhong\`))) left join \`quanlykhachsan\`.\`phong\` \`p\` on((\`p\`.\`MaPhong\` = \`ct\`.\`MaPhong\`))) where (\`pd\`.\`TrangThai\` in ('DaDat','DangO')) group by \`pd\`.\`MaDatPhong\`,\`pd\`.\`MaKH\`,\`kh\`.\`HoTen\`,\`kh\`.\`SDT\`,\`pd\`.\`MaTK\`,\`pd\`.\`NgayLap\`,\`pd\`.\`NgayCheckIn\`,\`pd\`.\`NgayCheckOut\`,\`pd\`.\`TienCoc\`,\`pd\`.\`TrangThai\``);

export const vPhongkhadung = mysqlView("v_phongkhadung", {
	maPhong: char("MaPhong", { length: 10 }).notNull(),
	soPhong: varchar("SoPhong", { length: 10 }).notNull(),
	tang: int("Tang").notNull(),
	maLoaiPhong: char("MaLoaiPhong", { length: 10 }).notNull(),
	tenLoaiPhong: varchar("TenLoaiPhong", { length: 50 }).notNull(),
	donGiaNgay: decimal("DonGiaNgay", { precision: 18, scale: 2 }).notNull(),
	trangThai: varchar("TrangThai", { length: 20 }).default('Trong').notNull(),
}).algorithm("undefined").sqlSecurity("definer").as(sql`select \`p\`.\`MaPhong\` AS \`MaPhong\`,\`p\`.\`SoPhong\` AS \`SoPhong\`,\`p\`.\`Tang\` AS \`Tang\`,\`p\`.\`MaLoaiPhong\` AS \`MaLoaiPhong\`,\`lp\`.\`TenLoaiPhong\` AS \`TenLoaiPhong\`,\`lp\`.\`DonGiaNgay\` AS \`DonGiaNgay\`,\`p\`.\`TrangThai\` AS \`TrangThai\` from (\`quanlykhachsan\`.\`phong\` \`p\` join \`quanlykhachsan\`.\`loai_phong\` \`lp\` on((\`lp\`.\`MaLoaiPhong\` = \`p\`.\`MaLoaiPhong\`))) where (\`p\`.\`TrangThai\` not in ('DangDon','BaoTri'))`);

export const vTinhtrangphonghomnay = mysqlView("v_tinhtrangphonghomnay", {
	maPhong: char("MaPhong", { length: 10 }).notNull(),
	soPhong: varchar("SoPhong", { length: 10 }).notNull(),
	tang: int("Tang").notNull(),
	tenLoaiPhong: varchar("TenLoaiPhong", { length: 50 }).notNull(),
	trangThai: varchar("TrangThai", { length: 20 }).default('Trong').notNull(),
	maDatPhong: char("MaDatPhong", { length: 10 }),
	khachLuuTru: varchar("KhachLuuTru", { length: 100 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	ngayCheckIn: date("NgayCheckIn", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	ngayCheckOut: date("NgayCheckOut", { mode: 'string' }),
}).algorithm("undefined").sqlSecurity("definer").as(sql`select \`p\`.\`MaPhong\` AS \`MaPhong\`,\`p\`.\`SoPhong\` AS \`SoPhong\`,\`p\`.\`Tang\` AS \`Tang\`,\`lp\`.\`TenLoaiPhong\` AS \`TenLoaiPhong\`,\`p\`.\`TrangThai\` AS \`TrangThai\`,\`hn\`.\`MaDatPhong\` AS \`MaDatPhong\`,\`kh\`.\`HoTen\` AS \`KhachLuuTru\`,\`hn\`.\`NgayCheckIn\` AS \`NgayCheckIn\`,\`hn\`.\`NgayCheckOut\` AS \`NgayCheckOut\` from (((\`quanlykhachsan\`.\`phong\` \`p\` join \`quanlykhachsan\`.\`loai_phong\` \`lp\` on((\`lp\`.\`MaLoaiPhong\` = \`p\`.\`MaLoaiPhong\`))) left join (select \`ct\`.\`MaPhong\` AS \`MaPhong\`,\`pd\`.\`MaDatPhong\` AS \`MaDatPhong\`,\`pd\`.\`MaKH\` AS \`MaKH\`,\`pd\`.\`NgayCheckIn\` AS \`NgayCheckIn\`,\`pd\`.\`NgayCheckOut\` AS \`NgayCheckOut\` from (\`quanlykhachsan\`.\`chi_tiet_dat_phong\` \`ct\` join \`quanlykhachsan\`.\`phieu_dat_phong\` \`pd\` on((\`pd\`.\`MaDatPhong\` = \`ct\`.\`MaDatPhong\`))) where ((\`pd\`.\`TrangThai\` in ('DaDat','DangO')) and (curdate() >= \`pd\`.\`NgayCheckIn\`) and (curdate() < \`pd\`.\`NgayCheckOut\`))) \`hn\` on((\`hn\`.\`MaPhong\` = \`p\`.\`MaPhong\`))) left join \`quanlykhachsan\`.\`khach_hang\` \`kh\` on((\`kh\`.\`MaKH\` = \`hn\`.\`MaKH\`)))`);