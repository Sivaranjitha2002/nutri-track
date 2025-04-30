import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import AddMealDialog from "../meals/AddMealDialog";
import { formatMealTime, getMealTypeIcon } from "@/lib/utils";

const RecentMeals = () => {
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const userId = localStorage.getItem('userId');
  const today = new Date().toISOString().split('T')[0];

  const { data: meals, isLoading } = useQuery({
    queryKey: ['/api/meals', userId, today],
    queryFn: async () => {
      const response = await fetch(`/api/meals?userId=${userId}&date=${today}`);
      if (!response.ok) throw new Error('Failed to fetch meals');
      return response.json();
    },
    enabled: !!userId,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Today's Meals</CardTitle>
        <CardDescription>Click on a meal to edit or add items.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            // Loading state
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-16 mt-2 sm:mt-0" />
                </div>
              </div>
            ))
          ) : meals && meals.length > 0 ? (
            // Meals list
            meals.map((meal: any) => (
              <div key={meal.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-primary truncate">{meal.name}</p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      {meal.nutrition.calories} calories
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      {meal.foods && meal.foods.length > 0 
                        ? meal.foods.map((mf: any) => mf.food.name).join(', ')
                        : 'No food items added'
                      }
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <span className="material-icons mr-1.5 text-sm">access_time</span>
                    <p>{formatMealTime(meal.time)}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // No meals state
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500">No meals logged for today.</p>
            </div>
          )}
          
          <div className="px-4 py-4 text-center">
            <Button 
              variant="ghost" 
              className="text-primary-dark hover:bg-primary-light/10"
              onClick={() => setIsAddMealOpen(true)}
            >
              <span className="material-icons mr-1 text-sm">add_circle</span>
              Add Meal
            </Button>
          </div>
        </div>
      </CardContent>
      
      <AddMealDialog 
        isOpen={isAddMealOpen} 
        onClose={() => setIsAddMealOpen(false)} 
      />
    </Card>
  );
};

export default RecentMeals;
