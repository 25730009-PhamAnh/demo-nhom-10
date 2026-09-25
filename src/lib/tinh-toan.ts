/**
 * Mo phong cac function trong Scripts/03b_Functions.sql de man hinh tinh
 * duoc so lieu khi chua noi CSDL. Giai doan sau se goi thang function that,
 * nen chu ky ham o day co y giu giong tham so cua chung.
 *
 * Tien luon o dang chuoi DECIMAL(18,2). Moi phep tinh quy ve so nguyen XU
 * roi doi nguoc, de cong don hoa don khong bi sai so dau phay dong.
 */

const MOT_NGAY = 86_400_000;

/** Doi chuoi DECIMAL(18,2) sang so nguyen xu. */
function sangXu(tien: string): number {
  const [nguyen, thapPhan = ""] = tien.trim().split(".");
  const am = nguyen.startsWith("-");
  const xu = Number(`${nguyen.replace("-", "")}${thapPhan.padEnd(2, "0").slice(0, 2)}`);
  return am ? -xu : xu;
}

/** Doi so nguyen xu nguoc ve chuoi DECIMAL(18,2). */
function sangChuoi(xu: number): string {
  const am = xu < 0;
  const s = String(Math.round(Math.abs(xu))).padStart(3, "0");
  return `${am ? "-" : ""}${s.slice(0, -2)}.${s.slice(-2)}`;
}

/** Mo phong fn_SoDem. Ngay dang 'YYYY-MM-DD'. */
export function soDem(checkIn: string, checkOut: string): number {
  const a = Date.parse(`${checkIn}T00:00:00Z`);
  const b = Date.parse(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) {
    throw new Error("Ngay khong hop le");
  }
  if (b <= a) {
    throw new Error("Ngay tra phong phai sau ngay nhan phong");
  }
  return Math.round((b - a) / MOT_NGAY);
}

/** Mo phong fn_TienPhong: don gia mot dem nhan so dem. */
export function tienPhong(donGia: string, dem: number): string {
  return sangChuoi(sangXu(donGia) * dem);
}

/** Mo phong fn_TienDichVu: don gia dich vu nhan so luong. */
export function tienDichVu(giaDv: string, soLuong: number): string {
  return sangChuoi(sangXu(giaDv) * soLuong);
}

/** Cong nhieu khoan tien. Khoan giam gia truyen vao duoi dang am. */
export function congTien(...cac: string[]): string {
  return sangChuoi(cac.reduce((t, x) => t + sangXu(x), 0));
}

/**
 * Tam tinh cho form dat phong: so dem, tien phong, va thong bao loi neu ngay
 * khong hop le. Tach rieng khoi component de test duoc.
 *
 * Khac cac ham tren: ham nay KHONG nem loi ma tra ve truong `loi`, vi form can
 * hien thong bao va lam mo nut Lap phieu — chu khong duoc hien tien am.
 * Thong bao o day co dau, vi no hien thang len giao dien.
 */
export function tamTinhDatPhong(args: {
  ngayNhan: string;
  ngayTra: string;
  donGia: string;
}): { soDem: number; tienPhong: string; loi: string | null } {
  try {
    const dem = soDem(args.ngayNhan, args.ngayTra);
    return { soDem: dem, tienPhong: tienPhong(args.donGia, dem), loi: null };
  } catch {
    return {
      soDem: 0,
      tienPhong: "0.00",
      loi: "Ngày trả phòng phải sau ngày nhận phòng",
    };
  }
}
