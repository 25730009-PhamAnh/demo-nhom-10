import { thongBaoCsdl } from "@/db/loi";

/**
 * Ket qua cua mot thao tac ghi. Loi cua CSDL la mot ket qua binh thuong (nguoi
 * dung bam sai thu tu), khong phai ngoai le, nen tra ve cho client hien duoi
 * nut bam thay vi lam vo trang.
 */
export type KetQua<T> = { ok: true; data: T } | { ok: false; loi: string };

/** Chay `viec`; loi CSDL thanh { ok: false, loi } qua thongBaoCsdl, loi khac nem tiep. */
export async function thucHien<T>(viec: () => Promise<T>): Promise<KetQua<T>> {
  try {
    return { ok: true, data: await viec() };
  } catch (err) {
    return { ok: false, loi: thongBaoCsdl(err) };
  }
}
