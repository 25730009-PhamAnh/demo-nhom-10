import { Sidebar } from "@/components/layout/sidebar";
import { NHAN_VIEN_MAC_DINH } from "@/lib/queries/accounts";

/**
 * Khung chung cua 8 man hinh nghiep vu: sidebar 248px + vung noi dung.
 * Chua co phien dang nhap that (spec muc 6), nen nhan vien lay tu hang mac dinh
 * roi truyen xuong Sidebar bang prop.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex h-screen min-w-[1280px]">
      <Sidebar
        hoTen={NHAN_VIEN_MAC_DINH.hoTen}
        vaiTro={NHAN_VIEN_MAC_DINH.vaiTro}
        maTk={NHAN_VIEN_MAC_DINH.maTk}
      />
      <div className="flex min-w-0 flex-grow flex-col">{children}</div>
    </div>
  );
}
