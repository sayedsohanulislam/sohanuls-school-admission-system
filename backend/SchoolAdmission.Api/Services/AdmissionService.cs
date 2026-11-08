using System.Collections.Concurrent;
using System.Data;
using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.Dtos;
using SchoolAdmission.Api.Models;

namespace SchoolAdmission.Api.Services;

public class AdmissionService : IAdmissionService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AdmissionService> _logger;
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> ClassLocks = new();

    public AdmissionService(
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<AdmissionService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    private int GetHoldDurationSeconds()
    {
        var envValue = _configuration["HOLD_DURATION_SECONDS"] 
            ?? Environment.GetEnvironmentVariable("HOLD_DURATION_SECONDS");
        
        if (int.TryParse(envValue, out var seconds) && seconds > 0)
        {
            return seconds;
        }
        return 600; // Default 10 minutes
    }

    public async Task<ClassResponse> CreateClassAsync(CreateClassRequest request, CancellationToken ct = default)
    {
        var id = $"c_{Guid.NewGuid():N}"[..8];
        var schoolClass = new SchoolClass
        {
            Id = id,
            Name = request.Name.Trim(),
            TotalSeats = request.TotalSeats,
            CreatedAt = DateTime.UtcNow
        };

        _context.Classes.Add(schoolClass);
        await _context.SaveChangesAsync(ct);

        return new ClassResponse(schoolClass.Id, schoolClass.Name, schoolClass.TotalSeats);
    }

    public async Task<List<ClassDetailResponse>> GetClassesAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        var classes = await _context.Classes
            .OrderBy(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.TotalSeats,
                HeldSeats = c.Holds.Count(h => h.Status == HoldStatus.Held && h.ExpiresAt > now),
                ConfirmedSeats = c.Holds.Count(h => h.Status == HoldStatus.Confirmed)
            })
            .ToListAsync(ct);

        return classes.Select(c => new ClassDetailResponse(
            c.Id,
            c.Name,
            c.TotalSeats,
            c.HeldSeats,
            c.ConfirmedSeats,
            Math.Max(0, c.TotalSeats - c.HeldSeats - c.ConfirmedSeats)
        )).ToList();
    }

    public async Task<ClassDetailResponse?> GetClassByIdAsync(string classId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        var c = await _context.Classes
            .Where(x => x.Id == classId)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.TotalSeats,
                HeldSeats = c.Holds.Count(h => h.Status == HoldStatus.Held && h.ExpiresAt > now),
                ConfirmedSeats = c.Holds.Count(h => h.Status == HoldStatus.Confirmed)
            })
            .FirstOrDefaultAsync(ct);

        if (c == null) return null;

        return new ClassDetailResponse(
            c.Id,
            c.Name,
            c.TotalSeats,
            c.HeldSeats,
            c.ConfirmedSeats,
            Math.Max(0, c.TotalSeats - c.HeldSeats - c.ConfirmedSeats)
        );
    }

    public async Task<(CreateHoldResponse? Result, string? Error, int StatusCode)> CreateHoldAsync(
        string classId, 
        string studentId, 
        CancellationToken ct = default)
    {
        var isRelational = _context.Database.IsRelational();
        var classLock = ClassLocks.GetOrAdd(classId, _ => new SemaphoreSlim(1, 1));

        await classLock.WaitAsync(ct);
        try
        {
            if (isRelational)
            {
                await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, ct);
                try
                {
                    // Lock the class row using SELECT FOR UPDATE to synchronize multi-process / distributed instances
                    var schoolClass = await _context.Classes
                        .FromSqlInterpolated($"SELECT * FROM \"Classes\" WHERE \"Id\" = {classId} FOR UPDATE")
                        .FirstOrDefaultAsync(ct);

                    if (schoolClass == null)
                    {
                        return (null, "Class not found", 404);
                    }

                    var now = DateTime.UtcNow;

                    // Check active hold or admission for this student
                    var hasExisting = await _context.SeatHolds
                        .AnyAsync(h => h.ClassId == classId 
                                    && h.StudentId == studentId 
                                    && (h.Status == HoldStatus.Confirmed || (h.Status == HoldStatus.Held && h.ExpiresAt > now)), ct);

                    if (hasExisting)
                    {
                        return (null, "Student already has an active hold or confirmed admission in this class", 409);
                    }

                    // Count current held and confirmed seats
                    var currentHeld = await _context.SeatHolds
                        .CountAsync(h => h.ClassId == classId && h.Status == HoldStatus.Held && h.ExpiresAt > now, ct);
                    var currentConfirmed = await _context.SeatHolds
                        .CountAsync(h => h.ClassId == classId && h.Status == HoldStatus.Confirmed, ct);

                    if (currentHeld + currentConfirmed >= schoolClass.TotalSeats)
                    {
                        return (null, "No seats available in this class", 409);
                    }

                    var holdId = $"h_{Guid.NewGuid():N}"[..8];
                    var expiresAt = now.AddSeconds(GetHoldDurationSeconds());

                    var hold = new SeatHold
                    {
                        Id = holdId,
                        ClassId = classId,
                        StudentId = studentId,
                        Status = HoldStatus.Held,
                        CreatedAt = now,
                        ExpiresAt = expiresAt
                    };

                    _context.SeatHolds.Add(hold);
                    await _context.SaveChangesAsync(ct);
                    await transaction.CommitAsync(ct);

                    return (new CreateHoldResponse(hold.Id, hold.ClassId, hold.StudentId, hold.Status, hold.ExpiresAt), null, 201);
                }
                catch
                {
                    await transaction.RollbackAsync(ct);
                    throw;
                }
            }
            else
            {
                // In-Memory provider fallback (used in unit / in-memory concurrency testing)
                var schoolClass = await _context.Classes.FirstOrDefaultAsync(c => c.Id == classId, ct);
                if (schoolClass == null)
                {
                    return (null, "Class not found", 404);
                }

                var now = DateTime.UtcNow;

                var hasExisting = await _context.SeatHolds
                    .AnyAsync(h => h.ClassId == classId 
                                && h.StudentId == studentId 
                                && (h.Status == HoldStatus.Confirmed || (h.Status == HoldStatus.Held && h.ExpiresAt > now)), ct);

                if (hasExisting)
                {
                    return (null, "Student already has an active hold or confirmed admission in this class", 409);
                }

                var currentHeld = await _context.SeatHolds
                    .CountAsync(h => h.ClassId == classId && h.Status == HoldStatus.Held && h.ExpiresAt > now, ct);
                var currentConfirmed = await _context.SeatHolds
                    .CountAsync(h => h.ClassId == classId && h.Status == HoldStatus.Confirmed, ct);

                if (currentHeld + currentConfirmed >= schoolClass.TotalSeats)
                {
                    return (null, "No seats available in this class", 409);
                }

                var holdId = $"h_{Guid.NewGuid():N}"[..8];
                var expiresAt = now.AddSeconds(GetHoldDurationSeconds());

                var hold = new SeatHold
                {
                    Id = holdId,
                    ClassId = classId,
                    StudentId = studentId,
                    Status = HoldStatus.Held,
                    CreatedAt = now,
                    ExpiresAt = expiresAt
                };

                _context.SeatHolds.Add(hold);
                await _context.SaveChangesAsync(ct);

                return (new CreateHoldResponse(hold.Id, hold.ClassId, hold.StudentId, hold.Status, hold.ExpiresAt), null, 201);
            }
        }
        finally
        {
            classLock.Release();
        }
    }

    public async Task<HoldDetailResponse?> GetHoldByIdAsync(string holdId, CancellationToken ct = default)
    {
        var hold = await _context.SeatHolds.FirstOrDefaultAsync(h => h.Id == holdId, ct);
        if (hold == null) return null;

        var now = DateTime.UtcNow;
        var effectiveStatus = hold.GetEffectiveStatus(now);

        return new HoldDetailResponse(hold.Id, hold.ClassId, effectiveStatus, hold.ExpiresAt);
    }

    public async Task<(ConfirmHoldResponse? Result, string? Error, int StatusCode)> ConfirmHoldAsync(
        string holdId, 
        string studentId, 
        CancellationToken ct = default)
    {
        var hold = await _context.SeatHolds
            .Include(h => h.Class)
            .FirstOrDefaultAsync(h => h.Id == holdId, ct);

        if (hold == null)
        {
            return (null, "Hold not found", 404);
        }

        if (!string.Equals(hold.StudentId, studentId, StringComparison.Ordinal))
        {
            return (null, "Access denied: hold does not belong to this student", 403);
        }

        // Rule 5: Idempotency - if already confirmed, return 200 OK without incrementing seats
        if (hold.Status == HoldStatus.Confirmed)
        {
            return (new ConfirmHoldResponse(hold.Id, HoldStatus.Confirmed), null, 200);
        }

        if (hold.Status == HoldStatus.Cancelled)
        {
            return (null, "Cannot confirm a cancelled hold", 400);
        }

        var now = DateTime.UtcNow;
        if (hold.ExpiresAt <= now || hold.Status == HoldStatus.Expired)
        {
            hold.Status = HoldStatus.Expired;
            await _context.SaveChangesAsync(ct);
            return (null, "Hold has expired and seat was released", 400);
        }

        hold.Status = HoldStatus.Confirmed;
        hold.ConfirmedAt = now;
        await _context.SaveChangesAsync(ct);

        return (new ConfirmHoldResponse(hold.Id, HoldStatus.Confirmed), null, 200);
    }

    public async Task<(bool Success, string? Error, int StatusCode)> CancelHoldAsync(
        string holdId, 
        string studentId, 
        CancellationToken ct = default)
    {
        var hold = await _context.SeatHolds.FirstOrDefaultAsync(h => h.Id == holdId, ct);
        if (hold == null)
        {
            return (false, "Hold not found", 404);
        }

        if (!string.Equals(hold.StudentId, studentId, StringComparison.Ordinal))
        {
            return (false, "Access denied: hold does not belong to this student", 403);
        }

        if (hold.Status == HoldStatus.Confirmed)
        {
            return (false, "Cannot cancel a confirmed admission", 400);
        }

        hold.Status = HoldStatus.Cancelled;
        await _context.SaveChangesAsync(ct);

        return (true, null, 204);
    }

    public async Task<List<MyHoldResponse>> GetMyHoldsAsync(string studentId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        var holds = await _context.SeatHolds
            .Include(h => h.Class)
            .Where(h => h.StudentId == studentId)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync(ct);

        return holds.Select(h => new MyHoldResponse(
            h.Id,
            h.ClassId,
            h.Class?.Name ?? "Unknown Class",
            h.GetEffectiveStatus(now),
            h.ExpiresAt
        )).ToList();
    }
}
