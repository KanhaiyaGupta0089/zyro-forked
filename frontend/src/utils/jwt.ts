import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  exp: number;
  [key: string]: any;
}

export const isTokenValid = (token?: string | null): boolean => {
  // If no token is provided, try to get it from localStorage
  if (!token) {
    const storedAuthState = localStorage.getItem('authState');
    if (storedAuthState) {
      try {
        const authState = JSON.parse(storedAuthState);
        token = authState.token;
      } catch {
        return false;
      }
    }
  }

  if (!token) return false;

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch {
    return false;
  }
};