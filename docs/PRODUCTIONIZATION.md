# Productionization Notes

This document records the production-hardening work that would be needed to take this codebase from a take-home reference implementation to a service running in front of real users. It is deliberately scoped to **architecture and runtime concerns** and excludes CI/CD pipeline work.

Each item states **what exists today**, **the gap**, and **the recommended change**, so the trade-offs are explicit rather than implied. Items are ordered roughly by impact.

> Caching is treated separately in [ADR-008](ADR-008-caching-strategy.md): it was considered and deliberately deferred. The short version is that the read path is already fast for this workload and a cache would add consistency risk without a measured bottleneck to justify it.

---

## 1. Database: SQLite → a networked engine

**Today.** SQLite via EF Core. Single file, zero-config, ideal for the assignment and local development. ADR-001 (recorded in `CLAUDE.md`) already flags its concurrency ceiling.

**Gap.** SQLite serialises writes and tops out at roughly ten concurrent writers. It is a single file on a single host, so it does not survive horizontal scaling or a host failure, and it has no managed backup story.

**Recommendation.** Migrate to PostgreSQL (or SQL Server) for any multi-user deployment. The repository pattern already isolates data access behind `ITaskRepository`, and EF Core makes the provider swap mostly a connection-string and migration-regeneration exercise. This is the single change most likely to *also* make caching worthwhile later — a networked DB has real round-trip latency that a cache can amortise.

---

## 2. Secrets: JWT signing key out of `appsettings`

**Today.** The JWT signing key lives in `appsettings`/environment configuration and is read via `IConfiguration`. Good enough for local dev; the production path is noted but not built.

**Gap.** A signing key in a config file (or a plain env var on the host) is readable by anyone with file or process access and is easy to leak into version control or logs. If it leaks, an attacker can mint valid tokens for any user.

**Recommendation.** Source the key from a managed secrets store (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager, or HashiCorp Vault) injected at startup, never committed. Validate at boot that the key is present and of sufficient length, and fail fast if not. Support key rotation by allowing the validator to accept the previous key for a grace window.

---

## 3. Token storage: localStorage → httpOnly cookie / BFF

**Today.** The frontend stores the JWT in `localStorage` and attaches it via an axios request interceptor. This is already flagged as a known trade-off in the README and ADR-007.

**Gap.** Any successful XSS can read `localStorage` and exfiltrate the token. The token is also visible to all JavaScript on the page, including third-party scripts.

**Recommendation.** Move the token to an `httpOnly`, `Secure`, `SameSite` cookie so JavaScript cannot read it, typically via a thin Backend-for-Frontend that holds the token server-side and proxies API calls. Pair this with CSRF protection (the cookie removes the XSS vector but reintroduces CSRF). This is a meaningful architectural change, not a config flip, which is why it is a recommendation rather than a default.

---

## 4. Token lifecycle: revocation and refresh

**Today.** Tokens are valid for 60 minutes (`ClockSkew = Zero`, so the hour is exact). Logout is client-side only — the token is discarded from storage; the server keeps no revocation list.

**Gap.** A stolen token is valid until it expires, with no way to revoke it server-side. There is also no refresh flow, so a session simply dies at the hour mark and forces a re-login.

**Recommendation.** Introduce short-lived access tokens plus longer-lived refresh tokens, with refresh-token rotation and a server-side revocation/denylist (commonly Redis or a DB table) checked on refresh. This gives real logout-everywhere and stolen-token containment. Note this is the one place a cache-like store (Redis) earns its keep in this system — for a denylist, not for caching task reads.

---

## 5. Observability: logs → metrics, traces, health

**Today.** Structured logging via Serilog is in place. A `/health` endpoint exists and is anonymous.

**Gap.** Logs alone do not answer "is the service healthy and how fast is it right now?" There are no metrics (request rate, latency percentiles, error rate) and no distributed tracing to follow a request across layers.

**Recommendation.** Add OpenTelemetry for metrics and traces, exporting to whatever the deployment target uses (Prometheus/Grafana, Application Insights, Datadog). Split the health check into liveness (process up) and readiness (can reach the DB) probes so an orchestrator can route traffic correctly. Keep Serilog for structured logs and correlate logs to traces via a trace/correlation ID.

---

## 6. Rate limiting and abuse protection

**Today.** Per project guidance, a fixed-window limiter is the intended pattern; the auth endpoint is the most security-sensitive surface.

**Gap.** Without enforced limits, the login endpoint is open to credential-stuffing and brute force, and the API generally is open to scraping/DoS.

**Recommendation.** Apply ASP.NET Core rate limiting, with a *stricter* limit on `POST /api/auth/login` than on read endpoints (login attempts should be counted per-IP and per-username). Return `429` with a `Retry-After` header. Consider an account-lockout/backoff after repeated failures, balanced against the no-user-enumeration property already in place.

---

## 7. Transport security: HTTPS / HSTS

**Today.** HTTPS redirection and HSTS are intended for non-development environments; dev runs over HTTP for convenience.

**Gap.** Tokens and credentials must never traverse plaintext HTTP in production.

**Recommendation.** Enforce `UseHttpsRedirection()` and `UseHsts()` outside development, terminate TLS at the load balancer/ingress, and set `SameSite`/`Secure` on any cookies introduced by item 3. Add the standard security response headers (CSP, `X-Content-Type-Options`, `X-Frame-Options`/frame-ancestors).

---

## 8. Scaling and resilience

**Today.** JWT auth is stateless, so the app servers already hold no per-user session state — a good starting point for horizontal scaling.

**Gap.** The remaining single points of state are the database (item 1) and any future token denylist (item 4). EF Core connection pooling is on by default but is sized for SQLite's single-writer reality.

**Recommendation.** Run multiple stateless app instances behind a load balancer; push all shared state to the networked DB and (if added) Redis. Tune the DB connection pool for the new engine. Add graceful-shutdown handling so in-flight requests drain on deploy. Because auth is stateless, this is mostly an infrastructure exercise rather than an application rewrite.

---

## Summary

The codebase is already structured to make most of these changes low-risk: the repository pattern isolates the DB swap, `Result<T>` keeps error handling consistent, stateless JWT auth makes horizontal scaling tractable, and configuration is already read through `IConfiguration` rather than hardcoded. The highest-leverage first moves for a real deployment are **(1) the database migration** and **(2)/(3) the secret and token-storage hardening** — those address the concrete scaling ceiling and the two largest security exposures, respectively. Caching is intentionally *not* on this list; see ADR-008 for why.
