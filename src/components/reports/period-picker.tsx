"use client";

import { useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { formatVnd } from "@/lib/format";
import { congTien } from "@/lib/tinh-toan";

type Thang = {
  thang: string;
  tienPhong: string;
  dichVu: string;
  phuThu: string;
  giamGia: string;
  tong: string;
};

type Ky = "BaThang" | "SauThang" | "MuoiHaiThang";

const KY: { khoa: Ky; nhan: string; soThang: number }[] = [
  { khoa: "BaThang", nhan: "3 tháng", soThang: 3 },
  { khoa: "SauThang", nhan: "6 tháng", soThang: 6 },
  { khoa: "MuoiHaiThang", nhan: "12 tháng", soThang: 12 },
];

/** '2026-09' -> 'T9/26'. */
function nhanThang(iso: string): string {
  const [nam, thang] = iso.split("-");
  return `T${Number(thang)}/${nam.slice(2)}`;
}

/**
 * Bo chon ky + bieu do cot doanh thu, theo design/Reports.dc.html dong 75-210.
 * Bieu do ve bang div + CSS, khong dung thu vien bieu do.
 */
export function PeriodPicker({ duLieu }: { duLieu: Thang[] }) {
  const [ky, setKy] = useState<Ky>("MuoiHaiThang");

  const soThang = KY.find((k) => k.khoa === ky)!.soThang;
  const hienThi = useMemo(() => duLieu.slice(-soThang), [duLieu, soThang]);

  // Chan chia cho 0: ky khong co doanh thu thi moi cot cao 0 chu khong NaN.
  const max = Math.max(...hienThi.map((d) => Number(d.tong)), 0);

  const tongKy = congTien(...hienThi.map((d) => d.tong));
  const tongPhong = congTien(...hienThi.map((d) => d.tienPhong));
  const tongDichVu = congTien(...hienThi.map((d) => d.dichVu));
  const tongGiamGia = congTien(...hienThi.map((d) => d.giamGia));

  return (
    <>
      <section className="bg-card border-border flex h-16 shrink-0 items-center gap-[14px] rounded-[14px] border px-4">
        <span className="text-muted-foreground text-[12px]">Kỳ báo cáo</span>
        <div className="flex gap-[6px]">
          {KY.map((k) => (
            <button
              key={k.khoa}
              type="button"
              onClick={() => setKy(k.khoa)}
              aria-pressed={ky === k.khoa}
              className={`h-[34px] rounded-lg px-[15px] text-[12.5px] ${
                ky === k.khoa
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "border-border bg-card border text-[#57504A]"
              }`}
            >
              {k.nhan}
            </button>
          ))}
        </div>
        <span className="flex-grow" />
        <span className="text-muted-foreground text-[12px]">
          {hienThi.length > 0
            ? `${nhanThang(hienThi[0].thang)} → ${nhanThang(hienThi[hienThi.length - 1].thang)}`
            : "—"}
        </span>
      </section>

      <section className="flex shrink-0 gap-5">
        <TheSo nhan="Doanh thu kỳ" giaTri={formatVnd(tongKy)} phu={`${hienThi.length} tháng`} />
        <TheSo nhan="Tiền phòng" giaTri={formatVnd(tongPhong)} phu="Khoản mục TienPhong" mau="var(--chart-1)" />
        <TheSo nhan="Dịch vụ" giaTri={formatVnd(tongDichVu)} phu="Khoản mục DichVu" mau="var(--chart-2)" />
        <TheSo nhan="Giảm giá" giaTri={formatVnd(tongGiamGia)} phu="Khoản mục GiamGia" />
      </section>

      <section className="bg-card border-border flex h-[300px] shrink-0 flex-col gap-[14px] rounded-[14px] border p-5">
        <div className="flex items-center gap-3">
          <h2 className="m-0 flex-grow text-[15px] font-semibold">Doanh thu theo tháng</h2>
          <span className="text-muted-foreground text-[11px]">Chiều cao cột = doanh thu thuần</span>
          <ChuGiai mau="var(--chart-1)" nhan="Tiền phòng" />
          <ChuGiai mau="var(--chart-2)" nhan="Dịch vụ" />
          <ChuGiai mau="var(--chart-3)" nhan="Phụ thu" />
        </div>

        {max === 0 ? (
          <EmptyState thongDiep="Kỳ này chưa có doanh thu" />
        ) : (
          <div className="flex min-h-0 flex-grow items-end gap-3">
            {hienThi.map((d) => {
              // CHIEU CAO COT ti le voi `tong` — dung con so ma nhan va tooltip
              // bao. Truoc day cot ve bang tong cac phan DUONG nen thang co tong
              // nho hon lai duoc ve cao hon, va cot cao nhat bi cat cut.
              const caoCot = (Number(d.tong) / max) * 100;

              // Ben trong cot, ba thanh phan duong chia theo ti le cua chinh
              // chung, nen luon cong du 100% chieu cao cot.
              const duong =
                Number(d.tienPhong) + Number(d.dichVu) + Number(d.phuThu);
              const phan = (v: string) => (duong === 0 ? 0 : (Number(v) / duong) * 100);

              return (
                <div key={d.thang} className="flex min-w-0 flex-grow flex-col items-center gap-2">
                  <div
                    className="flex w-full flex-col justify-end"
                    style={{ height: "170px" }}
                    title={`${nhanThang(d.thang)}: ${formatVnd(d.tong)}`}
                  >
                    <div
                      className="flex w-full flex-col justify-end overflow-hidden rounded-t-[4px]"
                      style={{ height: `${Math.max(0, caoCot)}%` }}
                    >
                      <div style={{ height: `${phan(d.phuThu)}%`, background: "var(--chart-3)" }} />
                      <div style={{ height: `${phan(d.dichVu)}%`, background: "var(--chart-2)" }} />
                      <div style={{ height: `${phan(d.tienPhong)}%`, background: "var(--chart-1)" }} />
                    </div>
                  </div>
                  <span className="text-muted-foreground font-mono text-[10.5px]">
                    {nhanThang(d.thang)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-card border-border flex min-h-0 flex-grow flex-col gap-[14px] rounded-[14px] border p-5">
        <h2 className="m-0 text-[15px] font-semibold">Cơ cấu doanh thu theo tháng</h2>
        <div className="min-h-0 flex-grow overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-[11px] font-semibold tracking-[0.06em] text-[#857C73] uppercase">
                <th className="border-border bg-card sticky top-0 border-b pb-[9px] font-semibold">Tháng</th>
                <th className="border-border bg-card sticky top-0 border-b pb-[9px] text-right font-semibold">Tiền phòng</th>
                <th className="border-border bg-card sticky top-0 border-b pb-[9px] text-right font-semibold">Dịch vụ</th>
                <th className="border-border bg-card sticky top-0 border-b pb-[9px] text-right font-semibold">Phụ thu</th>
                <th className="border-border bg-card sticky top-0 border-b pb-[9px] text-right font-semibold">Giảm giá</th>
                <th className="border-border bg-card sticky top-0 border-b pb-[9px] text-right font-semibold">Tổng</th>
              </tr>
            </thead>
            <tbody>
              {hienThi.map((d) => (
                <tr key={d.thang} className="text-[13px]">
                  <td className="border-border border-b py-[11px] font-mono text-[12.5px]">
                    {nhanThang(d.thang)}
                  </td>
                  <td className="border-border border-b py-[11px] text-right font-mono text-[12.5px]">{formatVnd(d.tienPhong)}</td>
                  <td className="border-border border-b py-[11px] text-right font-mono text-[12.5px]">{formatVnd(d.dichVu)}</td>
                  <td className="border-border border-b py-[11px] text-right font-mono text-[12.5px]">{formatVnd(d.phuThu)}</td>
                  <td className="border-border border-b py-[11px] text-right font-mono text-[12.5px]" style={{ color: "#8C3A31" }}>{formatVnd(d.giamGia)}</td>
                  <td className="border-border border-b py-[11px] text-right font-mono text-[12.5px] font-medium">{formatVnd(d.tong)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function TheSo({ nhan, giaTri, phu, mau }: { nhan: string; giaTri: string; phu: string; mau?: string }) {
  return (
    <div className="bg-card border-border flex flex-grow basis-0 flex-col gap-[9px] rounded-[14px] border px-5 py-[17px]">
      <span className="flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.09em] text-[#857C73] uppercase">
        {mau ? <span className="size-[7px] rounded-full" style={{ background: mau }} /> : null}
        {nhan}
      </span>
      <span className="text-foreground font-mono text-[22px] leading-none font-medium">{giaTri}</span>
      <span className="text-muted-foreground text-[12px]">{phu}</span>
    </div>
  );
}

function ChuGiai({ mau, nhan }: { mau: string; nhan: string }) {
  return (
    <span className="text-muted-foreground flex items-center gap-[6px] text-[11.5px]">
      <span className="size-[8px] rounded-[2px]" style={{ background: mau }} />
      {nhan}
    </span>
  );
}
