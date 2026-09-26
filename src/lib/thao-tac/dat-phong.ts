import "server-only";

import { thongBaoCsdl } from "@/db/loi";
import { callProcedure, callProcedureOut } from "@/db/procedures";
import { getLoaiPhongConTrong } from "@/lib/queries/bookings";

import type { KetQua } from "./ket-qua";

export type DatPhongVao = {
  maKh: string;
  maTk: string;
  ngayNhan: string;
  ngayTra: string;
  maLoaiPhong: string;
};

/**
 * Lap phieu dat mot phong thuoc loai da chon (sp_DatPhong).
 *
 * Phong: phong dau tien sp_TraCuuPhongTrong tra cho loai va khoang ngay do.
 * Tien coc: mot dem theo dung don gia form dang hien (getLoaiPhongConTrong),
 * tinh lai tren server, khong tin so client gui len. Moi quy tac con lai
 * (ngay da qua, khach khong ton tai, phong vua bi dat mat...) do sp_DatPhong
 * quyet dinh.
 */
export async function datPhong(
  v: DatPhongVao,
): Promise<KetQua<{ maDatPhong: string; soPhong: string; tienCoc: string }>> {
  try {
    const [phong, loai] = await Promise.all([
      callProcedure<{ MaPhong: string; SoPhong: string }>("sp_TraCuuPhongTrong", [
        v.ngayNhan,
        v.ngayTra,
        v.maLoaiPhong,
      ]),
      getLoaiPhongConTrong(v.ngayNhan, v.ngayTra),
    ]);
    const p = phong[0];
    if (!p) {
      return { ok: false, loi: "Loại phòng này đã hết phòng trống trong khoảng ngày đã chọn" };
    }
    const tienCoc = loai.find((l) => l.maLoaiPhong === v.maLoaiPhong)!.donGiaNgay;

    const { out } = await callProcedureOut(
      "sp_DatPhong",
      [v.maKh, v.maTk, v.ngayNhan, v.ngayTra, p.MaPhong, tienCoc],
      1,
    );
    return { ok: true, data: { maDatPhong: out[0]!, soPhong: p.SoPhong, tienCoc } };
  } catch (err) {
    return { ok: false, loi: thongBaoCsdl(err) };
  }
}
