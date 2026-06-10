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

namespace TodoApi.Tests.Controllers;

public class TasksControllerTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly DbConnection _connection;

    public TasksControllerTests(WebApplicationFactory<Program> factory)
    {
        // Create and open a connection to SQLite in-memory database
        // Connection must stay open for the lifetime of the test
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Remove existing DbContext registration
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<TodoDbContext>));
                if (descriptor != null)
                    services.Remove(descriptor);

                // Add SQLite in-memory database for testing
                services.AddDbContext<TodoDbContext>(options =>
                {
                    options.UseSqlite(_connection);
                });

                // Create the schema in the database
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

    [Fact]
    public async Task GetTasks_ReturnsEmptyList_WhenNoTasks()
    {
        // Act
        var response = await _client.GetAsync("/api/tasks");

        // Assert
        response.EnsureSuccessStatusCode();
        var tasks = await response.Content.ReadFromJsonAsync<IEnumerable<TaskResponseDto>>();
        Assert.NotNull(tasks);
        Assert.Empty(tasks);
    }

    [Fact]
    public async Task GetTasks_ReturnsTasks_WhenTasksExist()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TodoDbContext>();
        context.Tasks.Add(new TodoTask
        {
            Title = "Test Task",
            Status = TaskStatus.Todo,
            Priority = TaskPriority.Medium,
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync("/api/tasks");

        // Assert
        response.EnsureSuccessStatusCode();
        var tasks = await response.Content.ReadFromJsonAsync<IEnumerable<TaskResponseDto>>();
        Assert.NotNull(tasks);
        Assert.Single(tasks);
        Assert.Equal("Test Task", tasks.First().Title);
    }

    [Fact]
    public async Task GetTaskById_ReturnsTask_WhenTaskExists()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TodoDbContext>();
        var task = new TodoTask
        {
            Title = "Test Task",
            Description = "Test Description",
            Status = TaskStatus.Todo,
            Priority = TaskPriority.High,
            CreatedAt = DateTime.UtcNow
        };
        context.Tasks.Add(task);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/tasks/{task.Id}");

        // Assert
        response.EnsureSuccessStatusCode();
        var returnedTask = await response.Content.ReadFromJsonAsync<TaskResponseDto>();
        Assert.NotNull(returnedTask);
        Assert.Equal("Test Task", returnedTask.Title);
        Assert.Equal("Test Description", returnedTask.Description);
    }

    [Fact]
    public async Task GetTaskById_ReturnsNotFound_WhenTaskDoesNotExist()
    {
        // Act
        var response = await _client.GetAsync("/api/tasks/999");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateTask_CreatesTask_WithValidData()
    {
        // Arrange
        var dto = new CreateTaskDto(
            Title: "New Task",
            Description: "New Description",
            Priority: TaskPriority.Medium,
            DueDate: DateTime.UtcNow.AddDays(7)
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/tasks", dto);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var createdTask = await response.Content.ReadFromJsonAsync<TaskResponseDto>();
        Assert.NotNull(createdTask);
        Assert.Equal("New Task", createdTask.Title);
        Assert.Equal("New Description", createdTask.Description);
        Assert.Equal(TaskStatus.Todo, createdTask.Status);
        Assert.Equal(TaskPriority.Medium, createdTask.Priority);
    }

    [Fact]
    public async Task CreateTask_ReturnsBadRequest_WhenTitleIsEmpty()
    {
        // Arrange
        var dto = new CreateTaskDto(
            Title: "",
            Description: "Description",
            Priority: TaskPriority.Medium,
            DueDate: null
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/tasks", dto);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateTask_UpdatesTask_WithValidData()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TodoDbContext>();
        var task = new TodoTask
        {
            Title = "Original Title",
            Status = TaskStatus.Todo,
            Priority = TaskPriority.Low,
            CreatedAt = DateTime.UtcNow
        };
        context.Tasks.Add(task);
        await context.SaveChangesAsync();

        var dto = new UpdateTaskDto(
            Title: "Updated Title",
            Description: "Updated Description",
            Status: TaskStatus.InProgress,
            Priority: TaskPriority.High,
            DueDate: null
        );

        // Act
        var response = await _client.PutAsJsonAsync($"/api/tasks/{task.Id}", dto);

        // Assert
        response.EnsureSuccessStatusCode();
        var updatedTask = await response.Content.ReadFromJsonAsync<TaskResponseDto>();
        Assert.NotNull(updatedTask);
        Assert.Equal("Updated Title", updatedTask.Title);
        Assert.Equal("Updated Description", updatedTask.Description);
        Assert.Equal(TaskStatus.InProgress, updatedTask.Status);
        Assert.Equal(TaskPriority.High, updatedTask.Priority);
    }

    [Fact]
    public async Task UpdateTask_ReturnsNotFound_WhenTaskDoesNotExist()
    {
        // Arrange
        var dto = new UpdateTaskDto(
            Title: "Updated Title",
            Description: null,
            Status: TaskStatus.Done,
            Priority: null,
            DueDate: null
        );

        // Act
        var response = await _client.PutAsJsonAsync("/api/tasks/999", dto);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateTaskStatus_UpdatesStatus_WithValidData()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TodoDbContext>();
        var task = new TodoTask
        {
            Title = "Task",
            Status = TaskStatus.Todo,
            Priority = TaskPriority.Medium,
            CreatedAt = DateTime.UtcNow
        };
        context.Tasks.Add(task);
        await context.SaveChangesAsync();

        var dto = new UpdateTaskStatusDto(TaskStatus.Done);

        // Act
        var response = await _client.PatchAsJsonAsync($"/api/tasks/{task.Id}/status", dto);

        // Assert
        response.EnsureSuccessStatusCode();
        var updatedTask = await response.Content.ReadFromJsonAsync<TaskResponseDto>();
        Assert.NotNull(updatedTask);
        Assert.Equal(TaskStatus.Done, updatedTask.Status);
    }

    [Fact]
    public async Task DeleteTask_DeletesTask_WhenTaskExists()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TodoDbContext>();
        var task = new TodoTask
        {
            Title = "Task to Delete",
            Status = TaskStatus.Todo,
            Priority = TaskPriority.Low,
            CreatedAt = DateTime.UtcNow
        };
        context.Tasks.Add(task);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.DeleteAsync($"/api/tasks/{task.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Verify task is soft deleted
        var getResponse = await _client.GetAsync($"/api/tasks/{task.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task DeleteTask_ReturnsNotFound_WhenTaskDoesNotExist()
    {
        // Act
        var response = await _client.DeleteAsync("/api/tasks/999");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData(0, 20)]
    [InlineData(-1, 20)]
    public async Task GetTasks_ReturnsBadRequest_WhenPageIsLessThanOne(int page, int pageSize)
    {
        // Act
        var response = await _client.GetAsync($"/api/tasks?page={page}&pageSize={pageSize}");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData(1, 0)]
    [InlineData(1, 1000)]
    public async Task GetTasks_ReturnsBadRequest_WhenPageSizeIsOutOfBounds(int page, int pageSize)
    {
        // Act
        var response = await _client.GetAsync($"/api/tasks?page={page}&pageSize={pageSize}");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateTask_ReturnsBadRequest_WhenPriorityIsInvalidEnumValue()
    {
        // Arrange - "Urgent" is not a valid TaskPriority; JsonStringEnumConverter rejects it at binding
        var content = new StringContent(
            """{"title":"Task","description":null,"priority":"Urgent","dueDate":null}""",
            System.Text.Encoding.UTF8,
            "application/json");

        // Act
        var response = await _client.PostAsync("/api/tasks", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateTask_ReturnsBadRequest_WhenStatusIsInvalidEnumValue()
    {
        // Arrange - "Archived" is not a valid TaskStatus
        var content = new StringContent(
            """{"title":"Task","status":"Archived"}""",
            System.Text.Encoding.UTF8,
            "application/json");

        // Act
        var response = await _client.PutAsync("/api/tasks/1", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
