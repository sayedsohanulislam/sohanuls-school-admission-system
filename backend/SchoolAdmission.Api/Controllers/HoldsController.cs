using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Api.Common;
using SchoolAdmission.Api.Dtos;
using SchoolAdmission.Api.Services;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("holds")]
public class HoldsController : ControllerBase
{
    private readonly IAdmissionService _admissionService;

    public HoldsController(IAdmissionService admissionService)
    {
        _admissionService = admissionService;
    }

    // 5. GET /holds/{holdId}
    [HttpGet("{holdId}")]
    public async Task<IActionResult> GetHold(string holdId, CancellationToken ct)
    {
        var result = await _admissionService.GetHoldByIdAsync(holdId, ct);
        if (result == null)
        {
            return NotFound(new ErrorResponse($"Hold '{holdId}' not found."));
        }

        return Ok(result);
    }

    // 6. POST /holds/{holdId}/confirm
    [HttpPost("{holdId}/confirm")]
    public async Task<IActionResult> ConfirmHold(
        string holdId,
        [FromHeader(Name = "X-Student-Id")] string? studentId,
        CancellationToken ct)
    {
        if (!ValidationHelpers.IsValidStudentId(studentId))
        {
            return BadRequest(new ErrorResponse("X-Student-Id header is required and must be a 17-digit birth registration number."));
        }

        var (result, error, statusCode) = await _admissionService.ConfirmHoldAsync(holdId, studentId!.Trim(), ct);

        if (statusCode == StatusCodes.Status200OK)
        {
            return Ok(result);
        }

        return StatusCode(statusCode, new ErrorResponse(error ?? "Unable to confirm hold."));
    }

    // 7. DELETE /holds/{holdId}
    [HttpDelete("{holdId}")]
    public async Task<IActionResult> CancelHold(
        string holdId,
        [FromHeader(Name = "X-Student-Id")] string? studentId,
        CancellationToken ct)
    {
        if (!ValidationHelpers.IsValidStudentId(studentId))
        {
            return BadRequest(new ErrorResponse("X-Student-Id header is required and must be a 17-digit birth registration number."));
        }

        var (success, error, statusCode) = await _admissionService.CancelHoldAsync(holdId, studentId!.Trim(), ct);

        if (success)
        {
            return NoContent();
        }

        return StatusCode(statusCode, new ErrorResponse(error ?? "Unable to cancel hold."));
    }
}
