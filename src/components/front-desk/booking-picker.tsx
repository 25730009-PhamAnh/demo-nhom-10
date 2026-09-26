"use client";

import { useState } from "react";
import Link from "next/link";

import { huyPhieu, lapHoaDon, nhanPhong, thuThemCoc, traPhong } from "@/app/(app)/front-desk/actions";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";
import { formatNgay, formatVnd } from "@/lib/format";
import type { PhieuTomTat } from "@/lib/queries/bookings";
import { docSoTien } from "@/lib/tinh-toan";

type Tab = "nhan" | "tra";

/**
 * Danh sach phieu ben trai + khung chi tiet ben phai,
 * theo design/CheckInOut.dc.html dong 73-cuoi.
 *
 * Doi tab thi phieu dang chon nhay ve phieu dau cua danh sach moi, khong giu ma
 * cu (ma cu khong con trong danh sach thi khung ben phai se trong tron).
 *
 * Moi nut goi mot Server Action; thanh cong thi trang tu doc lai CSDL
 * (refresh), nen danh sach va trang thai luon la cua CSDL. Nhan phong xong thi
 * chuyen sang tab Tra phong, van chon phieu do, de di tiep toi lap hoa don.
 */
export function BookingPicker({
  nhan,
  tra,
  homNay,
}: {
  nhan: PhieuTomTat[];
  tra: PhieuTomTat[];
  homNay: string;
}) {
  const [tab, setTab] = useState<Tab>("nhan");
  const [maDangChon, setMaDangChon] = useState(nhan[0]?.maDatPhong ?? "");
  const [soTienCoc, setSoTienCoc] = useState("");
  const tt = useThaoTac();

  const danhSach = tab === "nhan" ? nhan : tra;
  const phieu = danhSach.find((p) => p.maDatPhong === maDangChon) ?? danhSach[0];

  const chon = (ma: string) => {
    setMaDangChon(ma);
    setSoTienCoc("");
    tt.setThongBao(null);
  };

  const doiTab = (t: Tab) => {
    setTab(t);
    const ds = t === "nhan" ? nhan : tra;
    chon(ds[0]?.maDatPhong ?? "");
  };

  return (
    <div className="flex min-h-0 flex-grow flex-col gap-5">
      <div className="flex shrink-0 gap-[6px]">
        {([
          ["nhan", `Nhận phòng · ${nhan.length}`],
          ["tra", `Trả phòng · ${tra.length}`],
        ] as const).map(([khoa, nhanNut]) => (
          <button
            key={khoa}
            type="button"
            onClick={() => doiTab(khoa)}
            aria-pressed={tab === khoa}
            className={`h-10 rounded-[10px] px-[18px] text-[13.5px] ${
              tab === khoa
                ? "bg-primary text-primary-foreground font-semibold"
                : "border-border bg-card border text-[#57504A]"
            }`}
          >
            {nhanNut}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-grow gap-5">
        <section className="bg-card border-border flex w-[480px] shrink-0 flex-col gap-[14px] rounded-[14px] border p-5">
          <h2 className="m-0 text-[15px] font-semibold">
            {tab === "nhan" ? "Phiếu chờ nhận phòng" : "Phiếu đang ở · đến hạn trả trước"}
          </h2>
          {danhSach.length === 0 ? (
            <EmptyState thongDiep="Không có phiếu nào" />
          ) : (
            <div className="flex min-h-0 flex-grow flex-col gap-2 overflow-auto">
              {danhSach.map((p) => {
                const on = p.maDatPhong === phieu?.maDatPhong;
                return (
                  <button
                    key={p.maDatPhong}
                    type="button"
                    onClick={() => chon(p.maDatPhong)}
                    aria-pressed={on}
                    className={`flex items-center gap-[11px] rounded-[10px] border px-3 py-[10px] text-left ${
                      on ? "border-primary bg-accent" : "border-border bg-card"
                    }`}
                  >
                    <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold">
                      {p.hoTenKhach
                        .split(" ")
                        .slice(-2)
                        .map((t) => t[0])
                        .join("")}
                    </span>
                    <span className="flex min-w-0 flex-grow flex-col gap-px">
                      <span className="truncate text-[13px] font-semibold">
                        {p.hoTenKhach}
                      </span>
                      <span className="text-muted-foreground truncate font-mono text-[11.5px]">
                        {p.maDatPhong} · Phòng {p.soPhong.join(", ")}
                        {tab === "tra"
                          ? ` · trả ${p.ngayCheckOut === homNay ? "hôm nay" : formatNgay(p.ngayCheckOut)}`
                          : ""}
                      </span>
                    </span>
                    <StatusBadge trangThai={p.trangThai} loai="phieu" />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-card border-border flex min-w-0 flex-grow flex-col gap-[18px] rounded-[14px] border p-6">
          {!phieu ? (
            <>
              <EmptyState thongDiep="Chọn một phiếu ở danh sách bên trái để xem chi tiết" />
              <ThongBao tb={tt.thongBao} />
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="m-0 text-[17px] font-semibold">{phieu.hoTenKhach}</h2>
                  <span className="text-muted-foreground font-mono text-[11.5px]">
                    {phieu.maDatPhong} · {phieu.maKh} · CCCD {phieu.cccd} · {phieu.sdt}
                  </span>
                </div>
                <span className="flex-grow" />
                <StatusBadge trangThai={phieu.trangThai} loai="phieu" />
              </div>

              <dl className="border-border m-0 grid grid-cols-4 gap-4 rounded-[10px] border p-4 text-[13px]">
                <O nhan="Loại phòng" giaTri={phieu.tenLoaiPhong} />
                <O
                  nhan="Nhận → Trả"
                  giaTri={`${formatNgay(phieu.ngayCheckIn)} → ${formatNgay(phieu.ngayCheckOut)}`}
                  mono
                />
                <O nhan="Số đêm" giaTri={`${phieu.soDem} đêm`} mono />
                <O nhan="Tiền cọc" giaTri={formatVnd(phieu.tienCoc)} mono />
              </dl>

              <div className="flex flex-col gap-2">
                <h3 className="m-0 text-[13px] font-semibold">Phòng thực tế</h3>
                <div className="flex flex-wrap gap-2">
                  {phieu.soPhong.map((so) => (
                    <span
                      key={so}
                      className="bg-accent text-accent-foreground rounded-[9px] px-3 py-2 font-mono text-[14px]"
                    >
                      {so}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-border flex items-baseline gap-2 border-t pt-4">
                <span className="text-muted-foreground flex-grow text-[13px]">
                  Tiền phòng tạm tính
                </span>
                <span className="font-mono text-[18px] font-medium">
                  {formatVnd(phieu.tongTienPhong)}
                </span>
              </div>

              {tab === "nhan" ? (
                <div className="flex items-center gap-2">
                  <label htmlFor="coc" className="text-muted-foreground text-[12.5px]">
                    Thu thêm cọc
                  </label>
                  <input
                    id="coc"
                    inputMode="decimal"
                    placeholder="Số tiền, ví dụ 300.000"
                    value={soTienCoc}
                    onChange={(e) => setSoTienCoc(e.target.value)}
                    className="border-input bg-card h-10 flex-grow rounded-[10px] border px-3 font-mono text-[13px]"
                  />
                  <button
                    type="button"
                    disabled={tt.dangChay || soTienCoc.trim() === ""}
                    onClick={() =>
                      tt.chay(
                        () => thuThemCoc(phieu.maDatPhong, docSoTien(soTienCoc)),
                        (d) => {
                          setSoTienCoc("");
                          return `Đã thu thêm cọc. Tổng cọc của ${phieu.maDatPhong}: ${formatVnd(d.tienCoc)}`;
                        },
                      )
                    }
                    className="border-border text-foreground h-10 rounded-[10px] border px-4 text-[13px] disabled:opacity-45"
                  >
                    Ghi nhận cọc
                  </button>
                </div>
              ) : (
                <div className="flex items-baseline gap-2 text-[13px]">
                  <span className="text-muted-foreground flex-grow">Hóa đơn</span>
                  {phieu.hoaDon ? (
                    <>
                      <Link
                        href={`/invoices/${phieu.hoaDon.maHoaDon}`}
                        className="text-primary font-mono text-[12.5px] font-semibold"
                      >
                        {phieu.hoaDon.maHoaDon}
                      </Link>
                      <StatusBadge trangThai={phieu.hoaDon.trangThai} loai="hoaDon" />
                    </>
                  ) : (
                    <span className="text-muted-foreground">Chưa lập</span>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={tt.dangChay}
                  onClick={() => {
                    const ma = phieu.maDatPhong;
                    if (tab === "nhan") {
                      tt.chay(
                        () => nhanPhong(ma),
                        () => {
                          setTab("tra");
                          setMaDangChon(ma);
                          return `Đã nhận phòng ${ma}. Phiếu chuyển sang tab Trả phòng.`;
                        },
                      );
                    } else {
                      tt.chay(
                        () => traPhong(ma),
                        () => `Đã trả phòng ${ma}. Phòng chuyển sang chờ dọn.`,
                      );
                    }
                  }}
                  className="bg-primary text-primary-foreground h-11 flex-grow rounded-[10px] text-[13.5px] font-semibold disabled:opacity-45"
                >
                  {tab === "nhan" ? "Xác nhận nhận phòng" : "Xác nhận trả phòng"}
                </button>
                <button
                  type="button"
                  disabled={tt.dangChay}
                  onClick={() => {
                    const ma = phieu.maDatPhong;
                    if (tab === "nhan") {
                      if (!window.confirm(`Hủy phiếu ${ma}? Phiếu chuyển sang Đã hủy, không xóa.`)) return;
                      tt.chay(() => huyPhieu(ma), () => `Đã hủy phiếu ${ma}.`);
                    } else {
                      tt.chay(() => lapHoaDon(ma), () => "");
                    }
                  }}
                  className="border-border text-foreground h-11 rounded-[10px] border px-5 text-[13.5px] disabled:opacity-45"
                >
                  {tab === "nhan" ? "Hủy phiếu" : "Lập hóa đơn"}
                </button>
              </div>
              <ThongBao tb={tt.thongBao} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function O({ nhan, giaTri, mono = false }: { nhan: string; giaTri: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground text-[11px] tracking-[0.06em] uppercase">
        {nhan}
      </dt>
      <dd className={`m-0 ${mono ? "font-mono text-[12.5px]" : "text-[13px]"}`}>
        {giaTri}
      </dd>
    </div>
  );
}
