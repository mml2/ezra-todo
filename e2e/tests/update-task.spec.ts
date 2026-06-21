import { test, expect, ALICE } from '../fixtures/test';

/**
 * Task 5 — editing a task (inline form) and inline status/priority updates.
 *
 * Tasks are seeded through the real API, then mutated through the UI so each
 * case exercises the full UI -> API -> DB path with no mocks.
 */

/** A YYYY-MM-DD date `days` from today, for the <input type="date"> field. */
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

test.describe('Edit task & status/priority updates', () => {
  test.beforeEach(async ({ cleanTasks }) => {
    void cleanTasks;
  });

  test('5.1 editing title and description is reflected on the card', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
    taskFormPage,
  }) => {
    await api.createTask(aliceToken, {
      title: 'Original title',
      description: 'Original description',
      priority: 'Medium',
    });

    await loginAs(ALICE);
    const card = taskListPage.card('Original title');
    await taskListPage.cardEditButton(card).click();

    await taskFormPage.title.fill('Edited title');
    await taskFormPage.description.fill('Edited description');
    await taskFormPage.updateSubmit().click();

    const edited = taskListPage.card('Edited title');
    await expect(edited).toBeVisible();
    await expect(edited).toContainText('Edited description');
    await expect(taskListPage.card('Original title')).toHaveCount(0);
  });

  test('5.2 a partial update (priority only) preserves the other fields', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
    taskFormPage,
  }) => {
    await api.createTask(aliceToken, {
      title: 'Keep my fields',
      description: 'Untouched description',
      priority: 'Low',
    });

    await loginAs(ALICE);
    const card = taskListPage.card('Keep my fields');
    await taskListPage.cardEditButton(card).click();

    await taskFormPage.priority.selectOption({ label: 'High Priority' });
    await taskFormPage.updateSubmit().click();

    const updated = taskListPage.card('Keep my fields');
    await expect(updated).toBeVisible();
    await expect(updated).toContainText('Untouched description');
    await expect(taskListPage.cardPriorityPill(updated)).toHaveAttribute('data-priority', 'High');
  });

  test('5.3 clicking the status pill advances Todo -> Active -> Done and updates stats', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
  }) => {
    await api.createTask(aliceToken, { title: 'Marching to done', priority: 'Medium' });

    await loginAs(ALICE);
    const card = taskListPage.card('Marching to done');

    await expect(taskListPage.statValue('To Do')).toHaveText('1');
    await expect(taskListPage.cardStatusBadge(card)).toContainText('To Do');

    // First click: To Do -> Active.
    await taskListPage.advanceStatus(card);
    await expect(taskListPage.cardStatusBadge(card)).toContainText('Active');
    await expect(taskListPage.statValue('Active')).toHaveText('1');
    await expect(taskListPage.statValue('To Do')).toHaveText('0');

    // Second click: Active -> Done.
    await taskListPage.advanceStatus(card);
    await expect(taskListPage.cardStatusBadge(card)).toContainText('Done');
    await expect(taskListPage.statValue('Complete')).toHaveText('1');
    await expect(taskListPage.statValue('Active')).toHaveText('0');
  });

  test('5.4 the priority pill is display-only and reflects an edit made via the form', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
    taskFormPage,
  }) => {
    await api.createTask(aliceToken, { title: 'Priority shift', priority: 'Low' });

    await loginAs(ALICE);
    const card = taskListPage.card('Priority shift');

    // The pill displays the current priority and is not an editable control.
    await expect(taskListPage.cardPriorityPill(card)).toHaveAttribute('data-priority', 'Low');
    await expect(card.locator('select')).toHaveCount(0);

    // Priority changes flow through the Edit form, then re-render the pill.
    await taskListPage.cardEditButton(card).click();
    await taskFormPage.priority.selectOption({ label: 'High Priority' });
    await taskFormPage.updateSubmit().click();

    await expect(taskListPage.cardPriorityPill(card)).toHaveAttribute('data-priority', 'High');
  });

  test('5.5 editing the title to empty is rejected', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
    taskFormPage,
  }) => {
    await api.createTask(aliceToken, { title: 'Has a title', priority: 'Medium' });

    await loginAs(ALICE);
    const card = taskListPage.card('Has a title');
    await taskListPage.cardEditButton(card).click();

    await taskFormPage.title.fill('');
    await taskFormPage.updateSubmit().click();

    await expect(taskFormPage.fieldError('Title is required')).toBeVisible();
    // The original task is untouched and still listed.
    await expect(taskFormPage.title).toBeVisible();
  });

  test('5.6 editing the title beyond 200 characters is rejected', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
    taskFormPage,
  }) => {
    await api.createTask(aliceToken, { title: 'Short title', priority: 'Medium' });

    await loginAs(ALICE);
    const card = taskListPage.card('Short title');
    await taskListPage.cardEditButton(card).click();

    await taskFormPage.title.fill('x'.repeat(201));
    await taskFormPage.updateSubmit().click();

    await expect(
      taskFormPage.fieldError('Title must not exceed 200 characters'),
    ).toBeVisible();
  });

  test('5.7 marking an overdue task Done clears the Overdue badge', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
  }) => {
    // Create with a future due date (create rejects past dates), then PUT a past
    // date — the update validator has no future-date rule — to make it overdue.
    const created = await api.createTask(aliceToken, {
      title: 'Overdue item',
      priority: 'High',
      dueDate: new Date(`${dateOffset(7)}T00:00:00.000Z`).toISOString(),
    });
    await api.updateTask(aliceToken, created.id, {
      title: 'Overdue item',
      dueDate: new Date(`${dateOffset(-3)}T00:00:00.000Z`).toISOString(),
    });

    await loginAs(ALICE);
    const card = taskListPage.card('Overdue item');
    await expect(taskListPage.cardOverdueBadge(card)).toBeVisible();

    // Advance Todo -> Active -> Done via the status pill.
    await taskListPage.advanceStatus(card);
    await expect(taskListPage.cardStatusBadge(card)).toContainText('Active');
    await taskListPage.advanceStatus(card);
    await expect(taskListPage.cardStatusBadge(card)).toContainText('Done');

    await expect(taskListPage.cardOverdueBadge(card)).toHaveCount(0);
  });

  test('5.8 cancelling an edit reverts without persisting', async ({
    api,
    aliceToken,
    loginAs,
    taskListPage,
    taskFormPage,
  }) => {
    await api.createTask(aliceToken, { title: 'Do not change me', priority: 'Medium' });

    await loginAs(ALICE);
    const card = taskListPage.card('Do not change me');
    await taskListPage.cardEditButton(card).click();

    await taskFormPage.title.fill('Should be discarded');
    await taskFormPage.cancelButton().click();

    // Back to display mode with the original title; the typed change is gone.
    await expect(taskListPage.card('Do not change me')).toBeVisible();
    await expect(taskListPage.card('Should be discarded')).toHaveCount(0);

    // Reload to prove nothing was persisted server-side.
    await taskListPage.goto();
    await expect(taskListPage.card('Do not change me')).toBeVisible();
    await expect(taskListPage.card('Should be discarded')).toHaveCount(0);
  });
});
