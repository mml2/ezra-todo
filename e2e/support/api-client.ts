import { APIRequestContext, request } from '@playwright/test';
import { API_URL, SeededUser } from './constants';

export interface AuthResponse {
  token: string;
  expiresAt: string;
  username: string;
}

export interface TaskResponse {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt?: string;
  dueDate?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: string;
}

/**
 * Thin HTTP client over the real backend API. Used by fixtures to set up
 * preconditions (mint tokens, seed/clean tasks) without driving the UI.
 */
export class ApiClient {
  private constructor(private readonly ctx: APIRequestContext) {}

  static async create(): Promise<ApiClient> {
    // Trailing slash + relative (no-leading-slash) paths below: Playwright resolves
    // a leading-slash path as absolute to the origin, which would drop `/api`.
    const ctx = await request.newContext({ baseURL: `${API_URL}/` });
    return new ApiClient(ctx);
  }

  async dispose(): Promise<void> {
    await this.ctx.dispose();
  }

  async login(user: SeededUser): Promise<AuthResponse> {
    const res = await this.ctx.post('auth/login', {
      data: { username: user.username, password: user.password },
    });
    if (!res.ok()) {
      throw new Error(`Login failed for ${user.username}: ${res.status()} ${await res.text()}`);
    }
    return (await res.json()) as AuthResponse;
  }

  async getToken(user: SeededUser): Promise<string> {
    return (await this.login(user)).token;
  }

  async createTask(token: string, input: CreateTaskInput): Promise<TaskResponse> {
    const res = await this.ctx.post('tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: input,
    });
    if (res.status() !== 201) {
      throw new Error(`createTask failed: ${res.status()} ${await res.text()}`);
    }
    return (await res.json()) as TaskResponse;
  }

  /**
   * Full update via PUT /tasks/{id}. Unlike create, the update validator has no
   * future-date rule, so this is the only way to seed an overdue task (set a
   * past dueDate on an already-created task).
   */
  async updateTask(
    token: string,
    id: number,
    input: Partial<CreateTaskInput> & { dueDate?: string },
  ): Promise<TaskResponse> {
    const res = await this.ctx.put(`tasks/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: input,
    });
    if (!res.ok()) {
      throw new Error(`updateTask failed: ${res.status()} ${await res.text()}`);
    }
    return (await res.json()) as TaskResponse;
  }

  /**
   * Set a task's status. The API only accepts status via PATCH; create always
   * defaults to Todo, so filter tests use this to seed InProgress / Done tasks.
   */
  async updateTaskStatus(
    token: string,
    id: number,
    status: 'Todo' | 'InProgress' | 'Done',
  ): Promise<TaskResponse> {
    const res = await this.ctx.patch(`tasks/${id}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status },
    });
    if (!res.ok()) {
      throw new Error(`updateTaskStatus failed: ${res.status()} ${await res.text()}`);
    }
    return (await res.json()) as TaskResponse;
  }

  async listAllTasks(token: string): Promise<TaskResponse[]> {
    const res = await this.ctx.get('tasks', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok()) {
      throw new Error(`listAllTasks failed: ${res.status()} ${await res.text()}`);
    }
    return (await res.json()) as TaskResponse[];
  }

  async deleteTask(token: string, id: number): Promise<void> {
    await this.ctx.delete(`tasks/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /** Remove every task owned by the given user — used to reset state between tests. */
  async deleteAllTasks(token: string): Promise<void> {
    const tasks = await this.listAllTasks(token);
    for (const task of tasks) {
      await this.deleteTask(token, task.id);
    }
  }
}
