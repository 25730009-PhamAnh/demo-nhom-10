import "server-only";

import { refresh } from "next/cache";

import type { KetQua } from "@/lib/thao-tac/ket-qua";

/**
 * Goi o cuoi moi Server Action ghi: thanh cong thi refresh() de trang hien tai
 * doc lai CSDL ngay trong cung response (next/cache, chi chay trong Server
 * Action). Tach khoi thao-tac/* vi test goi thang tang do, ngoai request Next.
 */
export function lamMoiNeuXong<T>(r: KetQua<T>): KetQua<T> {
  if (r.ok) refresh();
  return r;
}
