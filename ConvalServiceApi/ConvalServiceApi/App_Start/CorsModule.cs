using System;
using System.Web;

namespace ConvalServiceApi.App_Start
{
    public class CorsModule : IHttpModule
    {
        public void Init(HttpApplication context)
        {
            context.BeginRequest += Context_BeginRequest;
            context.EndRequest += Context_EndRequest;
        }

        private void Context_BeginRequest(object sender, EventArgs e)
        {
            var application = (HttpApplication)sender;
            var response = application.Response;
            var request = application.Request;

            // OPTIONS 요청 처리 (preflight)
            if (request.HttpMethod == "OPTIONS")
            {
                response.AddHeader("Access-Control-Allow-Origin", "*");
                response.AddHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Accept, X-Requested-With, Authorization, Origin");
                response.AddHeader("Access-Control-Max-Age", "86400");
                response.AddHeader("Access-Control-Allow-Credentials", "true");
                response.StatusCode = 200;
                response.End();
            }
        }

        private void Context_EndRequest(object sender, EventArgs e)
        {
            var application = (HttpApplication)sender;
            var response = application.Response;

            // 모든 응답에 CORS 헤더 추가
            if (!response.HeadersWritten)
            {
                response.AddHeader("Access-Control-Allow-Origin", "*");
                response.AddHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Accept, X-Requested-With, Authorization, Origin");
                response.AddHeader("Access-Control-Max-Age", "86400");
                response.AddHeader("Access-Control-Allow-Credentials", "true");
            }
        }

        public void Dispose()
        {
            // 리소스 정리
        }
    }
} 