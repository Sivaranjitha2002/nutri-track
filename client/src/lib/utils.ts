import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMealTime(time: string): string {
  try {
    // If the time is in 24-hour format (HH:MM)
    const [hours, minutes] = time.split(':').map(Number);
    
    // Convert to 12-hour format
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (error) {
    return time; // Return the original time if parsing fails
  }
}

export function getMealTypeIcon(mealType: string): string {
  switch (mealType.toLowerCase()) {
    case 'breakfast':
      return 'breakfast_dining';
    case 'lunch':
      return 'lunch_dining';
    case 'dinner':
      return 'dinner_dining';
    case 'snack':
      return 'restaurant';
    default:
      return 'restaurant';
  }
}

export function getNutrientColor(nutrient: string): string {
  switch (nutrient.toLowerCase()) {
    case 'calories':
      return 'bg-primary';
    case 'protein':
      return 'bg-blue-500';
    case 'carbs':
      return 'bg-yellow-500';
    case 'fat':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

export function formatDateForDisplay(date: Date): string {
  return format(date, 'MMMM d, yyyy');
}

export function formatDateForApi(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function calculateBMI(weight: number, height: number): number {
  // Weight in kg, height in cm
  if (weight <= 0 || height <= 0) return 0;
  const heightInMeters = height / 100;
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export function calculateCalorieNeeds(
  weight: number, 
  height: number, 
  age: number, 
  gender: string, 
  activityLevel: string
): number {
  // BMR calculation using Mifflin-St Jeor Equation
  let bmr = 0;
  
  if (gender.toLowerCase() === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  
  // Activity multiplier
  let activityMultiplier = 1.2; // Sedentary
  
  switch (activityLevel.toLowerCase()) {
    case 'lightly active':
      activityMultiplier = 1.375;
      break;
    case 'moderately active':
      activityMultiplier = 1.55;
      break;
    case 'very active':
      activityMultiplier = 1.725;
      break;
    case 'extra active':
      activityMultiplier = 1.9;
      break;
  }
  
  return Math.round(bmr * activityMultiplier);
}
