import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";

import SignUp from "@/components/custom/pages/auth/SignUp";
import Login from "@/components/custom/pages/auth/Login";
import Forgot from "@/components/custom/pages/auth/Forgot";
import Reset from "@/components/custom/pages/auth/Reset";
import AcceptInvitation from "@/components/custom/pages/auth/AcceptInvitation";
import PageTransitionWrapper from "@/components/custom/pages/auth/PageTransitionWrapper";

import ProtectedRoute from "@/routes/ProtectedRoute";
import PublicRoute from "@/routes/PublicRoute";

import HomeLayout from "@/layouts/HomeLayout";
import Home from "@/pages/manager/home/Home";

import SettingsLayout from "@/pages/manager/settings/SettingsLayout";
import OrganizationSettings from "@/pages/manager/settings/OrganizationSettings";
import ProfileSettings from "@/pages/manager/settings/ProfileSettings";
import BillingSettings from "@/pages/manager/settings/BillingSettings";
import SecuritySettings from "@/pages/manager/settings/SecuritySettings";

import { RootState } from "@/redux/store";

import RoleProtectedRoute from "@/routes/RoleProtectedRoute";

import AdminPage from "@/pages/admin/index";
import ManagerPage from "@/pages/manager/index";
import EmployeePage from "@/pages/employee/index";

import Project from "@/pages/manager/projects/Project";
import CreateProject from "@/pages/manager/projects/CreateProject";
import ProjectDetails from "@/pages/manager/projects/ProjectDetails";
import EditProject from "@/pages/manager/projects/EditProject";
import Issue from "@/pages/manager/issue/Issue";
// import OverviewTab from "@/pages/manager/projects/tabs/OverviewTab";
// import IssuesTab from "@/pages/manager/projects/tabs/IssuesTab";
// import KanbanTab from "@/pages/manager/projects/tabs/KanbanTab";
// import TeamTab from "@/pages/manager/projects/tabs/TeamTab";
// import TimelineTab from "@/pages/manager/projects/tabs/TimelineTab";
// import AnalyticsTab from "@/pages/manager/projects/tabs/AnalyticsTab";
// import SettingsTab from "@/pages/manager/projects/tabs/SettingsTab";
import People from "@/pages/manager/people/People";

import "./App.css";

function App() {
  // 🔁 Redirect logic for root path
  const AuthRedirect = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    return user ? (
      <Navigate to="/manager" replace />
    ) : (
      <Navigate to="/signup" replace />
    );
  };

  return (
    <div className="App">
      {/* 🔔 Global Toast Configuration */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={10}
        toastOptions={{
          duration: 3000,
          style: {
            background: "linear-gradient(135deg, #2563eb, #059669)",
            color: "#ffffff",
            borderRadius: "12px",
            padding: "14px 16px",
            fontSize: "14px",
            fontWeight: 500,
            boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
          },
          success: {
            duration: 2500,
          },
          error: {
            duration: 4500,
          },
          loading: {
            duration: Infinity,
          },
        }}
      />
      <AnimatePresence mode="wait">
        <Routes>
          {/* ---------- ROOT ---------- */}
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

          <Route
            path="/verify-token/:raw_token"
            element={
              <PublicRoute>
                <PageTransitionWrapper>
                  <AcceptInvitation />
                </PageTransitionWrapper>
              </PublicRoute>
            }
          />

          {/* ---------- HOME ---------- */}
          <Route
            path="/manager"
            element={
              <ProtectedRoute>
                <HomeLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
          </Route>

          {/* ---------- ADMIN DASHBOARD ---------- */}
          <Route
            path="/admin"
            element={
              <RoleProtectedRoute allowedRoles={['admin']}>
                <HomeLayout />
              </RoleProtectedRoute>
            }
          >
            <Route index element={<AdminPage />} />
          </Route>

          {/* ---------- MANAGER DASHBOARD ---------- */}
          <Route
            path="/manager"
            element={
              <RoleProtectedRoute allowedRoles={['manager', 'admin']}>
                <HomeLayout />
              </RoleProtectedRoute>
            }
          >
            <Route index element={<ManagerPage />} />
          </Route>

          {/* ---------- EMPLOYEE DASHBOARD ---------- */}
          <Route
            path="/employee"
            element={
              <RoleProtectedRoute allowedRoles={['employee', 'manager', 'admin']}>
                <HomeLayout />
              </RoleProtectedRoute>
            }
          >
            <Route index element={<EmployeePage />} />
          </Route>

          {/* ---------- PROJECTS ---------- */}
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <HomeLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Project />} />
            <Route path="create" element={<CreateProject />} />
            <Route path=":id/edit" element={<EditProject />} />
            {/* Nested routes for project details with tabs */}
            <Route path=":id" element={<ProjectDetails />}>
              {/* <Route index element={<OverviewTab />} />
              <Route path="overview" element={<OverviewTab />} />
              <Route path="issues" element={<IssuesTab />} />
              <Route path="kanban" element={<KanbanTab />} />
              <Route path="team" element={<TeamTab />} />
              <Route path="timeline" element={<TimelineTab />} />
              <Route path="analytics" element={<AnalyticsTab />} />
              <Route path="settings" element={<SettingsTab />} /> */}
            </Route>
          </Route>

          {/* ---------- ISSUES ---------- */}
          <Route
            path="/issues"
            element={
              <ProtectedRoute>
                <HomeLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Issue />} />
          </Route>

          {/* ---------- SETTINGS ---------- */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <HomeLayout />
              </ProtectedRoute>
            }
          >
            <Route element={<SettingsLayout />}>
              <Route index element={<OrganizationSettings />} />
              <Route path="organization" element={<OrganizationSettings />} />
              <Route path="profile" element={<ProfileSettings />} />
              <Route path="billing" element={<BillingSettings />} />
              <Route path="security" element={<SecuritySettings />} />
            </Route>
          </Route>

          {/* ---------- PEOPLE ---------- */}
          <Route
            path="/people"
            element={
              <RoleProtectedRoute allowedRoles={['manager', 'admin']}>
                <HomeLayout />
              </RoleProtectedRoute>
            }
          >
            <Route index element={<People />} />
          </Route>

          {/* ---------- FALLBACK ---------- */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default App;
