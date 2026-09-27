import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { suaKhachHang, themKhachHang, type HoSoKhach } from "@/lib/thao-tac/khach-hang";
import { dong } from "@/test/csdl";
import { napLaiDuLieuMau } from "@/test/nap-lai-mau";

beforeEach(napLaiDuLieuMau);
afterAll(napLaiDuLieuMau);

// Du lieu mau: 60 khach. KH00000001 co CCCD 079201000001, email long.nguyen@example.com.
const MOI: HoSoKhach = {
  hoTen: "  Nguyễn Văn Mới ",
  cccd: " 079299000061 ",
  sdt: "0903 118.274",
  email: " Moi.Nguyen@Example.com ",
};
const soKhach = async () => (await dong("SELECT COUNT(*) AS n FROM KHACH_HANG")).n;

describe("themKhachHang", () => {
  it("chuan hoa ho so roi luu, ma moi KH00000061", async () => {
    expect(await themKhachHang(MOI)).toEqual({
      ok: true,
      data: {
        maKh: "KH00000061",
        hoTen: "Nguyễn Văn Mới",
        cccd: "079299000061",
        sdt: "0903118274",
        email: "moi.nguyen@example.com",
      },
    });
    expect(await soKhach()).toBe(61);
  });

  // Review Focus #2
  it("hai khach cung de trong SDT va email: ca hai luu NULL, khong vuong UQ_KHACH_HANG_Email", async () => {
    const trong = { hoTen: "Khach A", cccd: "079299000071", sdt: "", email: "" };
    expect((await themKhachHang(trong)).ok).toBe(true);
    expect((await themKhachHang({ ...trong, hoTen: "Khach B", cccd: "B12345678" })).ok).toBe(true);
    expect(
      await dong(
        `SELECT COUNT(*) AS n FROM KHACH_HANG
         WHERE MaKH IN ('KH00000061', 'KH00000062') AND SDT IS NULL AND Email IS NULL`,
      ),
    ).toEqual({ n: 2 });
  });

  it("CCCD da co thi tu choi kem ma khach da co, khong ghi", async () => {
    expect(await themKhachHang({ ...MOI, cccd: "079201000001" })).toEqual({
      ok: false,
      loi: "CSDL từ chối: CCCD da co trong ho so KH00000001",
    });
    expect(await soKhach()).toBe(60);
  });

  it("email da co (khac hoa thuong) thi tu choi", async () => {
    expect(await themKhachHang({ ...MOI, email: "LONG.NGUYEN@example.com" })).toEqual({
      ok: false,
      loi: "CSDL từ chối: Email da co trong ho so KH00000001",
    });
  });

  it("ho so sai dinh dang thi CSDL tu choi tung truong, khong ghi", async () => {
    const loi = async (v: Partial<HoSoKhach>) => {
      const r = await themKhachHang({ ...MOI, ...v });
      return r.ok ? "ok" : r.loi;
    };
    expect(await loi({ hoTen: "   " })).toBe("CSDL từ chối: Ho ten khach hang khong duoc de trong");
    expect(await loi({ cccd: "0792" })).toBe(
      "CSDL từ chối: CCCD / ho chieu phai gom 9-20 chu so hoac chu cai",
    );
    expect(await loi({ cccd: "0792-9900-0061" })).toBe(
      "CSDL từ chối: CCCD / ho chieu phai gom 9-20 chu so hoac chu cai",
    );
    expect(await loi({ sdt: "12ab" })).toBe(
      "CSDL từ chối: So dien thoai phai gom 9-14 chu so, co the co dau + o dau",
    );
    expect(await loi({ email: "a@b" })).toBe("CSDL từ chối: Email khong dung dinh dang");
    expect(await soKhach()).toBe(60);
  });

  it("nhan ho chieu co chu (doi sang chu hoa) va SDT co dau +", async () => {
    expect(await themKhachHang({ ...MOI, cccd: "c1234567x", sdt: "+84 903 118 274" })).toMatchObject({
      ok: true,
      data: { cccd: "C1234567X", sdt: "+84903118274" },
    });
  });
});

describe("suaKhachHang", () => {
  it("sua ho so, giu nguyen ma; email de trong thanh NULL", async () => {
    expect(
      await suaKhachHang("KH00000002", {
        hoTen: "Trần Thị Bảo Châu",
        cccd: "079202000002",
        sdt: "0909 000 002",
        email: "",
      }),
    ).toEqual({
      ok: true,
      data: {
        maKh: "KH00000002",
        hoTen: "Trần Thị Bảo Châu",
        cccd: "079202000002",
        sdt: "0909000002",
        email: null,
      },
    });
  });

  it("giu nguyen CCCD va email cua chinh minh thi khong bi coi la trung", async () => {
    const r = await suaKhachHang("KH00000001", {
      hoTen: "Nguyen Hoang Long",
      cccd: "079201000001",
      sdt: "0901234501",
      email: "long.nguyen@example.com",
    });
    expect(r.ok).toBe(true);
  });

  it("CCCD trung khach khac thi tu choi, ho so giu nguyen", async () => {
    expect(
      await suaKhachHang("KH00000002", { hoTen: "X", cccd: "079201000001", sdt: "", email: "" }),
    ).toEqual({ ok: false, loi: "CSDL từ chối: CCCD da co trong ho so KH00000001" });
    expect(await dong("SELECT HoTen FROM KHACH_HANG WHERE MaKH = 'KH00000002'")).toEqual({
      HoTen: "Tran Thi Bao Chau",
    });
  });

  it("ma khach khong ton tai thi tu choi", async () => {
    expect(await suaKhachHang("KH99999999", MOI)).toEqual({
      ok: false,
      loi: "CSDL từ chối: Khach hang khong ton tai",
    });
  });
});
