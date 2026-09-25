import Link from "next/link";
import { Bell, Plus, Search } from "lucide-react";

/**
 * Thanh tieu de tren, cao 76px, theo design/Main.dc.html dong 57-76.
 * Server Component — moi thu deu la props, khong co trang thai.
 */
export function Topbar({
  tieuDe,
  phu,
  hanhDong,
}: {
  tieuDe: string;
  phu: string;
  hanhDong?: React.ReactNode;
}) {
  return (
    <header className="bg-card border-border flex h-[76px] shrink-0 items-center gap-[18px] border-b px-8">
      <div className="flex flex-col gap-[2px]">
        <h1 className="font-display text-foreground m-0 text-[22px] font-semibold">
          {tieuDe}
        </h1>
        <span className="text-muted-foreground text-[12px]">{phu}</span>
      </div>

      <span className="flex-grow" />

      <div className="border-border bg-muted flex h-10 w-[300px] items-center gap-[9px] rounded-[10px] border px-[14px]">
        <Search size={16} strokeWidth={1.9} className="shrink-0 text-[#857C73]" />
        <label htmlFor="q" className="sr-only">
          Tìm kiếm
        </label>
        <input
          id="q"
          type="search"
          placeholder="Tìm phòng, khách, mã đặt phòng…"
          className="text-foreground min-w-0 flex-grow border-0 bg-transparent text-[13px] outline-none"
        />
      </div>

      <button
        type="button"
        aria-label="Thông báo"
        className="border-border bg-card flex size-10 shrink-0 items-center justify-center rounded-[10px] border text-[#57504A]"
      >
        <Bell size={18} strokeWidth={1.8} />
      </button>

      {hanhDong ?? (
        <Link
          href="/bookings/new"
          className="bg-primary text-primary-foreground flex h-10 items-center gap-2 rounded-[10px] px-[18px] text-[13.5px] font-semibold no-underline"
        >
          <Plus size={16} strokeWidth={2} />
          <span>Đặt phòng mới</span>
        </Link>
      )}
    </header>
  );
}
