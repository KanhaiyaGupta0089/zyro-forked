import DashboardHeader from "./DashboardHeader";
import DashboardStats from "./DashboardStats";
import RecentActivity from "./RecentActivity";
import QuickActions from "./QuickActions";

const Dashboard = () => {
  return (
    <section className="space-y-6 p-2">
      {/* Header */}
      <DashboardHeader />

      {/* Stats */}
      <DashboardStats />

      {/* Activity + Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RecentActivity />
        </div>

        <div>
          <QuickActions />
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
