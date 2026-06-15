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
