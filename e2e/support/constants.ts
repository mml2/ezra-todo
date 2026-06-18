export const FRONTEND_URL = 'http://localhost:3000';
// 5001 (not 5000): macOS Monterey+ runs the AirPlay Receiver / ControlCenter on
// *:5000, which shadows the backend's readiness probe. 5001 avoids that conflict.
export const BACKEND_URL = 'http://localhost:5001';
export const API_URL = `${BACKEND_URL}/api`;

export const AUTH_TOKEN_KEY = 'ezra_auth_token';
export const AUTH_USERNAME_KEY = 'ezra_auth_username';

export interface SeededUser {
  readonly username: string;
  readonly password: string;
}

export const ALICE: SeededUser = { username: 'alice', password: 'Password123!' };
export const BOB: SeededUser = { username: 'bob', password: 'Password123!' };
