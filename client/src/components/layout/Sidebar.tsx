import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  mobileMenuOpen: boolean;
}

const Sidebar = ({ mobileMenuOpen }: SidebarProps) => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const navigationItems = [
    { path: "/", label: "Dashboard", icon: "https://www.flaticon.com/free-icons/performance" },
    { path: "/meal-logging", label: "Meal Logging", icon: "restaurant_menu" },
    { path: "/food-database", label: "Food Database", icon: "food_bank" },
    { path: "/progress-tracking", label: "Progress Tracking", icon: "fitness_center" },
    { path: "/reports", label: "Reports", icon: "assessment" },
    { path: "/goals", label: "Goals", icon: "flag" },
    { path: "/settings", label: "Settings", icon: "settings" },
  ];

  return (
    <aside className={cn(
      "md:flex md:flex-shrink-0", 
      mobileMenuOpen ? "block fixed inset-0 z-50 bg-white" : "hidden"
    )}>
      <div className="flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-primary">NutriTrack</h1>
        </div>
        <div className="flex flex-col flex-grow px-4 py-4 overflow-y-auto">
          <nav className="flex-1 space-y-1">
            {navigationItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={cn(
                  "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  isActive(item.path) 
                    ? "text-white bg-primary" 
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {/* <span className={cn(
                  "material-icons mr-3",
                  isActive(item.path) ? "text-white opacity-75" : "text-gray-500"
                )}>
                  {item.icon}
                </span> */}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            {/* <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="material-icons text-gray-600">person</span>
            </div> */}
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Sarah Johnson</p>
              <p className="text-xs font-medium text-gray-500">View Profile</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
