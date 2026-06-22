import axios from 'axios';
import type { LoginRequest, AuthResponse } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const TOKEN_KEY = 'ezra_auth_token';
const USERNAME_KEY = 'ezra_auth_username';

/**
 * Get stored authentication token from localStorage
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store authentication token in localStorage
 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Clear stored authentication token from localStorage
 */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Get stored username from localStorage
 */
export function getStoredUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}

/**
 * Store username in localStorage
 */
function setStoredUsername(username: string): void {
  localStorage.setItem(USERNAME_KEY, username);
}

/**
 * Clear stored username from localStorage
 */
function clearStoredUsername(): void {
  localStorage.removeItem(USERNAME_KEY);
}

/**
 * Clear all stored auth data
 */
export function clearAuthStorage(): void {
  clearToken();
  clearStoredUsername();
}

/**
 * Log in with username and password
 * @throws axios error on 401 or network failure
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await axios.post<AuthResponse>(
    `${API_BASE_URL}/auth/login`,
    credentials,
    {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  const authResponse = response.data;

  // Store token and username
  setToken(authResponse.token);
  setStoredUsername(authResponse.username);

  return authResponse;
}
