using System.ComponentModel.DataAnnotations;

namespace SchoolAdmission.Api.Dtos;

public record CreateClassRequest(
    [Required(ErrorMessage = "Class name is required.")]
    [StringLength(200, MinimumLength = 1, ErrorMessage = "Class name must be between 1 and 200 characters.")]
    string Name,

    [Range(1, 10000, ErrorMessage = "Total seats must be at least 1.")]
    int TotalSeats
);

public record ClassResponse(
    string Id,
    string Name,
    int TotalSeats
);

public record ClassDetailResponse(
    string Id,
    string Name,
    int TotalSeats,
    int HeldSeats,
    int ConfirmedSeats,
    int AvailableSeats
);
