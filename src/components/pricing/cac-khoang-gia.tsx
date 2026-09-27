"use client";

import { useState } from "react";

import { capNhatGiaGoc, datGia } from "@/app/(app)/pricing/actions";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";
import { formatNgay, formatVnd } from "@/lib/format";
import type { LoaiPhongGia } from "@/lib/queries/bang-gia";
import { docSoTien } from "@/lib/tinh-toan";

/**
 * Moi loai phong mot the: sua gia goc tai cho, danh sach khoang gia. "Xoa" mot
 * khoang = tra khoang do ve gia goc tu max(ngay bat dau, hom nay), vi
 * sp_DatGiaPhong khong cho sua gia ngay da qua. Khoang da qua het chi de xem.
 */
export function CacKhoangGia({ bangGia, homNay }: { bangGia: LoaiPhongGia[]; homNay: string }) {
  return (
    <section className="grid shrink-0 grid-cols-1 gap-5 xl:grid-cols-2">
      {bangGia.map((l) => (
        <TheLoaiPhong key={l.maLoaiPhong} loai={l} homNay={homNay} />
      ))}
    </section>
  );
}

const heSo = (h: string) => `×${Number(h).toFixed(2).replace(".", ",")}`;

function TheLoaiPhong({ loai: l, homNay }: { loai: LoaiPhongGia; homNay: string }) {
  const [giaGoc, setGiaGoc] = useState(l.donGiaNgay.replace(/\.00$/, ""));
  const tt = useThaoTac();

  return (
    <div className="bg-card border-border flex flex-col gap-3 rounded-[14px] border p-5">
      <div className="flex items-center gap-3">
        <h2 className="m-0 flex-grow text-[15px] font-semibold">{l.tenLoaiPhong}</h2>
        <span className="text-muted-foreground font-mono text-[11.5px]">{l.maLoaiPhong}</span>
      </div>
      <div className="flex items-end gap-2">
        <label className="flex flex-col gap-[6px] text-[12px]">
          <span className="text-muted-foreground">Giá gốc / đêm (đ)</span>
          <input
            inputMode="decimal"
            aria-label={`Giá gốc ${l.tenLoaiPhong}`}
            value={giaGoc}
            onChange={(e) => setGiaGoc(e.target.value)}
            className="border-input bg-card h-9 w-[160px] rounded-[8px] border px-3 font-mono text-[13px]"
          />
        </label>
        <button
          type="button"
          disabled={tt.dangChay}
          onClick={() =>
            tt.chay(
              () => capNhatGiaGoc(l.maLoaiPhong, docSoTien(giaGoc)),
              () => `Đã đổi giá gốc ${l.tenLoaiPhong} thành ${formatVnd(docSoTien(giaGoc))}.`,
            )
          }
          className="border-border bg-card text-primary h-9 rounded-[8px] border px-3 text-[12.5px] font-semibold disabled:opacity-45"
        >
          Lưu giá gốc
        </button>
      </div>
      {l.khoang.length === 0 ? (
        <p className="text-muted-foreground m-0 text-[12.5px]">Chưa có khoảng giá: mọi ngày tính theo giá gốc.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-[6px] p-0">
          {l.khoang.map((k) => {
            const daQua = k.denNgay < homNay;
            const tu = k.apDungTuNgay < homNay ? homNay : k.apDungTuNgay;
            return (
              <li
                key={k.maBangGia}
                className={`border-border flex items-center gap-3 rounded-[8px] border px-3 py-2 text-[12.5px] ${daQua ? "opacity-50" : ""}`}
              >
                <span className="font-mono">
                  {formatNgay(k.apDungTuNgay)} – {formatNgay(k.denNgay)}
                </span>
                <span className="font-mono font-medium">{formatVnd(k.donGia)}</span>
                <span className="text-muted-foreground font-mono">({heSo(k.heSo)})</span>
                <span className="flex-grow" />
                {daQua ? (
                  <span className="text-muted-foreground text-[11.5px]">Đã qua</span>
                ) : (
                  <button
                    type="button"
                    disabled={tt.dangChay}
                    onClick={() => {
                      const cau = `${formatNgay(tu)} – ${formatNgay(k.denNgay)} của ${l.tenLoaiPhong}`;
                      if (!window.confirm(`Trả ${cau} về giá gốc?`)) return;
                      tt.chay(() => datGia(l.maLoaiPhong, tu, k.denNgay, null), () => `Đã trả ${cau} về giá gốc.`);
                    }}
                    className="text-[12px] font-semibold text-[#8C3A31] disabled:opacity-45"
                  >
                    Xóa
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <ThongBao tb={tt.thongBao} />
    </div>
  );
}
