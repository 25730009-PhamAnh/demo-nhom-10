"use client";

import Link from "next/link";
import { useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import type { PhieuTomTat } from "@/lib/queries/bookings";
import { formatNgay } from "@/lib/format";

type Loc = "TatCa" | "Nhan" | "Tra";

/**
 * Bang "Lich nhan & tra phong hom nay" o cuoi man Tong quan.
 * Client Component vi ba nut loc tren artboard phai bam duoc.
 */
export function ScheduleTable({
  nhan,
  tra,
}: {
  nhan: PhieuTomTat[];
  tra: PhieuTomTat[];
}) {
  const [loc, setLoc] = useState<Loc>("TatCa");

  const dong = [
    ...nhan.map((p) => ({ p, loai: "Nhan" as const })),
    ...tra.map((p) => ({ p, loai: "Tra" as const })),
  ]
    .filter((d) => loc === "TatCa" || d.loai === loc)
    .sort((a, b) => a.p.maDatPhong.localeCompare(b.p.maDatPhong));

  const nut: { khoa: Loc; nhan: string }[] = [
    { khoa: "TatCa", nhan: `Tất cả · ${nhan.length + tra.length}` },
    { khoa: "Nhan", nhan: `Nhận · ${nhan.length}` },
    { khoa: "Tra", nhan: `Trả · ${tra.length}` },
  ];

  return (
    <section className="bg-card border-border flex min-h-0 flex-grow flex-col gap-[14px] rounded-[14px] border p-5">
      <div className="flex items-center gap-3">
        <h2 className="text-foreground m-0 flex-grow text-[15px] font-semibold">
          Lịch nhận &amp; trả phòng hôm nay
        </h2>
        <div className="flex gap-[6px]">
          {nut.map((n) => (
            <button
              key={n.khoa}
              type="button"
              onClick={() => setLoc(n.khoa)}
              aria-pressed={loc === n.khoa}
              className={`h-[30px] rounded-lg px-[13px] text-[12.5px] ${
                loc === n.khoa
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "border-border bg-card border text-[#57504A]"
              }`}
            >
              {n.nhan}
            </button>
          ))}
        </div>
      </div>

      {dong.length === 0 ? (
        <EmptyState thongDiep="Không có lượt nhận hoặc trả phòng nào hôm nay" />
      ) : (
        <div className="min-h-0 flex-grow overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-[11px] font-semibold tracking-[0.06em] text-[#857C73] uppercase">
                <th className="border-border border-b pb-[9px] font-semibold">Phiếu</th>
                <th className="border-border border-b pb-[9px] font-semibold">Khách hàng</th>
                <th className="border-border border-b pb-[9px] font-semibold">Phòng</th>
                <th className="border-border border-b pb-[9px] font-semibold">Loại phòng</th>
                <th className="border-border border-b pb-[9px] font-semibold">Thời gian</th>
                <th className="border-border border-b pb-[9px] text-right font-semibold">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {dong.map(({ p, loai }) => (
                <tr key={`${loai}-${p.maDatPhong}`} className="text-[13px]">
                  <td className="border-border border-b py-[11px] font-mono text-[12.5px]">
                    {p.maDatPhong}
                  </td>
                  <td className="border-border border-b py-[11px]">{p.hoTenKhach}</td>
                  <td className="border-border border-b py-[11px] font-mono text-[12.5px]">
                    {p.soPhong.join(", ")}
                  </td>
                  <td className="border-border text-muted-foreground border-b py-[11px]">
                    {p.tenLoaiPhong}
                  </td>
                  <td className="border-border border-b py-[11px] font-mono text-[12.5px]">
                    {loai === "Nhan"
                      ? `Nhận ${formatNgay(p.ngayCheckIn)}`
                      : `Trả ${formatNgay(p.ngayCheckOut)}`}
                  </td>
                  <td className="border-border border-b py-[11px] text-right">
                    <Link
                      href="/front-desk"
                      className={`inline-flex h-[30px] items-center rounded-lg px-[13px] text-[12.5px] font-semibold no-underline ${
                        loai === "Nhan"
                          ? "bg-primary text-primary-foreground"
                          : "border-border bg-card text-primary border"
                      }`}
                    >
                      {loai === "Nhan" ? "Nhận phòng" : "Trả phòng"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
