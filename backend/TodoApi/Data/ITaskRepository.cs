using TodoApi.Models;

namespace TodoApi.Data;

public interface ITaskRepository
{
    Task<IEnumerable<TodoTask>> GetAllAsync();
    Task<PagedResult<TodoTask>> GetPagedAsync(int page, int pageSize);
    Task<TodoTask?> GetByIdAsync(int id);
    Task<TodoTask> CreateAsync(TodoTask task);
    Task<TodoTask?> UpdateAsync(int id, TodoTask task);
    Task<bool> DeleteAsync(int id);
}
