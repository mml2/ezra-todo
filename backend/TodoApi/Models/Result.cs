namespace TodoApi.Models;

public class Result<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public string? Error { get; init; }
    public int StatusCode { get; init; }

    public static Result<T> Ok(T data) => new()
    {
        Success = true,
        Data = data,
        StatusCode = 200
    };

    public static Result<T> Fail(string error, int statusCode = 400) => new()
    {
        Success = false,
        Error = error,
        StatusCode = statusCode
    };
}
