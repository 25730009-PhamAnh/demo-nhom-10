import { CircleCheck, TriangleAlert } from "lucide-react";

export type ThongBaoKieu = { loai: "ok" | "loi"; noiDung: string };

/** Dong ket qua ngay duoi nut vua bam: xanh khi xong, do khi CSDL tu choi. */
export function ThongBao({ tb }: { tb: ThongBaoKieu | null }) {
  if (!tb) return null;
  const ok = tb.loai === "ok";
  const Icon = ok ? CircleCheck : TriangleAlert;
  return (
    <div
      className="flex items-start gap-2 rounded-[10px] px-3 py-[10px] text-[12.5px]"
      style={ok ? { background: "#E3F0E9", color: "#14664B" } : { background: "#F8E8E5", color: "#8C3A31" }}
      role={ok ? "status" : "alert"}
    >
      <Icon size={16} strokeWidth={1.9} className="mt-px shrink-0" />
      <span>{tb.noiDung}</span>
    </div>
  );
}
