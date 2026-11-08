using System.Net;
using System.Net.Http.Json;
using SchoolAdmission.Api.Dtos;
using Xunit;

namespace SchoolAdmission.Tests;

public class AdmissionValidationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public AdmissionValidationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Invalid_StudentId_Returns_400BadRequest()
    {
        var client = _factory.CreateClient();

        // 1. Missing header
        var req1 = new HttpRequestMessage(HttpMethod.Post, "/classes/c_fake/holds");
        var res1 = await client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.BadRequest, res1.StatusCode);

        // 2. Invalid digit length (e.g. 10 digits instead of 17)
        var req2 = new HttpRequestMessage(HttpMethod.Post, "/classes/c_fake/holds");
        req2.Headers.Add("X-Student-Id", "1234567890");
        var res2 = await client.SendAsync(req2);
        Assert.Equal(HttpStatusCode.BadRequest, res2.StatusCode);

        // 3. Non-digit characters
        var req3 = new HttpRequestMessage(HttpMethod.Post, "/classes/c_fake/holds");
        req3.Headers.Add("X-Student-Id", "2026abcdef1234567");
        var res3 = await client.SendAsync(req3);
        Assert.Equal(HttpStatusCode.BadRequest, res3.StatusCode);
    }

    [Fact]
    public async Task DuplicateHold_InSameClass_Returns_409Conflict()
    {
        var client = _factory.CreateClient();

        // Create class
        var createClassRes = await client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 8 - Day Shift", 20));
        createClassRes.EnsureSuccessStatusCode();
        var createdClass = await createClassRes.Content.ReadFromJsonAsync<ClassResponse>();
        var classId = createdClass!.Id;

        const string studentId = "20152691234567890";

        // First hold succeeds
        var req1 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
        req1.Headers.Add("X-Student-Id", studentId);
        var res1 = await client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.Created, res1.StatusCode);

        // Second hold for the same student in the same class fails with 409 Conflict
        var req2 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
        req2.Headers.Add("X-Student-Id", studentId);
        var res2 = await client.SendAsync(req2);
        Assert.Equal(HttpStatusCode.Conflict, res2.StatusCode);
    }

    [Fact]
    public async Task ConfirmHold_IsIdempotent_AndCancellingReleasesSeat()
    {
        var client = _factory.CreateClient();

        // Create class with 2 seats
        var createClassRes = await client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 9 - Science", 2));
        createClassRes.EnsureSuccessStatusCode();
        var createdClass = await createClassRes.Content.ReadFromJsonAsync<ClassResponse>();
        var classId = createdClass!.Id;

        const string student1 = "20162691234567891";
        const string student2 = "20162691234567892";

        // Hold seat for student1
        var holdReq1 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
        holdReq1.Headers.Add("X-Student-Id", student1);
        var holdRes1 = await client.SendAsync(holdReq1);
        Assert.Equal(HttpStatusCode.Created, holdRes1.StatusCode);
        var holdData1 = await holdRes1.Content.ReadFromJsonAsync<CreateHoldResponse>();
        var holdId1 = holdData1!.HoldId;

        // Confirm hold for student1
        var confirmReq1 = new HttpRequestMessage(HttpMethod.Post, $"/holds/{holdId1}/confirm");
        confirmReq1.Headers.Add("X-Student-Id", student1);
        var confirmRes1 = await client.SendAsync(confirmReq1);
        Assert.Equal(HttpStatusCode.OK, confirmRes1.StatusCode);
        var confirmData1 = await confirmRes1.Content.ReadFromJsonAsync<ConfirmHoldResponse>();
        Assert.Equal("CONFIRMED", confirmData1!.Status);

        // Confirm again (idempotent check - Rule 5)
        var confirmReq1Duplicate = new HttpRequestMessage(HttpMethod.Post, $"/holds/{holdId1}/confirm");
        confirmReq1Duplicate.Headers.Add("X-Student-Id", student1);
        var confirmRes1Dup = await client.SendAsync(confirmReq1Duplicate);
        Assert.Equal(HttpStatusCode.OK, confirmRes1Dup.StatusCode);

        // Hold and then cancel for student2
        var holdReq2 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
        holdReq2.Headers.Add("X-Student-Id", student2);
        var holdRes2 = await client.SendAsync(holdReq2);
        Assert.Equal(HttpStatusCode.Created, holdRes2.StatusCode);
        var holdData2 = await holdRes2.Content.ReadFromJsonAsync<CreateHoldResponse>();
        var holdId2 = holdData2!.HoldId;

        // Cancel hold
        var cancelReq2 = new HttpRequestMessage(HttpMethod.Delete, $"/holds/{holdId2}");
        cancelReq2.Headers.Add("X-Student-Id", student2);
        var cancelRes2 = await client.SendAsync(cancelReq2);
        Assert.Equal(HttpStatusCode.NoContent, cancelRes2.StatusCode);

        // After cancel, available seats should be 1 (since 1 confirmed, 1 released)
        var classDetail = await client.GetFromJsonAsync<ClassDetailResponse>($"/classes/{classId}");
        Assert.NotNull(classDetail);
        Assert.Equal(1, classDetail.ConfirmedSeats);
        Assert.Equal(0, classDetail.HeldSeats);
        Assert.Equal(1, classDetail.AvailableSeats);
    }
}
