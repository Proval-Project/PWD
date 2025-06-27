using System.ComponentModel.DataAnnotations;

namespace FullAuthSystem.Models.DTOs
{
    // 1단계: 이메일 입력 요청
    public class ForgotPasswordRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
    }

    // 2단계: 인증 코드 확인 요청
    public class VerifyResetCodeRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [StringLength(6, MinimumLength = 6)]
        public string VerificationCode { get; set; }
    }

    // 3단계: 새 비밀번호 설정 요청
    public class ResetPasswordRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [StringLength(6, MinimumLength = 6)]
        public string VerificationCode { get; set; }

        [Required]
        [MinLength(8)]
        public string NewPassword { get; set; }

        [Required]
        [Compare("NewPassword")]
        public string ConfirmPassword { get; set; }
    }

    // 응답 모델들
    public class ForgotPasswordResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string Email { get; set; }
    }

    public class VerifyResetCodeResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public bool IsValid { get; set; }
    }

    public class ResetPasswordResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
    }
} 