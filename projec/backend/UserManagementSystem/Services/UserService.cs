using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using UserManagementSystem.Data;
using UserManagementSystem.DTOs;
using UserManagementSystem.Models;

namespace UserManagementSystem.Services
{
    public class UserService : IUserService
    {
        private readonly UserManagementDbContext _context;

        public UserService(UserManagementDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<UserListResponseDto>> GetAllUsersAsync()
        {
            return await _context.Users
                .Include(u => u.Role)
                .Where(u => u.IsApproved)
                .Select(u => new UserListResponseDto
                {
                    UserID = u.UserID,
                    Email = u.Email,
                    Name = u.Name,
                    RoleName = u.Role!.RoleName,
                    CompanyName = u.CompanyName,
                    Department = u.Department,
                    Position = u.Position,
                    IsApproved = u.IsApproved
                })
                .ToListAsync();
        }

        public async Task<UserResponseDto?> GetUserByIdAsync(string userID)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserID == userID);

            if (user == null) return null;

            return new UserResponseDto
            {
                UserID = user.UserID,
                Email = user.Email,
                RoleID = user.RoleID,
                RoleName = user.Role!.RoleName,
                CompanyName = user.CompanyName,
                BusinessNumber = user.BusinessNumber,
                Address = user.Address,
                CompanyPhone = user.CompanyPhone,
                Department = user.Department,
                Position = user.Position,
                PhoneNumber = user.PhoneNumber,
                Name = user.Name,
                IsApproved = user.IsApproved
            };
        }

        public async Task<UserResponseDto?> GetUserByUserIDAsync(string userID)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserID == userID);

            if (user == null) return null;

            return new UserResponseDto
            {
                UserID = user.UserID,
                Email = user.Email,
                RoleID = user.RoleID,
                RoleName = user.Role!.RoleName,
                CompanyName = user.CompanyName,
                BusinessNumber = user.BusinessNumber,
                Address = user.Address,
                CompanyPhone = user.CompanyPhone,
                Department = user.Department,
                Position = user.Position,
                PhoneNumber = user.PhoneNumber,
                Name = user.Name,
                IsApproved = user.IsApproved
            };
        }

        public async Task<UserResponseDto> CreateUserAsync(CreateUserDto createUserDto)
        {
            // 중복 검사
            if (await IsUserIDExistsAsync(createUserDto.UserID))
                throw new InvalidOperationException("이미 존재하는 사용자 ID입니다.");

            if (await IsEmailExistsAsync(createUserDto.Email))
                throw new InvalidOperationException("이미 존재하는 이메일입니다.");

            var user = new User
            {
                UserID = createUserDto.UserID,
                Email = createUserDto.Email,
                Password = HashPassword(createUserDto.Password),
                RoleID = createUserDto.RoleID,
                CompanyName = createUserDto.CompanyName,
                BusinessNumber = createUserDto.BusinessNumber,
                Address = createUserDto.Address,
                CompanyPhone = createUserDto.CompanyPhone,
                Department = createUserDto.Department,
                Position = createUserDto.Position,
                PhoneNumber = createUserDto.PhoneNumber,
                Name = createUserDto.Name,
                IsApproved = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return await GetUserByUserIDAsync(user.UserID) ?? throw new InvalidOperationException("사용자 생성 후 조회에 실패했습니다.");
        }

        public async Task<UserResponseDto?> UpdateUserAsync(string userID, UpdateUserDto updateUserDto)
        {
            var user = await _context.Users.FindAsync(userID);
            if (user == null) return null;

            // 이메일 중복 검사 (다른 사용자가 사용 중인지)
            if (!string.IsNullOrEmpty(updateUserDto.Email) && 
                updateUserDto.Email != user.Email && 
                await IsEmailExistsAsync(updateUserDto.Email))
            {
                throw new InvalidOperationException("이미 존재하는 이메일입니다.");
            }

            // 업데이트할 필드들
            if (!string.IsNullOrEmpty(updateUserDto.Email))
                user.Email = updateUserDto.Email;

            if (!string.IsNullOrEmpty(updateUserDto.Password))
                user.Password = HashPassword(updateUserDto.Password);

            if (updateUserDto.RoleID.HasValue)
                user.RoleID = updateUserDto.RoleID.Value;

            if (!string.IsNullOrEmpty(updateUserDto.CompanyName))
                user.CompanyName = updateUserDto.CompanyName;

            if (!string.IsNullOrEmpty(updateUserDto.BusinessNumber))
                user.BusinessNumber = updateUserDto.BusinessNumber;

            if (!string.IsNullOrEmpty(updateUserDto.Address))
                user.Address = updateUserDto.Address;

            if (!string.IsNullOrEmpty(updateUserDto.CompanyPhone))
                user.CompanyPhone = updateUserDto.CompanyPhone;

            if (!string.IsNullOrEmpty(updateUserDto.Department))
                user.Department = updateUserDto.Department;

            if (!string.IsNullOrEmpty(updateUserDto.Position))
                user.Position = updateUserDto.Position;

            if (!string.IsNullOrEmpty(updateUserDto.PhoneNumber))
                user.PhoneNumber = updateUserDto.PhoneNumber;

            if (!string.IsNullOrEmpty(updateUserDto.Name))
                user.Name = updateUserDto.Name;

            await _context.SaveChangesAsync();

            return await GetUserByIdAsync(userID);
        }

        public async Task<bool> DeleteUserAsync(string userID)
        {
            var user = await _context.Users.FindAsync(userID);
            if (user == null) return false;

            // 실제 삭제 대신 IsActive를 false로 설정하여 비활성화
            user.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeactivateUserAsync(string userID)
        {
            var user = await _context.Users.FindAsync(userID);
            if (user == null) return false;

            user.IsApproved = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ActivateUserAsync(string userID)
        {
            var user = await _context.Users.FindAsync(userID);
            if (user == null) return false;

            user.IsApproved = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<UserListResponseDto>> GetUsersByRoleAsync(int roleId)
        {
            return await _context.Users
                .Include(u => u.Role)
                .Where(u => u.RoleID == roleId && u.IsApproved && u.IsActive)
                .Select(u => new UserListResponseDto
                {
                    UserID = u.UserID,
                    Email = u.Email,
                    Name = u.Name,
                    RoleName = u.Role!.RoleName,
                    CompanyName = u.CompanyName,
                    Department = u.Department,
                    Position = u.Position,
                    IsApproved = u.IsApproved
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<UserListResponseDto>> SearchUsersAsync(string searchTerm)
        {
            return await _context.Users
                .Include(u => u.Role)
                .Where(u => u.IsApproved && (
                    u.UserID.Contains(searchTerm) ||
                    u.Email.Contains(searchTerm) ||
                    u.Name.Contains(searchTerm) ||
                    u.CompanyName.Contains(searchTerm) ||
                    u.Department.Contains(searchTerm) ||
                    u.Position.Contains(searchTerm)
                ))
                .Select(u => new UserListResponseDto
                {
                    UserID = u.UserID,
                    Email = u.Email,
                    Name = u.Name,
                    RoleID = u.RoleID,
                    RoleName = u.Role!.RoleName,
                    CompanyName = u.CompanyName,
                    Department = u.Department,
                    Position = u.Position,
                    IsApproved = u.IsApproved
                })
                .ToListAsync();
        }

        public async Task<bool> ChangePasswordAsync(string userID, string currentPassword, string newPassword)
        {
            var user = await _context.Users.FindAsync(userID);
            if (user == null) return false;

            if (user.Password != HashPassword(currentPassword))
                return false;

            user.Password = HashPassword(newPassword);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> IsUserIDExistsAsync(string userID)
        {
            return await _context.Users.AnyAsync(u => u.UserID == userID);
        }

        public async Task<bool> IsEmailExistsAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email);
        }

        // 승인 관련 메서드
        public async Task<IEnumerable<UserListResponseDto>> GetUsersByApprovalStatusAsync(bool isApproved)
        {
            return await _context.Users
                .Include(u => u.Role)
                .Where(u => u.IsApproved == isApproved)
                .Select(u => new UserListResponseDto
                {
                    UserID = u.UserID,
                    Email = u.Email,
                    RoleID = u.RoleID,
                    CompanyName = u.CompanyName,
                    BusinessNumber = u.BusinessNumber,
                    Address = u.Address,
                    CompanyPhone = u.CompanyPhone,
                    Department = u.Department,
                    Position = u.Position,
                    PhoneNumber = u.PhoneNumber,
                    Name = u.Name,
                    IsApproved = u.IsApproved,
                    RoleName = u.Role!.RoleName
                })
                .ToListAsync();
        }

        public async Task<bool> ApproveUserAsync(string userID)
        {
            var user = await _context.Users.FindAsync(userID);
            if (user == null)
                return false;

            user.IsApproved = true;
            await _context.SaveChangesAsync();
            return true;
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
    }
} 