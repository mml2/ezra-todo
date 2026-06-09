import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useTasks,
  useTasksPaged,
  useTask,
  useCreateTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useDeleteTask,
} from './useTasks';
import { taskApi } from '../services/api';
import { TaskStatus, TaskPriority } from '../types/task';
import type { Task } from '../types/task';

// Mock the API
vi.mock('../services/api', () => ({
  taskApi: {
    getAll: vi.fn(),
    getPaged: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockTasks: Task[] = [
  {
    id: 1,
    title: 'Task 1',
    status: TaskStatus.Todo,
    priority: TaskPriority.Medium,
    createdAt: '2026-06-08T10:00:00Z',
  },
  {
    id: 2,
    title: 'Task 2',
    status: TaskStatus.InProgress,
    priority: TaskPriority.High,
    createdAt: '2026-06-08T11:00:00Z',
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useTasks Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useTasks', () => {
    it('fetches all tasks successfully', async () => {
      vi.mocked(taskApi.getAll).mockResolvedValue(mockTasks);

      const { result } = renderHook(() => useTasks(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockTasks);
      expect(taskApi.getAll).toHaveBeenCalledTimes(1);
    });

    it('handles query error', async () => {
      const error = new Error('Failed to fetch tasks');
      vi.mocked(taskApi.getAll).mockRejectedValue(error);

      const { result } = renderHook(() => useTasks(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
      expect(result.current.data).toBeUndefined();
    });

    it('starts in loading state', () => {
      vi.mocked(taskApi.getAll).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useTasks(), { wrapper: createWrapper() });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useTasksPaged', () => {
    const mockPagedResult = {
      items: mockTasks,
      totalCount: 2,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    };

    it('fetches paginated tasks successfully', async () => {
      vi.mocked(taskApi.getPaged).mockResolvedValue(mockPagedResult);

      const { result } = renderHook(() => useTasksPaged(1, 20), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockPagedResult);
      expect(taskApi.getPaged).toHaveBeenCalledWith(1, 20);
    });

    it('fetches different pages', async () => {
      vi.mocked(taskApi.getPaged).mockResolvedValue(mockPagedResult);

      const { result } = renderHook(() => useTasksPaged(2, 10), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(taskApi.getPaged).toHaveBeenCalledWith(2, 10);
    });

    it('handles pagination query error', async () => {
      const error = new Error('Pagination failed');
      vi.mocked(taskApi.getPaged).mockRejectedValue(error);

      const { result } = renderHook(() => useTasksPaged(1, 20), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useTask', () => {
    const mockTask = mockTasks[0];

    it('fetches single task successfully', async () => {
      vi.mocked(taskApi.getById).mockResolvedValue(mockTask);

      const { result } = renderHook(() => useTask(1), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockTask);
      expect(taskApi.getById).toHaveBeenCalledWith(1);
    });

    it('handles task not found error', async () => {
      const error = new Error('Task not found');
      vi.mocked(taskApi.getById).mockRejectedValue(error);

      const { result } = renderHook(() => useTask(999), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('disables query when id is 0', () => {
      const { result } = renderHook(() => useTask(0), { wrapper: createWrapper() });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(taskApi.getById).not.toHaveBeenCalled();
    });

    it('disables query when id is falsy', () => {
      const { result } = renderHook(() => useTask(null as unknown as number), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(taskApi.getById).not.toHaveBeenCalled();
    });
  });

  describe('useCreateTask', () => {
    const newTaskData = {
      title: 'New Task',
      description: 'New Description',
      priority: TaskPriority.High,
      dueDate: '2026-06-15T00:00:00Z',
    };

    const createdTask: Task = {
      id: 3,
      ...newTaskData,
      status: TaskStatus.Todo,
      createdAt: '2026-06-08T12:00:00Z',
    };

    it('creates task successfully', async () => {
      vi.mocked(taskApi.create).mockResolvedValue(createdTask);

      const { result } = renderHook(() => useCreateTask(), { wrapper: createWrapper() });

      result.current.mutate(newTaskData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(createdTask);
      expect(taskApi.create).toHaveBeenCalledWith(newTaskData);
    });

    it('handles create error', async () => {
      const error = new Error('Create failed');
      vi.mocked(taskApi.create).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateTask(), { wrapper: createWrapper() });

      result.current.mutate(newTaskData);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('resets loading state after creation completes', async () => {
      vi.mocked(taskApi.create).mockResolvedValue(createdTask);

      const { result } = renderHook(() => useCreateTask(), { wrapper: createWrapper() });

      result.current.mutate(newTaskData);

      await waitFor(() => expect(result.current.isPending).toBe(false));
      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('useUpdateTask', () => {
    const updateData = {
      title: 'Updated Title',
      status: TaskStatus.Done,
    };

    const updatedTask: Task = {
      ...mockTasks[0],
      ...updateData,
      updatedAt: '2026-06-08T13:00:00Z',
    };

    it('updates task successfully', async () => {
      vi.mocked(taskApi.update).mockResolvedValue(updatedTask);

      const { result } = renderHook(() => useUpdateTask(), { wrapper: createWrapper() });

      result.current.mutate({ id: 1, data: updateData });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(updatedTask);
      expect(taskApi.update).toHaveBeenCalledWith(1, updateData);
    });

    it('handles update error', async () => {
      const error = new Error('Update failed');
      vi.mocked(taskApi.update).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateTask(), { wrapper: createWrapper() });

      result.current.mutate({ id: 1, data: updateData });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('handles task not found on update', async () => {
      const error = new Error('Task not found');
      vi.mocked(taskApi.update).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateTask(), { wrapper: createWrapper() });

      result.current.mutate({ id: 999, data: updateData });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useUpdateTaskStatus', () => {
    const statusUpdate = { status: TaskStatus.Done };

    const updatedTask: Task = {
      ...mockTasks[0],
      status: TaskStatus.Done,
      updatedAt: '2026-06-08T14:00:00Z',
    };

    it('updates task status successfully', async () => {
      vi.mocked(taskApi.updateStatus).mockResolvedValue(updatedTask);

      const { result } = renderHook(() => useUpdateTaskStatus(), { wrapper: createWrapper() });

      result.current.mutate({ id: 1, data: statusUpdate });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(updatedTask);
      expect(taskApi.updateStatus).toHaveBeenCalledWith(1, statusUpdate);
    });

    it('handles status update error', async () => {
      const error = new Error('Status update failed');
      vi.mocked(taskApi.updateStatus).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateTaskStatus(), { wrapper: createWrapper() });

      result.current.mutate({ id: 1, data: statusUpdate });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('updates to different statuses', async () => {
      vi.mocked(taskApi.updateStatus).mockResolvedValue(updatedTask);

      const { result } = renderHook(() => useUpdateTaskStatus(), { wrapper: createWrapper() });

      result.current.mutate({ id: 1, data: { status: TaskStatus.InProgress } });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(taskApi.updateStatus).toHaveBeenCalledWith(1, { status: TaskStatus.InProgress });
    });
  });

  describe('useDeleteTask', () => {
    it('deletes task successfully', async () => {
      vi.mocked(taskApi.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteTask(), { wrapper: createWrapper() });

      result.current.mutate(1);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(taskApi.delete).toHaveBeenCalledWith(1);
    });

    it('handles delete error', async () => {
      const error = new Error('Delete failed');
      vi.mocked(taskApi.delete).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteTask(), { wrapper: createWrapper() });

      result.current.mutate(1);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('handles task not found on delete', async () => {
      const error = new Error('Task not found');
      vi.mocked(taskApi.delete).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteTask(), { wrapper: createWrapper() });

      result.current.mutate(999);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('resets loading state after deletion completes', async () => {
      vi.mocked(taskApi.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteTask(), { wrapper: createWrapper() });

      result.current.mutate(1);

      await waitFor(() => expect(result.current.isPending).toBe(false));
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
