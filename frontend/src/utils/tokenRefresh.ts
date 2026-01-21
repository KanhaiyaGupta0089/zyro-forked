// Shared utility for token refresh that can be used across all API clients
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Function to get API URL
const getApiUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
};

// Function to refresh token
export const refreshAccessToken = async (): Promise<{ access_token: string; refresh_token: string }> => {
  const storedAuthState = localStorage.getItem('authState');
  if (!storedAuthState) {
    throw new Error('No auth state found');
  }

  const authState = JSON.parse(storedAuthState);
  const refreshToken = authState.refresh_token;

  if (!refreshToken) {
    throw new Error('No refresh token found');
  }

  const response = await axios.post(
    `${getApiUrl()}/auth/refresh`,
    { refresh_token: refreshToken }
  );

  const { access_token, refresh_token } = response.data.data;

  // Update localStorage
  const newAuthState = {
    ...authState,
    token: access_token,
    refresh_token: refresh_token,
  };
  localStorage.setItem('authState', JSON.stringify(newAuthState));

  return { access_token, refresh_token };
};

// Create a response interceptor that handles token refresh
export const createTokenRefreshInterceptor = (apiClient: any) => {
  apiClient.interceptors.response.use(
    (response: any) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // If error is 401 and we haven't tried to refresh yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return apiClient(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const { access_token } = await refreshAccessToken();

          // Update the original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }

          // Process queued requests
          processQueue(null, access_token);

          isRefreshing = false;

          // Retry the original request
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear auth state and redirect to login
          processQueue(refreshError, null);
          isRefreshing = false;
          localStorage.removeItem('authState');
          
          // Redirect to login if not already there
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
};
