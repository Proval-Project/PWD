using System;
using MySql.Data.MySqlClient;

class TestConnection
{
    static void Main()
    {
        string connectionString = "Server=192.168.0.59;Port=3306;Database=pwd_final;Uid=root;";
        
        try
        {
            Console.WriteLine("MySQL 연결 테스트 시작...");
            Console.WriteLine($"연결 문자열: {connectionString}");
            
            using (var connection = new MySqlConnection(connectionString))
            {
                connection.Open();
                Console.WriteLine("✓ 데이터베이스 연결 성공!");
                
                // 데이터베이스 목록 확인
                var command = new MySqlCommand("SHOW DATABASES", connection);
                using (var reader = command.ExecuteReader())
                {
                    Console.WriteLine("사용 가능한 데이터베이스:");
                    while (reader.Read())
                    {
                        Console.WriteLine($"  - {reader.GetString(0)}");
                    }
                }
                
                connection.Close();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"✗ 연결 실패: {ex.Message}");
            Console.WriteLine($"예외 타입: {ex.GetType().FullName}");
            
            if (ex is MySqlException mysqlEx)
            {
                Console.WriteLine($"MySQL 에러 코드: {mysqlEx.Number}");
                Console.WriteLine($"MySQL 에러 메시지: {mysqlEx.Message}");
            }
            
            Console.WriteLine($"전체 예외 정보: {ex}");
        }
        
        Console.WriteLine("테스트 완료. 아무 키나 누르세요...");
        Console.ReadKey();
    }
}
