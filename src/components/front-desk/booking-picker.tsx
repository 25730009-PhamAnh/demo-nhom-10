"use client";

import { useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatNgay, formatVnd } from "@/lib/format";
import type { PhieuTomTat } from "@/lib/queries/bookings";

type Tab = "nhan" | "tra";

/**
 * Danh sach phieu ben trai + khung chi tiet ben phai,
 * theo design/CheckInOut.dc.html dong 73-cuoi.
 *
 * Doi tab thi phieu dang chon nhay ve phieu dau cua danh sach moi, khong giu ma
 * cu (ma cu khong con trong danh sach thi khung ben phai se trong tron).
 */
export function BookingPicker({
  nhan,
  tra,
}: {
  nhan: PhieuTomTat[];
  tra: PhieuTomTat[];
}) {
  const [tab, setTab] = useState<Tab>("nhan");
  const [maDangChon, setMaDangChon] = useState(nhan[0]?.maDatPhong ?? "");

  const danhSach = tab === "nhan" ? nhan : tra;
  const phieu = danhSach.find((p) => p.maDatPhong === maDangChon) ?? danhSach[0];

  const doiTab = (t: Tab) => {
    setTab(t);
    const ds = t === "nhan" ? nhan : tra;
    setMaDangChon(ds[0]?.maDatPhong ?? "");
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
            {tab === "nhan" ? "Phiếu chờ nhận phòng" : "Phiếu chờ trả phòng"}
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
                    onClick={() => setMaDangChon(p.maDatPhong)}
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
            <EmptyState thongDiep="Chọn một phiếu ở danh sách bên trái để xem chi tiết" />
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

              <div className="flex gap-2">
                <button
                  type="button"
                  className="bg-primary text-primary-foreground h-11 flex-grow rounded-[10px] text-[13.5px] font-semibold"
                >
                  {tab === "nhan" ? "Xác nhận nhận phòng" : "Xác nhận trả phòng"}
                </button>
                <button
                  type="button"
                  className="border-border text-foreground h-11 rounded-[10px] border px-5 text-[13.5px]"
                >
                  {tab === "nhan" ? "Hủy phiếu" : "Lập hóa đơn"}
                </button>
              </div>
              <p className="text-muted-foreground m-0 text-[11px]">
                Bản demo dùng dữ liệu giả — thao tác không được lưu lại.
              </p>
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
