using TodoApi.Data;
using TodoApi.DTOs;
using TodoApi.Models;
using TaskStatus = TodoApi.Models.TaskStatus;

namespace TodoApi.Services;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _repository;

    public TaskService(ITaskRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<IEnumerable<TaskResponseDto>>> GetAllTasksAsync()
    {
        var tasks = await _repository.GetAllAsync();
        var dtos = tasks.Select(MapToDto);
        return Result<IEnumerable<TaskResponseDto>>.Ok(dtos);
    }

    public async Task<Result<PagedResult<TaskResponseDto>>> GetTasksPagedAsync(int page, int pageSize)
    {
        if (page < 1)
            return Result<PagedResult<TaskResponseDto>>.Fail("Page must be greater than 0", 400);

        if (pageSize < 1 || pageSize > 100)
            return Result<PagedResult<TaskResponseDto>>.Fail("PageSize must be between 1 and 100", 400);

        var pagedTasks = await _repository.GetPagedAsync(page, pageSize);

        var pagedDtos = new PagedResult<TaskResponseDto>
        {
            Items = pagedTasks.Items.Select(MapToDto),
            TotalCount = pagedTasks.TotalCount,
            Page = pagedTasks.Page,
            PageSize = pagedTasks.PageSize
        };

        return Result<PagedResult<TaskResponseDto>>.Ok(pagedDtos);
    }

    public async Task<Result<TaskResponseDto>> GetTaskByIdAsync(int id)
    {
        var task = await _repository.GetByIdAsync(id);

        if (task == null)
            return Result<TaskResponseDto>.Fail("Task not found", 404);

        return Result<TaskResponseDto>.Ok(MapToDto(task));
    }

    public async Task<Result<TaskResponseDto>> CreateTaskAsync(CreateTaskDto dto)
    {
        // Validation - ensure all required fields are present
        if (string.IsNullOrWhiteSpace(dto.Title))
            return Result<TaskResponseDto>.Fail("Title is required", 400);

        if (dto.Title.Length > 200)
            return Result<TaskResponseDto>.Fail("Title must not exceed 200 characters", 400);

        if (dto.Description?.Length > 1000)
            return Result<TaskResponseDto>.Fail("Description must not exceed 1000 characters", 400);

        // Validate priority is a valid enum value
        if (!Enum.IsDefined(typeof(TaskPriority), dto.Priority))
            return Result<TaskResponseDto>.Fail("Invalid priority value", 400);

        // Create entity with all required fields
        // - Title: validated above (required, non-empty)
        // - Status: always set to Todo for new tasks
        // - Priority: validated above (required enum)
        // - CreatedAt: set by repository layer
        var task = new TodoTask
        {
            Title = dto.Title,
            Description = dto.Description,
            Status = TaskStatus.Todo,
            Priority = dto.Priority,
            DueDate = dto.DueDate,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };

        var createdTask = await _repository.CreateAsync(task);
        return new Result<TaskResponseDto>
        {
            Success = true,
            Data = MapToDto(createdTask),
            StatusCode = 201
        };
    }

    public async Task<Result<TaskResponseDto>> UpdateTaskAsync(int id, UpdateTaskDto dto)
    {
        // Validation
        if (dto.Title != null && string.IsNullOrWhiteSpace(dto.Title))
            return Result<TaskResponseDto>.Fail("Title cannot be empty", 400);

        if (dto.Title?.Length > 200)
            return Result<TaskResponseDto>.Fail("Title must not exceed 200 characters", 400);

        if (dto.Description?.Length > 1000)
            return Result<TaskResponseDto>.Fail("Description must not exceed 1000 characters", 400);

        // Validate enums if provided
        if (dto.Status.HasValue && !Enum.IsDefined(typeof(TaskStatus), dto.Status.Value))
            return Result<TaskResponseDto>.Fail("Invalid status value", 400);

        if (dto.Priority.HasValue && !Enum.IsDefined(typeof(TaskPriority), dto.Priority.Value))
            return Result<TaskResponseDto>.Fail("Invalid priority value", 400);

        // Get existing task
        var existingTask = await _repository.GetByIdAsync(id);

        if (existingTask == null)
            return Result<TaskResponseDto>.Fail("Task not found", 404);

        // Update only provided fields, preserve existing values for nulls
        // This ensures required fields (Title, Status, Priority) are never lost
        var task = new TodoTask
        {
            Title = dto.Title ?? existingTask.Title,
            Description = dto.Description ?? existingTask.Description,
            Status = dto.Status ?? existingTask.Status,
            Priority = dto.Priority ?? existingTask.Priority,
            DueDate = dto.DueDate ?? existingTask.DueDate
        };

        var updatedTask = await _repository.UpdateAsync(id, task);

        return Result<TaskResponseDto>.Ok(MapToDto(updatedTask!));
    }

    public async Task<Result<TaskResponseDto>> UpdateTaskStatusAsync(int id, UpdateTaskStatusDto dto)
    {
        // Validate status is a valid enum value
        if (!Enum.IsDefined(typeof(TaskStatus), dto.Status))
            return Result<TaskResponseDto>.Fail("Invalid status value", 400);

        var existingTask = await _repository.GetByIdAsync(id);

        if (existingTask == null)
            return Result<TaskResponseDto>.Fail("Task not found", 404);

        existingTask.Status = dto.Status;

        var updatedTask = await _repository.UpdateAsync(id, existingTask);

        if (updatedTask == null)
            return Result<TaskResponseDto>.Fail("Task not found", 404);

        return Result<TaskResponseDto>.Ok(MapToDto(updatedTask));
    }

    public async Task<Result<object>> DeleteTaskAsync(int id)
    {
        var deleted = await _repository.DeleteAsync(id);

        if (!deleted)
            return Result<object>.Fail("Task not found", 404);

        return new Result<object>
        {
            Success = true,
            StatusCode = 204
        };
    }

    private static TaskResponseDto MapToDto(TodoTask task)
    {
        return new TaskResponseDto(
            Id: task.Id,
            Title: task.Title,
            Description: task.Description,
            Status: task.Status,
            Priority: task.Priority,
            CreatedAt: task.CreatedAt,
            UpdatedAt: task.UpdatedAt,
            DueDate: task.DueDate
        );
    }
}
