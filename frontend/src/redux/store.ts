import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  devTools: import.meta.env.MODE !== "production",
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;