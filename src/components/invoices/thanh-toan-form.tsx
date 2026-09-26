"use client";

import { useState } from "react";
import Link from "next/link";

import { thanhToan } from "@/app/(app)/invoices/[maHoaDon]/actions";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";

/** Ba gia tri cua CK_HOA_DON_LoaiThanhToan. */
const HINH_THUC = [
  ["TienMat", "Tiền mặt"],
  ["ChuyenKhoan", "Chuyển khoản"],
  ["The", "Thẻ"],
] as const;

/**
 * Phan thanh toan cua trang chi tiet hoa don: chi hien khi hoa don con
 * ChuaThanhToan. Thanh toan xong trang tu doc lai CSDL va hien duong ve man
 * Nhan & tra phong, noi buoc tiep theo (tra phong) dang cho.
 */
export function ThanhToanForm({ maHoaDon, trangThai }: { maHoaDon: string; trangThai: string }) {
  const [loai, setLoai] = useState<string>(HINH_THUC[0][0]);
  const tt = useThaoTac();

  if (trangThai !== "ChuaThanhToan") {
    return (
      <>
        <ThongBao tb={tt.thongBao} />
        <Link href="/front-desk" className="text-primary text-[13px] font-semibold">
          Về Nhận & trả phòng →
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="flex gap-[6px]">
        {HINH_THUC.map(([ma, nhan]) => (
          <button
            key={ma}
            type="button"
            onClick={() => setLoai(ma)}
            aria-pressed={loai === ma}
            className={`h-9 flex-grow rounded-lg text-[12.5px] ${
              loai === ma
                ? "bg-primary text-primary-foreground font-semibold"
                : "border-border bg-card border text-[#57504A]"
            }`}
          >
            {nhan}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={tt.dangChay}
        onClick={() => tt.chay(() => thanhToan(maHoaDon, loai), () => `Đã thanh toán ${maHoaDon}.`)}
        className="bg-primary text-primary-foreground h-11 rounded-[10px] text-[13.5px] font-semibold disabled:opacity-45"
      >
        {tt.dangChay ? "Đang ghi…" : "Xác nhận thanh toán"}
      </button>
      <ThongBao tb={tt.thongBao} />
    </>
  );
}
