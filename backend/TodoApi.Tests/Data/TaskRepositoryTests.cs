using System.Data.Common;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using TodoApi.Data;
using TodoApi.Models;
using Xunit;
using TaskStatus = TodoApi.Models.TaskStatus;

namespace TodoApi.Tests.Data;

public class TaskRepositoryTests : IDisposable
{
    private readonly TodoDbContext _context;
    private readonly TaskRepository _repository;
    private readonly DbConnection _connection;

    public TaskRepositoryTests()
    {
        // Create SQLite in-memory connection (must stay open)
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<TodoDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new TodoDbContext(options);
        _context.Database.EnsureCreated();
        _repository = new TaskRepository(_context);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public async Task GetAllAsync_ReturnsAllNonDeletedTasks()
    {
        // Arrange
        var task1 = new TodoTask
        {
            Title = "Task 1",
            Status = TaskStatus.Todo,
            Priority = TaskPriority.Medium,
            CreatedAt = DateTime.UtcNow
        };
        var task2 = new TodoTask
        {
            Title = "Task 2",
            Status = TaskStatus.InProgress,
            Priority = TaskPriority.High,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Tasks.AddRangeAsync(task1, task2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAllAsync();

        // Assert
        Assert.Equal(2, result.Count());
        Assert.Contains(result, t => t.Title == "Task 1");
        Assert.Contains(result, t => t.Title == "Task 2");
    }

    [Fact]
    public async Task GetAllAsync_ExcludesSoftDeletedTasks()
    {
        // Arrange
        var activeTask = new TodoTask
        {
            Title = "Active Task",
            Status = TaskStatus.Todo,
            Priority = TaskPriority.Medium,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
        var deletedTask = new TodoTask
        {
            Title = "Deleted Task",
            Status = TaskStatus.Todo,
            Priority = TaskPriority.Low,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = true
        };

        await _context.Tasks.AddRangeAsync(activeTask, deletedTask);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAllAsync();

        // Assert
        Assert.Single(result);
        Assert.Equal("Active Task", result.First().Title);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsTask_WhenFound()
    {
        // Arrange
        var task = new TodoTask
        {
            Title = "Test Task",
            Description = "Test Description",
            Status = TaskStatus.Todo,
            Priority = TaskPriority.High,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Tasks.AddAsync(task);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByIdAsync(task.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Test Task", result.Title);
        Assert.Equal("Test Description", result.Description);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_WhenNotFound()
    {
        // Act
        var result = await _repository.GetByIdAsync(999);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_ForSoftDeletedTask()
    {
        // Arrange
        var task = new TodoTask
        {
            Title = "Deleted Task",
            Status = TaskStatus.Todo,
            Priority = TaskPriority.Low,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = true
        };

        await _context.Tasks.AddAsync(task);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByIdAsync(task.Id);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task CreateAsync_CreatesTaskWithCorrectTimestamps()
    {
        // Arrange
        var beforeCreate = DateTime.UtcNow;
        var newTask = new TodoTask
        {
            Title = "New Task",
            Description = "New Description",
            Status = TaskStatus.Todo,
            Priority = TaskPriority.Medium,
            DueDate = DateTime.UtcNow.AddDays(7)
        };

        // Act
        var result = await _repository.CreateAsync(newTask);
        var afterCreate = DateTime.UtcNow;

        // Assert
        Assert.NotEqual(0, result.Id);
        Assert.Equal("New Task", result.Title);
        Assert.True(result.CreatedAt >= beforeCreate && result.CreatedAt <= afterCreate);
        Assert.Null(result.UpdatedAt);
        Assert.False(result.IsDeleted);
    }

    [Fact]
    public async Task UpdateAsync_UpdatesTaskAndSetsUpdatedAt()
    {
        // Arrange
        var task = new TodoTask
        {
            Title = "Original Title",
            Description = "Original Description",
            Status = TaskStatus.Todo,
            Priority = TaskPriority.Low,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Tasks.AddAsync(task);
        await _context.SaveChangesAsync();

        var updatedTask = new TodoTask
        {
            Title = "Updated Title",
            Description = "Updated Description",
            Status = TaskStatus.InProgress,
            Priority = TaskPriority.High
        };

        var beforeUpdate = DateTime.UtcNow;

        // Act
        var result = await _repository.UpdateAsync(task.Id, updatedTask);
        var afterUpdate = DateTime.UtcNow;

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated Title", result.Title);
        Assert.Equal("Updated Description", result.Description);
        Assert.Equal(TaskStatus.InProgress, result.Status);
        Assert.Equal(TaskPriority.High, result.Priority);
        Assert.NotNull(result.UpdatedAt);
        Assert.True(result.UpdatedAt >= beforeUpdate && result.UpdatedAt <= afterUpdate);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsNull_ForNonExistentTask()
    {
        // Arrange
        var updatedTask = new TodoTask
        {
            Title = "Updated Title",
            Status = TaskStatus.Done,
            Priority = TaskPriority.Medium
        };

        // Act
        var result = await _repository.UpdateAsync(999, updatedTask);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteAsync_SoftDeletesTask()
    {
        // Arrange
        var task = new TodoTask
        {
            Title = "Task to Delete",
            Status = TaskStatus.Todo,
            Priority = TaskPriority.Low,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Tasks.AddAsync(task);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.DeleteAsync(task.Id);

        // Assert
        Assert.True(result);

        // Verify task is soft deleted by checking directly in context (bypassing query filter)
        var deletedTask = await _context.Tasks.IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == task.Id);
        Assert.NotNull(deletedTask);
        Assert.True(deletedTask.IsDeleted);

        // Verify task is not returned by GetByIdAsync
        var getResult = await _repository.GetByIdAsync(task.Id);
        Assert.Null(getResult);
    }

    [Fact]
    public async Task DeleteAsync_ReturnsFalse_ForNonExistentTask()
    {
        // Act
        var result = await _repository.DeleteAsync(999);

        // Assert
        Assert.False(result);
    }
}
