import { BookingPicker } from "@/components/front-desk/booking-picker";
import { Topbar } from "@/components/layout/topbar";
import { formatNgay } from "@/lib/format";
import { NGAY_HIEN_TAI } from "@/lib/mock/now";
import { getPhieuNhanHomNay, getPhieuTraHomNay } from "@/lib/queries/bookings";

export default async function LeTanPage() {
  const [nhan, tra] = await Promise.all([getPhieuNhanHomNay(), getPhieuTraHomNay()]);

  return (
    <>
      <Topbar
        tieuDe="Nhận & trả phòng"
        phu={`${formatNgay(NGAY_HIEN_TAI)} · ${nhan.length} lượt nhận · ${tra.length} lượt trả`}
      />
      <main className="flex min-h-0 flex-grow overflow-auto px-8 py-7">
        <BookingPicker nhan={nhan} tra={tra} />
      </main>
    </>
  );
}
