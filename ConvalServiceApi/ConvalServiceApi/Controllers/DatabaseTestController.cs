using System;
using System.Configuration;
using System.Data;
using System.Web.Http;
using MySql.Data.MySqlClient;

namespace ConvalServiceApi.Controllers
{
    [RoutePrefix("api/db-test")]
    public class DatabaseTestController : ApiController
    {
        [HttpGet]
        [Route("connection")]
        public IHttpActionResult TestConnection()
        {
            try
            {
                string connectionString = ConfigurationManager.ConnectionStrings["DefaultConnection"]?.ConnectionString 
                    ?? "Server=192.168.0.59;Database=pwd_final;Uid=root;";
                
                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();
                    
                    // 간단한 쿼리 실행
                    using (var command = new MySqlCommand("SELECT 1 as test", connection))
                    {
                        var result = command.ExecuteScalar();
                        
                        return Ok(new { 
                            success = true, 
                            message = "데이터베이스 연결 성공",
                            connectionString = connectionString,
                            serverVersion = connection.ServerVersion,
                            database = connection.Database,
                            testResult = result
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { 
                    success = false, 
                    message = "데이터베이스 연결 실패",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }
        
        [HttpGet]
        [Route("tables")]
        public IHttpActionResult GetTables()
        {
            try
            {
                string connectionString = ConfigurationManager.ConnectionStrings["DefaultConnection"]?.ConnectionString 
                    ?? "Server=192.168.0.59;Database=pwd_final;Uid=root;";
                
                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();
                    
                    // 테이블 목록 조회
                    using (var command = new MySqlCommand("SHOW TABLES", connection))
                    {
                        var tables = new System.Collections.Generic.List<string>();
                        using (var reader = command.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                tables.Add(reader.GetString(0));
                            }
                        }
                        
                        return Ok(new { 
                            success = true, 
                            message = "테이블 목록 조회 성공",
                            tableCount = tables.Count,
                            tables = tables
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { 
                    success = false, 
                    message = "테이블 목록 조회 실패",
                    error = ex.Message
                });
            }
        }
    }
} 