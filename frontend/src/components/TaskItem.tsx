import { useState } from 'react';
import { useUpdateTaskStatus, useUpdateTask, useDeleteTask } from '../hooks/useTasks';
import { Task, TaskStatus, TaskPriority } from '../types/task';
import TaskForm from './TaskForm';

interface TaskItemProps {
  task: Task;
}

export default function TaskItem({ task }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const updateStatus = useUpdateTaskStatus();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value as TaskStatus;
    updateStatus.mutate({ id: task.id, data: { status } });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const priority = e.target.value as TaskPriority;
    updateTask.mutate({ id: task.id, data: { priority } });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(task.id);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.Done;

  if (isEditing) {
    return (
      <tr>
        <td colSpan={7} className="p-4 bg-gray-50">
          <TaskForm
            task={task}
            onSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-3">
        <span className={task.status === TaskStatus.Done ? 'line-through text-gray-500' : 'text-gray-900'}>
          {task.title}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-600 text-sm">
        {task.description || '-'}
      </td>
      <td className="px-4 py-3">
        <select
          value={task.status}
          onChange={handleStatusChange}
          disabled={updateStatus.isPending}
          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={TaskStatus.Todo}>Todo</option>
          <option value={TaskStatus.InProgress}>In Progress</option>
          <option value={TaskStatus.Done}>Done</option>
        </select>
      </td>
      <td className="px-4 py-3">
        <select
          value={task.priority}
          onChange={handlePriorityChange}
          disabled={updateTask.isPending}
          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={TaskPriority.Low}>Low</option>
          <option value={TaskPriority.Medium}>Medium</option>
          <option value={TaskPriority.High}>High</option>
        </select>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
          {formatDate(task.dueDate)}
          {isOverdue && ' (Overdue)'}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {formatDate(task.createdAt)}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Update
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteTask.isPending}
            className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
