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
        // Update existing task
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
        // Create new task
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        {task ? 'Edit Task' : 'Create New Task'}
      </h3>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={`w-full border ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          } rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          disabled={isSubmitting}
        />
        {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className={`w-full border ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          } rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          disabled={isSubmitting}
        />
        {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
      </div>

      {/* Priority and Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority *
          </label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
            required
          >
            <option value={TaskPriority.Low}>Low</option>
            <option value={TaskPriority.Medium}>Medium</option>
            <option value={TaskPriority.High}>High</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Required field - defaults to Medium</p>
        </div>

        {task && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
              required
            >
              <option value={TaskStatus.Todo}>Todo</option>
              <option value={TaskStatus.InProgress}>In Progress</option>
              <option value={TaskStatus.Done}>Done</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Required field</p>
          </div>
        )}
      </div>

      {/* Due Date */}
      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
          Due Date
        </label>
        <input
          type="date"
          id="dueDate"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          className={`w-full border ${
            errors.dueDate ? 'border-red-500' : 'border-gray-300'
          } rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          disabled={isSubmitting}
        />
        {errors.dueDate && <p className="text-red-600 text-sm mt-1">{errors.dueDate}</p>}
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
