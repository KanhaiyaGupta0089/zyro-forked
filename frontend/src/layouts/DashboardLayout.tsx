import { Outlet } from "react-router-dom";
import Sidebar from "../components/custom/navigation/Sidebar";
import Navbar from "../components/custom/navigation/Navbar";

const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-gray-800">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-white/40 to-amber-50/30 text-gray-700">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
