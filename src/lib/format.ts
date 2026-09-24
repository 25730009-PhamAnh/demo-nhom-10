const vnd = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

/** DECIMAL(18,2) tu MySQL ve duoi dang chuoi de khong mat do chinh xac. */
export function formatVnd(value: string | number): string {
  return vnd.format(Number(value));
}
