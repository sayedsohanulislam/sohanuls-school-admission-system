using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.Models;

namespace SchoolAdmission.Api.Services;

public class HoldCleanupBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<HoldCleanupBackgroundService> _logger;

    public HoldCleanupBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<HoldCleanupBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("HoldCleanupBackgroundService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                var now = DateTime.UtcNow;
                var expiredHolds = await context.SeatHolds
                    .Where(h => h.Status == HoldStatus.Held && h.ExpiresAt <= now)
                    .ToListAsync(stoppingToken);

                if (expiredHolds.Count > 0)
                {
                    foreach (var hold in expiredHolds)
                    {
                        hold.Status = HoldStatus.Expired;
                    }
                    await context.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation("Marked {Count} expired holds as EXPIRED.", expiredHolds.Count);
                }
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "Error while cleaning up expired holds.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
