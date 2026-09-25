/**
 * The chi so tren dau man hinh, theo design/Main.dc.html dong 80-117.
 *
 * kieuSo="tien": dung JetBrains Mono thay vi Playfair. Ly do: Playfair Display
 * KHONG co glyph ₫ (da kiem bang document.fonts.check), nen ky hieu phai muon
 * font khac va lech metric ngay giua chuoi. design/README.md cung quy dinh
 * "JetBrains Mono — ... mọi con số tiền", nen day la lua chon dung design system.
 */
export function StatCard({
  nhan,
  giaTri,
  phu,
  phuNoiBat = false,
  kieuSo = "hienThi",
}: {
  nhan: string;
  giaTri: string;
  phu: string;
  phuNoiBat?: boolean;
  kieuSo?: "hienThi" | "tien";
}) {
  return (
    <div className="bg-card border-border flex flex-grow basis-0 flex-col gap-[9px] rounded-[14px] border px-5 py-[17px]">
      <span className="text-[10.5px] font-semibold tracking-[0.09em] text-[#857C73] uppercase">
        {nhan}
      </span>
      <span
        className={
          kieuSo === "tien"
            ? "text-foreground font-mono text-[26px] leading-none font-medium"
            : "font-display text-foreground text-[30px] leading-none font-semibold"
        }
      >
        {giaTri}
      </span>
      <span
        className={`text-[12px] ${phuNoiBat ? "text-[#8A5A0E]" : "text-muted-foreground"}`}
      >
        {phu}
      </span>
    </div>
  );
}
