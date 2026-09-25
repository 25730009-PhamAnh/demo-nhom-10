import { CustomerTable } from "@/components/customers/customer-table";
import { StatCard } from "@/components/shared/stat-card";
import { Topbar } from "@/components/layout/topbar";
import { formatSo } from "@/lib/format";
import { getDanhSachKhachHang, getThongKeKhachHang } from "@/lib/queries/customers";

export default async function KhachHangPage() {
  const [khach, thongKe] = await Promise.all([
    getDanhSachKhachHang(),
    getThongKeKhachHang(),
  ]);

  return (
    <>
      <Topbar
        tieuDe="Khách hàng"
        phu={`${formatSo(thongKe.tongHoSo)} hồ sơ · định danh bằng CCCD duy nhất`}
      />

      <main className="flex min-h-0 flex-grow flex-col gap-5 overflow-auto px-8 py-7">
        <section className="flex shrink-0 gap-5">
          <StatCard
            nhan="Tổng hồ sơ khách"
            giaTri={formatSo(thongKe.tongHoSo)}
            phu="Định danh bằng CCCD duy nhất"
          />
          <StatCard
            nhan="Khách mới tháng 09"
            giaTri={formatSo(thongKe.khachMoiThangNay)}
            phu="Có phiếu đặt đầu tiên trong tháng"
          />
          <StatCard
            nhan="Đang lưu trú"
            giaTri={formatSo(thongKe.dangLuuTru)}
            phu="Khách có phiếu đang ở"
          />
          <StatCard
            nhan="Tỷ lệ quay lại"
            giaTri={`${thongKe.tyLeQuayLai}%`}
            phu="Khách có từ 2 lần lưu trú"
          />
        </section>

        <CustomerTable khach={khach} />
      </main>
    </>
  );
}
