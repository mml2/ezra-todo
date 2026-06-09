using TodoApi.Models;

namespace TodoApi.DTOs;

public record CreateTaskDto(
    string Title,
    string? Description,
    TaskPriority Priority,
    DateTime? DueDate
);
