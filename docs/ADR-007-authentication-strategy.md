# ADR-007: Authentication Strategy

**Status:** Proposed
**Date:** 2026-06-10
**Deciders:** mml2 (solo developer)

## Context

The Ezra Todo app (.NET Core API + React SPA, SQLite) currently has no authentication — all endpoints are anonymous. The app is a take-home assignment for an interview: it will never be deployed to production, must be completed within 4 days by a single developer, and is evaluated on clean architecture, production-ready thinking, and clear documentation rather than feature breadth.

Forces at play: implementation time is the scarcest resource; the evaluators reward demonstrated understanding of trade-offs more than a hardened auth system; the existing codebase uses the Result<T> pattern, FluentValidation, xUnit integration tests via WebApplicationFactory, and a 90% coverage requirement — any auth choice must be testable within that harness.

## Decision

Implement **JWT bearer authentication** using ASP.NET Core's built-in `JwtBearer` middleware, with a single `/api/auth/login` endpoint issuing short-lived tokens (60 min) signed with a symmetric key from configuration. Document the production migration path (httpOnly cookies or BFF pattern) in the README rather than building it.

## Options Considered

### Option A: JWT bearer tokens (chosen)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low — one NuGet package, ~50 lines of setup |
| Cost | None |
| Scalability | High — stateless, no server session store |
| Team familiarity | High — standard interview/demo pattern |

**Pros:** Fastest to implement and demo; trivially testable (add `Authorization` header in xUnit integration tests); stateless fits the existing repository/service architecture; Swagger-friendly.
**Cons:** Token storage in the SPA is the classic weakness — localStorage is XSS-exposed (the project's own CLAUDE.md flags this); no built-in revocation; symmetric key management is hand-rolled.

### Option B: ASP.NET Core Identity + cookie sessions

| Dimension | Assessment |
|-----------|------------|
| Complexity | Medium — Identity tables, EF migrations, cookie config, CORS credentials |
| Cost | None |
| Scalability | Medium — server-affinity or shared session store needed at scale |
| Team familiarity | Medium |

**Pros:** Most secure-by-default for a same-origin SPA (httpOnly, SameSite cookies — no JS-accessible token); password hashing, lockout, and user management included.
**Cons:** Heaviest setup for 4 days; Identity schema bloats a SQLite demo database; cookie auth in WebApplicationFactory integration tests is fiddlier; `AllowCredentials` CORS changes ripple into the frontend.

### Option C: Hosted OAuth provider (Auth0 / Clerk)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low code, medium integration |
| Cost | Free tier sufficient |
| Scalability | High — fully managed |
| Team familiarity | Medium |

**Pros:** Production-grade security with minimal code; demonstrates familiarity with managed services.
**Cons:** External dependency makes the take-home harder for evaluators to run locally (tenant config, env keys); offline demo breaks; the interesting engineering is hidden inside the vendor, which weakens what the assignment is meant to showcase.

### Option D: No auth, documented as out of scope

**Pros:** Zero time cost; arguably honest for a never-deployed demo.
**Cons:** Misses a chance to demonstrate security thinking; assignment evaluators commonly probe how candidates handle authz boundaries.

## Trade-off Analysis

The core trade-off is **demo-friendliness vs. browser-security correctness**. Option B is what a production same-origin SPA should use — the project's own security checklist says tokens belong in httpOnly cookies. But Option B's cost lands exactly where the budget is tightest: setup time and test friction. Option A inverts that — weakest default token-storage story, but the cheapest to build, the easiest for an evaluator to exercise in Swagger or curl, and the easiest to hold to the 90% coverage bar. Given the app will never face real users, the XSS exposure is theoretical, while the 4-day deadline is not. Option A with an explicitly documented production caveat demonstrates more engineering judgment than silently shipping either extreme.

## Consequences

- Easier: protecting endpoints (`[Authorize]`), integration testing with bearer headers, demoing via Swagger.
- Easier: explaining the design — the ADR plus README caveat shows deliberate, constraint-aware judgment.
- Harder: token revocation and refresh are out of scope; logout is client-side only (token discard).
- Revisit: if this ever heads toward real deployment, migrate token storage to httpOnly cookies or adopt a BFF pattern, add refresh tokens, and move the signing key to a secrets manager.

## Action Items

1. [ ] Add `Microsoft.AspNetCore.Authentication.JwtBearer` and configure in `Program.cs`
2. [ ] Add `User` entity + EF migration (hashed passwords via `PasswordHasher<T>`)
3. [ ] `POST /api/auth/login` returning `Result<AuthResponseDto>`; FluentValidation on the DTO
4. [ ] `[Authorize]` on `TasksController`; scope task queries to the authenticated user
5. [ ] Integration tests: 401 without token, 200 with token, cross-user access denied (keep ≥90% coverage)
6. [ ] README: document the localStorage trade-off and production migration path

---

## Implementation Plan (recommendation)

This section turns the decision above into an executable, file-by-file plan. Backend and frontend are independent tracks meant to run in parallel; within each track, order matters. Tracked in beads under the epic `auth: JWT login + per-user task isolation`.

### Requirements → mechanism

| # | Requirement | Mechanism |
|---|-------------|-----------|
| 1 | Username + password login, no MFA | `POST /api/auth/login` |
| 2 | Issue a token on success | JWT signed HMAC-SHA256, symmetric key from config |
| 3 | Unauthenticated → redirect to login with error | axios 401 response interceptor → `/login` |
| 4 | Seed users in DB, passwords encrypted | EF `HasData` seed + `PasswordHasher<User>` (PBKDF2) |
| 5 | Token sent on every request | axios request interceptor adds `Authorization: Bearer` |
| 6 | API returns only the caller's tasks | `UserId` FK on `TodoTask`, all queries scoped by user |
| 7 | Every API validates token + expiry | `[Authorize]` + `JwtBearer` middleware |
| 8 | Token valid 1 hour | `expires = now + 60min`, `ClockSkew = TimeSpan.Zero` |
| 9 | Foreign task → see decision below | service compares `task.UserId` to caller |

### Key decision: 404 (not 403) for a foreign task

Requirement #9 literally specified **403**. We deviate to **404**: returning 403 confirms the task *exists*, letting an attacker enumerate valid IDs by probing. Returning 404 for both "not yours" and "does not exist" makes the two cases indistinguishable to the client, leaking no information. This is a deliberate, documented deviation in favor of the stronger security posture.

### Additional scenarios covered (beyond the 9 requirements)

- **No user enumeration on login:** wrong password and unknown username both return an identical `401` message.
  - *Known limitation (deferred):* the unknown-username path returns before `VerifyHashedPassword` runs, while the wrong-password path pays the PBKDF2 cost. That response-latency difference is a timing side-channel that could still enumerate valid usernames. The mitigation is to verify the supplied password against a fixed dummy hash on the not-found path so both branches take the same time. Left as a documented follow-up: the message-level signal is already removed, and the residual timing signal is low-value against the seeded single-user demo.
- **Owner stamped server-side:** `CreateTask` sets `UserId` from the token, never from the request body.
- **Anonymous endpoints:** `/health` and `POST /api/auth/login` stay `[AllowAnonymous]`; everything else requires auth.
- **Signing key from config**, never hardcoded; README documents the production secrets-manager path.
- **Existing-data migration:** the new required `UserId` column assigns pre-existing tasks to a default seeded user (SQLite demo data is otherwise disposable in dev).
- **Logout** is client-side token discard (no server revocation list) — a documented limitation, consistent with the Consequences section.

### Backend (`backend/TodoApi/`)

New: `Models/User.cs`; `DTOs/LoginDto.cs`, `DTOs/AuthResponseDto.cs`; `Validators/LoginDtoValidator.cs`; `Services/IAuthService.cs` + `AuthService.cs`; `Services/ITokenService.cs` + `TokenService.cs`; `Controllers/AuthController.cs` (`[AllowAnonymous]`); `Data/IUserRepository.cs` + `UserRepository.cs`.

Modified: `Models/TodoTask.cs` (+`UserId`); `Data/TodoDbContext.cs` (`DbSet<User>`, unique `Username` index, `UserId` FK/index, `HasData` user seed); `Data/ITaskRepository.cs` + `TaskRepository.cs` (thread `userId` through all reads, filter `.Where(t => t.UserId == userId)`, stamp owner on create); `Services/ITaskService.cs` + `TaskService.cs` (every method takes `userId`; missing-or-foreign task → `Result.Fail("Task not found", 404)`); `Controllers/TasksController.cs` (`[Authorize]`, extract `userId` from `User.FindFirstValue(ClaimTypes.NameIdentifier)`); `Program.cs` (`AddAuthentication().AddJwtBearer(...)`, `UseAuthentication()` before `UseAuthorization()`, DI for auth services + `PasswordHasher<User>`); `appsettings*.json` (`Jwt` section, `ExpiryMinutes: 60`); new EF migration `AddUsersAndTaskOwnership`.

Reuse: existing `Result<T>`, `MapToDto`, FluentValidation registration, the `public partial class Program` test hook.

### Frontend (`frontend/src/`)

New dep: `react-router-dom`.

New: `types/auth.ts`; `services/auth.ts` (login + token storage helpers); `context/AuthContext.tsx`; `components/Login.tsx` (Zod-validated, Editorial Precision styling); `components/ProtectedRoute.tsx`; `schemas/auth.ts`.

Modified: `services/api.ts` (request interceptor adds bearer; response interceptor on 401 clears token + redirects to `/login`); `App.tsx` (`BrowserRouter` + `AuthProvider`, routes `/login` and protected `/`); `components/TaskList.tsx` (logout button + logged-in username).

Reuse: existing `apiClient` + interceptor scaffold, `renderWithProviders` test util, Zod, Editorial Precision form patterns from `TaskForm.tsx`.

### OpenAPI (`backend/openapi.yaml`)

Add `POST /api/auth/login` (`LoginDto` → 200 `AuthResponseDto`, 401); `securitySchemes.bearerAuth` applied globally with `/auth/login` marked `security: []`; `401` on all `/tasks` paths and `404` on `/tasks/{id}`; schemas `LoginDto` and `AuthResponseDto`. Re-lint with `npx @redocly/cli lint backend/openapi.yaml`.

### Verification

Backend: `dotnet test` green at ≥90% line / 85% branch / 95% service; manual curl checks (no token → 401, valid token → own tasks only, foreign task id → 404, expired token → 401). Frontend: `npm run coverage` ≥90%; manual (unauthenticated `/` → `/login`, login → task list, expired token → bounced). Contract: redocly lint → 0 errors. Git: feature branch off `master`, PR at the end, coverage pre-PR hook must pass.
