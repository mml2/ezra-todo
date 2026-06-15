# Ezra Todo App

A production-ready task management application built as a full-stack take-home assessment. Demonstrates clean architecture, TDD, and production-grade engineering practices across a .NET 10 API and React frontend.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | .NET 10 / ASP.NET Core |
| Database | SQLite + Entity Framework Core |
| Validation | FluentValidation (server) · Zod (client) |
| Logging | Serilog (file + console, daily rolling) |
| Testing (backend) | xUnit + Moq · WebApplicationFactory |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (Editorial Precision design system) |
| State / data | TanStack Query (React Query) |
| Testing (frontend) | Vitest + React Testing Library |

---

## Quick Start

### Prerequisites

- **Node.js** v18+ (tested on v24)
- **.NET 10 SDK** — [download](https://dotnet.microsoft.com/download/dotnet/10.0)

Verify:
```bash
node --version      # v18+
dotnet --version    # 10.x.x
```

### 1 — Backend

```bash
cd backend

# Restore dependencies
dotnet restore

# Apply database migrations (creates todoapp.db)
dotnet ef database update --project TodoApi

# Start the API
dotnet run --project TodoApi
```

API runs at **http://localhost:5000**

### 2 — Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

App runs at **http://localhost:3000** and proxies `/api` to the backend.

---

## Running Tests

### Backend

```bash
cd backend

# Run all tests
dotnet test

# Run with coverage report (excludes auto-generated migrations)
dotnet test --collect:"XPlat Code Coverage" --settings coverlet.runsettings
```

Current coverage: **98.4% lines · 92.4% branches**

### Frontend

```bash
cd frontend

# Run tests (single pass)
npm run test -- --run

# Run with coverage
npm run coverage
```

Current coverage: **95.8% lines · 95.1% branches**

---

## Project Structure

```
ezra-todo/
├── backend/
│   ├── TodoApi/
│   │   ├── Controllers/        # HTTP layer — thin, delegates to services
│   │   ├── Services/           # Business logic, returns Result<T>
│   │   ├── Data/               # EF Core DbContext + repository
│   │   ├── Models/             # Domain entities (TodoTask)
│   │   ├── DTOs/               # Immutable request/response records
│   │   ├── Validators/         # FluentValidation validators
│   │   ├── Migrations/         # EF Core migration history
│   │   └── Program.cs          # App wiring (DI, middleware, CORS, rate limiting)
│   ├── TodoApi.Tests/
│   │   ├── Controllers/        # Integration tests (WebApplicationFactory + SQLite in-memory)
│   │   ├── Services/           # Unit tests (Moq)
│   │   ├── Data/               # Repository tests
│   │   └── Integration/        # End-to-end HTTP pipeline tests
│   └── coverlet.runsettings    # Coverage config (excludes migrations)
├── frontend/
│   └── src/
│       ├── components/         # TaskForm, TaskItem, TaskList
│       ├── hooks/              # useTasks, useCreateTask, useUpdateTask, useDeleteTask
│       ├── services/           # api.ts — typed fetch wrappers
│       ├── types/              # Task, TaskStatus, TaskPriority
│       └── test/               # Shared test utilities (renderWithProviders)
└── docs/
    ├── ADR-007-authentication-strategy.md
    ├── COVERAGE_SUMMARY.md
    ├── IMPLEMENTATION_PLAN.md
    └── TEST-STRATEGY.md
```

---

## API Reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description | Success |
|--------|----------|-------------|---------|
| GET | `/tasks` | List all tasks | 200 |
| GET | `/tasks?page=1&pageSize=20` | Paginated list | 200 |
| GET | `/tasks/{id}` | Get task by ID | 200 / 404 |
| POST | `/tasks` | Create task | 201 / 400 |
| PUT | `/tasks/{id}` | Update task (partial — null fields preserved) | 200 / 400 / 404 |
| PATCH | `/tasks/{id}/status` | Update status only | 200 / 400 / 404 |
| DELETE | `/tasks/{id}` | Soft delete | 204 / 404 |

### Validation Rules

| Field | Rule |
|-------|------|
| `title` | Required, 1–200 chars |
| `description` | Optional, max 1000 chars |
| `priority` | `Low` \| `Medium` \| `High` |
| `status` | `Todo` \| `InProgress` \| `Done` |
| `dueDate` | Optional; must be a future date |

Errors return RFC 7807 Problem Details:
```json
{
  "errors": {
    "title": ["Title is required"]
  }
}
```

### Example: Create a task

```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Write integration tests",
    "description": "Cover all controller actions",
    "priority": "High",
    "dueDate": "2026-12-31T00:00:00Z"
  }'
```

---

## Architecture Decisions

### Result\<T\> pattern
Services return `Result<T>` (success/error/statusCode) instead of throwing exceptions for business failures. Controllers map results directly to HTTP responses — no try/catch at the controller layer.

### Repository pattern
`ITaskRepository` abstracts EF Core. Services depend on the interface, making unit tests fast (Moq) and integration tests real (SQLite in-memory via `WebApplicationFactory`).

### Soft delete
`IsDeleted` flag + EF Core global query filter (`HasQueryFilter`). Deleted tasks are invisible to all queries by default; no special handling needed in application code.

### Enums as strings
Status and Priority stored as `TEXT` in SQLite (`HasConversion<string>()`). Readable in the database, safe across migrations, no integer-to-name mapping needed.

### Concurrent paginated queries
`GetPagedAsync` fires `CountAsync` and `ToListAsync` concurrently via `Task.WhenAll`, halving latency on paginated requests.

### Single validation boundary
FluentValidation runs at the controller boundary. Services contain defence-in-depth guards for critical fields (title empty/too long) but do not duplicate enum validation — that's FluentValidation's job.

Full ADRs: see [`docs/`](docs/)

---

## Coverage Gates

A pre-commit hook in `~/.claude/settings.json` blocks `gh pr create` until both test suites pass and coverage thresholds are met:

| Suite | Lines | Branches |
|-------|-------|---------|
| Backend | ≥ 90% | ≥ 85% |
| Frontend | ≥ 90% | ≥ 85% |

---

## Environment Variables

### Frontend

Create `frontend/.env.local`:
```bash
VITE_API_URL=http://localhost:5000/api
```

The default is `http://localhost:5000/api` so this is only needed to override.

### Backend

Connection string is in `appsettings.json`. Override for production via environment variable:
```bash
ConnectionStrings__DefaultConnection="Data Source=/data/todoapp.db"
```

---

## Database Migrations

```bash
cd backend

# Create a new migration after model changes
dotnet ef migrations add <MigrationName> --project TodoApi

# Apply pending migrations
dotnet ef database update --project TodoApi

# Roll back last migration (if not yet applied)
dotnet ef migrations remove --project TodoApi
```

The database file (`todoapp.db`) is gitignored. Migrations are version-controlled.

---

## Future Enhancements

- JWT authentication (see [ADR-007](docs/ADR-007-authentication-strategy.md))
- Real-time updates via SignalR
- Task categories and tags
- Docker containerisation
- CI/CD pipeline (GitHub Actions)
- PostgreSQL for production deployments

---

## License

ISC
