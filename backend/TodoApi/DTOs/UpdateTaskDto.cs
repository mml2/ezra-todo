using TodoApi.Models;
using TaskStatus = TodoApi.Models.TaskStatus;

namespace TodoApi.DTOs;

public record UpdateTaskDto(
    string? Title,
    string? Description,
    TaskStatus? Status,
    TaskPriority? Priority,
    DateTime? DueDate
);
