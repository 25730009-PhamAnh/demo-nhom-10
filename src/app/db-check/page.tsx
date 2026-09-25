import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { readDbSnapshot, type DbSnapshot } from "@/lib/db-check";
import { formatVnd } from "@/lib/format";

// Trang nay doc database moi lan tai, khong duoc cache tinh.
export const dynamic = "force-dynamic";

/** Mau badge theo trang thai phong (CK_PHONG_TrangThai trong schema). */
const ROOM_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  Trong: { label: "Trống", variant: "secondary" },
  DaDat: { label: "Đã đặt", variant: "default" },
  DangSuDung: { label: "Đang sử dụng", variant: "default" },
  DangDon: { label: "Đang dọn", variant: "outline" },
  BaoTri: { label: "Bảo trì", variant: "destructive" },
};

export default async function Home() {
  let snapshot: DbSnapshot | null = null;
  let error: string | null = null;

  try {
    snapshot = await readDbSnapshot();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Kiểm tra kết nối database
        </h1>
        <p className="text-muted-foreground mt-2">
          Trang tiện ích, không nằm trong thanh điều hướng. Chín màn hình nghiệp
          vụ dùng dữ liệu giả trong <code className="font-mono">src/lib/mock/</code>;
          trang này là chỗ duy nhất đọc thẳng MySQL qua Drizzle.
        </p>
      </header>

      {error ? <ConnectionError message={error} /> : null}
      {snapshot ? <Snapshot data={snapshot} /> : null}
    </main>
  );
}

function ConnectionError({ message }: { message: string }) {
  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">
          Không kết nối được database
        </CardTitle>
        <CardDescription>
          Kiểm tra MySQL đã chạy chưa và DATABASE_URL trong{" "}
          <code className="font-mono">.env.local</code> đã đúng chưa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="bg-muted overflow-x-auto rounded-md p-4 font-mono text-sm">
          {message}
        </pre>
      </CardContent>
    </Card>
  );
}

function Snapshot({ data }: { data: DbSnapshot }) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Đã kết nối
            <Badge variant="secondary" className="font-mono">
              {data.databaseName}
            </Badge>
          </CardTitle>
          <CardDescription>
            MySQL {data.serverVersion} · {data.tableCounts.length} bảng ·{" "}
            {data.tableCounts.reduce((sum, t) => sum + t.rows, 0)} dòng dữ liệu
            mẫu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {data.tableCounts.map((t) => (
              <li
                key={t.table}
                className="flex items-baseline justify-between gap-2 border-b pb-1"
              >
                <span className="truncate font-mono text-xs">{t.table}</span>
                <span className="text-muted-foreground tabular-nums text-sm">
                  {t.rows}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách phòng</CardTitle>
          <CardDescription>
            Đọc bằng Drizzle: PHONG join LOAI_PHONG.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Số phòng</TableHead>
                <TableHead>Tầng</TableHead>
                <TableHead>Loại phòng</TableHead>
                <TableHead className="text-right">Đơn giá / đêm</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rooms.map((room) => {
                const status = ROOM_STATUS[room.trangThai] ?? {
                  label: room.trangThai,
                  variant: "outline" as const,
                };
                return (
                  <TableRow key={room.maPhong}>
                    <TableCell className="font-medium">
                      {room.soPhong}
                    </TableCell>
                    <TableCell className="tabular-nums">{room.tang}</TableCell>
                    <TableCell>{room.tenLoaiPhong}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatVnd(room.donGiaNgay)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
