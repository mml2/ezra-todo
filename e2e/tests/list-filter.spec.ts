import { test, expect, ALICE } from '../fixtures/test';

/**
 * Task 4 — list rendering, status/priority filtering, and the stats tiles.
 *
 * Tasks are seeded through the real API (fast, deterministic) and asserted
 * through the UI. The API creates everything as Todo, so non-Todo seeds are
 * promoted with a follow-up PATCH /tasks/{id}/status (see ApiClient.updateTaskStatus).
 */
test.describe('List, filter & stats', () => {
  test.beforeEach(async ({ cleanTasks }) => {
    void cleanTasks;
  });

  test('4.1 list renders the user\'s tasks newest-first', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
  }) => {
    // Created oldest -> newest; the list shows newest at the top.
    await api.createTask(aliceToken, { title: 'Oldest task', priority: 'Low' });
    await api.createTask(aliceToken, { title: 'Middle task', priority: 'Medium' });
    await api.createTask(aliceToken, { title: 'Newest task', priority: 'High' });

    await loginAs(ALICE);
    await expect(taskListPage.heading).toBeVisible();

    await expect(taskListPage.taskCards).toHaveCount(3);
    await expect(taskListPage.taskCards.nth(0)).toContainText('Newest task');
    await expect(taskListPage.taskCards.nth(1)).toContainText('Middle task');
    await expect(taskListPage.taskCards.nth(2)).toContainText('Oldest task');
  });

  test('4.2 an empty list shows the empty state', async ({ loginAs, taskListPage }) => {
    await loginAs(ALICE);
    await expect(taskListPage.heading).toBeVisible();

    await expect(taskListPage.taskCards).toHaveCount(0);
    await expect(taskListPage.page.getByText('Your task list is empty')).toBeVisible();
  });

  test('4.3 filtering by Status = Done shows only Done tasks', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
  }) => {
    await api.createTask(aliceToken, { title: 'Still todo', priority: 'Low' });
    const done = await api.createTask(aliceToken, { title: 'Finished it', priority: 'Medium' });
    await api.updateTaskStatus(aliceToken, done.id, 'Done');

    await loginAs(ALICE);
    await expect(taskListPage.heading).toBeVisible();
    await expect(taskListPage.taskCards).toHaveCount(2);

    await taskListPage.filterByStatus('Done');

    await expect(taskListPage.taskCards).toHaveCount(1);
    await expect(taskListPage.taskCards.first()).toContainText('Finished it');
  });

  test('4.4 filtering by Priority = High shows only High tasks', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
  }) => {
    await api.createTask(aliceToken, { title: 'Low item', priority: 'Low' });
    await api.createTask(aliceToken, { title: 'High item', priority: 'High' });

    await loginAs(ALICE);
    await expect(taskListPage.heading).toBeVisible();
    await expect(taskListPage.taskCards).toHaveCount(2);

    await taskListPage.filterByPriority('High');

    await expect(taskListPage.taskCards).toHaveCount(1);
    await expect(taskListPage.taskCards.first()).toContainText('High item');
  });

  test('4.5 combined Status + Priority filters apply AND logic', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
  }) => {
    // Only this one is both Done AND High.
    const target = await api.createTask(aliceToken, { title: 'Done and high', priority: 'High' });
    await api.updateTaskStatus(aliceToken, target.id, 'Done');
    // Matches each filter individually, but not both.
    await api.createTask(aliceToken, { title: 'Todo and high', priority: 'High' });
    const doneLow = await api.createTask(aliceToken, { title: 'Done but low', priority: 'Low' });
    await api.updateTaskStatus(aliceToken, doneLow.id, 'Done');

    await loginAs(ALICE);
    await expect(taskListPage.heading).toBeVisible();
    await expect(taskListPage.taskCards).toHaveCount(3);

    await taskListPage.filterByStatus('Done');
    await taskListPage.filterByPriority('High');

    await expect(taskListPage.taskCards).toHaveCount(1);
    await expect(taskListPage.taskCards.first()).toContainText('Done and high');
  });

  test('4.6 a filter with no matches shows the no-match empty state', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
  }) => {
    // One Todo/Low task: filtering for High yields nothing.
    await api.createTask(aliceToken, { title: 'Only a low task', priority: 'Low' });

    await loginAs(ALICE);
    await expect(taskListPage.heading).toBeVisible();
    await expect(taskListPage.taskCards).toHaveCount(1);

    await taskListPage.filterByPriority('High');

    await expect(taskListPage.taskCards).toHaveCount(0);
    await expect(
      taskListPage.page.getByText('No tasks match your filters'),
    ).toBeVisible();
  });

  test('4.7 clearing filters restores the full list', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
  }) => {
    await api.createTask(aliceToken, { title: 'Low one', priority: 'Low' });
    await api.createTask(aliceToken, { title: 'High one', priority: 'High' });

    await loginAs(ALICE);
    await expect(taskListPage.heading).toBeVisible();

    await taskListPage.filterByPriority('High');
    await expect(taskListPage.taskCards).toHaveCount(1);

    await taskListPage.clearFiltersButton().click();

    await expect(taskListPage.taskCards).toHaveCount(2);
    await expect(taskListPage.statusFilter).toHaveValue('All');
    await expect(taskListPage.priorityFilter).toHaveValue('All');
  });

  test('4.8 stats tiles count tasks by status and update after a status change', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
  }) => {
    await api.createTask(aliceToken, { title: 'Todo A', priority: 'Low' });
    await api.createTask(aliceToken, { title: 'Todo B', priority: 'Medium' });
    const inProgress = await api.createTask(aliceToken, { title: 'Active one', priority: 'High' });
    await api.updateTaskStatus(aliceToken, inProgress.id, 'InProgress');
    const done = await api.createTask(aliceToken, { title: 'Done one', priority: 'Low' });
    await api.updateTaskStatus(aliceToken, done.id, 'Done');

    await loginAs(ALICE);
    await expect(taskListPage.heading).toBeVisible();
    await expect(taskListPage.taskCards).toHaveCount(4);

    await expect(taskListPage.statValue('Total')).toHaveText('4');
    await expect(taskListPage.statValue('To Do')).toHaveText('2');
    await expect(taskListPage.statValue('Active')).toHaveText('1');
    await expect(taskListPage.statValue('Complete')).toHaveText('1');

    // Promote a Todo task to Done via the in-card status pill (To Do -> Active
    // -> Done, one click each); stats follow.
    const todoCard = taskListPage.card('Todo A');
    await taskListPage.advanceStatus(todoCard);
    await expect(taskListPage.cardStatusBadge(todoCard)).toHaveText('Active');
    await taskListPage.advanceStatus(todoCard);
    await expect(taskListPage.cardStatusBadge(todoCard)).toHaveText('Done');

    await expect(taskListPage.statValue('To Do')).toHaveText('1');
    await expect(taskListPage.statValue('Complete')).toHaveText('2');
    await expect(taskListPage.statValue('Total')).toHaveText('4');
  });
});
