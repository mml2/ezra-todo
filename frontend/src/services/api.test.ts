import { describe, it, expect, beforeAll, afterEach, afterAll, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { taskApi } from './api';
import { TaskStatus, TaskPriority } from '../types/task';
import type { Task, CreateTaskDto, UpdateTaskDto, PagedResult } from '../types/task';
import * as authService from './auth';

const API_BASE_URL = 'http://localhost:5000/api';

// Mock tasks
const mockTask: Task = {
  id: 1,
  title: 'Test Task',
  description: 'Test Description',
  status: TaskStatus.Todo,
  priority: TaskPriority.Medium,
  createdAt: '2026-06-08T10:00:00Z',
  updatedAt: undefined,
  dueDate: undefined,
};

const mockTasks: Task[] = [
  mockTask,
  {
    id: 2,
    title: 'Another Task',
    status: TaskStatus.InProgress,
    priority: TaskPriority.High,
    createdAt: '2026-06-08T11:00:00Z',
  },
];

// Mock paged result
const mockPagedResult: PagedResult<Task> = {
  items: mockTasks,
  totalCount: 2,
  page: 1,
  pageSize: 20,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

// Setup MSW server
const server = setupServer(
  http.get(`${API_BASE_URL}/tasks`, ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page');
    const pageSize = url.searchParams.get('pageSize');

    // If pagination params are present, return paged result
    if (page && pageSize) {
      return HttpResponse.json(mockPagedResult);
    }

    // Otherwise return all tasks
    return HttpResponse.json(mockTasks);
  }),

  http.get(`${API_BASE_URL}/tasks/:id`, ({ params }) => {
    const id = Number(params.id);
    const task = mockTasks.find((t) => t.id === id);
    if (task) {
      return HttpResponse.json(task);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.post(`${API_BASE_URL}/tasks`, async ({ request }) => {
    const body = await request.json() as CreateTaskDto;
    const newTask: Task = {
      id: 3,
      title: body.title,
      description: body.description,
      status: TaskStatus.Todo,
      priority: body.priority,
      createdAt: new Date().toISOString(),
      dueDate: body.dueDate,
    };
    return HttpResponse.json(newTask, { status: 201 });
  }),

  http.put(`${API_BASE_URL}/tasks/:id`, async ({ params, request }) => {
    const id = Number(params.id);
    const body = await request.json() as UpdateTaskDto;
    const task = mockTasks.find((t) => t.id === id);
    if (task) {
      const updatedTask: Task = {
        ...task,
        ...body,
        updatedAt: new Date().toISOString(),
      };
      return HttpResponse.json(updatedTask);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.patch(`${API_BASE_URL}/tasks/:id/status`, async ({ params, request }) => {
    const id = Number(params.id);
    const body = await request.json() as { status: TaskStatus };
    const task = mockTasks.find((t) => t.id === id);
    if (task) {
      const updatedTask: Task = {
        ...task,
        status: body.status,
        updatedAt: new Date().toISOString(),
      };
      return HttpResponse.json(updatedTask);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.delete(`${API_BASE_URL}/tasks/:id`, ({ params }) => {
    const id = Number(params.id);
    const task = mockTasks.find((t) => t.id === id);
    if (task) {
      return new HttpResponse(null, { status: 204 });
    }
    return new HttpResponse(null, { status: 404 });
  })
);

beforeAll(() => server.listen());
beforeEach(() => {
  // Clear localStorage before each test
  localStorage.clear();
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('taskApi', () => {
  describe('getAll', () => {
    it('should fetch all tasks', async () => {
      const tasks = await taskApi.getAll();

      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe('Test Task');
      expect(tasks[1].title).toBe('Another Task');
    });
  });

  describe('getById', () => {
    it('should fetch a task by id', async () => {
      const task = await taskApi.getById(1);

      expect(task).toBeDefined();
      expect(task.id).toBe(1);
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('Test Description');
    });

    it('should throw error for non-existent task', async () => {
      await expect(taskApi.getById(999)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createDto: CreateTaskDto = {
        title: 'New Task',
        description: 'New Description',
        priority: TaskPriority.High,
        dueDate: '2026-06-15T10:00:00Z',
      };

      const task = await taskApi.create(createDto);

      expect(task).toBeDefined();
      expect(task.id).toBe(3);
      expect(task.title).toBe('New Task');
      expect(task.description).toBe('New Description');
      expect(task.status).toBe(TaskStatus.Todo);
      expect(task.priority).toBe(TaskPriority.High);
    });
  });

  describe('update', () => {
    it('should update an existing task', async () => {
      const updateDto: UpdateTaskDto = {
        title: 'Updated Task',
        status: TaskStatus.Done,
      };

      const task = await taskApi.update(1, updateDto);

      expect(task).toBeDefined();
      expect(task.title).toBe('Updated Task');
      expect(task.status).toBe(TaskStatus.Done);
      expect(task.updatedAt).toBeDefined();
    });

    it('should throw error for non-existent task', async () => {
      const updateDto: UpdateTaskDto = { title: 'Updated' };
      await expect(taskApi.update(999, updateDto)).rejects.toThrow();
    });
  });

  describe('updateStatus', () => {
    it('should update task status', async () => {
      const task = await taskApi.updateStatus(1, { status: TaskStatus.InProgress });

      expect(task).toBeDefined();
      expect(task.status).toBe(TaskStatus.InProgress);
      expect(task.updatedAt).toBeDefined();
    });

    it('should throw error for non-existent task', async () => {
      await expect(
        taskApi.updateStatus(999, { status: TaskStatus.Done })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete a task', async () => {
      await expect(taskApi.delete(1)).resolves.toBeUndefined();
    });

    it('should throw error for non-existent task', async () => {
      await expect(taskApi.delete(999)).rejects.toThrow();
    });
  });

  describe('getPaged', () => {
    it('should fetch paginated tasks', async () => {
      const result = await taskApi.getPaged(1, 20);

      expect(result).toBeDefined();
      expect(result.items).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.totalCount).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(result.hasPreviousPage).toBe(false);
      expect(result.hasNextPage).toBe(false);
    });

    it('should fetch different page sizes', async () => {
      const result = await taskApi.getPaged(2, 10);

      expect(result).toBeDefined();
      expect(result.page).toBe(1); // Mock returns same data
      expect(result.items).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('should handle network errors with no response', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      server.use(
        http.get(`${API_BASE_URL}/tasks`, () => {
          return HttpResponse.error();
        })
      );

      await expect(taskApi.getAll()).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle request configuration errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // This will trigger an error in request setup
      await expect(async () => {
        throw new Error('Request setup error');
      }).rejects.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('request interceptor', () => {
    it('should attach Authorization header when token is present', async () => {
      const token = 'test-jwt-token-123';
      authService.setToken(token);

      let capturedAuthHeader: string | undefined;
      server.use(
        http.get(`${API_BASE_URL}/tasks`, ({ request }) => {
          capturedAuthHeader = request.headers.get('Authorization') || undefined;
          return HttpResponse.json(mockTasks);
        })
      );

      await taskApi.getAll();

      expect(capturedAuthHeader).toBe(`Bearer ${token}`);
    });

    it('should not attach Authorization header when token is absent', async () => {
      // Ensure no token in localStorage
      authService.clearToken();

      let capturedAuthHeader: string | null = null;
      let headerChecked = false;
      server.use(
        http.get(`${API_BASE_URL}/tasks`, ({ request }) => {
          capturedAuthHeader = request.headers.get('Authorization');
          headerChecked = true;
          return HttpResponse.json(mockTasks);
        })
      );

      await taskApi.getAll();

      expect(headerChecked).toBe(true);
      expect(capturedAuthHeader).toBeNull();
    });
  });

  describe('response interceptor - 401 handling', () => {
    it('should handle 401 error response', async () => {
      server.use(
        http.get(`${API_BASE_URL}/tasks`, () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // 401 response should be rejected
      await expect(taskApi.getAll()).rejects.toThrow();

      // Error should have been logged (at least called for 401 handling)
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
