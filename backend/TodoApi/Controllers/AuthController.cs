using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TodoApi.DTOs;
using TodoApi.Services;

namespace TodoApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IValidator<LoginDto> _loginValidator;

    public AuthController(IAuthService authService, IValidator<LoginDto> loginValidator)
    {
        _authService = authService;
        _loginValidator = loginValidator;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        // Validate input
        var validationResult = await _loginValidator.ValidateAsync(dto);
        if (!validationResult.IsValid)
            return ValidationError(validationResult);

        var result = await _authService.LoginAsync(dto);

        if (!result.Success)
            return StatusCode(result.StatusCode, new { error = result.Error });

        return Ok(result.Data);
    }

    private static IActionResult ValidationError(FluentValidation.Results.ValidationResult result) =>
        new BadRequestObjectResult(new { errors = result.ToDictionary() });
}
