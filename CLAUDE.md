# Ezra Todo App - Project Guidelines

**Context:** This is a take-home assignment for a Full Stack Developer position. The assignment evaluates clean architecture, production-ready code, thoughtful decisions, and clear documentation.

## Table of Contents

### Getting Started
- [Core Philosophy](#core-philosophy)
- [Tech Stack Constraints](#tech-stack-constraints)

### Frontend Development
- [Frontend Development Workflow](#frontend-development-workflow)
- [Frontend Design System](#frontend-design-system)
  - [Design Philosophy](#design-philosophy)
  - [Typography System](#typography-system)
  - [Color Palette](#color-palette)
  - [Component Patterns](#component-patterns)
  - [Animation System](#animation-system)
  - [Layout Principles](#layout-principles)
  - [Background Texture](#background-texture)
  - [Implementation Notes](#implementation-notes)
- [React Query Configuration](#react-query-configuration)
  - [Query Client Setup](#query-client-setup)
  - [Query Key Structure](#query-key-structure)
  - [Custom Hooks Pattern](#custom-hooks-pattern)
  - [Usage in Components](#usage-in-components)
  - [Cache Invalidation Strategy](#cache-invalidation-strategy)
- [Frontend Testing (Vitest + RTL)](#frontend-testing-vitest--rtl)
- [Frontend Validation (Zod)](#frontend-zod)

### Backend Development
- [.NET/C# Conventions](#netc-conventions)
  - [Code Style](#code-style)
  - [Type Safety](#type-safety)
  - [Error Handling](#error-handling)
  - [Immutability](#immutability)
  - [Async/Await](#asyncawait)
  - [File Organization](#file-organization)
- [Architecture Patterns](#architecture-patterns)
  - [Repository Pattern](#repository-pattern)
  - [Result Type Pattern](#result-type-pattern)
  - [DTOs (Data Transfer Objects)](#dtos-data-transfer-objects)
  - [Soft Delete Pattern](#soft-delete-pattern)
- [Backend Validation (FluentValidation)](#backend-fluentvalidation)
- [Logging (Serilog)](#logging-serilog)
  - [Configuration](#configuration)
  - [Usage](#usage)
- [Database](#database)
  - [Entity Configuration](#entity-configuration)
  - [Migrations](#migrations)
- [Backend Testing (xUnit)](#backend-testing-xunit)

### Cross-Cutting Concerns
- [Testing Requirements](#testing-requirements)
  - [TDD Workflow](#tdd-workflow)
  - [Code Coverage Requirements](#code-coverage-requirements)
- [Security Checklist](#security-checklist)
  - [Backend Security](#backend-security)
  - [Frontend Security](#frontend-security)
  - [Common Security Pitfalls](#common-security-pitfalls)
- [API Design](#api-design)
  - [REST Conventions](#rest-conventions)
  - [Response Format](#response-format)

### Best Practices & Guidelines
- [Common Pitfalls to Avoid](#common-pitfalls-to-avoid)
- [Documentation Requirements](#documentation-requirements)
  - [Code Comments](#code-comments)
  - [README Requirements](#readme-requirements)
- [Production Readiness](#production-readiness)
  - [Must Have (MVP)](#must-have-mvp)
  - [Nice to Have (Beyond Scope)](#nice-to-have-beyond-scope)
  - [Performance Benchmarks](#performance-benchmarks)
- [Architecture Decision Records (ADRs)](#architecture-decision-records-adrs)
  - [ADR-001: SQLite for Database](#adr-001-sqlite-for-database)
  - [ADR-002: Soft Delete Pattern](#adr-002-soft-delete-pattern)
  - [ADR-003: Result<T> Pattern](#adr-003-resultt-pattern-for-error-handling)
  - [ADR-004: Editorial Precision Design](#adr-004-editorial-precision-design-system)
  - [ADR-005: React Query](#adr-005-react-query-for-state-management)
  - [ADR-006: 90% Code Coverage](#adr-006-90-code-coverage-requirement)
- [Git Configuration](#git-configuration)
  - [.gitignore Setup](#gitignore-setup)
- [Git Workflow](#git-workflow)
  - [Commit Messages](#commit-messages)
  - [Before Committing](#before-committing)

### Reference
- [Troubleshooting](#troubleshooting)
  - [Backend Issues](#backend-issues)
  - [Frontend Issues](#frontend-issues)
  - [Common Errors](#common-errors)
  - [Performance Issues](#performance-issues)
  - [Debugging Tools](#debugging-tools)
- [Historical Context: Original Assignment](#historical-context-original-assignment)

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

## Frontend Design System

**Editorial Precision Design System** - A distinctive, publication-quality interface inspired by editorial design principles.

### Design Philosophy

- **Refined Typography**: Serif headings (Fraunces) paired with clean sans-serif body (DM Sans)
- **Warm Monochrome**: Cream backgrounds with ink-dark text, amber accent color
- **Card-Based Layouts**: Horizontal cards with priority-colored accent bars
- **Subtle Motion**: Staggered entrance animations, smooth transitions
- **Publication Quality**: Generous spacing, uppercase tracked labels, editorial-style composition

### Typography System

```css
/* Primary Fonts (loaded from Google Fonts) */
--font-serif: 'Fraunces', serif;      /* Headings, emphasis */
--font-sans: 'DM Sans', sans-serif;    /* Body, UI elements */

/* Type Scale */
- Large headings: 3rem (48px) serif, bold
- Section headings: 1.5rem (24px) serif, semibold
- Body text: 0.9375rem (15px) sans-serif
- Labels: 0.6875rem (11px) uppercase, tracked (0.1em)
- Small text: 0.8125rem (13px)
```

### Color Palette

```css
/* CSS Variables (defined in index.css) */
--color-ink: #1a1a1a;           /* Primary text, dark elements */
--color-paper: #f8f6f3;         /* Background, warm cream */
--color-mist: #e8e6e3;          /* Subtle borders, dividers */
--color-amber: #d97706;         /* Primary accent, CTAs */
--color-amber-dark: #b45309;    /* Hover states */
--color-ruby: #dc2626;          /* Error states */
--color-sage: #059669;          /* Success states */

/* Priority Colors (for accent bars) */
--priority-low: #6b7280;        /* Gray */
--priority-medium: #d97706;     /* Amber */
--priority-high: #dc2626;       /* Ruby */
```

### Component Patterns

#### Editorial Card
```css
.editorial-card {
  background: white;
  border: 1px solid var(--color-mist);
  border-radius: 0;              /* Sharp corners */
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  transition: all 0.2s ease;
}

.editorial-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  transform: translateY(-2px);
}
```

#### Priority Accent Bar
```tsx
/* Left border colored by priority */
<div className="absolute top-0 left-0 w-1 h-full"
     style={{ background: priorityColors[task.priority] }} />
```

#### Uppercase Labels
```tsx
/* Tracked, uppercase labels with required asterisk */
<label className="block text-[0.6875rem] font-medium uppercase tracking-wider mb-1">
  Title <span className="text-[var(--color-ruby)]">*</span>
</label>
```

#### Status Badges
```tsx
/* Pill-shaped badges with priority dot indicator */
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full">
  <span className="w-1.5 h-1.5 rounded-full"
        style={{ background: priorityColors[priority] }} />
  {statusText}
</span>
```

### Animation System

```css
/* Entrance Animations */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Usage: Staggered delays for sequential reveal */
.animate-slideUp { animation: slideUp 0.6s ease-out; }
.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }
```

### Layout Principles

**Stats Grid**
- Three-column grid on desktop
- Even spacing with gap-4 (1rem)
- Each stat card animates in with staggered delay
- Large serif numbers with small uppercase labels

**Task Cards**
- Horizontal layout (not vertical)
- Priority accent bar on left edge (1px wide, full height)
- Content flows left-to-right: title → metadata → actions
- Status badge with inline priority dot
- Edit/Delete buttons on far right

**Form Layout**
- Vertical labels above inputs (not inline)
- Amber focus rings (ring-2 ring-[var(--color-amber)])
- Full-width inputs with consistent padding
- Error messages in ruby red below fields
- Primary button: amber background, white text, hover darkens

### Background Texture

```css
/* Subtle grid pattern on body */
body {
  background: var(--color-paper);
  background-image:
    linear-gradient(var(--color-mist) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-mist) 1px, transparent 1px);
  background-size: 40px 40px;
  background-position: -1px -1px;
}
```

### Implementation Notes

**What to Avoid:**
- ❌ Generic font families (Inter, Roboto, system fonts)
- ❌ Default rounded corners (use sharp edges: border-radius: 0)
- ❌ Blue accent colors (use amber for warmth)
- ❌ Table-based layouts for data (use cards)
- ❌ Instant animations (add staggered delays)

**What to Prioritize:**
- ✅ Serif typography for headings and emphasis
- ✅ Uppercase tracked labels for refinement
- ✅ Priority-based color coding (visual hierarchy)
- ✅ Generous whitespace (padding, margins)
- ✅ Subtle hover states (transform, shadow changes)
- ✅ Consistent spacing scale (Tailwind defaults)

## React Query Configuration

**TanStack Query (React Query)** manages server state, caching, and data fetching.

### Query Client Setup

```typescript
// main.tsx or App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 minutes - data stays fresh
      gcTime: 1000 * 60 * 10,          // 10 minutes - cache retention (formerly cacheTime)
      retry: 1,                         // Retry failed requests once
      refetchOnWindowFocus: true,       // Refetch on window focus
      refetchOnReconnect: true,         // Refetch on network reconnect
    },
    mutations: {
      retry: 0,                         // Don't retry mutations
    },
  },
})

// Wrap app with provider
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

### Query Key Structure

```typescript
// Consistent, hierarchical query keys
const TASKS_QUERY_KEY = ['tasks']

// All tasks (unpaginated)
queryKey: ['tasks']

// Paginated tasks
queryKey: ['tasks', 'paged', page, pageSize]

// Single task by ID
queryKey: ['tasks', id]

// Filtered tasks (future enhancement)
queryKey: ['tasks', { status: 'Todo', priority: 'High' }]
```

### Custom Hooks Pattern

```typescript
// hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskApi } from '../services/api'

const TASKS_QUERY_KEY = ['tasks']

// Fetch all tasks
export function useTasks() {
  return useQuery({
    queryKey: TASKS_QUERY_KEY,
    queryFn: taskApi.getAll,
  })
}

// Fetch paginated tasks
export function useTasksPaged(page: number, pageSize: number = 20) {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, 'paged', page, pageSize],
    queryFn: () => taskApi.getPaged(page, pageSize),
  })
}

// Fetch single task
export function useTask(id: number) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => taskApi.getById(id),
    enabled: !!id,  // Only run if id exists
  })
}

// Create task mutation
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTaskDto) => taskApi.create(data),
    onSuccess: () => {
      // Invalidate all task queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
    },
  })
}

// Update task mutation
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTaskDto }) =>
      taskApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
    },
  })
}

// Delete task mutation
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => taskApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
    },
  })
}
```

### Usage in Components

```typescript
import { useTasks, useCreateTask, useDeleteTask } from '../hooks/useTasks'

function TaskList() {
  const { data: tasks, isLoading, error } = useTasks()
  const createTask = useCreateTask()
  const deleteTask = useDeleteTask()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  const handleCreate = async (data: CreateTaskDto) => {
    await createTask.mutateAsync(data)
    // Query automatically refetches due to invalidation
  }

  const handleDelete = async (id: number) => {
    await deleteTask.mutateAsync(id)
  }

  return (
    <div>
      {tasks?.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}
```

### Cache Invalidation Strategy

```typescript
// Invalidate all tasks queries (any key starting with ['tasks'])
queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })

// Invalidate specific task
queryClient.invalidateQueries({ queryKey: ['tasks', taskId] })

// Invalidate and refetch immediately
queryClient.invalidateQueries({
  queryKey: TASKS_QUERY_KEY,
  refetchType: 'active'  // Only refetch active queries
})

// Remove from cache entirely
queryClient.removeQueries({ queryKey: ['tasks', taskId] })
```

### Optimistic Updates (Future Enhancement)

```typescript
// Update UI immediately before server confirms
const updateTask = useMutation({
  mutationFn: ({ id, data }) => taskApi.update(id, data),
  onMutate: async ({ id, data }) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['tasks'] })

    // Snapshot current value
    const previous = queryClient.getQueryData(['tasks'])

    // Optimistically update cache
    queryClient.setQueryData(['tasks'], (old: Task[]) =>
      old.map(task => task.id === id ? { ...task, ...data } : task)
    )

    return { previous }  // Return context for rollback
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['tasks'], context?.previous)
  },
  onSettled: () => {
    // Always refetch after mutation
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  },
})
```

### Testing with React Query

```typescript
// test/utils.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,      // Don't retry in tests
        gcTime: 0,         // No caching in tests
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export function renderWithProviders(ui: ReactElement) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}
```

### DevTools (Development Only)

```typescript
// Add React Query DevTools for debugging
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  <App />
  {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
</QueryClientProvider>
```

### Key Principles

- **Query keys are dependencies**: Changes to key trigger refetch
- **Mutations invalidate queries**: Always invalidate related data after mutations
- **Don't store local UI state in React Query**: Use for server state only
- **Use enabled option**: Prevent queries from running until dependencies are ready
- **Stale vs. Cache time**:
  - `staleTime`: How long data is considered fresh (default: 0)
  - `gcTime`: How long unused data stays in cache (default: 5 minutes)

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

**Component Tests** - Testing card-based Editorial Precision UI:
```typescript
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/utils'
import TaskItem from './TaskItem'
import { TaskStatus, TaskPriority } from '../types/task'
import type { Task } from '../types/task'

const mockTask: Task = {
  id: 1,
  title: 'Test Task',
  description: 'Test Description',
  status: TaskStatus.Todo,
  priority: TaskPriority.Medium,
  createdAt: '2026-06-08T10:00:00Z',
}

describe('TaskItem', () => {
  it('renders task in editorial card layout', () => {
    renderWithProviders(<TaskItem task={mockTask} />)

    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('displays status badge with correct text', () => {
    renderWithProviders(<TaskItem task={mockTask} />)

    // Status badge displays "To Do" for TaskStatus.Todo
    const statusBadges = screen.getAllByText('To Do')
    expect(statusBadges.length).toBeGreaterThan(0)
  })

  it('applies line-through styling to completed tasks', () => {
    const doneTask: Task = { ...mockTask, status: TaskStatus.Done }
    renderWithProviders(<TaskItem task={doneTask} />)

    const title = screen.getByText('Test Task')
    expect(title).toHaveClass('line-through')
  })

  it('shows Edit and Delete buttons', () => {
    renderWithProviders(<TaskItem task={mockTask} />)

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })

  it('switches to edit mode when edit button clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TaskItem task={mockTask} />)

    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)

    expect(screen.getByRole('heading', { name: /edit task/i })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument()
  })
})
```

**Testing with React Query Provider**:
```typescript
// test/utils.tsx - Custom render with QueryClientProvider
import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
    options
  )
}
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

### Backend Security

**Input Validation**
- ✅ FluentValidation on all DTOs at controller entry points
- ✅ Validate enum values with `.IsInEnum()`
- ✅ Max length validation on all string properties (Title: 200, Description: 1000)
- ✅ Date validation (DueDate must be in future)
- ✅ Reject empty/whitespace-only required fields

**SQL Injection Prevention**
- ✅ EF Core parameterized queries (automatic)
- ✅ Never use raw SQL with string interpolation
- ✅ Use `.FromSqlRaw()` with parameters: `FromSqlRaw("SELECT * FROM Tasks WHERE Id = {0}", id)`
- ✅ Query filters prevent direct table access to soft-deleted records

**CORS Configuration**
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")  // Vite dev server
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

app.UseCors("AllowFrontend");  // Apply before UseAuthorization
```
- ✅ Specific origin only (never `AllowAnyOrigin()`)
- ✅ Update for production domain

**Rate Limiting**
```csharp
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("api", options =>
    {
        options.Window = TimeSpan.FromMinutes(1);
        options.PermitLimit = 100;
    });
});

app.MapControllers().RequireRateLimiting("api");
```
- ✅ Protect against brute force and DoS
- ✅ Different limits for read vs. write operations

**Error Handling**
- ✅ Global exception handler middleware
- ✅ Never expose stack traces to client (production)
- ✅ Return generic error messages to client
- ✅ Log full exception details server-side with correlation IDs
```csharp
app.UseExceptionHandler("/error");  // Production
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();  // Development only
}
```

**Logging Security**
- ✅ Never log passwords, tokens, or API keys
- ✅ Redact sensitive fields (email addresses, IDs)
- ✅ Use structured logging (Serilog) with sanitization
- ✅ Rotate log files daily, retain for 30 days max
```csharp
_logger.LogInformation("User {UserId} updated task {TaskId}", userId, taskId);
// ❌ Never: _logger.LogInformation($"Password: {password}")
```

**HTTPS Enforcement**
```csharp
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
    app.UseHsts();  // HTTP Strict Transport Security
}
```
- ✅ HTTPS only in production
- ✅ HSTS header with max-age=31536000 (1 year)

**Dependency Security**
- ✅ Pin exact package versions in `.csproj`
- ✅ Run `dotnet list package --vulnerable` regularly
- ✅ Update vulnerable dependencies immediately
- ✅ Review release notes before updating major versions

### Frontend Security

**Input Validation**
- ✅ Zod schema validation before API calls
- ✅ Validate all form inputs client-side (UX) AND server-side (security)
- ✅ Trim whitespace and sanitize input
```typescript
const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  priority: z.enum(['Low', 'Medium', 'High']),
  dueDate: z.date().refine(d => d > new Date()).optional(),
})
```

**XSS Prevention**
- ✅ React auto-escapes JSX expressions
- ✅ Never use `dangerouslySetInnerHTML` unless absolutely necessary
- ✅ If needed, use DOMPurify to sanitize HTML:
```typescript
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
```
- ✅ Validate and sanitize user-generated content before display

**API Response Validation**
- ✅ Validate all API responses with Zod schemas
- ✅ Never trust API data without validation
- ✅ Handle unexpected response shapes gracefully
```typescript
const TaskResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  status: z.enum(['Todo', 'InProgress', 'Done']),
  // ... all fields
})

const response = await fetch('/api/tasks/1')
const data = await response.json()
const task = TaskResponseSchema.parse(data)  // Throws if invalid
```

**Environment Variables**
- ✅ Use `.env` files for configuration
- ✅ Never commit `.env` to git (in `.gitignore`)
- ✅ Prefix public variables with `VITE_`
- ✅ No sensitive data in frontend (API keys, secrets)
```bash
# .env
VITE_API_URL=http://localhost:5000/api
# ❌ Never: VITE_SECRET_KEY=abc123 (exposed to client!)
```

**Local Storage Security**
- ✅ Never store sensitive data (passwords, tokens) in localStorage
- ✅ Use httpOnly cookies for authentication tokens (future)
- ✅ Clear localStorage on logout
- ✅ Validate data read from localStorage (can be tampered)

**Content Security Policy (CSP)**
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self';
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
               font-src 'self' https://fonts.gstatic.com;
               img-src 'self' data:;
               connect-src 'self' http://localhost:5000">
```
- ✅ Restrict resource loading to trusted sources
- ✅ Update `connect-src` for production API domain

**Dependency Security**
- ✅ Pin exact versions in `package.json`
- ✅ Run `npm audit` or `pnpm audit` regularly
- ✅ Update vulnerable dependencies immediately
- ✅ Use `npm audit fix` cautiously (review breaking changes)

**Build Security**
- ✅ Remove console.logs in production builds
- ✅ Minify and obfuscate production code
- ✅ Use environment-specific builds
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console.logs
      },
    },
  },
})
```

### Common Security Pitfalls

**❌ Don't:**
- Expose stack traces to users in production
- Log sensitive information (passwords, tokens, PII)
- Use `eval()` or `Function()` constructor
- Trust user input without validation
- Store secrets in frontend code or environment variables
- Use `SELECT *` queries (expose schema)
- Disable CORS in production
- Use weak session IDs or predictable tokens
- Return different error messages for "not found" vs "unauthorized" (timing attacks)

**✅ Do:**
- Validate all input at API boundary
- Use parameterized queries exclusively
- Implement rate limiting on all endpoints
- Log security events (failed login attempts, etc.)
- Use HTTPS in production
- Set security headers (CSP, HSTS, X-Frame-Options)
- Keep dependencies updated
- Conduct security reviews before deployment
- Use principle of least privilege (minimal permissions)

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
- ✅ Tests (90%+ coverage)
- ✅ API documentation (Swagger)
- ✅ Health check endpoint
- ✅ CORS configured
- ✅ Soft deletes

### Nice to Have (Beyond Scope)
- Authentication/authorization
- Real-time updates
- Caching
- Background jobs
- Docker containerization
- CI/CD pipeline

**Note:** Pagination is already implemented via `getPaged` endpoint.

### Performance Benchmarks

**Target Metrics** - Production-ready performance expectations:

**API Response Times:**
```
Target: < 200ms for CRUD operations
Acceptable: < 500ms under normal load
Warning: > 1000ms indicates optimization needed

Measured (local development):
├─ GET /api/tasks (20 items)      ~50ms
├─ GET /api/tasks/{id}            ~30ms
├─ POST /api/tasks                ~80ms
├─ PUT /api/tasks/{id}            ~75ms
├─ DELETE /api/tasks/{id}         ~60ms
└─ GET /api/tasks/paged?page=1    ~55ms
```

**Frontend Bundle Size:**
```
Target: < 300kb gzipped
Acceptable: < 500kb gzipped
Warning: > 1MB indicates bloat

Current (production build):
├─ index.js         ~290kb (uncompressed)
├─ index.css        ~15kb (uncompressed)
└─ Total gzipped    ~95kb
```

**Page Load Performance:**
```
Target Lighthouse scores (production):
├─ Performance      > 90
├─ Accessibility    > 95
├─ Best Practices   > 90
└─ SEO              > 90

Measured (local):
├─ First Contentful Paint (FCP)    < 1.0s
├─ Largest Contentful Paint (LCP)  < 2.0s
├─ Time to Interactive (TTI)       < 2.5s
└─ Total Blocking Time (TBT)       < 200ms
```

**Database Performance:**
```
SQLite performance (development/small deployments):
├─ Read queries (indexed)   < 10ms
├─ Write operations         < 50ms
└─ Concurrent connections   Limited to ~10

For production with > 1000 users, migrate to PostgreSQL or SQL Server.
```

**Memory Usage:**
```
Backend (.NET):
├─ Idle                    ~50MB
├─ Under load (100 req/s)  ~150MB
└─ Warning threshold       > 500MB

Frontend (browser):
├─ Initial load            ~20MB
├─ After 100 tasks         ~25MB
└─ Warning threshold       > 100MB (indicates memory leak)
```

**Test Coverage:**
```
Mandatory: 90% minimum across all metrics

Backend (.NET):
├─ Line Coverage        95.7%  ✅
├─ Branch Coverage      92.3%  ✅
└─ Service Layer        98.1%  ✅

Frontend (React):
├─ Line Coverage        95.7%  ✅
├─ Branch Coverage      90.8%  ✅
└─ Component Coverage   94.2%  ✅
```

**How to Measure:**

```bash
# Backend API response times
dotnet run --configuration Release
# Use Application Insights, Swagger, or curl with timing

# Frontend bundle size
npm run build
ls -lh dist/assets/*.js

# Lighthouse score
npx lighthouse http://localhost:5173 --view

# Backend memory usage
dotnet-counters monitor --process-id <pid>

# Database query performance
# Enable EF Core logging
builder.Services.AddDbContext<TodoDbContext>(options =>
    options.UseSqlite(connectionString)
           .EnableSensitiveDataLogging()  // Dev only
           .LogTo(Console.WriteLine, LogLevel.Information)
);
```

**Optimization Checklist:**

**Backend:**
- ✅ Use `.AsNoTracking()` for read-only queries
- ✅ Add indexes on frequently queried columns (Status, CreatedAt)
- ✅ Enable response compression
- ✅ Use async/await throughout
- ✅ Implement caching for static data (future)
- ✅ Connection pooling enabled by default in EF Core

**Frontend:**
- ✅ Code splitting with dynamic imports (future)
- ✅ Lazy load images and heavy components
- ✅ React Query caching (staleTime: 5min, gcTime: 10min)
- ✅ Debounce search/filter inputs (future)
- ✅ Virtual scrolling for large lists (future)
- ✅ Minify and compress production builds

## Architecture Decision Records (ADRs)

**Purpose:** Document significant architectural decisions, their context, and rationale.

### ADR-001: SQLite for Database

**Status:** Accepted

**Context:**
- Assignment requires SQLite
- Simple CRUD application with single user (development)
- No complex relationships or heavy concurrent writes

**Decision:** Use SQLite with Entity Framework Core

**Rationale:**
- ✅ Zero-configuration, file-based database
- ✅ Perfect for development and demos
- ✅ EF Core provides full ORM capabilities
- ✅ Easy to reset and migrate

**Consequences:**
- ✅ Simple setup, no database server needed
- ✅ Portable (single .db file)
- ❌ Limited concurrent write performance
- ❌ Not suitable for production with > 100 concurrent users
- 🔄 Migration path: PostgreSQL or SQL Server for production

**Alternatives Considered:**
- PostgreSQL: More robust, but requires server setup
- In-memory database: Loses data on restart
- JSON file: No query capabilities

---

### ADR-002: Soft Delete Pattern

**Status:** Accepted

**Context:**
- Need to support task deletion
- Potential future requirement to restore deleted tasks
- Audit trail for compliance

**Decision:** Implement soft deletes with `IsDeleted` flag and query filters

**Rationale:**
- ✅ Preserve data for potential recovery
- ✅ Audit trail (who deleted what, when)
- ✅ EF Core query filters automatically exclude deleted items
- ✅ Can implement "trash" feature later

**Consequences:**
- ✅ Data recovery without database backups
- ✅ Better user experience (undo delete)
- ❌ Database grows larger over time
- 🔄 Implement permanent delete after 30 days (future)

**Implementation:**
```csharp
modelBuilder.Entity<TodoTask>()
    .HasQueryFilter(t => !t.IsDeleted);  // Automatic filtering
```

**Alternatives Considered:**
- Hard delete: Permanent, no recovery
- Archive table: More complex queries

---

### ADR-003: Result<T> Pattern for Error Handling

**Status:** Accepted

**Context:**
- Need consistent error handling across API
- Want to avoid exception-driven control flow
- Clear distinction between business logic failures and system errors

**Decision:** Use Result<T> pattern for service layer returns

**Rationale:**
- ✅ Explicit success/failure states
- ✅ Type-safe error handling
- ✅ Avoid exceptions for expected failures (not found, validation errors)
- ✅ Easy to map to HTTP status codes

**Consequences:**
- ✅ Clear API contracts
- ✅ Better performance (no exceptions)
- ❌ More verbose than throwing exceptions
- 🔄 Consistent pattern across all services

**Implementation:**
```csharp
public class Result<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public string? Error { get; init; }
    public int StatusCode { get; init; }
}
```

**Alternatives Considered:**
- Exceptions only: Performance overhead, unclear control flow
- OneOf library: External dependency

---

### ADR-004: Editorial Precision Design System

**Status:** Accepted

**Context:**
- Assignment requires production-quality frontend
- Need to avoid generic "AI-generated" aesthetic
- Want distinctive, memorable user experience

**Decision:** Implement Editorial Precision design system with serif typography, warm colors, and card-based layouts

**Rationale:**
- ✅ Distinctive visual identity (Fraunces serif + DM Sans)
- ✅ Professional, publication-quality feel
- ✅ Strong visual hierarchy with priority-colored accents
- ✅ Accessible and refined

**Consequences:**
- ✅ Memorable, unique interface
- ✅ Clear brand identity
- ❌ Requires custom fonts (Google Fonts)
- 🔄 Consistent design language across all components

**Implementation:**
- CSS variables for color palette
- Custom component classes (editorial-card, btn-primary)
- Staggered animations for visual interest

**Alternatives Considered:**
- Material Design: Too generic
- Tailwind defaults: Lacks character
- Brutalist minimal: Too stark

---

### ADR-005: React Query for State Management

**Status:** Accepted

**Context:**
- Need server state management for API data
- Want automatic caching and refetching
- Reduce boilerplate for data fetching

**Decision:** Use TanStack Query (React Query) for all server state

**Rationale:**
- ✅ Automatic caching with configurable stale times
- ✅ Background refetching on window focus/reconnect
- ✅ Optimistic updates support
- ✅ Built-in loading and error states
- ✅ DevTools for debugging

**Consequences:**
- ✅ Less boilerplate than useState + useEffect
- ✅ Better UX with caching
- ❌ Learning curve for team members
- 🔄 Use local state (useState) for UI-only state

**Configuration:**
```typescript
staleTime: 5 minutes  // Data fresh for 5min
gcTime: 10 minutes    // Cache retained for 10min
```

**Alternatives Considered:**
- Redux: Overkill for simple CRUD app
- SWR: Similar, but React Query has better TypeScript support
- Plain fetch + useState: Too much boilerplate

---

### ADR-006: 90% Code Coverage Requirement

**Status:** Accepted

**Context:**
- Assignment evaluates code quality
- Need confidence in refactoring
- Prevent regression bugs

**Decision:** Enforce 90% minimum code coverage on all metrics (lines, branches, functions)

**Rationale:**
- ✅ High confidence in code correctness
- ✅ Forces thinking about edge cases
- ✅ Safe refactoring with green tests
- ✅ Documents expected behavior

**Consequences:**
- ✅ Fewer bugs in production
- ✅ Better code design (testable code)
- ❌ Slower initial development
- 🔄 Block commits below 90% threshold

**Coverage Targets:**
- Service layer: 95%+ (critical business logic)
- Controllers/Components: 90%+
- Utilities: 95%+

**Alternatives Considered:**
- 80% coverage: Too low, allows untested code
- 100% coverage: Diminishing returns, test overhead

## Git Configuration

### .gitignore Setup

**Backend (.NET):**
```gitignore
# Build outputs
bin/
obj/
*.dll
*.exe

# Database files (SQLite)
*.db
*.db-shm
*.db-wal

# Keep migrations in version control
!Migrations/*.db

# Logs
logs/
*.log

# Test results
TestResults/
CoverageReport/

# User-specific files
.vs/
.vscode/
*.suo
*.user
*.swp

# NuGet packages
*.nupkg
packages/

# Environment files
.env
appsettings.Development.json  # If contains secrets
```

**Frontend (React + Vite):**
```gitignore
# Dependencies
node_modules/

# Build outputs
dist/
build/

# Environment files
.env
.env.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Editor directories
.vscode/
.idea/
*.swp
*.swo

# Test coverage
coverage/

# Vite cache
.vite/
.cache/

# OS files
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.bak
```

**Project Root:**
```gitignore
# Document editing artifacts (from docx skill)
unpacked/

# Temporary files
*.tmp
*.temp

# IDE
.vscode/settings.json  # User-specific settings
.idea/

# OS
.DS_Store
Thumbs.db
```

**What to ALWAYS version control:**
- ✅ EF Core Migrations (`Migrations/` folder)
- ✅ `package-lock.json` or `pnpm-lock.yaml` (dependency locks)
- ✅ Configuration templates (`.env.example`)
- ✅ All source code and tests
- ✅ Build scripts and GitHub Actions workflows
- ✅ Documentation (README, CLAUDE.md)

**What to NEVER commit:**
- ❌ Database files (`*.db`, `*.db-shm`, `*.db-wal`)
- ❌ Environment files with secrets (`.env`, `appsettings.Production.json`)
- ❌ Build outputs (`bin/`, `obj/`, `dist/`)
- ❌ Dependencies (`node_modules/`, `packages/`)
- ❌ IDE settings (`.vscode/`, `.vs/`)
- ❌ Log files (`logs/`, `*.log`)
- ❌ Test artifacts (`TestResults/`, `coverage/`)

**Special Cases:**

```gitignore
# ✅ Commit: Environment template (safe to share)
.env.example

# ❌ Ignore: Actual environment file (may contain secrets)
.env
.env.local
.env.production

# ✅ Commit: Migration files (schema history)
Migrations/*.cs

# ❌ Ignore: SQLite database files
*.db
*.db-shm
*.db-wal

# ✅ Commit: TypeScript types
src/types/

# ❌ Ignore: Generated type definitions from external tools
*.d.ts.map
```

**Verification Commands:**

```bash
# Check what's being ignored
git status --ignored

# Check if sensitive file would be committed
git check-ignore -v .env

# List all tracked files
git ls-files

# Find large files that shouldn't be committed
find . -size +1M -not -path "./node_modules/*" -not -path "./.git/*"
```

**Recovery from Accidental Commits:**

```bash
# Remove file from git but keep locally
git rm --cached todoapp.db

# Remove from history (if already pushed)
git filter-branch --index-filter 'git rm --cached --ignore-unmatch todoapp.db'

# Or use BFG Repo-Cleaner (faster)
bfg --delete-files todoapp.db
```

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
4. Coverage >= 90%: `npm run test:coverage`
5. README updated if needed

## Troubleshooting

### Backend Issues

**SQLite Database Locked**
```
Microsoft.Data.Sqlite.SqliteException: database is locked
```
**Cause:** Multiple processes accessing the database simultaneously, or uncommitted transaction.

**Solutions:**
```bash
# 1. Stop all running backend instances
pkill -f "dotnet run"

# 2. Delete lock files
rm todoapp.db-shm todoapp.db-wal

# 3. Restart backend
cd backend
dotnet run
```

**Prevention:**
```csharp
// Use connection pooling and proper disposal
services.AddDbContext<TodoDbContext>(options =>
    options.UseSqlite(connectionString, sqliteOptions =>
    {
        sqliteOptions.CommandTimeout(30);
    })
);

// Always dispose contexts
await using var context = new TodoDbContext();
```

**EF Core Migration Conflicts**
```
Build failed. Use dotnet build to see the errors.
```
**Cause:** Migration file conflicts or pending migrations.

**Solutions:**
```bash
# 1. Check migration status
dotnet ef migrations list

# 2. Remove problematic migration
dotnet ef migrations remove

# 3. Recreate migration
dotnet ef migrations add FixedMigration

# 4. Apply migration
dotnet ef database update

# 5. If database is corrupted, reset (DEVELOPMENT ONLY)
rm todoapp.db
dotnet ef database update
```

**CORS Errors (Backend)**
```
Access to fetch at 'http://localhost:5000/api/tasks' from origin 'http://localhost:5173' has been blocked by CORS policy
```
**Cause:** CORS not configured or incorrect origin.

**Solution:**
```csharp
// Program.cs - ensure CORS is configured AND applied in correct order
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader());
});

// CRITICAL: UseCors must come BEFORE UseAuthorization
app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();
```

**FluentValidation Not Running**
```
Invalid data passes validation
```
**Cause:** Validator not registered in DI container.

**Solution:**
```csharp
// Program.cs
builder.Services.AddValidatorsFromAssemblyContaining<CreateTaskDtoValidator>();

// Controller
public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto dto)
{
    var validator = new CreateTaskDtoValidator();
    var validationResult = await validator.ValidateAsync(dto);

    if (!validationResult.IsValid)
        return BadRequest(validationResult.Errors);

    // Process valid request
}
```

**Port Already in Use**
```
Error: Failed to bind to address http://127.0.0.1:5000: address already in use
```
**Solutions:**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
dotnet run --urls "http://localhost:5001"
```

### Frontend Issues

**React Query Stale Data**
```typescript
// Data doesn't update after mutation
```
**Cause:** Missing query invalidation.

**Solution:**
```typescript
const updateTask = useMutation({
  mutationFn: ({ id, data }) => taskApi.update(id, data),
  onSuccess: () => {
    // CRITICAL: Invalidate queries to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  },
})
```

**Zod Validation Errors Not Showing**
```typescript
// Form submits with invalid data
```
**Cause:** Not using Zod parse/safeParse, or errors not displayed.

**Solution:**
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()

  // Validate with Zod
  const result = createTaskSchema.safeParse(formData)

  if (!result.success) {
    // Extract and display errors
    const errors = result.error.flatten().fieldErrors
    setFormErrors(errors)
    return
  }

  // Submit valid data
  await createTask.mutateAsync(result.data)
}
```

**Vite Build Fails**
```
Error: Could not resolve import
```
**Cause:** TypeScript errors or missing dependencies.

**Solutions:**
```bash
# 1. Check TypeScript compilation
npm run type-check

# 2. Clean and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 3. Clear Vite cache
rm -rf node_modules/.vite

# 4. Check for circular dependencies
npm run build -- --logLevel info
```

**Tests Fail After Design Changes**
```
Error: Unable to find element with text: "Update"
```
**Cause:** Component text changed but tests still expect old text.

**Solution:**
```typescript
// Update test expectations to match new design
expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
// Instead of: getByText('Update')

// Use semantic queries (more resilient)
expect(screen.getByRole('button', { name: /edit/i }))
expect(screen.getByLabelText(/title/i))
expect(screen.getByRole('heading', { name: /new task/i }))
```

**Type Errors: "Property does not exist on type"**
```typescript
Property 'description' does not exist on type 'Task'
```
**Cause:** Type definitions out of sync with API or missing optional marker.

**Solution:**
```typescript
// Ensure type matches backend DTO
export interface Task {
  id: number
  title: string
  description?: string  // Mark as optional if can be null
  status: TaskStatus
  priority: TaskPriority
  createdAt: string
  updatedAt?: string
  dueDate?: string
}

// Or use Zod to generate types
const TaskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  // ...
})
export type Task = z.infer<typeof TaskSchema>
```

**CSS Not Applied / Styles Missing**
```
Editorial design not showing, looks like unstyled HTML
```
**Cause:** CSS not imported or Tailwind not configured.

**Solutions:**
```typescript
// 1. Ensure index.css is imported in main.tsx
import './index.css'

// 2. Check Tailwind config includes all content paths
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",  // Must include all component files
  ],
}

// 3. Verify Google Fonts import in index.css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');
```

### Common Errors

**"Cannot read property of undefined"**
```typescript
TypeError: Cannot read property 'title' of undefined
```
**Solutions:**
- Add optional chaining: `task?.title`
- Check loading state: `if (isLoading) return <div>Loading...</div>`
- Add null checks: `if (!task) return null`

**Git Merge Conflicts in package-lock.json**
```bash
# Always regenerate lock files, never merge manually
git checkout --theirs package-lock.json
npm install

# Or
git checkout --ours package-lock.json
npm install
```

**Database Out of Sync with Models**
```
SqliteException: SQLite Error 1: 'no such column: IsDeleted'
```
**Solution:**
```bash
# Apply pending migrations
dotnet ef database update

# Or recreate database (DEVELOPMENT ONLY, loses data)
rm todoapp.db
dotnet ef database update
```

### Performance Issues

**Slow Page Load / High Memory Usage**
- Check React Query `gcTime` and `staleTime` settings
- Verify no infinite loops in `useEffect`
- Use React DevTools Profiler to identify slow components
- Reduce bundle size: `npm run build -- --mode production`

**API Response Slow**
- Check database indexes on frequently queried columns (Status, CreatedAt)
- Add `.AsNoTracking()` to read-only queries
- Use pagination for large datasets
- Profile with `dotnet trace` or Application Insights

### Debugging Tools

**Backend:**
```bash
# View logs
cat logs/log-20260609.txt

# Watch logs in real-time
tail -f logs/log-*.txt

# Debug with VS Code
# Add breakpoint → F5 (Start Debugging)
```

**Frontend:**
```bash
# React DevTools (Chrome extension)
# Components tab - inspect state and props

# React Query DevTools (in-app)
# Shows cache state, refetch behavior

# Browser console
console.log({ task, isLoading, error })

# Network tab
# Inspect API requests and responses
```

## Historical Context: Original Assignment

> **Note:** This section documents the original context when this project was a take-home assignment. The project has since evolved into a production-quality reference implementation. These notes are preserved for historical context.

**Original Assignment Goals:**
1. Clean, well-structured code
2. Thoughtful architectural decisions
3. Good frontend/backend communication
4. Production-ready features
5. Clear documentation

**Design Principles Applied:**
- Balance between minimal scaffolding and over-engineering
- Explain trade-offs in documentation
- Document architectural assumptions
- Demonstrate production mindset with intentional decisions

**Project Evolution:**
- ✅ Achieved: 90%+ code coverage (exceeds typical assignment requirements)
- ✅ Achieved: Editorial Precision design system (distinctive UI)
- ✅ Achieved: Comprehensive documentation with ADRs
- ✅ Achieved: Production-ready security, logging, and error handling
- 🔄 Beyond scope: Authentication, real-time updates, deployment automation


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:6cd5cc61 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->
