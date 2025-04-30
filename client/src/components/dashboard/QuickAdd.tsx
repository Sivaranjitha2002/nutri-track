import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Food } from "@/lib/types";

const QuickAdd = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = localStorage.getItem('userId');
  const today = new Date().toISOString().split('T')[0];

  const { data: foods, isLoading } = useQuery({
    queryKey: ['/api/foods', searchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/foods${searchQuery ? `?search=${searchQuery}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch foods');
      return response.json();
    }
  });

  const addFoodMutation = useMutation({
    mutationFn: async (food: Food) => {
      // 1. First create a new meal for this quick add
      const mealResponse = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: Number(userId),
          name: 'Quick Add',
          date: today,
          time: new Date().toTimeString().slice(0, 5),
          foods: [{ foodId: food.id, quantity: 1 }]
        })
      });
      
      if (!mealResponse.ok) {
        throw new Error('Failed to add food to meal');
      }
      
      return mealResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition-summary'] });
      toast({
        title: "Food added",
        description: "The food has been added to your daily log.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add food",
        variant: "destructive"
      });
    }
  });

  const handleQuickAdd = (food: Food) => {
    addFoodMutation.mutate(food);
  };

  // Limit the displayed foods to 5 items
  const displayedFoods = foods?.slice(0, 5) || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Quick Add Food</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mt-1 rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-icons text-gray-400">search</span>
          </div>
          <Input
            type="text"
            placeholder="Search foods..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="mt-4 space-y-2 max-h-72 overflow-y-auto">
          {isLoading ? (
            // Loading state
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="flex items-center justify-between p-2">
                <div className="flex items-center">
                  <Skeleton className="h-5 w-5 mr-2 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))
          ) : displayedFoods.length > 0 ? (
            // Foods list
            displayedFoods.map((food: Food) => (
              <div 
                key={food.id} 
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                onClick={() => handleQuickAdd(food)}
              >
                <div className="flex items-center">
                  <span className="material-icons text-gray-400 mr-2">restaurant</span>
                  <span className="text-sm text-gray-700">{food.name}</span>
                </div>
                <span className="text-xs text-gray-500">{food.calories} cal</span>
              </div>
            ))
          ) : searchQuery ? (
            // No results state
            <p className="text-center text-sm text-gray-500 py-4">No foods found</p>
          ) : (
            // Empty state
            <p className="text-center text-sm text-gray-500 py-4">Type to search for foods</p>
          )}
        </div>
        
        <div className="mt-4 text-center">
          <Button 
            variant="ghost" 
            className="text-primary-dark hover:bg-primary-light/10"
          >
            Create Custom Food
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickAdd;
