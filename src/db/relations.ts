import { relations } from "drizzle-orm/relations";
import { loaiPhong, bangGiaPhong, phieuDatPhong, chiTietDatPhong, phong, hoaDon, chiTietHoaDon, donPhong, taiKhoan, khachHang, dichVu, suDungDichVu, suaPhong, loaiTaiKhoan } from "./schema";

export const bangGiaPhongRelations = relations(bangGiaPhong, ({one}) => ({
	loaiPhong: one(loaiPhong, {
		fields: [bangGiaPhong.maLoaiPhong],
		references: [loaiPhong.maLoaiPhong]
	}),
}));

export const loaiPhongRelations = relations(loaiPhong, ({many}) => ({
	bangGiaPhongs: many(bangGiaPhong),
	phongs: many(phong),
}));

export const chiTietDatPhongRelations = relations(chiTietDatPhong, ({one}) => ({
	phieuDatPhong: one(phieuDatPhong, {
		fields: [chiTietDatPhong.maDatPhong],
		references: [phieuDatPhong.maDatPhong]
	}),
	phong: one(phong, {
		fields: [chiTietDatPhong.maPhong],
		references: [phong.maPhong]
	}),
}));

export const phieuDatPhongRelations = relations(phieuDatPhong, ({one, many}) => ({
	chiTietDatPhongs: many(chiTietDatPhong),
	hoaDons: many(hoaDon),
	khachHang: one(khachHang, {
		fields: [phieuDatPhong.maKh],
		references: [khachHang.maKh]
	}),
	taiKhoan: one(taiKhoan, {
		fields: [phieuDatPhong.maTk],
		references: [taiKhoan.maTk]
	}),
	suDungDichVus: many(suDungDichVu),
}));

export const phongRelations = relations(phong, ({one, many}) => ({
	chiTietDatPhongs: many(chiTietDatPhong),
	donPhongs: many(donPhong),
	loaiPhong: one(loaiPhong, {
		fields: [phong.maLoaiPhong],
		references: [loaiPhong.maLoaiPhong]
	}),
	suaPhongs: many(suaPhong),
}));

export const chiTietHoaDonRelations = relations(chiTietHoaDon, ({one}) => ({
	hoaDon: one(hoaDon, {
		fields: [chiTietHoaDon.maHoaDon],
		references: [hoaDon.maHoaDon]
	}),
}));

export const hoaDonRelations = relations(hoaDon, ({one, many}) => ({
	chiTietHoaDons: many(chiTietHoaDon),
	phieuDatPhong: one(phieuDatPhong, {
		fields: [hoaDon.maDatPhong],
		references: [phieuDatPhong.maDatPhong]
	}),
}));

export const donPhongRelations = relations(donPhong, ({one}) => ({
	phong: one(phong, {
		fields: [donPhong.maPhong],
		references: [phong.maPhong]
	}),
	taiKhoan: one(taiKhoan, {
		fields: [donPhong.maTk],
		references: [taiKhoan.maTk]
	}),
}));

export const taiKhoanRelations = relations(taiKhoan, ({one, many}) => ({
	donPhongs: many(donPhong),
	phieuDatPhongs: many(phieuDatPhong),
	suaPhongs: many(suaPhong),
	loaiTaiKhoan: one(loaiTaiKhoan, {
		fields: [taiKhoan.maLoaiTk],
		references: [loaiTaiKhoan.maLoaiTk]
	}),
}));

export const khachHangRelations = relations(khachHang, ({many}) => ({
	phieuDatPhongs: many(phieuDatPhong),
}));

export const suDungDichVuRelations = relations(suDungDichVu, ({one}) => ({
	dichVu: one(dichVu, {
		fields: [suDungDichVu.maDv],
		references: [dichVu.maDv]
	}),
	phieuDatPhong: one(phieuDatPhong, {
		fields: [suDungDichVu.maDatPhong],
		references: [phieuDatPhong.maDatPhong]
	}),
}));

export const dichVuRelations = relations(dichVu, ({many}) => ({
	suDungDichVus: many(suDungDichVu),
}));

export const suaPhongRelations = relations(suaPhong, ({one}) => ({
	phong: one(phong, {
		fields: [suaPhong.maPhong],
		references: [phong.maPhong]
	}),
	taiKhoan: one(taiKhoan, {
		fields: [suaPhong.maTk],
		references: [taiKhoan.maTk]
	}),
}));

export const loaiTaiKhoanRelations = relations(loaiTaiKhoan, ({many}) => ({
	taiKhoans: many(taiKhoan),
}));