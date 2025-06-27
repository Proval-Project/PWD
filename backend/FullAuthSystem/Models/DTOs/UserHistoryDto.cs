namespace FullAuthSystem.Models.DTOs
{
    public class UserHistoryDto
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public string Category { get; set; }
        public string? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public string? UpdatedBy { get; set; }

        // 사용자 정보 (선택적)
        public string? UserName { get; set; }
        public string? UserEmail { get; set; }
    }

    public class CreateUserHistoryRequest
    {
        public string? UserId { get; set; } // 영업부가 고객 히스토리 생성 시 필요
        public string Title { get; set; }
        public string? Description { get; set; }
        public string Category { get; set; }
        public string? Status { get; set; }
    }

    public class UpdateUserHistoryRequest
    {
        public string Title { get; set; }
        public string? Description { get; set; }
        public string Category { get; set; }
        public string? Status { get; set; }
    }
} 