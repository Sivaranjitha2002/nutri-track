import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Meal, Food, MealFood } from '@/lib/types';
import { formatDateForApi } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

export function useMealTracking() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = localStorage.getItem('userId');
  
  const formattedDate = formatDateForApi(selectedDate);

  // Fetch meals for the selected date
  const { 
    data: meals, 
    isLoading: isLoadingMeals,
    error: mealsError,
    refetch: refetchMeals
  } = useQuery({
    queryKey: ['/api/meals', userId, formattedDate],
    queryFn: async () => {
      const response = await fetch(`/api/meals?userId=${userId}&date=${formattedDate}`);
      if (!response.ok) throw new Error('Failed to fetch meals');
      return response.json();
    },
    enabled: !!userId,
  });

  // Add a new meal
  const addMealMutation = useMutation({
    mutationFn: async (mealData: { 
      name: string, 
      time: string, 
      foods: { foodId: number, quantity: number }[] 
    }) => {
      return await apiRequest('POST', '/api/meals', {
        userId: Number(userId),
        name: mealData.name,
        date: formattedDate,
        time: mealData.time,
        foods: mealData.foods
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition-summary'] });
      toast({
        title: "Meal added",
        description: "Your meal has been successfully logged.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add meal",
        variant: "destructive"
      });
    }
  });

  // Delete a meal
  const deleteMealMutation = useMutation({
    mutationFn: async (mealId: number) => {
      return await apiRequest('DELETE', `/api/meals/${mealId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition-summary'] });
      toast({
        title: "Meal deleted",
        description: "The meal has been removed from your log.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete meal",
        variant: "destructive"
      });
    }
  });

  // Add a food to an existing meal
  const addFoodToMealMutation = useMutation({
    mutationFn: async (data: { mealId: number, foodId: number, quantity: number }) => {
      return await apiRequest('POST', '/api/mealfoods', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition-summary'] });
      toast({
        title: "Food added",
        description: "The food has been added to your meal.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add food to meal",
        variant: "destructive"
      });
    }
  });

  // Remove a food from a meal
  const removeFoodFromMealMutation = useMutation({
    mutationFn: async (mealFoodId: number) => {
      return await apiRequest('DELETE', `/api/mealfoods/${mealFoodId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition-summary'] });
      toast({
        title: "Food removed",
        description: "The food has been removed from your meal.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove food from meal",
        variant: "destructive"
      });
    }
  });

  // Calculate nutrition totals for the day
  const calculateDailyTotals = () => {
    if (!meals) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    return meals.reduce(
      (acc: { calories: number, protein: number, carbs: number, fat: number }, meal: any) => {
        acc.calories += meal.nutrition.calories;
        acc.protein += meal.nutrition.protein;
        acc.carbs += meal.nutrition.carbs;
        acc.fat += meal.nutrition.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  return {
    selectedDate,
    setSelectedDate,
    meals,
    isLoadingMeals,
    mealsError,
    refetchMeals,
    addMeal: addMealMutation.mutate,
    isPendingAddMeal: addMealMutation.isPending,
    deleteMeal: deleteMealMutation.mutate,
    isPendingDeleteMeal: deleteMealMutation.isPending,
    addFoodToMeal: addFoodToMealMutation.mutate,
    isPendingAddFood: addFoodToMealMutation.isPending,
    removeFoodFromMeal: removeFoodFromMealMutation.mutate,
    isPendingRemoveFood: removeFoodFromMealMutation.isPending,
    calculateDailyTotals
  };
}
