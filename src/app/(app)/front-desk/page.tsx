import { BookingPicker } from "@/components/front-desk/booking-picker";
import { Topbar } from "@/components/layout/topbar";
import { formatNgay } from "@/lib/format";
import { getPhieuNhanHomNay, getPhieuTraHomNay } from "@/lib/queries/bookings";
import { getNgayHienTai } from "@/lib/queries/ngay";

export default async function LeTanPage() {
  const [homNay, nhan, tra] = await Promise.all([
    getNgayHienTai(),
    getPhieuNhanHomNay(),
    getPhieuTraHomNay(),
  ]);

  return (
    <>
      <Topbar
        tieuDe="Nhận & trả phòng"
        phu={`${formatNgay(homNay)} · ${nhan.length} lượt nhận · ${tra.length} lượt trả`}
      />
      <main className="flex min-h-0 flex-grow overflow-auto px-8 py-7">
        <BookingPicker nhan={nhan} tra={tra} />
      </main>
    </>
  );
}
