#!/bin/bash

# MySQL 접속 정보
MYSQL_USER="root"
MYSQL_PASSWORD="root"
MYSQL_DB="PWD_Final"

# SQL 파일 경로 (현재 스크립트 파일과 같은 디렉토리에 있다고 가정)
SQL_FILE_1="01_drop_and_create_database.sql"
SQL_FILE_2="02_insert_initial_data.sql"
SQL_FILE_3="03_update_accessory_data.sql"

# MySQL 명령 실행 함수
execute_sql() {
  local file=$1
  echo "Executing ${file}..."
  mysql -u"${MYSQL_USER}" --comments < "${file}"
  if [ $? -ne 0 ]; then
    echo "Error executing ${file}. Aborting."
    exit 1
  fi
  echo "${file} executed successfully."
}

# SQL 파일 순서대로 실행
execute_sql "${SQL_FILE_1}"
execute_sql "${SQL_FILE_2}"
execute_sql "${SQL_FILE_3}"

echo "All SQL scripts executed successfully!"
