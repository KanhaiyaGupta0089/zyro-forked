import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  User,
  Settings,
  ChevronRight,
  X,
} from "lucide-react";
import { RootState } from "../../../../redux/store";

const Sidebar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on window resize if screen becomes larger
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { path: "/home", label: "Home", icon: LayoutDashboard },
    { path: "/projects", label: "Projects", icon: FolderKanban },
    { path: "/issues", label: "Issues", icon: CheckSquare },
    { path: "/profile", label: "Profile", icon: User },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-blue-600 text-white"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <ChevronRight size={20} />
      </button>

      {/* Main container with click handler to close sidebar on outside click */}
      <div 
        className="relative h-full"
        onClick={(e) => {
          if (isMobileMenuOpen && (e.target as HTMLElement).closest('aside') === null) {
            setIsMobileMenuOpen(false);
          }
        }}
      >
        {/* Sidebar */}
        <aside
          className={`fixed md:static md:translate-x-0 z-50 h-full flex flex-col bg-gradient-to-b from-blue-50 to-emerald-50 border-r border-blue-200/30 transition-transform duration-300 w-60
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:flex md:w-auto md:translate-x-0 md:transform`}
        >
          {/* LOGO */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-blue-200/30 bg-gradient-to-r from-blue-100/40 to-emerald-100/40">
            <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
              Zyro
            </h1>

            {/* Close button for mobile */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-blue-100 text-blue-600"
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileMenuOpen(false);
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* NAV */}
          <nav className="flex-1 mt-4 space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                    ${isActive
                      ? "bg-emerald-500/20 text-emerald-700 font-medium border-l-2 border-emerald-500"
                      : "text-blue-600/80 hover:bg-blue-100 hover:text-blue-700"
                    }`}
                >
                  <Icon size={20} />
                  <span className="text-sm">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* FOOTER - User Info */}
          <div className="p-4 border-t border-blue-200/30 bg-gradient-to-r from-blue-100/30 to-emerald-100/30">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center text-white text-xs font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-800 truncate">{user.name}</p>
                  <p className="text-xs text-emerald-600/80 truncate">{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-xs text-blue-600/70">Not logged in</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
};

export default Sidebar;
