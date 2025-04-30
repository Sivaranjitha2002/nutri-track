import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays } from "date-fns";

const WeeklyProgress = () => {
  const userId = localStorage.getItem('userId');
  
  // Generate an array of the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return { 
      date,
      dateStr: date.toISOString().split('T')[0],
      dayLabel: format(date, 'EEE')
    };
  });
  
  // Fetch nutrition data for each day
  const { data: weeklyData, isLoading } = useQuery({
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
      };
    },
    enabled: !!userId,
  });
  
  // Mock weight change for demonstration
  const weightChange = "-1.2";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Weekly Progress</CardTitle>
        <CardDescription>Your nutrition trends for the past 7 days.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-72">
            <Skeleton className="w-full h-full" />
          </div>
        ) : (
          <div className="h-72 relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weeklyData?.dailySummaries}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="calories" stroke="#4CAF50" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="border rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Avg. Calories</p>
            {isLoading ? (
              <Skeleton className="h-6 w-16 mx-auto mt-1" />
            ) : (
              <p className="text-lg font-semibold text-gray-900">
                {weeklyData?.avgCalories || 0}
              </p>
            )}
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Avg. Protein</p>
            {isLoading ? (
              <Skeleton className="h-6 w-16 mx-auto mt-1" />
            ) : (
              <p className="text-lg font-semibold text-gray-900">
                {weeklyData?.avgProtein || 0}g
              </p>
            )}
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">On Target</p>
            {isLoading ? (
              <Skeleton className="h-6 w-16 mx-auto mt-1" />
            ) : (
              <p className="text-lg font-semibold text-green-600">
                {weeklyData?.onTargetDays || 0} days
              </p>
            )}
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Weight Change</p>
            <p className="text-lg font-semibold text-blue-600">{weightChange} lbs</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyProgress;
