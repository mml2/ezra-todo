import { test, expect, ALICE } from '../fixtures/test';

/**
 * Task 6 — task deletion and soft-delete behaviour.
 *
 * Deletion is guarded by a browser confirm() dialog (TaskItem). The backend
 * soft-deletes (IsDeleted flag + global query filter), so a deleted task must
 * stay gone across a reload and return 404 when fetched by id.
 */
test.describe('Delete task & soft-delete', () => {
  test.beforeEach(async ({ cleanTasks }) => {
    void cleanTasks;
  });

  test('6.1 deleting with confirmation removes the task and decrements stats', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
    page,
  }) => {
    await api.createTask(aliceToken, { title: 'Keep me', priority: 'Low' });
    await api.createTask(aliceToken, { title: 'Delete me', priority: 'High' });

    await loginAs(ALICE);
    await expect(taskListPage.taskCards).toHaveCount(2);
    await expect(taskListPage.statValue('Total')).toHaveText('2');

    page.once('dialog', (dialog) => dialog.accept());
    await taskListPage.cardDeleteButton(taskListPage.card('Delete me')).click();

    await expect(taskListPage.card('Delete me')).toHaveCount(0);
    await expect(taskListPage.taskCards).toHaveCount(1);
    await expect(taskListPage.statValue('Total')).toHaveText('1');
  });

  test('6.2 dismissing the confirmation keeps the task', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
    page,
  }) => {
    await api.createTask(aliceToken, { title: 'Survivor', priority: 'Medium' });

    await loginAs(ALICE);
    await expect(taskListPage.taskCards).toHaveCount(1);

    page.once('dialog', (dialog) => dialog.dismiss());
    await taskListPage.cardDeleteButton(taskListPage.card('Survivor')).click();

    await expect(taskListPage.card('Survivor')).toBeVisible();
    await expect(taskListPage.taskCards).toHaveCount(1);
  });

  test('6.3 a deleted task stays gone after a reload', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
    page,
  }) => {
    await api.createTask(aliceToken, { title: 'Gone for good', priority: 'Low' });

    await loginAs(ALICE);
    await expect(taskListPage.taskCards).toHaveCount(1);

    page.once('dialog', (dialog) => dialog.accept());
    await taskListPage.cardDeleteButton(taskListPage.card('Gone for good')).click();
    await expect(taskListPage.card('Gone for good')).toHaveCount(0);

    await taskListPage.goto();
    await expect(taskListPage.heading).toBeVisible();
    await expect(taskListPage.card('Gone for good')).toHaveCount(0);
    await expect(
      taskListPage.page.getByText('Your task list is empty'),
    ).toBeVisible();
  });

  test('6.4 fetching a soft-deleted task by id returns 404', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
    page,
  }) => {
    const task = await api.createTask(aliceToken, { title: 'Soft delete me', priority: 'High' });

    // Sanity: it exists before deletion.
    expect(await api.getTaskStatus(aliceToken, task.id)).toBe(200);

    await loginAs(ALICE);
    page.once('dialog', (dialog) => dialog.accept());
    await taskListPage.cardDeleteButton(taskListPage.card('Soft delete me')).click();
    await expect(taskListPage.card('Soft delete me')).toHaveCount(0);

    // The soft-delete query filter excludes it, so the API reports 404.
    expect(await api.getTaskStatus(aliceToken, task.id)).toBe(404);
  });
});
