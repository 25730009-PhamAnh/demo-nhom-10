import { BookingForm } from "@/components/bookings/booking-form";
import { Topbar } from "@/components/layout/topbar";
import { NGAY_HIEN_TAI } from "@/lib/mock/now";
import { getLoaiPhongConTrong } from "@/lib/queries/bookings";
import { getDanhSachKhachHang } from "@/lib/queries/customers";

/** Khoang ngay mac dinh cua form: nhan hom nay, tra sau hai dem. */
function sauHaiDem(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 2);
  return d.toISOString().slice(0, 10);
}

export default async function DatPhongPage() {
  const [loaiPhong, khach] = await Promise.all([
    getLoaiPhongConTrong(NGAY_HIEN_TAI, sauHaiDem(NGAY_HIEN_TAI)),
    getDanhSachKhachHang(),
  ]);

  return (
    <>
      <Topbar
        tieuDe="Lập phiếu đặt phòng"
        phu="Phiếu mới · chưa lưu"
        hanhDong={
          <span className="text-muted-foreground text-[12.5px]">
            Dữ liệu giả — phiếu không được lưu
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
          ngayMacDinh={NGAY_HIEN_TAI}
        />
      </main>
    </>
  );
}
