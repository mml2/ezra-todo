import { Page, Locator } from '@playwright/test';

/**
 * The authenticated task-manager screen: header, stats, filters, create-form
 * toggle, task cards, and pagination.
 */
export class TaskListPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly logoutButton: Locator;
  readonly newTaskButton: Locator;
  readonly header: Locator;
  readonly statusFilter: Locator;
  readonly priorityFilter: Locator;
  readonly prevButton: Locator;
  readonly nextButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Task Manager' });
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
    this.newTaskButton = page.getByRole('button', { name: '+ New Task' });
    this.header = page.locator('header');
    // The two filter <select>s, in DOM order: status then priority.
    this.statusFilter = page.locator('select.select-editorial').nth(0);
    this.priorityFilter = page.locator('select.select-editorial').nth(1);
    this.prevButton = page.getByRole('button', { name: '← Prev' });
    this.nextButton = page.getByRole('button', { name: 'Next →' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /** The logged-in username shown in the header. */
  usernameInHeader(username: string): Locator {
    return this.header.getByText(username, { exact: true });
  }

  /** A task card located by its title text. */
  card(title: string): Locator {
    return this.page.locator('.editorial-card', { hasText: title });
  }

  async openCreateForm(): Promise<void> {
    await this.newTaskButton.click();
  }

  async filterByStatus(label: 'All Status' | 'To Do' | 'In Progress' | 'Done'): Promise<void> {
    await this.statusFilter.selectOption({ label });
  }

  async filterByPriority(label: 'All Priorities' | 'Low' | 'Medium' | 'High'): Promise<void> {
    await this.priorityFilter.selectOption({ label });
  }

  clearFiltersButton(): Locator {
    return this.page.getByRole('button', { name: 'Clear' });
  }

  /** Stat tile value by its label (Total / To Do / Active / Complete). */
  statValue(label: 'Total' | 'To Do' | 'Active' | 'Complete'): Locator {
    return this.page
      .locator('.editorial-card', { hasText: new RegExp(`^\\s*${label}`) })
      .locator('p.text-4xl');
  }

  emptyState(): Locator {
    return this.page.getByText(/Your task list is empty|No tasks match your filters/);
  }
}
