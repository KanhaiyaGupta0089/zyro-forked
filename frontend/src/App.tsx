import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";

import SignUp from "./components/custom/pages/auth/SignUp";
import Login from "./components/custom/pages/auth/Login";
import Forgot from "./components/custom/pages/auth/Forgot";

import "./App.css";
import Reset from "./components/custom/pages/auth/Reset";
import PageTransitionWrapper from "./components/custom/pages/auth/PageTransitionWrapper";
function App() {
  return (
    <div className="App">
      {/* 🔔 Global Toast Configuration */}
      <Toaster
        position="top-right"
        reverseOrder={true} 
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

          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#ffffff",
            },
          },

          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },

          loading: {
            iconTheme: {
              primary: "#facc15",
              secondary: "#ffffff",
            },
          },
        }}
      />

      {/* 🚦 Routes */}
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={
            <PageTransitionWrapper>
              <SignUp />
            </PageTransitionWrapper>
          } />
          <Route path="/signup" element={
            <PageTransitionWrapper>
              <SignUp />
            </PageTransitionWrapper>
          } />
          <Route path="/login" element={
            <PageTransitionWrapper>
              <Login />
            </PageTransitionWrapper>
          } />
          <Route path="/forgot-password" element={
            <PageTransitionWrapper>
              <Forgot />
            </PageTransitionWrapper>
          } />
          <Route path="/reset-password" element={
            <PageTransitionWrapper>
              <Reset />
            </PageTransitionWrapper>
          } />
        </Routes>
      </AnimatePresence>    </div>
  );
}

export default App;
