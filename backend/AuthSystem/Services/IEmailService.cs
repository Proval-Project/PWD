namespace FullAuthSystem.Services
{
    public interface IEmailService
    {
        Task<bool> SendPasswordResetEmailAsync(string email, string verificationCode);
        Task<bool> SendEmailAsync(string to, string subject, string body);
    }
} 