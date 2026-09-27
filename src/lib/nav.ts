import {
  BedDouble,
  CalendarPlus,
  FileText,
  LayoutGrid,
  LogIn,
  Receipt,
  SprayCan,
  TrendingUp,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type MucDieuHuong = { nhan: string; href: string; icon: LucideIcon };

/** Thu tu dung nhu thanh dieu huong trong design/Main.dc.html. */
export const MUC_DIEU_HUONG: MucDieuHuong[] = [
  { nhan: "Tổng quan",        href: "/",             icon: LayoutGrid },
  { nhan: "Sơ đồ phòng",      href: "/rooms",        icon: BedDouble },
  { nhan: "Buồng phòng",      href: "/housekeeping", icon: SprayCan },
  { nhan: "Bảo trì",          href: "/maintenance",  icon: Wrench },
  { nhan: "Đặt phòng",        href: "/bookings/new", icon: CalendarPlus },
  { nhan: "Nhận & trả phòng", href: "/front-desk",   icon: LogIn },
  { nhan: "Khách hàng",       href: "/customers",    icon: Users },
  { nhan: "Dịch vụ",          href: "/services",     icon: Receipt },
  { nhan: "Hóa đơn",          href: "/invoices",     icon: FileText },
  { nhan: "Báo cáo",          href: "/reports",      icon: TrendingUp },
];
