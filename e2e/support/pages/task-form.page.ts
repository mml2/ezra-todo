import { Page, Locator } from '@playwright/test';

/**
 * The create/edit task form. The same component renders inline for create
 * (TaskList) and edit (TaskItem); the Status field only appears in edit mode.
 */
export class TaskFormPage {
  readonly page: Page;
  readonly title: Locator;
  readonly description: Locator;
  readonly priority: Locator;
  readonly status: Locator;
  readonly dueDate: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('#title');
    this.description = page.locator('#description');
    this.priority = page.locator('#priority');
    this.status = page.locator('#status');
    this.dueDate = page.locator('#dueDate');
  }

  createSubmit(): Locator {
    return this.page.getByRole('button', { name: '+ Create Task' });
  }

  updateSubmit(): Locator {
    return this.page.getByRole('button', { name: '✓ Update Task' });
  }

  cancelButton(): Locator {
    return this.page.getByRole('button', { name: 'Cancel' });
  }

  fieldError(message: string | RegExp): Locator {
    return this.page.getByText(message);
  }
}
