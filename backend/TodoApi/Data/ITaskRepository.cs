using TodoApi.Models;

namespace TodoApi.Data;

public interface ITaskRepository
{
    Task<IEnumerable<TodoTask>> GetAllAsync(int userId);
    Task<PagedResult<TodoTask>> GetPagedAsync(int userId, int page, int pageSize);
    Task<TodoTask?> GetByIdAsync(int id, int userId);
    Task<TodoTask> CreateAsync(TodoTask task);
    Task<TodoTask?> UpdateAsync(int id, int userId, TodoTask task);
    Task<bool> DeleteAsync(int id, int userId);
}
