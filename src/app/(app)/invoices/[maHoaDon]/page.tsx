import { notFound } from "next/navigation";
import { Printer } from "lucide-react";

import { ThanhToanForm } from "@/components/invoices/thanh-toan-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { Topbar } from "@/components/layout/topbar";
import { formatNgay, formatNgayGio, formatVnd } from "@/lib/format";
import { congTien } from "@/lib/tinh-toan";
import { getHoaDon } from "@/lib/queries/invoices";

/** Nhan tieng Viet cho LoaiKhoanMuc; cot dau van hien dung ma tho nhu artboard. */
const DIEN_GIAI: Record<string, string> = {
  TienPhong: "Tiền phòng",
  DichVu: "Dịch vụ",
  PhuThu: "Phụ thu",
  GiamGia: "Giảm giá",
  GiamTru: "Giảm trừ",
  TongHop: "Tổng hợp",
};

export default async function HoaDonPage({
  params,
}: PageProps<"/invoices/[maHoaDon]">) {
  const { maHoaDon } = await params;
  const hd = await getHoaDon(maHoaDon);
  if (!hd) notFound();

  const tamTinh = congTien(
    ...hd.khoanMuc.filter((k) => Number(k.soTien) > 0).map((k) => k.soTien),
  );
  const giamTru = congTien(
    ...hd.khoanMuc.filter((k) => Number(k.soTien) < 0).map((k) => k.soTien),
  );

  return (
    <>
      <Topbar
        tieuDe={`Hóa đơn ${hd.maHoaDon}`}
        phu={`Lập lúc ${formatNgayGio(hd.ngayLap)} · phiếu ${hd.maDatPhong}`}
        hanhDong={
          <span className="border-border text-foreground flex h-10 items-center gap-2 rounded-[10px] border px-[18px] text-[13.5px]">
            <Printer size={16} strokeWidth={1.9} />
            In hóa đơn
          </span>
        }
      />

      <main className="flex min-h-0 flex-grow gap-5 overflow-auto px-8 py-7">
        <article className="bg-card border-border flex min-w-0 flex-grow flex-col gap-6 rounded-[14px] border px-10 py-9">
          <div className="flex items-start gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-display text-[19px] font-bold tracking-[0.07em]">
                SEN VÀNG
              </span>
              {/* Cho trong theo design/README.md — nhom tu dien, khong duoc bia. */}
              <span className="text-muted-foreground text-[11.5px]">
                [Địa chỉ khách sạn] · [Số điện thoại]
              </span>
              <span className="text-muted-foreground text-[11.5px]">
                Mã số thuế: [MST]
              </span>
            </div>
            <span className="flex-grow" />
            <div className="flex flex-col items-end gap-1">
              <span className="font-display text-[22px] font-semibold">HÓA ĐƠN</span>
              <span className="font-mono text-[12.5px]">Số: {hd.maHoaDon}</span>
              <span className="text-muted-foreground font-mono text-[12.5px]">
                Ngày lập: {formatNgay(hd.ngayLap)}
              </span>
            </div>
          </div>

          <div className="border-border grid grid-cols-2 gap-6 border-y py-5">
            <div className="flex flex-col gap-[6px]">
              <span className="text-[11px] tracking-[0.06em] text-[#857C73] uppercase">
                Khách hàng
              </span>
              <span className="text-[14px] font-semibold">{hd.khach.hoTen}</span>
              <span className="text-muted-foreground font-mono text-[11.5px]">
                {hd.khach.maKh} · CCCD {hd.khach.cccd} · {hd.khach.sdt}
              </span>
            </div>
            <div className="flex flex-col gap-[6px]">
              <span className="text-[11px] tracking-[0.06em] text-[#857C73] uppercase">
                Phiếu đặt phòng
              </span>
              <span className="font-mono text-[13px]">
                {hd.maDatPhong} · Phòng {hd.phieu.soPhong.join(", ")}
              </span>
              <span className="text-muted-foreground text-[11.5px]">
                {hd.phieu.tenLoaiPhong} · {formatNgay(hd.phieu.ngayCheckIn)} →{" "}
                {formatNgay(hd.phieu.ngayCheckOut)} · {hd.phieu.soDem} đêm
              </span>
            </div>
          </div>

          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-[11px] font-semibold tracking-[0.06em] text-[#857C73] uppercase">
                <th className="border-border border-b pb-[9px] font-semibold">Khoản mục</th>
                <th className="border-border border-b pb-[9px] font-semibold">Diễn giải</th>
                <th className="border-border border-b pb-[9px] text-right font-semibold">
                  Số tiền
                </th>
              </tr>
            </thead>
            <tbody>
              {hd.khoanMuc.map((k, i) => {
                const am = Number(k.soTien) < 0;
                return (
                  <tr key={`${k.loaiKhoanMuc}-${i}`} className="text-[13px]">
                    <td className="border-border border-b py-[11px] font-mono text-[12.5px]">
                      {k.loaiKhoanMuc}
                    </td>
                    <td className="border-border border-b py-[11px]">
                      {k.ghiChu ?? DIEN_GIAI[k.loaiKhoanMuc] ?? k.loaiKhoanMuc}
                    </td>
                    <td
                      className="border-border border-b py-[11px] text-right font-mono text-[12.5px]"
                      style={am ? { color: "#8C3A31" } : undefined}
                    >
                      {/* Khoan am giu nguyen dau tru, khong duoc bo di. */}
                      {formatVnd(k.soTien)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="ml-auto flex w-[320px] flex-col gap-[10px] text-[13px]">
            <div className="flex items-baseline gap-2">
              <span className="text-muted-foreground flex-grow">Cộng các khoản</span>
              <span className="font-mono text-[12.5px]">{formatVnd(tamTinh)}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-muted-foreground flex-grow">Giảm trừ &amp; giảm giá</span>
              <span className="font-mono text-[12.5px]" style={{ color: "#8C3A31" }}>
                {formatVnd(giamTru)}
              </span>
            </div>
            <div className="border-border flex items-baseline gap-2 border-t pt-3">
              <span className="flex-grow text-[14px] font-semibold">Tổng thanh toán</span>
              <span className="font-mono text-[20px] font-medium">
                {formatVnd(hd.tongTien)}
              </span>
            </div>
          </div>
        </article>

        <aside className="bg-card border-border flex w-[408px] shrink-0 flex-col gap-[18px] self-start rounded-[14px] border p-[22px]">
          <div className="flex items-center gap-3">
            <h2 className="m-0 flex-grow text-[15px] font-semibold">Thanh toán</h2>
            <StatusBadge trangThai={hd.trangThai} loai="hoaDon" />
          </div>
          <dl className="m-0 flex flex-col gap-[10px] text-[13px]">
            <div className="flex items-baseline gap-2">
              <dt className="text-muted-foreground flex-grow">Hình thức</dt>
              <dd className="m-0 font-mono text-[12.5px]">{hd.loaiThanhToan ?? "—"}</dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="text-muted-foreground flex-grow">Tổng thanh toán</dt>
              <dd className="m-0 font-mono text-[14px] font-medium">
                {formatVnd(hd.tongTien)}
              </dd>
            </div>
          </dl>
          <ThanhToanForm maHoaDon={hd.maHoaDon} trangThai={hd.trangThai} />
        </aside>
      </main>
    </>
  );
}
