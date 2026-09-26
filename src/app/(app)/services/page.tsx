import { ServiceUsageForm } from "@/components/services/service-usage-form";
import { SectionCard } from "@/components/shared/section-card";
import { Topbar } from "@/components/layout/topbar";
import { formatVnd } from "@/lib/format";
import { getPhieuDangO } from "@/lib/queries/bookings";
import { getDanhMucDichVu } from "@/lib/queries/services";

export default async function DichVuPage() {
  const [dichVu, phieu] = await Promise.all([getDanhMucDichVu(), getPhieuDangO()]);

  return (
    <>
      <Topbar
        tieuDe="Dịch vụ"
        phu="Danh mục & ghi nhận sử dụng trong thời gian lưu trú"
        hanhDong={
          <span className="text-muted-foreground text-[12.5px]">
            {dichVu.length} dịch vụ đang áp dụng
          </span>
        }
      />

      <main className="flex min-h-0 flex-grow gap-5 overflow-auto px-8 py-7">
        <SectionCard
          tieuDe="Danh mục dịch vụ"
          phu={`${dichVu.length} dịch vụ`}
          className="min-h-0 flex-grow"
        >
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-[11px] font-semibold tracking-[0.06em] text-[#857C73] uppercase">
                <th className="border-border border-b pb-[9px] font-semibold">Mã DV</th>
                <th className="border-border border-b pb-[9px] font-semibold">Tên dịch vụ</th>
                <th className="border-border border-b pb-[9px] font-semibold">Đơn vị tính</th>
                <th className="border-border border-b pb-[9px] text-right font-semibold">
                  Đơn giá
                </th>
              </tr>
            </thead>
            <tbody>
              {dichVu.map((d) => (
                <tr key={d.maDv} className="text-[13px]">
                  <td className="border-border border-b py-[11px] font-mono text-[12.5px]">
                    {d.maDv}
                  </td>
                  <td className="border-border border-b py-[11px] font-medium">{d.tenDv}</td>
                  <td className="border-border text-muted-foreground border-b py-[11px]">
                    {d.donViTinh}
                  </td>
                  <td className="border-border border-b py-[11px] text-right font-mono text-[12.5px]">
                    {formatVnd(d.giaDv)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <ServiceUsageForm
          dichVu={dichVu.map((d) => ({
            maDv: d.maDv,
            tenDv: d.tenDv,
            donViTinh: d.donViTinh,
            giaDv: d.giaDv,
          }))}
          phieu={phieu.map((p) => ({
            maDatPhong: p.maDatPhong,
            hoTenKhach: p.hoTenKhach,
            soPhong: p.soPhong,
          }))}
        />
      </main>
    </>
  );
}
