import Link from "next/link";

import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Topbar } from "@/components/layout/topbar";
import { formatNgayGio, formatVnd } from "@/lib/format";
import { getDanhSachHoaDon } from "@/lib/queries/invoices";

export default async function DanhSachHoaDonPage() {
  const hoaDon = await getDanhSachHoaDon();

  return (
    <>
      <Topbar
        tieuDe="Hóa đơn"
        phu={`${hoaDon.length} hóa đơn · mới nhất lên đầu`}
        hanhDong={
          <span className="text-muted-foreground text-[12.5px]">
            {hoaDon.filter((h) => h.trangThai === "ChuaThanhToan").length} hóa đơn chưa
            thanh toán
          </span>
        }
      />

      <main className="flex min-h-0 flex-grow flex-col overflow-auto px-8 py-7">
        <SectionCard tieuDe="Danh sách hóa đơn" className="min-h-0 flex-grow">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-[11px] font-semibold tracking-[0.06em] text-[#857C73] uppercase">
                <th className="border-border border-b pb-[9px] font-semibold">Mã hóa đơn</th>
                <th className="border-border border-b pb-[9px] font-semibold">Phiếu đặt</th>
                <th className="border-border border-b pb-[9px] font-semibold">Khách hàng</th>
                <th className="border-border border-b pb-[9px] font-semibold">Ngày lập</th>
                <th className="border-border border-b pb-[9px] text-right font-semibold">
                  Tổng tiền
                </th>
                <th className="border-border border-b pb-[9px] font-semibold">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {hoaDon.map((h) => (
                <tr key={h.maHoaDon} className="text-[13px]">
                  <td className="border-border border-b py-[11px]">
                    <Link
                      href={`/invoices/${h.maHoaDon}`}
                      className="text-primary font-mono text-[12.5px] font-semibold no-underline hover:underline"
                    >
                      {h.maHoaDon}
                    </Link>
                  </td>
                  <td className="border-border border-b py-[11px] font-mono text-[12.5px]">
                    {h.maDatPhong}
                  </td>
                  <td className="border-border border-b py-[11px]">{h.hoTenKhach}</td>
                  <td className="border-border border-b py-[11px] font-mono text-[12.5px]">
                    {formatNgayGio(h.ngayLap)}
                  </td>
                  <td className="border-border border-b py-[11px] text-right font-mono text-[12.5px]">
                    {formatVnd(h.tongTien)}
                  </td>
                  <td className="border-border border-b py-[11px]">
                    <StatusBadge trangThai={h.trangThai} loai="hoaDon" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      </main>
    </>
  );
}
