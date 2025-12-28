const DashboardHeader = () => {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* LEFT: Title */}
        <div>
          <h1 className="text-2xl font-semibold text-amber-800">
            Dashboard
          </h1>
          <p className="text-sm text-amber-600 mt-1">
            Welcome back! Here’s an overview of your workspace today.
          </p>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex gap-3">
          {/* Primary Action */}
          <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition">
            New Project
          </button>

          {/* Secondary Action */}
          <button className="px-4 py-2 bg-white/80 border border-amber-300 hover:bg-amber-50 text-amber-700 rounded-lg text-sm font-medium transition">
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
