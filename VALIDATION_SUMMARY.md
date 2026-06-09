# Input Validation Summary

## Required Fields for Every Task

1. **Title** - Non-empty string (max 200 characters)
2. **Status** - Valid enum: Todo, InProgress, or Done
3. **Priority** - Valid enum: Low, Medium, or High
4. **CreatedAt** - Automatically set timestamp (UTC)

## Backend Validation (TaskService.cs)

### CreateTaskAsync
- ✅ Validates Title is required and non-empty
- ✅ Validates Title max length (200 characters)
- ✅ Validates Description max length (1000 characters)
- ✅ Validates Priority is a valid enum value
- ✅ Automatically sets Status to "Todo"
- ✅ Automatically sets CreatedAt (via repository)

### UpdateTaskAsync
- ✅ Validates Title cannot be empty if provided
- ✅ Validates Title max length if provided
- ✅ Validates Description max length if provided
- ✅ Validates Status is valid enum if provided
- ✅ Validates Priority is valid enum if provided
- ✅ **Preserves existing values** when fields are null (partial updates)
- ✅ Prevents wiping out required fields

### UpdateTaskStatusAsync
- ✅ Validates Status is a valid enum value
- ✅ Preserves all other required fields

## Frontend Validation (TaskForm.tsx)

### Create Mode
- ✅ Title marked as required (*)
- ✅ Title validation: required, max 200 chars
- ✅ Description validation: max 1000 chars
- ✅ Priority marked as required (*) with default "Medium"
- ✅ Status automatically set to "Todo" (not shown in create form)
- ✅ Due date validation: must be future date

### Edit Mode
- ✅ All create validations apply
- ✅ Status field shown and marked as required (*)
- ✅ Cannot submit with empty title
- ✅ Real-time validation feedback

## How to Apply Changes

**The backend needs to be rebuilt and restarted for validation to take effect:**

```bash
# Stop the current backend (Ctrl+C)

# Rebuild
cd backend
dotnet build

# Restart
dotnet run --project TodoApi
```

## Testing Validation

After restarting, test with:

```bash
# Should fail - empty title
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "", "priority": "Medium"}'

# Should succeed - all required fields
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Valid task", "priority": "High"}'

# Should fail - empty title on update
curl -X PUT http://localhost:5000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title": ""}'

# Should succeed - partial update preserves title
curl -X PUT http://localhost:5000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated description"}'
```

## Verification

After restart, all 32+ tasks in the database will maintain:
- ✅ Non-empty Title
- ✅ Valid Status (Todo, InProgress, Done)
- ✅ Valid Priority (Low, Medium, High)
- ✅ CreatedAt timestamp
