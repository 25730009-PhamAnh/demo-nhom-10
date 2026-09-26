import { PeriodPicker } from "@/components/reports/period-picker";
import { Topbar } from "@/components/layout/topbar";
import { formatNgay } from "@/lib/format";
import { getNgayHienTai } from "@/lib/queries/ngay";
import { getDoanhThuTheoThang } from "@/lib/queries/reports";

export default async function BaoCaoPage() {
  const [homNay, duLieu] = await Promise.all([getNgayHienTai(), getDoanhThuTheoThang()]);

  return (
    <>
      <Topbar
        tieuDe="Báo cáo doanh thu"
        phu={`Kỳ 12 tháng · tính đến ${formatNgay(homNay)}`}
        hanhDong={
          <span className="text-muted-foreground text-[12.5px]">
            Tổng hợp từ HOA_DON &amp; CHI_TIET_HOA_DON
          </span>
        }
      />
      <main className="flex min-h-0 flex-grow flex-col gap-5 overflow-auto px-8 py-7">
        <PeriodPicker duLieu={duLieu} />
      </main>
    </>
  );
}
