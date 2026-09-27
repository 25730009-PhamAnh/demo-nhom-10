import Link from "next/link";
import { BedDouble } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { BaoTriBan } from "@/components/maintenance/bao-tri-ban";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { formatNgay, formatNgayGio, formatVnd } from "@/lib/format";
import { getNhanVienTheoLoai, getNhatKySua, getPhongDangBaoTri } from "@/lib/queries/buong-phong";
import { getNgayHienTai } from "@/lib/queries/ngay";
import { LOAI_TK_KY_THUAT } from "@/lib/vai-tro";

export default async function BaoTriPage() {
  const [homNay, nhanVien, baoTri, nhatKy] = await Promise.all([
    getNgayHienTai(),
    getNhanVienTheoLoai(LOAI_TK_KY_THUAT),
    getPhongDangBaoTri(),
    getNhatKySua(),
  ]);

  return (
    <>
      <Topbar
        tieuDe="Bảo trì"
        phu={`${baoTri.length} phòng đang bảo trì · ${formatNgay(homNay)}`}
        hanhDong={
          <Link
            href="/rooms"
            className="border-border bg-card text-primary flex h-10 items-center gap-2 rounded-[10px] border px-[18px] text-[13.5px] font-semibold no-underline"
          >
            <BedDouble size={16} strokeWidth={1.8} />
            <span>Sơ đồ phòng</span>
          </Link>
        }
      />

      <main className="flex min-h-0 flex-grow flex-col gap-5 overflow-auto px-8 py-7">
        <BaoTriBan nhanVien={nhanVien} baoTri={baoTri} />

        <SectionCard tieuDe="Nhật ký sửa chữa" phu={`${nhatKy.length} lần gần nhất`}>
          {nhatKy.length === 0 ? (
            <EmptyState thongDiep="Chưa có lần sửa chữa nào" />
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="text-[11px] font-semibold tracking-[0.06em] text-[#857C73] uppercase">
                  <th className="border-border border-b pb-[9px] font-semibold">Thời gian</th>
                  <th className="border-border border-b pb-[9px] font-semibold">Phòng</th>
                  <th className="border-border border-b pb-[9px] font-semibold">Nhân viên</th>
                  <th className="border-border border-b pb-[9px] font-semibold">Mô tả</th>
                  <th className="border-border border-b pb-[9px] text-right font-semibold">Chi phí</th>
                </tr>
              </thead>
              <tbody>
                {nhatKy.map((n) => (
                  <tr key={n.maSua} className="text-[13px]">
                    <td className="border-border border-b py-[11px] font-mono text-[12.5px]">
                      {formatNgayGio(n.thoiGian)}
                    </td>
                    <td className="border-border border-b py-[11px] font-mono text-[12.5px]">{n.soPhong}</td>
                    <td className="border-border border-b py-[11px]">{n.nhanVien}</td>
                    <td className="border-border text-muted-foreground border-b py-[11px]">{n.moTaLoi ?? ""}</td>
                    <td className="border-border border-b py-[11px] text-right font-mono text-[12.5px]">
                      {formatVnd(n.chiPhi)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      </main>
    </>
  );
}
