using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Threading.RateLimiting;
using Serilog;
using TodoApi.Data;
using TodoApi.Models;
using TodoApi.Services;
using TodoApi.Validators;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
builder.Host.UseSerilog((context, configuration) =>
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .WriteTo.Console()
        .WriteTo.File("logs/log-.txt", rollingInterval: RollingInterval.Day)
        .Enrich.FromLogContext());

// Add services to the container
builder.Services.AddDbContext<TodoDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=todoapp.db"));

builder.Services.AddScoped<ITaskRepository, TaskRepository>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<PasswordHasher<User>>();

// Fail fast if the JWT signing key is missing or too weak. The key is never
// committed in the base appsettings — it comes from appsettings.Development.json
// (dev) or a secrets manager / environment variable (production). HMAC-SHA256
// requires at least 256 bits (32 bytes) of key material to be secure.
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(jwtKey) || Encoding.UTF8.GetByteCount(jwtKey) < 32)
{
    throw new InvalidOperationException(
        "Jwt:Key is missing or shorter than 32 bytes. Configure a strong signing key " +
        "via appsettings.Development.json (development) or an environment variable / " +
        "secrets manager (production).");
}

// Add JWT bearer authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwt = builder.Configuration.GetSection("Jwt");
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwt["Audience"],
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero
        };
    });
builder.Services.AddAuthorization();

// Add FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<CreateTaskDtoValidator>();

// Add controllers with JSON options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// Health checks (liveness). A DB-readiness probe is noted as a production
// enhancement in docs/PRODUCTIONIZATION.md.
builder.Services.AddHealthChecks();

// The API contract is the hand-written spec at backend/openapi.yaml (consumed by
// clients / served as static content). A runtime Swagger UI is intentionally not
// wired up — see the README "API Reference" section.

// Add rate limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("api", limiterOptions =>
    {
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.PermitLimit = 100;
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 0;
    });
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Apply migrations and seed database
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<TodoDbContext>();
    try
    {
        await dbContext.Database.MigrateAsync();
    }
    catch (Exception ex)
    {
        // Log migration errors but don't fail startup
        // This can happen if migrations are in an invalid state
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Failed to apply migrations");
    }
}

// Configure the HTTP request pipeline
app.UseExceptionHandler("/error");

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
    app.UseHsts();
}
else
{
    app.UseDeveloperExceptionPage();
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.UseRateLimiter();

app.MapControllers().RequireRateLimiting("api");

// Anonymous, unthrottled health endpoint for load balancers / orchestrators
app.MapHealthChecks("/health").AllowAnonymous();

app.Map("/error", (HttpContext context) =>
    Results.Problem(statusCode: context.Response.StatusCode));

app.Run();

// Make Program class visible to tests
public partial class Program { }
