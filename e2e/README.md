# E2E Integration Tests

True end-to-end tests that drive the React UI in a real browser, hit the running
ASP.NET Core API over HTTP, and read/write the real SQLite database. No mocks at
any layer (UI → API → DB).

See [`docs/E2E-TEST-PLAN.md`](../docs/E2E-TEST-PLAN.md) for the full feature/test breakdown.

## Stack

- **Playwright** (`@playwright/test`) + TypeScript
- Playwright `webServer` boots both apps automatically (backend :5001, frontend :3000)
- Seeded users: `alice` / `Password123!`, `bob` / `Password123!`

## Running

```bash
cd e2e
npm install
npx playwright install chromium   # one-time browser download
npm test                          # boots both servers, runs all specs
npm run test:headed               # watch it drive the browser
npm run report                    # open the last HTML report
```

If you already have the backend and frontend running locally, Playwright reuses
them (outside CI).

## Layout

```
e2e/
  playwright.config.ts   # webServer boot + project config
  fixtures/test.ts       # api client, token + login fixtures, page objects, cleanTasks
  support/
    constants.ts         # URLs, localStorage keys, seeded users
    api-client.ts        # HTTP client for fast precondition setup
    pages/               # Login / TaskList / TaskForm page objects
  tests/                 # one spec file per feature
```

## Conventions for feature suites (Tasks 1–7)

- Import `test` / `expect` from `../fixtures/test`.
- Use `loginAs(user)` to start authenticated; use the `api` client to seed data.
- Add `cleanTasks` as a fixture dependency to start from an empty task list.
- Locate elements via the page objects, not raw selectors.
