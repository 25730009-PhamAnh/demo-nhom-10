# Tach URL mysql://user:pass@host:port/ten_csdl thanh bien cho mysql CLI:
# NGUOI_DUNG, MAY, CONG, TEN_CSDL va MYSQL_PWD (export, de mat khau khong
# hien tren dong lenh). Dung chung cho db-test-setup.sh va db-nap-lai-mau.sh.
#
#   source scripts/doc-url-mysql.sh
#   doc_url_mysql "$URL" "TEN_BIEN" || exit 1
doc_url_mysql() {
  local mau='^mysql://([^:@/]+)(:([^@]*))?@([^:/]+)(:([0-9]+))?/([A-Za-z0-9_]+)$'
  if [[ ! "$1" =~ $mau ]]; then
    echo "$2 phai co dang mysql://user:pass@host:port/ten_csdl" >&2
    return 1
  fi
  NGUOI_DUNG="${BASH_REMATCH[1]}"
  export MYSQL_PWD="${BASH_REMATCH[3]}"
  MAY="${BASH_REMATCH[4]}"
  CONG="${BASH_REMATCH[6]:-3306}"
  TEN_CSDL="${BASH_REMATCH[7]}"
}
