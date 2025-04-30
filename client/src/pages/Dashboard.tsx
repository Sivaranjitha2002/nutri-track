import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DailyOverview from "@/components/dashboard/DailyOverview";
import RecentMeals from "@/components/dashboard/RecentMeals";
import WeeklyProgress from "@/components/dashboard/WeeklyProgress";
import QuickAdd from "@/components/dashboard/QuickAdd";
import WaterIntake from "@/components/dashboard/WaterIntake";
import DailyTips from "@/components/dashboard/DailyTips";

const Dashboard = () => {
  return (
    <div className="py-6 md:py-8 px-4 md:px-8">
      <DashboardHeader />
      <DailyOverview />
      
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentMeals />
        <WeeklyProgress />
      </div>
      
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <QuickAdd />
        <WaterIntake />
        <DailyTips />
      </div>
    </div>
  );
};

export default Dashboard;
