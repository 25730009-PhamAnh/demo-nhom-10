"use client";

import { useState } from "react";
import { Brush, Wrench } from "lucide-react";

import { ghiDonPhong, ghiSuaPhong } from "@/app/(app)/rooms/actions";
import { SectionCard } from "@/components/shared/section-card";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";
import { nhanTrangThaiPhong } from "@/lib/status";
import { docSoTien } from "@/lib/tinh-toan";

type Phong = { maPhong: string; soPhong: string; trangThai: string };
type CheDo = "don" | "sua";

/**
 * The "Nhat ky buong phong & sua chua": hai nut o dau the mo form ghi nhan
 * don phong (sp_GhiNhanDonPhong) hoac sua chua (sp_GhiNhanSuaPhong) ngay trong
 * the. Bang nhat ky (children) do trang server ve, doc lai sau moi lan ghi.
 */
export function NhatKyForm({
  phong,
  phu,
  children,
}: {
  phong: Phong[];
  phu: string;
  children: React.ReactNode;
}) {
  const [cheDo, setCheDo] = useState<CheDo | null>(null);
  const [maPhong, setMaPhong] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [chiPhi, setChiPhi] = useState("");
  const tt = useThaoTac();

  const mo = (c: CheDo) => {
    setCheDo(c);
    // Don phong: goi y phong dau tien dang cho don; sua chua: phong dau tien.
    setMaPhong((phong.find((p) => c === "don" && p.trangThai === "DangDon") ?? phong[0])?.maPhong ?? "");
    setGhiChu("");
    setChiPhi("");
    tt.setThongBao(null);
  };

  const soPhong = phong.find((p) => p.maPhong === maPhong)?.soPhong ?? "";

  const ghi = () => {
    if (cheDo === "don") {
      tt.chay(() => ghiDonPhong(maPhong, ghiChu), () => {
        setGhiChu("");
        return `Đã ghi nhận dọn phòng ${soPhong}.`;
      });
    } else {
      tt.chay(() => ghiSuaPhong(maPhong, docSoTien(chiPhi) || "0", ghiChu), () => {
        setGhiChu("");
        setChiPhi("");
        return `Đã ghi nhận sửa chữa phòng ${soPhong}, phòng chuyển sang bảo trì.`;
      });
    }
  };

  const nut = (c: CheDo, Icon: typeof Brush, nhan: string) => (
    <button
      type="button"
      onClick={() => (cheDo === c ? setCheDo(null) : mo(c))}
      aria-pressed={cheDo === c}
      className="text-primary flex items-center gap-[5px] text-[12.5px] font-semibold"
    >
      <Icon size={14} strokeWidth={2} />
      {nhan}
    </button>
  );

  return (
    <SectionCard
      tieuDe="Nhật ký buồng phòng & sửa chữa"
      phu={phu}
      hanhDong={
        <span className="flex gap-4">
          {nut("don", Brush, "Ghi nhận dọn phòng")}
          {nut("sua", Wrench, "Ghi nhận sửa chữa")}
        </span>
      }
    >
      {cheDo ? (
        <div className="border-border flex flex-col gap-3 rounded-[10px] border p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-[6px] text-[12px]">
              <span className="text-muted-foreground">Phòng</span>
              <select
                value={maPhong}
                onChange={(e) => setMaPhong(e.target.value)}
                className="border-input bg-card h-10 w-[200px] rounded-[10px] border px-3 text-[13px]"
              >
                {phong.map((p) => (
                  <option key={p.maPhong} value={p.maPhong}>
                    {p.soPhong} · {nhanTrangThaiPhong(p.trangThai).nhan}
                  </option>
                ))}
              </select>
            </label>
            {cheDo === "sua" ? (
              <label className="flex flex-col gap-[6px] text-[12px]">
                <span className="text-muted-foreground">Chi phí (đ)</span>
                <input
                  inputMode="decimal"
                  placeholder="0"
                  value={chiPhi}
                  onChange={(e) => setChiPhi(e.target.value)}
                  className="border-input bg-card h-10 w-[140px] rounded-[10px] border px-3 font-mono text-[13px]"
                />
              </label>
            ) : null}
            <label className="flex min-w-[240px] flex-grow flex-col gap-[6px] text-[12px]">
              <span className="text-muted-foreground">{cheDo === "don" ? "Ghi chú" : "Mô tả lỗi"}</span>
              <input
                maxLength={200}
                value={ghiChu}
                onChange={(e) => setGhiChu(e.target.value)}
                className="border-input bg-card h-10 rounded-[10px] border px-3 text-[13px]"
              />
            </label>
            <button
              type="button"
              disabled={tt.dangChay || !maPhong}
              onClick={ghi}
              className="bg-primary text-primary-foreground h-10 rounded-[10px] px-5 text-[13px] font-semibold disabled:opacity-45"
            >
              {cheDo === "don" ? "Ghi nhận dọn" : "Ghi nhận sửa"}
            </button>
          </div>
          <ThongBao tb={tt.thongBao} />
        </div>
      ) : (
        <ThongBao tb={tt.thongBao} />
      )}
      {children}
    </SectionCard>
  );
}
