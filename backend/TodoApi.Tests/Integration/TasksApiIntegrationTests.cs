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
using TaskStatus = TodoApi.Models.TaskStatus;

namespace TodoApi.Tests.Integration;

/// <summary>
/// End-to-end HTTP tests over the full ASP.NET Core pipeline (routing, model binding,
/// JSON serialization, status codes) using WebApplicationFactory and an isolated
/// SQLite in-memory database per test class. Unlike the controller unit tests,
/// nothing is mocked here — these prove the wiring works.
/// </summary>
public class TasksApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    // API serializes enums as strings (JsonStringEnumConverter in Program.cs),
    // so response deserialization needs the same converter
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly DbConnection _connection;

    public TasksApiIntegrationTests(WebApplicationFactory<Program> factory)
    {
        // Isolated SQLite in-memory database; the connection must stay open
        // for the database to survive across requests within this class.
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
                }
            });
        });

        _client = _factory.CreateClient();

        // Authenticate as alice for all requests
        InitializeAuthToken();
    }

    public void Dispose()
    {
        _connection?.Dispose();
    }

    private void InitializeAuthToken()
    {
        // Login as alice to get a token
        var loginTask = Task.Run(async () =>
        {
            var loginDto = new LoginDto("alice", "Password123!");
            var response = await _client.PostAsJsonAsync("/api/auth/login", loginDto);
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var jsonDoc = JsonDocument.Parse(content);
                if (jsonDoc.RootElement.TryGetProperty("token", out var tokenElement))
                {
                    return tokenElement.GetString();
                }
            }
            throw new InvalidOperationException("Failed to obtain auth token");
        });

        var token = loginTask.Result;
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    }

    private async Task<TodoTask> SeedTaskAsync(string title = "Seeded Task")
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TodoDbContext>();
        var task = new TodoTask
        {
            UserId = 1,
            Title = title,
            Description = "Seeded Description",
            Status = TaskStatus.Todo,
            Priority = TaskPriority.High,
            CreatedAt = DateTime.UtcNow
        };
        context.Tasks.Add(task);
        await context.SaveChangesAsync();
        return task;
    }

    [Fact]
    public async Task GetTasks_ReturnsUnauthorized_WithoutAuthToken()
    {
        // Arrange - create unauthenticated client
        var unauthClient = _factory.CreateClient();

        // Act
        var response = await unauthClient.GetAsync("/api/tasks");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetTasks_ReturnsOk_WithCamelCaseJsonAndStringEnums()
    {
        // Arrange
        await SeedTaskAsync("List Task");

        // Act
        var response = await _client.GetAsync("/api/tasks");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);

        var json = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"title\":", json);          // camelCase property names
        Assert.Contains("\"createdAt\":", json);
        Assert.DoesNotContain("\"Title\":", json);    // no PascalCase leakage
        Assert.Contains("\"status\":\"Todo\"", json);  // enums serialized as strings
        Assert.Contains("\"priority\":\"High\"", json);
    }

    [Fact]
    public async Task GetTaskById_ReturnsOk_WhenTaskExists()
    {
        // Arrange
        var task = await SeedTaskAsync("Single Task");

        // Act
        var response = await _client.GetAsync($"/api/tasks/{task.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<TaskResponseDto>(JsonOptions);
        Assert.NotNull(dto);
        Assert.Equal(task.Id, dto.Id);
        Assert.Equal("Single Task", dto.Title);
        Assert.Equal(TaskStatus.Todo, dto.Status);
        Assert.Equal(TaskPriority.High, dto.Priority);
    }

    [Fact]
    public async Task GetTaskById_ReturnsNotFound_WhenTaskDoesNotExist()
    {
        // Act
        var response = await _client.GetAsync("/api/tasks/424242");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateTask_ReturnsCreated_WithLocationHeader()
    {
        // Arrange
        var dto = new CreateTaskDto(
            Title: "Created via HTTP",
            Description: "Integration test",
            Priority: TaskPriority.Medium,
            DueDate: DateTime.UtcNow.AddDays(7)
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/tasks", dto);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var created = await response.Content.ReadFromJsonAsync<TaskResponseDto>(JsonOptions);
        Assert.NotNull(created);
        Assert.Equal("Created via HTTP", created.Title);
        Assert.Equal(TaskStatus.Todo, created.Status);

        // Location header must point at the newly created resource
        Assert.NotNull(response.Headers.Location);
        Assert.EndsWith($"/api/tasks/{created.Id}", response.Headers.Location.ToString(), StringComparison.OrdinalIgnoreCase);

        // The Location URL actually resolves
        var follow = await _client.GetAsync(response.Headers.Location);
        Assert.Equal(HttpStatusCode.OK, follow.StatusCode);
    }

    [Fact]
    public async Task UpdateTask_ReturnsOk_WithUpdatedValues()
    {
        // Arrange
        var task = await SeedTaskAsync("Before Update");
        var dto = new UpdateTaskDto(
            Title: "After Update",
            Description: null,
            Status: TaskStatus.Done,
            Priority: null,
            DueDate: null
        );

        // Act
        var response = await _client.PutAsJsonAsync($"/api/tasks/{task.Id}", dto);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<TaskResponseDto>(JsonOptions);
        Assert.NotNull(updated);
        Assert.Equal("After Update", updated.Title);
        Assert.Equal(TaskStatus.Done, updated.Status);
        // Null DTO fields preserve existing values end-to-end
        Assert.Equal("Seeded Description", updated.Description);
        Assert.Equal(TaskPriority.High, updated.Priority);
    }

    [Fact]
    public async Task DeleteTask_ReturnsNoContent_AndTaskIsGone()
    {
        // Arrange
        var task = await SeedTaskAsync("To Delete");

        // Act
        var response = await _client.DeleteAsync($"/api/tasks/{task.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var followUp = await _client.GetAsync($"/api/tasks/{task.Id}");
        Assert.Equal(HttpStatusCode.NotFound, followUp.StatusCode);
    }

    [Fact]
    public async Task UpdateTaskStatus_ReturnsOk_AndStatusIsUpdated()
    {
        // Arrange
        var task = await SeedTaskAsync("Status Task");
        var dto = new UpdateTaskStatusDto(TaskStatus.InProgress);

        // Act
        var response = await _client.PatchAsJsonAsync($"/api/tasks/{task.Id}/status", dto);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<TaskResponseDto>(JsonOptions);
        Assert.NotNull(updated);
        Assert.Equal(TaskStatus.InProgress, updated.Status);
    }

    [Fact]
    public async Task UpdateTaskStatus_ReturnsNotFound_WhenTaskDoesNotExist()
    {
        // Arrange
        var dto = new UpdateTaskStatusDto(TaskStatus.Done);

        // Act
        var response = await _client.PatchAsJsonAsync("/api/tasks/424242/status", dto);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetTasks_ReturnsPaginatedResult_WhenPageAndPageSizeProvided()
    {
        // Arrange — seed 5 tasks
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TodoDbContext>();
        for (var n = 1; n <= 5; n++)
        {
            context.Tasks.Add(new TodoTask
            {
                UserId = 1,
                Title = $"Integration Paged {n}",
                Status = TaskStatus.Todo,
                Priority = TaskPriority.Low,
                CreatedAt = DateTime.UtcNow
            });
        }
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync("/api/tasks?page=1&pageSize=3");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"items\"", body);
        Assert.Contains("\"totalCount\"", body);
        Assert.Contains("\"totalPages\"", body);
    }

    [Fact]
    public async Task ErrorEndpoint_ReturnsProblemDetails()
    {
        // The /error endpoint is mapped in Program.cs to handle exception handler redirects.
        // When hit directly (no prior exception) the response status defaults to 200;
        // the important thing is it returns a ProblemDetails JSON body.
        var response = await _client.GetAsync("/error");
        var body = await response.Content.ReadAsStringAsync();

        // ProblemDetails always contains a "status" field
        Assert.Contains("status", body);
    }

    [Fact]
    public async Task CreateTask_ReturnsBadRequest_WhenTitleExceedsMaxLength()
    {
        // Arrange
        var dto = new CreateTaskDto(
            Title: new string('a', 201),
            Description: null,
            Priority: TaskPriority.Medium,
            DueDate: null
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/tasks", dto);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
