/** Khung the trang: nen trang, vien, bo goc 14px, dem 20px. */
export function SectionCard({
  tieuDe,
  phu,
  hanhDong,
  children,
  className = "",
}: {
  tieuDe?: string;
  phu?: React.ReactNode;
  hanhDong?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-card border-border flex flex-col gap-[14px] rounded-[14px] border p-5 ${className}`}
    >
      {tieuDe ? (
        <div className="flex items-center gap-3">
          <h2 className="text-foreground m-0 flex-grow text-[15px] font-semibold">
            {tieuDe}
          </h2>
          {phu ? <span className="text-[12px] text-[#857C73]">{phu}</span> : null}
          {hanhDong}
        </div>
      ) : null}
      {children}
    </section>
  );
}
