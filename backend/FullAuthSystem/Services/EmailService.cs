using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Net.Mail;
using System.Net;

namespace FullAuthSystem.Services
{
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;
        private readonly IConfiguration _configuration;

        public EmailService(ILogger<EmailService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<bool> SendPasswordResetEmailAsync(string email, string verificationCode)
        {
            try
            {
                var subject = "비밀번호 재설정 인증 코드";
                var body = GeneratePasswordResetEmailBody(verificationCode);
                
                return await SendEmailAsync(email, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "비밀번호 재설정 이메일 전송 중 오류 발생: {Email}", email);
                return false;
            }
        }

        public async Task<bool> SendEmailAsync(string to, string subject, string body)
        {
            var emailSection = _configuration.GetSection("Email");
            var smtpServer = emailSection["SmtpServer"];
            var smtpPort = emailSection.GetValue<int?>("SmtpPort");
            var smtpUser = emailSection["SmtpUser"];
            var smtpPass = emailSection["SmtpPass"];
            var from = emailSection["From"];
            var enableSsl = emailSection.GetValue<bool?>("EnableSsl");

            _logger.LogInformation("=== 이메일 전송 시도 ===");
            _logger.LogInformation("SMTP 서버: {SmtpServer}", smtpServer);
            _logger.LogInformation("SMTP 포트: {SmtpPort}", smtpPort);
            _logger.LogInformation("SMTP 사용자: {SmtpUser}", smtpUser);
            _logger.LogInformation("SMTP 비밀번호 길이: {SmtpPassLength}", smtpPass?.Length ?? 0);
            _logger.LogInformation("발신자: {From}", from);
            _logger.LogInformation("수신자: {To}", to);
            _logger.LogInformation("SSL 사용: {EnableSsl}", enableSsl);

            if (!string.IsNullOrEmpty(smtpServer) && smtpPort.HasValue && !string.IsNullOrEmpty(smtpUser) && !string.IsNullOrEmpty(smtpPass) && !string.IsNullOrEmpty(from))
            {
                _logger.LogInformation("SMTP 설정이 완료되어 실제 이메일 전송을 시도합니다.");
                try
                {
                    var message = new MailMessage();
                    message.From = new MailAddress(from);
                    message.To.Add(new MailAddress(to));
                    message.Subject = subject;
                    message.Body = body;
                    message.IsBodyHtml = false;

                    using (var client = new SmtpClient(smtpServer, smtpPort.Value))
                    {
                        client.Credentials = new NetworkCredential(smtpUser, smtpPass);
                        client.EnableSsl = enableSsl ?? true;
                        client.Timeout = 10000; // 10초 타임아웃
                        
                        _logger.LogInformation("SMTP 클라이언트 설정 완료, 이메일 전송 시작...");
                        await client.SendMailAsync(message);
                    }
                    _logger.LogInformation("실제 이메일이 전송되었습니다: {To}", to);
                    return true;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "SMTP 이메일 전송 실패: {To}, 오류: {ErrorMessage}", to, ex.Message);
                    return false;
                }
            }
            else
            {
                _logger.LogWarning("SMTP 설정이 불완전하여 개발 환경 모드로 실행합니다.");
                _logger.LogInformation("=== 이메일 전송 (개발 환경) ===");
                _logger.LogInformation("받는 사람: {To}", to);
                _logger.LogInformation("제목: {Subject}", subject);
                _logger.LogInformation("내용:\n{Body}", body);
                _logger.LogInformation("================================");
                await Task.Delay(100); // 비동기 시뮬레이션
                return true;
            }
        }

        private string GeneratePasswordResetEmailBody(string verificationCode)
        {
            return $@"
안녕하세요,

비밀번호 재설정을 요청하셨습니다.

인증 코드: {verificationCode}

이 인증 코드는 5분간 유효합니다.
인증 코드를 입력하여 비밀번호를 재설정해 주세요.

만약 비밀번호 재설정을 요청하지 않으셨다면, 이 이메일을 무시하셔도 됩니다.

감사합니다.
FullAuthSystem 팀
";
        }
    }
} 