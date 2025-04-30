import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format, subDays } from "date-fns";
import { WeightLog } from "@/lib/types";
import { calculateBMI, getBMICategory } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { CalendarIcon, Plus } from "lucide-react";

const weightLogSchema = z.object({
  weight: z.coerce.number().positive("Weight must be a positive number"),
  date: z.string().nonempty("Date is required"),
});

const ProgressTracking = () => {
  const [isAddWeightOpen, setIsAddWeightOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = localStorage.getItem('userId');

  // Set up form
  const form = useForm<z.infer<typeof weightLogSchema>>({
    resolver: zodResolver(weightLogSchema),
    defaultValues: {
      weight: 0,
      date: new Date().toISOString().split('T')[0],
    },
  });

  // Fetch weight logs
  const { data: weightLogs, isLoading } = useQuery({
    queryKey: ['/api/weight-logs', userId],
    queryFn: async () => {
      const response = await fetch(`/api/weight-logs?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch weight logs');
      return response.json();
    },
    enabled: !!userId,
  });

  // Add weight log mutation
  const addWeightLogMutation = useMutation({
    mutationFn: async (values: z.infer<typeof weightLogSchema>) => {
      return await apiRequest('POST', '/api/weight-logs', {
        userId: Number(userId),
        date: values.date,
        weight: values.weight,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/weight-logs'] });
      setIsAddWeightOpen(false);
      form.reset({
        weight: 0,
        date: new Date().toISOString().split('T')[0],
      });
      toast({
        title: "Weight logged",
        description: "Your weight has been recorded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log weight",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (values: z.infer<typeof weightLogSchema>) => {
    addWeightLogMutation.mutate(values);
  };

  // Format weight logs for the chart
  const chartData = weightLogs?.map((log: WeightLog) => ({
    date: format(new Date(log.date), 'MMM dd'),
    weight: log.weight,
  })) || [];

  // Sort chart data by date
  chartData.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  // Get the most recent weight log
  const latestWeightLog = weightLogs?.length > 0 
    ? weightLogs[0] 
    : null;

  // Mock height for BMI calculation (would come from user settings in a real app)
  const userHeight = 170; // 170 cm

  // Calculate BMI if weight is available
  const bmi = latestWeightLog 
    ? calculateBMI(latestWeightLog.weight, userHeight)
    : 0;

  const bmiCategory = getBMICategory(bmi);

  // Calculate weight change
  const calculateWeightChange = () => {
    if (!weightLogs || weightLogs.length < 2) return { change: 0, isLoss: false };
    
    const latest = weightLogs[0].weight;
    const previous = weightLogs[1].weight;
    const change = Math.abs(latest - previous);
    const isLoss = latest < previous;
    
    return { change: parseFloat(change.toFixed(1)), isLoss };
  };

  const weightChange = calculateWeightChange();

  return (
    <div className="py-6 md:py-8 px-4 md:px-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Progress Tracking</h1>
          <p className="text-gray-500 mt-1">Track your weight and body measurements over time</p>
        </div>
        <Button onClick={() => setIsAddWeightOpen(true)} className="mt-4 md:mt-0">
          <Plus className="h-4 w-4 mr-2" />
          Log Weight
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Current Weight</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {latestWeightLog ? `${latestWeightLog.weight} kg` : 'No data'}
                </div>
                {weightChange.change > 0 && (
                  <div className={`text-sm mt-2 ${weightChange.isLoss ? 'text-green-600' : 'text-red-600'}`}>
                    {weightChange.isLoss ? '↓' : '↑'} {weightChange.change} kg since last entry
                  </div>
                )}
                {latestWeightLog && (
                  <div className="text-xs text-gray-500 mt-1">
                    Last updated: {format(new Date(latestWeightLog.date), 'MMMM d, yyyy')}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">BMI</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {bmi ? bmi : 'No data'}
                </div>
                {bmi > 0 && (
                  <div className="text-sm mt-2 text-gray-600">
                    {bmiCategory}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  Based on height: {userHeight} cm
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Goal Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  -1.2 kg
                </div>
                <div className="text-sm mt-2 text-gray-600">
                  2.4 kg to goal
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: '33%' }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Weight History</CardTitle>
            <CardDescription>Track your weight progress over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-72">
                <Skeleton className="w-full h-full" />
              </div>
            ) : chartData.length > 0 ? (
              <div className="h-72 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#4CAF50" 
                      strokeWidth={2} 
                      activeDot={{ r: 8 }} 
                      name="Weight (kg)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-72 text-center">
                <p className="text-gray-500 mb-4">No weight data available</p>
                <Button onClick={() => setIsAddWeightOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log Your First Weight
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Weight Log History</CardTitle>
              <CardDescription>All your recorded weight entries</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setIsAddWeightOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : weightLogs && weightLogs.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Weight (kg)</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weightLogs.map((log: WeightLog, index: number) => {
                    const prevLog = index < weightLogs.length - 1 ? weightLogs[index + 1] : null;
                    const change = prevLog ? (log.weight - prevLog.weight).toFixed(1) : "0";
                    const isLoss = parseFloat(change) < 0;
                    const changeDisplay = parseFloat(change) === 0 ? "0" : (isLoss ? change : `+${change}`);
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell>{format(new Date(log.date), 'MMMM d, yyyy')}</TableCell>
                        <TableCell className="text-right font-medium">{log.weight}</TableCell>
                        <TableCell className={`text-right ${
                          parseFloat(change) === 0 
                            ? 'text-gray-500' 
                            : (isLoss ? 'text-green-600' : 'text-red-600')
                        }`}>
                          {changeDisplay}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">No weight logs found. Start tracking your progress!</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsAddWeightOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Weight Entry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Weight Dialog */}
      <Dialog open={isAddWeightOpen} onOpenChange={setIsAddWeightOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Weight</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input type="date" {...field} className="pl-8" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddWeightOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addWeightLogMutation.isPending}>
                  {addWeightLogMutation.isPending ? "Saving..." : "Save Weight"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProgressTracking;
