# Test Strategy — Ezra Todo App

**Date:** 2026-06-10
**Constraint:** Take-home assignment, 4-day window, solo developer, 90% coverage mandate (CLAUDE.md)

## Current State

Your COVERAGE_SUMMARY.md (June 9) is stale — the suite has grown since:

| Area | Tests now | Status |
|------|-----------|--------|
| Backend: TaskService | 13 | ✅ ~90% |
| Backend: TasksController | 11 | ✅ ~90% |
| Backend: TaskRepository | 10 | ✅ ~85% |
| Frontend: TaskForm | 36 | ✅ closed (was 0) |
| Frontend: useTasks | 23 | ✅ closed (was 0) |
| Frontend: TaskItem | 17 | ✅ |
| Frontend: api service | 14 | ✅ 100% |
| **Frontend: TaskList** | **0** | ❌ **only untested component** |

Total: 34 backend + 90 frontend = 124 tests.

## Testing Pyramid — where this app should sit

```
      /  E2E  \          0 today → keep at 0–3 smoke tests (time-boxed; optional)
     / Integration \     Controller tests exist; add WebApplicationFactory HTTP-layer tests
    /   Unit tests   \   124 today → strong; close TaskList + validation gaps
```

For a 4-day take-home, depth at the unit/integration layers beats an E2E framework setup. A Playwright suite is not worth the setup cost; reviewers run `dotnet test` and `npm test`.

## Gap Plan (priority order)

### 1. TaskList component tests — highest value (≈15 tests, 2–3 h)

The only untested component, and the most complex: pagination, filtering, stats, and three async states.

Cover: renders tasks from `useTasks`; loading state; error state; empty state ("no tasks" message); stats grid computes counts by status; filter by status/priority narrows the list; pagination controls (next/prev, disabled at bounds); delete flows through to hook.

Example:

```typescript
it('shows empty state when no tasks exist', async () => {
  server.use(http.get('*/api/tasks*', () => HttpResponse.json([])))
  renderWithProviders(<TaskList />)
  expect(await screen.findByText(/no tasks/i)).toBeInTheDocument()
})
```

### 2. Backend validation gaps (≈10 tests, 2 h)

From COVERAGE_ANALYSIS.md, still open: enum validation (invalid Priority/Status values → 400), partial-update preservation (PUT with null fields keeps existing values), pagination validation (page < 1, pageSize bounds), and repository pagination (correct slice, ordering, total count).

```csharp
[Theory]
[InlineData(-1, 20)]
[InlineData(1, 0)]
[InlineData(1, 1000)]
public async Task GetTasksPagedAsync_WithInvalidParams_ReturnsBadRequest(int page, int size)
```

### 3. HTTP-layer integration tests (≈6 tests, 1–2 h)

Controller unit tests mock the service — nothing currently proves routing, JSON serialization (camelCase, string enums), status codes, and CORS wire up correctly. Use the existing `public partial class Program` hook with `WebApplicationFactory<Program>` and SQLite in-memory: one happy-path test per endpoint (GET list, GET by id, POST 201 + Location header, PUT, DELETE 204, GET 404 for missing id).

### 4. Auth tests — when ADR-007 is implemented (≈8 tests)

Security boundaries are pyramid-priority regardless of deadline: 401 without token; 401 with expired/garbage token; 200 with valid token; login with wrong password → 401 (same message as unknown user — no enumeration); login DTO validation; cross-user isolation (user A cannot read/update/delete user B's task — the one that actually matters); password is hashed in DB, never logged.

## What NOT to test

DTO records, EF migrations, auto-generated code (already excluded); Editorial design CSS/animations; React Query internals (test your hooks' behavior, not the library); third-party validation internals.

## Coverage targets (unchanged from CLAUDE.md)

Line 90%+ overall, branch 85%+, service layer 95%+. After step 1–2 above, both sides should clear 90% — verify with `./run-coverage.sh` and `npm run test:coverage`, then update the stale COVERAGE_SUMMARY.md before submission (reviewers will read it).

## Suggested sequence (fits the 4-day window)

Day 1: TaskList tests + backend validation tests → coverage gate green.
Day 2: HTTP integration tests; regenerate coverage docs.
Day 3–4: Auth implementation test-first per ADR-007 (write the 401/isolation tests before the middleware).
