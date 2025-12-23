import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../redux/store";
import { logout } from "../../../redux/auth/authSlice";
import {
  Bell,
  Search,
  Menu,
  ChevronDown,
  LogOut,
  User,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 h-16 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-blue-200/30 px-4 md:px-6 flex items-center justify-between">
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 rounded-lg hover:bg-blue-100 text-blue-600">
          <Menu size={20} />
        </button>

        {isMobileSearchOpen ? (
          <div className="relative flex-1 md:hidden">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search projects, tasks..."
              className="bg-blue-100/50 border border-blue-200/50 rounded-lg pl-10 pr-10 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400"
              autoFocus
            />
            <button 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-blue-200 text-blue-600"
              onClick={() => setIsMobileSearchOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="relative hidden md:block">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search projects, tasks..."
              className="bg-blue-100/50 border border-blue-200/50 rounded-lg pl-10 pr-4 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400" />
          </div>
        )}
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4 md:gap-6">
        {!isMobileSearchOpen && (
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-blue-100 text-blue-600"
            onClick={() => setIsMobileSearchOpen(true)}
          >
            <Search size={20} />
          </button>
        )}

        <button className="relative p-2 rounded-lg hover:bg-blue-100 text-blue-600">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 px-2 py-1 rounded-lg hover:bg-blue-100/50 transition"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>

            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-800">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500">
                {user?.role || "Member"}
              </p>
            </div>

            <ChevronDown size={16} className="hidden md:block text-gray-500" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-52 bg-white/90 backdrop-blur-sm border border-emerald-200/50 rounded-xl shadow-lg overflow-hidden">
              <button
                onClick={() => navigate("/profile")}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-emerald-100/50 text-emerald-700"
              >
                <User size={16} />
                Profile
              </button>

              <button
                onClick={() => navigate("/settings")}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-emerald-100/50 text-emerald-700"
              >
                <Settings size={16} />
                Settings
              </button>

              <div className="border-t border-gray-200" />

              <button
                onClick={() => {
                  dispatch(logout());
                  navigate("/login");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-100"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
