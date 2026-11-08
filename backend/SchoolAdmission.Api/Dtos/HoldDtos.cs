namespace SchoolAdmission.Api.Dtos;

public record CreateHoldResponse(
    string HoldId,
    string ClassId,
    string StudentId,
    string Status,
    DateTime ExpiresAt
);

public record HoldDetailResponse(
    string HoldId,
    string ClassId,
    string Status,
    DateTime ExpiresAt
);

public record ConfirmHoldResponse(
    string HoldId,
    string Status
);

public record MyHoldResponse(
    string HoldId,
    string ClassId,
    string ClassName,
    string Status,
    DateTime ExpiresAt
);

public record ErrorResponse(
    string Message
);
