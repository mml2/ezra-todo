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
    if (!dateString) return null;
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
      <div className="editorial-card accent-border p-8 animate-scale-in">
        <TaskForm
          task={task}
          onSuccess={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  const priorityColors = {
    [TaskPriority.Low]: '#4f7355',
    [TaskPriority.Medium]: '#8a6a16',
    [TaskPriority.High]: '#a23b2d',
  };

  return (
    <div className="editorial-card group relative overflow-hidden">
      {/* Priority Accent Bar */}
      <div
        className="absolute top-0 left-0 w-1 h-full transition-all group-hover:w-1.5"
        style={{ background: priorityColors[task.priority] }}
      />

      <div className="p-6 pl-8">
        <div className="flex items-start justify-between gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Title & Status Row */}
            <div className="flex items-start gap-4 mb-3">
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  color: task.status === TaskStatus.Done ? 'var(--color-stone)' : 'var(--color-ink)',
                }}
                className={`text-xl font-semibold leading-tight transition-all ${
                  task.status === TaskStatus.Done ? 'line-through opacity-60' : ''
                }`}
              >
                {task.title}
              </h3>

              {/* Status Badge */}
              <span
                className={`status-badge flex-shrink-0 ${
                  task.status === TaskStatus.Todo
                    ? 'status-todo'
                    : task.status === TaskStatus.InProgress
                    ? 'status-in-progress'
                    : 'status-done'
                }`}
              >
                <span
                  className={`priority-dot ${
                    task.priority === TaskPriority.Low
                      ? 'priority-low'
                      : task.priority === TaskPriority.Medium
                      ? 'priority-medium'
                      : 'priority-high'
                  }`}
                />
                {task.status === TaskStatus.Todo ? 'To Do' : task.status === TaskStatus.InProgress ? 'Active' : 'Done'}
              </span>
            </div>

            {/* Description */}
            {task.description && (
              <p style={{ color: 'var(--color-stone)' }} className="text-sm leading-relaxed mb-4 max-w-3xl">
                {task.description}
              </p>
            )}

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--color-stone)' }}>
              {/* Created Date */}
              <div className="flex items-center gap-2">
                <span className="opacity-60 uppercase tracking-wider">Created</span>
                <span style={{ fontFamily: 'var(--font-serif)' }} className="font-semibold">
                  {formatDate(task.createdAt)}
                </span>
              </div>

              {/* Due Date */}
              {task.dueDate && (
                <>
                  <span className="opacity-30">•</span>
                  <div className="flex items-center gap-2">
                    <span className="opacity-60 uppercase tracking-wider">Due</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-serif)',
                        color: isOverdue ? 'var(--color-ruby)' : 'inherit',
                      }}
                      className="font-semibold"
                    >
                      {formatDate(task.dueDate)}
                      {isOverdue && (
                        <span className="ml-2 px-2 py-0.5 rounded uppercase text-[10px] font-bold tracking-wide" style={{ background: '#f6e8e4', color: '#a23b2d' }}>
                          Overdue
                        </span>
                      )}
                    </span>
                  </div>
                </>
              )}

              {/* Priority */}
              <span className="opacity-30">•</span>
              <div className="flex items-center gap-2">
                <span className="opacity-60 uppercase tracking-wider">Priority</span>
                <select
                  value={task.priority}
                  onChange={handlePriorityChange}
                  disabled={updateTask.isPending}
                  className="text-xs font-semibold uppercase tracking-wide border-none bg-transparent cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ color: priorityColors[task.priority] }}
                >
                  <option value={TaskPriority.Low}>Low</option>
                  <option value={TaskPriority.Medium}>Medium</option>
                  <option value={TaskPriority.High}>High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions Column */}
          <div className="flex flex-col gap-3 flex-shrink-0">
            {/* Status Selector */}
            <select
              value={task.status}
              onChange={handleStatusChange}
              disabled={updateStatus.isPending}
              className="select-editorial text-xs py-2"
            >
              <option value={TaskStatus.Todo}>To Do</option>
              <option value={TaskStatus.InProgress}>In Progress</option>
              <option value={TaskStatus.Done}>Done</option>
            </select>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wide rounded-sm transition-all hover:-translate-y-0.5"
                style={{
                  background: 'var(--color-ink)',
                  color: 'white',
                }}
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteTask.isPending}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wide rounded-sm transition-all hover:-translate-y-0.5 disabled:opacity-50"
                style={{
                  background: 'var(--color-ruby)',
                  color: 'white',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Effect Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-purple-50 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none" />
    </div>
  );
}
