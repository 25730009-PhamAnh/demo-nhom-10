import {
  nhanTrangThaiHoaDon,
  nhanTrangThaiPhieu,
  nhanTrangThaiPhong,
} from "@/lib/status";

const BANG = {
  phong: nhanTrangThaiPhong,
  phieu: nhanTrangThaiPhieu,
  hoaDon: nhanTrangThaiHoaDon,
} as const;

/** Nhan trang thai co cham tron, mau lay tu lib/status. */
export function StatusBadge({
  trangThai,
  loai = "phong",
}: {
  trangThai: string;
  loai?: keyof typeof BANG;
}) {
  const t = BANG[loai](trangThai);
  return (
    <span
      className="inline-flex items-center gap-[6px] rounded-full px-[9px] py-[3px] text-[11.5px] font-medium"
      style={{ color: t.fg, background: t.bg }}
    >
      <span className="size-[6px] rounded-full" style={{ background: t.dot }} />
      {t.nhan}
    </span>
  );
}
