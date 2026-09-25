/** Dong thay cho danh sach rong — khong bao gio de vung trong tron. */
export function EmptyState({ thongDiep }: { thongDiep: string }) {
  return (
    <div className="text-muted-foreground flex min-h-[120px] items-center justify-center text-[13px]">
      {thongDiep}
    </div>
  );
}
