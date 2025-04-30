import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useState } from "react";
import AddMealDialog from "../meals/AddMealDialog";

const DashboardHeader = () => {
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <div className="mb-6 md:flex md:items-center md:justify-between">
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-bold leading-7 text-gray-800 sm:text-3xl sm:truncate">
          Dashboard
        </h2>
        <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <span className="material-icons text-gray-400 mr-1.5 text-sm">calendar_today</span>
            <span>{today}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex md:mt-0 md:ml-4">
        <Button onClick={() => setIsAddMealOpen(true)}>
          {/* <span className="material-icons mr-2 text-sm">add</span> */}
          Log Meal
        </Button>
      </div>
      
      <AddMealDialog 
        isOpen={isAddMealOpen} 
        onClose={() => setIsAddMealOpen(false)} 
      />
    </div>
  );
};

export default DashboardHeader;
