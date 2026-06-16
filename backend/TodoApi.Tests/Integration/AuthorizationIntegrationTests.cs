using System.Data.Common;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using TodoApi.Data;
using TodoApi.DTOs;
using TodoApi.Models;
using Xunit;
using TaskStatus = TodoApi.Models.TaskStatus;

namespace TodoApi.Tests.Integration;

/// <summary>
/// Integration tests for authorization and JWT security:
/// 1. Expired tokens are rejected (Gap 1)
/// 2. Cross-user task isolation through the HTTP API (Gap 2)
/// 3. Passwords are hashed at rest (Gap 3)
/// </summary>
public class AuthorizationIntegrationTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly DbConnection _connection;

    // JWT config pinned by this fixture so hand-forged tokens use the same key the
    // app validates against, independent of appsettings (the signing key is not
    // committed in appsettings.json — see Program.cs fail-fast).
    private const string JwtKey = "integration-test-signing-key-at-least-32-bytes-long";
    private const string JwtIssuer = "ezra-todo";
    private const string JwtAudience = "ezra-todo-client";

    public AuthorizationIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        _factory = factory.WithWebHostBuilder(builder =>
        {
            // Pin JWT config at host level (wins over appsettings) so the token the
            // app issues at login and the key the middleware validates with always
            // agree, and so hand-forged tokens use the same key.
            builder.UseSetting("Jwt:Key", JwtKey);
            builder.UseSetting("Jwt:Issuer", JwtIssuer);
            builder.UseSetting("Jwt:Audience", JwtAudience);
            builder.UseSetting("Jwt:ExpiryMinutes", "60");

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

                // Seed both alice and bob for cross-user tests
                if (!db.Users.Any())
                {
                    db.Users.AddRange(
                        new User
                        {
                            Id = 1,
                            Username = "alice",
                            PasswordHash = "AQAAAAIAAYagAAAAED9LUCdOa5OhgPPezSyWyqKypL7L2dsB/lmGD4Q0pmNoGeXdKEuYH3PZFK6OsQjJQw==",
                            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                        },
                        new User
                        {
                            Id = 2,
                            Username = "bob",
                            PasswordHash = "AQAAAAIAAYagAAAAECDQtSX2Iop//8OB8GLUmMQT/l3BkvzahzBvn1GS8hF82HG9Y914cds1zehMnsnVTQ==",
                            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                        }
                    );
                    db.SaveChanges();

                    // Seed a task owned by bob for cross-user isolation tests
                    db.Tasks.Add(new TodoTask
                    {
                        UserId = 2,
                        Title = "Bob's Secret Task",
                        Description = "This task belongs to Bob",
                        Status = TaskStatus.Todo,
                        Priority = TaskPriority.High,
                        CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                    });
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

    // ============ Gap 1: Expired token → 401 ============

    [Fact]
    public async Task GetTasks_ReturnsUnauthorized_WithExpiredJwtToken()
    {
        // Arrange - Hand-craft an expired JWT with the same signing key the app uses
        var expiredToken = CreateExpiredJwtToken(userId: 1, username: "alice");

        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", expiredToken);

        // Act
        var response = await _client.GetAsync("/api/tasks");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ============ Gap 2: Cross-user isolation through HTTP API ============

    [Fact]
    public async Task GetTaskById_ReturnsNotFound_WhenTaskOwnedByDifferentUser()
    {
        // Arrange - Login as alice and get her token
        var loginDto = new LoginDto("alice", "Password123!");
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", loginDto);
        var loginContent = await loginResponse.Content.ReadAsStringAsync();
        var authResponse = JsonSerializer.Deserialize<AuthResponseDto>(loginContent, JsonOptions);

        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResponse!.Token);

        // Get the ID of bob's task (ID should be 1 since it was first in the seed)
        var tasksResponse = await _client.GetAsync("/api/tasks");
        var tasksContent = await tasksResponse.Content.ReadAsStringAsync();
        var tasksList = JsonSerializer.Deserialize<List<TaskResponseDto>>(tasksContent, JsonOptions);

        // Bob's task should not appear in alice's list
        Assert.Empty(tasksList ?? new List<TaskResponseDto>());

        // Now explicitly try to access bob's task by ID (bob's task has ID=1 from seed)
        // Act
        var getBobTaskResponse = await _client.GetAsync("/api/tasks/1");

        // Assert - alice gets 404 (not 403) to avoid leaking task existence
        Assert.Equal(HttpStatusCode.NotFound, getBobTaskResponse.StatusCode);
    }

    [Fact]
    public async Task UpdateTaskById_ReturnsNotFound_WhenTaskOwnedByDifferentUser()
    {
        // Arrange - Login as alice
        var loginDto = new LoginDto("alice", "Password123!");
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", loginDto);
        var loginContent = await loginResponse.Content.ReadAsStringAsync();
        var authResponse = JsonSerializer.Deserialize<AuthResponseDto>(loginContent, JsonOptions);

        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResponse!.Token);

        // Try to update bob's task (ID=1 from seed)
        var updateDto = new UpdateTaskDto(
            Title: "Hijacked Title",
            Description: null,
            Status: TaskStatus.Done,
            Priority: TaskPriority.Low,
            DueDate: null
        );

        // Act
        var response = await _client.PutAsJsonAsync("/api/tasks/1", updateDto);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteTaskById_ReturnsNotFound_WhenTaskOwnedByDifferentUser()
    {
        // Arrange - Login as alice
        var loginDto = new LoginDto("alice", "Password123!");
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", loginDto);
        var loginContent = await loginResponse.Content.ReadAsStringAsync();
        var authResponse = JsonSerializer.Deserialize<AuthResponseDto>(loginContent, JsonOptions);

        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResponse!.Token);

        // Try to delete bob's task (ID=1 from seed)
        // Act
        var response = await _client.DeleteAsync("/api/tasks/1");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetTasks_ExcludesTasksFromOtherUsers()
    {
        // Arrange - Login as alice
        var loginDto = new LoginDto("alice", "Password123!");
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", loginDto);
        var loginContent = await loginResponse.Content.ReadAsStringAsync();
        var authResponse = JsonSerializer.Deserialize<AuthResponseDto>(loginContent, JsonOptions);

        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResponse!.Token);

        // Act
        var response = await _client.GetAsync("/api/tasks");
        var content = await response.Content.ReadAsStringAsync();
        var tasks = JsonSerializer.Deserialize<List<TaskResponseDto>>(content, JsonOptions);

        // Assert
        Assert.NotNull(tasks);
        Assert.Empty(tasks); // Alice has no tasks; bob's task should not appear
        Assert.DoesNotContain(tasks, t => t.Title == "Bob's Secret Task");
    }

    // ============ Gap 3: Password hashed at rest ============

    [Fact]
    public async Task User_PasswordHashIsNotPlaintext_InDatabase()
    {
        // Arrange - Create a fresh context to read from the seeded database
        var contextOptions = new DbContextOptionsBuilder<TodoDbContext>()
            .UseSqlite(_connection)
            .Options;

        using var context = new TodoDbContext(contextOptions);

        const string plainTextPassword = "Password123!";

        // Act - Fetch alice from the database
        var alice = await context.Users.FirstOrDefaultAsync(u => u.Username == "alice");

        // Assert
        Assert.NotNull(alice);
        Assert.NotEqual(plainTextPassword, alice.PasswordHash);
        Assert.DoesNotContain(plainTextPassword, alice.PasswordHash);

        // Also verify bob's password is hashed
        var bob = await context.Users.FirstOrDefaultAsync(u => u.Username == "bob");
        Assert.NotNull(bob);
        Assert.NotEqual(plainTextPassword, bob.PasswordHash);
        Assert.DoesNotContain(plainTextPassword, bob.PasswordHash);
    }

    // ============ Helper: Create an expired JWT token ============

    private static string CreateExpiredJwtToken(int userId, string username)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Name, username)
        };

        // Expired 5 minutes ago (ClockSkew = TimeSpan.Zero in the app, so this is reliably rejected)
        var token = new JwtSecurityToken(
            issuer: JwtIssuer,
            audience: JwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(-5),
            signingCredentials: credentials
        );

        var handler = new JwtSecurityTokenHandler();
        return handler.WriteToken(token);
    }
}
