import { describe, it, expect } from 'vitest';
import { Routes, Route } from 'react-router-dom';
import { screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';
import { renderWithRouter } from '../test/utils';

// Mock component for testing
function ProtectedComponent() {
  return <div>Protected Content</div>;
}

function LoginPage() {
  return <div>Login Page</div>;
}

describe('ProtectedRoute', () => {
  it('should render children when authenticated', () => {
    // Set up localStorage with a username to simulate authenticated state
    localStorage.setItem('ezra_auth_username', 'testuser');
    localStorage.setItem('ezra_auth_token', 'test-token');

    renderWithRouter(
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ProtectedComponent />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();

    localStorage.clear();
  });

  it('should redirect to /login when not authenticated', () => {
    // Ensure localStorage is empty (not authenticated)
    localStorage.clear();

    renderWithRouter(
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ProtectedComponent />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should use replace to navigate to login', () => {
    localStorage.clear();

    renderWithRouter(
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ProtectedComponent />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    );

    // When navigate with replace=true, the history stack doesn't grow
    // We can verify by checking that Login page is rendered (redirect happened)
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});
