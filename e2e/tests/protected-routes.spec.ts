import { test, expect, ALICE } from '../fixtures/test';
import { AUTH_TOKEN_KEY, AUTH_USERNAME_KEY } from '../support/constants';

test.describe('Protected routes & 401 handling', () => {
  test('2.1 visiting / unauthenticated redirects to /login without task UI flicker', async ({
    page,
    taskListPage,
    loginPage,
  }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.username).toBeVisible();
    // The protected task UI must never have rendered.
    await expect(taskListPage.heading).toHaveCount(0);
  });

  test('2.2 direct-navigating to / with no token redirects to /login', async ({
    page,
    loginPage,
  }) => {
    // Ensure storage is empty, then deep-link straight to the protected route.
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/');

    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.username).toBeVisible();
  });

  test('2.3 an invalid token on an API call clears auth and redirects to /login', async ({
    page,
    loginPage,
  }) => {
    // Seed a username (so the client believes it is authenticated) plus a
    // structurally-bogus token, then load /. TaskList fetches, the API returns
    // 401, and the response interceptor must clear auth + redirect.
    await page.addInitScript(
      ({ tokenKey, usernameKey, username }) => {
        window.localStorage.setItem(tokenKey, 'not-a-real-jwt');
        window.localStorage.setItem(usernameKey, username);
      },
      { tokenKey: AUTH_TOKEN_KEY, usernameKey: AUTH_USERNAME_KEY, username: ALICE.username },
    );

    await page.goto('/');

    // The redirect to /login is the observable proof that the 401 response
    // interceptor fired (clearAuthStorage + redirect). We don't assert on
    // localStorage here: the addInitScript above re-runs on the /login load and
    // would re-seed the token, masking the interceptor's clear.
    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.username).toBeVisible();
  });

  test('2.4 a tampered token returns 401 and redirects to /login', async ({
    page,
    api,
    loginPage,
  }) => {
    // Start from a real token, then corrupt its signature so the backend rejects it.
    const auth = await api.login(ALICE);
    const tampered = `${auth.token.slice(0, -4)}AAAA`;
    await page.addInitScript(
      ({ tokenKey, usernameKey, token, username }) => {
        window.localStorage.setItem(tokenKey, token);
        window.localStorage.setItem(usernameKey, username);
      },
      {
        tokenKey: AUTH_TOKEN_KEY,
        usernameKey: AUTH_USERNAME_KEY,
        token: tampered,
        username: ALICE.username,
      },
    );

    await page.goto('/');

    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.username).toBeVisible();
  });

  test('2.5 back-button after redirect does not re-enter the protected route', async ({
    page,
    loginPage,
  }) => {
    // First land somewhere real so there is history to go "back" to.
    await page.goto('/login');
    await expect(loginPage.username).toBeVisible();

    // Now hit the protected route unauthenticated; ProtectedRoute uses
    // <Navigate replace>, so /login replaces / in history.
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);

    await page.goBack();

    // Because the redirect used replace, going back must not return to /.
    await expect(page).not.toHaveURL(/localhost:3000\/$/);
    await expect(loginPage.username).toBeVisible();
  });
});
