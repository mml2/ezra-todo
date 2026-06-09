import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TaskList from './components/TaskList';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200 mb-8">
          <div className="max-w-7xl mx-auto py-5 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <TaskList />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
