"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { Search } from "lucide-react";

import { timKhach } from "@/app/(app)/customers/actions";
import { KhachHangForm } from "@/components/customers/khach-hang-form";
import type { KhachTimThay } from "@/lib/queries/customers";

type CheDo = "co" | "moi";

/**
 * Buoc 1 cua form dat phong, theo design/Booking.dc.html dong 73-103. "Khach da
 * co" tim theo ho ten / SDT / CCCD (timKhach, 250 ms sau lan go cuoi); "Khach
 * moi" tao ho so ngay tai cho roi chon luon khach vua tao.
 */
export function ChonKhach({
  khach,
  onChon,
}: {
  khach: KhachTimThay | null;
  onChon: (k: KhachTimThay | null) => void;
}) {
  const [cheDo, setCheDo] = useState<CheDo>("co");

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Loại khách" className="bg-background flex gap-1 self-start rounded-[9px] p-[3px]">
        {([
          ["co", "Khách đã có"],
          ["moi", "Khách mới"],
        ] as const).map(([k, nhan]) => (
          <button
            key={k}
            type="button"
            onClick={() => setCheDo(k)}
            aria-pressed={cheDo === k}
            className={`h-[30px] rounded-[7px] px-[14px] text-[12.5px] ${
              cheDo === k ? "bg-card text-foreground font-semibold" : "text-muted-foreground"
            }`}
          >
            {nhan}
          </button>
        ))}
      </div>

      {cheDo === "moi" ? (
        <KhachHangForm
          khiXong={(k) => {
            onChon({ ...k, soLanLuuTru: 0 });
            setCheDo("co");
          }}
        />
      ) : khach ? (
        <TheKhach khach={khach} onDoi={() => onChon(null)} />
      ) : (
        <TimKhach onChon={onChon} onTaoMoi={() => setCheDo("moi")} />
      )}
    </div>
  );
}

function TheKhach({ khach: k, onDoi }: { khach: KhachTimThay; onDoi: () => void }) {
  const chuCai = k.hoTen
    .split(" ")
    .slice(-2)
    .map((t) => t[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex items-center gap-[14px] rounded-[11px] border border-[#C9E2D5] bg-[#F1F7F4] px-4 py-[14px]">
      <span className="bg-primary font-display flex size-[42px] shrink-0 items-center justify-center rounded-full text-[16px] font-semibold text-white">
        {chuCai}
      </span>
      <div className="flex flex-grow flex-col gap-[3px]">
        <div className="flex items-center gap-[9px]">
          <span className="text-[14.5px] font-semibold">{k.hoTen}</span>
          <span className="rounded-full bg-[#E3F0E9] px-2 py-[2px] text-[11px] font-semibold text-[#14664B]">
            {k.soLanLuuTru > 0 ? `Đã lưu trú ${k.soLanLuuTru} lần` : "Chưa lưu trú lần nào"}
          </span>
        </div>
        <span className="font-mono text-[12.5px] text-[#57504A]">
          {k.maKh} · CCCD {k.cccd}
          {k.sdt ? ` · ${k.sdt}` : ""}
        </span>
      </div>
      <button
        type="button"
        onClick={onDoi}
        className="h-[34px] rounded-lg border border-[#C9E2D5] bg-white px-[14px] text-[12.5px] font-semibold text-[#14483F]"
      >
        Đổi khách
      </button>
    </div>
  );
}

function TimKhach({
  onChon,
  onTaoMoi,
}: {
  onChon: (k: KhachTimThay) => void;
  onTaoMoi: () => void;
}) {
  const id = useId();
  const [q, setQ] = useState("");
  const [ketQua, setKetQua] = useState<KhachTimThay[]>([]);
  const [mo, setMo] = useState(false);
  const [chiSo, setChiSo] = useState(0);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangTim, chuyenTiep] = useTransition();

  // Tim lai 250 ms sau lan go cuoi. Ket qua cua lan go cu tra ve muon thi bo.
  // Tu khoa rong cung tim: may chu tra 10 khach moi nhat, hien khi bam vao o.
  useEffect(() => {
    let conHieuLuc = true;
    const hen = setTimeout(() => {
      chuyenTiep(async () => {
        const r = await timKhach(q);
        if (!conHieuLuc) return;
        if (r.ok) {
          setKetQua(r.data);
          setChiSo(0);
          setLoi(null);
        } else {
          setLoi(r.loi);
        }
      });
    }, 250);
    return () => {
      conHieuLuc = false;
      clearTimeout(hen);
    };
  }, [q]);

  const ds = `${id}-ds`;
  const dangChon = mo ? ketQua[chiSo] : undefined;
  const chon = (k: KhachTimThay) => {
    setMo(false);
    onChon(k);
  };

  return (
    <div className="relative flex flex-col gap-2">
      <div className="bg-muted border-border flex h-11 items-center gap-[9px] rounded-[10px] border px-[14px]">
        <Search size={16} strokeWidth={1.9} className="shrink-0 text-[#857C73]" />
        <label htmlFor="timkh" className="sr-only">
          Tìm khách hàng
        </label>
        <input
          id="timkh"
          type="search"
          role="combobox"
          aria-expanded={mo && ketQua.length > 0}
          aria-controls={ds}
          aria-autocomplete="list"
          aria-activedescendant={dangChon ? `${id}-${dangChon.maKh}` : undefined}
          autoComplete="off"
          placeholder="Nhập CCCD, số điện thoại hoặc họ tên…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setMo(true);
          }}
          onFocus={() => setMo(true)}
          onBlur={() => setMo(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setMo(true);
              setChiSo((i) => Math.min(i + 1, ketQua.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setChiSo((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && dangChon) {
              e.preventDefault();
              chon(dangChon);
            } else if (e.key === "Escape") {
              // O type="search": mac dinh Esc xoa chu va ban su kien input, lam
              // danh sach mo lai voi 10 khach moi nhat. Esc chi dong danh sach.
              e.preventDefault();
              setMo(false);
            }
          }}
          className="text-foreground min-w-0 flex-grow border-0 bg-transparent text-[13.5px] outline-none"
        />
        {dangTim ? <span className="text-muted-foreground text-[11.5px]">Đang tìm…</span> : null}
      </div>

      {mo && ketQua.length > 0 ? (
        <ul
          id={ds}
          role="listbox"
          aria-label="Khách hàng tìm thấy"
          className="bg-card border-border absolute inset-x-0 top-[48px] z-10 m-0 flex max-h-[320px] list-none flex-col overflow-auto rounded-[10px] border p-1 shadow-lg"
        >
          {ketQua.map((k, i) => (
            <li
              key={k.maKh}
              id={`${id}-${k.maKh}`}
              role="option"
              aria-selected={i === chiSo}
              onMouseDown={(e) => {
                e.preventDefault();
                chon(k);
              }}
              onMouseEnter={() => setChiSo(i)}
              className={`flex cursor-pointer flex-col gap-px rounded-lg px-3 py-2 ${i === chiSo ? "bg-accent" : ""}`}
            >
              <span className="text-[13px] font-medium">{k.hoTen}</span>
              <span className="text-muted-foreground font-mono text-[11.5px]">
                {k.maKh} · CCCD {k.cccd}
                {k.sdt ? ` · ${k.sdt}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {q.trim() !== "" && ketQua.length === 0 && !dangTim ? (
        <p className="text-muted-foreground m-0 text-[12.5px]">
          Không tìm thấy khách nào.{" "}
          <button type="button" onClick={onTaoMoi} className="text-primary font-semibold">
            Tạo hồ sơ khách mới
          </button>
        </p>
      ) : null}
      {loi ? (
        <p role="alert" className="m-0 text-[12.5px] text-[#8C3A31]">
          {loi}
        </p>
      ) : null}
    </div>
  );
}
