"use client";

import { useId, useState } from "react";

import { suaKhachHang, themKhachHang } from "@/app/(app)/customers/actions";
import { ThongBao } from "@/components/shared/thong-bao";
import { useThaoTac } from "@/components/shared/use-thao-tac";
import type { KhachDaLuu } from "@/lib/thao-tac/khach-hang";

/**
 * Form them / sua mot ho so khach. Co `ban` thi la form sua (ma khach chi doc),
 * khong thi la form them. Moi quy tac (dinh dang CCCD / SDT / email, trung ho
 * so) do sp_ChuanHoaKhachHang quyet dinh; loi cua CSDL hien ngay duoi nut.
 * `khiXong` nhan ho so da luu: form dat phong dung de chon luon khach vua tao.
 */
export function KhachHangForm({
  ban,
  khiXong,
  khiDong,
}: {
  ban?: KhachDaLuu;
  khiXong?: (k: KhachDaLuu) => void;
  khiDong?: () => void;
}) {
  const id = useId();
  const [hoTen, setHoTen] = useState(ban?.hoTen ?? "");
  const [cccd, setCccd] = useState(ban?.cccd ?? "");
  const [sdt, setSdt] = useState(ban?.sdt ?? "");
  const [email, setEmail] = useState(ban?.email ?? "");
  const tt = useThaoTac();

  const luu = () =>
    tt.chay(
      () =>
        ban
          ? suaKhachHang(ban.maKh, hoTen, cccd, sdt, email)
          : themKhachHang(hoTen, cccd, sdt, email),
      (k) => {
        khiXong?.(k);
        if (ban) return `Đã lưu hồ sơ ${k.maKh} · ${k.hoTen}.`;
        setHoTen("");
        setCccd("");
        setSdt("");
        setEmail("");
        return `Đã thêm khách ${k.hoTen} · ${k.maKh}.`;
      },
    );

  const o = "border-input bg-card h-10 rounded-[10px] border px-3 text-[13px]";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        luu();
      }}
      aria-label={ban ? `Sửa hồ sơ ${ban.maKh}` : "Thêm khách hàng"}
      className="border-border flex flex-col gap-3 rounded-[10px] border p-4"
    >
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Truong id={`${id}-ten`} nhan="Họ tên *">
          <input id={`${id}-ten`} name="hoTen" required maxLength={100} value={hoTen}
            onChange={(e) => setHoTen(e.target.value)} className={o} />
        </Truong>
        <Truong id={`${id}-cccd`} nhan="CCCD / hộ chiếu *">
          <input id={`${id}-cccd`} name="cccd" required maxLength={20} value={cccd}
            onChange={(e) => setCccd(e.target.value)} className={`${o} font-mono`} />
        </Truong>
        <Truong id={`${id}-sdt`} nhan="Số điện thoại">
          <input id={`${id}-sdt`} name="sdt" inputMode="tel" maxLength={20} value={sdt}
            onChange={(e) => setSdt(e.target.value)} className={`${o} font-mono`} />
        </Truong>
        <Truong id={`${id}-email`} nhan="Email">
          <input id={`${id}-email`} name="email" type="email" maxLength={100} value={email}
            onChange={(e) => setEmail(e.target.value)} className={o} />
        </Truong>
      </div>
      <div className="flex items-center gap-3">
        {ban ? <span className="text-muted-foreground font-mono text-[12px]">{ban.maKh}</span> : null}
        <span className="flex-grow" />
        {khiDong ? (
          <button type="button" onClick={khiDong} className="text-muted-foreground h-10 px-3 text-[13px]">
            Đóng
          </button>
        ) : null}
        <button
          type="submit"
          disabled={tt.dangChay}
          className="bg-primary text-primary-foreground h-10 rounded-[10px] px-5 text-[13px] font-semibold disabled:opacity-45"
        >
          {tt.dangChay ? "Đang lưu…" : ban ? "Lưu thay đổi" : "Lưu khách hàng"}
        </button>
      </div>
      <ThongBao tb={tt.thongBao} />
    </form>
  );
}

function Truong({ id, nhan, children }: { id: string; nhan: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label htmlFor={id} className="text-muted-foreground text-[12px]">
        {nhan}
      </label>
      {children}
    </div>
  );
}
