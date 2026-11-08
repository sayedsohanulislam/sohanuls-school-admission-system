using System.Net;
using System.Net.Http.Json;
using SchoolAdmission.Api.Dtos;
using Xunit;

namespace SchoolAdmission.Tests;

public class ConcurrencyTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public ConcurrencyTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task ConcurrentHolds_CannotExceed_TotalSeats()
    {
        var client = _factory.CreateClient();

        // 1. Create a class with only 5 seats
        const int totalSeats = 5;
        var createClassRes = await client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 7 - Morning Shift", totalSeats));
        createClassRes.EnsureSuccessStatusCode();
        var createdClass = await createClassRes.Content.ReadFromJsonAsync<ClassResponse>();
        Assert.NotNull(createdClass);
        var classId = createdClass.Id;

        // 2. Launch 30 concurrent hold requests from 30 distinct students (each has valid 17-digit ID)
        const int concurrentRequests = 30;
        var tasks = Enumerable.Range(1, concurrentRequests).Select(async i =>
        {
            var studentId = $"2026{i:D13}"; // 17 digits total: "2026" + 13 digits
            using var req = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
            req.Headers.Add("X-Student-Id", studentId);
            return await client.SendAsync(req);
        }).ToList();

        var responses = await Task.WhenAll(tasks);

        // 3. Verify exactly totalSeats (5) succeed and the rest fail with 409 Conflict
        var successCount = responses.Count(r => r.StatusCode == HttpStatusCode.Created);
        var conflictCount = responses.Count(r => r.StatusCode == HttpStatusCode.Conflict);

        Assert.Equal(totalSeats, successCount);
        Assert.Equal(concurrentRequests - totalSeats, conflictCount);

        // 4. Verify class seat breakdown
        var classDetail = await client.GetFromJsonAsync<ClassDetailResponse>($"/classes/{classId}");
        Assert.NotNull(classDetail);
        Assert.Equal(totalSeats, classDetail.TotalSeats);
        Assert.Equal(totalSeats, classDetail.HeldSeats);
        Assert.Equal(0, classDetail.AvailableSeats);
        Assert.Equal(0, classDetail.ConfirmedSeats);

        // Total held + confirmed must NEVER exceed totalSeats
        Assert.True(classDetail.HeldSeats + classDetail.ConfirmedSeats <= classDetail.TotalSeats);
    }
}
