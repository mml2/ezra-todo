import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;

  constructor(page: Page) {
    this.page = page;
    this.username = page.locator('#username');
    this.password = page.locator('#password');
    // Match by type, not label: the button text changes to "Signing in..."
    // while a login request is in flight.
    this.submit = page.locator('button[type="submit"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.username).toBeVisible();
  }

  async login(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }

  /** The generic 401 / submit-level error banner. */
  submitError(): Locator {
    return this.page.getByText('Invalid username or password');
  }

  /** A client-side (Zod) field error message, e.g. "Username is required". */
  fieldError(message: string): Locator {
    return this.page.getByText(message);
  }
}
