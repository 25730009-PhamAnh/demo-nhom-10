"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, TriangleAlert } from "lucide-react";

import { dangNhapGia } from "@/lib/queries/accounts";

/**
 * Form dang nhap, theo design/Login.dc.html.
 *
 * Goi dangNhapGia ngay phia client vi day la du lieu gia (spec muc 6). Khi noi
 * CSDL that, doi thanh Server Action goi sp_DangNhap — luc do mat khau va danh
 * sach tai khoan se khong con nam trong bundle trinh duyet nua.
 */
export function LoginForm() {
  const router = useRouter();
  const [tenDangNhap, setTenDangNhap] = useState("letan.lan");
  const [matKhau, setMatKhau] = useState("");
  const [hienMatKhau, setHienMatKhau] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangGui, setDangGui] = useState(false);

  async function guiForm(e: React.FormEvent) {
    e.preventDefault();
    setLoi(null);
    setDangGui(true);
    try {
      await dangNhapGia(tenDangNhap, matKhau);
      router.push("/");
    } catch (err) {
      setLoi(err instanceof Error ? err.message : String(err));
      setDangGui(false);
    }
  }

  return (
    <form onSubmit={guiForm} className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-[6px]">
        <label htmlFor="u" className="text-[12.5px] font-medium">
          Tên đăng nhập
        </label>
        <input
          id="u"
          name="u"
          autoComplete="username"
          value={tenDangNhap}
          onChange={(e) => setTenDangNhap(e.target.value)}
          className="border-input bg-card h-11 rounded-[10px] border px-3 font-mono text-[13px]"
        />
      </div>

      <div className="flex flex-col gap-[6px]">
        <label htmlFor="p" className="text-[12.5px] font-medium">
          Mật khẩu
        </label>
        <div className="border-input bg-card flex h-11 items-center gap-2 rounded-[10px] border px-3">
          <input
            id="p"
            name="p"
            type={hienMatKhau ? "text" : "password"}
            autoComplete="current-password"
            value={matKhau}
            onChange={(e) => setMatKhau(e.target.value)}
            className="min-w-0 flex-grow bg-transparent font-mono text-[13px] outline-none"
          />
          <button
            type="button"
            aria-label={hienMatKhau ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            onClick={() => setHienMatKhau((v) => !v)}
            className="text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg"
          >
            {hienMatKhau ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {loi ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[10px] px-3 py-[10px] text-[12.5px]"
          style={{ background: "#F8E8E5", color: "#8C3A31" }}
        >
          <TriangleAlert size={16} strokeWidth={1.9} className="mt-px shrink-0" />
          <span>{loi}</span>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={dangGui}
        className="bg-primary text-primary-foreground h-11 rounded-[10px] text-[13.5px] font-semibold disabled:opacity-60"
      >
        {dangGui ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>

      <p className="text-muted-foreground m-0 text-[11.5px]">
        Tài khoản demo: <code className="font-mono">letan.lan</code> /{" "}
        <code className="font-mono">LeTan@123</code> ·{" "}
        <code className="font-mono">admin</code> /{" "}
        <code className="font-mono">Admin@123</code>
      </p>
    </form>
  );
}
