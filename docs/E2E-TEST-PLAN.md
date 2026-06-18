# End-to-End Integration Test Plan — ezra-todo

**Scope:** True end-to-end tests that drive the real React UI in a browser, hit the running ASP.NET Core API over HTTP, and read/write the real SQLite database. No mocks at any layer — UI → API → DB.

**Ground rules (from the request):**
- Tests are **broken down by feature**.
- **One PR per feature** — never a single mega-PR for all tests.
- This document lists **every test case** grouped by feature, the **tech stack**, and a **task breakdown** (one task = one PR).
- **No code is written yet** — this is the plan only.

---

## 1. Recommended tech stack

| Concern | Choice | Why |
|---|---|---|
| **E2E runner** | **Playwright (`@playwright/test`)** | Preferred over Selenium: first-class TypeScript (matches the frontend), auto-waiting (no flaky sleeps), built-in trace viewer + screenshots/video on failure, parallel workers, and a `webServer` config that boots the stack for you. Selenium would need a separate WebDriver, manual waits, and a third-party test runner. |
| **Language** | **TypeScript** | Same language as the frontend; reuses existing types (`TaskResponseDto`, enums) and tsconfig. |
| **Assertions** | Playwright's built-in `expect` (web-first, auto-retrying) | Retries assertions until the UI settles — kills timing flakiness. |
| **API setup/teardown** | Playwright **`request` fixture** (APIRequestContext) | Seed/clean data and mint JWTs directly against `http://localhost:5001/api` for fast, deterministic setup — instead of clicking through the UI for every precondition. |
| **Stack boot** | Playwright **`webServer`** (two entries) | Auto-starts `dotnet run` (backend :5001) and `npm run dev` (frontend :3000); waits for readiness; tears down after. CI and local use the same path. |
| **DB isolation** | Fresh SQLite per run (delete `todoapp.db` → migrate + seed `alice`/`bob`) | Deterministic starting state; each feature suite owns its data. |
| **Reporting** | Playwright HTML reporter + traces on first retry | Self-contained failure artifacts for PR review. |
| **CI hook (later)** | A blocking pre-PR gate that runs the E2E suite | Mirrors the existing coverage/test gates; out of scope for the first PRs but noted in the roadmap. |

**Why not Selenium:** it works, but for a TS/React app it adds friction (WebDriver management, explicit waits, no built-in parallelism or trace viewer) with no offsetting benefit here. Playwright is the better fit.

**Directory convention (proposed):** `e2e/` at repo root, with `e2e/tests/<feature>.spec.ts`, shared helpers in `e2e/fixtures/` and `e2e/support/`, and `playwright.config.ts` at repo root.

---

## 2. Test data & environment assumptions

- Seeded users: **alice** / `Password123!` (UserId 1) and **bob** / `Password123!` (UserId 2).
- Backend: `http://localhost:5001` (5000 is shadowed by the macOS AirPlay Receiver); Frontend: `http://localhost:3000` (Vite proxies `/api` → backend).
- JWT expiry: 60 min. Auth stored in `localStorage` (`ezra_auth_token`, `ezra_auth_username`).
- 404-not-403 for foreign/missing tasks; soft delete (deleted tasks never returned).
- Validation: Title required ≤200, Description ≤1000, DueDate must be in the future on create, Status/Priority enums.

---

## 3. Features and their test cases

Seven features. Each becomes **one task = one branch = one PR**. **Task 0 is foundational** and must merge first (the others depend on its harness).

---

### Task 0 — E2E harness & shared infrastructure *(must merge first)*
**Branch:** `test/e2e-0-harness` · **PR:** "test(e2e): Playwright harness, webServer boot, auth + data fixtures"

Not a feature — the scaffolding every feature suite imports. No feature assertions here beyond one smoke test.

- Install/configure Playwright; `playwright.config.ts` with two `webServer` entries (backend, frontend) and `baseURL`.
- DB reset helper (delete → migrate → seed) run before the suite.
- **Auth fixture**: programmatic login via API to mint a JWT and inject `localStorage` so feature tests start authenticated without re-clicking login.
- **API data fixture**: create/delete tasks for a given user via `request` context (fast preconditions).
- Reusable Page Objects / locators for Login, TaskList, TaskForm, TaskItem.
- **Smoke test:** stack boots, `/login` renders, `/health` returns 200.

---

### Task 1 — Authentication & session (feature: login/logout/session)
**Branch:** `test/e2e-1-auth` · **PR:** "test(e2e): authentication and session flows"

| # | Test case | Expected |
|---|---|---|
| 1.1 | Login with valid credentials (alice) | Redirect to `/`, TaskList renders, username shown in header |
| 1.2 | Login with wrong password | Stays on `/login`, shows generic "Invalid username or password" |
| 1.3 | Login with unknown username | Same generic 401 message (no user enumeration — identical to 1.2) |
| 1.4 | Submit empty username | Client-side Zod validation blocks submit; field error shown |
| 1.5 | Submit empty password | Client-side validation blocks submit; field error shown |
| 1.6 | Submit button disabled while request in flight | Button disabled during submit |
| 1.7 | Session persists across page refresh | Reload `/` while logged in → still authenticated, tasks reload |
| 1.8 | Logout | Click logout → redirect to `/login`, `localStorage` auth cleared |
| 1.9 | After logout, refresh stays logged out | Reload → remains on `/login` |

---

### Task 2 — Protected routing & 401 handling (feature: access control on the client)
**Branch:** `test/e2e-2-protected-routes` · **PR:** "test(e2e): protected routes and 401 redirect handling"

| # | Test case | Expected |
|---|---|---|
| 2.1 | Visit `/` unauthenticated | Redirect to `/login` (no flicker of task UI) |
| 2.2 | Direct-navigate to `/` with no token | Redirect to `/login` |
| 2.3 | Expired/invalid token on an API call | api.ts interceptor clears auth + redirects to `/login` (simulate by corrupting/removing token then triggering a fetch) |
| 2.4 | Tampered token | API returns 401 → redirect to `/login` |
| 2.5 | Back-button after redirect | Protected route uses `replace`; back does not re-enter `/` |

---

### Task 3 — Create task (feature: task creation + create validation)
**Branch:** `test/e2e-3-create-task` · **PR:** "test(e2e): task creation and validation"

| # | Test case | Expected |
|---|---|---|
| 3.1 | Create with all valid fields (title, description, priority, future due date) | 201; task appears at top of list (newest-first); stats update |
| 3.2 | Create with only required field (title) | 201; defaults — Status `Todo`, Priority as selected default (Medium) |
| 3.3 | Submit empty title | Blocked; "title required" error shown |
| 3.4 | Title > 200 chars | Validation error (client and/or 400 surfaced) |
| 3.5 | Description > 1000 chars | Validation error |
| 3.6 | Due date in the past | Validation error ("must be in the future") |
| 3.7 | Due date in the future | Accepted; due date rendered on the card |
| 3.8 | Cancel/toggle create form | Form closes, no task created |
| 3.9 | Created task shows correct priority accent + status badge | Visual state matches selected values |

---

### Task 4 — View, list, filter (feature: task listing + client-side filtering + stats)
**Branch:** `test/e2e-4-list-filter` · **PR:** "test(e2e): task list rendering, filtering, and stats"

| # | Test case | Expected |
|---|---|---|
| 4.1 | List renders user's tasks (seed via API fixture) | All of alice's tasks shown, newest first |
| 4.2 | Empty state (no tasks) | "Your task list is empty" shown |
| 4.3 | Filter by Status = Done | Only Done tasks shown |
| 4.4 | Filter by Priority = High | Only High tasks shown |
| 4.5 | Combined Status + Priority filter (AND logic) | Only tasks matching both |
| 4.6 | Filter with no matches | "No tasks match your filters" shown |
| 4.7 | Clear filters | Resets to full list, page back to 1 |
| 4.8 | Stats counts (Total / To Do / Active / Complete) | Match the rendered tasks; update after a status change |

---

### Task 5 — Update & status change (feature: edit task + inline status/priority)
**Branch:** `test/e2e-5-update-task` · **PR:** "test(e2e): task editing and status/priority updates"

| # | Test case | Expected |
|---|---|---|
| 5.1 | Edit title/description via inline form | 200; card reflects new values |
| 5.2 | Partial update (change only priority) | Other fields preserved |
| 5.3 | Change status via TaskItem dropdown (Todo→InProgress→Done) | PATCH; badge + stats update instantly |
| 5.4 | Change priority via inline select | PUT; accent bar color updates |
| 5.5 | Edit title to empty | Validation error; update rejected |
| 5.6 | Edit title > 200 chars | Validation error |
| 5.7 | Mark overdue task as Done | "OVERDUE" indicator clears (overdue only shows when not Done) |
| 5.8 | Cancel edit | Reverts to display mode, no change persisted |

---

### Task 6 — Delete task (feature: deletion + soft-delete behavior)
**Branch:** `test/e2e-6-delete-task` · **PR:** "test(e2e): task deletion and soft-delete verification"

| # | Test case | Expected |
|---|---|---|
| 6.1 | Delete with confirm | 204; task removed from list; stats decrement |
| 6.2 | Delete, then cancel confirmation dialog | Task remains |
| 6.3 | Deleted task stays gone after refresh | Soft-deleted task not returned by API on reload |
| 6.4 | Re-access deleted task id via API | 404 (soft delete excludes it) |

---

### Task 7 — Pagination & cross-user isolation (feature: pagination + multi-user security)
**Branch:** `test/e2e-7-pagination-isolation` · **PR:** "test(e2e): pagination and cross-user task isolation"

Split rationale: both need bulk/secondary-user data seeded via the API fixture, so they share setup.

**Pagination**
| # | Test case | Expected |
|---|---|---|
| 7.1 | Seed >20 tasks, load page 1 | 20 shown; "Page 1 of N (total)"; Prev disabled |
| 7.2 | Next page | Page 2 shown; Prev enabled |
| 7.3 | Last page | Next disabled |
| 7.4 | Pagination over filtered results | Client-side paging of filtered set works |

**Cross-user isolation (security)**
| # | Test case | Expected |
|---|---|---|
| 7.5 | alice sees only alice's tasks | bob's tasks never appear |
| 7.6 | alice requests bob's task id via API | 404 (not 403) |
| 7.7 | alice PUT/DELETE bob's task id via API | 404 (not 403) |
| 7.8 | Log out alice, log in bob | bob sees only bob's tasks |

---

## 4. Task → PR summary (execution order)

| Order | Task | Branch | Depends on | One PR |
|---|---|---|---|---|
| 1 | Harness & fixtures | `test/e2e-0-harness` | — | ✅ |
| 2 | Authentication & session | `test/e2e-1-auth` | Task 0 | ✅ |
| 3 | Protected routes & 401 | `test/e2e-2-protected-routes` | Task 0 | ✅ |
| 4 | Create task | `test/e2e-3-create-task` | Task 0 | ✅ |
| 5 | List & filter | `test/e2e-4-list-filter` | Task 0 | ✅ |
| 6 | Update & status | `test/e2e-5-update-task` | Task 0 | ✅ |
| 7 | Delete | `test/e2e-6-delete-task` | Task 0 | ✅ |
| 8 | Pagination & isolation | `test/e2e-7-pagination-isolation` | Task 0 | ✅ |

**Sequencing:** Task 0 merges first (everything imports its harness). Tasks 1–7 are independent of each other and can be developed in parallel once Task 0 is in, each as its own feature branch + PR per the standing rule (feature branch → PR, never commit to master directly).

---

## 5. Out of scope (noted, not built in these PRs)

- Wiring the E2E suite into a blocking pre-PR/CI gate (separate follow-up, mirrors existing coverage gates).
- Visual regression / screenshot-diff baselines.
- JWT *actual* 60-min expiry via wall-clock wait (simulated via token removal/tampering instead of waiting an hour).
- Performance/load testing.
