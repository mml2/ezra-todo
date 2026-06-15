# Ezra Take-Home Implementation Plan

## Summary of Requirements

**Objective:** Build a to-do task management API and frontend

**Tech Stack:**
- Backend: .NET Core
- Database: SQLite or EF Core in-memory
- Frontend: React or Vue
- Focus: Production MVP with clean architecture, tests, logging, security

**Key Evaluation Criteria:**
- Clean, well-structured code
- Thoughtful architectural decisions
- Good frontend/backend communication
- Production-ready features (tests, logging, security)
- Clear documentation

---

## Architecture Overview

### High-Level Architecture
```
┌─────────────────┐      REST API       ┌──────────────────┐
│                 │ ◄─────────────────► │                  │
│  React Frontend │     (JSON/HTTP)     │  .NET Core API   │
│                 │                     │                  │
└─────────────────┘                     └────────┬─────────┘
                                                 │
                                                 ▼
                                        ┌─────────────────┐
                                        │   SQLite DB     │
                                        │  (EF Core ORM)  │
                                        └─────────────────┘
```

### Project Structure
```
ezra-todo/
├── backend/
│   ├── TodoApi/                    # Main API project
│   │   ├── Controllers/
│   │   ├── Models/
│   │   ├── Services/
│   │   ├── Data/
│   │   ├── DTOs/
│   │   ├── Middleware/
│   │   └── Program.cs
│   └── TodoApi.Tests/              # Unit & integration tests
│       ├── Controllers/
│       ├── Services/
│       └── Integration/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── App.tsx
│   └── package.json
├── README.md
└── IMPLEMENTATION_PLAN.md
```

---

## Backend Implementation Plan

### 1. Core Domain Models

**Task Entity:**
```csharp
public class TodoTask
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string? Description { get; set; }
    public TaskStatus Status { get; set; }  // Todo, InProgress, Done
    public TaskPriority Priority { get; set; }  // Low, Medium, High
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? DueDate { get; set; }
    public bool IsDeleted { get; set; }  // Soft delete
}

public enum TaskStatus { Todo, InProgress, Done }
public enum TaskPriority { Low, Medium, High }
```

**DTOs (Data Transfer Objects):**
```csharp
// CreateTaskDto - for creating new tasks
// UpdateTaskDto - for updating existing tasks
// TaskResponseDto - for API responses
```

### 2. Data Layer (Repository Pattern)

**DbContext:**
```csharp
public class TodoDbContext : DbContext
{
    public DbSet<TodoTask> Tasks { get; set; }

    // Configure entity relationships, indexes, constraints
}
```

**Repository Interface:**
```csharp
public interface ITaskRepository
{
    Task<IEnumerable<TodoTask>> GetAllAsync();
    Task<TodoTask?> GetByIdAsync(int id);
    Task<TodoTask> CreateAsync(TodoTask task);
    Task<TodoTask?> UpdateAsync(int id, TodoTask task);
    Task<bool> DeleteAsync(int id);  // Soft delete
}
```

### 3. Service Layer (Business Logic)

**TaskService:**
```csharp
public interface ITaskService
{
    Task<Result<IEnumerable<TaskResponseDto>>> GetAllTasksAsync();
    Task<Result<TaskResponseDto>> GetTaskByIdAsync(int id);
    Task<Result<TaskResponseDto>> CreateTaskAsync(CreateTaskDto dto);
    Task<Result<TaskResponseDto>> UpdateTaskAsync(int id, UpdateTaskDto dto);
    Task<Result<bool>> DeleteTaskAsync(int id);
}
```

**Result Type Pattern:**
```csharp
public class Result<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Error { get; set; }
    public int StatusCode { get; set; }
}
```

### 4. API Controllers

**TasksController:**
```
GET    /api/tasks          - Get all tasks
GET    /api/tasks/{id}     - Get task by ID
POST   /api/tasks          - Create new task
PUT    /api/tasks/{id}     - Update task
DELETE /api/tasks/{id}     - Delete task (soft delete)
PATCH  /api/tasks/{id}/status - Update task status only
```

### 5. Production-Ready Features (Backend)

**Validation:**
- Use FluentValidation for request DTOs
- Title: required, max 200 chars
- Description: optional, max 1000 chars
- DueDate: must be future date
- Validate enums for Status/Priority

**Error Handling:**
- Global exception handling middleware
- Structured error responses
- Logging all exceptions with context

**Logging:**
- Use Serilog with structured logging
- Log all API requests (request/response)
- Log validation failures
- Log exceptions with stack traces
- Different log levels (Info, Warning, Error)

**Security:**
- Input sanitization (prevent XSS)
- SQL injection prevention (via EF Core parameterized queries)
- CORS configuration for frontend
- Rate limiting (basic implementation)
- Request size limits
- No sensitive data in logs

**Database:**
- Use SQLite for persistence (better than in-memory for demo)
- EF Core migrations
- Database initialization/seeding
- Proper indexing on frequently queried fields

**Health Check:**
- `/health` endpoint
- Check database connectivity

**API Documentation:**
- Swagger/OpenAPI integration
- Clear endpoint descriptions
- Request/response examples

**Configuration:**
- Use appsettings.json
- Environment-specific configs
- No hardcoded values

### 6. Testing Strategy (Backend)

**Unit Tests (xUnit + Moq):**
- Service layer tests (mock repository)
- Repository tests (in-memory DbContext)
- Validation tests
- Target: 80%+ coverage

**Integration Tests:**
- Full API endpoint tests (WebApplicationFactory)
- Test with actual SQLite database
- Test error scenarios
- Test validation failures

**Test Organization:**
```csharp
// Arrange - Act - Assert pattern
// Clear test names: MethodName_Scenario_ExpectedResult
// Example: CreateTask_WithValidData_ReturnsCreatedTask
```

---

## Frontend Implementation Plan

### 1. Technology Stack

**Core:**
- React 18+ with TypeScript
- Vite for build tooling
- React Router for navigation (if needed)

**State Management:**
- React Context API or Zustand (lightweight)
- Avoid Redux for simple app

**HTTP Client:**
- Axios with interceptors
- Centralized API client

**UI Library:**
- Tailwind CSS for styling
- Headless UI for accessible components
- React Hook Form for form handling

**Testing:**
- Vitest + React Testing Library
- Playwright for E2E (optional)

### 2. Component Structure

**Pages:**
```
/                 - Task List (home page)
```

**Components:**
```
├── TaskList          - Display all tasks, filter/sort
├── TaskItem          - Individual task display
├── TaskForm          - Create/Edit task form
├── TaskFilters       - Filter by status/priority
├── ErrorBoundary     - Catch React errors
├── LoadingSpinner    - Loading state
└── ErrorMessage      - Display errors
```

**Custom Hooks:**
```typescript
useTasks()       - Fetch all tasks
useTask(id)      - Fetch single task
useCreateTask()  - Create task mutation
useUpdateTask()  - Update task mutation
useDeleteTask()  - Delete task mutation
```

### 3. Type Definitions

```typescript
export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt?: string;
  dueDate?: string;
}

export enum TaskStatus {
  Todo = 'Todo',
  InProgress = 'InProgress',
  Done = 'Done'
}

export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High'
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
}
```

### 4. API Client

```typescript
// services/api.ts
const apiClient = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - add auth token (future)
// Response interceptor - handle errors globally

export const taskApi = {
  getAll: () => apiClient.get<Task[]>('/tasks'),
  getById: (id: number) => apiClient.get<Task>(`/tasks/${id}`),
  create: (data: CreateTaskDto) => apiClient.post<Task>('/tasks', data),
  update: (id: number, data: UpdateTaskDto) => apiClient.put<Task>(`/tasks/${id}`, data),
  delete: (id: number) => apiClient.delete(`/tasks/${id}`)
};
```

### 5. Features & UX

**Task List:**
- Display all tasks in a clean layout
- Visual distinction for status (color coding)
- Priority indicators
- Due date display with "overdue" warning
- Empty state message
- Loading state
- Error handling

**Create Task:**
- Modal or inline form
- Form validation (client-side)
- Clear validation error messages
- Success feedback
- Optimistic UI updates

**Update Task:**
- Inline editing or modal
- Quick status toggle
- Pre-filled form with current values
- Validation

**Delete Task:**
- Confirmation dialog
- Success feedback
- Optimistic UI update

**Filters/Sort:**
- Filter by status (All, Todo, InProgress, Done)
- Filter by priority
- Sort by: created date, due date, priority
- Clear filters option

**Responsive Design:**
- Mobile-first approach
- Works on tablet and desktop
- Touch-friendly

### 6. Production-Ready Features (Frontend)

**Error Handling:**
- Global error boundary
- Network error handling
- API error display
- Retry mechanism for failed requests

**Loading States:**
- Skeleton loaders
- Spinner for operations
- Disable buttons during operations

**Validation:**
- Client-side validation with Zod
- Match backend validation rules
- Clear error messages

**Accessibility:**
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus management
- Screen reader support

**Performance:**
- Code splitting (if multi-page)
- Lazy loading
- Debounced search/filter
- Optimistic updates
- Memoization where needed

**Security:**
- XSS prevention (React handles by default)
- Input sanitization
- Validate API responses
- Environment variables for API URL

**Testing:**
- Component unit tests
- Hook tests
- Integration tests for key flows
- Mock API responses
- 80%+ coverage target

---

## Implementation Sequence (TDD Approach)

### Phase 1: Backend Foundation
1. **Setup** (.NET Core project, SQLite, EF Core)
2. **Models** (TodoTask entity, enums)
3. **DbContext** (configuration, migrations)
4. **Repository** (TDD: write tests first)
   - Test: CreateAsync
   - Implement: CreateAsync
   - Test: GetAllAsync
   - Implement: GetAllAsync
   - Continue for all methods...
5. **Service Layer** (TDD: write tests first)
6. **Controllers** (TDD: integration tests)
7. **Middleware** (error handling, logging)
8. **Validation** (FluentValidation)

### Phase 2: Backend Production Features
1. **Logging** (Serilog setup)
2. **Health Check** endpoint
3. **CORS** configuration
4. **Swagger** documentation
5. **Rate Limiting** (basic)
6. **Configuration** (appsettings)

### Phase 3: Frontend Foundation
1. **Setup** (Vite + React + TypeScript)
2. **Types** (Task, DTOs, enums)
3. **API Client** (Axios setup)
4. **Hooks** (TDD where possible)
   - Test: useTasks
   - Implement: useTasks
   - Continue...

### Phase 4: Frontend Components
1. **TaskList** (TDD)
2. **TaskItem** (TDD)
3. **TaskForm** (TDD)
4. **Filters** (TDD)
5. **Error Boundary**
6. **Loading states**

### Phase 5: Integration & Polish
1. **Connect** frontend to backend
2. **E2E Testing** (manual walkthrough)
3. **Error handling** refinement
4. **UI polish** (responsive, accessible)
5. **Performance optimization**

### Phase 6: Documentation
1. **README.md** with:
   - Project overview
   - Tech stack decisions
   - Setup instructions (backend & frontend)
   - Running tests
   - API documentation
   - Architecture decisions
   - Trade-offs & assumptions
   - Future improvements
   - Production considerations
2. **Code comments** for complex logic
3. **API documentation** (Swagger)

---

## Key Architectural Decisions & Trade-offs

### 1. Database Choice: SQLite
**Decision:** Use SQLite instead of EF Core in-memory
**Rationale:**
- Persistence across restarts
- More realistic for demo
- Shows migration handling
- Better for manual testing
**Trade-off:** Slightly more setup than in-memory

### 2. Repository Pattern
**Decision:** Use repository pattern for data access
**Rationale:**
- Separation of concerns
- Easier testing (can mock repository)
- Flexibility to change data access
**Trade-off:** Extra abstraction layer

### 3. Result Type Pattern
**Decision:** Return Result<T> from services
**Rationale:**
- Explicit error handling
- Avoid exceptions for business logic failures
- Type-safe success/failure
**Trade-off:** More verbose than throwing exceptions

### 4. DTOs for API
**Decision:** Use separate DTOs for requests/responses
**Rationale:**
- Decouple API contract from domain models
- Control exactly what's exposed
- Easier versioning
**Trade-off:** More code, mapping needed

### 5. Soft Delete
**Decision:** Soft delete (IsDeleted flag) instead of hard delete
**Rationale:**
- Production-ready (can recover deleted items)
- Audit trail
- Safer for users
**Trade-off:** Need to filter deleted items in queries

### 6. React + TypeScript
**Decision:** React with TypeScript over Vue
**Rationale:**
- More familiar ecosystem
- Better typing support
- Larger community
**Trade-off:** Learning curve if new to TypeScript

### 7. Minimal State Management
**Decision:** React Context or Zustand, not Redux
**Rationale:**
- Simple app doesn't need Redux complexity
- Easier to understand
- Less boilerplate
**Trade-off:** Would need refactor if app grows significantly

### 8. Tailwind CSS
**Decision:** Tailwind over component library (MUI, etc.)
**Rationale:**
- Lightweight
- Full control over styling
- Shows CSS skills
- Fast development
**Trade-off:** Need to build components from scratch

---

## Future Improvements (Beyond MVP)

**Backend:**
- Authentication & authorization (JWT)
- User accounts (multi-user support)
- Task assignments/collaboration
- Task categories/tags
- Task search
- Pagination for large datasets
- Real-time updates (SignalR)
- File attachments
- Task comments/notes
- Audit logging
- Background jobs (reminders)
- API versioning
- Redis caching
- Database backup strategy

**Frontend:**
- Drag & drop task reordering
- Kanban board view
- Calendar view
- Dark mode
- Offline support (PWA)
- Real-time updates
- Advanced filtering
- Bulk operations
- Task templates
- Keyboard shortcuts
- Undo/redo
- Export to CSV/PDF
- Analytics dashboard

**DevOps:**
- Docker containerization
- CI/CD pipeline
- Automated testing in CI
- Code coverage reporting
- Static analysis
- Deployment to cloud (Azure/AWS)
- Monitoring & alerting
- Performance monitoring

**Security:**
- Authentication (OAuth, JWT)
- Authorization (role-based)
- HTTPS enforcement
- Security headers
- Input sanitization library
- Rate limiting per user
- Audit logging
- Penetration testing

---

## Testing Strategy Summary

**Backend (Target: 80%+ coverage):**
- Unit tests for services (mock repository)
- Unit tests for validation
- Integration tests for API endpoints
- Integration tests for repository (in-memory DB)
- Test happy paths and error scenarios

**Frontend (Target: 80%+ coverage):**
- Component unit tests (RTL)
- Hook tests
- Integration tests for key user flows
- Mock API responses
- Test accessibility

**Manual Testing Checklist:**
- Create task with all fields
- Create task with only required fields
- Update task
- Delete task
- Filter tasks by status
- Filter tasks by priority
- Validation errors display correctly
- Network errors handled gracefully
- Loading states work
- Responsive on mobile/tablet/desktop
- Keyboard navigation works
- Screen reader compatible

---

## README Structure

```markdown
# Ezra Todo App

## Overview
Brief description

## Tech Stack
- Backend: .NET Core 8, SQLite, EF Core
- Frontend: React 18, TypeScript, Tailwind CSS
- Testing: xUnit, Vitest, RTL

## Architecture
High-level diagram and explanation

## Setup Instructions

### Prerequisites
- .NET 8 SDK
- Node.js 18+

### Backend Setup
1. Navigate to backend/
2. Run dotnet restore
3. Run dotnet ef database update
4. Run dotnet run
5. API available at http://localhost:5000

### Frontend Setup
1. Navigate to frontend/
2. Run npm install
3. Run npm run dev
4. App available at http://localhost:3000

### Running Tests
Backend: dotnet test
Frontend: npm test

## API Documentation
Link to Swagger UI

## Design Decisions
Explanation of key choices

## Trade-offs & Assumptions
What was prioritized and why

## Future Improvements
What would be added with more time

## Production Considerations
What's needed for production deployment
```

---

## Estimated Implementation Time

- Backend foundation: 3-4 hours
- Backend production features: 2-3 hours
- Backend tests: 2-3 hours
- Frontend foundation: 2-3 hours
- Frontend components: 3-4 hours
- Frontend tests: 2-3 hours
- Integration & polish: 2-3 hours
- Documentation: 1-2 hours

**Total: 17-25 hours** (spread over multiple sessions)

---

## Success Criteria

✅ All CRUD operations work
✅ Frontend communicates with backend
✅ Data persists in database
✅ 80%+ test coverage (backend & frontend)
✅ Clean, readable code
✅ Production features implemented (logging, error handling, validation)
✅ Security considerations addressed
✅ Comprehensive README
✅ Swagger documentation
✅ Responsive UI
✅ Accessible UI
✅ No console errors
✅ Proper error handling throughout
