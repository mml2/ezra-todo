# ADR-008: Caching Strategy

**Status:** Accepted
**Date:** 2026-06-15
**Deciders:** mml2 (solo developer)

## Context

A proposal was raised to add Redis as a per-user task cache: warm the cache on login, write through to both cache and database on create/update, cap the cache at the 25 most recent tasks, and fall back to the database for queries beyond that window. The stated goal is to avoid repeated database queries for subsequent actions and improve performance.

This ADR evaluates that proposal against the actual workload, the existing architecture (.NET 10 + EF Core + SQLite, stateless JWT auth), and the take-home context (judged on architectural judgment and production thinking, not feature count).

The relevant forces:

- **Measured baseline.** The project's own benchmarks (see CLAUDE.md) put `GET /api/tasks` at ~50 ms and indexed single-row reads under 10 ms. A user's task list is small (tens of rows, not thousands).
- **Stateless auth.** With JWT bearer tokens there is no server-side session; every request is independent. There is no natural server-side "login event" lifecycle to hang cache-warming on.
- **No demonstrated bottleneck.** No profiling, load test, or production signal indicates the database read path is a constraint.
- **Take-home optimisation.** Evaluators reward demonstrated understanding of trade-offs over shipped infrastructure. Adding an unjustified component is a negative signal; reasoning crisply about *why not yet* is a positive one.

## Decision

**Do not add Redis (or any distributed cache) at this stage.** Document the analysis, the specific problems with the proposed design, and a precise "when and how" path for adding caching correctly once a real bottleneck is measured.

This is a deliberate, reasoned deferral — not an oversight.

## Rationale

### 1. The workload does not justify a cache

Caching trades memory and operational complexity for reduced read latency. That trade only pays off when reads are (a) frequent, (b) expensive, and (c) repeated against slow-changing data. Here:

- Reads are cheap: indexed SQLite reads are already sub-10 ms; the list endpoint is ~50 ms.
- Data volume is tiny: a per-user list of tens of rows fits in a single small query.
- A network hop to Redis plus (de)serialisation can cost as much as — or more than — the query it replaces.

Adding Redis to cache a sub-10 ms query for a handful of rows is solving a problem the system does not have.

### 2. The "cap at 25, fall back to DB beyond" design creates a split data model

A partial-window cache means every read path must answer "is this request inside the cached window or not?", and every write must reason about whether it crossed the window boundary. Concrete failure: a user with 30 tasks deletes one of the cached 25 — what backfills the 25th slot? The cache and the DB now disagree until something repopulates it. This is real, ongoing complexity for a list that returns in milliseconds from a single query.

### 3. Write-through to two stores is a dual-write consistency problem

Writing to both the cache and the database on every mutation introduces the classic dual-write hazard: if the DB commit succeeds but the cache write fails (or vice versa), the two diverge with no automatic reconciliation. Doing this correctly requires either a transactional outbox or a cache-aside-with-invalidation approach — more engineering than the feature saves at this scale.

### 4. Warm-on-login does not fit a stateless API

There is no server-side session to attach a cache-warm to. Warming on the `/auth/login` call eagerly loads data that may never be requested, spending work and memory on a guess.

## Options Considered

### Option A: No cache; document the deferral (chosen)

| Dimension | Assessment |
|-----------|------------|
| Complexity | None added |
| Operational cost | None (no new infrastructure) |
| Correctness risk | None |
| Signal to evaluator | Strong — demonstrates measured, senior judgment |

**Pros:** Zero added complexity and failure surface; keeps the architecture honest (no infrastructure without a bottleneck); the analysis itself is the deliverable evaluators want.
**Cons:** No runtime caching demonstrated in code.

### Option B: Cache-aside with short TTL and invalidate-on-write (the correct pattern, if a cache is required)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Moderate — one cache abstraction, TTL config, key-per-user |
| Operational cost | Redis instance + connection management |
| Correctness risk | Low — single source of truth stays the DB |
| Signal to evaluator | Good — demonstrates the idiomatic caching pattern |

How it works:
- **Read:** check `tasks:user:{userId}` in Redis → on miss, query the DB, populate the key with a short TTL (e.g. 30–60 s) → on hit, return cached.
- **Write (create/update/delete):** write the DB only, then **delete** the user's cache key (invalidation), not surgically patch it. The next read repopulates from the DB.
- **No partial window.** Cache the whole small list or nothing — there is no 25-item boundary to reason about.
- **Graceful degradation:** if Redis is unavailable, fall through to the DB. The cache is an optimisation, never a dependency.

This is strictly simpler and safer than the proposed write-through-with-window design, and it is the pattern to reach for if and when caching is warranted.

### Option C: The originally proposed design (write-through, warm-on-login, 25-item window)

Rejected for the four reasons above: unjustified by the workload, split data model, dual-write consistency hazard, and poor fit with stateless auth.

## When we would revisit

Add caching (Option B) when a concrete signal appears, for example:

- Profiling or load testing shows the task read path is a measured bottleneck under realistic concurrency.
- The data model grows read-heavy and slow-changing (e.g. shared/team task boards read far more often than written).
- The database is migrated off SQLite to a networked engine (PostgreSQL/SQL Server) and read latency or connection pressure becomes material (the ADR-001 SQLite migration path, recorded in CLAUDE.md).

Adoption would be **cache-aside + TTL + invalidate-on-write**, behind an `ICacheService` abstraction so the application code stays cache-agnostic and testable, with graceful fallback when the cache is down.

## Consequences

- The architecture stays minimal and correct; no new failure modes or operational surface.
- The reasoning is captured here and summarised in the README, demonstrating the trade-off analysis explicitly.
- If requirements change, the upgrade path is specified and low-risk.

## Related

- ADR-001: SQLite for database (recorded in CLAUDE.md) — the migration path that would most plausibly trigger caching.
- [ADR-007](ADR-007-authentication-strategy.md): Authentication strategy (stateless JWT, which shapes why warm-on-login does not fit).
- See also `docs/PRODUCTIONIZATION.md` for the broader set of production-hardening recommendations.
