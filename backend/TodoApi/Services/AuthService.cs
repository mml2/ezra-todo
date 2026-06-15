using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TodoApi.Data;
using TodoApi.DTOs;
using TodoApi.Models;

namespace TodoApi.Services;

public class AuthService : IAuthService
{
    private readonly TodoDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly PasswordHasher<User> _passwordHasher;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        TodoDbContext context,
        ITokenService tokenService,
        PasswordHasher<User> passwordHasher,
        ILogger<AuthService> logger)
    {
        _context = context;
        _tokenService = tokenService;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task<Result<AuthResponseDto>> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Username == dto.Username);

        // Verify password (or fail with generic message if user not found)
        if (user == null)
        {
            _logger.LogWarning("Failed login attempt for unknown username");
            return Result<AuthResponseDto>.Fail("Invalid username or password", 401);
        }

        var passwordResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);

        if (passwordResult == PasswordVerificationResult.Failed)
        {
            _logger.LogWarning("Failed login attempt for user {Username}", user.Username);
            return Result<AuthResponseDto>.Fail("Invalid username or password", 401);
        }

        var token = _tokenService.GenerateToken(user);
        _logger.LogInformation("User {Username} logged in successfully", user.Username);

        return Result<AuthResponseDto>.Ok(token);
    }
}
