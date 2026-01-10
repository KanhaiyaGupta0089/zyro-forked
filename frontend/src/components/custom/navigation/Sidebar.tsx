import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Home,
  FolderKanban,
  CheckSquare,
  User,
  Settings,
  ChevronRight,
  X,
  LayoutDashboard,
  Rocket,
} from "lucide-react";
import { RootState } from "../../../redux/store";

/* ======================================================
   Sidebar
====================================================== */

const Sidebar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);

  /* Close on route change */
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  /* Close if resized to desktop */
  useEffect(() => {
    const onResize = () => window.innerWidth >= 768 && setIsMobileOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* Role-based navigation */
  const NAV: Record<string, any[]> = {
    admin: [
      { path: "/admin", label: "Home", icon: Home },
      { path: "/workspace", label: "Workspace", icon: LayoutDashboard },
      { path: "/projects", label: "Projects", icon: FolderKanban },
      { path: "/manager/sprints", label: "Sprints", icon: Rocket },
      { path: "/issues", label: "Issues", icon: CheckSquare },
      { path: "/people", label: "People", icon: User },
      { path: "/settings", label: "Settings", icon: Settings },
    ],
    manager: [
      { path: "/manager", label: "Home", icon: Home },
      { path: "/workspace", label: "Workspace", icon: LayoutDashboard },
      { path: "/projects", label: "Projects", icon: FolderKanban },
      { path: "/manager/sprints", label: "Sprints", icon: Rocket },
      { path: "/issues", label: "Issues", icon: CheckSquare },
      { path: "/people", label: "People", icon: User },
      { path: "/settings", label: "Settings", icon: Settings },
    ],
    employee: [
      { path: "/employee", label: "Home", icon: Home },
      { path: "/workspace", label: "Workspace", icon: LayoutDashboard },
      { path: "/projects", label: "Projects", icon: FolderKanban },
      { path: "/issues", label: "Issues", icon: CheckSquare },
      { path: "/settings", label: "Settings", icon: Settings },
    ],
    default: [
      { path: "/home", label: "Home", icon: Home },
      { path: "/workspace", label: "Workspace", icon: LayoutDashboard },
      { path: "/projects", label: "Projects", icon: FolderKanban },
      { path: "/issues", label: "Issues", icon: CheckSquare },
      { path: "/people", label: "People", icon: User },
      { path: "/settings", label: "Settings", icon: Settings },
    ],
  };

  const navItems = NAV[user?.role || "default"];

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all hover:scale-105"
      >
        <ChevronRight size={18} />
      </button>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static z-50 h-full w-64
          bg-gradient-to-b from-white via-gray-50/50 to-white
          backdrop-blur-xl
          border-r border-gray-200/80 shadow-lg shadow-gray-900/5
          flex flex-col
          transition-transform duration-300 ease-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="
          h-20 px-6
          flex items-center justify-between
          border-b border-gray-200/60
          bg-gradient-to-r from-white via-gray-50/30 to-white
          backdrop-blur-sm
        ">
          <div className="flex items-center gap-3">
            <div className="
              w-10 h-10 
              rounded-xl 
              bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500
              text-white 
              flex items-center justify-center 
              font-bold text-lg
              shadow-lg shadow-emerald-500/30
              ring-2 ring-emerald-500/20
              transition-transform hover:scale-105
            ">
              Z
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 text-lg leading-tight">Zyro</span>
              <span className="text-xs text-gray-500 font-medium">Project Manager</span>
            </div>
          </div>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100/80 text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-2 mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Navigation</p>
          </div>
          {navItems.map(({ path, label, icon: Icon }) => {
            // Home routes should only be active when pathname exactly matches
            const isHomeRoute = path === "/manager" || path === "/admin" || path === "/employee" || path === "/home";
            
            return (
              <NavLink
                key={path}
                to={path}
                end={isHomeRoute}
                className={({ isActive }) =>
                  `
                  group relative flex items-center gap-3 px-4 py-3 rounded-xl
                  text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]"
                      : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 hover:scale-[1.01]"
                  }
                `
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon 
                      size={20} 
                      className={`
                        transition-all duration-200
                        ${isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"}
                      `}
                    />
                    <span className="flex-1">{label}</span>
                    {isActive && (
                      <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white/80" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="
          px-4 py-4 
          border-t border-gray-200/60 
          bg-gradient-to-r from-gray-50/80 via-white/50 to-gray-50/80
          backdrop-blur-sm
        ">
          {user ? (
            <div className="
              flex items-center gap-3 
              p-3 rounded-xl
              bg-white/60 backdrop-blur-sm
              border border-gray-200/60
              shadow-sm
              hover:shadow-md transition-shadow
            ">
              {/* Avatar */}
              <div className="
                w-11 h-11 
                rounded-xl 
                bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500
                flex items-center justify-center 
                text-white text-base font-bold
                shadow-md shadow-emerald-500/30
                ring-2 ring-emerald-500/20
                flex-shrink-0
              ">
                {user.name.charAt(0).toUpperCase()}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {user.email}
                </p>
                <div className="mt-1.5">
                  <span className="
                    inline-block px-2 py-0.5 
                    text-xs font-medium 
                    rounded-md
                    bg-emerald-100 text-emerald-700
                    capitalize
                  ">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 px-3 rounded-xl bg-gray-100/50">
              <p className="text-sm text-gray-500 font-medium">Not logged in</p>
            </div>
          )}
        </div>

      </aside>
    </>
  );
};

export default Sidebar;
