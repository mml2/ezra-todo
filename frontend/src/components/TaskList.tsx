import { useState } from 'react';
import { useTasks, useTasksPaged } from '../hooks/useTasks';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import { TaskStatus, TaskPriority } from '../types/task';

export default function TaskList() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'All'>('All');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'All'>('All');

  // Reset to page 1 when filters change
  const handleFilterChange = (type: 'status' | 'priority', value: string) => {
    setPage(1);
    if (type === 'status') {
      setFilterStatus(value as TaskStatus | 'All');
    } else {
      setFilterPriority(value as TaskPriority | 'All');
    }
  };

  // Use paginated endpoint when no filters, otherwise fetch all tasks for filtering
  const hasFilters = filterStatus !== 'All' || filterPriority !== 'All';
  const { data: allTasks, isLoading: isLoadingAll, error: errorAll } = useTasks();
  const { data: pagedData, isLoading: isLoadingPaged, error: errorPaged } = useTasksPaged(page, 20);

  const isLoading = hasFilters ? isLoadingAll : isLoadingPaged;
  const error = hasFilters ? errorAll : errorPaged;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">
          Error loading tasks. Make sure the backend is running at localhost:5000
        </p>
      </div>
    );
  }

  // When filtering, use all tasks; otherwise use paginated data
  const allTasksList = allTasks || [];
  const pagedTasksList = pagedData?.items || [];

  let displayTasks = hasFilters ? allTasksList : pagedTasksList;

  const filteredTasks = displayTasks.filter((task) => {
    if (filterStatus !== 'All' && task.status !== filterStatus) return false;
    if (filterPriority !== 'All' && task.priority !== filterPriority) return false;
    return true;
  });

  // For filtered view, paginate client-side
  let paginatedFilteredTasks = filteredTasks;
  let currentPage = page;
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

  return (
    <div className="space-y-5">
      {/* Stats Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Task Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase font-medium mb-1">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase font-medium mb-1">To Do</p>
            <p className="text-2xl font-bold text-gray-600">{stats.todo}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-blue-600 uppercase font-medium mb-1">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-green-600 uppercase font-medium mb-1">Done</p>
            <p className="text-2xl font-bold text-green-600">{stats.done}</p>
          </div>
        </div>
      </div>

      {/* Info Text */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-sm text-gray-700">
          Manage your tasks efficiently. Use filters to find specific tasks by status or priority.
          Each page displays up to 20 tasks.
        </p>
      </div>

      {/* Create Task Form */}
      {showForm && (
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <TaskForm onSuccess={() => setShowForm(false)} />
        </div>
      )}

      {/* Filters and Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 mt-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-600">Filter:</span>

            <select
              value={filterStatus}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Status</option>
              <option value={TaskStatus.Todo}>Todo</option>
              <option value={TaskStatus.InProgress}>In Progress</option>
              <option value={TaskStatus.Done}>Done</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-md transition-colors text-sm"
          >
            {showForm ? 'Cancel' : '+ New Task'}
          </button>
        </div>
      </div>

      {/* Task Table */}
      {filteredTasks && filteredTasks.length > 0 ? (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(hasFilters ? paginatedFilteredTasks : filteredTasks).map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {((hasFilters && totalFilteredPages > 1) || (!hasFilters && pagedData && pagedData.totalPages > 1)) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {page} of {hasFilters ? totalFilteredPages : pagedData?.totalPages}
                  <span className="ml-2 text-gray-500">
                    ({hasFilters ? filteredTasks.length : pagedData?.totalCount} {hasFilters ? 'filtered' : 'total'} tasks)
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={hasFilters ? !hasPrev : !pagedData?.hasPreviousPage}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      (hasFilters ? hasPrev : pagedData?.hasPreviousPage)
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={hasFilters ? !hasNext : !pagedData?.hasNextPage}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      (hasFilters ? hasNext : pagedData?.hasNextPage)
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-16 text-center border border-gray-200">
          <p className="text-gray-500 text-base">
            {displayTasks && displayTasks.length > 0
              ? 'No tasks match the current filters'
              : 'No tasks yet. Click "+ New Task" to get started.'}
          </p>
        </div>
      )}
    </div>
  );
}
