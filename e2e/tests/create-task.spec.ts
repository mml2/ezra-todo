import { test, expect, ALICE } from '../fixtures/test';

/** A YYYY-MM-DD date `days` from today, for the <input type="date"> field. */
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/** "Mon D, YYYY" — matches the card's toLocaleDateString('en-US', short month). */
function formatCardDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

test.describe('Create task & validation', () => {
  test.beforeEach(async ({ cleanTasks, loginAs, taskListPage }) => {
    void cleanTasks;
    await loginAs(ALICE);
    await expect(taskListPage.heading).toBeVisible();
  });

  test('3.1 create with all valid fields appears at top of list and updates stats', async ({
    taskListPage,
    taskFormPage,
  }) => {
    const title = 'Quarterly report';
    await taskListPage.openCreateForm();
    await taskFormPage.title.fill(title);
    await taskFormPage.description.fill('Compile Q2 numbers');
    await taskFormPage.priority.selectOption({ label: 'High Priority' });
    await taskFormPage.dueDate.fill(dateOffset(7));
    await taskFormPage.createSubmit().click();

    const firstCard = taskListPage.taskCards.first();
    await expect(firstCard).toContainText(title);
    await expect(taskListPage.statValue('Total')).toHaveText('1');
    await expect(taskListPage.statValue('To Do')).toHaveText('1');
  });

  test('3.2 create with only a title defaults to Todo status and Medium priority', async ({
    taskListPage,
    taskFormPage,
  }) => {
    const title = 'Minimal task';
    await taskListPage.openCreateForm();
    await taskFormPage.title.fill(title);
    await taskFormPage.createSubmit().click();

    const card = taskListPage.card(title);
    await expect(card).toBeVisible();
    await expect(taskListPage.cardStatusBadge(card)).toContainText('To Do');
    await expect(taskListPage.cardPrioritySelect(card)).toHaveValue('Medium');
  });

  test('3.3 empty title is blocked with a required error', async ({
    taskListPage,
    taskFormPage,
  }) => {
    await taskListPage.openCreateForm();
    await taskFormPage.createSubmit().click();

    await expect(taskFormPage.fieldError('Title is required')).toBeVisible();
    await expect(taskListPage.taskCards).toHaveCount(0);
  });

  test('3.4 title over 200 characters is rejected', async ({
    taskListPage,
    taskFormPage,
  }) => {
    await taskListPage.openCreateForm();
    await taskFormPage.title.fill('x'.repeat(201));
    await taskFormPage.createSubmit().click();

    await expect(
      taskFormPage.fieldError('Title must not exceed 200 characters'),
    ).toBeVisible();
    await expect(taskListPage.taskCards).toHaveCount(0);
  });

  test('3.5 description over 1000 characters is rejected', async ({
    taskListPage,
    taskFormPage,
  }) => {
    await taskListPage.openCreateForm();
    await taskFormPage.title.fill('Has long description');
    await taskFormPage.description.fill('y'.repeat(1001));
    await taskFormPage.createSubmit().click();

    await expect(
      taskFormPage.fieldError('Description must not exceed 1000 characters'),
    ).toBeVisible();
    await expect(taskListPage.taskCards).toHaveCount(0);
  });

  test('3.6 a due date in the past is rejected', async ({
    taskListPage,
    taskFormPage,
  }) => {
    await taskListPage.openCreateForm();
    await taskFormPage.title.fill('Past due');
    await taskFormPage.dueDate.fill(dateOffset(-1));
    await taskFormPage.createSubmit().click();

    await expect(
      taskFormPage.fieldError('Due date must be in the future'),
    ).toBeVisible();
    await expect(taskListPage.taskCards).toHaveCount(0);
  });

  test('3.7 a future due date is accepted and rendered on the card', async ({
    taskListPage,
    taskFormPage,
  }) => {
    const title = 'Future deadline';
    await taskListPage.openCreateForm();
    await taskFormPage.title.fill(title);
    await taskFormPage.dueDate.fill(dateOffset(10));
    await taskFormPage.createSubmit().click();

    const card = taskListPage.card(title);
    await expect(card).toBeVisible();
    await expect(card).toContainText(formatCardDate(10));
  });

  test('3.8 toggling the create form closed creates no task', async ({
    taskListPage,
    taskFormPage,
  }) => {
    await taskListPage.openCreateForm();
    await taskFormPage.title.fill('Abandoned draft');
    // No onCancel is passed in create mode, so the header toggle (now "✕ Cancel")
    // closes the form.
    await taskListPage.cancelFormButton.click();

    await expect(taskFormPage.title).toBeHidden();
    await expect(taskListPage.taskCards).toHaveCount(0);
  });

  test('3.9 created task shows the selected priority and status badge', async ({
    taskListPage,
    taskFormPage,
  }) => {
    const title = 'High priority item';
    await taskListPage.openCreateForm();
    await taskFormPage.title.fill(title);
    await taskFormPage.priority.selectOption({ label: 'High Priority' });
    await taskFormPage.createSubmit().click();

    const card = taskListPage.card(title);
    await expect(taskListPage.cardPrioritySelect(card)).toHaveValue('High');
    // A freshly created task is always Todo -> "To Do" badge.
    await expect(taskListPage.cardStatusBadge(card)).toContainText('To Do');
  });
});
