# Ezra Todo App - Project Guidelines

**Context:** This is a take-home assignment for a Full Stack Developer position. The assignment evaluates clean architecture, production-ready code, thoughtful decisions, and clear documentation.

## Core Philosophy

**Production MVP Mindset**: Strike the balance between minimal scaffolding and over-engineering. Show thoughtful production considerations without unnecessary complexity.

**TDD is mandatory**: Follow the global CLAUDE.md TDD requirements. Every line of production code responds to a failing test.

## Tech Stack Constraints

- **Backend**: .NET Core 8 (required by assignment)
- **Database**: SQLite with Entity Framework Core (required)
- **Frontend**: React with TypeScript (required)
- **Testing**: xUnit (backend), Vitest (frontend)

## Frontend Development Workflow

**IMPORTANT: Use the `frontend-design` skill for all React component development.**

When creating or modifying React components:
1. **Invoke the skill**: Use `/frontend-design` or `Skill tool: frontend-design`
2. **Provide context**: Describe the component purpose, user audience, and aesthetic direction
3. **Follow skill guidance**: Implement distinctive, production-grade UI with:
   - Bold typography choices (avoid generic fonts like Inter, Roboto)
   - Cohesive color schemes with CSS variables
   - Thoughtful animations and micro-interactions
   - Unique spatial composition and layouts
   - Contextual visual details and effects

**Aesthetic Philosophy:**
- Prioritize distinctive, memorable design over generic patterns
- Match implementation complexity to aesthetic vision
- Execute chosen direction (minimal or maximal) with precision
- Test all visual implementations for production quality

## .NET/C# Conventions

### Code Style
- PascalCase for classes, methods, properties, public fields
- camelCase for local variables, parameters, private fields
- Use `_` prefix for private fields: `_repository`, `_logger`
- Explicit access modifiers always: `public`, `private`, `internal`
- One class per file, filename matches class name
- Async methods end with `Async`: `GetTaskAsync()`

### Type Safety
- Nullable reference types enabled (`<Nullable>enable</Nullable>`)
- Use `?` for nullable types: `string?`, `DateTime?`
- Never use `var` where type is unclear
- Use `var` only when type is obvious from right side: `var tasks = new List<Task>()`

### Error Handling
- Use Result<T> pattern (not exceptions) for business logic failures
- Throw exceptions only for unexpected errors (system failures)
- Always validate inputs at API boundary
- Log all exceptions with context

### Immutability
- Prefer `readonly` for fields that don't change
- Use `required` keyword for properties that must be set
- Use records for DTOs: `public record CreateTaskDto(...)`
- Avoid in-place mutations; create new objects

### Async/Await
- Use async/await throughout (never `.Result` or `.Wait()`)
- Always return `Task<T>` or `Task` from async methods
- Use `ConfigureAwait(false)` in library code (not needed in ASP.NET Core)

### File Organization
- Controllers: API endpoints only, delegate to services
- Services: Business logic, return Result<T>
- Repositories: Data access only, work with entities
- DTOs: Request/response objects, use records
- Models: Domain entities (EF Core classes)
- Middleware: Cross-cutting concerns (logging, errors)

## Architecture Patterns

### Repository Pattern
```csharp
// Interface in domain layer
public interface ITaskRepository
{
    Task<TodoTask?> GetByIdAsync(int id);
    Task<IEnumerable<TodoTask>> GetAllAsync();
    Task<TodoTask> CreateAsync(TodoTask task);
    Task<TodoTask?> UpdateAsync(int id, TodoTask task);
    Task<bool> DeleteAsync(int id);
}

// Implementation with EF Core
public class TaskRepository : ITaskRepository
{
    private readonly TodoDbContext _context;

    public TaskRepository(TodoDbContext context)
    {
        _context = context;
    }

    // Implementation...
}
```

### Result Type Pattern
```csharp
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
```

Usage in services:
```csharp
public async Task<Result<TaskResponseDto>> GetTaskByIdAsync(int id)
{
    var task = await _repository.GetByIdAsync(id);

    if (task == null)
        return Result<TaskResponseDto>.Fail("Task not found", 404);

    if (task.IsDeleted)
        return Result<TaskResponseDto>.Fail("Task has been deleted", 410);

    var dto = MapToDto(task);
    return Result<TaskResponseDto>.Ok(dto);
}
```

### DTOs (Data Transfer Objects)
Use records for DTOs - immutable by default:

```csharp
// Request DTOs
public record CreateTaskDto(
    string Title,
    string? Description,
    TaskPriority Priority,
    DateTime? DueDate
);

public record UpdateTaskDto(
    string? Title,
    string? Description,
    TaskStatus? Status,
    TaskPriority? Priority,
    DateTime? DueDate
);

// Response DTOs
public record TaskResponseDto(
    int Id,
    string Title,
    string? Description,
    TaskStatus Status,
    TaskPriority Priority,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    DateTime? DueDate
);
```

### Soft Delete Pattern
```csharp
public class TodoTask
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Configure in DbContext
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TodoTask>()
            .HasQueryFilter(t => !t.IsDeleted); // Auto-filter deleted items
    }
}
```

## Testing Requirements

### TDD Workflow
1. **RED**: Write a failing test
2. **GREEN**: Write minimal code to pass
3. **REFACTOR**: Clean up while keeping tests green

### Backend Testing (xUnit)

**Test Naming**:
```csharp
public class TaskServiceTests
{
    [Fact]
    public async Task GetTaskByIdAsync_WithValidId_ReturnsTask()
    {
        // Arrange
        var mockRepo = new Mock<ITaskRepository>();
        mockRepo.Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(new TodoTask { Id = 1, Title = "Test" });
        var service = new TaskService(mockRepo.Object);

        // Act
        var result = await service.GetTaskByIdAsync(1);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal("Test", result.Data.Title);
    }

    [Fact]
    public async Task GetTaskByIdAsync_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var mockRepo = new Mock<ITaskRepository>();
        mockRepo.Setup(r => r.GetByIdAsync(999))
            .ReturnsAsync((TodoTask?)null);
        var service = new TaskService(mockRepo.Object);

        // Act
        var result = await service.GetTaskByIdAsync(999);

        // Assert
        Assert.False(result.Success);
        Assert.Equal(404, result.StatusCode);
    }
}
```

**Integration Tests**:
```csharp
public class TasksControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public TasksControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetTasks_ReturnsSuccessStatusCode()
    {
        var response = await _client.GetAsync("/api/tasks");
        response.EnsureSuccessStatusCode();
    }
}
```

### Frontend Testing (Vitest + RTL)

**Component Tests**:
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TaskItem from './TaskItem'

describe('TaskItem', () => {
  it('renders task title', () => {
    const task = { id: 1, title: 'Test Task', status: 'Todo' }
    render(<TaskItem task={task} />)

    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('applies correct status styling', () => {
    const task = { id: 1, title: 'Done Task', status: 'Done' }
    render(<TaskItem task={task} />)

    const element = screen.getByText('Done Task')
    expect(element).toHaveClass('line-through')
  })
})
```

### Code Coverage Requirements

**CRITICAL: 90% Minimum Coverage - MANDATORY**

Every code update MUST maintain **90% code coverage** for both backend and frontend.

**Enforcement Rules:**
1. **Write tests BEFORE production code** (TDD mandatory)
2. **Run coverage check BEFORE committing**:
   ```bash
   # Backend
   cd backend
   dotnet test --collect:"XPlat Code Coverage"

   # Frontend
   cd frontend
   npm run test:coverage
   ```
3. **Block commits if coverage drops below 90%**
4. **New features require corresponding tests** - no exceptions
5. **Bug fixes require regression tests**

**Coverage Scope:**
- **Line Coverage**: 90%+ (primary metric)
- **Branch Coverage**: 85%+ (secondary metric)
- **Service Layer**: 95%+ (critical business logic)
- **Controller Layer**: 90%+ (API endpoints)
- **Repository Layer**: 90%+ (data access)

**What to Test:**
- ✅ All business logic paths
- ✅ Validation rules (happy path + edge cases)
- ✅ Error handling scenarios
- ✅ Enum validation (Status, Priority)
- ✅ Null/empty input handling
- ✅ Boundary conditions (max length, min/max values)
- ✅ Integration points (API endpoints)

**What Can Be Excluded:**
- ❌ Auto-generated code
- ❌ Simple DTOs (records with no logic)
- ❌ Configuration files
- ❌ Database migrations

**Coverage Verification:**

```bash
# Generate coverage report
./run-coverage.sh

# Or manually:
cd backend
dotnet test --collect:"XPlat Code Coverage" \
  --results-directory:"./TestResults"

# View coverage (requires reportgenerator)
dotnet tool install -g dotnet-reportgenerator-globaltool
reportgenerator \
  -reports:"./TestResults/**/coverage.cobertura.xml" \
  -targetdir:"./CoverageReport" \
  -reporttypes:Html
open CoverageReport/index.html
```

**Pre-Commit Checklist:**
1. ✅ All tests pass (green)
2. ✅ Coverage >= 90% (verify with report)
3. ✅ No new warnings or errors
4. ✅ Code builds successfully

**If Coverage Drops Below 90%:**
1. Identify uncovered lines in coverage report
2. Write missing tests (unit + integration)
3. Verify coverage meets 90% threshold
4. Only then commit changes

## Validation

### Backend (FluentValidation)
```csharp
public class CreateTaskDtoValidator : AbstractValidator<CreateTaskDto>
{
    public CreateTaskDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters");

        RuleFor(x => x.DueDate)
            .GreaterThan(DateTime.UtcNow).WithMessage("Due date must be in the future")
            .When(x => x.DueDate.HasValue);

        RuleFor(x => x.Priority)
            .IsInEnum().WithMessage("Invalid priority value");
    }
}
```

### Frontend (Zod)
```typescript
import { z } from 'zod'

export const createTaskSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters'),
  description: z.string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  priority: z.enum(['Low', 'Medium', 'High']),
  dueDate: z.date()
    .refine(date => date > new Date(), 'Due date must be in the future')
    .optional(),
})

export type CreateTaskDto = z.infer<typeof createTaskSchema>
```

## Logging (Serilog)

### Configuration
```csharp
builder.Host.UseSerilog((context, configuration) =>
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .WriteTo.Console()
        .WriteTo.File("logs/log-.txt", rollingInterval: RollingInterval.Day)
        .Enrich.FromLogContext()
);
```

### Usage
```csharp
public class TaskService
{
    private readonly ILogger<TaskService> _logger;

    public async Task<Result<TaskResponseDto>> CreateTaskAsync(CreateTaskDto dto)
    {
        _logger.LogInformation("Creating task with title: {Title}", dto.Title);

        try
        {
            var task = await _repository.CreateAsync(MapToEntity(dto));
            _logger.LogInformation("Task created successfully with ID: {TaskId}", task.Id);
            return Result<TaskResponseDto>.Ok(MapToDto(task));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating task with title: {Title}", dto.Title);
            return Result<TaskResponseDto>.Fail("Failed to create task", 500);
        }
    }
}
```

## Security Checklist

### Backend
- ✅ FluentValidation on all inputs
- ✅ EF Core parameterized queries (automatic)
- ✅ CORS configured for frontend origin only
- ✅ Rate limiting on endpoints
- ✅ No sensitive data in logs
- ✅ Global exception handler (no stack traces to client)
- ✅ HTTPS only (production)

### Frontend
- ✅ Zod validation before API calls
- ✅ React auto-escapes JSX (XSS prevention)
- ✅ Validate API responses with Zod
- ✅ Environment variables for API URL
- ✅ No sensitive data in localStorage

## Database

### Entity Configuration
```csharp
public class TodoDbContext : DbContext
{
    public DbSet<TodoTask> Tasks { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TodoTask>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Title)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Description)
                .HasMaxLength(1000);

            entity.Property(e => e.Status)
                .HasConversion<string>(); // Store enum as string

            entity.Property(e => e.Priority)
                .HasConversion<string>();

            entity.HasQueryFilter(e => !e.IsDeleted); // Soft delete filter

            entity.HasIndex(e => e.Status); // Index for filtering
            entity.HasIndex(e => e.CreatedAt);
        });
    }
}
```

### Migrations
```bash
# Create migration
dotnet ef migrations add InitialCreate

# Apply migration
dotnet ef database update

# Remove last migration (if not applied)
dotnet ef migrations remove
```

## API Design

### REST Conventions
- `GET /api/tasks` - List (200)
- `GET /api/tasks/{id}` - Get one (200, 404)
- `POST /api/tasks` - Create (201, 400)
- `PUT /api/tasks/{id}` - Update (200, 400, 404)
- `DELETE /api/tasks/{id}` - Delete (204, 404)
- `PATCH /api/tasks/{id}/status` - Partial update (200, 400, 404)

### Response Format
```csharp
// Success
{
  "id": 1,
  "title": "Buy groceries",
  "status": "Todo",
  "priority": "High",
  "createdAt": "2026-06-06T10:00:00Z"
}

// Error
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Task not found",
  "traceId": "00-123..."
}
```

## Common Pitfalls to Avoid

### ❌ Don't
- Over-engineer with unnecessary patterns
- Add features not required by assignment
- Skip tests ("I'll add them later")
- Use `var` everywhere without considering readability
- Catch exceptions and swallow them silently
- Return `null` - use Result<T> or NotFound()
- Hard-code configuration values
- Use magic numbers/strings

### ✅ Do
- Focus on the requirements
- Write tests first (TDD)
- Keep controllers thin, services focused
- Use dependency injection
- Log appropriately (info, warning, error)
- Handle edge cases
- Document non-obvious decisions
- Make intentional trade-offs

## Documentation Requirements

### Code Comments
Only comment WHY, not WHAT:
```csharp
// ❌ Bad: Obvious what it does
// Get task by ID
var task = await _repository.GetByIdAsync(id);

// ✅ Good: Explains WHY
// Using IgnoreQueryFilters to retrieve soft-deleted tasks for admin audit
var task = await _context.Tasks.IgnoreQueryFilters()
    .FirstOrDefaultAsync(t => t.Id == id);
```

### README Requirements
- Setup instructions (backend & frontend)
- How to run tests
- API documentation (or link to Swagger)
- Architecture decisions
- Trade-offs made
- Future improvements
- Production considerations

## Production Readiness

### Must Have (MVP)
- ✅ All CRUD operations work
- ✅ Input validation
- ✅ Error handling
- ✅ Logging
- ✅ Tests (80%+ coverage)
- ✅ API documentation (Swagger)
- ✅ Health check endpoint
- ✅ CORS configured
- ✅ Soft deletes

### Nice to Have (Beyond Scope)
- Authentication/authorization
- Pagination
- Real-time updates
- Caching
- Background jobs
- Docker containerization
- CI/CD pipeline

## Git Workflow

### Commit Messages
```
feat: add task creation endpoint
fix: handle null description in task update
test: add integration tests for task deletion
refactor: extract validation into FluentValidation
docs: update API documentation
```

### Before Committing
1. All tests pass: `dotnet test` && `npm test`
2. Code builds: `dotnet build` && `npm run build`
3. No linting errors
4. README updated if needed

## Assignment-Specific Notes

**What They're Evaluating:**
1. Clean, well-structured code
2. Thoughtful architectural decisions
3. Good frontend/backend communication
4. Production-ready features
5. Clear documentation

**Show Your Thinking:**
- Explain trade-offs in README
- Document assumptions
- Note what you'd add with more time
- Demonstrate production mindset without over-engineering

**The Sweet Spot:**
- Not minimal scaffolding with no thought
- Not over-architected with unnecessary complexity
- Production-minded MVP with intentional decisions
