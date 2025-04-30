import { 
  users, type User, type InsertUser, 
  foods, type Food, type InsertFood,
  meals, type Meal, type InsertMeal,
  mealFoods, type MealFood, type InsertMealFood,
  waterIntake, type WaterIntake, type InsertWaterIntake,
  weightLog, type WeightLog, type InsertWeightLog
} from "@shared/schema";
import { format } from "date-fns";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserGoal(userId: number, goal: User['goal']): Promise<User | undefined>;

  // Food methods
  getFood(id: number): Promise<Food | undefined>;
  getFoods(): Promise<Food[]>;
  searchFoods(query: string): Promise<Food[]>;
  createFood(food: InsertFood): Promise<Food>;
  
  // Meal methods
  getMeal(id: number): Promise<Meal | undefined>;
  getMealsByUserIdAndDate(userId: number, date: Date): Promise<Meal[]>;
  createMeal(meal: InsertMeal): Promise<Meal>;
  deleteMeal(id: number): Promise<void>;
  
  // MealFood methods
  getMealFoodsByMealId(mealId: number): Promise<(MealFood & { food: Food })[]>;
  addFoodToMeal(mealFood: InsertMealFood): Promise<MealFood>;
  removeFoodFromMeal(id: number): Promise<void>;
  
  // Water tracking methods
  getWaterIntakeByUserIdAndDate(userId: number, date: Date): Promise<WaterIntake | undefined>;
  createOrUpdateWaterIntake(waterIntake: InsertWaterIntake): Promise<WaterIntake>;
  
  // Weight tracking methods
  getWeightLogsByUserId(userId: number): Promise<WeightLog[]>;
  createWeightLog(weightLog: InsertWeightLog): Promise<WeightLog>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private foods: Map<number, Food>;
  private meals: Map<number, Meal>;
  private mealFoods: Map<number, MealFood>;
  private waterIntakes: Map<number, WaterIntake>;
  private weightLogs: Map<number, WeightLog>;
  
  private userId: number = 1;
  private foodId: number = 1;
  private mealId: number = 1;
  private mealFoodId: number = 1;
  private waterIntakeId: number = 1;
  private weightLogId: number = 1;

  constructor() {
    this.users = new Map();
    this.foods = new Map();
    this.meals = new Map();
    this.mealFoods = new Map();
    this.waterIntakes = new Map();
    this.weightLogs = new Map();
    
    // Add some default foods
    this.initializeFoods();
  }

  private initializeFoods() {
    const defaultFoods: InsertFood[] = [
      { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.3, servingSize: 1, servingUnit: 'medium', isCustom: false, userId: null },
      { name: 'Greek Yogurt', calories: 130, protein: 12, carbs: 5, fat: 4, servingSize: 1, servingUnit: 'cup', isCustom: false, userId: null },
      { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: 3, servingUnit: 'oz', isCustom: false, userId: null },
      { name: 'Whole Wheat Bread', calories: 80, protein: 4, carbs: 15, fat: 1, servingSize: 1, servingUnit: 'slice', isCustom: false, userId: null },
      { name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 2.5, servingSize: 1, servingUnit: 'cup', isCustom: false, userId: null },
      { name: 'Berries', calories: 85, protein: 1, carbs: 21, fat: 0.5, servingSize: 1, servingUnit: 'cup', isCustom: false, userId: null },
      { name: 'Grilled Chicken Salad', calories: 350, protein: 35, carbs: 10, fat: 18, servingSize: 1, servingUnit: 'bowl', isCustom: false, userId: null },
      { name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, servingSize: 1, servingUnit: 'medium', isCustom: false, userId: null },
      { name: 'Almonds', calories: 160, protein: 6, carbs: 6, fat: 14, servingSize: 1, servingUnit: 'oz', isCustom: false, userId: null },
    ];
    
    defaultFoods.forEach(food => {
      const id = this.foodId++;
      this.foods.set(id, { ...food, id });
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserGoal(userId: number, goal: User['goal']): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, goal };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Food methods
  async getFood(id: number): Promise<Food | undefined> {
    return this.foods.get(id);
  }

  async getFoods(): Promise<Food[]> {
    return Array.from(this.foods.values());
  }

  async searchFoods(query: string): Promise<Food[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.foods.values()).filter(
      food => food.name.toLowerCase().includes(lowercaseQuery)
    );
  }

  async createFood(insertFood: InsertFood): Promise<Food> {
    const id = this.foodId++;
    const food: Food = { ...insertFood, id };
    this.foods.set(id, food);
    return food;
  }

  // Meal methods
  async getMeal(id: number): Promise<Meal | undefined> {
    return this.meals.get(id);
  }

  async getMealsByUserIdAndDate(userId: number, date: Date): Promise<Meal[]> {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    return Array.from(this.meals.values()).filter(meal => {
      const mealDate = format(new Date(meal.date), 'yyyy-MM-dd');
      return meal.userId === userId && mealDate === dateStr;
    });
  }

  async createMeal(insertMeal: InsertMeal): Promise<Meal> {
    const id = this.mealId++;
    const meal: Meal = { ...insertMeal, id };
    this.meals.set(id, meal);
    return meal;
  }

  async deleteMeal(id: number): Promise<void> {
    // First, delete all mealFoods associated with this meal
    Array.from(this.mealFoods.entries())
      .filter(([_, mealFood]) => mealFood.mealId === id)
      .forEach(([mealFoodId, _]) => {
        this.mealFoods.delete(mealFoodId);
      });
    
    // Then delete the meal
    this.meals.delete(id);
  }

  // MealFood methods
  async getMealFoodsByMealId(mealId: number): Promise<(MealFood & { food: Food })[]> {
    const mealFoodsArray = Array.from(this.mealFoods.values())
      .filter(mealFood => mealFood.mealId === mealId);
    
    return mealFoodsArray.map(mealFood => {
      const food = this.foods.get(mealFood.foodId);
      return { ...mealFood, food: food! };
    });
  }

  async addFoodToMeal(insertMealFood: InsertMealFood): Promise<MealFood> {
    const id = this.mealFoodId++;
    const mealFood: MealFood = { ...insertMealFood, id };
    this.mealFoods.set(id, mealFood);
    return mealFood;
  }

  async removeFoodFromMeal(id: number): Promise<void> {
    this.mealFoods.delete(id);
  }

  // Water tracking methods
  async getWaterIntakeByUserIdAndDate(userId: number, date: Date): Promise<WaterIntake | undefined> {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    return Array.from(this.waterIntakes.values()).find(intake => {
      const intakeDate = format(new Date(intake.date), 'yyyy-MM-dd');
      return intake.userId === userId && intakeDate === dateStr;
    });
  }

  async createOrUpdateWaterIntake(insertWaterIntake: InsertWaterIntake): Promise<WaterIntake> {
    const dateStr = format(new Date(insertWaterIntake.date), 'yyyy-MM-dd');
    
    // Check if entry exists for this user and date
    const existingIntake = await this.getWaterIntakeByUserIdAndDate(
      insertWaterIntake.userId,
      new Date(insertWaterIntake.date)
    );
    
    if (existingIntake) {
      // Update existing entry
      const updatedIntake: WaterIntake = { ...existingIntake, cups: insertWaterIntake.cups };
      this.waterIntakes.set(existingIntake.id, updatedIntake);
      return updatedIntake;
    } else {
      // Create new entry
      const id = this.waterIntakeId++;
      const waterIntake: WaterIntake = { ...insertWaterIntake, id };
      this.waterIntakes.set(id, waterIntake);
      return waterIntake;
    }
  }

  // Weight tracking methods
  async getWeightLogsByUserId(userId: number): Promise<WeightLog[]> {
    return Array.from(this.weightLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createWeightLog(insertWeightLog: InsertWeightLog): Promise<WeightLog> {
    const id = this.weightLogId++;
    const weightLog: WeightLog = { ...insertWeightLog, id };
    this.weightLogs.set(id, weightLog);
    return weightLog;
  }
}

export const storage = new MemStorage();
