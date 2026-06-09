using TaskStatus = TodoApi.Models.TaskStatus;

namespace TodoApi.DTOs;

public record UpdateTaskStatusDto(
    TaskStatus Status
);
