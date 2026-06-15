import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import { AuthProvider } from '../context/AuthContext';
import { renderWithProviders } from '../test/utils';

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the auth service
vi.mock('../services/auth', () => ({
  login: vi.fn(),
  getToken: vi.fn(() => null),
  setToken: vi.fn(),
  getStoredUsername: vi.fn(() => null),
  clearToken: vi.fn(),
  clearAuthStorage: vi.fn(),
}));

function renderLogin() {
  return renderWithProviders(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders username and password fields and submit button', () => {
    renderLogin();

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    renderLogin();

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    expect(await screen.findByText(/username is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('does not call login when validation fails', async () => {
    const user = userEvent.setup();
    const { login } = await import('../services/auth');

    renderLogin();

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(login).not.toHaveBeenCalled();
    });
  });

  it('calls login with credentials on successful validation and submission', async () => {
    const user = userEvent.setup();
    const { login: loginService } = await import('../services/auth');
    const loginMock = vi.mocked(loginService);
    loginMock.mockResolvedValue({
      token: 'test-token',
      expiresAt: '2026-06-15T23:59:59Z',
      username: 'testuser',
    });

    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.clear(usernameInput);
    await user.type(usernameInput, 'testuser');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
    });
  });

  it('navigates to / on successful login', async () => {
    const user = userEvent.setup();
    const { login: loginService } = await import('../services/auth');
    const loginMock = vi.mocked(loginService);
    loginMock.mockResolvedValue({
      token: 'test-token',
      expiresAt: '2026-06-15T23:59:59Z',
      username: 'testuser',
    });

    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows "Invalid username or password" error on 401 response', async () => {
    const user = userEvent.setup();
    const { login: loginService } = await import('../services/auth');
    const loginMock = vi.mocked(loginService);
    const axiosError = new Error('Unauthorized') as any;
    axiosError.response = { status: 401, data: {} };
    axiosError.isAxiosError = true;
    loginMock.mockRejectedValue(axiosError);

    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    expect(await screen.findByText(/invalid username or password/i)).toBeInTheDocument();
  });

  it('shows generic error message on other errors', async () => {
    const user = userEvent.setup();
    const { login: loginService } = await import('../services/auth');
    const loginMock = vi.mocked(loginService);
    const axiosError = new Error('Network Error') as any;
    axiosError.response = { status: 500, data: {} };
    axiosError.isAxiosError = true;
    loginMock.mockRejectedValue(axiosError);

    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(await screen.findByText(/something went wrong\. please try again\./i)).toBeInTheDocument();
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup();
    const { login: loginService } = await import('../services/auth');
    const loginMock = vi.mocked(loginService);
    loginMock.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /sign in/i }) as HTMLButtonElement;

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(usernameInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });
});
