import { LoginForm } from "@/components/auth/login-form";

/** Trang dang nhap nam NGOAI shell: khong sidebar, khong topbar. */
export default function DangNhapPage() {
  return (
    <div className="flex min-h-screen">
      <section className="bg-sidebar hidden w-[46%] shrink-0 flex-col justify-between p-14 lg:flex">
        <div className="flex items-center gap-[11px]">
          <svg
            width="30" height="30" viewBox="0 0 24 24" fill="none"
            stroke="var(--sidebar-primary)" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          >
            <path d="M12 21c-4.4 0-8-3.1-8-7 3 0 5.7 1.3 7.2 3.4" />
            <path d="M12 21c4.4 0 8-3.1 8-7-3 0-5.7 1.3-7.2 3.4" />
            <path d="M12 17.5c-2.1-2.7-2.1-6.9 0-14.5 2.1 7.6 2.1 11.8 0 14.5z" />
          </svg>
          <span className="font-display text-[21px] font-bold tracking-[0.07em] text-white">
            SEN VÀNG
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="font-display m-0 text-[34px] leading-[1.25] font-semibold text-white">
            Lễ tân, buồng phòng và kế toán trên cùng một màn hình.
          </h1>
          <p className="m-0 max-w-[420px] text-[13.5px] leading-[1.7] text-[#9FB5AE]">
            Tra cứu phòng trống, lập phiếu đặt, nhận &amp; trả phòng, ghi nhận dịch vụ và
            xuất hóa đơn — tất cả chạy trên một cơ sở dữ liệu duy nhất.
          </p>
        </div>

        <span className="text-[11.5px] text-[#8AA29B]">
          Phiên bản 1.0 · Hệ thống nội bộ — chỉ dành cho nhân viên
        </span>
      </section>

      <section className="flex flex-grow items-center justify-center p-10">
        <div className="flex w-full max-w-[380px] flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-display m-0 text-[24px] font-semibold">Đăng nhập</h2>
            <p className="text-muted-foreground m-0 text-[13px] leading-[1.6]">
              Dùng tài khoản nhân viên đã được cấp. Quyền truy cập theo loại tài khoản
              được phân công.
            </p>
          </div>

          <LoginForm />

          <p className="text-muted-foreground m-0 border-t border-[var(--border)] pt-4 text-[11.5px]">
            Mọi thao tác đều được ghi nhận kèm tài khoản thực hiện.
          </p>
        </div>
      </section>
    </div>
  );
}
