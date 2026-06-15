using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using TodoApi.Data;
using TodoApi.DTOs;
using TodoApi.Models;
using TodoApi.Services;
using Xunit;

namespace TodoApi.Tests.Services;

public class AuthServiceTests : IDisposable
{
    private readonly TodoDbContext _context;
    private readonly IAuthService _authService;
    private readonly ITokenService _tokenService;
    private readonly PasswordHasher<User> _passwordHasher;

    public AuthServiceTests()
    {
        // Create a unique in-memory SQLite database per test
        var dbPath = Path.Combine(Path.GetTempPath(), $"test_{Guid.NewGuid()}.db");
        var optionsBuilder = new DbContextOptionsBuilder<TodoDbContext>()
            .UseSqlite($"Data Source={dbPath}");

        _context = new TodoDbContext(optionsBuilder.Options);
        _context.Database.EnsureCreated();

        // Set up configuration for token service
        var configDict = new Dictionary<string, string?>
        {
            { "Jwt:Key", "test-signing-key-at-least-32-bytes-long-1234" },
            { "Jwt:Issuer", "test-issuer" },
            { "Jwt:Audience", "test-audience" },
            { "Jwt:ExpiryMinutes", "60" }
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configDict)
            .Build();

        _tokenService = new TokenService(configuration);
        _passwordHasher = new PasswordHasher<User>();
        _authService = new AuthService(_context, _tokenService, _passwordHasher, Mock.Of<ILogger<AuthService>>());

        // Clear any seeded users
        _context.Users.RemoveRange(_context.Users);
        _context.SaveChanges();

        // Seed a test user
        var testUser = new User { Id = 1, Username = "alice", CreatedAt = DateTime.UtcNow };
        testUser.PasswordHash = _passwordHasher.HashPassword(testUser, "Password123!");
        _context.Users.Add(testUser);
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context?.Dispose();
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsSuccessWithToken()
    {
        // Arrange
        var dto = new LoginDto("alice", "Password123!");

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Data);
        Assert.NotEmpty(result.Data.Token);
        Assert.Equal("alice", result.Data.Username);
    }

    [Fact]
    public async Task LoginAsync_WithWrongPassword_ReturnsFailure401WithGenericMessage()
    {
        // Arrange
        var dto = new LoginDto("alice", "WrongPassword");

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        Assert.False(result.Success);
        Assert.Equal(401, result.StatusCode);
        Assert.Equal("Invalid username or password", result.Error);
    }

    [Fact]
    public async Task LoginAsync_WithUnknownUsername_ReturnsFailure401WithSameGenericMessage()
    {
        // Arrange
        var dto = new LoginDto("unknown", "Password123!");

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        Assert.False(result.Success);
        Assert.Equal(401, result.StatusCode);
        // Must be identical to wrong password message (no user enumeration)
        Assert.Equal("Invalid username or password", result.Error);
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_GeneratesNonEmptyToken()
    {
        // Arrange
        var dto = new LoginDto("alice", "Password123!");

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.NotEmpty(result.Data.Token);
        Assert.True(result.Data.ExpiresAt > DateTime.UtcNow);
    }
}
