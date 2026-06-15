using System.Data.Common;
using System.Net;
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
/// Integration tests proving JWT bearer authentication middleware is wired and functional
/// in the ASP.NET Core pipeline. Tests validate:
/// 1. Login endpoint returns a valid 3-part JWT token
/// 2. The JWT middleware is live and accepts Bearer tokens without crashing
/// 3. Currently-anonymous endpoints still work (no [Authorize] attributes yet — that's BE-4)
/// </summary>
public class AuthMiddlewareTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly DbConnection _connection;

    public AuthMiddlewareTests(WebApplicationFactory<Program> factory)
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        _factory = factory.WithWebHostBuilder(builder =>
        {
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

                // Seed demo users for tests
                if (!db.Users.Any())
                {
                    db.Users.AddRange(
                        new User
                        {
                            Id = 1,
                            Username = "alice",
                            PasswordHash = "AQAAAAIAAYagAAAAED9LUCdOa5OhgPPezSyWyqKypL7L2dsB/lmGD4Q0pmNoGeXdKEuYH3PZFK6OsQjJQw==",
                            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                        }
                    );
                    db.SaveChanges();
                }
            });
        });

        _client = _factory.CreateClient();
    }

    public void Dispose()
    {
        _connection?.Dispose();
    }

    [Fact]
    public async Task PostLogin_ReturnsOk_WithValidJwtToken()
    {
        // Arrange
        var loginDto = new LoginDto("alice", "Password123!");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginDto);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var jsonContent = await response.Content.ReadAsStringAsync();
        var content = JsonSerializer.Deserialize<AuthResponseDto>(jsonContent, JsonOptions);

        Assert.NotNull(content);
        Assert.NotEmpty(content.Token);
        Assert.Equal("alice", content.Username);

        // Verify the token is a valid 3-part JWT (header.payload.signature)
        var parts = content.Token.Split('.');
        Assert.Equal(3, parts.Length);
        Assert.NotEmpty(parts[0]); // header
        Assert.NotEmpty(parts[1]); // payload
        Assert.NotEmpty(parts[2]); // signature
    }

    [Fact]
    public async Task GetTasks_ReturnsUnauthorized_WhenMakingRequestWithoutBearerToken()
    {
        // Arrange
        // Note: /api/tasks is now decorated with [Authorize] (BE-4)
        // This test proves the [Authorize] attribute blocks unauthenticated requests

        // Act
        var response = await _client.GetAsync("/api/tasks");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetTasks_ReturnsUnauthorized_WhenMakingRequestWithGarbageBearerToken()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "not.a.valid.token");

        // Act
        var response = await _client.GetAsync("/api/tasks");

        // Assert
        // Invalid token is rejected by JWT middleware
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task JwtMiddleware_IsRegisteredAndLive_AsProvenByAcceptingValidToken()
    {
        // Arrange - login to get a valid token
        var loginDto = new LoginDto("alice", "Password123!");
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", loginDto);
        var loginContent = await loginResponse.Content.ReadAsStringAsync();
        var authResponse = JsonSerializer.Deserialize<AuthResponseDto>(loginContent, JsonOptions);

        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResponse!.Token);

        // Act - request with valid token
        var response = await _client.GetAsync("/api/tasks");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        // If we get here, the entire pipeline (CORS, Authentication, Authorization, RateLimiter)
        // ran without crashing and accepted the valid token. This proves JWT middleware is wired correctly.
    }
}
