import Link from "next/link";
import { Plus } from "lucide-react";

import { RoomFilter } from "@/components/rooms/room-filter";
import { Topbar } from "@/components/layout/topbar";
import { SectionCard } from "@/components/shared/section-card";
import { formatNgay, formatNgayGio, formatVnd } from "@/lib/format";
import { getPhongDangBaoTri } from "@/lib/queries/buong-phong";
import { getGioHienTai, getNgayHienTai } from "@/lib/queries/ngay";
import { getNhatKyBuongPhong, getSoDoPhong } from "@/lib/queries/rooms";

export default async function SoDoPhongPage() {
  const [homNay, gio, phong, nhatKy, baoTri] = await Promise.all([
    getNgayHienTai(),
    getGioHienTai(),
    getSoDoPhong(),
    getNhatKyBuongPhong(),
    getPhongDangBaoTri(),
  ]);

  // Danh sach loai phong cho o chon, lay tu chinh cac phong dang co.
  const loaiPhong = [...new Map(phong.map((p) => [p.tenLoaiPhong, p])).values()]
    .map((p) => ({ maLoaiPhong: p.tenLoaiPhong, tenLoaiPhong: p.tenLoaiPhong }))
    .sort((a, b) => a.tenLoaiPhong.localeCompare(b.tenLoaiPhong));
  const suCo = Object.fromEntries(baoTri.map((p) => [p.maPhong, p.phieu?.moTaLoi ?? ""]));

  return (
    <>
      <Topbar
        tieuDe="Sơ đồ phòng"
        phu={`Cập nhật ${gio} · ${formatNgay(homNay)} · bấm vào phòng để báo dọn / báo bảo trì`}
        hanhDong={
          <Link
            href="/bookings/new"
            className="bg-primary text-primary-foreground flex h-10 items-center gap-2 rounded-[10px] px-[18px] text-[13.5px] font-semibold no-underline"
          >
            <Plus size={16} strokeWidth={2} />
            <span>Tra cứu phòng trống</span>
          </Link>
        }
      />

      <main className="flex min-h-0 flex-grow flex-col gap-5 overflow-auto px-8 py-7">
        <RoomFilter phong={phong} loaiPhong={loaiPhong} suCo={suCo} />

        <SectionCard
          tieuDe="Nhật ký buồng phòng & sửa chữa"
          phu={`${nhatKy.length} ghi nhận`}
          hanhDong={
            <span className="flex gap-4 text-[12.5px] font-semibold">
              <Link href="/housekeeping" className="text-primary no-underline">
                Buồng phòng →
              </Link>
              <Link href="/maintenance" className="text-primary no-underline">
                Bảo trì →
              </Link>
            </span>
          }
        >
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-[11px] font-semibold tracking-[0.06em] text-[#857C73] uppercase">
                <th className="border-border border-b pb-[9px] font-semibold">Thời gian</th>
                <th className="border-border border-b pb-[9px] font-semibold">Phòng</th>
                <th className="border-border border-b pb-[9px] font-semibold">Loại ghi nhận</th>
                <th className="border-border border-b pb-[9px] font-semibold">Nhân viên</th>
                <th className="border-border border-b pb-[9px] font-semibold">Ghi chú</th>
                <th className="border-border border-b pb-[9px] text-right font-semibold">Chi phí</th>
              </tr>
            </thead>
            <tbody>
              {nhatKy.slice(0, 12).map((n, i) => (
                <tr key={`${n.loai}-${n.ngayGio}-${i}`} className="text-[13px]">
                  <td className="border-border border-b py-[11px] font-mono text-[12.5px]">
                    {formatNgayGio(n.ngayGio)}
                  </td>
                  <td className="border-border border-b py-[11px] font-mono text-[12.5px]">{n.soPhong}</td>
                  <td className="border-border border-b py-[11px]">
                    <span
                      className="rounded-full px-[9px] py-[3px] text-[11.5px] font-medium"
                      style={
                        n.loai === "DonPhong"
                          ? { color: "#5B4B85", background: "#ECE9F5" }
                          : { color: "#8C3A31", background: "#F8E8E5" }
                      }
                    >
                      {n.loai === "DonPhong" ? "Dọn phòng" : "Sửa chữa"}
                    </span>
                  </td>
                  <td className="border-border border-b py-[11px]">{n.nhanVien}</td>
                  <td className="border-border text-muted-foreground border-b py-[11px]">{n.ghiChu}</td>
                  <td className="border-border border-b py-[11px] text-right font-mono text-[12.5px]">
                    {n.chiPhi === null ? "—" : formatVnd(n.chiPhi)}
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
