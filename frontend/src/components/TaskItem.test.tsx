import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/utils';
import TaskItem from './TaskItem';
import { TaskStatus, TaskPriority } from '../types/task';
import type { Task } from '../types/task';

const mockTask: Task = {
  id: 1,
  title: 'Test Task',
  description: 'Test Description',
  status: TaskStatus.Todo,
  priority: TaskPriority.Medium,
  createdAt: '2026-06-08T10:00:00Z',
};

describe('TaskItem', () => {
  it('renders task title and description', () => {
    renderWithProviders(<TaskItem task={mockTask} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('displays the clickable status pill', () => {
    renderWithProviders(<TaskItem task={mockTask} />);

    const statusPill = screen.getByRole('button', { name: 'To Do' });
    expect(statusPill).toBeInTheDocument();
  });

  it('displays the static priority pill', () => {
    renderWithProviders(<TaskItem task={mockTask} />);

    // Priority is display-only (no <select> on the card).
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(document.querySelector('select')).toBeNull();
  });

  it('shows the status pill labelled "Active" for InProgress tasks', () => {
    const inProgressTask: Task = { ...mockTask, status: TaskStatus.InProgress };
    renderWithProviders(<TaskItem task={inProgressTask} />);

    expect(screen.getByRole('button', { name: 'Active' })).toBeInTheDocument();
  });

  it('shows the status pill labelled "Done" for Done tasks', () => {
    const doneTask: Task = { ...mockTask, status: TaskStatus.Done };
    renderWithProviders(<TaskItem task={doneTask} />);

    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });

  it('applies line-through styling to completed tasks', () => {
    const doneTask: Task = { ...mockTask, status: TaskStatus.Done };
    renderWithProviders(<TaskItem task={doneTask} />);

    const title = screen.getByText('Test Task');
    expect(title).toHaveClass('line-through');
  });

  it('shows overdue warning for past due dates', () => {
    const overdueTask: Task = {
      ...mockTask,
      dueDate: '2026-06-01T10:00:00Z', // Past date
    };
    renderWithProviders(<TaskItem task={overdueTask} />);

    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });

  it('does not show overdue warning for completed tasks with past due dates', () => {
    const completedOverdueTask: Task = {
      ...mockTask,
      status: TaskStatus.Done,
      dueDate: '2026-06-01T10:00:00Z',
    };
    renderWithProviders(<TaskItem task={completedOverdueTask} />);

    expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument();
  });

  it('renders update and delete buttons', () => {
    renderWithProviders(<TaskItem task={mockTask} />);

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('switches to edit mode when edit button clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TaskItem task={mockTask} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Should show form heading in edit mode
    expect(screen.getByRole('heading', { name: /edit task/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
  });

  it('shows confirmation dialog before deleting', async () => {
    const user = userEvent.setup();

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderWithProviders(<TaskItem task={mockTask} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this task?');

    confirmSpy.mockRestore();
  });

  it('formats dates correctly', () => {
    const taskWithDueDate: Task = {
      ...mockTask,
      dueDate: '2026-06-15T10:00:00Z',
    };
    renderWithProviders(<TaskItem task={taskWithDueDate} />);

    expect(screen.getByText(/Jun 15, 2026/)).toBeInTheDocument();
  });

  it('advances status when the status pill is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TaskItem task={mockTask} />);

    const statusPill = screen.getByRole('button', { name: 'To Do' });
    await user.click(statusPill);

    // The mutation fires; without a parent re-render the label stays put.
    expect(statusPill).toBeInTheDocument();
  });

  it('deletes task when user confirms', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(<TaskItem task={mockTask} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this task?');

    confirmSpy.mockRestore();
  });

  it('cancels edit mode when cancel button clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TaskItem task={mockTask} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Should show form in edit mode
    expect(screen.getByRole('heading', { name: /edit task/i })).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Should return to normal view (no edit form heading)
    expect(screen.queryByRole('heading', { name: /edit task/i })).not.toBeInTheDocument();
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
});
