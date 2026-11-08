using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.Dtos;
using Xunit;

namespace SchoolAdmission.Tests;

public class HoldExpirationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public HoldExpirationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task ExpiredHold_ReleasesSeat_AndCannotBeConfirmed()
    {
        var client = _factory.CreateClient();

        // 1. Create a class with only 1 seat
        var createClassRes = await client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 10 - English", 1));
        createClassRes.EnsureSuccessStatusCode();
        var createdClass = await createClassRes.Content.ReadFromJsonAsync<ClassResponse>();
        var classId = createdClass!.Id;

        const string student1 = "20172691234567891";
        const string student2 = "20172691234567892";

        // 2. Student 1 holds the seat
        var holdReq = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
        holdReq.Headers.Add("X-Student-Id", student1);
        var holdRes = await client.SendAsync(holdReq);
        Assert.Equal(HttpStatusCode.Created, holdRes.StatusCode);
        var holdData = await holdRes.Content.ReadFromJsonAsync<CreateHoldResponse>();
        var holdId = holdData!.HoldId;

        // Class is now full (0 available)
        var classDetail1 = await client.GetFromJsonAsync<ClassDetailResponse>($"/classes/{classId}");
        Assert.Equal(0, classDetail1!.AvailableSeats);
        Assert.Equal(1, classDetail1.HeldSeats);

        // 3. Manually expire the hold in the database to simulate TTL passage
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var holdEntity = await db.SeatHolds.FindAsync(holdId);
            Assert.NotNull(holdEntity);
            holdEntity.ExpiresAt = DateTime.UtcNow.AddMinutes(-5); // Expired 5 minutes ago
            await db.SaveChangesAsync();
        }

        // 4. Verify GET /holds/{holdId} returns status EXPIRED
        var holdDetail = await client.GetFromJsonAsync<HoldDetailResponse>($"/holds/{holdId}");
        Assert.NotNull(holdDetail);
        Assert.Equal("EXPIRED", holdDetail.Status);

        // 5. Verify Class now shows the seat is available again!
        var classDetail2 = await client.GetFromJsonAsync<ClassDetailResponse>($"/classes/{classId}");
        Assert.NotNull(classDetail2);
        Assert.Equal(1, classDetail2.AvailableSeats);
        Assert.Equal(0, classDetail2.HeldSeats);

        // 6. Confirming the expired hold should fail with 400 Bad Request
        var confirmReq = new HttpRequestMessage(HttpMethod.Post, $"/holds/{holdId}/confirm");
        confirmReq.Headers.Add("X-Student-Id", student1);
        var confirmRes = await client.SendAsync(confirmReq);
        Assert.Equal(HttpStatusCode.BadRequest, confirmRes.StatusCode);

        // 7. Student 2 can now hold the released seat!
        var holdReq2 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
        holdReq2.Headers.Add("X-Student-Id", student2);
        var holdRes2 = await client.SendAsync(holdReq2);
        Assert.Equal(HttpStatusCode.Created, holdRes2.StatusCode);
    }
}
