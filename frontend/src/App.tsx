import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";

import SignUp from "./components/custom/pages/auth/SignUp";
import Login from "./components/custom/pages/auth/Login";
import Forgot from "./components/custom/pages/auth/Forgot";
import Reset from "./components/custom/pages/auth/Reset";
import PageTransitionWrapper from "./components/custom/pages/auth/PageTransitionWrapper";

import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";

import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/dashboard/Dashboard";

import { useSelector } from "react-redux";
import { RootState } from "./redux/store";

import "./App.css";

function App() {
  const AuthRedirect = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    
    if (user) {
      return <Navigate to="/dashboard" replace />;
    }
    
    return <Navigate to="/signup" replace />;
  };
  
  return (
    <div className="App">
      {/* 🔔 Global Toast */}
      <Toaster
        position="top-right"
        reverseOrder
        gutter={10}
        toastOptions={{
          duration: 3000,
          style: {
            background: "linear-gradient(135deg, #2563eb, #059669)",
            color: "#ffffff",
            borderRadius: "12px",
            padding: "14px 16px",
            fontSize: "14px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
          },
        }}
      />

      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<AuthRedirect />} />

          {/* ---------- PUBLIC ROUTES ---------- */}
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <PageTransitionWrapper>
                  <SignUp />
                </PageTransitionWrapper>
              </PublicRoute>
            }
          />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <PageTransitionWrapper>
                  <Login />
                </PageTransitionWrapper>
              </PublicRoute>
            }
          />

          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <PageTransitionWrapper>
                  <Forgot />
                </PageTransitionWrapper>
              </PublicRoute>
            }
          />

          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <PageTransitionWrapper>
                  <Reset />
                </PageTransitionWrapper>
              </PublicRoute>
            }
          />

          {/* ---------- PROTECTED ROUTES ---------- */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
          </Route>

          {/* ---------- FALLBACK ---------- */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default App;
