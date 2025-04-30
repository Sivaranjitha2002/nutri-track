import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateCalorieNeeds } from "@/lib/utils";
import { NutritionGoal, User } from "@/lib/types";
import { useNutrition } from "@/hooks/useNutrition";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";

const nutritionGoalSchema = z.object({
  calories: z.coerce.number().min(500, "Calories must be at least 500").max(5000, "Calories must be at most 5000"),
  protein: z.coerce.number().min(10, "Protein must be at least 10g").max(300, "Protein must be at most 300g"),
  carbs: z.coerce.number().min(50, "Carbs must be at least 50g").max(500, "Carbs must be at most 500g"),
  fat: z.coerce.number().min(10, "Fat must be at least 10g").max(200, "Fat must be at most 200g"),
});

const userSettingsSchema = z.object({
  height: z.coerce.number().min(50, "Height must be at least 50cm").max(250, "Height must be at most 250cm"),
  weight: z.coerce.number().min(30, "Weight must be at least 30kg").max(300, "Weight must be at most 300kg"),
  age: z.coerce.number().min(18, "Age must be at least 18").max(100, "Age must be at most 100"),
  gender: z.enum(["male", "female"]),
  activityLevel: z.enum(["sedentary", "lightly active", "moderately active", "very active", "extra active"]),
});

const Goals = () => {
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [isCalculatingNeeds, setIsCalculatingNeeds] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = localStorage.getItem('userId');
  const { nutritionSummary, isLoadingNutrition, updateGoals } = useNutrition();
  
  // Set up nutrition goals form
  const nutritionForm = useForm<z.infer<typeof nutritionGoalSchema>>({
    resolver: zodResolver(nutritionGoalSchema),
    defaultValues: {
      calories: 2000,
      protein: 80,
      carbs: 250,
      fat: 65,
    },
  });
  
  // Set up user settings form for calorie calculator
  const settingsForm = useForm<z.infer<typeof userSettingsSchema>>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {
      height: 170,
      weight: 70,
      age: 30,
      gender: "male",
      activityLevel: "moderately active",
    },
  });
  
  // Fetch user data
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.goal) {
        nutritionForm.reset({
          calories: data.goal.calories,
          protein: data.goal.protein,
          carbs: data.goal.carbs,
          fat: data.goal.fat,
        });
      }
    },
    enabled: !!userId,
  });
  
  // Calculate recommended calories
  const calculateRecommendedCalories = () => {
    const values = settingsForm.getValues();
    const calories = calculateCalorieNeeds(
      values.weight, 
      values.height, 
      values.age, 
      values.gender, 
      values.activityLevel
    );
    
    // Update the calories field in the nutrition form
    nutritionForm.setValue('calories', calories);
    
    // Calculate macros based on calories
    // Protein: 20% of calories (4 calories per gram)
    const protein = Math.round((calories * 0.2) / 4);
    // Fat: 30% of calories (9 calories per gram)
    const fat = Math.round((calories * 0.3) / 9);
    // Carbs: 50% of calories (4 calories per gram)
    const carbs = Math.round((calories * 0.5) / 4);
    
    nutritionForm.setValue('protein', protein);
    nutritionForm.setValue('carbs', carbs);
    nutritionForm.setValue('fat', fat);
    
    setIsCalculatingNeeds(false);
    
    toast({
      title: "Recommendations calculated",
      description: `Based on your inputs, we recommend ${calories} calories per day.`,
    });
  };
  
  // On submit nutrition goals
  const onSubmitNutritionGoals = (values: z.infer<typeof nutritionGoalSchema>) => {
    updateGoals(values);
    setIsEditingGoals(false);
  };
  
  // Calculate progress percentages
  const calculateProgress = () => {
    if (!nutritionSummary) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    const { current, goals } = nutritionSummary;
    
    return {
      calories: Math.min(100, (current.calories / goals.calories) * 100),
      protein: Math.min(100, (current.protein / goals.protein) * 100),
      carbs: Math.min(100, (current.carbs / goals.carbs) * 100),
      fat: Math.min(100, (current.fat / goals.fat) * 100)
    };
  };
  
  const progress = calculateProgress();

  return (
    <div className="py-6 md:py-8 px-4 md:px-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nutrition Goals</h1>
          <p className="text-gray-500 mt-1">Set and track your daily nutrition targets</p>
        </div>
        <div className="mt-4 md:mt-0">
          {!isEditingGoals ? (
            <Button onClick={() => setIsEditingGoals(true)}>
              Edit Goals
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsEditingGoals(false)}>
              Cancel
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Daily Nutrition Goals</CardTitle>
            <CardDescription>Your target macronutrient intake</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUser || isLoadingNutrition ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : isEditingGoals ? (
              <Form {...nutritionForm}>
                <form onSubmit={nutritionForm.handleSubmit(onSubmitNutritionGoals)} className="space-y-4">
                  <FormField
                    control={nutritionForm.control}
                    name="calories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calories</FormLabel>
                        <FormControl>
                          <Input type="number" min="500" max="5000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={nutritionForm.control}
                    name="protein"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Protein (g)</FormLabel>
                        <FormControl>
                          <Input type="number" min="10" max="300" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={nutritionForm.control}
                    name="carbs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carbs (g)</FormLabel>
                        <FormControl>
                          <Input type="number" min="50" max="500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={nutritionForm.control}
                    name="fat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fat (g)</FormLabel>
                        <FormControl>
                          <Input type="number" min="10" max="200" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCalculatingNeeds(true)}
                    >
                      Calculate Needs
                    </Button>
                    <Button type="submit">
                      Save Goals
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                <div>
                  <Label>Calories</Label>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-2xl font-bold">{nutritionSummary?.goals.calories || 2000}</span>
                    <div className="text-sm text-gray-500">
                      {nutritionSummary?.current.calories || 0} consumed today
                    </div>
                  </div>
                  <Progress value={progress.calories} className="mt-2 h-2" />
                </div>
                
                <div>
                  <Label>Protein</Label>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-2xl font-bold">{nutritionSummary?.goals.protein || 80}g</span>
                    <div className="text-sm text-gray-500">
                      {nutritionSummary?.current.protein || 0}g consumed today
                    </div>
                  </div>
                  <Progress value={progress.protein} className="mt-2 h-2 bg-gray-200 [&>div]:bg-blue-500" />
                </div>
                
                <div>
                  <Label>Carbs</Label>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-2xl font-bold">{nutritionSummary?.goals.carbs || 250}g</span>
                    <div className="text-sm text-gray-500">
                      {nutritionSummary?.current.carbs || 0}g consumed today
                    </div>
                  </div>
                  <Progress value={progress.carbs} className="mt-2 h-2 bg-gray-200 [&>div]:bg-yellow-500" />
                </div>
                
                <div>
                  <Label>Fat</Label>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-2xl font-bold">{nutritionSummary?.goals.fat || 65}g</span>
                    <div className="text-sm text-gray-500">
                      {nutritionSummary?.current.fat || 0}g consumed today
                    </div>
                  </div>
                  <Progress value={progress.fat} className="mt-2 h-2 bg-gray-200 [&>div]:bg-red-500" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Calorie Calculator</CardTitle>
            <CardDescription>Calculate your daily calorie needs based on your profile</CardDescription>
          </CardHeader>
          <CardContent>
            {isCalculatingNeeds ? (
              <Form {...settingsForm}>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={settingsForm.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height (cm)</FormLabel>
                          <FormControl>
                            <Input type="number" min="50" max="250" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={settingsForm.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (kg)</FormLabel>
                          <FormControl>
                            <Input type="number" min="30" max="300" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={settingsForm.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input type="number" min="18" max="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={settingsForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={settingsForm.control}
                    name="activityLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Level</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select activity level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                            <SelectItem value="lightly active">Lightly active (light exercise 1-3 days/week)</SelectItem>
                            <SelectItem value="moderately active">Moderately active (moderate exercise 3-5 days/week)</SelectItem>
                            <SelectItem value="very active">Very active (hard exercise 6-7 days/week)</SelectItem>
                            <SelectItem value="extra active">Extra active (very hard exercise & physical job)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCalculatingNeeds(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button"
                      onClick={calculateRecommendedCalories}
                    >
                      Calculate
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <p className="text-lg text-gray-700 mb-3">Want personalized nutrition recommendations?</p>
                  <p className="text-sm text-gray-500 mb-6">
                    Our calculator uses your body metrics and activity level to determine your ideal calorie and macronutrient targets.
                  </p>
                  {isEditingGoals ? (
                    <Button onClick={() => setIsCalculatingNeeds(true)}>
                      Calculate My Needs
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button variant="outline" onClick={() => setIsCalculatingNeeds(true)}>
                        Calculate My Needs
                      </Button>
                      <div className="text-xs text-gray-500">
                        Enable goal editing to apply the recommendations
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="font-medium text-lg mb-3">Goal Distribution</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span>Protein</span>
                        <span>20% of calories</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span>Carbs</span>
                        <span>50% of calories</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span>Fat</span>
                        <span>30% of calories</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Goal Setting Tips</CardTitle>
          <CardDescription>Recommendations for healthy nutrition targets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4 py-2">
              <h3 className="font-medium">Balanced Macronutrient Ratio</h3>
              <p className="text-sm text-gray-600 mt-1">
                For general health, aim for approximately 20% of calories from protein, 50% from carbohydrates, and 30% from fats.
              </p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h3 className="font-medium">Protein Intake</h3>
              <p className="text-sm text-gray-600 mt-1">
                For an active individual, aim for 1.6-2.2g of protein per kg of body weight to support muscle maintenance and recovery.
              </p>
            </div>
            
            <div className="border-l-4 border-yellow-500 pl-4 py-2">
              <h3 className="font-medium">Carbohydrate Considerations</h3>
              <p className="text-sm text-gray-600 mt-1">
                Athletes and very active individuals may need more carbohydrates (5-10g per kg of body weight) while those less active might benefit from lower carbohydrate intake.
              </p>
            </div>
            
            <div className="border-l-4 border-red-500 pl-4 py-2">
              <h3 className="font-medium">Healthy Fats</h3>
              <p className="text-sm text-gray-600 mt-1">
                Aim for at least 0.5-1g of fat per kg of body weight, focusing on unsaturated sources like olive oil, avocados, nuts, and fatty fish.
              </p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h3 className="font-medium">Calorie Deficit for Weight Loss</h3>
              <p className="text-sm text-gray-600 mt-1">
                For healthy, sustainable weight loss, aim for a moderate calorie deficit of 500 calories per day, which should result in about 0.5kg (1lb) of weight loss per week.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Goals;
