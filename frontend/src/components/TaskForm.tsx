import { useState } from 'react';
import { useCreateTask, useUpdateTask } from '../hooks/useTasks';
import { Task, TaskPriority, TaskStatus } from '../types/task';

interface TaskFormProps {
  task?: Task;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function TaskForm({ task, onSuccess, onCancel }: TaskFormProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || TaskPriority.Medium,
    status: task?.status || TaskStatus.Todo,
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must not exceed 200 characters';
    }

    if (formData.description.length > 1000) {
      newErrors.description = 'Description must not exceed 1000 characters';
    }

    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        newErrors.dueDate = 'Due date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (task) {
        await updateTask.mutateAsync({
          id: task.id,
          data: {
            title: formData.title,
            description: formData.description || undefined,
            status: formData.status,
            priority: formData.priority,
            dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
          },
        });
      } else {
        await createTask.mutateAsync({
          title: formData.title,
          description: formData.description || undefined,
          priority: formData.priority,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving task:', error);
      setErrors({ submit: 'Failed to save task. Please try again.' });
    }
  };

  const isSubmitting = createTask.isPending || updateTask.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-[var(--color-mist)] pb-4">
        <h3
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-ink)' }}
          className="text-3xl font-bold"
        >
          {task ? 'Edit Task' : 'New Task'}
        </h3>
        <p style={{ color: 'var(--color-stone)' }} className="text-sm mt-1">
          {task ? 'Update task details below' : 'Fill in the details to create a new task'}
        </p>
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-ink)' }}
          className="block text-sm font-semibold mb-2 uppercase tracking-wide"
        >
          Title <span style={{ color: 'var(--color-ruby)' }}>*</span>
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={`w-full border ${
            errors.title ? 'border-[var(--color-ruby)]' : 'border-[var(--color-mist)]'
          } rounded-sm px-4 py-3 focus:outline-none focus:border-[var(--color-amber)] focus:ring-2 focus:ring-[var(--color-amber)] focus:ring-opacity-20 transition-all`}
          style={{ fontFamily: 'var(--font-sans)' }}
          disabled={isSubmitting}
          placeholder="Enter task title..."
        />
        {errors.title && (
          <p style={{ color: 'var(--color-ruby)' }} className="text-xs mt-2 font-semibold">
            ⚠ {errors.title}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-ink)' }}
          className="block text-sm font-semibold mb-2 uppercase tracking-wide"
        >
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className={`w-full border ${
            errors.description ? 'border-[var(--color-ruby)]' : 'border-[var(--color-mist)]'
          } rounded-sm px-4 py-3 focus:outline-none focus:border-[var(--color-amber)] focus:ring-2 focus:ring-[var(--color-amber)] focus:ring-opacity-20 transition-all resize-none`}
          style={{ fontFamily: 'var(--font-sans)' }}
          disabled={isSubmitting}
          placeholder="Add additional details..."
        />
        {errors.description && (
          <p style={{ color: 'var(--color-ruby)' }} className="text-xs mt-2 font-semibold">
            ⚠ {errors.description}
          </p>
        )}
      </div>

      {/* Priority and Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="priority"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-ink)' }}
            className="block text-sm font-semibold mb-2 uppercase tracking-wide"
          >
            Priority <span style={{ color: 'var(--color-ruby)' }}>*</span>
          </label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
            className="select-editorial w-full"
            disabled={isSubmitting}
            required
          >
            <option value={TaskPriority.Low}>Low Priority</option>
            <option value={TaskPriority.Medium}>Medium Priority</option>
            <option value={TaskPriority.High}>High Priority</option>
          </select>
        </div>

        {task && (
          <div>
            <label
              htmlFor="status"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-ink)' }}
              className="block text-sm font-semibold mb-2 uppercase tracking-wide"
            >
              Status <span style={{ color: 'var(--color-ruby)' }}>*</span>
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
              className="select-editorial w-full"
              disabled={isSubmitting}
              required
            >
              <option value={TaskStatus.Todo}>To Do</option>
              <option value={TaskStatus.InProgress}>In Progress</option>
              <option value={TaskStatus.Done}>Done</option>
            </select>
          </div>
        )}
      </div>

      {/* Due Date */}
      <div>
        <label
          htmlFor="dueDate"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-ink)' }}
          className="block text-sm font-semibold mb-2 uppercase tracking-wide"
        >
          Due Date
        </label>
        <input
          type="date"
          id="dueDate"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          className={`w-full border ${
            errors.dueDate ? 'border-[var(--color-ruby)]' : 'border-[var(--color-mist)]'
          } rounded-sm px-4 py-3 focus:outline-none focus:border-[var(--color-amber)] focus:ring-2 focus:ring-[var(--color-amber)] focus:ring-opacity-20 transition-all`}
          style={{ fontFamily: 'var(--font-sans)' }}
          disabled={isSubmitting}
        />
        {errors.dueDate && (
          <p style={{ color: 'var(--color-ruby)' }} className="text-xs mt-2 font-semibold">
            ⚠ {errors.dueDate}
          </p>
        )}
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="editorial-card p-4" style={{ background: 'rgba(220, 38, 38, 0.05)', borderColor: 'var(--color-ruby)' }}>
          <p style={{ color: 'var(--color-ruby)' }} className="text-sm font-semibold">
            ⚠ {errors.submit}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-[var(--color-mist)]">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            task ? '✓ Update Task' : '+ Create Task'
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 text-sm font-semibold uppercase tracking-wide rounded-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--color-mist)',
              color: 'var(--color-stone)',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
