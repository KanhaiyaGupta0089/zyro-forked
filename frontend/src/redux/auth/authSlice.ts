import { createSlice } from "@reduxjs/toolkit";
import {
  loginUser,
  registerUser,
} from "./authThunks";
import { AuthState } from "./authTypes";

// Load auth state from localStorage on app start
const loadAuthState = (): AuthState => {
  try {
    const serializedState = localStorage.getItem('authState');
    if (serializedState === null) {
      return {
        user: null,
        token: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      };
    }
    const parsedState = JSON.parse(serializedState);
    
    // Validate token if it exists
    if (parsedState.token) {
      try {
        const tokenParts = parsedState.token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          
          // If token is expired, return initial state
          if (payload.exp && payload.exp < currentTime) {
            localStorage.removeItem('authState');
            return {
              user: null,
              token: null,
              loading: false,
              error: null,
              isAuthenticated: false,
            };
          }
        }
      } catch (error) {
        console.error('Error parsing token:', error);
        // If there's an error parsing the token, return initial state
        return {
          user: null,
          token: null,
          loading: false,
          error: null,
          isAuthenticated: false,
        };
      }
    }
    
    return parsedState;
  } catch (err) {
    console.error('Error loading auth state from localStorage:', err);
    return {
      user: null,
      token: null,
      loading: false,
      error: null,
      isAuthenticated: false,
    };
  }
};

const initialState: AuthState = loadAuthState();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      // Remove auth state from localStorage on logout
      localStorage.removeItem('authState');
    },
    clearAuthError(state) {
      state.error = null;
    },
    // Action to manually set auth state
    setAuthState(state, action) {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = !!user && !!token;
      
      // Save auth state to localStorage
      const serializedState = JSON.stringify({
        user,
        token,
        loading: state.loading,
        error: state.error,
        isAuthenticated: state.isAuthenticated,
      });
      localStorage.setItem('authState', serializedState);
    },
  },
  extraReducers: (builder) => {
    builder

      /* LOGIN */
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user_data;
        state.token = action.payload.access_token;
        state.isAuthenticated = true;
        
        // Save auth state to localStorage
        const serializedState = JSON.stringify({
          user: action.payload.user_data,
          token: action.payload.access_token,
          loading: state.loading,
          error: state.error,
          isAuthenticated: state.isAuthenticated,
        });
        localStorage.setItem('authState', serializedState);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* SIGNUP */
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        // For signup, we may want to set user data if returned from backend
        if (action.payload && action.payload.user_data) {
          state.user = action.payload.user_data;
          state.token = action.payload.access_token;
          state.isAuthenticated = true;
          
          // Save auth state to localStorage
          const serializedState = JSON.stringify({
            user: action.payload.user_data,
            token: action.payload.access_token,
            loading: state.loading,
            error: state.error,
            isAuthenticated: state.isAuthenticated,
          });
          localStorage.setItem('authState', serializedState);
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearAuthError, setAuthState } = authSlice.actions;
export default authSlice.reducer;