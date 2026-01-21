/* ---------------------------------- */
/* User Type */
/* ---------------------------------- */
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

/* ---------------------------------- */
/* Auth State */
/* ---------------------------------- */
export interface AuthState {
  user: User | null;
  token: string | null;
  refresh_token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

/* ---------------------------------- */
/* Payload Types */
/* ---------------------------------- */
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface GoogleSignInPayload {
  id_token: string;
}

export interface SetAuthStatePayload {
  user: User | null;
  token: string | null;
}

/* ---------------------------------- */
/* API Response Types */
/* ---------------------------------- */
export interface AuthResponseData {
  access_token: string;
  refresh_token: string;
  user_data: User;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}