import { PeriodPicker } from "@/components/reports/period-picker";
import { Topbar } from "@/components/layout/topbar";
import { formatNgay } from "@/lib/format";
import { NGAY_HIEN_TAI } from "@/lib/mock/now";
import { getDoanhThuTheoThang } from "@/lib/queries/reports";

export default async function BaoCaoPage() {
  const duLieu = await getDoanhThuTheoThang();

  return (
    <>
      <Topbar
        tieuDe="Báo cáo doanh thu"
        phu={`Kỳ 12 tháng · tính đến ${formatNgay(NGAY_HIEN_TAI)}`}
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
