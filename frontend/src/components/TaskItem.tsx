import { useState } from 'react';
import { useUpdateTaskStatus, useDeleteTask } from '../hooks/useTasks';
import { Task, TaskStatus, TaskPriority } from '../types/task';
import TaskForm from './TaskForm';

interface TaskItemProps {
  task: Task;
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  [TaskStatus.Todo]: TaskStatus.InProgress,
  [TaskStatus.InProgress]: TaskStatus.Done,
  [TaskStatus.Done]: TaskStatus.Todo,
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  [TaskStatus.Todo]: 'To Do',
  [TaskStatus.InProgress]: 'Active',
  [TaskStatus.Done]: 'Done',
};

const STATUS_CLASS: Record<TaskStatus, string> = {
  [TaskStatus.Todo]: 'status-todo',
  [TaskStatus.InProgress]: 'status-in-progress',
  [TaskStatus.Done]: 'status-done',
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  [TaskPriority.Low]: 'priority-low',
  [TaskPriority.Medium]: 'priority-medium',
  [TaskPriority.High]: 'priority-high',
};

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  [TaskPriority.Low]: '#4f7355',
  [TaskPriority.Medium]: '#8a6a16',
  [TaskPriority.High]: '#a23b2d',
};

export default function TaskItem({ task }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();

  const handleAdvanceStatus = () => {
    updateStatus.mutate({ id: task.id, data: { status: NEXT_STATUS[task.status] } });
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

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.Done;

  if (isEditing) {
    return (
      <div className="editorial-card p-8 animate-scale-in">
        <TaskForm
          task={task}
          onSuccess={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="editorial-card p-6">
      <div className="flex items-start gap-4">
        {/* Priority dot */}
        <span
          className={`priority-dot mt-2 flex-shrink-0 ${PRIORITY_DOT[task.priority]}`}
          aria-hidden="true"
        />

        <div className="flex-1 min-w-0">
          {/* Title + clickable status pill */}
          <div className="flex items-start justify-between gap-4">
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                color:
                  task.status === TaskStatus.Done ? 'var(--color-stone)' : 'var(--color-ink)',
              }}
              className={`text-lg font-semibold leading-tight transition-all ${
                task.status === TaskStatus.Done ? 'line-through opacity-60' : ''
              }`}
            >
              {task.title}
            </h3>

            <button
              type="button"
              onClick={handleAdvanceStatus}
              disabled={updateStatus.isPending}
              title="Click to advance status"
              className={`status-badge flex-shrink-0 cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-50 ${STATUS_CLASS[task.status]}`}
            >
              {STATUS_LABEL[task.status]}
            </button>
          </div>

          {/* Description */}
          {task.description && (
            <p
              style={{ color: 'var(--color-stone)' }}
              className="text-sm leading-relaxed mt-2"
            >
              {task.description}
            </p>
          )}

          {/* Meta row */}
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 text-xs"
            style={{ color: 'var(--color-stone)' }}
          >
            <span className="flex items-center gap-1.5">
              <span className="opacity-60 uppercase tracking-wider">Created</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{formatDate(task.createdAt)}</span>
            </span>

            {task.dueDate && (
              <>
                <span className="opacity-30">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="opacity-60 uppercase tracking-wider">Due</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: isOverdue ? 'var(--color-ruby)' : 'inherit',
                    }}
                  >
                    {formatDate(task.dueDate)}
                  </span>
                  {isOverdue && (
                    <span
                      className="px-2 py-0.5 rounded uppercase text-[10px] font-bold tracking-wide"
                      style={{ background: '#f6e8e4', color: '#a23b2d' }}
                    >
                      Overdue
                    </span>
                  )}
                </span>
              </>
            )}

            <span className="opacity-30">•</span>
            {/* Static priority pill — changed only via the Edit form */}
            <span
              data-priority={task.priority}
              className="status-badge"
              style={{
                background: 'transparent',
                color: PRIORITY_COLOR[task.priority],
                border: `1px solid ${PRIORITY_COLOR[task.priority]}`,
                padding: '0.125rem 0.625rem',
              }}
            >
              {task.priority}
            </span>
          </div>
        </div>

        {/* Ghost action buttons */}
        <div className="flex flex-shrink-0 gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors hover:bg-[var(--color-mist)]"
            style={{ color: 'var(--color-stone)' }}
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteTask.isPending}
            className="px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors hover:bg-[var(--color-mist)] disabled:opacity-50"
            style={{ color: 'var(--color-ruby)' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
