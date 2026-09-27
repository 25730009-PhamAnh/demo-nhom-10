import { BookingForm } from "@/components/bookings/booking-form";
import { Topbar } from "@/components/layout/topbar";
import { getLoaiPhongConTrong } from "@/lib/queries/bookings";
import { getNgayHienTai } from "@/lib/queries/ngay";

/** Khoang ngay mac dinh cua form: nhan hom nay, tra sau hai dem. */
function sauHaiDem(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 2);
  return d.toISOString().slice(0, 10);
}

export default async function DatPhongPage() {
  const homNay = await getNgayHienTai();
  // Khach khong nap san: buoc 1 tim khach qua Server Action timKhach.
  const loaiPhong = await getLoaiPhongConTrong(homNay, sauHaiDem(homNay));

  return (
    <>
      <Topbar tieuDe="Lập phiếu đặt phòng" phu="Phiếu mới · chọn khách, ngày và loại phòng" />

      <main className="flex min-h-0 flex-grow overflow-auto px-8 py-7">
        <BookingForm loaiPhong={loaiPhong} ngayMacDinh={homNay} />
      </main>
    </>
  );
}
