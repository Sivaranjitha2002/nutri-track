import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { WaterIntake } from '@/lib/types';
import { formatDateForApi } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

export function useWaterTracking(initialDate = new Date()) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = localStorage.getItem('userId');
  
  const formattedDate = formatDateForApi(selectedDate);

  // Fetch water intake for the selected date
  const { 
    data: waterIntake, 
    isLoading: isLoadingWaterIntake,
    error: waterIntakeError,
    refetch: refetchWaterIntake
  } = useQuery({
    queryKey: ['/api/water-intake', userId, formattedDate],
    queryFn: async () => {
      const response = await fetch(`/api/water-intake?userId=${userId}&date=${formattedDate}`);
      if (!response.ok) throw new Error('Failed to fetch water intake');
      return response.json();
    },
    enabled: !!userId,
  });

  // Update water intake
  const updateWaterIntakeMutation = useMutation({
    mutationFn: async (cups: number) => {
      return await apiRequest('POST', '/api/water-intake', {
        userId: Number(userId),
        date: formattedDate,
        cups
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/water-intake'] });
      toast({
        title: "Water intake updated",
        description: "Your water intake has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update water intake",
        variant: "destructive"
      });
    }
  });

  // Increment water intake by 1 cup
  const incrementWater = () => {
    if (!waterIntake) return;
    updateWaterIntakeMutation.mutate(waterIntake.cups + 1);
  };

  // Decrement water intake by 1 cup
  const decrementWater = () => {
    if (!waterIntake || waterIntake.cups <= 0) return;
    updateWaterIntakeMutation.mutate(waterIntake.cups - 1);
  };

  // Set water intake to a specific number of cups
  const setWaterIntake = (cups: number) => {
    if (cups < 0) return;
    updateWaterIntakeMutation.mutate(cups);
  };

  // Calculate percentage of daily water goal
  const calculateWaterPercentage = (targetCups = 8) => {
    const currentCups = waterIntake?.cups || 0;
    return Math.min(100, (currentCups / targetCups) * 100);
  };

  return {
    selectedDate,
    setSelectedDate,
    waterIntake,
    isLoadingWaterIntake,
    waterIntakeError,
    refetchWaterIntake,
    incrementWater,
    decrementWater,
    setWaterIntake,
    calculateWaterPercentage,
    isPendingUpdate: updateWaterIntakeMutation.isPending
  };
}
