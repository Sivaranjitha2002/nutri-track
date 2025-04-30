export interface User {
  id: number;
  username: string;
  displayName?: string;
  goal?: NutritionGoal;
  createdAt: Date;
}

export interface NutritionGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Food {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number;
  servingUnit: string;
  userId: number | null;
  isCustom: boolean;
}

export interface Meal {
  id: number;
  userId: number;
  name: string;
  date: Date | string;
  time: string;
  foods?: MealFood[];
  nutrition?: NutritionSummary;
}

export interface MealFood {
  id: number;
  mealId: number;
  foodId: number;
  food: Food;
  quantity: number;
}

export interface NutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WaterIntake {
  id: number;
  userId: number;
  date: Date | string;
  cups: number;
}

export interface WeightLog {
  id: number;
  userId: number;
  date: Date | string;
  weight: number;
}

export interface DailySummary {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  calorieGoal?: number;
}

export interface WeeklyData {
  dailySummaries: DailySummary[];
  avgCalories: number;
  avgProtein: number;
  onTargetDays: number;
}

export interface UserSettings {
  displayName: string;
  height: number; // cm
  weight: number; // kg
  age: number;
  gender: string;
  activityLevel: string;
}
