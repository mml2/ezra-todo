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
      <div
        className="min-h-screen animate-fade-in"
        style={{
          background: 'var(--color-paper)',
          backgroundImage: `
            linear-gradient(rgba(217, 119, 6, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(217, 119, 6, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      >
        <TaskList />
      </div>
    </QueryClientProvider>
  );
}

export default App;
