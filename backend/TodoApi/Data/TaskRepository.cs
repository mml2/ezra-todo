using Microsoft.EntityFrameworkCore;
using TodoApi.Models;

namespace TodoApi.Data;

public class TaskRepository : ITaskRepository
{
    private readonly TodoDbContext _context;

    public TaskRepository(TodoDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TodoTask>> GetAllAsync()
    {
        return await _context.Tasks
            .AsNoTracking()
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<PagedResult<TodoTask>> GetPagedAsync(int page, int pageSize)
    {
        var countTask = _context.Tasks.CountAsync();
        var itemsTask = _context.Tasks
            .AsNoTracking()
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        await Task.WhenAll(countTask, itemsTask);

        return new PagedResult<TodoTask>
        {
            Items = itemsTask.Result,
            TotalCount = countTask.Result,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<TodoTask?> GetByIdAsync(int id)
    {
        return await _context.Tasks
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<TodoTask> CreateAsync(TodoTask task)
    {
        task.CreatedAt = DateTime.UtcNow;
        task.IsDeleted = false;

        await _context.Tasks.AddAsync(task);
        await _context.SaveChangesAsync();

        return task;
    }

    public async Task<TodoTask?> UpdateAsync(int id, TodoTask task)
    {
        var existingTask = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == id);

        if (existingTask == null)
        {
            return null;
        }

        existingTask.Title = task.Title;
        existingTask.Description = task.Description;
        existingTask.Status = task.Status;
        existingTask.Priority = task.Priority;
        existingTask.DueDate = task.DueDate;
        existingTask.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return existingTask;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task == null)
        {
            return false;
        }

        task.IsDeleted = true;
        await _context.SaveChangesAsync();

        return true;
    }
}
