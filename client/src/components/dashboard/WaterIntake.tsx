import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const WaterIntake = () => {
  const queryClient = useQueryClient();
  const userId = localStorage.getItem('userId');
  const today = new Date().toISOString().split('T')[0];
  
  const { data: waterIntake, isLoading } = useQuery({
    queryKey: ['/api/water-intake', userId, today],
    queryFn: async () => {
      const response = await fetch(`/api/water-intake?userId=${userId}&date=${today}`);
      if (!response.ok) throw new Error('Failed to fetch water intake');
      return response.json();
    },
    enabled: !!userId,
  });
  
  const updateWaterIntake = useMutation({
    mutationFn: async (cups: number) => {
      const response = await fetch('/api/water-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: Number(userId),
          date: today,
          cups: cups
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update water intake');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/water-intake'] });
    }
  });
  
  const handleAddWater = () => {
    if (!waterIntake) return;
    updateWaterIntake.mutate(waterIntake.cups + 1);
  };
  
  const handleRemoveWater = () => {
    if (!waterIntake || waterIntake.cups <= 0) return;
    updateWaterIntake.mutate(waterIntake.cups - 1);
  };
  
  const currentCups = waterIntake?.cups || 0;
  const targetCups = 8; // Daily target
  const percentage = (currentCups / targetCups) * 100;
  const offset = 251.2 - (251.2 * (percentage / 100));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Water Intake</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {isLoading ? (
          <div className="flex flex-col items-center">
            <Skeleton className="w-36 h-36 rounded-full" />
            <Skeleton className="w-20 h-4 mt-3" />
            <div className="mt-6 flex items-center justify-center space-x-4">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
          </div>
        ) : (
          <>
            <div className="mx-auto w-36 h-36 relative">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle 
                  className="text-gray-200" 
                  strokeWidth="10" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="40" 
                  cx="50" 
                  cy="50"
                />
                <circle 
                  className="text-blue-500" 
                  strokeWidth="10" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="40" 
                  cx="50" 
                  cy="50" 
                  strokeDasharray="251.2" 
                  strokeDashoffset={offset}
                />
              </svg>
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                <span className="text-3xl font-semibold text-gray-700">
                  {currentCups}/{targetCups}
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-500">cups of water</p>
            <div className="mt-6 flex items-center justify-center space-x-4">
              <Button 
                size="sm"
                variant="outline"
                className="w-8 h-8 p-0 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 border-blue-200"
                onClick={handleRemoveWater}
                disabled={currentCups <= 0}
              >
                <span className="material-icons text-sm">remove</span>
              </Button>
              <Button 
                size="sm"
                variant="outline"
                className="w-8 h-8 p-0 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 border-blue-200"
                onClick={handleAddWater}
              >
                <span className="material-icons text-sm">add</span>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WaterIntake;
