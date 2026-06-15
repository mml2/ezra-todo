using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TodoApi.DTOs;
using TodoApi.Services;

namespace TodoApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _service;
    private readonly IValidator<CreateTaskDto> _createTaskValidator;
    private readonly IValidator<UpdateTaskDto> _updateTaskValidator;
    private readonly IValidator<UpdateTaskStatusDto> _updateTaskStatusValidator;

    public TasksController(
        ITaskService service,
        IValidator<CreateTaskDto> createTaskValidator,
        IValidator<UpdateTaskDto> updateTaskValidator,
        IValidator<UpdateTaskStatusDto> updateTaskStatusValidator)
    {
        _service = service;
        _createTaskValidator = createTaskValidator;
        _updateTaskValidator = updateTaskValidator;
        _updateTaskStatusValidator = updateTaskStatusValidator;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("Missing user id claim"));


    [HttpGet]
    public async Task<IActionResult> GetTasks([FromQuery] int? page, [FromQuery] int? pageSize)
    {
        var userId = GetUserId();

        // If pagination parameters provided, use pagination
        if (page.HasValue && pageSize.HasValue)
        {
            var pagedResult = await _service.GetTasksPagedAsync(userId, page.Value, pageSize.Value);

            if (!pagedResult.Success)
                return StatusCode(pagedResult.StatusCode, new { error = pagedResult.Error });

            return Ok(pagedResult.Data);
        }

        // Otherwise, return all tasks (backward compatible)
        var result = await _service.GetAllTasksAsync(userId);
        return Ok(result.Data);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTask(int id)
    {
        var userId = GetUserId();
        var result = await _service.GetTaskByIdAsync(id, userId);

        if (!result.Success)
            return StatusCode(result.StatusCode, new { error = result.Error });

        return Ok(result.Data);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto dto)
    {
        // Validate input
        var validationResult = await _createTaskValidator.ValidateAsync(dto);
        if (!validationResult.IsValid)
            return ValidationError(validationResult);

        var userId = GetUserId();
        var result = await _service.CreateTaskAsync(userId, dto);

        if (!result.Success)
            return StatusCode(result.StatusCode, new { error = result.Error });

        // 201 Created with Location header pointing at the new resource (REST convention)
        var data = result.Data ?? throw new InvalidOperationException("CreateTaskAsync returned success with null data.");
        return CreatedAtAction(nameof(GetTask), new { id = data.Id }, data);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdateTaskDto dto)
    {
        // Validate input
        var validationResult = await _updateTaskValidator.ValidateAsync(dto);
        if (!validationResult.IsValid)
            return ValidationError(validationResult);

        var userId = GetUserId();
        var result = await _service.UpdateTaskAsync(id, userId, dto);

        if (!result.Success)
            return StatusCode(result.StatusCode, new { error = result.Error });

        return Ok(result.Data);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateTaskStatus(int id, [FromBody] UpdateTaskStatusDto dto)
    {
        // Validate input
        var validationResult = await _updateTaskStatusValidator.ValidateAsync(dto);
        if (!validationResult.IsValid)
            return ValidationError(validationResult);

        var userId = GetUserId();
        var result = await _service.UpdateTaskStatusAsync(id, userId, dto);

        if (!result.Success)
            return StatusCode(result.StatusCode, new { error = result.Error });

        return Ok(result.Data);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        var userId = GetUserId();
        var result = await _service.DeleteTaskAsync(id, userId);

        if (!result.Success)
            return StatusCode(result.StatusCode, new { error = result.Error });

        return NoContent();
    }

    private static IActionResult ValidationError(FluentValidation.Results.ValidationResult result) =>
        new BadRequestObjectResult(new { errors = result.ToDictionary() });
}
