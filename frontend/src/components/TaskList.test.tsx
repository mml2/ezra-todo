import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../test/utils';
import TaskList from './TaskList';
import { taskApi } from '../services/api';
import { TaskStatus, TaskPriority } from '../types/task';
import type { Task, PagedResult } from '../types/task';

// Mock the API (same pattern as useTasks.test.tsx)
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

function makeTask(id: number, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: `Task ${id}`,
    status: TaskStatus.Todo,
    priority: TaskPriority.Medium,
    createdAt: '2026-06-08T10:00:00Z',
    ...overrides,
  };
}

function makePaged(
  items: Task[],
  page: number,
  pageSize: number,
  totalCount: number
): PagedResult<Task> {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

/** Mocks both queries TaskList fires: getAll (stats/filters) and getPaged (display). */
function mockTasks(tasks: Task[]) {
  vi.mocked(taskApi.getAll).mockResolvedValue(tasks);
  vi.mocked(taskApi.getPaged).mockImplementation(async (page: number, size: number) => {
    const start = (page - 1) * size;
    return makePaged(tasks.slice(start, start + size), page, size, tasks.length);
  });
  return tasks;
}

describe('TaskList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Async states', () => {
    it('shows loading state while tasks are fetching', () => {
      vi.mocked(taskApi.getAll).mockImplementation(() => new Promise(() => {}));
      vi.mocked(taskApi.getPaged).mockImplementation(() => new Promise(() => {}));

      renderWithRouter(<TaskList />);

      expect(screen.getByText(/loading tasks/i)).toBeInTheDocument();
    });

    it('shows error state when the tasks query fails', async () => {
      vi.mocked(taskApi.getAll).mockResolvedValue([]);
      vi.mocked(taskApi.getPaged).mockRejectedValue(new Error('Network down'));

      renderWithRouter(<TaskList />);

      expect(await screen.findByText(/connection error/i)).toBeInTheDocument();
      expect(screen.getByText(/unable to connect to the backend server/i)).toBeInTheDocument();
    });

    it('shows empty state when no tasks exist', async () => {
      mockTasks([]);

      renderWithRouter(<TaskList />);

      expect(await screen.findByText(/your task list is empty/i)).toBeInTheDocument();
      expect(screen.getByText(/click "new task" above to begin/i)).toBeInTheDocument();
    });
  });

  describe('Rendering tasks', () => {
    it('renders tasks returned from the API', async () => {
      mockTasks([
        makeTask(1, { title: 'Write report' }),
        makeTask(2, { title: 'Review PR' }),
      ]);

      renderWithRouter(<TaskList />);

      expect(await screen.findByText('Write report')).toBeInTheDocument();
      expect(screen.getByText('Review PR')).toBeInTheDocument();
    });

    it('renders the page header', async () => {
      mockTasks([makeTask(1)]);

      renderWithRouter(<TaskList />);

      expect(
        await screen.findByRole('heading', { name: /task manager/i })
      ).toBeInTheDocument();
    });
  });

  describe('Stats grid', () => {
    it('computes stat counts by status', async () => {
      // 7 Todo + 5 InProgress + 3 Done = 15 total (distinct counts so each is unambiguous)
      const tasks = [
        ...Array.from({ length: 7 }, (_, i) => makeTask(i + 1, { status: TaskStatus.Todo })),
        ...Array.from({ length: 5 }, (_, i) =>
          makeTask(i + 8, { status: TaskStatus.InProgress })
        ),
        ...Array.from({ length: 3 }, (_, i) => makeTask(i + 13, { status: TaskStatus.Done })),
      ];
      mockTasks(tasks);

      renderWithRouter(<TaskList />);

      expect(await screen.findByText('15')).toBeInTheDocument(); // Total
      expect(screen.getByText('7')).toBeInTheDocument(); // To Do
      expect(screen.getByText('5')).toBeInTheDocument(); // Active (InProgress)
      expect(screen.getByText('3')).toBeInTheDocument(); // Complete
    });
  });

  describe('Filtering', () => {
    it('filters tasks by status', async () => {
      const user = userEvent.setup();
      mockTasks([
        makeTask(1, { title: 'Todo task', status: TaskStatus.Todo }),
        makeTask(2, { title: 'Done task', status: TaskStatus.Done }),
      ]);

      renderWithRouter(<TaskList />);
      await screen.findByText('Todo task');

      const statusFilter = screen.getByDisplayValue('All Status');
      await user.selectOptions(statusFilter, TaskStatus.Done);

      expect(await screen.findByText('Done task')).toBeInTheDocument();
      expect(screen.queryByText('Todo task')).not.toBeInTheDocument();
    });

    it('filters tasks by priority', async () => {
      const user = userEvent.setup();
      mockTasks([
        makeTask(1, { title: 'Low priority task', priority: TaskPriority.Low }),
        makeTask(2, { title: 'High priority task', priority: TaskPriority.High }),
      ]);

      renderWithRouter(<TaskList />);
      await screen.findByText('Low priority task');

      const priorityFilter = screen.getByDisplayValue('All Priorities');
      await user.selectOptions(priorityFilter, TaskPriority.High);

      expect(await screen.findByText('High priority task')).toBeInTheDocument();
      expect(screen.queryByText('Low priority task')).not.toBeInTheDocument();
    });

    it('shows the filtered empty state when no tasks match the filters', async () => {
      const user = userEvent.setup();
      mockTasks([makeTask(1, { title: 'Only todo', status: TaskStatus.Todo })]);

      renderWithRouter(<TaskList />);
      await screen.findByText('Only todo');

      const statusFilter = screen.getByDisplayValue('All Status');
      await user.selectOptions(statusFilter, TaskStatus.Done);

      expect(await screen.findByText(/no tasks match your filters/i)).toBeInTheDocument();
      expect(screen.getByText(/try adjusting your filter criteria/i)).toBeInTheDocument();
    });

    it('clears active filters when Clear is clicked', async () => {
      const user = userEvent.setup();
      mockTasks([
        makeTask(1, { title: 'Todo task', status: TaskStatus.Todo }),
        makeTask(2, { title: 'Done task', status: TaskStatus.Done }),
      ]);

      renderWithRouter(<TaskList />);
      await screen.findByText('Todo task');

      const statusFilter = screen.getByDisplayValue('All Status');
      await user.selectOptions(statusFilter, TaskStatus.Done);
      expect(screen.queryByText('Todo task')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /clear/i }));

      expect(await screen.findByText('Todo task')).toBeInTheDocument();
      expect(screen.getByText('Done task')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('does not render pagination controls when there is a single page', async () => {
      mockTasks([makeTask(1), makeTask(2)]);

      renderWithRouter(<TaskList />);
      await screen.findByText('Task 1');

      expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /prev/i })).not.toBeInTheDocument();
    });

    it('disables Prev on the first page and enables Next when more pages exist', async () => {
      mockTasks(Array.from({ length: 45 }, (_, i) => makeTask(i + 1)));

      renderWithRouter(<TaskList />);
      await screen.findByText('Page 1');

      expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();
    });

    it('advances to the next page when Next is clicked', async () => {
      const user = userEvent.setup();
      mockTasks(Array.from({ length: 45 }, (_, i) => makeTask(i + 1)));

      renderWithRouter(<TaskList />);
      await screen.findByText('Page 1');

      await user.click(screen.getByRole('button', { name: /next/i }));

      expect(await screen.findByText('Page 2')).toBeInTheDocument();
      await waitFor(() => expect(taskApi.getPaged).toHaveBeenCalledWith(2, 20));
      // Page 2 shows items 21-40
      expect(screen.getByText('Task 21')).toBeInTheDocument();
    });

    it('disables Next on the last page', async () => {
      const user = userEvent.setup();
      mockTasks(Array.from({ length: 25 }, (_, i) => makeTask(i + 1)));

      renderWithRouter(<TaskList />);
      await screen.findByText('Page 1');

      await user.click(screen.getByRole('button', { name: /next/i }));
      await screen.findByText('Page 2');

      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /prev/i })).toBeEnabled();
    });

    it('paginates filtered results client-side', async () => {
      const user = userEvent.setup();
      mockTasks(
        Array.from({ length: 25 }, (_, i) => makeTask(i + 1, { status: TaskStatus.Todo }))
      );

      renderWithRouter(<TaskList />);
      await screen.findByText('Task 1');

      const statusFilter = screen.getByDisplayValue('All Status');
      await user.selectOptions(statusFilter, TaskStatus.Todo);

      expect(await screen.findByText('(25 filtered)')).toBeInTheDocument();
      expect(screen.getByText('Page 1')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /next/i }));

      expect(await screen.findByText('Page 2')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });
  });

  describe('Task actions', () => {
    it('deletes a task through the API when delete is confirmed', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      mockTasks([makeTask(1, { title: 'Task to delete' })]);
      vi.mocked(taskApi.delete).mockResolvedValue(undefined);

      renderWithRouter(<TaskList />);
      await screen.findByText('Task to delete');

      await user.click(screen.getByRole('button', { name: /delete/i }));

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this task?');
      await waitFor(() => expect(taskApi.delete).toHaveBeenCalledWith(1));

      confirmSpy.mockRestore();
    });

    it('toggles the new task form', async () => {
      const user = userEvent.setup();
      mockTasks([makeTask(1)]);

      renderWithRouter(<TaskList />);
      await screen.findByText('Task 1');

      await user.click(screen.getByRole('button', { name: /new task/i }));
      expect(screen.getByRole('heading', { name: /new task/i })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByRole('heading', { name: /new task/i })).not.toBeInTheDocument();
    });
  });
});
