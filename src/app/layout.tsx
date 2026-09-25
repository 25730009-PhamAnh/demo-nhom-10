import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

// Ba ho chu theo design/README.md. Subset "vietnamese" la bat buoc — thieu no
// thi chu co dau se roi ve font du phong cua he thong.
// adjustFontFallback: false — next/font mac dinh sinh mot font du phong tong hop
// ("Playfair Display Fallback") va chen no ngay sau Playfair. Font do CO glyph ₫
// nen trinh duyet dung no va ky hieu bi nho len, lech metric. Tat di roi tu khai
// bao du phong de ₫ roi xuong Be Vietnam Pro.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  adjustFontFallback: false,
  fallback: ["Be Vietnam Pro", "Georgia", "serif"],
});

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Sen Vàng · Quản lý khách sạn",
  description: "Demo Next.js + Drizzle + shadcn/ui cho đồ án Quản lý khách sạn",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${playfair.variable} ${beVietnam.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground min-h-full font-sans">
        {children}
      </body>
    </html>
  );
}
