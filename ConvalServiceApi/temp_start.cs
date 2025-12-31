using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using MySql.Data.MySqlClient;

namespace  ConvalServiceApi.Models
{
    public class DatabaseHelper
    {
        private readonly string connectionString;

        public DatabaseHelper()
        {
            // 로컬 MySQL 연결 문자열 (비밀번호 없음)
            connectionString = "Server=192.168.0.59;Port=3306;Database=pwd_final;Uid=root;";
        }

        public bool TestConnection()
        {
            try
            {
                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();
                    Debug.WriteLine("데이터베이스 연결 성공!");
                    return true;
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"데이터베이스 연결 실패: {ex.Message}");
                return false;
            }
        }
