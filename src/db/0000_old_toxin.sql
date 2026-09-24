-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `BANG_GIA_PHONG` (
	`MaBangGia` char(10) NOT NULL,
	`MaLoaiPhong` char(10) NOT NULL,
	`HeSo` decimal(4,2) NOT NULL DEFAULT '1.00',
	`ApDungTuNgay` date NOT NULL,
	`DenNgay` date NOT NULL,
	`DonGia` decimal(18,2) NOT NULL,
	CONSTRAINT `BANG_GIA_PHONG_MaBangGia` PRIMARY KEY(`MaBangGia`),
	CONSTRAINT `CK_BANG_GIA_PHONG_DonGia` CHECK((`DonGia` >= 0)),
	CONSTRAINT `CK_BANG_GIA_PHONG_HeSo` CHECK((`HeSo` > 0)),
	CONSTRAINT `CK_BANG_GIA_PHONG_Ngay` CHECK((`DenNgay` >= `ApDungTuNgay`))
);
--> statement-breakpoint
CREATE TABLE `CHI_TIET_DAT_PHONG` (
	`MaDatPhong` char(10) NOT NULL,
	`MaPhong` char(10) NOT NULL,
	`GiaThueThoiDiem` decimal(18,2) NOT NULL,
	`SoDem` int NOT NULL,
	`ThanhTien` decimal(18,2) GENERATED ALWAYS AS ((`GiaThueThoiDiem` * `SoDem`)) STORED,
	CONSTRAINT `CHI_TIET_DAT_PHONG_MaDatPhong_MaPhong` PRIMARY KEY(`MaDatPhong`,`MaPhong`),
	CONSTRAINT `CK_CHI_TIET_DAT_PHONG_Gia` CHECK((`GiaThueThoiDiem` >= 0)),
	CONSTRAINT `CK_CHI_TIET_DAT_PHONG_SoDem` CHECK((`SoDem` > 0))
);
--> statement-breakpoint
CREATE TABLE `CHI_TIET_HOA_DON` (
	`MaCTHD` char(10) NOT NULL,
	`MaHoaDon` char(10) NOT NULL,
	`LoaiKhoanMuc` varchar(20) NOT NULL,
	`SoTien` decimal(18,2) NOT NULL,
	`GhiChu` varchar(200),
	CONSTRAINT `CHI_TIET_HOA_DON_MaCTHD` PRIMARY KEY(`MaCTHD`),
	CONSTRAINT `CK_CHI_TIET_HOA_DON_LoaiKhoanMuc` CHECK((`LoaiKhoanMuc` in (_utf8mb4\'TienPhong\',_utf8mb4\'DichVu\',_utf8mb4\'PhuThu\',_utf8mb4\'GiamGia\',_utf8mb4\'GiamTru\',_utf8mb4\'TongHop\'))),
	CONSTRAINT `CK_CHI_TIET_HOA_DON_SoTienTheoLoai` CHECK((((`LoaiKhoanMuc` in (_utf8mb4\'TienPhong\',_utf8mb4\'DichVu\',_utf8mb4\'PhuThu\',_utf8mb4\'TongHop\')) and (`SoTien` >= 0)) or ((`LoaiKhoanMuc` in (_utf8mb4\'GiamGia\',_utf8mb4\'GiamTru\')) and (`SoTien` <= 0))))
);
--> statement-breakpoint
CREATE TABLE `DICH_VU` (
	`MaDV` char(10) NOT NULL,
	`TenDV` varchar(100) NOT NULL,
	`DonViTinh` varchar(20),
	`GiaDV` decimal(18,2) NOT NULL,
	CONSTRAINT `DICH_VU_MaDV` PRIMARY KEY(`MaDV`),
	CONSTRAINT `UQ_DICH_VU_Ten` UNIQUE(`TenDV`),
	CONSTRAINT `CK_DICH_VU_Gia` CHECK((`GiaDV` >= 0))
);
--> statement-breakpoint
CREATE TABLE `DON_PHONG` (
	`MaDon` char(10) NOT NULL,
	`MaPhong` char(10) NOT NULL,
	`MaTK` char(10) NOT NULL,
	`ThoiGian` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`GhiChu` varchar(200),
	CONSTRAINT `DON_PHONG_MaDon` PRIMARY KEY(`MaDon`)
);
--> statement-breakpoint
CREATE TABLE `HOA_DON` (
	`MaHoaDon` char(10) NOT NULL,
	`MaDatPhong` char(10) NOT NULL,
	`NgayLap` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`TongTien` decimal(18,2) NOT NULL DEFAULT '0.00',
	`LoaiThanhToan` varchar(20),
	`TrangThai` varchar(20) NOT NULL DEFAULT 'ChuaThanhToan',
	CONSTRAINT `HOA_DON_MaHoaDon` PRIMARY KEY(`MaHoaDon`),
	CONSTRAINT `UQ_HOA_DON_MaDatPhong` UNIQUE(`MaDatPhong`),
	CONSTRAINT `CK_HOA_DON_LoaiThanhToan` CHECK(((`LoaiThanhToan` is null) or (`LoaiThanhToan` in (_utf8mb4\'TienMat\',_utf8mb4\'ChuyenKhoan\',_utf8mb4\'The\')))),
	CONSTRAINT `CK_HOA_DON_ThanhToanHopLe` CHECK(((`TrangThai` <> _utf8mb4\'DaThanhToan\') or (`LoaiThanhToan` is not null))),
	CONSTRAINT `CK_HOA_DON_TongTien` CHECK((`TongTien` >= 0)),
	CONSTRAINT `CK_HOA_DON_TrangThai` CHECK((`TrangThai` in (_utf8mb4\'ChuaThanhToan\',_utf8mb4\'DaThanhToan\',_utf8mb4\'DaHuy\')))
);
--> statement-breakpoint
CREATE TABLE `KHACH_HANG` (
	`MaKH` char(10) NOT NULL,
	`HoTen` varchar(100) NOT NULL,
	`CCCD` varchar(20) NOT NULL,
	`SDT` varchar(15),
	`Email` varchar(100),
	CONSTRAINT `KHACH_HANG_MaKH` PRIMARY KEY(`MaKH`),
	CONSTRAINT `UQ_KHACH_HANG_CCCD` UNIQUE(`CCCD`),
	CONSTRAINT `UQ_KHACH_HANG_Email` UNIQUE(`Email`)
);
--> statement-breakpoint
CREATE TABLE `LOAI_PHONG` (
	`MaLoaiPhong` char(10) NOT NULL,
	`TenLoaiPhong` varchar(50) NOT NULL,
	`DonGiaNgay` decimal(18,2) NOT NULL,
	CONSTRAINT `LOAI_PHONG_MaLoaiPhong` PRIMARY KEY(`MaLoaiPhong`),
	CONSTRAINT `UQ_LOAI_PHONG_Ten` UNIQUE(`TenLoaiPhong`),
	CONSTRAINT `CK_LOAI_PHONG_DonGia` CHECK((`DonGiaNgay` >= 0))
);
--> statement-breakpoint
CREATE TABLE `LOAI_TAI_KHOAN` (
	`MaLoaiTK` char(10) NOT NULL,
	`TenLoaiTK` varchar(50) NOT NULL,
	`MoTa` varchar(200),
	CONSTRAINT `LOAI_TAI_KHOAN_MaLoaiTK` PRIMARY KEY(`MaLoaiTK`),
	CONSTRAINT `UQ_LOAI_TAI_KHOAN_Ten` UNIQUE(`TenLoaiTK`)
);
--> statement-breakpoint
CREATE TABLE `PHIEU_DAT_PHONG` (
	`MaDatPhong` char(10) NOT NULL,
	`MaKH` char(10) NOT NULL,
	`MaTK` char(10) NOT NULL,
	`NgayLap` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`NgayCheckIn` date NOT NULL,
	`NgayCheckOut` date NOT NULL,
	`TienCoc` decimal(18,2) NOT NULL DEFAULT '0.00',
	`TrangThai` varchar(20) NOT NULL DEFAULT 'DaDat',
	CONSTRAINT `PHIEU_DAT_PHONG_MaDatPhong` PRIMARY KEY(`MaDatPhong`),
	CONSTRAINT `CK_PHIEU_DAT_PHONG_Ngay` CHECK((`NgayCheckOut` > `NgayCheckIn`)),
	CONSTRAINT `CK_PHIEU_DAT_PHONG_TienCoc` CHECK((`TienCoc` >= 0)),
	CONSTRAINT `CK_PHIEU_DAT_PHONG_TrangThai` CHECK((`TrangThai` in (_utf8mb4\'DaDat\',_utf8mb4\'DangO\',_utf8mb4\'HoanTat\',_utf8mb4\'DaHuy\')))
);
--> statement-breakpoint
CREATE TABLE `PHONG` (
	`MaPhong` char(10) NOT NULL,
	`MaLoaiPhong` char(10) NOT NULL,
	`SoPhong` varchar(10) NOT NULL,
	`Tang` int NOT NULL,
	`TrangThai` varchar(20) NOT NULL DEFAULT 'Trong',
	CONSTRAINT `PHONG_MaPhong` PRIMARY KEY(`MaPhong`),
	CONSTRAINT `UQ_PHONG_SoPhong` UNIQUE(`SoPhong`),
	CONSTRAINT `CK_PHONG_Tang` CHECK((`Tang` >= 1)),
	CONSTRAINT `CK_PHONG_TrangThai` CHECK((`TrangThai` in (_utf8mb4\'Trong\',_utf8mb4\'DaDat\',_utf8mb4\'DangSuDung\',_utf8mb4\'DangDon\',_utf8mb4\'BaoTri\')))
);
--> statement-breakpoint
CREATE TABLE `SU_DUNG_DICH_VU` (
	`MaSuDungDV` char(10) NOT NULL,
	`MaDatPhong` char(10) NOT NULL,
	`MaDV` char(10) NOT NULL,
	`NgaySuDung` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`SoLuong` int NOT NULL,
	`DonGiaThoiDiem` decimal(18,2) NOT NULL,
	`ThanhTien` decimal(18,2) GENERATED ALWAYS AS ((`SoLuong` * `DonGiaThoiDiem`)) STORED,
	CONSTRAINT `SU_DUNG_DICH_VU_MaSuDungDV` PRIMARY KEY(`MaSuDungDV`),
	CONSTRAINT `CK_SU_DUNG_DICH_VU_DonGia` CHECK((`DonGiaThoiDiem` >= 0)),
	CONSTRAINT `CK_SU_DUNG_DICH_VU_SoLuong` CHECK((`SoLuong` > 0))
);
--> statement-breakpoint
CREATE TABLE `SUA_PHONG` (
	`MaSua` char(10) NOT NULL,
	`MaPhong` char(10) NOT NULL,
	`MaTK` char(10) NOT NULL,
	`ThoiGian` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`ChiPhi` decimal(18,2) NOT NULL DEFAULT '0.00',
	`MoTaLoi` varchar(200),
	CONSTRAINT `SUA_PHONG_MaSua` PRIMARY KEY(`MaSua`),
	CONSTRAINT `CK_SUA_PHONG_ChiPhi` CHECK((`ChiPhi` >= 0))
);
--> statement-breakpoint
CREATE TABLE `TAI_KHOAN` (
	`MaTK` char(10) NOT NULL,
	`MaLoaiTK` char(10) NOT NULL,
	`TenDangNhap` varchar(50) NOT NULL,
	`MatKhau` varchar(255) NOT NULL,
	`HoTen` varchar(100) NOT NULL,
	`TrangThai` varchar(20) NOT NULL DEFAULT 'DangLamViec',
	CONSTRAINT `TAI_KHOAN_MaTK` PRIMARY KEY(`MaTK`),
	CONSTRAINT `UQ_TAI_KHOAN_TenDangNhap` UNIQUE(`TenDangNhap`),
	CONSTRAINT `CK_TAI_KHOAN_TrangThai` CHECK((`TrangThai` in (_utf8mb4\'DangLamViec\',_utf8mb4\'TamNghi\',_utf8mb4\'NghiViec\')))
);
--> statement-breakpoint
ALTER TABLE `BANG_GIA_PHONG` ADD CONSTRAINT `FK_BANG_GIA_PHONG_LOAI_PHONG` FOREIGN KEY (`MaLoaiPhong`) REFERENCES `LOAI_PHONG`(`MaLoaiPhong`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `CHI_TIET_DAT_PHONG` ADD CONSTRAINT `FK_CHI_TIET_DAT_PHONG_PHIEU_DAT_PHONG` FOREIGN KEY (`MaDatPhong`) REFERENCES `PHIEU_DAT_PHONG`(`MaDatPhong`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `CHI_TIET_DAT_PHONG` ADD CONSTRAINT `FK_CHI_TIET_DAT_PHONG_PHONG` FOREIGN KEY (`MaPhong`) REFERENCES `PHONG`(`MaPhong`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `CHI_TIET_HOA_DON` ADD CONSTRAINT `FK_CHI_TIET_HOA_DON_HOA_DON` FOREIGN KEY (`MaHoaDon`) REFERENCES `HOA_DON`(`MaHoaDon`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `DON_PHONG` ADD CONSTRAINT `FK_DON_PHONG_PHONG` FOREIGN KEY (`MaPhong`) REFERENCES `PHONG`(`MaPhong`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `DON_PHONG` ADD CONSTRAINT `FK_DON_PHONG_TAI_KHOAN` FOREIGN KEY (`MaTK`) REFERENCES `TAI_KHOAN`(`MaTK`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `HOA_DON` ADD CONSTRAINT `FK_HOA_DON_PHIEU_DAT_PHONG` FOREIGN KEY (`MaDatPhong`) REFERENCES `PHIEU_DAT_PHONG`(`MaDatPhong`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `PHIEU_DAT_PHONG` ADD CONSTRAINT `FK_PHIEU_DAT_PHONG_KHACH_HANG` FOREIGN KEY (`MaKH`) REFERENCES `KHACH_HANG`(`MaKH`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `PHIEU_DAT_PHONG` ADD CONSTRAINT `FK_PHIEU_DAT_PHONG_TAI_KHOAN` FOREIGN KEY (`MaTK`) REFERENCES `TAI_KHOAN`(`MaTK`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `PHONG` ADD CONSTRAINT `FK_PHONG_LOAI_PHONG` FOREIGN KEY (`MaLoaiPhong`) REFERENCES `LOAI_PHONG`(`MaLoaiPhong`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `SU_DUNG_DICH_VU` ADD CONSTRAINT `FK_SU_DUNG_DICH_VU_DICH_VU` FOREIGN KEY (`MaDV`) REFERENCES `DICH_VU`(`MaDV`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `SU_DUNG_DICH_VU` ADD CONSTRAINT `FK_SU_DUNG_DICH_VU_PHIEU_DAT_PHONG` FOREIGN KEY (`MaDatPhong`) REFERENCES `PHIEU_DAT_PHONG`(`MaDatPhong`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `SUA_PHONG` ADD CONSTRAINT `FK_SUA_PHONG_PHONG` FOREIGN KEY (`MaPhong`) REFERENCES `PHONG`(`MaPhong`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `SUA_PHONG` ADD CONSTRAINT `FK_SUA_PHONG_TAI_KHOAN` FOREIGN KEY (`MaTK`) REFERENCES `TAI_KHOAN`(`MaTK`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `TAI_KHOAN` ADD CONSTRAINT `FK_TAI_KHOAN_LOAI_TAI_KHOAN` FOREIGN KEY (`MaLoaiTK`) REFERENCES `LOAI_TAI_KHOAN`(`MaLoaiTK`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `IX_BANG_GIA_PHONG_Loai_Ngay` ON `BANG_GIA_PHONG` (`MaLoaiPhong`,`ApDungTuNgay`,`DenNgay`);--> statement-breakpoint
CREATE INDEX `IX_CHI_TIET_HOA_DON_MaHoaDon` ON `CHI_TIET_HOA_DON` (`MaHoaDon`);--> statement-breakpoint
CREATE INDEX `IX_DON_PHONG_MaPhong_ThoiGian` ON `DON_PHONG` (`MaPhong`,`ThoiGian`);--> statement-breakpoint
CREATE INDEX `IX_HOA_DON_TrangThai` ON `HOA_DON` (`TrangThai`);--> statement-breakpoint
CREATE INDEX `IX_PHIEU_DAT_PHONG_MaKH` ON `PHIEU_DAT_PHONG` (`MaKH`);--> statement-breakpoint
CREATE INDEX `IX_PHIEU_DAT_PHONG_Ngay` ON `PHIEU_DAT_PHONG` (`NgayCheckIn`,`NgayCheckOut`);--> statement-breakpoint
CREATE INDEX `IX_PHONG_TrangThai` ON `PHONG` (`TrangThai`);--> statement-breakpoint
CREATE INDEX `IX_SU_DUNG_DICH_VU_MaDatPhong` ON `SU_DUNG_DICH_VU` (`MaDatPhong`);--> statement-breakpoint
CREATE INDEX `IX_SUA_PHONG_MaPhong_ThoiGian` ON `SUA_PHONG` (`MaPhong`,`ThoiGian`);
*/