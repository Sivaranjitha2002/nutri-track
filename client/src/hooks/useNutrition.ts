import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { NutritionGoal, NutritionSummary, DailySummary, WeeklyData } from '@/lib/types';
import { formatDateForApi } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { format, subDays } from 'date-fns';

export function useNutrition(initialDate = new Date()) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = localStorage.getItem('userId');
  
  const formattedDate = formatDateForApi(selectedDate);

  // Fetch nutrition summary for the selected date
  const { 
    data: nutritionSummary, 
    isLoading: isLoadingNutrition,
    error: nutritionError,
    refetch: refetchNutrition
  } = useQuery({
    queryKey: ['/api/nutrition-summary', userId, formattedDate],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition-summary?userId=${userId}&date=${formattedDate}`);
      if (!response.ok) throw new Error('Failed to fetch nutrition summary');
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch weekly nutrition data
  const getWeeklyData = () => {
    // Generate an array of the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return { 
        date,
        dateStr: formatDateForApi(date),
        dayLabel: format(date, 'EEE')
      };
    });
    
    return useQuery({
      queryKey: ['/api/weekly-nutrition', userId],
      queryFn: async () => {
        const summaries = await Promise.all(
          last7Days.map(async ({ dateStr, dayLabel }) => {
            try {
              const response = await fetch(`/api/nutrition-summary?userId=${userId}&date=${dateStr}`);
              if (!response.ok) {
                return { day: dayLabel, calories: 0, protein: 0, carbs: 0, fat: 0 };
              }
              const data = await response.json();
              return {
                day: dayLabel,
                calories: data.current.calories,
                protein: data.current.protein,
                carbs: data.current.carbs,
                fat: data.current.fat,
                calorieGoal: data.goals.calories
              };
            } catch (error) {
              return { day: dayLabel, calories: 0, protein: 0, carbs: 0, fat: 0 };
            }
          })
        );
        
        // Calculate averages
        const avgCalories = Math.round(
          summaries.reduce((sum, day) => sum + day.calories, 0) / summaries.length
        );
        
        const avgProtein = Math.round(
          summaries.reduce((sum, day) => sum + day.protein, 0) / summaries.length
        );
        
        // Count days on target
        const onTargetDays = summaries.filter(
          day => day.calories > 0 && day.calories <= day.calorieGoal
        ).length;
        
        return {
          dailySummaries: summaries,
          avgCalories,
          avgProtein,
          onTargetDays
        } as WeeklyData;
      },
      enabled: !!userId,
    });
  };

  // Update nutrition goals
  const updateGoalsMutation = useMutation({
    mutationFn: async (goals: NutritionGoal) => {
      return await apiRequest('PUT', `/api/users/${userId}/goal`, { goal: goals });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition-summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-nutrition'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Goals updated",
        description: "Your nutrition goals have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update goals",
        variant: "destructive"
      });
    }
  });

  // Calculate the percentage of goal achieved for each nutrient
  const calculateNutrientPercentages = () => {
    if (!nutritionSummary) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    const { current, goals } = nutritionSummary;
    
    return {
      calories: Math.min(100, (current.calories / goals.calories) * 100),
      protein: Math.min(100, (current.protein / goals.protein) * 100),
      carbs: Math.min(100, (current.carbs / goals.carbs) * 100),
      fat: Math.min(100, (current.fat / goals.fat) * 100)
    };
  };

  return {
    selectedDate,
    setSelectedDate,
    nutritionSummary,
    isLoadingNutrition,
    nutritionError,
    refetchNutrition,
    getWeeklyData,
    updateGoals: updateGoalsMutation.mutate,
    isPendingUpdateGoals: updateGoalsMutation.isPending,
    calculateNutrientPercentages
  };
}
