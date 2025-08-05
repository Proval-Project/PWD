using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using FullAuthSystem.Data;

namespace FullAuthSystem.Services
{
    public class TokenCleanupService : BackgroundService
    {
        private readonly ILogger<TokenCleanupService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly TimeSpan _cleanupInterval = TimeSpan.FromMinutes(10); // 10분마다 실행

        public TokenCleanupService(ILogger<TokenCleanupService> logger, IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("TokenCleanupService가 시작되었습니다. 정리 간격: {Interval}분", _cleanupInterval.TotalMinutes);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CleanupExpiredTokensAsync();
                    await Task.Delay(_cleanupInterval, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "토큰 정리 중 오류가 발생했습니다.");
                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken); // 오류 시 1분 후 재시도
                }
            }
        }

        private async Task CleanupExpiredTokensAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            try
            {
                // 만료된 토큰 조회
                var expiredTokens = await context.PasswordResetTokens
                    .Where(t => t.ExpiresAt < DateTime.UtcNow && !t.IsUsed)
                    .ToListAsync();

                if (expiredTokens.Any())
                {
                    _logger.LogInformation("만료된 토큰 {Count}개를 정리합니다.", expiredTokens.Count);

                    // 만료된 토큰 삭제
                    context.PasswordResetTokens.RemoveRange(expiredTokens);
                    await context.SaveChangesAsync();

                    _logger.LogInformation("만료된 토큰 {Count}개가 성공적으로 삭제되었습니다.", expiredTokens.Count);
                }
                else
                {
                    _logger.LogDebug("정리할 만료된 토큰이 없습니다.");
                }

                // 사용된 토큰도 30일 후 삭제 (CreatedAt 기준)
                var oldUsedTokens = await context.PasswordResetTokens
                    .Where(t => t.IsUsed && t.CreatedAt < DateTime.UtcNow.AddDays(-30))
                    .ToListAsync();

                if (oldUsedTokens.Any())
                {
                    _logger.LogInformation("30일 이상 된 사용된 토큰 {Count}개를 정리합니다.", oldUsedTokens.Count);

                    context.PasswordResetTokens.RemoveRange(oldUsedTokens);
                    await context.SaveChangesAsync();

                    _logger.LogInformation("사용된 토큰 {Count}개가 성공적으로 삭제되었습니다.", oldUsedTokens.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "토큰 정리 중 데이터베이스 오류가 발생했습니다.");
                throw;
            }
        }
    }
} 