import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/utils';
import TaskForm from './TaskForm';
import { TaskStatus, TaskPriority } from '../types/task';
import type { Task } from '../types/task';

const mockTask: Task = {
  id: 1,
  title: 'Existing Task',
  description: 'Existing Description',
  status: TaskStatus.InProgress,
  priority: TaskPriority.High,
  createdAt: '2026-06-08T10:00:00Z',
  dueDate: '2026-06-15T00:00:00Z',
};

describe('TaskForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockOnSuccess.mockClear();
    mockOnCancel.mockClear();
  });

  describe('Create Mode (no task prop)', () => {
    it('renders create form with empty fields', () => {
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      expect(screen.getByRole('heading', { name: /create new task/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toHaveValue('');
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
      expect(screen.getByLabelText(/priority/i)).toHaveValue(TaskPriority.Medium);
      expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument();
    });

    it('shows Create Task button text', () => {
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
    });

    it('defaults priority to Medium', () => {
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText(/priority/i)).toHaveValue('Medium');
    });
  });

  describe('Edit Mode (task prop provided)', () => {
    it('renders edit form with task data', () => {
      renderWithProviders(<TaskForm task={mockTask} onSuccess={mockOnSuccess} />);

      expect(screen.getByRole('heading', { name: /edit task/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toHaveValue('Existing Task');
      expect(screen.getByLabelText(/description/i)).toHaveValue('Existing Description');
      expect(screen.getByLabelText(/priority/i)).toHaveValue('High');
      expect(screen.getByLabelText(/status/i)).toHaveValue('InProgress');
    });

    it('shows Update Task button text', () => {
      renderWithProviders(<TaskForm task={mockTask} onSuccess={mockOnSuccess} />);

      expect(screen.getByRole('button', { name: /update task/i })).toBeInTheDocument();
    });

    it('displays status field in edit mode', () => {
      renderWithProviders(<TaskForm task={mockTask} onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    it('parses due date correctly', () => {
      renderWithProviders(<TaskForm task={mockTask} onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText(/due date/i)).toHaveValue('2026-06-15');
    });
  });

  describe('Validation - Title', () => {
    it('shows error when title is empty', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('shows error when title is only whitespace', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, '   ');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    });

    it('shows error when title exceeds 200 characters', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      const titleInput = screen.getByLabelText(/title/i);
      const longTitle = 'a'.repeat(201);
      await user.type(titleInput, longTitle);

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(await screen.findByText(/title must not exceed 200 characters/i)).toBeInTheDocument();
    });

    it('accepts title with exactly 200 characters', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      const titleInput = screen.getByLabelText(/title/i);
      const validTitle = 'a'.repeat(200);
      await user.type(titleInput, validTitle);

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(screen.queryByText(/title must not exceed 200 characters/i)).not.toBeInTheDocument();
    });

    it('displays title error with red border', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/title/i);
        expect(titleInput).toHaveClass('border-red-500');
      });
    });
  });

  describe('Validation - Description', () => {
    it('shows error when description exceeds 1000 characters', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Valid Title');

      const descriptionInput = screen.getByLabelText(/description/i);
      const longDescription = 'a'.repeat(1001);
      await user.type(descriptionInput, longDescription);

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(await screen.findByText(/description must not exceed 1000 characters/i)).toBeInTheDocument();
    });

    it('accepts description with exactly 1000 characters', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Valid Title');

      const descriptionInput = screen.getByLabelText(/description/i);
      const validDescription = 'a'.repeat(1000);
      await user.type(descriptionInput, validDescription);

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(screen.queryByText(/description must not exceed 1000 characters/i)).not.toBeInTheDocument();
    });

    it('accepts empty description', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Valid Title');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(screen.queryByText(/description/i)).not.toBeNull();
    });
  });

  describe('Validation - Due Date', () => {
    it('shows error for past due date', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Valid Title');

      const dueDateInput = screen.getByLabelText(/due date/i);
      await user.type(dueDateInput, '2020-01-01');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(await screen.findByText(/due date must be in the future/i)).toBeInTheDocument();
    });

    it('shows error for today\'s date', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Valid Title');

      const today = new Date().toISOString().split('T')[0];
      const dueDateInput = screen.getByLabelText(/due date/i);
      await user.type(dueDateInput, today);

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(await screen.findByText(/due date must be in the future/i)).toBeInTheDocument();
    });

    it('accepts future due date', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Valid Title');

      const dueDateInput = screen.getByLabelText(/due date/i);
      await user.type(dueDateInput, '2030-01-01');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(screen.queryByText(/due date must be in the future/i)).not.toBeInTheDocument();
    });

    it('accepts no due date', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Valid Title');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(screen.queryByText(/due date/i)).not.toBeNull();
    });
  });

  describe('Multiple Validation Errors', () => {
    it('shows all validation errors simultaneously', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'a'.repeat(201));

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'b'.repeat(1001));

      const dueDateInput = screen.getByLabelText(/due date/i);
      await user.type(dueDateInput, '2020-01-01');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(await screen.findByText(/title must not exceed 200 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/description must not exceed 1000 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/due date must be in the future/i)).toBeInTheDocument();
    });
  });

  describe('Cancel Button', () => {
    it('renders cancel button when onCancel provided', () => {
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('does not render cancel button when onCancel not provided', () => {
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });

    it('calls onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('disables cancel button when submitting', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Valid Title');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Loading States', () => {
    it('disables all inputs when submitting', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Valid Title');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(titleInput).toBeDisabled();
      expect(screen.getByLabelText(/description/i)).toBeDisabled();
      expect(screen.getByLabelText(/priority/i)).toBeDisabled();
      expect(screen.getByLabelText(/due date/i)).toBeDisabled();
    });

    it('shows "Saving..." text during submission', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Valid Title');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(await screen.findByText(/saving.../i)).toBeInTheDocument();
    });

    it('disables submit button when submitting', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Valid Title');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Data Updates', () => {
    it('updates title field on input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'New Task Title');

      expect(titleInput).toHaveValue('New Task Title');
    });

    it('updates description field on input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'Task description here');

      expect(descriptionInput).toHaveValue('Task description here');
    });

    it('updates priority field on change', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      const prioritySelect = screen.getByLabelText(/priority/i);
      await user.selectOptions(prioritySelect, TaskPriority.High);

      expect(prioritySelect).toHaveValue('High');
    });

    it('updates status field on change in edit mode', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm task={mockTask} onSuccess={mockOnSuccess} />);

      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, TaskStatus.Done);

      expect(statusSelect).toHaveValue('Done');
    });

    it('updates due date field on input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      const dueDateInput = screen.getByLabelText(/due date/i);
      await user.type(dueDateInput, '2030-12-31');

      expect(dueDateInput).toHaveValue('2030-12-31');
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for all form fields', () => {
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText(/title \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    });

    it('marks required fields with asterisk', () => {
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/title \*/i)).toBeInTheDocument();
      expect(screen.getByText(/priority \*/i)).toBeInTheDocument();
    });

    it('has proper form submission', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm onSuccess={mockOnSuccess} />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Valid Title');

      const form = screen.getByRole('heading', { name: /create new task/i }).closest('form');
      expect(form).toBeInTheDocument();
    });
  });
});
