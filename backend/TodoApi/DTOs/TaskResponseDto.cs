using TodoApi.Models;
using TaskStatus = TodoApi.Models.TaskStatus;

namespace TodoApi.DTOs;

public record TaskResponseDto(
    int Id,
    string Title,
    string? Description,
    TaskStatus Status,
    TaskPriority Priority,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    DateTime? DueDate
);
