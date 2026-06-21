import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useTasks, useTasksPaged } from '../hooks/useTasks';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import Modal from './Modal';
import { TaskStatus, TaskPriority } from '../types/task';

export default function TaskList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'All'>('All');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'All'>('All');

  const handleLogout = () => {
    logout();
    // Drop cached task data so the next user doesn't briefly see the previous
    // user's tasks (queries have a 30s staleTime and aren't user-scoped).
    queryClient.clear();
    navigate('/login');
  };

  const handleFilterChange = (type: 'status' | 'priority', value: string) => {
    setPage(1);
    if (type === 'status') {
      setFilterStatus(value as TaskStatus | 'All');
    } else {
      setFilterPriority(value as TaskPriority | 'All');
    }
  };

  const hasFilters = filterStatus !== 'All' || filterPriority !== 'All';
  const { data: allTasks, isLoading: isLoadingAll, error: errorAll } = useTasks();
  const { data: pagedData, isLoading: isLoadingPaged, error: errorPaged } = useTasksPaged(page, 20);

  const isLoading = hasFilters ? isLoadingAll : isLoadingPaged;
  const error = hasFilters ? errorAll : errorPaged;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center animate-fade-in">
          <div className="inline-block w-16 h-16 border-4 border-[var(--color-mist)] border-t-[var(--color-amber)] rounded-full animate-spin mb-4"></div>
          <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-stone)' }} className="text-sm uppercase tracking-widest">
            Loading Tasks
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-20 animate-slide-up">
        <div className="editorial-card accent-border p-8">
          <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-ruby)' }} className="text-2xl mb-3">
            Connection Error
          </h2>
          <p style={{ color: 'var(--color-stone)' }} className="text-sm leading-relaxed">
            Unable to connect to the backend server. Please ensure the API is running at <code className="px-2 py-1 bg-[var(--color-mist)] rounded">localhost:5001</code>
          </p>
        </div>
      </div>
    );
  }

  const allTasksList = allTasks || [];
  const pagedTasksList = pagedData?.items || [];
  let displayTasks = hasFilters ? allTasksList : pagedTasksList;

  const filteredTasks = displayTasks.filter((task) => {
    if (filterStatus !== 'All' && task.status !== filterStatus) return false;
    if (filterPriority !== 'All' && task.priority !== filterPriority) return false;
    return true;
  });

  let paginatedFilteredTasks = filteredTasks;
  let totalFilteredPages = 1;
  let hasNext = false;
  let hasPrev = false;

  if (hasFilters) {
    const pageSize = 20;
    totalFilteredPages = Math.ceil(filteredTasks.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    paginatedFilteredTasks = filteredTasks.slice(startIndex, endIndex);
    hasNext = page < totalFilteredPages;
    hasPrev = page > 1;
  }

  const stats = {
    total: hasFilters ? allTasksList.length : (pagedData?.totalCount || 0),
    todo: allTasksList.filter(t => t.status === TaskStatus.Todo).length || 0,
    inProgress: allTasksList.filter(t => t.status === TaskStatus.InProgress).length || 0,
    done: allTasksList.filter(t => t.status === TaskStatus.Done).length || 0,
  };

  const statTiles = [
    { label: 'Total', value: stats.total, color: 'var(--color-ink)' },
    { label: 'To Do', value: stats.todo, color: 'var(--color-stone)' },
    { label: 'Active', value: stats.inProgress, color: 'var(--color-amber)' },
    { label: 'Complete', value: stats.done, color: 'var(--color-emerald)' },
  ];

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6">
      <div className="max-w-[880px] mx-auto">
        {/* Header */}
        <header className="mb-12 animate-slide-up">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-ink)' }}
                className="text-2xl font-bold leading-none"
              >
                Task Manager
              </h1>
              <p style={{ color: 'var(--color-stone)' }} className="text-sm mt-1.5">
                A calm, deliberate way to track your work.
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              {user?.username && (
                <span style={{ color: 'var(--color-stone)' }} className="text-sm font-semibold">
                  {user.username}
                </span>
              )}
              <button
                onClick={handleLogout}
                style={{ background: 'var(--color-mist)', color: 'var(--color-stone)' }}
                className="px-4 py-2 text-sm font-semibold rounded-sm hover:bg-[var(--color-stone)] hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Stat strip — one bordered card with hairline dividers */}
        <div
          className="editorial-card mb-12 animate-slide-up stagger-1 flex divide-x"
          style={{ borderColor: 'var(--color-mist)' }}
        >
          {statTiles.map((tile) => (
            <div
              key={tile.label}
              data-stat={tile.label}
              className="flex-1 px-5 py-4"
              style={{ borderColor: 'var(--color-mist)' }}
            >
              <span
                style={{ color: 'var(--color-stone)' }}
                className="block text-xs uppercase tracking-widest font-semibold"
              >
                {tile.label}
              </span>
              <p
                data-stat-value
                style={{ fontFamily: 'var(--font-mono)', color: tile.color }}
                className="text-2xl font-semibold mt-1.5"
              >
                {tile.value}
              </p>
            </div>
          ))}
        </div>

        {/* Tasks heading row — filters + New Task share the row with the heading */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 animate-slide-up stagger-2">
          <div className="flex items-baseline gap-3">
            <h2
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-ink)' }}
              className="text-xl font-bold"
            >
              Tasks
            </h2>
            <span style={{ color: 'var(--color-stone)' }} className="text-sm">
              {stats.total} {stats.total === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="select-editorial"
            >
              <option value="All">All Status</option>
              <option value={TaskStatus.Todo}>To Do</option>
              <option value={TaskStatus.InProgress}>In Progress</option>
              <option value={TaskStatus.Done}>Done</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="select-editorial"
            >
              <option value="All">All Priorities</option>
              <option value={TaskPriority.Low}>Low</option>
              <option value={TaskPriority.Medium}>Medium</option>
              <option value={TaskPriority.High}>High</option>
            </select>

            {(filterStatus !== 'All' || filterPriority !== 'All') && (
              <button
                onClick={() => {
                  setPage(1);
                  setFilterStatus('All');
                  setFilterPriority('All');
                }}
                style={{ color: 'var(--color-amber)' }}
                className="text-sm font-semibold hover:underline transition-all uppercase tracking-wide"
              >
                Clear
              </button>
            )}

            <button onClick={() => setShowForm(true)} className="btn-primary">
              + New Task
            </button>
          </div>
        </div>

        {/* Create Form — modal popup */}
        <Modal isOpen={showForm} onClose={() => setShowForm(false)}>
          <TaskForm
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </Modal>

        {/* Task Grid */}
        {filteredTasks && filteredTasks.length > 0 ? (
          <>
            <div className="space-y-3 mb-8">
              {(hasFilters ? paginatedFilteredTasks : filteredTasks).map((task, index) => (
                <div
                  key={task.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <TaskItem task={task} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {((hasFilters && totalFilteredPages > 1) || (!hasFilters && pagedData && pagedData.totalPages > 1)) && (
              <div className="editorial-card p-6 animate-fade-in">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div style={{ color: 'var(--color-stone)' }} className="text-sm">
                    <span style={{ fontFamily: 'var(--font-serif)' }} className="font-semibold text-[var(--color-ink)]">
                      Page {page}
                    </span>
                    {' of '}
                    <span style={{ fontFamily: 'var(--font-serif)' }} className="font-semibold text-[var(--color-ink)]">
                      {hasFilters ? totalFilteredPages : pagedData?.totalPages}
                    </span>
                    <span className="ml-3 opacity-60">
                      ({hasFilters ? filteredTasks.length : pagedData?.totalCount} {hasFilters ? 'filtered' : 'total'})
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={hasFilters ? !hasPrev : !pagedData?.hasPreviousPage}
                      className={`px-6 py-2.5 text-sm font-semibold uppercase tracking-wide rounded-sm transition-all ${
                        (hasFilters ? hasPrev : pagedData?.hasPreviousPage)
                          ? 'bg-[var(--color-ink)] text-white hover:bg-[var(--color-stone)] hover:shadow-lg hover:-translate-y-0.5'
                          : 'bg-[var(--color-mist)] text-[var(--color-stone)] opacity-50 cursor-not-allowed'
                      }`}
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={hasFilters ? !hasNext : !pagedData?.hasNextPage}
                      className={`px-6 py-2.5 text-sm font-semibold uppercase tracking-wide rounded-sm transition-all ${
                        (hasFilters ? hasNext : pagedData?.hasNextPage)
                          ? 'bg-[var(--color-ink)] text-white hover:bg-[var(--color-stone)] hover:shadow-lg hover:-translate-y-0.5'
                          : 'bg-[var(--color-mist)] text-[var(--color-stone)] opacity-50 cursor-not-allowed'
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="editorial-card p-20 text-center animate-fade-in">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-mist)] flex items-center justify-center">
                <span className="text-3xl opacity-40">📝</span>
              </div>
              <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-stone)' }} className="text-xl mb-2">
                {displayTasks && displayTasks.length > 0
                  ? 'No tasks match your filters'
                  : 'Your task list is empty'}
              </p>
              <p style={{ color: 'var(--color-stone)' }} className="text-sm opacity-60">
                {displayTasks && displayTasks.length > 0
                  ? 'Try adjusting your filter criteria'
                  : 'Click "New Task" above to begin'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
