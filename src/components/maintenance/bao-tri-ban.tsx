"use client";

import { useState } from "react";
import { Wrench } from "lucide-react";

import { suaXong } from "@/app/(app)/maintenance/actions";
import { ChonNhanVien } from "@/components/shared/chon-nhan-vien";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";
import { formatNgayGio } from "@/lib/format";
import type { NhanVien, PhongDangBaoTri } from "@/lib/queries/buong-phong";
import { docSoTien } from "@/lib/tinh-toan";

type ThaoTac = ReturnType<typeof useThaoTac>;

/**
 * Man lam viec cua ky thuat: moi phong BaoTri kem phieu dang mo. "Sua xong" mo
 * o chi phi va mo ta, dien san tu phieu (phieu cu cua du lieu mau da co chi phi,
 * de trong thi ghi de mat so do). Thanh cong thi phong sang DangDon, roi khoi
 * danh sach, nen dong ket qua nam o dau the.
 */
export function BaoTriBan({ nhanVien, baoTri }: { nhanVien: NhanVien[]; baoTri: PhongDangBaoTri[] }) {
  const [maTk, setMaTk] = useState(nhanVien[0]?.maTk ?? "");
  const tt = useThaoTac();

  return (
    <SectionCard
      tieuDe="Phòng đang bảo trì"
      phu={`${baoTri.length} phòng`}
      hanhDong={<ChonNhanVien nhan="Kỹ thuật viên" nhanVien={nhanVien} maTk={maTk} onChon={setMaTk} />}
    >
      <ThongBao tb={tt.thongBao} />
      {baoTri.length === 0 ? (
        <EmptyState thongDiep="Không có phòng nào đang bảo trì" />
      ) : (
        <div className="flex flex-col gap-3">
          {baoTri.map((p) => (
            <DongBaoTri key={p.maPhong} phong={p} maTk={maTk} tt={tt} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function DongBaoTri({ phong: p, maTk, tt }: { phong: PhongDangBaoTri; maTk: string; tt: ThaoTac }) {
  const [mo, setMo] = useState(false);
  const [chiPhi, setChiPhi] = useState(p.phieu ? p.phieu.chiPhi.replace(/\.00$/, "") : "0");
  const [moTa, setMoTa] = useState(p.phieu?.moTaLoi ?? "");

  return (
    <div role="group" aria-label={`Phòng ${p.soPhong}`} className="border-border flex flex-col gap-3 rounded-[10px] border p-4">
      <div className="flex items-start gap-4">
        <div className="flex w-[130px] shrink-0 flex-col gap-px">
          <span className="font-mono text-[15px] font-medium">{p.soPhong}</span>
          <span className="text-muted-foreground text-[11.5px]">
            Tầng {p.tang} · {p.tenLoaiPhong}
          </span>
        </div>
        <div className="flex min-w-0 flex-grow flex-col gap-1">
          <span className="text-[13px] font-medium">{p.phieu?.moTaLoi || "Chưa có mô tả sự cố"}</span>
          {p.phieu ? (
            <span className="text-muted-foreground text-[12px]">
              Ghi bởi {p.phieu.nguoiGhi} · {formatNgayGio(p.phieu.thoiGian)} · chờ {p.phieu.soNgayCho} ngày
            </span>
          ) : null}
          {p.khachHomNay ? (
            <span
              className="self-start rounded-full px-[9px] py-[3px] text-[11.5px] font-medium"
              style={{ color: "#8A5A0E", background: "#F7EFDD" }}
            >
              Khách hôm nay · {p.khachHomNay.maDatPhong} · {p.khachHomNay.hoTen}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setMo(!mo)}
          aria-pressed={mo}
          className="bg-primary text-primary-foreground flex h-9 shrink-0 items-center gap-[6px] rounded-[8px] px-4 text-[12.5px] font-semibold"
        >
          <Wrench size={14} strokeWidth={2} />
          Sửa xong
        </button>
      </div>
      {mo ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-[6px] text-[12px]">
            <span className="text-muted-foreground">Chi phí (đ)</span>
            <input
              name="chiPhi"
              inputMode="decimal"
              value={chiPhi}
              onChange={(e) => setChiPhi(e.target.value)}
              className="border-input bg-card h-10 w-[150px] rounded-[10px] border px-3 font-mono text-[13px]"
            />
          </label>
          <label className="flex min-w-[260px] flex-grow flex-col gap-[6px] text-[12px]">
            <span className="text-muted-foreground">Mô tả (để trống thì giữ mô tả cũ)</span>
            <input
              name="moTaLoi"
              maxLength={200}
              value={moTa}
              onChange={(e) => setMoTa(e.target.value)}
              className="border-input bg-card h-10 rounded-[10px] border px-3 text-[13px]"
            />
          </label>
          <button
            type="button"
            disabled={tt.dangChay || !maTk}
            onClick={() =>
              tt.chay(
                () => suaXong(p.maPhong, maTk, docSoTien(chiPhi) || "0", moTa),
                () => `Phòng ${p.soPhong} chuyển sang Đang dọn, chờ buồng phòng.`,
              )
            }
            className="bg-primary text-primary-foreground h-10 rounded-[10px] px-5 text-[13px] font-semibold disabled:opacity-45"
          >
            Xác nhận sửa xong
          </button>
        </div>
      ) : null}
    </div>
  );
}
