#!/usr/bin/env bash
# Dung CSDL kiem thu tu bo script cua nhom (Scripts/setup_database/01 - 07).
#
#   - Doc QLKS_SCRIPTS_DIR, DATABASE_URL_TEST, DB_NGAY_CO_DINH tu moi truong.
#     Vitest tu nap (vitest.config.mts). Chay tay:
#       set -a; source .env.local; set +a
#       DB_NGAY_CO_DINH='2026-09-23 10:00:00' bash scripts/db-test-setup.sh
#   - Doi ten CSDL QuanLyKhachSan -> ten trong DATABASE_URL_TEST ngay tren luong
#     doc vao; file goc cua nhom khong bi sua.
#   - Moi phien mysql dat SET timestamp ve DB_NGAY_CO_DINH, nen du lieu mau
#     (viet theo CURDATE()) luon ra dung mot bo.
#   - Tu choi chay neu ten CSDL test trung CSDL dev: file 01 co DROP DATABASE.
set -euo pipefail

: "${QLKS_SCRIPTS_DIR:?Thieu QLKS_SCRIPTS_DIR (xem .env.example)}"
: "${DATABASE_URL_TEST:?Thieu DATABASE_URL_TEST (xem .env.example)}"
: "${DB_NGAY_CO_DINH:?Thieu DB_NGAY_CO_DINH}"

MAU='^mysql://([^:@/]+)(:([^@]*))?@([^:/]+)(:([0-9]+))?/([A-Za-z0-9_]+)$'
if [[ ! "$DATABASE_URL_TEST" =~ $MAU ]]; then
  echo "DATABASE_URL_TEST phai co dang mysql://user:pass@host:port/ten_csdl" >&2
  exit 1
fi
NGUOI_DUNG="${BASH_REMATCH[1]}"
export MYSQL_PWD="${BASH_REMATCH[3]}"
MAY="${BASH_REMATCH[4]}"
CONG="${BASH_REMATCH[6]:-3306}"
TEN_CSDL="${BASH_REMATCH[7]}"

if [[ "$(printf '%s' "$TEN_CSDL" | tr '[:upper:]' '[:lower:]')" == "quanlykhachsan" ]]; then
  echo "DATABASE_URL_TEST dang tro vao CSDL dev QuanLyKhachSan - tu choi chay." >&2
  exit 1
fi

MYSQL_BIN="${MYSQL_BIN:-mysql}"
for f in 01_Create_Database 02_Functions 03_Views 04_Triggers 05_Cursors \
         06_Procedures 07_Sample_Data; do
  sed "s/QuanLyKhachSan/${TEN_CSDL}/g" "$QLKS_SCRIPTS_DIR/$f.sql" |
    "$MYSQL_BIN" -u"$NGUOI_DUNG" -h"$MAY" -P"$CONG" --default-character-set=utf8mb4 \
      --init-command="SET timestamp = UNIX_TIMESTAMP('$DB_NGAY_CO_DINH')" > /dev/null
done
echo "Da dung $TEN_CSDL, ngay dong bang $DB_NGAY_CO_DINH"
