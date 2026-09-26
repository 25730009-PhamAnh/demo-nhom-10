/**
 * Doi loi cua mysql2 thanh cau hien len giao dien, ngay duoi nut vua bam.
 *
 * SIGNAL SQLSTATE '45000' trong thu tuc / trigger (errno 1644) la loi nghiep
 * vu: giu nguyen van MESSAGE_TEXT de nguoi xem thay quy tac nam o tang CSDL,
 * chi bo tien to "Loi: " ma mot so thu tuc tu them.
 *
 * Loi CSDL khac (mat ket noi, sai kieu du lieu, sai cu phap...) cung thanh
 * mot cau kem ma loi, de mot nut bam loi khong lam vo ca trang; loi do con
 * duoc ghi console.error tren server vi la loi cua he thong, khong phai cua
 * nguoi dung. Loi khong den tu CSDL (loi lap trinh) thi nem tiep.
 */
export function thongBaoCsdl(err: unknown): string {
  if (laLoiNghiepVu(err)) {
    return `CSDL từ chối: ${err.sqlMessage.replace(/^Loi:\s*/, "")}`;
  }
  if (laLoiCsdl(err)) {
    console.error("Loi CSDL khong phai loi nghiep vu:", err);
    return `Lỗi CSDL (${err.errno ?? "mất kết nối"}): ${err.sqlMessage ?? err.message}`;
  }
  throw err;
}

/** errno 1644 = ER_SIGNAL_EXCEPTION, loi do SIGNAL SQLSTATE '45000' sinh ra. */
function laLoiNghiepVu(err: unknown): err is { errno: 1644; sqlMessage: string } {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { errno?: unknown; sqlMessage?: unknown };
  return e.errno === 1644 && typeof e.sqlMessage === "string";
}

/**
 * Loi cua mysql2: errno cua MySQL, errno am cua socket (ECONNREFUSED khi MySQL
 * tat), hoac loi `fatal` khong errno khi connection bi ngat giua chung.
 */
function laLoiCsdl(err: unknown): err is Error & { errno?: number; sqlMessage?: string } {
  if (!(err instanceof Error)) return false;
  const e = err as { errno?: unknown; fatal?: unknown };
  return typeof e.errno === "number" || e.fatal === true;
}
