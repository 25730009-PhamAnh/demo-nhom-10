"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";

import { KhachHangForm } from "@/components/customers/khach-hang-form";
import { EmptyState } from "@/components/shared/empty-state";
import { formatVnd } from "@/lib/format";
import type { KhachHangTrenBang } from "@/lib/queries/customers";

type Tab = "TatCa" | "DangLuuTru" | "QuayLai" | "ConNo";
type SapXep = "MoiCapNhat" | "ChiTieuCao" | "LuuTruNhieu";

const TAB: { khoa: Tab; nhan: string }[] = [
  { khoa: "TatCa", nhan: "Tất cả" },
  { khoa: "DangLuuTru", nhan: "Đang lưu trú" },
  { khoa: "QuayLai", nhan: "Khách quay lại" },
  { khoa: "ConNo", nhan: "Còn công nợ" },
];

/** Form dang mo ngay trong the: them moi, sua mot khach, hoac khong mo. */
type Form = { cheDo: "them" } | { cheDo: "sua"; khach: KhachHangTrenBang } | null;

/**
 * Bang khach hang co loc theo tab va sap xep, theo design/Customers.dc.html.
 * Nut "Them khach hang" (mockup dat o topbar) nam o dau the de dung chung state
 * voi bang; "Sua" o moi dong mo cung form, dien san ho so.
 */
export function CustomerTable({ khach }: { khach: KhachHangTrenBang[] }) {
  const [tab, setTab] = useState<Tab>("TatCa");
  const [sapXep, setSapXep] = useState<SapXep>("MoiCapNhat");
  const [form, setForm] = useState<Form>(null);

  const ketQua = useMemo(() => {
    const loc = khach.filter((k) => {
      if (tab === "DangLuuTru") return k.dangLuuTru;
      if (tab === "QuayLai") return k.soLanLuuTru >= 2;
      if (tab === "ConNo") return k.conNo;
      return true;
    });

    // So tien phai so bang SO, khong so chuoi: "9000000.00" < "800000.00"
    // theo thu tu chuoi nhung lai lon hon theo gia tri.
    return [...loc].sort((a, b) => {
      if (sapXep === "ChiTieuCao") return Number(b.tongChiTieu) - Number(a.tongChiTieu);
      if (sapXep === "LuuTruNhieu") return b.soLanLuuTru - a.soLanLuuTru;
      return b.maKh.localeCompare(a.maKh);
    });
  }, [khach, tab, sapXep]);

  return (
    <section className="bg-card border-border flex min-h-0 flex-grow flex-col gap-4 rounded-[14px] border p-5">
      <div className="flex items-center gap-3">
        <h2 className="text-foreground m-0 flex-grow text-[15px] font-semibold">
          Danh sách khách hàng
        </h2>
        <div className="flex gap-[6px]">
          {TAB.map((t) => (
            <button
              key={t.khoa}
              type="button"
              onClick={() => setTab(t.khoa)}
              aria-pressed={tab === t.khoa}
              className={`h-[30px] rounded-lg px-[13px] text-[12.5px] ${
                tab === t.khoa
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "border-border bg-card border text-[#57504A]"
              }`}
            >
              {t.nhan}
            </button>
          ))}
        </div>
        <label htmlFor="sort" className="text-muted-foreground text-[12px]">
          Sắp xếp
        </label>
        <select
          id="sort"
          value={sapXep}
          onChange={(e) => setSapXep(e.target.value as SapXep)}
          className="border-input bg-card h-[30px] rounded-lg border px-2 text-[12.5px]"
        >
          <option value="MoiCapNhat">Mới cập nhật</option>
          <option value="ChiTieuCao">Tổng chi tiêu cao nhất</option>
          <option value="LuuTruNhieu">Số lần lưu trú nhiều nhất</option>
        </select>
        <button
          type="button"
          onClick={() => setForm(form?.cheDo === "them" ? null : { cheDo: "them" })}
          aria-pressed={form?.cheDo === "them"}
          className="bg-primary text-primary-foreground flex h-[30px] items-center gap-[6px] rounded-lg px-[13px] text-[12.5px] font-semibold"
        >
          <Plus size={14} strokeWidth={2} />
          Thêm khách hàng
        </button>
      </div>

      {form ? (
        <KhachHangForm
          key={form.cheDo === "sua" ? form.khach.maKh : "them"}
          ban={form.cheDo === "sua" ? form.khach : undefined}
          khiDong={() => setForm(null)}
        />
      ) : null}

      <div className="min-h-0 flex-grow overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="text-[11px] font-semibold tracking-[0.06em] text-[#857C73] uppercase">
              <th className="border-border bg-card sticky top-0 border-b pb-[9px] font-semibold">
                Khách hàng
              </th>
              <th className="border-border bg-card sticky top-0 border-b pb-[9px] font-semibold">
                CCCD
              </th>
              <th className="border-border bg-card sticky top-0 border-b pb-[9px] font-semibold">
                Điện thoại
              </th>
              <th className="border-border bg-card sticky top-0 border-b pb-[9px] text-right font-semibold">
                Lần lưu trú
              </th>
              <th className="border-border bg-card sticky top-0 border-b pb-[9px] text-right font-semibold">
                Tổng chi tiêu
              </th>
              <th className="border-border bg-card sticky top-0 border-b pb-[9px] font-semibold">
                Trạng thái
              </th>
              <th className="border-border bg-card sticky top-0 border-b pb-[9px]">
                <span className="sr-only">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {ketQua.map((k) => (
              <tr key={k.maKh} className="text-[13px]">
                <td className="border-border border-b py-[11px]">
                  <span className="flex flex-col gap-px">
                    <span className="font-medium">{k.hoTen}</span>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {k.maKh}
                    </span>
                  </span>
                </td>
                <td className="border-border border-b py-[11px] font-mono text-[12.5px]">
                  {k.cccd}
                </td>
                <td className="border-border border-b py-[11px] font-mono text-[12.5px]">
                  {k.sdt ?? "—"}
                </td>
                <td className="border-border border-b py-[11px] text-right font-mono text-[12.5px]">
                  {k.soLanLuuTru}
                </td>
                <td className="border-border border-b py-[11px] text-right font-mono text-[12.5px]">
                  {formatVnd(k.tongChiTieu)}
                </td>
                <td className="border-border border-b py-[11px]">
                  {k.dangLuuTru ? (
                    <span
                      className="rounded-full px-[9px] py-[3px] text-[11.5px] font-medium"
                      style={{ color: "#8A5A0E", background: "#F7EFDD" }}
                    >
                      Đang lưu trú
                    </span>
                  ) : k.conNo ? (
                    <span
                      className="rounded-full px-[9px] py-[3px] text-[11.5px] font-medium"
                      style={{ color: "#8C3A31", background: "#F8E8E5" }}
                    >
                      Còn công nợ
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-[12px]">—</span>
                  )}
                </td>
                <td className="border-border border-b py-[11px] text-right">
                  <button
                    type="button"
                    onClick={() => setForm({ cheDo: "sua", khach: k })}
                    aria-label={`Sửa hồ sơ ${k.hoTen}`}
                    className="text-primary inline-flex items-center gap-[5px] text-[12.5px] font-semibold"
                  >
                    <Pencil size={13} strokeWidth={2} />
                    Sửa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {ketQua.length === 0 ? (
          <EmptyState thongDiep="Không có khách hàng nào" />
        ) : null}
      </div>
    </section>
  );
}
