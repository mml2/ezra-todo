import { test, expect, ALICE } from '../fixtures/test';
import { AUTH_TOKEN_KEY, AUTH_USERNAME_KEY } from '../support/constants';

test.describe('Authentication & session', () => {
  test('1.1 login with valid credentials redirects to the task list', async ({
    loginPage,
    taskListPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(ALICE.username, ALICE.password);

    await expect(taskListPage.heading).toBeVisible();
    await expect(taskListPage.usernameInHeader(ALICE.username)).toBeVisible();
    await expect(loginPage.page).toHaveURL(/\/$/);
  });

  test('1.2 wrong password shows a generic error and stays on /login', async ({
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(ALICE.username, 'WrongPassword!');

    await expect(loginPage.submitError()).toBeVisible();
    await expect(loginPage.page).toHaveURL(/\/login$/);
  });

  test('1.3 unknown username shows the identical generic error (no enumeration)', async ({
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.login('nobody', ALICE.password);

    // Same message as 1.2 — the client must not reveal which field was wrong.
    await expect(loginPage.submitError()).toBeVisible();
    await expect(loginPage.page).toHaveURL(/\/login$/);
  });

  test('1.4 empty username is blocked client-side', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('', ALICE.password);

    await expect(loginPage.fieldError('Username is required')).toBeVisible();
    await expect(loginPage.page).toHaveURL(/\/login$/);
  });

  test('1.5 empty password is blocked client-side', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(ALICE.username, '');

    await expect(loginPage.fieldError('Password is required')).toBeVisible();
    await expect(loginPage.page).toHaveURL(/\/login$/);
  });

  test('1.6 submit button is disabled while the request is in flight', async ({
    page,
    loginPage,
  }) => {
    // Delay the login response so the in-flight (disabled) state is observable.
    await page.route('**/api/auth/login', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    await loginPage.goto();
    await loginPage.username.fill(ALICE.username);
    await loginPage.password.fill(ALICE.password);
    await loginPage.submit.click();

    await expect(loginPage.submit).toBeDisabled();
  });

  test('1.7 session persists across a page refresh', async ({
    loginAs,
    taskListPage,
  }) => {
    await loginAs(ALICE);
    await expect(taskListPage.heading).toBeVisible();

    await taskListPage.page.reload();

    await expect(taskListPage.heading).toBeVisible();
    await expect(taskListPage.usernameInHeader(ALICE.username)).toBeVisible();
  });

  test('1.8 logout clears auth storage and redirects to /login', async ({
    loginAs,
    taskListPage,
    loginPage,
  }) => {
    await loginAs(ALICE);
    await expect(taskListPage.logoutButton).toBeVisible();

    await taskListPage.logoutButton.click();

    await expect(loginPage.page).toHaveURL(/\/login$/);
    await expect(loginPage.username).toBeVisible();

    const token = await taskListPage.page.evaluate(
      (key) => window.localStorage.getItem(key),
      AUTH_TOKEN_KEY,
    );
    const username = await taskListPage.page.evaluate(
      (key) => window.localStorage.getItem(key),
      AUTH_USERNAME_KEY,
    );
    expect(token).toBeNull();
    expect(username).toBeNull();
  });

  test('1.9 after logout, a refresh stays logged out', async ({
    loginAs,
    taskListPage,
    loginPage,
  }) => {
    await loginAs(ALICE);
    await taskListPage.logoutButton.click();
    await expect(loginPage.page).toHaveURL(/\/login$/);

    await loginPage.page.reload();

    await expect(loginPage.page).toHaveURL(/\/login$/);
    await expect(loginPage.username).toBeVisible();
  });
});
