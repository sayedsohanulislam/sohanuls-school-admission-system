using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Api.Common;
using SchoolAdmission.Api.Dtos;
using SchoolAdmission.Api.Services;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("classes")]
public class ClassesController : ControllerBase
{
    private readonly IAdmissionService _admissionService;

    public ClassesController(IAdmissionService admissionService)
    {
        _admissionService = admissionService;
    }

    // 1. POST /classes
    [HttpPost]
    public async Task<IActionResult> CreateClass([FromBody] CreateClassRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ErrorResponse("Invalid input: name is required and totalSeats must be positive."));
        }

        var result = await _admissionService.CreateClassAsync(request, ct);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    // 2. GET /classes
    [HttpGet]
    public async Task<IActionResult> GetClasses(CancellationToken ct)
    {
        var result = await _admissionService.GetClassesAsync(ct);
        return Ok(result);
    }

    // 3. GET /classes/{classId}
    [HttpGet("{classId}")]
    public async Task<IActionResult> GetClass(string classId, CancellationToken ct)
    {
        var result = await _admissionService.GetClassByIdAsync(classId, ct);
        if (result == null)
        {
            return NotFound(new ErrorResponse($"Class '{classId}' not found."));
        }

        return Ok(result);
    }

    // 4. POST /classes/{classId}/holds
    [HttpPost("{classId}/holds")]
    public async Task<IActionResult> CreateHold(
        string classId,
        [FromHeader(Name = "X-Student-Id")] string? studentId,
        CancellationToken ct)
    {
        if (!ValidationHelpers.IsValidStudentId(studentId))
        {
            return BadRequest(new ErrorResponse("X-Student-Id header is required and must be a 17-digit birth registration number."));
        }

        var (result, error, statusCode) = await _admissionService.CreateHoldAsync(classId, studentId!.Trim(), ct);

        if (statusCode == StatusCodes.Status201Created)
        {
            return StatusCode(StatusCodes.Status201Created, result);
        }

        return StatusCode(statusCode, new ErrorResponse(error ?? "Unable to create seat hold."));
    }
}
