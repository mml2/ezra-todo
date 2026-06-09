using Microsoft.AspNetCore.Mvc;
using TodoApi.DTOs;
using TodoApi.Services;

namespace TodoApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _service;

    public TasksController(ITaskService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetTasks([FromQuery] int? page, [FromQuery] int? pageSize)
    {
        // If pagination parameters provided, use pagination
        if (page.HasValue && pageSize.HasValue)
        {
            var pagedResult = await _service.GetTasksPagedAsync(page.Value, pageSize.Value);

            if (!pagedResult.Success)
                return StatusCode(pagedResult.StatusCode, new { error = pagedResult.Error });

            return Ok(pagedResult.Data);
        }

        // Otherwise, return all tasks (backward compatible)
        var result = await _service.GetAllTasksAsync();
        return Ok(result.Data);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTask(int id)
    {
        var result = await _service.GetTaskByIdAsync(id);

        if (!result.Success)
            return StatusCode(result.StatusCode, new { error = result.Error });

        return Ok(result.Data);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto dto)
    {
        var result = await _service.CreateTaskAsync(dto);

        if (!result.Success)
            return StatusCode(result.StatusCode, new { error = result.Error });

        return StatusCode(result.StatusCode, result.Data);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdateTaskDto dto)
    {
        var result = await _service.UpdateTaskAsync(id, dto);

        if (!result.Success)
            return StatusCode(result.StatusCode, new { error = result.Error });

        return Ok(result.Data);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateTaskStatus(int id, [FromBody] UpdateTaskStatusDto dto)
    {
        var result = await _service.UpdateTaskStatusAsync(id, dto);

        if (!result.Success)
            return StatusCode(result.StatusCode, new { error = result.Error });

        return Ok(result.Data);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        var result = await _service.DeleteTaskAsync(id);

        if (!result.Success)
            return StatusCode(result.StatusCode, new { error = result.Error });

        return NoContent();
    }
}
