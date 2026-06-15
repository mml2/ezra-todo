using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using TodoApi.Models;
using TodoApi.Services;
using Xunit;

namespace TodoApi.Tests.Services;

public class TokenServiceTests
{
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;

    public TokenServiceTests()
    {
        var configDict = new Dictionary<string, string?>
        {
            { "Jwt:Key", "test-signing-key-at-least-32-bytes-long-1234" },
            { "Jwt:Issuer", "test-issuer" },
            { "Jwt:Audience", "test-audience" },
            { "Jwt:ExpiryMinutes", "60" }
        };
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configDict)
            .Build();
        _tokenService = new TokenService(_configuration);
    }

    [Fact]
    public void GenerateToken_WithValidUser_ReturnsNonEmptyToken()
    {
        // Arrange
        var user = new User { Id = 1, Username = "testuser", PasswordHash = "" };

        // Act
        var response = _tokenService.GenerateToken(user);

        // Assert
        Assert.NotEmpty(response.Token);
        Assert.True(response.ExpiresAt > DateTime.UtcNow);
    }

    [Fact]
    public void GenerateToken_WithValidUser_TokenDecodesSuccessfully()
    {
        // Arrange
        var user = new User { Id = 42, Username = "alice", PasswordHash = "" };

        // Act
        var response = _tokenService.GenerateToken(user);
        var handler = new JwtSecurityTokenHandler();
        var token = handler.ReadJwtToken(response.Token);

        // Assert
        Assert.NotNull(token);
        var subClaim = token.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub);
        Assert.NotNull(subClaim);
        Assert.Equal("42", subClaim.Value);

        var nameClaim = token.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Name);
        Assert.NotNull(nameClaim);
        Assert.Equal("alice", nameClaim.Value);

        var nameIdClaim = token.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
        Assert.NotNull(nameIdClaim);
        Assert.Equal("42", nameIdClaim.Value);
    }

    [Fact]
    public void GenerateToken_ExpiryIsApproximatelyOneHour()
    {
        // Arrange
        var user = new User { Id = 1, Username = "testuser", PasswordHash = "" };
        var nowBefore = DateTime.UtcNow;

        // Act
        var response = _tokenService.GenerateToken(user);
        var nowAfter = DateTime.UtcNow;

        // Assert
        var expectedExpiry = nowBefore.AddMinutes(60);
        var tolerance = TimeSpan.FromSeconds(5);
        Assert.InRange(response.ExpiresAt, expectedExpiry - tolerance, expectedExpiry + tolerance);
    }
}
