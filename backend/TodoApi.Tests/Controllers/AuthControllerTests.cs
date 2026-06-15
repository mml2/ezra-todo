using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using TodoApi.DTOs;
using Xunit;

namespace TodoApi.Tests.Controllers;

public class AuthControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public AuthControllerTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PostLogin_WithValidCredentials_ReturnsOkWithToken()
    {
        // Arrange
        var loginDto = new LoginDto("alice", "Password123!");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginDto);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var jsonContent = await response.Content.ReadAsStringAsync();
        var content = System.Text.Json.JsonSerializer.Deserialize<AuthResponseDto>(
            jsonContent,
            new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase }
        );
        Assert.NotNull(content);
        Assert.NotEmpty(content.Token);
        Assert.Equal("alice", content.Username);
        Assert.True(content.ExpiresAt > DateTime.UtcNow);
    }

    [Fact]
    public async Task PostLogin_WithWrongPassword_ReturnsBadRequest401()
    {
        // Arrange
        var loginDto = new LoginDto("alice", "WrongPassword");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginDto);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task PostLogin_WithUnknownUsername_ReturnsBadRequest401()
    {
        // Arrange
        var loginDto = new LoginDto("nonexistent", "Password123!");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginDto);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task PostLogin_WithEmptyUsername_ReturnsBadRequest400()
    {
        // Arrange
        var loginDto = new LoginDto("", "Password123!");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginDto);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostLogin_WithEmptyPassword_ReturnsBadRequest400()
    {
        // Arrange
        var loginDto = new LoginDto("alice", "");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginDto);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostLogin_WithBobCredentials_ReturnsOkWithToken()
    {
        // Arrange
        var loginDto = new LoginDto("bob", "Password123!");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginDto);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var jsonContent = await response.Content.ReadAsStringAsync();
        var content = System.Text.Json.JsonSerializer.Deserialize<AuthResponseDto>(
            jsonContent,
            new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase }
        );
        Assert.NotNull(content);
        Assert.NotEmpty(content.Token);
        Assert.Equal("bob", content.Username);
    }
}
