import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, addDays, subDays, isToday } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import AddMealDialog from "@/components/meals/AddMealDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";

const MealLogging = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const userId = localStorage.getItem('userId');
  
  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const displayDate = format(selectedDate, "EEEE, MMMM d, yyyy");
  
  const { data: meals, isLoading } = useQuery({
    queryKey: ['/api/meals', userId, formattedDate],
    queryFn: async () => {
      const response = await fetch(`/api/meals?userId=${userId}&date=${formattedDate}`);
      if (!response.ok) throw new Error('Failed to fetch meals');
      return response.json();
    },
    enabled: !!userId,
  });
  
  const goToPreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };
  
  const goToNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };
  
  const goToToday = () => {
    setSelectedDate(new Date());
  };
  
  // Group meals by type
  const mealsByType = {
    Breakfast: meals?.filter((meal: any) => meal.name === 'Breakfast') || [],
    Lunch: meals?.filter((meal: any) => meal.name === 'Lunch') || [],
    Dinner: meals?.filter((meal: any) => meal.name === 'Dinner') || [],
    Snack: meals?.filter((meal: any) => meal.name === 'Snack') || [],
  };
  
  // Get total nutrition for the day
  const totalNutrition = meals?.reduce(
    (acc: any, meal: any) => {
      acc.calories += meal.nutrition.calories;
      acc.protein += meal.nutrition.protein;
      acc.carbs += meal.nutrition.carbs;
      acc.fat += meal.nutrition.fat;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  ) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  return (
    <div className="py-6 md:py-8 px-4 md:px-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Meal Logging</h1>
          <p className="text-gray-500 mt-1">Track and manage your daily meals</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={isToday(selectedDate) ? "bg-primary text-white hover:text-white hover:bg-primary/90" : ""}
            onClick={goToToday}
          >
            <CalendarIcon className="h-4 w-4 mr-1" />
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-semibold">{displayDate}</h2>
        <Button onClick={() => setIsAddMealOpen(true)} className="mt-4 md:mt-0">
          <span className="material-icons mr-2 text-sm">add</span>
          Add Meal
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <span className="text-3xl font-bold text-gray-900">
                {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : totalNutrition.calories}
              </span>
              <p className="text-sm text-gray-500 mt-1">Calories</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <span className="text-3xl font-bold text-gray-900">
                {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : totalNutrition.protein}g
              </span>
              <p className="text-sm text-gray-500 mt-1">Protein</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <span className="text-3xl font-bold text-gray-900">
                {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : totalNutrition.carbs}g
              </span>
              <p className="text-sm text-gray-500 mt-1">Carbs</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <span className="text-3xl font-bold text-gray-900">
                {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : totalNutrition.fat}g
              </span>
              <p className="text-sm text-gray-500 mt-1">Fat</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
          <TabsTrigger value="lunch">Lunch</TabsTrigger>
          <TabsTrigger value="dinner">Dinner</TabsTrigger>
          <TabsTrigger value="snack">Snack</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(mealsByType).map(([mealType, mealsList]) => (
              <Card key={mealType}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle>{mealType}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setIsAddMealOpen(true)}>
                      <span className="material-icons text-sm">add</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    Array(2).fill(0).map((_, i) => (
                      <div key={i} className="mb-3 last:mb-0">
                        <Skeleton className="h-12" />
                      </div>
                    ))
                  ) : mealsList.length > 0 ? (
                    mealsList.map((meal: any) => (
                      <div key={meal.id} className="mb-3 last:mb-0 border p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium">{meal.time}</p>
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            {meal.nutrition.calories} cal
                          </Badge>
                        </div>
                        <div className="mt-2">
                          {meal.foods && meal.foods.map((mealFood: any) => (
                            <div key={mealFood.id} className="flex justify-between text-sm text-gray-600">
                              <span>{mealFood.food.name} × {mealFood.quantity}</span>
                              <span>{Math.round(mealFood.food.calories * mealFood.quantity)} cal</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No {mealType.toLowerCase()} logged for this day</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {Object.entries(mealsByType).map(([mealType, mealsList]) => (
          <TabsContent key={mealType.toLowerCase()} value={mealType.toLowerCase()}>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{mealType}</CardTitle>
                  <Button onClick={() => setIsAddMealOpen(true)}>
                    <span className="material-icons mr-2 text-sm">add</span>
                    Add {mealType}
                  </Button>
                </div>
                <CardDescription>
                  Manage your {mealType.toLowerCase()} entries for {format(selectedDate, "MMMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="mb-4 last:mb-0">
                      <Skeleton className="h-24" />
                    </div>
                  ))
                ) : mealsList.length > 0 ? (
                  mealsList.map((meal: any) => (
                    <div key={meal.id} className="mb-4 last:mb-0 border p-4 rounded-md">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h3 className="font-medium">{meal.time}</h3>
                          <p className="text-sm text-gray-500">
                            {meal.nutrition.protein}g protein, {meal.nutrition.carbs}g carbs, {meal.nutrition.fat}g fat
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          {meal.nutrition.calories} cal
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {meal.foods && meal.foods.map((mealFood: any) => (
                          <div key={mealFood.id} className="flex justify-between bg-gray-50 p-2 rounded">
                            <div>
                              <p className="font-medium text-sm">{mealFood.food.name}</p>
                              <p className="text-xs text-gray-500">
                                {mealFood.quantity} {mealFood.food.servingUnit} ({Math.round(mealFood.food.calories * mealFood.quantity)} cal)
                              </p>
                            </div>
                            <div className="text-xs text-gray-500">
                              <p>P: {(mealFood.food.protein * mealFood.quantity).toFixed(1)}g</p>
                              <p>C: {(mealFood.food.carbs * mealFood.quantity).toFixed(1)}g</p>
                              <p>F: {(mealFood.food.fat * mealFood.quantity).toFixed(1)}g</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-gray-500">No {mealType.toLowerCase()} logged for this day.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setIsAddMealOpen(true)}
                    >
                      <span className="material-icons mr-2 text-sm">add</span>
                      Add {mealType}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
      
      <AddMealDialog 
        isOpen={isAddMealOpen} 
        onClose={() => setIsAddMealOpen(false)} 
      />
    </div>
  );
};

export default MealLogging;
