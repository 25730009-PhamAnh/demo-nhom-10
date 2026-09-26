import { BookingForm } from "@/components/bookings/booking-form";
import { Topbar } from "@/components/layout/topbar";
import { getLoaiPhongConTrong } from "@/lib/queries/bookings";
import { getDanhSachKhachHang } from "@/lib/queries/customers";
import { getNgayHienTai } from "@/lib/queries/ngay";

/** Khoang ngay mac dinh cua form: nhan hom nay, tra sau hai dem. */
function sauHaiDem(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 2);
  return d.toISOString().slice(0, 10);
}

export default async function DatPhongPage() {
  const homNay = await getNgayHienTai();
  const [loaiPhong, khach] = await Promise.all([
    getLoaiPhongConTrong(homNay, sauHaiDem(homNay)),
    getDanhSachKhachHang(),
  ]);

  return (
    <>
      <Topbar
        tieuDe="Lập phiếu đặt phòng"
        phu="Phiếu mới · chưa lưu"
        hanhDong={
          <span className="text-muted-foreground text-[12.5px]">
            Chức năng lưu phiếu chưa được nối với CSDL
          </span>
        }
      />

      <main className="flex min-h-0 flex-grow overflow-auto px-8 py-7">
        <BookingForm
          loaiPhong={loaiPhong}
          khach={khach.slice(0, 30).map((k) => ({
            maKh: k.maKh,
            hoTen: k.hoTen,
            cccd: k.cccd,
            sdt: k.sdt,
          }))}
          ngayMacDinh={homNay}
        />
      </main>
    </>
  );
}
