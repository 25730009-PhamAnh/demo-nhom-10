import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { SectionCard } from "@/components/shared/section-card";
import { formatSo, formatVnd } from "@/lib/format";
import type { LichGia as LichGiaKieu } from "@/lib/queries/bang-gia";
import { themNgay } from "@/lib/tinh-toan";

const THU = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** Mau o theo gia / gia goc: bang gia goc trung tinh, cao hon am dan, thap hon lanh. */
function mauO(tyLe: number) {
  if (tyLe < 0.995) return { bg: "#E6EDF6", fg: "#2A5480" };
  if (tyLe <= 1.005) return { bg: "#FAF7F1", fg: "#57504A" };
  if (tyLe <= 1.15) return { bg: "#F7EFDD", fg: "#8A5A0E" };
  if (tyLe <= 1.3) return { bg: "#F1DDB8", fg: "#7A4A08" };
  return { bg: "#F8E8E5", fg: "#8C3A31" };
}

/**
 * Lich gia 14 ngay (Server Component): dong la loai phong, cot la ngay, o la gia
 * tung ngay (nghin dong) theo fn_DonGiaPhongTheoNgay. Lui / tien bang ?tu=.
 */
export function LichGia({ lich, tuNgay, homNay }: { lich: LichGiaKieu; tuNgay: string; homNay: string }) {
  const nut = "border-border bg-card flex size-8 items-center justify-center rounded-lg border text-[#57504A]";

  return (
    <SectionCard
      tieuDe={`Lịch giá ${lich.ngay.length} ngày`}
      phu="Nghìn đồng / đêm · màu theo mức so với giá gốc"
      hanhDong={
        <span className="flex items-center gap-2">
          <Link href={`/pricing?tu=${themNgay(tuNgay, -14)}`} aria-label="Lùi 14 ngày" className={nut}>
            <ChevronLeft size={16} strokeWidth={1.9} />
          </Link>
          <Link href="/pricing" className="text-primary text-[12.5px] font-semibold no-underline">
            Hôm nay
          </Link>
          <Link href={`/pricing?tu=${themNgay(tuNgay, 14)}`} aria-label="Tiến 14 ngày" className={nut}>
            <ChevronRight size={16} strokeWidth={1.9} />
          </Link>
        </span>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="text-[11px] font-semibold text-[#857C73]">
              <th className="border-border bg-card sticky left-0 border-b pr-3 pb-[9px] tracking-[0.06em] uppercase">
                Loại phòng
              </th>
              {lich.ngay.map((n) => (
                <th
                  key={n}
                  className="border-border border-b px-1 pb-[9px] text-center font-mono font-medium"
                  style={n === homNay ? { color: "#14483F" } : undefined}
                >
                  <span className="block">{THU[new Date(`${n}T00:00:00Z`).getUTCDay()]}</span>
                  <span className="block">
                    {n.slice(8, 10)}/{n.slice(5, 7)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lich.loai.map((l) => (
              <tr key={l.maLoaiPhong} className="text-[12.5px]">
                <td className="border-border bg-card sticky left-0 border-b py-2 pr-3">
                  <span className="flex flex-col gap-px">
                    <span className="font-medium whitespace-nowrap">{l.tenLoaiPhong}</span>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      gốc {formatSo(Math.round(Number(l.donGiaNgay) / 1000))}
                    </span>
                  </span>
                </td>
                {l.gia.map((g, i) => {
                  const m = mauO(Number(g.donGia) / Number(l.donGiaNgay));
                  return (
                    <td key={lich.ngay[i]} className="border-border border-b p-[3px]">
                      <span
                        title={`${formatVnd(g.donGia)} · ${g.coKhaiGia ? "theo bảng giá" : "giá gốc"}`}
                        className="block rounded-md px-1 py-[6px] text-center font-mono text-[12px]"
                        style={{ background: m.bg, color: m.fg }}
                      >
                        {formatSo(Math.round(Number(g.donGia) / 1000))}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
