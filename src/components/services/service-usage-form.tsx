"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import { formatVnd } from "@/lib/format";
import { tienDichVu } from "@/lib/tinh-toan";

type DichVu = { maDv: string; tenDv: string; donViTinh: string | null; giaDv: string };
type Phieu = { maDatPhong: string; hoTenKhach: string; soPhong: string[] };

/**
 * Khung ghi nhan su dung dich vu, theo design/Services.dc.html dong 161-cuoi.
 * Thanh tien tinh lai ngay khi doi so luong (mo phong fn_TienDichVu).
 */
export function ServiceUsageForm({
  dichVu,
  phieu,
}: {
  dichVu: DichVu[];
  phieu: Phieu[];
}) {
  const [maDatPhong, setMaDatPhong] = useState(phieu[0]?.maDatPhong ?? "");
  const [maDv, setMaDv] = useState(dichVu[0]?.maDv ?? "");
  const [soLuong, setSoLuong] = useState(1);

  const dv = dichVu.find((d) => d.maDv === maDv);
  const thanhTien = tienDichVu(dv?.giaDv ?? "0.00", soLuong);

  return (
    <aside className="bg-card border-border flex w-[428px] shrink-0 flex-col gap-[18px] self-start rounded-[14px] border p-[22px]">
      <h2 className="m-0 text-[15px] font-semibold">Ghi nhận sử dụng dịch vụ</h2>

      <div className="flex flex-col gap-[6px]">
        <label htmlFor="phieu" className="text-muted-foreground text-[12px]">
          Phiếu đang lưu trú
        </label>
        <select
          id="phieu"
          value={maDatPhong}
          onChange={(e) => setMaDatPhong(e.target.value)}
          className="border-input bg-card h-10 rounded-[10px] border px-3 text-[13px]"
        >
          {phieu.map((p) => (
            <option key={p.maDatPhong} value={p.maDatPhong}>
              {p.maDatPhong} — {p.hoTenKhach} · Phòng {p.soPhong.join(", ")}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-[6px]">
        <label htmlFor="dv" className="text-muted-foreground text-[12px]">
          Dịch vụ
        </label>
        <select
          id="dv"
          value={maDv}
          onChange={(e) => setMaDv(e.target.value)}
          className="border-input bg-card h-10 rounded-[10px] border px-3 text-[13px]"
        >
          {dichVu.map((d) => (
            <option key={d.maDv} value={d.maDv}>
              {d.tenDv} — {formatVnd(d.giaDv)} / {d.donViTinh}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-[6px]">
        <span className="text-muted-foreground text-[12px]">Số lượng</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Giảm số lượng"
            onClick={() => setSoLuong((n) => Math.max(1, n - 1))}
            className="bg-background size-9 rounded-[7px]"
          >
            <Minus size={14} className="mx-auto" />
          </button>
          <span className="w-10 text-center font-mono text-[15px] font-medium">
            {soLuong}
          </span>
          <button
            type="button"
            aria-label="Tăng số lượng"
            onClick={() => setSoLuong((n) => n + 1)}
            className="bg-background size-9 rounded-[7px]"
          >
            <Plus size={14} className="mx-auto" />
          </button>
          <span className="text-muted-foreground text-[12px]">{dv?.donViTinh}</span>
        </div>
      </div>

      <dl className="border-border m-0 flex flex-col gap-[10px] border-t pt-4 text-[13px]">
        <div className="flex items-baseline gap-2">
          <dt className="text-muted-foreground flex-grow">Đơn giá</dt>
          <dd className="m-0 font-mono text-[12.5px]">{formatVnd(dv?.giaDv ?? "0.00")}</dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="flex-grow font-semibold">Thành tiền</dt>
          <dd className="m-0 font-mono text-[18px] font-medium">{formatVnd(thanhTien)}</dd>
        </div>
      </dl>

      <button
        type="button"
        className="bg-primary text-primary-foreground h-11 rounded-[10px] text-[13.5px] font-semibold"
      >
        Ghi nhận dịch vụ
      </button>
      <p className="text-muted-foreground m-0 text-[11px]">
        Bản demo dùng dữ liệu giả — ghi nhận không được lưu lại.
      </p>
    </aside>
  );
}
