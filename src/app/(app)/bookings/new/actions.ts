"use server";

import { traCuuPhongTrongAnToan } from "@/lib/queries/bookings";

/**
 * Form dat phong goi lai moi khi nguoi dung doi ngay, de so phong con trong
 * luon dung voi khoang ngay dang chon. Truoc day danh sach chi duoc tinh mot
 * lan tren may chu cho khoang ngay mac dinh roi giu nguyen, nen form bao so
 * phong trong sai ngay khi doi ngay.
 */
export async function traCuuPhongTrong(checkIn: string, checkOut: string) {
  return traCuuPhongTrongAnToan(checkIn, checkOut);
}
