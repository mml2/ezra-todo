import { test as base, expect, Page } from '@playwright/test';
import { ApiClient } from '../support/api-client';
import {
  ALICE,
  BOB,
  AUTH_TOKEN_KEY,
  AUTH_USERNAME_KEY,
  FRONTEND_URL,
  SeededUser,
} from '../support/constants';
import { LoginPage } from '../support/pages/login.page';
import { TaskListPage } from '../support/pages/task-list.page';
import { TaskFormPage } from '../support/pages/task-form.page';

interface Fixtures {
  api: ApiClient;
  aliceToken: string;
  bobToken: string;
  /** Wipes alice's and bob's tasks so each test starts from a known-empty state. */
  cleanTasks: void;
  /** Inject a valid session for a seeded user and land on the task list. */
  loginAs: (user: SeededUser) => Promise<void>;
  loginPage: LoginPage;
  taskListPage: TaskListPage;
  taskFormPage: TaskFormPage;
}

export const test = base.extend<Fixtures>({
  api: async ({}, use) => {
    const client = await ApiClient.create();
    await use(client);
    await client.dispose();
  },

  aliceToken: async ({ api }, use) => {
    await use(await api.getToken(ALICE));
  },

  bobToken: async ({ api }, use) => {
    await use(await api.getToken(BOB));
  },

  cleanTasks: async ({ api }, use) => {
    const aliceToken = await api.getToken(ALICE);
    const bobToken = await api.getToken(BOB);
    await api.deleteAllTasks(aliceToken);
    await api.deleteAllTasks(bobToken);
    await use();
  },

  loginAs: async ({ page, api }, use) => {
    const doLogin = async (user: SeededUser): Promise<void> => {
      const auth = await api.login(user);
      // Seed localStorage before any app code runs, then load the app.
      await page.addInitScript(
        ({ tokenKey, usernameKey, token, username }) => {
          window.localStorage.setItem(tokenKey, token);
          window.localStorage.setItem(usernameKey, username);
        },
        {
          tokenKey: AUTH_TOKEN_KEY,
          usernameKey: AUTH_USERNAME_KEY,
          token: auth.token,
          username: auth.username,
        },
      );
      await page.goto('/');
    };
    await use(doLogin);
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  taskListPage: async ({ page }, use) => {
    await use(new TaskListPage(page));
  },

  taskFormPage: async ({ page }, use) => {
    await use(new TaskFormPage(page));
  },
});

export { expect, ALICE, BOB, FRONTEND_URL };
export type { Page };
