import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import {
  setToken,
  getToken,
  clearToken,
  getStoredUsername,
  clearAuthStorage,
  login,
} from './auth';

// Mock axios
vi.mock('axios');

describe('auth service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('token storage', () => {
    it('should store and retrieve token from localStorage', () => {
      const token = 'test-jwt-token-12345';

      setToken(token);
      const retrieved = getToken();

      expect(retrieved).toBe(token);
      expect(localStorage.getItem('ezra_auth_token')).toBe(token);
    });

    it('should clear token from localStorage', () => {
      const token = 'test-jwt-token-12345';

      setToken(token);
      expect(getToken()).toBe(token);

      clearToken();
      expect(getToken()).toBeNull();
      expect(localStorage.getItem('ezra_auth_token')).toBeNull();
    });

    it('should return null when no token is stored', () => {
      expect(getToken()).toBeNull();
    });
  });

  describe('username storage', () => {
    it('should retrieve stored username from localStorage', () => {
      const username = 'alice';
      localStorage.setItem('ezra_auth_username', username);

      expect(getStoredUsername()).toBe(username);
    });

    it('should return null when no username is stored', () => {
      expect(getStoredUsername()).toBeNull();
    });
  });

  describe('clearAuthStorage', () => {
    it('should clear both token and username from localStorage', () => {
      const token = 'test-token';
      const username = 'alice';

      setToken(token);
      localStorage.setItem('ezra_auth_username', username);

      expect(getToken()).toBe(token);
      expect(getStoredUsername()).toBe(username);

      clearAuthStorage();

      expect(getToken()).toBeNull();
      expect(getStoredUsername()).toBeNull();
    });
  });

  describe('login', () => {
    it('should POST to /auth/login with credentials', async () => {
      const mockAxios = vi.mocked(axios);
      const credentials = { username: 'alice', password: 'password123' };
      const authResponse = {
        token: 'jwt-token-abc',
        expiresAt: '2026-06-15T23:59:59Z',
        username: 'alice',
      };

      mockAxios.post.mockResolvedValue({
        data: authResponse,
      });

      const result = await login(credentials);

      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        credentials,
        expect.objectContaining({
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual(authResponse);
    });

    it('should store token and username in localStorage on successful login', async () => {
      const mockAxios = vi.mocked(axios);
      const credentials = { username: 'alice', password: 'password123' };
      const authResponse = {
        token: 'jwt-token-abc',
        expiresAt: '2026-06-15T23:59:59Z',
        username: 'alice',
      };

      mockAxios.post.mockResolvedValue({
        data: authResponse,
      });

      await login(credentials);

      expect(getToken()).toBe('jwt-token-abc');
      expect(getStoredUsername()).toBe('alice');
    });

    it('should return the full AuthResponse on successful login', async () => {
      const mockAxios = vi.mocked(axios);
      const authResponse = {
        token: 'jwt-token-abc',
        expiresAt: '2026-06-15T23:59:59Z',
        username: 'alice',
      };

      mockAxios.post.mockResolvedValue({
        data: authResponse,
      });

      const result = await login({
        username: 'alice',
        password: 'password123',
      });

      expect(result.token).toBe('jwt-token-abc');
      expect(result.expiresAt).toBe('2026-06-15T23:59:59Z');
      expect(result.username).toBe('alice');
    });

    it('should reject on 401 error and not store credentials', async () => {
      const mockAxios = vi.mocked(axios);
      const credentials = { username: 'alice', password: 'wrongpassword' };
      const axiosError = new Error('Unauthorized') as any;
      axiosError.response = { status: 401, data: { message: 'Invalid credentials' } };
      axiosError.isAxiosError = true;

      mockAxios.post.mockRejectedValue(axiosError);

      await expect(login(credentials)).rejects.toThrow();

      expect(getToken()).toBeNull();
      expect(getStoredUsername()).toBeNull();
    });

    it('should reject on network error and not store credentials', async () => {
      const mockAxios = vi.mocked(axios);
      const credentials = { username: 'alice', password: 'password123' };
      const networkError = new Error('Network error');

      mockAxios.post.mockRejectedValue(networkError);

      await expect(login(credentials)).rejects.toThrow('Network error');

      expect(getToken()).toBeNull();
      expect(getStoredUsername()).toBeNull();
    });

    it('should reject on 500 error and not store credentials', async () => {
      const mockAxios = vi.mocked(axios);
      const credentials = { username: 'alice', password: 'password123' };
      const axiosError = new Error('Server Error') as any;
      axiosError.response = { status: 500, data: { message: 'Internal Server Error' } };
      axiosError.isAxiosError = true;

      mockAxios.post.mockRejectedValue(axiosError);

      await expect(login(credentials)).rejects.toThrow();

      expect(getToken()).toBeNull();
      expect(getStoredUsername()).toBeNull();
    });

    it('should include correct API endpoint URL', async () => {
      const mockAxios = vi.mocked(axios);
      const credentials = { username: 'testuser', password: 'pass' };

      mockAxios.post.mockResolvedValue({
        data: {
          token: 'token',
          expiresAt: '2026-06-15T23:59:59Z',
          username: 'testuser',
        },
      });

      await login(credentials);

      const callArgs = mockAxios.post.mock.calls[0];
      const url = callArgs[0] as string;
      expect(url).toMatch(/\/auth\/login$/);
    });
  });
});
