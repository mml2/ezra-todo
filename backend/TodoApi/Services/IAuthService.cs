using TodoApi.DTOs;
using TodoApi.Models;

namespace TodoApi.Services;

public interface IAuthService
{
    Task<Result<AuthResponseDto>> LoginAsync(LoginDto dto);
}
