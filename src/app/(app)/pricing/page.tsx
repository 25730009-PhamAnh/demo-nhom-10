import { Topbar } from "@/components/layout/topbar";
import { CacKhoangGia } from "@/components/pricing/cac-khoang-gia";
import { DatGiaForm } from "@/components/pricing/dat-gia-form";
import { LichGia } from "@/components/pricing/lich-gia";
import { getBangGia, getLichGia } from "@/lib/queries/bang-gia";
import { getNgayHienTai } from "@/lib/queries/ngay";
import { laNgay } from "@/lib/thao-tac/kiem-tra";

export default async function BangGiaPage({ searchParams }: PageProps<"/pricing">) {
  const [{ tu }, homNay] = await Promise.all([searchParams, getNgayHienTai()]);
  // ?tu= sai dinh dang (go tay tren thanh dia chi) thi ve hom nay, khong vo trang.
  const tuNgay = typeof tu === "string" && laNgay(tu) ? tu : homNay;
  const [bangGia, lich] = await Promise.all([getBangGia(), getLichGia(tuNgay)]);

  return (
    <>
      <Topbar
        tieuDe="Bảng giá phòng"
        phu="Giá theo ngày · chỉ áp dụng cho phiếu đặt mới"
        hanhDong={
          <span className="text-muted-foreground text-[12.5px]">Phiếu đã lập giữ giá đã chốt (QT-06)</span>
        }
      />

      <main className="flex min-h-0 flex-grow flex-col gap-5 overflow-auto px-8 py-7">
        <DatGiaForm
          loaiPhong={bangGia.map(({ maLoaiPhong, tenLoaiPhong, donGiaNgay }) => ({
            maLoaiPhong,
            tenLoaiPhong,
            donGiaNgay,
          }))}
          homNay={homNay}
        />
        <LichGia lich={lich} tuNgay={tuNgay} homNay={homNay} />
        <CacKhoangGia bangGia={bangGia} homNay={homNay} />
      </main>
    </>
  );
}
