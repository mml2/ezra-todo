using System.Data.Common;
using System.Net;
using System.Net.Http.Json;
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
            });
        });

        _client = _factory.CreateClient();
    }

    public void Dispose()
    {
        _connection?.Dispose();
    }

    private async Task<TodoTask> SeedTaskAsync(string title = "Seeded Task")
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TodoDbContext>();
        var task = new TodoTask
        {
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
        var dto = await response.Content.ReadFromJsonAsync<TaskResponseDto>();
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

        var created = await response.Content.ReadFromJsonAsync<TaskResponseDto>();
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
        var updated = await response.Content.ReadFromJsonAsync<TaskResponseDto>();
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
}
