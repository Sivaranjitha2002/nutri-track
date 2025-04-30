import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, addDays, startOfMonth, endOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useNutrition } from "@/hooks/useNutrition";
import { ChevronLeft, ChevronRight } from "lucide-react";

const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#F44336'];

const Reports = () => {
  const [dateRange, setDateRange] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const userId = localStorage.getItem('userId');
  
  const { getWeeklyData } = useNutrition();
  const { data: weeklyData, isLoading: isLoadingWeekly } = getWeeklyData();
  
  // Calculate date range based on selected period
  const getDateRange = () => {
    if (dateRange === 'week') {
      const startDate = subDays(currentDate, 6);
      const endDate = currentDate;
      return {
        start: format(startDate, 'MMM d, yyyy'),
        end: format(endDate, 'MMM d, yyyy')
      };
    } else {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      return {
        start: format(startDate, 'MMM d, yyyy'),
        end: format(endDate, 'MMM d, yyyy')
      };
    }
  };
  
  const range = getDateRange();
  
  // Generate date range for fetching monthly data
  const getDates = () => {
    if (dateRange === 'week') {
      return Array.from({ length: 7 }, (_, i) => {
        const date = subDays(currentDate, 6 - i);
        return {
          date,
          dateStr: format(date, 'yyyy-MM-dd'),
          label: format(date, 'MMM d')
        };
      });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const dayCount = end.getDate();
      
      return Array.from({ length: dayCount }, (_, i) => {
        const date = addDays(start, i);
        return {
          date,
          dateStr: format(date, 'yyyy-MM-dd'),
          label: format(date, 'd')
        };
      });
    }
  };
  
  const dates = getDates();
  
  // Fetch nutrition data for the date range
  const { data: rangeData, isLoading: isLoadingRange } = useQuery({
    queryKey: ['/api/nutrition-range', userId, dateRange, currentDate.toISOString()],
    queryFn: async () => {
      // This would normally fetch from an API endpoint that supports date ranges
      // For now, we'll mock the data based on the weekly data pattern
      if (dateRange === 'week' && weeklyData) {
        return weeklyData.dailySummaries;
      }
      
      // Mock monthly data
      return dates.map((date, index) => ({
        day: date.label,
        calories: Math.floor(Math.random() * 1000) + 500,
        protein: Math.floor(Math.random() * 50) + 30,
        carbs: Math.floor(Math.random() * 100) + 50,
        fat: Math.floor(Math.random() * 30) + 15
      }));
    },
    enabled: !!userId && !!weeklyData,
  });
  
  // Calculate macro distribution for pie chart
  const calculateMacroDistribution = () => {
    if (!weeklyData) return [];
    
    const { avgProtein } = weeklyData;
    const avgCarbs = weeklyData.dailySummaries.reduce((sum, day) => sum + day.carbs, 0) / weeklyData.dailySummaries.length;
    const avgFat = weeklyData.dailySummaries.reduce((sum, day) => sum + day.fat, 0) / weeklyData.dailySummaries.length;
    
    // Convert to calories
    const proteinCal = avgProtein * 4; // 4 calories per gram of protein
    const carbsCal = avgCarbs * 4;     // 4 calories per gram of carbs
    const fatCal = avgFat * 9;         // 9 calories per gram of fat
    
    const total = proteinCal + carbsCal + fatCal;
    
    return [
      { name: 'Protein', value: Math.round((proteinCal / total) * 100) },
      { name: 'Carbs', value: Math.round((carbsCal / total) * 100) },
      { name: 'Fat', value: Math.round((fatCal / total) * 100) }
    ];
  };
  
  const macroDistribution = calculateMacroDistribution();
  
  // Navigation functions
  const goToPrevious = () => {
    if (dateRange === 'week') {
      setCurrentDate(subDays(currentDate, 7));
    } else {
      const prevMonth = new Date(currentDate);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      setCurrentDate(prevMonth);
    }
  };
  
  const goToNext = () => {
    if (dateRange === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setCurrentDate(nextMonth);
    }
  };
  
  const goToCurrent = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="py-6 md:py-8 px-4 md:px-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nutrition Reports</h1>
          <p className="text-gray-500 mt-1">Analyze your nutritional data and trends</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Tabs 
            value={dateRange} 
            onValueChange={(value) => setDateRange(value as 'week' | 'month')}
            className="w-auto"
          >
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger value="week">Weekly</TabsTrigger>
              <TabsTrigger value="month">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-semibold">{range.start} - {range.end}</h2>
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToCurrent}
          >
            Current
          </Button>
          <Button variant="outline" size="sm" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Calorie Intake</CardTitle>
            <CardDescription>Daily calorie consumption over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingWeekly || isLoadingRange ? (
              <div className="h-72">
                <Skeleton className="w-full h-full" />
              </div>
            ) : (
              <div className="h-72 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={rangeData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="calories" fill="#4CAF50" name="Calories" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Macronutrient Distribution</CardTitle>
            <CardDescription>Percentage breakdown of your macros</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingWeekly ? (
              <div className="h-72">
                <Skeleton className="w-full h-full" />
              </div>
            ) : (
              <div className="h-72 relative flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={macroDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {macroDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center space-x-4 mt-2">
                  {macroDistribution.map((entry, index) => (
                    <div key={index} className="flex items-center">
                      <div 
                        className="w-3 h-3 mr-1" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-xs">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Nutrient Tracking</CardTitle>
          <CardDescription>Track your protein, carbs, and fat intake over time</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingWeekly || isLoadingRange ? (
            <div className="h-96">
              <Skeleton className="w-full h-full" />
            </div>
          ) : (
            <div className="h-96 relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={rangeData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="protein" 
                    stroke="#2196F3" 
                    strokeWidth={2} 
                    activeDot={{ r: 8 }} 
                    name="Protein (g)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="carbs" 
                    stroke="#FF9800" 
                    strokeWidth={2} 
                    activeDot={{ r: 8 }} 
                    name="Carbs (g)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="fat" 
                    stroke="#F44336" 
                    strokeWidth={2} 
                    activeDot={{ r: 8 }} 
                    name="Fat (g)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Average Calories</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingWeekly ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {weeklyData?.avgCalories || 0}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  calories per day
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Average Protein</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingWeekly ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {weeklyData?.avgProtein || 0}g
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  protein per day
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">On Target Days</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingWeekly ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {weeklyData?.onTargetDays || 0}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  days within calorie goal
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
