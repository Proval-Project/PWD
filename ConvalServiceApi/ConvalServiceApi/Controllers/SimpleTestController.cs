using System;
using System.Web.Http;

namespace ConvalServiceApi.Controllers
{
    [RoutePrefix("api/simple")]
    public class SimpleTestController : ApiController
    {
        [HttpGet]
        [Route("hello")]
        public IHttpActionResult Hello()
        {
            return Ok(new { 
                message = "Hello from ConvalServiceApi!", 
                timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                corsTest = "CORS should work now"
            });
        }
        
        [HttpPost]
        [Route("echo")]
        public IHttpActionResult Echo([FromBody] object data)
        {
            return Ok(new { 
                message = "Echo response", 
                receivedData = data,
                timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            });
        }
        
        [HttpOptions]
        [Route("echo")]
        public IHttpActionResult EchoOptions()
        {
            return Ok(new { 
                message = "OPTIONS request handled", 
                timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            });
        }
    }
} 