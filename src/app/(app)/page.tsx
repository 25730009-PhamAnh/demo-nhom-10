import Link from "next/link";
import { AlertTriangle, ArrowRight, ChevronRight, Clock, Home, Receipt } from "lucide-react";

import { ScheduleTable } from "@/components/dashboard/schedule-table";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { Topbar } from "@/components/layout/topbar";
import { formatNgay, formatSo, formatVnd } from "@/lib/format";
import { NGAY_HIEN_TAI } from "@/lib/mock/now";
import { getPhieuNhanHomNay, getPhieuTraHomNay } from "@/lib/queries/bookings";
import { getChiSoTongQuan } from "@/lib/queries/reports";
import {
  getNhatKyBuongPhong,
  getSoDoPhong,
  getThongKePhongTheoTrangThai,
} from "@/lib/queries/rooms";
import { nhanTrangThaiPhong } from "@/lib/status";

const THU = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

export default async function TongQuanPage() {
  const [chiSo, thongKe, phong, nhan, tra, nhatKy] = await Promise.all([
    getChiSoTongQuan(),
    getThongKePhongTheoTrangThai(),
    getSoDoPhong(),
    getPhieuNhanHomNay(),
    getPhieuTraHomNay(),
    getNhatKyBuongPhong(),
  ]);

  const thu = THU[new Date(`${NGAY_HIEN_TAI}T00:00:00Z`).getUTCDay()];
  const phongChoDon = phong.filter((p) => p.trangThai === "DangDon");
  // Phieu sua chua chua co chi phi = viec dang xu ly, chua xong.
  const dangHong = nhatKy.filter((n) => n.loai === "SuaPhong" && n.chiPhi === "0.00");
  const tang = [...new Set(phong.map((p) => p.tang))].sort();

  return (
    <>
      <Topbar tieuDe="Tổng quan" phu={`${thu}, ${formatNgay(NGAY_HIEN_TAI)} · Ca sáng`} />

      <main className="flex min-h-0 flex-grow flex-col gap-5 overflow-auto px-8 py-7">
        <section className="flex shrink-0 gap-5">
          <StatCard
            nhan="Công suất hôm nay"
            giaTri={`${chiSo.congSuat}%`}
            phu={`${chiSo.soPhongDangSuDung}/${chiSo.soPhong} phòng đang sử dụng`}
          />
          <StatCard
            nhan="Khách đang lưu trú"
            giaTri={formatSo(chiSo.khachLuuTru)}
            phu={`${chiSo.soTraHomNay} phiếu trả hôm nay`}
          />
          <StatCard
            nhan="Doanh thu hôm nay"
            giaTri={formatVnd(chiSo.doanhThuHomNay)}
            kieuSo="tien"
            phu={`${chiSo.soHoaDonHomNay} hóa đơn đã thanh toán`}
          />
          <StatCard
            nhan="Nhận / Trả hôm nay"
            giaTri={`${chiSo.soNhanHomNay} / ${chiSo.soTraHomNay}`}
            phu={`${chiSo.hoaDonChuaThanhToan} hóa đơn chờ xử lý`}
            phuNoiBat
          />
        </section>

        <section className="flex h-[304px] shrink-0 gap-5">
          <SectionCard
            tieuDe="Tình trạng phòng · hôm nay"
            phu={`Tầng ${tang[0]}–${tang[tang.length - 1]} · ${phong.length} phòng`}
            hanhDong={
              <Link
                href="/rooms"
                className="text-primary flex items-center gap-[5px] text-[12.5px] font-semibold no-underline"
              >
                Sơ đồ đầy đủ
                <ArrowRight size={14} strokeWidth={2.2} />
              </Link>
            }
            className="w-[744px] shrink-0"
          >
            <div className="flex gap-2">
              {thongKe.map((t) => {
                const mau = nhanTrangThaiPhong(t.ma);
                return (
                  <div
                    key={t.ma}
                    className="flex flex-grow basis-0 flex-col gap-[2px] rounded-[9px] px-[11px] py-[7px]"
                    style={{ background: mau.bg }}
                  >
                    <div className="flex items-center gap-[6px]">
                      <span className="size-[7px] rounded-full" style={{ background: mau.dot }} />
                      <span
                        className="font-mono text-[15px] leading-none font-medium"
                        style={{ color: mau.fg }}
                      >
                        {t.soLuong}
                      </span>
                    </div>
                    <span className="text-[11px]" style={{ color: mau.fg }}>
                      {t.nhan}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-10 gap-2 overflow-auto">
              {phong.map((p) => {
                const mau = nhanTrangThaiPhong(p.trangThai);
                return (
                  <span
                    key={p.maPhong}
                    title={`${p.soPhong} · ${mau.nhan} · ${p.tenLoaiPhong}`}
                    className="flex h-[34px] items-center justify-center rounded-[7px] font-mono text-[11.5px]"
                    style={{ background: mau.bg, color: mau.fg }}
                  >
                    {p.soPhong}
                  </span>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard tieuDe="Cần xử lý hôm nay" className="min-w-0 flex-grow">
            <div className="flex flex-col gap-2">
              <ViecCanLam
                href="/front-desk"
                mau="#F7EFDD"
                mauChu="#8A5A0E"
                icon={<Clock size={18} strokeWidth={1.8} />}
                tieuDe={`${chiSo.soNhanHomNay} phiếu chờ nhận phòng`}
                phu="Xác nhận giấy tờ và gán phòng thực tế"
              />
              <ViecCanLam
                href="/rooms"
                mau="#ECE9F5"
                mauChu="#5B4B85"
                icon={<Home size={18} strokeWidth={1.8} />}
                tieuDe={`${phongChoDon.length} phòng chờ dọn`}
                phu={phongChoDon.map((p) => p.soPhong).join(" · ") || "Không có phòng nào"}
              />
              <ViecCanLam
                href="/rooms"
                mau="#F8E8E5"
                mauChu="#8C3A31"
                icon={<AlertTriangle size={18} strokeWidth={1.8} />}
                tieuDe={
                  dangHong.length > 0
                    ? `Phòng ${dangHong[0].soPhong} báo hỏng`
                    : "Không có phòng nào báo hỏng"
                }
                phu={dangHong[0]?.ghiChu ?? "Mọi thiết bị đang hoạt động"}
              />
              <ViecCanLam
                href="/invoices"
                mau="#FAF7F1"
                mauChu="#57504A"
                icon={<Receipt size={18} strokeWidth={1.8} />}
                tieuDe={`${chiSo.hoaDonChuaThanhToan} hóa đơn chưa thanh toán`}
                phu="Đối chiếu và thu tiền trước khi khách rời đi"
              />
            </div>
          </SectionCard>
        </section>

        <ScheduleTable nhan={nhan} tra={tra} />
      </main>
    </>
  );
}

function ViecCanLam({
  href,
  mau,
  mauChu,
  icon,
  tieuDe,
  phu,
}: {
  href: string;
  mau: string;
  mauChu: string;
  icon: React.ReactNode;
  tieuDe: string;
  phu: string;
}) {
  return (
    <Link
      href={href}
      className="flex h-12 items-center gap-[11px] rounded-[10px] px-3 no-underline"
      style={{ background: mau }}
    >
      <span className="shrink-0" style={{ color: mauChu }}>
        {icon}
      </span>
      <span className="flex flex-grow flex-col gap-px">
        <span className="text-foreground text-[13px] font-semibold">{tieuDe}</span>
        <span className="text-muted-foreground truncate text-[11.5px]">{phu}</span>
      </span>
      <ChevronRight size={15} strokeWidth={2.2} style={{ color: mauChu }} />
    </Link>
  );
}
