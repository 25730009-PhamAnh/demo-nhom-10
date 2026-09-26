"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Minus, Plus, TriangleAlert } from "lucide-react";

import { datPhong, traCuuPhongTrong } from "@/app/(app)/bookings/new/actions";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";
import { formatVnd } from "@/lib/format";
import { congTien, tamTinhDatPhong, themNgay } from "@/lib/tinh-toan";

type LoaiPhong = {
  maLoaiPhong: string;
  tenLoaiPhong: string;
  donGiaNgay: string;
  soPhongTrong: number;
};

type Khach = { maKh: string; hoTen: string; cccd: string; sdt: string | null };

/**
 * Form lap phieu dat phong, theo design/Booking.dc.html.
 *
 * So dem LUON suy ra tu hai ngay (khong giu state rieng), nen hai con so khong
 * bao gio lech nhau. Nut − / + doi ngay tra chu khong doi so dem truc tiep.
 */
export function BookingForm({
  loaiPhong: loaiPhongBanDau,
  khach,
  ngayMacDinh,
}: {
  loaiPhong: LoaiPhong[];
  khach: Khach[];
  ngayMacDinh: string;
}) {
  const [loaiPhong, setLoaiPhong] = useState(loaiPhongBanDau);
  const [dangTraCuu, chuyenTiep] = useTransition();
  const [maKh, setMaKh] = useState(khach[0]?.maKh ?? "");
  const [ngayNhan, setNgayNhan] = useState(ngayMacDinh);
  const [ngayTra, setNgayTra] = useState(themNgay(ngayMacDinh, 2));
  const [maLoai, setMaLoai] = useState(loaiPhong[0]?.maLoaiPhong ?? "");
  const [soKhach, setSoKhach] = useState(2);
  const [loiTraCuu, setLoiTraCuu] = useState<string | null>(null);
  // Tang len sau moi lan lap phieu thanh cong, de tra cuu lai so phong trong.
  const [lanTraCuu, setLanTraCuu] = useState(0);
  const lap = useThaoTac();

  const loai = loaiPhong.find((l) => l.maLoaiPhong === maLoai);
  const khachDaChon = khach.find((k) => k.maKh === maKh);

  // So phong con trong phu thuoc vao khoang ngay, nen phai hoi lai may chu moi
  // khi ngay doi — khong duoc giu nguyen danh sach tinh cho ngay mac dinh.
  useEffect(() => {
    let conHieuLuc = true;
    chuyenTiep(async () => {
      const r = await traCuuPhongTrong(ngayNhan, ngayTra);
      if (!conHieuLuc) return;
      if (r.ok) setLoaiPhong(r.data);
      setLoiTraCuu(r.ok ? null : r.loi);
    });
    return () => {
      conHieuLuc = false;
    };
  }, [ngayNhan, ngayTra, lanTraCuu]);

  const tamTinh = useMemo(
    () =>
      tamTinhDatPhong({
        ngayNhan,
        ngayTra,
        donGia: loai?.donGiaNgay ?? "0.00",
      }),
    [ngayNhan, ngayTra, loai],
  );

  // Tien coc quy uoc bang mot dem, dung nhu du lieu mau. Server tinh lai
  // dung so nay khi lap phieu, khong nhan so tu day gui len.
  const tienCoc = tamTinh.loi ? "0.00" : (loai?.donGiaNgay ?? "0.00");
  const conLai = congTien(tamTinh.tienPhong, `-${tienCoc}`);

  return (
    <div className="flex min-h-0 flex-grow gap-5">
      <div className="flex min-w-0 flex-grow flex-col gap-5">
        <Buoc so={1} tieuDe="Thông tin khách hàng">
          <label htmlFor="kh" className="text-muted-foreground text-[12px]">
            Chọn khách hàng đã có hồ sơ
          </label>
          <select
            id="kh"
            value={maKh}
            onChange={(e) => setMaKh(e.target.value)}
            className="border-input bg-card h-10 rounded-[10px] border px-3 text-[13px]"
          >
            {khach.map((k) => (
              <option key={k.maKh} value={k.maKh}>
                {k.hoTen} — {k.cccd}
              </option>
            ))}
          </select>
          {khachDaChon ? (
            <div className="bg-muted flex items-center gap-3 rounded-[10px] px-3 py-[10px]">
              <span className="bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold">
                {khachDaChon.hoTen
                  .split(" ")
                  .slice(-2)
                  .map((t) => t[0])
                  .join("")}
              </span>
              <span className="flex flex-col gap-px">
                <span className="text-[13px] font-semibold">{khachDaChon.hoTen}</span>
                <span className="text-muted-foreground font-mono text-[11.5px]">
                  {khachDaChon.maKh} · CCCD {khachDaChon.cccd} · {khachDaChon.sdt}
                </span>
              </span>
            </div>
          ) : null}
        </Buoc>

        <Buoc so={2} tieuDe="Thời gian lưu trú">
          <div className="flex gap-4">
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="nhan" className="text-muted-foreground text-[12px]">
                Ngày nhận phòng
              </label>
              <input
                id="nhan"
                type="date"
                value={ngayNhan}
                onChange={(e) => setNgayNhan(e.target.value)}
                className="border-input bg-card h-10 rounded-[10px] border px-3 font-mono text-[13px]"
              />
            </div>
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="tra" className="text-muted-foreground text-[12px]">
                Ngày trả phòng
              </label>
              <input
                id="tra"
                type="date"
                value={ngayTra}
                onChange={(e) => setNgayTra(e.target.value)}
                className="border-input bg-card h-10 rounded-[10px] border px-3 font-mono text-[13px]"
              />
            </div>
            <div className="flex flex-col gap-[6px]">
              <span className="text-muted-foreground text-[12px]">Số đêm</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Giảm số đêm"
                  onClick={() => setNgayTra(themNgay(ngayTra, -1))}
                  className="bg-background size-[34px] rounded-[7px] text-[16px]"
                >
                  <Minus size={14} className="mx-auto" />
                </button>
                <span className="w-8 text-center font-mono text-[15px] font-medium">
                  {tamTinh.soDem}
                </span>
                <button
                  type="button"
                  aria-label="Tăng số đêm"
                  onClick={() => setNgayTra(themNgay(ngayTra, 1))}
                  className="bg-background size-[34px] rounded-[7px] text-[16px]"
                >
                  <Plus size={14} className="mx-auto" />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="sokhach" className="text-muted-foreground text-[12px]">
                Số khách
              </label>
              <input
                id="sokhach"
                type="number"
                min={1}
                value={soKhach}
                onChange={(e) => setSoKhach(Math.max(1, Number(e.target.value)))}
                className="border-input bg-card h-10 w-20 rounded-[10px] border px-3 font-mono text-[13px]"
              />
            </div>
          </div>
          <p className="text-muted-foreground m-0 text-[11.5px]">
            Đơn giá / đêm là trung bình bảng giá của các đêm đã chọn, đúng số hệ thống ghi vào phiếu.
          </p>
        </Buoc>

        <Buoc so={3} tieuDe="Chọn loại phòng">
          <span className="text-muted-foreground text-[12px]">
            {dangTraCuu
              ? "Đang tra cứu phòng trống…"
              : `${loaiPhong.reduce((s, l) => s + l.soPhongTrong, 0)} phòng trống trong khoảng ngày đã chọn`}
          </span>
          {loiTraCuu ? <ThongBao tb={{ loai: "loi", noiDung: loiTraCuu }} /> : null}
          <div className="grid grid-cols-2 gap-[10px] xl:grid-cols-3">
            {loaiPhong.map((l) => {
              const on = l.maLoaiPhong === maLoai;
              const het = l.soPhongTrong === 0;
              return (
                <button
                  key={l.maLoaiPhong}
                  type="button"
                  disabled={het}
                  onClick={() => setMaLoai(l.maLoaiPhong)}
                  aria-pressed={on}
                  className={`flex flex-col items-start gap-1 rounded-[10px] border p-3 text-left ${
                    on ? "border-primary bg-accent" : "border-border bg-card"
                  } ${het ? "cursor-not-allowed opacity-45" : ""}`}
                >
                  <span className="text-[13px] font-semibold">{l.tenLoaiPhong}</span>
                  <span className="text-muted-foreground text-[11.5px]">
                    Còn {l.soPhongTrong} phòng
                  </span>
                  <span className="font-mono text-[12.5px]">
                    {formatVnd(l.donGiaNgay)} / đêm
                  </span>
                </button>
              );
            })}
          </div>
        </Buoc>
      </div>

      <aside className="bg-card border-border flex w-[360px] shrink-0 flex-col gap-[18px] self-start rounded-[14px] border p-[22px]">
        <h2 className="m-0 text-[15px] font-semibold">Tạm tính</h2>

        {tamTinh.loi ? (
          <div
            className="flex items-start gap-2 rounded-[10px] px-3 py-[10px] text-[12.5px]"
            style={{ background: "#F8E8E5", color: "#8C3A31" }}
            role="alert"
          >
            <TriangleAlert size={16} strokeWidth={1.9} className="mt-px shrink-0" />
            <span>{tamTinh.loi}</span>
          </div>
        ) : null}

        <dl className="m-0 flex flex-col gap-[10px] text-[13px]">
          <Dong nhan="Loại phòng" giaTri={loai?.tenLoaiPhong ?? "—"} />
          <Dong nhan="Số đêm" giaTri={`${tamTinh.soDem} đêm · ${soKhach} khách`} mono />
          <Dong
            nhan="Đơn giá / đêm"
            giaTri={formatVnd(loai?.donGiaNgay ?? "0.00")}
            mono
          />
          <Dong nhan="Tiền phòng" giaTri={formatVnd(tamTinh.tienPhong)} mono />
          <Dong nhan="Tiền cọc" giaTri={`− ${formatVnd(tienCoc)}`} mono />
          <div className="border-border mt-1 flex items-baseline gap-2 border-t pt-3">
            <dt className="flex-grow text-[13px] font-semibold">Còn lại khi nhận phòng</dt>
            <dd className="m-0 font-mono text-[16px] font-medium">{formatVnd(conLai)}</dd>
          </div>
        </dl>

        <button
          type="button"
          disabled={tamTinh.loi !== null || !loai || loai.soPhongTrong === 0 || lap.dangChay}
          onClick={() =>
            lap.chay(
              () => datPhong(maKh, ngayNhan, ngayTra, maLoai),
              (d) => {
                setLanTraCuu((n) => n + 1);
                return `Đã lập phiếu ${d.maDatPhong} · phòng ${d.soPhong} · cọc ${formatVnd(d.tienCoc)}`;
              },
            )
          }
          className="bg-primary text-primary-foreground h-11 rounded-[10px] text-[13.5px] font-semibold disabled:cursor-not-allowed disabled:opacity-45"
        >
          {lap.dangChay ? "Đang lập phiếu…" : "Lập phiếu đặt phòng"}
        </button>
        <ThongBao tb={lap.thongBao} />
        {lap.thongBao?.loai === "ok" ? (
          <Link href="/front-desk" className="text-primary text-[12.5px] font-semibold">
            Sang Nhận & trả phòng →
          </Link>
        ) : null}
      </aside>
    </div>
  );
}

function Buoc({
  so,
  tieuDe,
  children,
}: {
  so: number;
  tieuDe: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border-border flex flex-col gap-4 rounded-[14px] border p-5">
      <div className="flex items-center gap-[10px]">
        <span className="bg-primary text-primary-foreground flex size-[22px] items-center justify-center rounded-full font-mono text-[12px]">
          {so}
        </span>
        <h2 className="m-0 text-[15px] font-semibold">{tieuDe}</h2>
      </div>
      {children}
    </section>
  );
}

function Dong({
  nhan,
  giaTri,
  mono = false,
}: {
  nhan: string;
  giaTri: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-muted-foreground flex-grow">{nhan}</dt>
      <dd className={`m-0 ${mono ? "font-mono text-[12.5px]" : ""}`}>{giaTri}</dd>
    </div>
  );
}
