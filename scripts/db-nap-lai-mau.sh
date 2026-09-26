#!/usr/bin/env bash
# Nap lai du lieu mau (07_Sample_Data.sql) vao CSDL dev. Khong dung lai bang,
# thu tuc hay trigger - chi TRUNCATE roi nap lai du lieu.
#
# Ngay trong 07 tinh theo CURDATE() LUC NAP. Sang hom sau, phieu "nhan phong
# hom nay" da thanh qua han va man Tong quan khong con luot nhan / tra nao.
# Vi vay chay lenh nay vao ngay demo (moi thay doi da ghi vao CSDL dev se mat):
#
#   npm run db:mau
#
#   - Doc DATABASE_URL va QLKS_SCRIPTS_DIR tu .env.local.
#   - Tham so 1 (tuy chon): URL CSDL dich, thay cho DATABASE_URL.
#   - DB_NGAY_CO_DINH (tuy chon): nap nhu the hom nay la ngay do, de kiem thu.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f .env.local ]]; then
  set -a; source .env.local; set +a
fi
: "${QLKS_SCRIPTS_DIR:?Thieu QLKS_SCRIPTS_DIR (xem .env.example)}"
URL="${1:-${DATABASE_URL:?Thieu DATABASE_URL (xem .env.example)}}"

source scripts/doc-url-mysql.sh
doc_url_mysql "$URL" "URL CSDL" || exit 1

MYSQL_BIN="${MYSQL_BIN:-mysql}"
chay_mysql() {
  if [[ -n "${DB_NGAY_CO_DINH:-}" ]]; then
    "$MYSQL_BIN" -u"$NGUOI_DUNG" -h"$MAY" -P"$CONG" --default-character-set=utf8mb4 \
      --init-command="SET timestamp = UNIX_TIMESTAMP('$DB_NGAY_CO_DINH')" "$@"
  else
    "$MYSQL_BIN" -u"$NGUOI_DUNG" -h"$MAY" -P"$CONG" --default-character-set=utf8mb4 "$@"
  fi
}

sed "s/QuanLyKhachSan/${TEN_CSDL}/g" "$QLKS_SCRIPTS_DIR/07_Sample_Data.sql" | chay_mysql > /dev/null

chay_mysql -N -B "$TEN_CSDL" -e "
  SELECT DATE_FORMAT(CURDATE(), '%d/%m/%Y'),
    (SELECT COUNT(*) FROM PHIEU_DAT_PHONG WHERE TrangThai = 'DaDat' AND NgayCheckIn  = CURDATE()),
    (SELECT COUNT(*) FROM PHIEU_DAT_PHONG WHERE TrangThai = 'DangO' AND NgayCheckOut = CURDATE())" |
  while read -r ngay nhan tra; do
    echo "Da nap lai du lieu mau vao $TEN_CSDL: hom nay $ngay co $nhan luot nhan, $tra luot tra phong"
  done
