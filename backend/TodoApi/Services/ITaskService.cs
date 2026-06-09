using TodoApi.DTOs;
using TodoApi.Models;

namespace TodoApi.Services;

public interface ITaskService
{
    Task<Result<IEnumerable<TaskResponseDto>>> GetAllTasksAsync();
    Task<Result<PagedResult<TaskResponseDto>>> GetTasksPagedAsync(int page, int pageSize);
    Task<Result<TaskResponseDto>> GetTaskByIdAsync(int id);
    Task<Result<TaskResponseDto>> CreateTaskAsync(CreateTaskDto dto);
    Task<Result<TaskResponseDto>> UpdateTaskAsync(int id, UpdateTaskDto dto);
    Task<Result<TaskResponseDto>> UpdateTaskStatusAsync(int id, UpdateTaskStatusDto dto);
    Task<Result<object>> DeleteTaskAsync(int id);
}
