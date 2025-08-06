using UserManagementSystem.DTOs;
using UserManagementSystem.Models;

namespace UserManagementSystem.Services
{
    public interface IUserService
    {
        Task<IEnumerable<UserListResponseDto>> GetAllUsersAsync();
        Task<UserResponseDto?> GetUserByIdAsync(string userID);
        Task<UserResponseDto?> GetUserByUserIDAsync(string userID);
        Task<UserResponseDto> CreateUserAsync(CreateUserDto createUserDto);
        Task<UserResponseDto?> UpdateUserAsync(string userID, UpdateUserDto updateUserDto);
        Task<bool> DeleteUserAsync(string userID);
        Task<bool> DeactivateUserAsync(string userID);
        Task<bool> ActivateUserAsync(string userID);
        Task<IEnumerable<UserListResponseDto>> GetUsersByRoleAsync(int roleId);
        Task<IEnumerable<UserListResponseDto>> SearchUsersAsync(string searchTerm);
        Task<bool> ChangePasswordAsync(string userID, string currentPassword, string newPassword);
            Task<bool> IsUserIDExistsAsync(string userID);
    Task<bool> IsEmailExistsAsync(string email);
    
    // 승인 관련 메서드
            Task<IEnumerable<UserListResponseDto>> GetUsersByApprovalStatusAsync(bool isApproved);
        Task<bool> ApproveUserAsync(string userID);
}
} 