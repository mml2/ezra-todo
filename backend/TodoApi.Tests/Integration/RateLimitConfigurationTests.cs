using System.Data.Common;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TodoApi.Data;
using TodoApi.DTOs;
using TodoApi.Models;
using Xunit;

namespace TodoApi.Tests.Integration;

/// <summary>
/// Verifies the API rate limiter honours the configurable RateLimiting:PermitLimit
/// setting (default 100/min). The E2E suite relies on this override to run its
/// high-volume single-window test run without tripping the production default.
/// </summary>
public class RateLimitConfigurationTests : IDisposable
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly DbConnection _connection;

    public RateLimitConfigurationTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();
    }

    public void Dispose() => _connection.Dispose();

    private WebApplicationFactory<Program> CreateFactory(string? permitLimit)
    {
        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            if (permitLimit is not null)
            {
                builder.UseSetting("RateLimiting:PermitLimit", permitLimit);
            }

            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<TodoDbContext>));
                if (descriptor != null)
                    services.Remove(descriptor);

                services.AddDbContext<TodoDbContext>(options => options.UseSqlite(_connection));

                var sp = services.BuildServiceProvider();
                using var scope = sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<TodoDbContext>();
                db.Database.EnsureCreated();

                // The rate limiter runs after auth in the pipeline, so requests
                // must be authenticated to reach it — seed alice and log in.
                if (!db.Users.Any())
                {
                    db.Users.Add(new User
                    {
                        Id = 1,
                        Username = "alice",
                        PasswordHash = "AQAAAAIAAYagAAAAED9LUCdOa5OhgPPezSyWyqKypL7L2dsB/lmGD4Q0pmNoGeXdKEuYH3PZFK6OsQjJQw==",
                        CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                    });
                    db.SaveChanges();
                }
            });
        });
    }

    private static async Task<string> GetTokenAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginDto("alice", "Password123!"));
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        var auth = JsonSerializer.Deserialize<AuthResponseDto>(json, JsonOptions);
        return auth!.Token;
    }

    [Fact]
    public async Task ApiRequests_ExceedingConfiguredLimit_AreRejected()
    {
        // Arrange: a deliberately small permit so the limit is reached quickly.
        using var factory = CreateFactory(permitLimit: "5");
        var client = factory.CreateClient();
        var token = await GetTokenAsync(client); // consumes 1 permit
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act: fire more authenticated requests than the remaining permits allow.
        var statuses = new List<HttpStatusCode>();
        for (var i = 0; i < 15; i++)
        {
            var response = await client.GetAsync("/api/tasks");
            statuses.Add(response.StatusCode);
        }

        // Assert: at least one request past the limit is rate-limited (503).
        Assert.Contains(HttpStatusCode.ServiceUnavailable, statuses);
    }

    [Fact]
    public async Task ApiRequests_UnderRaisedLimit_AreAllAccepted()
    {
        // Arrange: raise the limit well above the burst size.
        using var factory = CreateFactory(permitLimit: "1000");
        var client = factory.CreateClient();
        var token = await GetTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act: the same burst that would trip a low limit.
        var statuses = new List<HttpStatusCode>();
        for (var i = 0; i < 30; i++)
        {
            var response = await client.GetAsync("/api/tasks");
            statuses.Add(response.StatusCode);
        }

        // Assert: none were rate-limited.
        Assert.DoesNotContain(HttpStatusCode.ServiceUnavailable, statuses);
    }
}
