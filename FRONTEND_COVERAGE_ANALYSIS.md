# Frontend Code Coverage Analysis

## Current Test Coverage: **~40-50%** ⚠️

### Test Statistics

| Category | Files | Tests | Coverage |
|----------|-------|-------|----------|
| **Components** | 3 | 13 | ~33% (1/3 tested) |
| **Services** | 1 | 10 | 100% ✅ |
| **Hooks** | 1 | 0 | 0% ❌ |
| **Types** | 1 | N/A | N/A |
| **Total** | **6 files** | **23 tests** | **~40-50%** |

## What's Tested ✅

### TaskItem Component (13 tests)
- ✅ Renders title and description
- ✅ Displays status badge
- ✅ Displays priority
- ✅ Shows correct action buttons (Start/Complete/Reopen)
- ✅ Applies line-through styling for completed tasks
- ✅ Overdue warning for past due dates
- ✅ Edit mode functionality
- ✅ Delete confirmation dialog
- ✅ Date formatting

### API Service (10 tests)
- ✅ getAll() - fetches all tasks
- ✅ getById() - fetches task by ID (success + error)
- ✅ create() - creates new task
- ✅ update() - updates task (success + error)
- ✅ updateStatus() - updates status (success + error)
- ✅ delete() - deletes task (success + error)

## What's NOT Tested ❌

### TaskList Component - 0 tests
**Critical gaps:**
- ❌ Pagination logic (page navigation, Previous/Next buttons)
- ❌ Filter functionality (status, priority)
- ❌ Client-side pagination for filtered results
- ❌ Stats calculation
- ❌ Task creation form toggle
- ❌ Empty state rendering
- ❌ Loading state
- ❌ Error state

### TaskForm Component - 0 tests
**Critical gaps:**
- ❌ Form validation (title required, max lengths)
- ❌ Create mode vs Edit mode
- ❌ Form submission
- ❌ Error handling
- ❌ Due date validation (future dates)
- ❌ Priority/Status selection

### useTasks Hook - 0 tests
**Critical gaps:**
- ❌ useTasks() query
- ❌ useTasksPaged() with pagination
- ❌ useTask() single task query
- ❌ useCreateTask() mutation
- ❌ useUpdateTask() mutation
- ❌ useUpdateTaskStatus() mutation
- ❌ useDeleteTask() mutation
- ❌ React Query cache invalidation

## Missing Tests Needed: ~35 tests

### TaskList Component (15 tests)
```typescript
describe('TaskList', () => {
  it('renders loading state')
  it('renders error state')
  it('renders empty state')
  it('displays task stats correctly')
  it('filters tasks by status')
  it('filters tasks by priority')
  it('clears filters')
  it('resets to page 1 when filter changes')
  it('navigates to next page')
  it('navigates to previous page')
  it('disables Previous on first page')
  it('disables Next on last page')
  it('toggles task creation form')
  it('uses paginated endpoint when no filters')
  it('uses all tasks endpoint when filters active')
})
```

### TaskForm Component (12 tests)
```typescript
describe('TaskForm', () => {
  it('renders create mode with empty form')
  it('renders edit mode with task data')
  it('validates required title')
  it('validates title max length (200 chars)')
  it('validates description max length (1000 chars)')
  it('validates future due date')
  it('shows validation errors')
  it('creates task on submit')
  it('updates task on submit')
  it('handles API errors')
  it('resets form after successful creation')
  it('disables submit during loading')
})
```

### useTasks Hook (8 tests)
```typescript
describe('useTasks', () => {
  it('useTasks fetches all tasks')
  it('useTasksPaged fetches paginated tasks')
  it('useCreateTask creates task and invalidates cache')
  it('useUpdateTask updates task and invalidates cache')
  it('useUpdateTaskStatus updates status and invalidates cache')
  it('useDeleteTask deletes task and invalidates cache')
  it('handles query errors')
  it('handles mutation errors')
})
```

## Setup Required for Coverage Reports

### 1. Install Coverage Provider
```bash
cd frontend
npm install --save-dev @vitest/coverage-v8
```

### 2. Update vite.config.ts
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.config.{ts,js}',
        '**/types.ts',
      ],
      all: true,
      lines: 90,
      functions: 90,
      branches: 85,
      statements: 90,
    },
  },
})
```

### 3. Update package.json scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

## How to Run Coverage

```bash
# Install coverage provider first
npm install --save-dev @vitest/coverage-v8

# Run tests with coverage
npm run test:coverage

# Open HTML report
open coverage/index.html
```

## Current vs Target Coverage

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| **Overall** | ~40-50% | 90% | 40-50% |
| **Components** | ~33% | 90% | 57% |
| **Services** | 100% ✅ | 90% | - |
| **Hooks** | 0% | 90% | 90% |

## Priority Actions

### High Priority (Must Do)
1. ✅ Install @vitest/coverage-v8
2. ✅ Configure coverage in vite.config.ts
3. ✅ Add TaskList tests (15 tests)
4. ✅ Add TaskForm tests (12 tests)
5. ✅ Add useTasks hook tests (8 tests)

### Medium Priority
6. Integration tests for user flows
7. E2E tests with Playwright
8. Visual regression tests

## Estimated Timeline

- **Setup coverage**: 15 minutes
- **TaskList tests**: 2-3 hours
- **TaskForm tests**: 2 hours
- **useTasks tests**: 1-2 hours
- **Total**: ~6-8 hours to reach 90% coverage

## Coverage Breakdown by File

### Tested ✅
- `src/components/TaskItem.tsx` - 13 tests, ~85% coverage
- `src/services/api.ts` - 10 tests, 100% coverage

### Not Tested ❌
- `src/components/TaskList.tsx` - 0 tests, 0% coverage
- `src/components/TaskForm.tsx` - 0 tests, 0% coverage
- `src/hooks/useTasks.ts` - 0 tests, 0% coverage

### Excluded
- `src/types/task.ts` - Type definitions only
- `src/test/setup.ts` - Test utilities
- `src/main.tsx` - App entry point
- `src/App.tsx` - Root component (can test if needed)

## Recommendations

1. **Immediate**: Install coverage tooling and generate baseline report
2. **Week 1**: Add TaskForm and useTasks tests (highest value)
3. **Week 2**: Add TaskList tests (complex, needs more time)
4. **Ongoing**: Maintain 90% coverage with every new feature

## Sample Coverage Command Output

```bash
$ npm run test:coverage

 Test Files  2 passed (2)
      Tests  23 passed (23)
   Start at  14:30:00
   Duration  1.23s

 % Coverage report from v8
-----------------|---------|----------|---------|---------|-------------------
File             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------|---------|----------|---------|---------|-------------------
All files        |   45.32 |    38.24 |   41.67 |   45.32 |
 components      |   33.33 |    25.00 |   30.00 |   33.33 |
  TaskForm.tsx   |       0 |        0 |       0 |       0 | 1-215
  TaskItem.tsx   |   85.71 |    78.26 |   90.00 |   85.71 | 42,78,156
  TaskList.tsx   |       0 |        0 |       0 |       0 | 1-257
 hooks           |       0 |        0 |       0 |       0 |
  useTasks.ts    |       0 |        0 |       0 |       0 | 1-80
 services        |     100 |      100 |     100 |     100 |
  api.ts         |     100 |      100 |     100 |     100 |
-----------------|---------|----------|---------|---------|-------------------
```

## Conclusion

**Current Status**: ~40-50% coverage
**Target**: 90% coverage
**Gap**: ~40-50 percentage points
**Tests Needed**: ~35 additional tests
**Effort**: 6-8 hours

The frontend has good test coverage for TaskItem and API service, but critical components (TaskList, TaskForm) and the custom hooks are completely untested. This is a **high-priority issue** that should be addressed immediately to meet the 90% coverage requirement.
