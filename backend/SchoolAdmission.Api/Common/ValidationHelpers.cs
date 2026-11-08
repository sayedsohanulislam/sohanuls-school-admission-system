using System.Text.RegularExpressions;

namespace SchoolAdmission.Api.Common;

public static class ValidationHelpers
{
    private static readonly Regex StudentIdRegex = new(@"^\d{17}$", RegexOptions.Compiled);

    public static bool IsValidStudentId(string? studentId)
    {
        if (string.IsNullOrWhiteSpace(studentId))
            return false;

        return StudentIdRegex.IsMatch(studentId.Trim());
    }
}
