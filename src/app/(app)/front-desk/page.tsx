import { BookingPicker } from "@/components/front-desk/booking-picker";
import { Topbar } from "@/components/layout/topbar";
import { formatNgay } from "@/lib/format";
import { getPhieuDangO, getPhieuNhanHomNay } from "@/lib/queries/bookings";
import { getNgayHienTai } from "@/lib/queries/ngay";

export default async function LeTanPage() {
  const [homNay, nhan, dangO] = await Promise.all([
    getNgayHienTai(),
    getPhieuNhanHomNay(),
    getPhieuDangO(),
  ]);

  // Tab Tra phong liet ke MOI phieu dang o (sp_TraPhong cho tra som), phieu
  // den han hom nay len truoc. Co vay phieu vua nhan phong hom nay moi di tiep
  // duoc toi lap hoa don / tra phong ngay tren man nay.
  const tra = [...dangO].sort(
    (a, b) => a.ngayCheckOut.localeCompare(b.ngayCheckOut) || a.maDatPhong.localeCompare(b.maDatPhong),
  );
  const traHomNay = tra.filter((p) => p.ngayCheckOut === homNay).length;

  return (
    <>
      <Topbar
        tieuDe="Nhận & trả phòng"
        phu={`${formatNgay(homNay)} · ${nhan.length} lượt nhận · ${traHomNay} lượt trả`}
      />
      <main className="flex min-h-0 flex-grow overflow-auto px-8 py-7">
        <BookingPicker nhan={nhan} tra={tra} homNay={homNay} />
      </main>
    </>
  );
}
