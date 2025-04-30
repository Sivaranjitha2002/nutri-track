import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { getNutrientColor } from "@/lib/utils";

const DailyOverview = () => {
  const userId = localStorage.getItem('userId');
  const today = new Date().toISOString().split('T')[0];

  const { data: nutritionSummary, isLoading } = useQuery({
    queryKey: ['/api/nutrition-summary', userId, today],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition-summary?userId=${userId}&date=${today}`);
      if (!response.ok) throw new Error('Failed to fetch nutrition summary');
      return response.json();
    },
    enabled: !!userId,
  });

  const nutrients = [
    { 
      name: 'Calories', 
      current: nutritionSummary?.current.calories || 0,
      goal: nutritionSummary?.goals.calories || 2000,
      color: 'bg-primary'
    },
    { 
      name: 'Protein', 
      current: nutritionSummary?.current.protein || 0,
      goal: nutritionSummary?.goals.protein || 80,
      unit: 'g',
      color: 'bg-blue-500'
    },
    { 
      name: 'Carbs', 
      current: nutritionSummary?.current.carbs || 0,
      goal: nutritionSummary?.goals.carbs || 250,
      unit: 'g',
      color: 'bg-yellow-500'
    },
    { 
      name: 'Fat', 
      current: nutritionSummary?.current.fat || 0,
      goal: nutritionSummary?.goals.fat || 65,
      unit: 'g',
      color: 'bg-red-500'
    }
  ];

  return (
    <Card className="mb-8">
      <CardHeader className="pb-3">
        <CardTitle>Today's Overview</CardTitle>
        <CardDescription>Your daily nutritional summary and goals progress.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          {nutrients.map((nutrient) => (
            <Card key={nutrient.name} className="bg-gray-50">
              <CardContent className="pt-6">
                <dt className="text-sm font-medium text-gray-500 truncate">{nutrient.name}</dt>
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-24 mt-1" />
                    <Skeleton className="h-2.5 w-full mt-2" />
                  </>
                ) : (
                  <>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {nutrient.current}{nutrient.unit ? nutrient.unit : ''} / {nutrient.goal}{nutrient.unit ? nutrient.unit : ''}
                    </dd>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div 
                        className={`${nutrient.color} h-2.5 rounded-full`} 
                        style={{ width: `${Math.min(100, (nutrient.current / nutrient.goal) * 100)}%` }}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyOverview;
