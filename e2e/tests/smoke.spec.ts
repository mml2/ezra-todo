import { test, expect, ALICE } from '../fixtures/test';
import { BACKEND_URL } from '../support/constants';

test.describe('Harness smoke', () => {
  test('backend /health responds 200', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/health`);
    expect(res.status()).toBe(200);
  });

  test('login page renders', async ({ loginPage }) => {
    await loginPage.goto();
    await expect(loginPage.username).toBeVisible();
    await expect(loginPage.password).toBeVisible();
    await expect(loginPage.submit).toBeVisible();
  });

  test('api fixture can mint a token for a seeded user', async ({ api }) => {
    const auth = await api.login(ALICE);
    expect(auth.token).toBeTruthy();
    expect(auth.username).toBe(ALICE.username);
  });

  test('programmatic login lands on the task list', async ({ loginAs, taskListPage }) => {
    await loginAs(ALICE);
    await expect(taskListPage.heading).toBeVisible();
    await expect(taskListPage.logoutButton).toBeVisible();
  });

  test('cleanTasks leaves the user with an empty task list', async ({
    cleanTasks,
    api,
    aliceToken,
  }) => {
    void cleanTasks;
    const tasks = await api.listAllTasks(aliceToken);
    expect(tasks).toHaveLength(0);
  });
});
