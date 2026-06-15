using PrReviewAgent.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSingleton<WebhookSignatureValidator>();
builder.Services.AddSingleton<GitHubService>();
builder.Services.AddHttpClient<ClaudeReviewService>();

var app = builder.Build();

app.UseRouting();
app.MapControllers();

// Health check
app.MapGet("/health", () => Results.Ok(new { status = "ok", timestamp = DateTime.UtcNow }));

app.Run();
