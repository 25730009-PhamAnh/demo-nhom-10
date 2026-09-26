import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

import { thucHien } from "@/lib/thao-tac/ket-qua";

describe("thucHien", () => {
  let log: MockInstance<typeof console.error>;
  beforeEach(() => {
    log = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => log.mockRestore());

  it("thanh cong thi ok kem du lieu", async () => {
    await expect(thucHien(async () => 42)).resolves.toEqual({ ok: true, data: 42 });
  });

  it("CSDL tu choi (SIGNAL) thi ok:false kem thong bao cua CSDL", async () => {
    const signal = Object.assign(new Error("Loi: Phong khong ton tai"), {
      errno: 1644,
      sqlMessage: "Loi: Phong khong ton tai",
    });
    await expect(
      thucHien(async () => {
        throw signal;
      }),
    ).resolves.toEqual({ ok: false, loi: "CSDL từ chối: Phong khong ton tai" });
  });

  it("loi lap trinh khong bi nuot, van nem ra", async () => {
    await expect(
      thucHien(async () => {
        throw new TypeError("sai");
      }),
    ).rejects.toThrow(TypeError);
  });
});
