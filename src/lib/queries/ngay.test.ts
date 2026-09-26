import { describe, expect, it } from "vitest";

import { getGioHienTai, getNgayHienTai } from "@/lib/queries/ngay";

describe("getNgayHienTai", () => {
  it("la CURDATE() cua CSDL, bi dong bang 23/09/2026 khi kiem thu", async () => {
    expect(await getNgayHienTai()).toBe("2026-09-23");
  });
});

describe("getGioHienTai", () => {
  it("la NOW() cua CSDL dang HH:MM", async () => {
    expect(await getGioHienTai()).toBe("10:00");
  });
});
