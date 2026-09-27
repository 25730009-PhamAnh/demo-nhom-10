"use client";

import { useState } from "react";
import { Brush, TriangleAlert } from "lucide-react";

import { baoHong, donXong } from "@/app/(app)/housekeeping/actions";
import { ChonNhanVien } from "@/components/shared/chon-nhan-vien";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";
import type { NhanVien, PhongChoDon } from "@/lib/queries/buong-phong";
import { nhanTrangThaiPhong } from "@/lib/status";

type Phong = { maPhong: string; soPhong: string; trangThai: string };
type ThaoTac = ReturnType<typeof useThaoTac>;

/**
 * Man lam viec cua nhan vien buong phong: chon nguoi thuc hien mot lan o dau
 * the, roi bam "Don xong" / "Bao hong" tren tung phong cho don. Thanh cong thi
 * trang doc lai CSDL va phong roi khoi danh sach, nen dong ket qua nam o the
 * (useThaoTac dung chung) chu khong nam trong o phong.
 */
export function BuongPhongBan({
  nhanVien,
  choDon,
  phong,
}: {
  nhanVien: NhanVien[];
  choDon: PhongChoDon[];
  phong: Phong[];
}) {
  const [maTk, setMaTk] = useState(nhanVien[0]?.maTk ?? "");
  const tt = useThaoTac();

  return (
    <>
      <SectionCard
        tieuDe="Phòng chờ dọn"
        phu={`${choDon.length} phòng`}
        hanhDong={<ChonNhanVien nhanVien={nhanVien} maTk={maTk} onChon={setMaTk} />}
      >
        <ThongBao tb={tt.thongBao} />
        {choDon.length === 0 ? (
          <EmptyState thongDiep="Không có phòng nào chờ dọn" />
        ) : (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {choDon.map((p) => (
              <OPhongChoDon key={p.maPhong} phong={p} maTk={maTk} tt={tt} />
            ))}
          </div>
        )}
      </SectionCard>
      <DonPhongKhac phong={phong} maTk={maTk} />
    </>
  );
}

function OPhongChoDon({ phong: p, maTk, tt }: { phong: PhongChoDon; maTk: string; tt: ThaoTac }) {
  const [ghiChu, setGhiChu] = useState("");
  // null = o "Bao hong" dang dong.
  const [moTa, setMoTa] = useState<string | null>(null);
  const khoa = tt.dangChay || !maTk;

  return (
    <div role="group" aria-label={`Phòng ${p.soPhong}`} className="border-border flex flex-col gap-[10px] rounded-[10px] border p-[14px]">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[15px] font-medium">{p.soPhong}</span>
        <span className="text-muted-foreground text-[12px]">
          Tầng {p.tang} · {p.tenLoaiPhong}
        </span>
      </div>
      {p.khachHomNay ? (
        <span
          className="self-start rounded-full px-[9px] py-[3px] text-[11.5px] font-medium"
          style={{ color: "#8A5A0E", background: "#F7EFDD" }}
        >
          Khách hôm nay · {p.khachHomNay.maDatPhong} · {p.khachHomNay.hoTen}
        </span>
      ) : null}
      <input
        aria-label={`Ghi chú dọn phòng ${p.soPhong}`}
        placeholder="Ghi chú (tùy chọn)"
        maxLength={200}
        value={ghiChu}
        onChange={(e) => setGhiChu(e.target.value)}
        className="border-input bg-card h-9 rounded-[8px] border px-3 text-[12.5px]"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={khoa}
          onClick={() => tt.chay(() => donXong(p.maPhong, maTk, ghiChu), () => `Đã ghi nhận dọn xong phòng ${p.soPhong}.`)}
          className="bg-primary text-primary-foreground flex h-9 flex-grow items-center justify-center gap-[6px] rounded-[8px] text-[12.5px] font-semibold disabled:opacity-45"
        >
          <Brush size={14} strokeWidth={2} />
          Dọn xong
        </button>
        <button
          type="button"
          onClick={() => setMoTa(moTa === null ? "" : null)}
          aria-pressed={moTa !== null}
          className="border-border bg-card flex h-9 items-center gap-[6px] rounded-[8px] border px-3 text-[12.5px] text-[#8C3A31]"
        >
          <TriangleAlert size={14} strokeWidth={2} />
          Báo hỏng
        </button>
      </div>
      {moTa !== null ? (
        <div className="flex gap-2">
          <input
            aria-label={`Mô tả sự cố phòng ${p.soPhong}`}
            placeholder="Mô tả sự cố"
            maxLength={200}
            value={moTa}
            onChange={(e) => setMoTa(e.target.value)}
            className="border-input bg-card h-9 min-w-0 flex-grow rounded-[8px] border px-3 text-[12.5px]"
          />
          <button
            type="button"
            disabled={khoa}
            onClick={() =>
              tt.chay(
                () => baoHong(p.maPhong, maTk, moTa),
                () => `Đã báo hỏng phòng ${p.soPhong}, phòng chuyển sang bảo trì.`,
              )
            }
            className="h-9 rounded-[8px] px-3 text-[12.5px] font-semibold text-white disabled:opacity-45"
            style={{ background: "#8C3A31" }}
          >
            Gửi báo hỏng
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DonPhongKhac({ phong, maTk }: { phong: Phong[]; maTk: string }) {
  const [maPhong, setMaPhong] = useState(phong[0]?.maPhong ?? "");
  const [ghiChu, setGhiChu] = useState("");
  const tt = useThaoTac();
  const soPhong = phong.find((p) => p.maPhong === maPhong)?.soPhong ?? "";

  return (
    <SectionCard tieuDe="Ghi nhận dọn phòng khác" phu="Ví dụ phòng đang có khách · chỉ ghi nhật ký">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-[6px] text-[12px]">
          <span className="text-muted-foreground">Phòng</span>
          <select
            value={maPhong}
            onChange={(e) => setMaPhong(e.target.value)}
            className="border-input bg-card h-10 w-[220px] rounded-[10px] border px-3 text-[13px]"
          >
            {phong.map((p) => (
              <option key={p.maPhong} value={p.maPhong}>
                {p.soPhong} · {nhanTrangThaiPhong(p.trangThai).nhan}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[240px] flex-grow flex-col gap-[6px] text-[12px]">
          <span className="text-muted-foreground">Ghi chú</span>
          <input
            maxLength={200}
            value={ghiChu}
            onChange={(e) => setGhiChu(e.target.value)}
            className="border-input bg-card h-10 rounded-[10px] border px-3 text-[13px]"
          />
        </label>
        <button
          type="button"
          disabled={tt.dangChay || !maPhong || !maTk}
          onClick={() =>
            tt.chay(
              () => donXong(maPhong, maTk, ghiChu),
              () => {
                setGhiChu("");
                return `Đã ghi nhận dọn phòng ${soPhong}.`;
              },
            )
          }
          className="bg-primary text-primary-foreground h-10 rounded-[10px] px-5 text-[13px] font-semibold disabled:opacity-45"
        >
          Ghi nhận dọn
        </button>
      </div>
      <ThongBao tb={tt.thongBao} />
    </SectionCard>
  );
}
