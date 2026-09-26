/**
 * Doi loi cua mysql2 thanh cau hien len giao dien.
 *
 * SIGNAL SQLSTATE '45000' trong thu tuc / trigger (errno 1644) la loi nghiep
 * vu: giu nguyen van MESSAGE_TEXT de nguoi xem thay quy tac nam o tang CSDL,
 * chi bo tien to "Loi: " ma mot so thu tuc tu them.
 *
 * Loi khac (mat ket noi, sai kieu du lieu, sai cu phap) khong phai loi cua
 * nguoi dung nen nem tiep, de hien o error.tsx thay vi gia lam thong bao.
 */
export function thongBaoCsdl(err: unknown): string {
  if (laLoiNghiepVu(err)) {
    return `CSDL từ chối: ${err.sqlMessage.replace(/^Loi:\s*/, "")}`;
  }
  throw err;
}

/** errno 1644 = ER_SIGNAL_EXCEPTION, loi do SIGNAL SQLSTATE '45000' sinh ra. */
function laLoiNghiepVu(err: unknown): err is { errno: 1644; sqlMessage: string } {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { errno?: unknown; sqlMessage?: unknown };
  return e.errno === 1644 && typeof e.sqlMessage === "string";
}
