"use client";

import { useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { ThaoTacPhong } from "@/components/rooms/thao-tac-phong";
import { formatVnd } from "@/lib/format";
import type { PhongTrenSoDo } from "@/lib/queries/rooms";
import { TRANG_THAI_PHONG, nhanTrangThaiPhong } from "@/lib/status";

const TAT_CA = "TatCa";

/**
 * Bo loc so do phong theo design/Rooms.dc.html dong 80-140.
 *
 * So tren moi chip dem theo KET QUA da loc tang/loai hien hanh, khong phai dem
 * toan bo — nguoc lai thi bam chip xong so se khong khop luoi ben duoi.
 */
export function RoomFilter({
  phong,
  loaiPhong,
  suCo,
}: {
  phong: PhongTrenSoDo[];
  loaiPhong: { maLoaiPhong: string; tenLoaiPhong: string }[];
  /** Ma phong -> mo ta su co dang mo, chi co cho phong BaoTri. */
  suCo: Record<string, string>;
}) {
  const [trangThai, setTrangThai] = useState<string>(TAT_CA);
  // Giu ma chu khong giu object: sau moi lan ghi, trang doc lai CSDL va
  // khung thao tac hien dung trang thai moi cua phong.
  const [maDangChon, setMaDangChon] = useState<string | null>(null);
  const dangChon = phong.find((p) => p.maPhong === maDangChon);
  const [tang, setTang] = useState<string>(TAT_CA);
  const [tenLoai, setTenLoai] = useState<string>(TAT_CA);

  const cacTang = useMemo(
    () => [...new Set(phong.map((p) => p.tang))].sort((a, b) => a - b),
    [phong],
  );

  // Loc tang/loai truoc, de dem chip va luoi cung nhin mot tap du lieu.
  const theoTangVaLoai = useMemo(
    () =>
      phong.filter(
        (p) =>
          (tang === TAT_CA || p.tang === Number(tang)) &&
          (tenLoai === TAT_CA || p.tenLoaiPhong === tenLoai),
      ),
    [phong, tang, tenLoai],
  );

  const ketQua = useMemo(
    () =>
      theoTangVaLoai.filter((p) => trangThai === TAT_CA || p.trangThai === trangThai),
    [theoTangVaLoai, trangThai],
  );

  const chip = [
    { ma: TAT_CA, nhan: "Tất cả", soLuong: theoTangVaLoai.length, mau: null },
    ...TRANG_THAI_PHONG.map((ma) => ({
      ma: ma as string,
      nhan: nhanTrangThaiPhong(ma).nhan,
      soLuong: theoTangVaLoai.filter((p) => p.trangThai === ma).length,
      mau: nhanTrangThaiPhong(ma),
    })),
  ];

  return (
    <>
      <section className="bg-card border-border flex h-16 shrink-0 items-center gap-3 rounded-[14px] border px-4">
        <div className="flex gap-[6px]">
          {chip.map((c) => {
            const on = trangThai === c.ma;
            return (
              <button
                key={c.ma}
                type="button"
                onClick={() => setTrangThai(c.ma)}
                aria-pressed={on}
                className={`flex h-[34px] items-center gap-[7px] rounded-full px-[13px] text-[12.5px] transition-colors ${
                  on
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "border-border bg-card hover:bg-muted border text-[#57504A]"
                }`}
              >
                {c.mau ? (
                  <span
                    className="size-[7px] rounded-full"
                    style={{ background: on ? "currentColor" : c.mau.dot }}
                  />
                ) : null}
                <span>{c.nhan}</span>
                <span className="font-mono text-[12px] opacity-70">{c.soLuong}</span>
              </button>
            );
          })}
        </div>

        <span className="flex-grow" />

        <label htmlFor="floor" className="text-muted-foreground text-[12px]">
          Tầng
        </label>
        <select
          id="floor"
          value={tang}
          onChange={(e) => setTang(e.target.value)}
          className="border-input bg-card h-[34px] rounded-lg border px-2 text-[12.5px]"
        >
          <option value={TAT_CA}>Tất cả tầng</option>
          {cacTang.map((t) => (
            <option key={t} value={String(t)}>
              Tầng {t}
            </option>
          ))}
        </select>

        <label htmlFor="ltype" className="text-muted-foreground text-[12px]">
          Loại phòng
        </label>
        <select
          id="ltype"
          value={tenLoai}
          onChange={(e) => setTenLoai(e.target.value)}
          className="border-input bg-card h-[34px] rounded-lg border px-2 text-[12.5px]"
        >
          <option value={TAT_CA}>Tất cả loại</option>
          {loaiPhong.map((l) => (
            <option key={l.maLoaiPhong} value={l.tenLoaiPhong}>
              {l.tenLoaiPhong}
            </option>
          ))}
        </select>
      </section>

      {dangChon ? (
        <ThaoTacPhong
          key={dangChon.maPhong}
          phong={dangChon}
          suCo={suCo[dangChon.maPhong]}
          onDong={() => setMaDangChon(null)}
        />
      ) : null}

      <section className="bg-card border-border flex shrink-0 flex-col gap-4 rounded-[14px] border p-5">
        {ketQua.length === 0 ? (
          <EmptyState thongDiep="Không có phòng phù hợp bộ lọc" />
        ) : (
          cacTang
            .filter((t) => ketQua.some((p) => p.tang === t))
            .map((t) => {
              const cua = ketQua.filter((p) => p.tang === t);
              return (
                <div key={t} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-foreground m-0 text-[13px] font-semibold">
                      Tầng {t}
                    </h2>
                    <span className="text-muted-foreground text-[12px]">
                      · {cua.length} phòng
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-[10px] xl:grid-cols-8">
                    {cua.map((p) => {
                      const mau = nhanTrangThaiPhong(p.trangThai);
                      const on = p.maPhong === maDangChon;
                      return (
                        <button
                          key={p.maPhong}
                          type="button"
                          onClick={() => setMaDangChon(on ? null : p.maPhong)}
                          aria-pressed={on}
                          aria-label={`Phòng ${p.soPhong}, ${mau.nhan}`}
                          className="flex flex-col gap-[3px] rounded-[10px] px-3 py-[10px] text-left"
                          style={{
                            background: mau.bg,
                            outline: on ? `2px solid ${mau.dot}` : undefined,
                            outlineOffset: 1,
                          }}
                        >
                          <div className="flex items-center gap-[6px]">
                            <span
                              className="font-mono text-[14px] font-medium"
                              style={{ color: mau.fg }}
                            >
                              {p.soPhong}
                            </span>
                            <span
                              className="size-[6px] rounded-full"
                              style={{ background: mau.dot }}
                            />
                          </div>
                          <span className="text-[11px]" style={{ color: mau.fg }}>
                            {mau.nhan}
                          </span>
                          <span className="text-muted-foreground truncate text-[10.5px]">
                            {p.tenLoaiPhong}
                          </span>
                          <span className="text-muted-foreground font-mono text-[10.5px]">
                            {formatVnd(p.donGiaNgay)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
        )}
      </section>
    </>
  );
}
