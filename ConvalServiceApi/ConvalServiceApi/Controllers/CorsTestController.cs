using System.Web.Http;

namespace ConvalServiceApi.Controllers
{
    [RoutePrefix("api/cors-test")]
    public class CorsTestController : ApiController
    {
        [HttpGet]
        [Route("test")]
        public IHttpActionResult Test()
        {
            return Ok(new { 
                message = "CORS 테스트 성공", 
                timestamp = System.DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                headers = Request.Headers.ToString()
            });
        }
        
        [HttpPost]
        [Route("test")]
        public IHttpActionResult TestPost([FromBody] object data)
        {
            return Ok(new { 
                message = "CORS POST 테스트 성공", 
                timestamp = System.DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                receivedData = data
            });
        }
        
        [HttpOptions]
        [Route("test")]
        public IHttpActionResult TestOptions()
        {
            return Ok(new { 
                message = "CORS OPTIONS 테스트 성공", 
                timestamp = System.DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            });
        }
    }
} 