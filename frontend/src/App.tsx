import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import TaskList from './components/TaskList';
import ProtectedRoute from './components/ProtectedRoute';

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
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
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
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <TaskList />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
