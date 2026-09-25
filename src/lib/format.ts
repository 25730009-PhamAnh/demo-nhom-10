const vnd = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

/** DECIMAL(18,2) tu MySQL ve duoi dang chuoi de khong mat do chinh xac. */
export function formatVnd(value: string | number): string {
  return vnd.format(Number(value));
}

const so = new Intl.NumberFormat("vi-VN");

/** Tach phan ngay khoi chuoi DATE hoac DATETIME cua MySQL. */
function tachNgay(iso: string): [string, string, string] {
  const [ngay] = iso.split(/[ T]/);
  const [y, m, d] = ngay.split("-");
  return [d, m, y];
}

/** '2026-09-23' -> '23/09/2026'. Nhan ca chuoi DATETIME. */
export function formatNgay(iso: string): string {
  const [d, m, y] = tachNgay(iso);
  return `${d}/${m}/${y}`;
}

/** '2026-09-23 11:42:00' -> '11:42 · 23/09/2026'. */
export function formatNgayGio(iso: string): string {
  const gio = iso.split(/[ T]/)[1]?.slice(0, 5) ?? "00:00";
  return `${gio} · ${formatNgay(iso)}`;
}

/** 1284 -> '1.284'. */
export function formatSo(v: number): string {
  return so.format(v);
}
