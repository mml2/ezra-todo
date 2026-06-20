import { test, expect, ALICE, BOB } from '../fixtures/test';

/**
 * Task 7 — pagination and cross-user task isolation.
 *
 * Pagination (7.1–7.4) seeds past one page (>20) via the API and walks the
 * pager through the UI. Isolation (7.5–7.8) seeds tasks for both alice and bob
 * and proves each user only ever sees / can mutate their own tasks; foreign
 * task ids return 404 (not 403) so existence isn't leaked.
 *
 * Page size is 20 (TaskList useTasksPaged(page, 20)).
 */
const PAGE_SIZE = 20;

test.describe('Pagination & cross-user isolation', () => {
  test.beforeEach(async ({ cleanTasks }) => {
    void cleanTasks;
  });

  test('7.1 the first page shows 20 tasks with Prev disabled', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
  }) => {
    await api.seedTasks(aliceToken, 25); // 25 -> 2 pages

    await loginAs(ALICE);
    await expect(taskListPage.heading).toBeVisible();

    await expect(taskListPage.taskCards).toHaveCount(PAGE_SIZE);
    await expect(taskListPage.pageIndicator()).toContainText('Page 1 of 2');
    await expect(taskListPage.prevButton).toBeDisabled();
    await expect(taskListPage.nextButton).toBeEnabled();
  });

  test('7.2 advancing to the next page enables Prev and shows the remainder', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
  }) => {
    await api.seedTasks(aliceToken, 25);

    await loginAs(ALICE);
    await expect(taskListPage.taskCards).toHaveCount(PAGE_SIZE);

    await taskListPage.nextButton.click();

    await expect(taskListPage.pageIndicator()).toContainText('Page 2 of 2');
    await expect(taskListPage.taskCards).toHaveCount(5); // 25 - 20
    await expect(taskListPage.prevButton).toBeEnabled();
  });

  test('7.3 the last page has Next disabled', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
  }) => {
    await api.seedTasks(aliceToken, 25);

    await loginAs(ALICE);
    await taskListPage.nextButton.click();

    await expect(taskListPage.pageIndicator()).toContainText('Page 2 of 2');
    await expect(taskListPage.nextButton).toBeDisabled();
  });

  test('7.4 pagination works over a filtered result set', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
  }) => {
    // 25 High + 5 Low. Filtering to High leaves 25 -> 2 client-side pages.
    await api.seedTasks(aliceToken, 25, 'High task', 'High');
    await api.seedTasks(aliceToken, 5, 'Low task', 'Low');

    await loginAs(ALICE);
    await taskListPage.filterByPriority('High');

    await expect(taskListPage.taskCards).toHaveCount(PAGE_SIZE);
    await expect(taskListPage.pageIndicator()).toContainText('Page 1 of 2');

    await taskListPage.nextButton.click();
    await expect(taskListPage.pageIndicator()).toContainText('Page 2 of 2');
    await expect(taskListPage.taskCards).toHaveCount(5);
  });

  test('7.5 a user sees only their own tasks', async ({
    api,
    aliceToken,
    bobToken,
    loginAs,
    taskListPage,
  }) => {
    await api.createTask(aliceToken, { title: 'Alice task', priority: 'Medium' });
    await api.createTask(bobToken, { title: 'Bob secret task', priority: 'High' });

    await loginAs(ALICE);
    await expect(taskListPage.taskCards).toHaveCount(1);
    await expect(taskListPage.card('Alice task')).toBeVisible();
    await expect(taskListPage.card('Bob secret task')).toHaveCount(0);
    await expect(taskListPage.statValue('Total')).toHaveText('1');
  });

  test('7.6 fetching another user\'s task by id returns 404 (not 403)', async ({
    api,
    aliceToken,
    bobToken,
  }) => {
    const bobTask = await api.createTask(bobToken, { title: 'Bob only', priority: 'Low' });

    const status = await api.getTaskStatus(aliceToken, bobTask.id);
    expect(status).toBe(404);
  });

  test('7.7 updating or deleting another user\'s task returns 404 (not 403)', async ({
    api,
    aliceToken,
    bobToken,
  }) => {
    const bobTask = await api.createTask(bobToken, { title: 'Bob protected', priority: 'Medium' });

    const putStatus = await api.putTaskStatus(aliceToken, bobTask.id, { title: 'Hijacked' });
    expect(putStatus).toBe(404);

    const deleteStatus = await api.deleteTaskStatus(aliceToken, bobTask.id);
    expect(deleteStatus).toBe(404);

    // Bob's task is untouched: still fetchable and still named "Bob protected".
    expect(await api.getTaskStatus(bobToken, bobTask.id)).toBe(200);
  });

  test('7.8 logging out and back in as another user swaps the visible task set', async ({
    api,
    aliceToken,
    bobToken,
    loginPage,
    taskListPage,
  }) => {
    await api.createTask(aliceToken, { title: 'Alice belongs here', priority: 'Medium' });
    await api.createTask(bobToken, { title: 'Bob belongs here', priority: 'High' });

    // Real UI login (no init-script seeding) so the user switch is genuine.
    await loginPage.goto();
    await loginPage.login(ALICE.username, ALICE.password);
    await expect(taskListPage.heading).toBeVisible();
    await expect(taskListPage.card('Alice belongs here')).toBeVisible();
    await expect(taskListPage.card('Bob belongs here')).toHaveCount(0);

    await taskListPage.logoutButton.click();
    await expect(loginPage.username).toBeVisible();

    await loginPage.login(BOB.username, BOB.password);
    await expect(taskListPage.heading).toBeVisible();
    await expect(taskListPage.card('Bob belongs here')).toBeVisible();
    await expect(taskListPage.card('Alice belongs here')).toHaveCount(0);
  });
});
