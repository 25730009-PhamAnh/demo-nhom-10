"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { MUC_DIEU_HUONG } from "@/lib/nav";

/**
 * Thanh dieu huong trai, 248px, theo design/Main.dc.html dong 21-55.
 *
 * Client Component vi can usePathname() de to sang muc dang mo. Thong tin nhan
 * vien duoc truyen tu (app)/layout.tsx bang prop, KHONG import tu
 * queries/accounts — module do doc CSDL, chi duoc chay tren server.
 */
export function Sidebar({
  hoTen,
  vaiTro,
  maTk,
}: {
  hoTen: string;
  vaiTro: string;
  maTk: string;
}) {
  const pathname = usePathname();

  // "/" phai so tuyet doi, khong thi moi route deu khop.
  const dangMo = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const chuCai = hoTen
    .split(" ")
    .slice(-2)
    .map((t) => t[0])
    .join("")
    .toUpperCase();

  return (
    <aside className="bg-sidebar flex w-[248px] shrink-0 flex-col">
      <div className="flex flex-col gap-[3px] px-[22px] pt-[26px] pb-[18px]">
        <div className="flex items-center gap-[11px]">
          <svg
            width="26" height="26" viewBox="0 0 24 24" fill="none"
            stroke="var(--sidebar-primary)" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          >
            <path d="M12 21c-4.4 0-8-3.1-8-7 3 0 5.7 1.3 7.2 3.4" />
            <path d="M12 21c4.4 0 8-3.1 8-7-3 0-5.7 1.3-7.2 3.4" />
            <path d="M12 17.5c-2.1-2.7-2.1-6.9 0-14.5 2.1 7.6 2.1 11.8 0 14.5z" />
          </svg>
          <span className="font-display text-[19px] font-bold tracking-[0.07em] text-white">
            SEN VÀNG
          </span>
        </div>
        <span className="pl-[37px] text-[10px] tracking-[0.2em] text-[#8AA29B] uppercase">
          Hotel Management
        </span>
      </div>

      <nav
        aria-label="Điều hướng chính"
        className="flex flex-grow flex-col gap-[2px] px-[14px] py-[6px]"
      >
        {MUC_DIEU_HUONG.map((m) => {
          const on = dangMo(m.href);
          const Icon = m.icon;
          return (
            <Link
              key={m.href}
              href={m.href}
              aria-current={on ? "page" : undefined}
              className={`flex h-[44px] items-center gap-[11px] rounded-[9px] px-3 text-[13.5px] no-underline transition-colors ${
                on
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/45 font-normal"
              }`}
            >
              <Icon size={18} strokeWidth={1.7} className="shrink-0" />
              <span className="flex-grow">{m.nhan}</span>
              {on ? (
                <span className="bg-sidebar-primary size-[5px] rounded-full" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-sidebar-border flex flex-col gap-[2px] border-t px-[14px] pt-3 pb-4">
        <div className="flex items-center gap-[10px] px-3 py-[10px]">
          <span className="bg-sidebar-accent flex size-[34px] shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-[#E8F1ED]">
            {chuCai}
          </span>
          <span className="flex flex-grow flex-col gap-px">
            <span className="text-[13px] font-medium text-white">{hoTen}</span>
            <span className="text-[11px] text-[#8AA29B]">
              {vaiTro} · {maTk}
            </span>
          </span>
        </div>
        <Link
          href="/login"
          className="text-sidebar-foreground hover:bg-sidebar-accent/45 flex h-[42px] items-center gap-[11px] rounded-[9px] px-3 text-[13px] no-underline"
        >
          <LogOut size={18} strokeWidth={1.7} />
          <span>Đăng xuất</span>
        </Link>
      </div>
    </aside>
  );
}
