using Microsoft.Extensions.Logging;
using Moq;
using TodoApi.Data;
using TodoApi.DTOs;
using TodoApi.Models;
using TodoApi.Services;
using Xunit;
using TaskStatus = TodoApi.Models.TaskStatus;

namespace TodoApi.Tests.Services;

public class TaskServiceTests
{
    private readonly Mock<ITaskRepository> _mockRepository;
    private readonly TaskService _service;

    public TaskServiceTests()
    {
        _mockRepository = new Mock<ITaskRepository>();
        _service = new TaskService(_mockRepository.Object, Mock.Of<ILogger<TaskService>>());
    }

    [Fact]
    public async Task GetAllTasksAsync_WithTasks_ReturnsSuccessWithDtos()
    {
        // Arrange
        var tasks = new List<TodoTask>
        {
            new() { Id = 1, Title = "Task 1", Status = TaskStatus.Todo, Priority = TaskPriority.Medium, CreatedAt = DateTime.UtcNow },
            new() { Id = 2, Title = "Task 2", Status = TaskStatus.InProgress, Priority = TaskPriority.High, CreatedAt = DateTime.UtcNow }
        };
        _mockRepository.Setup(r => r.GetAllAsync()).ReturnsAsync(tasks);

        // Act
        var result = await _service.GetAllTasksAsync();

        // Assert
        Assert.True(result.Success);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Data);
        Assert.Equal(2, result.Data.Count());
        Assert.Equal("Task 1", result.Data.First().Title);
    }

    [Fact]
    public async Task GetAllTasksAsync_WithNoTasks_ReturnsEmptyList()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<TodoTask>());

        // Act
        var result = await _service.GetAllTasksAsync();

        // Assert
        Assert.True(result.Success);
        Assert.Empty(result.Data!);
    }

    [Fact]
    public async Task GetTaskByIdAsync_WithValidId_ReturnsTask()
    {
        // Arrange
        var task = new TodoTask
        {
            Id = 1,
            Title = "Test Task",
            Description = "Test Description",
            Status = TaskStatus.Todo,
            Priority = TaskPriority.High,
            CreatedAt = DateTime.UtcNow
        };
        _mockRepository.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(task);

        // Act
        var result = await _service.GetTaskByIdAsync(1);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Data);
        Assert.Equal("Test Task", result.Data.Title);
        Assert.Equal("Test Description", result.Data.Description);
    }

    [Fact]
    public async Task GetTaskByIdAsync_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((TodoTask?)null);

        // Act
        var result = await _service.GetTaskByIdAsync(999);

        // Assert
        Assert.False(result.Success);
        Assert.Equal(404, result.StatusCode);
        Assert.Equal("Task not found", result.Error);
    }

    [Fact]
    public async Task CreateTaskAsync_WithValidDto_CreatesTask()
    {
        // Arrange
        var dto = new CreateTaskDto(
            Title: "New Task",
            Description: "New Description",
            Priority: TaskPriority.Medium,
            DueDate: DateTime.UtcNow.AddDays(7)
        );

        var createdTask = new TodoTask
        {
            Id = 1,
            Title = dto.Title,
            Description = dto.Description,
            Status = TaskStatus.Todo,
            Priority = dto.Priority,
            DueDate = dto.DueDate,
            CreatedAt = DateTime.UtcNow
        };

        _mockRepository.Setup(r => r.CreateAsync(It.IsAny<TodoTask>())).ReturnsAsync(createdTask);

        // Act
        var result = await _service.CreateTaskAsync(dto);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(201, result.StatusCode);
        Assert.NotNull(result.Data);
        Assert.Equal("New Task", result.Data.Title);
        Assert.Equal(TaskStatus.Todo, result.Data.Status);
    }

    [Fact]
    public async Task CreateTaskAsync_WithEmptyTitle_ReturnsBadRequest()
    {
        // Arrange
        var dto = new CreateTaskDto(
            Title: "",
            Description: "Description",
            Priority: TaskPriority.Medium,
            DueDate: null
        );

        // Act
        var result = await _service.CreateTaskAsync(dto);

        // Assert
        Assert.False(result.Success);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal("Title is required", result.Error);
    }

    [Fact]
    public async Task CreateTaskAsync_WithTitleTooLong_ReturnsBadRequest()
    {
        // Arrange
        var dto = new CreateTaskDto(
            Title: new string('a', 201),
            Description: "Description",
            Priority: TaskPriority.Medium,
            DueDate: null
        );

        // Act
        var result = await _service.CreateTaskAsync(dto);

        // Assert
        Assert.False(result.Success);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal("Title must not exceed 200 characters", result.Error);
    }

    [Fact]
    public async Task UpdateTaskAsync_WithValidData_UpdatesTask()
    {
        // Arrange
        var existingTask = new TodoTask
        {
            Id = 1,
            Title = "Original Title",
            Status = TaskStatus.Todo,
            Priority = TaskPriority.Low,
            CreatedAt = DateTime.UtcNow
        };

        var dto = new UpdateTaskDto(
            Title: "Updated Title",
            Description: "Updated Description",
            Status: TaskStatus.InProgress,
            Priority: TaskPriority.High,
            DueDate: null
        );

        var updatedTask = new TodoTask
        {
            Id = 1,
            Title = "Updated Title",
            Description = "Updated Description",
            Status = TaskStatus.InProgress,
            Priority = TaskPriority.High,
            CreatedAt = existingTask.CreatedAt,
            UpdatedAt = DateTime.UtcNow
        };

        // Service fetches the existing task before updating, so GetByIdAsync must be mocked
        _mockRepository.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(existingTask);
        _mockRepository.Setup(r => r.UpdateAsync(1, It.IsAny<TodoTask>())).ReturnsAsync(updatedTask);

        // Act
        var result = await _service.UpdateTaskAsync(1, dto);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Data);
        Assert.Equal("Updated Title", result.Data.Title);
        Assert.Equal(TaskStatus.InProgress, result.Data.Status);
    }

    [Fact]
    public async Task UpdateTaskAsync_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var dto = new UpdateTaskDto(
            Title: "Updated Title",
            Description: null,
            Status: TaskStatus.Done,
            Priority: null,
            DueDate: null
        );

        _mockRepository.Setup(r => r.UpdateAsync(999, It.IsAny<TodoTask>())).ReturnsAsync((TodoTask?)null);

        // Act
        var result = await _service.UpdateTaskAsync(999, dto);

        // Assert
        Assert.False(result.Success);
        Assert.Equal(404, result.StatusCode);
        Assert.Equal("Task not found", result.Error);
    }

    [Fact]
    public async Task UpdateTaskStatusAsync_WithValidStatus_UpdatesStatus()
    {
        // Arrange
        var existingTask = new TodoTask
        {
            Id = 1,
            Title = "Task",
            Status = TaskStatus.Todo,
            Priority = TaskPriority.Medium,
            CreatedAt = DateTime.UtcNow
        };

        var updatedTask = new TodoTask
        {
            Id = 1,
            Title = "Task",
            Status = TaskStatus.Done,
            Priority = TaskPriority.Medium,
            CreatedAt = existingTask.CreatedAt,
            UpdatedAt = DateTime.UtcNow
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(existingTask);
        _mockRepository.Setup(r => r.UpdateAsync(1, It.IsAny<TodoTask>())).ReturnsAsync(updatedTask);

        var dto = new UpdateTaskStatusDto(TaskStatus.Done);

        // Act
        var result = await _service.UpdateTaskStatusAsync(1, dto);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Data);
        Assert.Equal(TaskStatus.Done, result.Data.Status);
    }

    [Fact]
    public async Task UpdateTaskStatusAsync_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((TodoTask?)null);
        var dto = new UpdateTaskStatusDto(TaskStatus.Done);

        // Act
        var result = await _service.UpdateTaskStatusAsync(999, dto);

        // Assert
        Assert.False(result.Success);
        Assert.Equal(404, result.StatusCode);
    }

    [Fact]
    public async Task DeleteTaskAsync_WithValidId_DeletesTask()
    {
        // Arrange
        _mockRepository.Setup(r => r.DeleteAsync(1)).ReturnsAsync(true);

        // Act
        var result = await _service.DeleteTaskAsync(1);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(204, result.StatusCode);
    }

    [Fact]
    public async Task DeleteTaskAsync_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        _mockRepository.Setup(r => r.DeleteAsync(999)).ReturnsAsync(false);

        // Act
        var result = await _service.DeleteTaskAsync(999);

        // Assert
        Assert.False(result.Success);
        Assert.Equal(404, result.StatusCode);
        Assert.Equal("Task not found", result.Error);
    }

    [Fact]
    public async Task UpdateTaskAsync_WithNullFields_PreservesExistingValues()
    {
        // Arrange
        var dueDate = DateTime.UtcNow.AddDays(3);
        var existingTask = new TodoTask
        {
            Id = 1,
            Title = "Existing Title",
            Description = "Existing Description",
            Status = TaskStatus.InProgress,
            Priority = TaskPriority.High,
            DueDate = dueDate,
            CreatedAt = DateTime.UtcNow
        };

        var dto = new UpdateTaskDto(
            Title: null,
            Description: null,
            Status: null,
            Priority: null,
            DueDate: null
        );

        TodoTask? capturedTask = null;
        _mockRepository.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(existingTask);
        _mockRepository.Setup(r => r.UpdateAsync(1, It.IsAny<TodoTask>()))
            .Callback<int, TodoTask>((_, t) => capturedTask = t)
            .ReturnsAsync(existingTask);

        // Act
        var result = await _service.UpdateTaskAsync(1, dto);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(capturedTask);
        Assert.Equal("Existing Title", capturedTask.Title);
        Assert.Equal("Existing Description", capturedTask.Description);
        Assert.Equal(TaskStatus.InProgress, capturedTask.Status);
        Assert.Equal(TaskPriority.High, capturedTask.Priority);
        Assert.Equal(dueDate, capturedTask.DueDate);
    }

    [Theory]
    [InlineData(0, 20)]
    [InlineData(-1, 20)]
    public async Task GetTasksPagedAsync_WithPageLessThanOne_ReturnsBadRequest(int page, int pageSize)
    {
        // Act
        var result = await _service.GetTasksPagedAsync(page, pageSize);

        // Assert
        Assert.False(result.Success);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal("Page must be greater than 0", result.Error);
        _mockRepository.Verify(r => r.GetPagedAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Theory]
    [InlineData(1, 0)]
    [InlineData(1, -5)]
    [InlineData(1, 101)]
    [InlineData(1, 1000)]
    public async Task GetTasksPagedAsync_WithInvalidPageSize_ReturnsBadRequest(int page, int pageSize)
    {
        // Act
        var result = await _service.GetTasksPagedAsync(page, pageSize);

        // Assert
        Assert.False(result.Success);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal("PageSize must be between 1 and 100", result.Error);
        _mockRepository.Verify(r => r.GetPagedAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetTasksPagedAsync_WithValidParams_ReturnsPagedResult()
    {
        // Arrange
        var pagedTasks = new PagedResult<TodoTask>
        {
            Items = new List<TodoTask>
            {
                new() { Id = 1, Title = "Task 1", Status = TaskStatus.Todo, Priority = TaskPriority.Medium, CreatedAt = DateTime.UtcNow }
            },
            TotalCount = 25,
            Page = 2,
            PageSize = 20
        };
        _mockRepository.Setup(r => r.GetPagedAsync(2, 20)).ReturnsAsync(pagedTasks);

        // Act
        var result = await _service.GetTasksPagedAsync(2, 20);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Data);
        Assert.Single(result.Data.Items);
        Assert.Equal(25, result.Data.TotalCount);
        Assert.Equal(2, result.Data.Page);
        Assert.Equal(20, result.Data.PageSize);
        Assert.Equal(2, result.Data.TotalPages);
    }
}
