import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, render } from '@testing-library/react';
import { renderWithProviders } from '../test/utils';
import { AuthProvider, useAuth } from './AuthContext';

// Mock the auth service
vi.mock('../services/auth', () => ({
  login: vi.fn(),
  getToken: vi.fn(() => null),
  setToken: vi.fn(),
  getStoredUsername: vi.fn(() => null),
  clearToken: vi.fn(),
  clearAuthStorage: vi.fn(),
}));

// Test component that uses the useAuth hook
function TestComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <div>
      <div data-testid="user">
        {user ? `User: ${user.username}` : 'No user'}
      </div>
      <div data-testid="authenticated">
        {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
      </div>
      <button
        onClick={() => login({ username: 'testuser', password: 'password123' })}
        data-testid="login-button"
      >
        Login
      </button>
      <button onClick={logout} data-testid="logout-button">
        Logout
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('AuthProvider and useAuth', () => {
    it('should initialize with null user when no stored username', async () => {
      const { getStoredUsername } = await import('../services/auth');
      vi.mocked(getStoredUsername).mockReturnValue(null);

      renderWithProviders(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not authenticated');
    });

    it('should initialize with stored username from localStorage on page refresh', async () => {
      const { getStoredUsername } = await import('../services/auth');
      vi.mocked(getStoredUsername).mockReturnValue('alice');

      renderWithProviders(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('User: alice');
      });
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    });

    it('should update user on successful login', async () => {
      const { login: loginService, getStoredUsername } = await import('../services/auth');
      vi.mocked(getStoredUsername).mockReturnValue(null);
      vi.mocked(loginService).mockResolvedValue({
        token: 'test-token',
        expiresAt: '2026-06-15T23:59:59Z',
        username: 'alice',
      });

      renderWithProviders(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByTestId('login-button');
      loginButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('User: alice');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      });

      expect(loginService).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
    });

    it('should call clearAuthStorage on logout and reset user', async () => {
      const { getStoredUsername, clearAuthStorage } = await import('../services/auth');
      vi.mocked(getStoredUsername).mockReturnValue('alice');

      renderWithProviders(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Verify initial authenticated state
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      });

      // Update mock to return null after logout
      vi.mocked(getStoredUsername).mockReturnValue(null);

      const logoutButton = screen.getByTestId('logout-button');
      logoutButton.click();

      await waitFor(() => {
        expect(clearAuthStorage).toHaveBeenCalled();
        expect(screen.getByTestId('user')).toHaveTextContent('No user');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Not authenticated');
      });
    });
  });

  describe('useAuth hook error handling', () => {
    it('should throw error when useAuth is used outside AuthProvider', async () => {
      // Suppress the expected error logs
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        // Use raw render (not renderWithProviders) so TestComponent is not wrapped in AuthProvider
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleErrorSpy.mockRestore();
    });
  });
});
