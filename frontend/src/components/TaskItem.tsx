import { useState } from 'react';
import { useUpdateTaskStatus, useDeleteTask } from '../hooks/useTasks';
import { Task, TaskStatus, TaskPriority } from '../types/task';
import TaskForm from './TaskForm';
import Modal from './Modal';

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

const PRIORITY_BG: Record<TaskPriority, string> = {
  [TaskPriority.Low]: '#e8efe9',
  [TaskPriority.Medium]: '#f4ecd9',
  [TaskPriority.High]: '#f6e2dd',
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

  return (
    <div className="editorial-card p-7">
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)}>
        <TaskForm
          task={task}
          onSuccess={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      </Modal>

      <div className="flex items-start gap-4">
        {/* Priority dot */}
        <span
          className={`priority-dot mt-1.5 flex-shrink-0 ${PRIORITY_DOT[task.priority]}`}
          aria-hidden="true"
        />

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3
            style={{
              fontFamily: 'var(--font-sans)',
              color:
                task.status === TaskStatus.Done ? 'var(--color-stone)' : 'var(--color-ink)',
            }}
            className={`text-lg font-bold leading-tight transition-all ${
              task.status === TaskStatus.Done ? 'line-through opacity-60' : ''
            }`}
          >
            {task.title}
          </h3>

          {/* Description */}
          {task.description && (
            <p
              style={{ color: 'var(--color-stone)', fontFamily: 'var(--font-sans)' }}
              className="text-sm leading-relaxed mt-2"
            >
              {task.description}
            </p>
          )}

          {/* Meta row — status pill, priority pill, then due/created */}
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 text-sm"
            style={{ color: 'var(--color-stone)', fontFamily: 'var(--font-sans)' }}
          >
            {/* Clickable status pill — click to advance */}
            <button
              type="button"
              onClick={handleAdvanceStatus}
              disabled={updateStatus.isPending}
              title="Click to advance status"
              className={`status-badge flex-shrink-0 cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-50 ${STATUS_CLASS[task.status]}`}
            >
              <span
                aria-hidden="true"
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: 'currentColor' }}
              />
              {STATUS_LABEL[task.status]}
            </button>

            {/* Static priority pill — changed only via the Edit form */}
            <span
              data-priority={task.priority}
              className="status-badge"
              style={{
                background: PRIORITY_BG[task.priority],
                color: PRIORITY_COLOR[task.priority],
              }}
            >
              {task.priority}
            </span>

            {task.dueDate && (
              <span className="flex items-center gap-1.5">
                <span style={{ color: isOverdue ? 'var(--color-ruby)' : 'inherit' }}>
                  Due {formatDate(task.dueDate)}
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
            )}

            <span>Created {formatDate(task.createdAt)}</span>
          </div>
        </div>

        {/* Outlined action buttons, pinned top-right */}
        <div className="flex flex-shrink-0 gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-1.5 text-sm font-semibold rounded-lg border transition-colors hover:bg-[var(--color-mist)]"
            style={{ color: 'var(--color-stone)', borderColor: 'var(--color-line-strong)' }}
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteTask.isPending}
            className="px-4 py-1.5 text-sm font-semibold rounded-lg border transition-colors hover:bg-[var(--color-mist)] disabled:opacity-50"
            style={{ color: 'var(--color-stone)', borderColor: 'var(--color-line-strong)' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
