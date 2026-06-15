using TodoApi.DTOs;
using TodoApi.Models;

namespace TodoApi.Services;

public interface ITaskService
{
    Task<Result<IEnumerable<TaskResponseDto>>> GetAllTasksAsync(int userId);
    Task<Result<PagedResult<TaskResponseDto>>> GetTasksPagedAsync(int userId, int page, int pageSize);
    Task<Result<TaskResponseDto>> GetTaskByIdAsync(int id, int userId);
    Task<Result<TaskResponseDto>> CreateTaskAsync(int userId, CreateTaskDto dto);
    Task<Result<TaskResponseDto>> UpdateTaskAsync(int id, int userId, UpdateTaskDto dto);
    Task<Result<TaskResponseDto>> UpdateTaskStatusAsync(int id, int userId, UpdateTaskStatusDto dto);
    Task<Result<object>> DeleteTaskAsync(int id, int userId);
}
