"use client";

import type { NhanVien } from "@/lib/queries/buong-phong";

/**
 * O chon nguoi thuc hien o dau man Buong phong / Bao tri, khi chua co phien
 * dang nhap. Phase 3 bo o nay va lay nguoi trong phien.
 */
export function ChonNhanVien({
  nhanVien,
  maTk,
  onChon,
  nhan = "Nhân viên thực hiện",
}: {
  nhanVien: NhanVien[];
  maTk: string;
  onChon: (maTk: string) => void;
  nhan?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-[12.5px]">
      <span className="text-muted-foreground">{nhan}</span>
      <select
        value={maTk}
        onChange={(e) => onChon(e.target.value)}
        disabled={nhanVien.length === 0}
        className="border-input bg-card h-9 rounded-[10px] border px-3 text-[13px]"
      >
        {nhanVien.length === 0 ? <option value="">Không có nhân viên đang làm việc</option> : null}
        {nhanVien.map((n) => (
          <option key={n.maTk} value={n.maTk}>
            {n.hoTen} · {n.maTk}
          </option>
        ))}
      </select>
    </label>
  );
}
