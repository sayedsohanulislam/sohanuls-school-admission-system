using SchoolAdmission.Api.Dtos;

namespace SchoolAdmission.Api.Services;

public interface IAdmissionService
{
    Task<ClassResponse> CreateClassAsync(CreateClassRequest request, CancellationToken ct = default);
    Task<List<ClassDetailResponse>> GetClassesAsync(CancellationToken ct = default);
    Task<ClassDetailResponse?> GetClassByIdAsync(string classId, CancellationToken ct = default);
    Task<(CreateHoldResponse? Result, string? Error, int StatusCode)> CreateHoldAsync(string classId, string studentId, CancellationToken ct = default);
    Task<HoldDetailResponse?> GetHoldByIdAsync(string holdId, CancellationToken ct = default);
    Task<(ConfirmHoldResponse? Result, string? Error, int StatusCode)> ConfirmHoldAsync(string holdId, string studentId, CancellationToken ct = default);
    Task<(bool Success, string? Error, int StatusCode)> CancelHoldAsync(string holdId, string studentId, CancellationToken ct = default);
    Task<List<MyHoldResponse>> GetMyHoldsAsync(string studentId, CancellationToken ct = default);
}
