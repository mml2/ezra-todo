namespace TodoApi.DTOs;

public record AuthResponseDto(string Token, DateTime ExpiresAt, string Username);
