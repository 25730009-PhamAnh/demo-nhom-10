"use client";

import { useState } from "react";

import { datGia } from "@/app/(app)/pricing/actions";
import { SectionCard } from "@/components/shared/section-card";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";
import { formatNgay, formatVnd } from "@/lib/format";
import { docSoTien, themNgay } from "@/lib/tinh-toan";

type LoaiPhong = { maLoaiPhong: string; tenLoaiPhong: string; donGiaNgay: string };

/**
 * The "Dat gia theo khoang ngay": phu mot don gia len [tu, den] cua mot loai
 * phong (sp_DatGiaPhong), hoac tra doan do ve gia goc. He so chi de xem truoc;
 * thu tuc tu tinh lai va quyet dinh moi quy tac (ngay da qua, vuot 99,99 lan...).
 */
export function DatGiaForm({ loaiPhong, homNay }: { loaiPhong: LoaiPhong[]; homNay: string }) {
  const [maLoai, setMaLoai] = useState(loaiPhong[0]?.maLoaiPhong ?? "");
  const [tuNgay, setTuNgay] = useState(homNay);
  const [denNgay, setDenNgay] = useState(themNgay(homNay, 2));
  const [donGia, setDonGia] = useState("");
  const tt = useThaoTac();

  const loai = loaiPhong.find((l) => l.maLoaiPhong === maLoai);
  const so = Number(docSoTien(donGia));
  const heSo = loai && so > 0 && Number(loai.donGiaNgay) > 0 ? so / Number(loai.donGiaNgay) : null;
  const doan = () => `${loai?.tenLoaiPhong} từ ${formatNgay(tuNgay)} đến ${formatNgay(denNgay)}`;
  const o = "border-input bg-card h-10 rounded-[10px] border px-3 text-[13px]";

  return (
    <SectionCard tieuDe="Đặt giá theo khoảng ngày" phu="Khoảng cũ bị chồng tự được cắt / tách">
      <div className="flex flex-wrap items-end gap-3">
        <label htmlFor="bg-loai" className="flex flex-col gap-[6px] text-[12px]">
          <span className="text-muted-foreground">Loại phòng</span>
          <select id="bg-loai" value={maLoai} onChange={(e) => setMaLoai(e.target.value)} className={`${o} w-[220px]`}>
            {loaiPhong.map((l) => (
              <option key={l.maLoaiPhong} value={l.maLoaiPhong}>
                {l.tenLoaiPhong} · gốc {formatVnd(l.donGiaNgay)}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="bg-tu" className="flex flex-col gap-[6px] text-[12px]">
          <span className="text-muted-foreground">Từ ngày</span>
          <input id="bg-tu" type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} className={`${o} font-mono`} />
        </label>
        <label htmlFor="bg-den" className="flex flex-col gap-[6px] text-[12px]">
          <span className="text-muted-foreground">Đến ngày (tính cả ngày này)</span>
          <input id="bg-den" type="date" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} className={`${o} font-mono`} />
        </label>
        <label htmlFor="bg-gia" className="flex flex-col gap-[6px] text-[12px]">
          <span className="text-muted-foreground">Đơn giá / đêm (đ)</span>
          <input
            id="bg-gia"
            inputMode="decimal"
            placeholder="1.950.000"
            value={donGia}
            onChange={(e) => setDonGia(e.target.value)}
            className={`${o} w-[150px] font-mono`}
          />
        </label>
        <span className="text-muted-foreground h-10 font-mono text-[12.5px] leading-10">
          {heSo === null ? "" : `×${heSo.toFixed(2).replace(".", ",")} giá gốc`}
        </span>
        <span className="flex-grow" />
        <button
          type="button"
          disabled={tt.dangChay || !maLoai}
          onClick={() =>
            tt.chay(
              () => datGia(maLoai, tuNgay, denNgay, null),
              () => `Đã trả ${doan()} về giá gốc ${formatVnd(loai?.donGiaNgay ?? "0")}.`,
            )
          }
          className="border-border bg-card text-primary h-10 rounded-[10px] border px-4 text-[13px] font-semibold disabled:opacity-45"
        >
          Về giá gốc
        </button>
        <button
          type="button"
          disabled={tt.dangChay || !maLoai || donGia.trim() === ""}
          onClick={() =>
            tt.chay(
              () => datGia(maLoai, tuNgay, denNgay, docSoTien(donGia)),
              () => `Đã đặt giá ${doan()}: ${formatVnd(docSoTien(donGia))} / đêm.`,
            )
          }
          className="bg-primary text-primary-foreground h-10 rounded-[10px] px-5 text-[13px] font-semibold disabled:opacity-45"
        >
          Áp dụng
        </button>
      </div>
      <ThongBao tb={tt.thongBao} />
    </SectionCard>
  );
}
