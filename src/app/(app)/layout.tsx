import { connection } from "next/server";

import { Sidebar } from "@/components/layout/sidebar";
import { getNhanVienMacDinh } from "@/lib/queries/accounts";

/**
 * Khung chung cua 8 man hinh nghiep vu: sidebar 248px + vung noi dung.
 * Chua co phien dang nhap that (phase 3), nen nhan vien la tai khoan mac dinh
 * doc tu TAI_KHOAN roi truyen xuong Sidebar bang prop.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Moi trang ben trong doc CSDL, nen phai render theo tung request. Khong co
  // dong nay thi next build prerender trang va dong bang du lieu luc build.
  await connection();
  const nv = await getNhanVienMacDinh();

  return (
    <div className="flex h-screen min-w-[1280px]">
      <Sidebar hoTen={nv.hoTen} vaiTro={nv.vaiTro} maTk={nv.maTk} />
      <div className="flex min-w-0 flex-grow flex-col">{children}</div>
    </div>
  );
}
