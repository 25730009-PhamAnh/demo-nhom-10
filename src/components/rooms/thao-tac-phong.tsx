"use client";

import { useState } from "react";
import { Brush, Wrench, X } from "lucide-react";

import { baoBaoTri, baoDonPhong } from "@/app/(app)/rooms/actions";
import { StatusBadge } from "@/components/shared/status-badge";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";
import type { PhongTrenSoDo } from "@/lib/queries/rooms";

/**
 * Khung thao tac cua phong dang chon tren So do phong: bao don (sp_BaoDonPhong)
 * va bao bao tri (sp_BaoBaoTri). Nut khong khoa theo trang thai phong: bam sai
 * trang thai thi thu tuc tu choi va cau cua CSDL hien ngay duoi nut.
 */
export function ThaoTacPhong({
  phong: p,
  suCo,
  onDong,
}: {
  phong: PhongTrenSoDo;
  suCo?: string;
  onDong: () => void;
}) {
  const [moTa, setMoTa] = useState("");
  const tt = useThaoTac();

  return (
    <section
      aria-label={`Thao tác phòng ${p.soPhong}`}
      className="bg-card border-border flex shrink-0 flex-col gap-3 rounded-[14px] border p-5"
    >
      <div className="flex items-center gap-3">
        <h2 className="m-0 font-mono text-[16px] font-medium">Phòng {p.soPhong}</h2>
        <span className="text-muted-foreground text-[12.5px]">
          Tầng {p.tang} · {p.tenLoaiPhong}
        </span>
        <StatusBadge trangThai={p.trangThai} />
        <span className="flex-grow" />
        <button type="button" aria-label="Đóng khung thao tác" onClick={onDong} className="text-muted-foreground">
          <X size={18} strokeWidth={1.8} />
        </button>
      </div>
      {suCo ? (
        <p className="m-0 text-[12.5px]" style={{ color: "#8C3A31" }}>
          Sự cố đang mở: {suCo}
        </p>
      ) : null}
      <div className="flex flex-wrap items-end gap-3">
        <button
          type="button"
          disabled={tt.dangChay}
          onClick={() =>
            tt.chay(
              () => baoDonPhong(p.maPhong),
              () => `Đã báo dọn phòng ${p.soPhong}, phòng vào danh sách chờ dọn.`,
            )
          }
          className="border-border bg-card text-primary flex h-10 items-center gap-2 rounded-[10px] border px-4 text-[13px] font-semibold disabled:opacity-45"
        >
          <Brush size={15} strokeWidth={2} />
          Báo dọn phòng
        </button>
        <label className="flex min-w-[280px] flex-grow flex-col gap-[6px] text-[12px]">
          <span className="text-muted-foreground">Mô tả sự cố</span>
          <input
            name="moTaSuCo"
            maxLength={200}
            value={moTa}
            onChange={(e) => setMoTa(e.target.value)}
            placeholder="Ví dụ: vòi sen rỉ nước"
            className="border-input bg-card h-10 rounded-[10px] border px-3 text-[13px]"
          />
        </label>
        <button
          type="button"
          disabled={tt.dangChay}
          onClick={() =>
            tt.chay(
              () => baoBaoTri(p.maPhong, moTa),
              () => {
                setMoTa("");
                return `Đã báo bảo trì phòng ${p.soPhong}.`;
              },
            )
          }
          className="bg-primary text-primary-foreground flex h-10 items-center gap-2 rounded-[10px] px-4 text-[13px] font-semibold disabled:opacity-45"
        >
          <Wrench size={15} strokeWidth={2} />
          Báo bảo trì
        </button>
      </div>
      <ThongBao tb={tt.thongBao} />
    </section>
  );
}
