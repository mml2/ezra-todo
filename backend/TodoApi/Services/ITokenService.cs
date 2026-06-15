using TodoApi.DTOs;
using TodoApi.Models;

namespace TodoApi.Services;

public interface ITokenService
{
    AuthResponseDto GenerateToken(User user);
}
