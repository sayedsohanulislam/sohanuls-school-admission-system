using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Api.Common;
using SchoolAdmission.Api.Dtos;
using SchoolAdmission.Api.Services;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("me")]
public class MeController : ControllerBase
{
    private readonly IAdmissionService _admissionService;

    public MeController(IAdmissionService admissionService)
    {
        _admissionService = admissionService;
    }

    // 8. GET /me/holds
    [HttpGet("holds")]
    public async Task<IActionResult> GetMyHolds(
        [FromHeader(Name = "X-Student-Id")] string? studentId,
        CancellationToken ct)
    {
        if (!ValidationHelpers.IsValidStudentId(studentId))
        {
            return BadRequest(new ErrorResponse("X-Student-Id header is required and must be a 17-digit birth registration number."));
        }

        var result = await _admissionService.GetMyHoldsAsync(studentId!.Trim(), ct);
        return Ok(result);
    }
}
