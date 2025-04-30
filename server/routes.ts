import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertFoodSchema, 
  insertMealSchema, 
  insertMealFoodSchema,
  insertWaterIntakeSchema,
  insertWeightLogSchema
} from "@shared/schema";
import { format, parse, parseISO } from "date-fns";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handling middleware
  const handleError = (err: any, res: Response) => {
    console.error(err);
    
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: err.errors,
      });
    }
    
    return res.status(500).json({ message: err.message || "Internal server error" });
  };
  
  // User routes
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      return res.status(201).json(user);
    } catch (err) {
      return handleError(err, res);
    }
  });
  
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.status(200).json(user);
    } catch (err) {
      return handleError(err, res);
    }
  });
  
  app.put("/api/users/:id/goal", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUserGoal(userId, req.body.goal);
      return res.status(200).json(updatedUser);
    } catch (err) {
      return handleError(err, res);
    }
  });
  
  // Food routes
  app.get("/api/foods", async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string | undefined;
      
      if (search) {
        const foods = await storage.searchFoods(search);
        return res.status(200).json(foods);
      } else {
        const foods = await storage.getFoods();
        return res.status(200).json(foods);
      }
    } catch (err) {
      return handleError(err, res);
    }
  });
  
  app.post("/api/foods", async (req: Request, res: Response) => {
    try {
      const foodData = insertFoodSchema.parse(req.body);
      const food = await storage.createFood(foodData);
      return res.status(201).json(food);
    } catch (err) {
      return handleError(err, res);
    }
  });
  
  // Meal routes
  app.get("/api/meals", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const dateStr = req.query.date as string;
      
      if (!userId || !dateStr) {
        return res.status(400).json({ message: "User ID and date are required" });
      }
      
      const date = new Date(dateStr);
      const meals = await storage.getMealsByUserIdAndDate(userId, date);
      
      // For each meal, get the associated foods
      const mealsWithFoods = await Promise.all(
        meals.map(async (meal) => {
          const mealFoods = await storage.getMealFoodsByMealId(meal.id);
          
          // Calculate total nutrition for this meal
          const totalNutrition = mealFoods.reduce(
            (acc, { food, quantity }) => {
              acc.calories += Math.round(food.calories * quantity);
              acc.protein += parseFloat((food.protein * quantity).toFixed(1));
              acc.carbs += parseFloat((food.carbs * quantity).toFixed(1));
              acc.fat += parseFloat((food.fat * quantity).toFixed(1));
              return acc;
            },
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          );
          
          return {
            ...meal,
            foods: mealFoods,
            nutrition: totalNutrition,
          };
        })
      );
      
      return res.status(200).json(mealsWithFoods);
    } catch (err) {
      return handleError(err, res);
    }
  });
  
  app.post("/api/meals", async (req: Request, res: Response) => {
    try {
      const mealData = insertMealSchema.parse(req.body);
      const meal = await storage.createMeal(mealData);
      
      // If foods are provided, add them to the meal
      if (req.body.foods && Array.isArray(req.body.foods)) {
        for (const foodItem of req.body.foods) {
          const mealFoodData = insertMealFoodSchema.parse({
            mealId: meal.id,
            foodId: foodItem.foodId,
            quantity: foodItem.quantity,
          });
          
          await storage.addFoodToMeal(mealFoodData);
        }
      }
      
      const mealFoods = await storage.getMealFoodsByMealId(meal.id);
      
      return res.status(201).json({
        ...meal,
        foods: mealFoods,
      });
    } catch (err) {
      return handleError(err, res);
    }
  });
  
  app.delete("/api/meals/:id", async (req: Request, res: Response) => {
    try {
      const mealId = parseInt(req.params.id);
      await storage.deleteMeal(mealId);
      return res.status(204).send();
    } catch (err) {
      return handleError(err, res);
    }
  });
  
  // MealFood routes
  app.post("/api/mealfoods", async (req: Request, res: Response) => {
    try {
      const mealFoodData = insertMealFoodSchema.parse(req.body);
      const mealFood = await storage.addFoodToMeal(mealFoodData);
      
      const food = await storage.getFood(mealFoodData.foodId);
      
      return res.status(201).json({
        ...mealFood,
        food,
      });
    } catch (err) {
      return handleError(err, res);
    }
  });
  
  app.delete("/api/mealfoods/:id", async (req: Request, res: Response) => {
    try {
      const mealFoodId = parseInt(req.params.id);
      await storage.removeFoodFromMeal(mealFoodId);
      return res.status(204).send();
    } catch (err) {
      return handleError(err, res);
    }
  });
  
  // Water tracking routes
  app.get("/api/water-intake", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const dateStr = req.query.date as string;
      
      if (!userId || !dateStr) {
        return res.status(400).json({ message: "User ID and date are required" });
      }
      
      const date = new Date(dateStr);
      const waterIntake = await storage.getWaterIntakeByUserIdAndDate(userId, date);
      
      return res.status(200).json(waterIntake || { userId, date, cups: 0 });
    } catch (err) {
      return handleError(err, res);
    }
  });
  
  app.post("/api/water-intake", async (req: Request, res: Response) => {
    try {
      const waterIntakeData = insertWaterIntakeSchema.parse(req.body);
      const waterIntake = await storage.createOrUpdateWaterIntake(waterIntakeData);
      return res.status(201).json(waterIntake);
    } catch (err) {
      return handleError(err, res);
    }
  });
  
  // Weight tracking routes
  app.get("/api/weight-logs", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const weightLogs = await storage.getWeightLogsByUserId(userId);
      return res.status(200).json(weightLogs);
    } catch (err) {
      return handleError(err, res);
    }
  });
  
  app.post("/api/weight-logs", async (req: Request, res: Response) => {
    try {
      const weightLogData = insertWeightLogSchema.parse(req.body);
      const weightLog = await storage.createWeightLog(weightLogData);
      return res.status(201).json(weightLog);
    } catch (err) {
      return handleError(err, res);
    }
  });
  
  // Get daily nutrition summary
  app.get("/api/nutrition-summary", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const dateStr = req.query.date as string;
      
      if (!userId || !dateStr) {
        return res.status(400).json({ message: "User ID and date are required" });
      }
      
      const date = new Date(dateStr);
      const meals = await storage.getMealsByUserIdAndDate(userId, date);
      
      // Calculate total nutrition for the day
      let totalNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      
      for (const meal of meals) {
        const mealFoods = await storage.getMealFoodsByMealId(meal.id);
        
        mealFoods.forEach(({ food, quantity }) => {
          totalNutrition.calories += Math.round(food.calories * quantity);
          totalNutrition.protein += parseFloat((food.protein * quantity).toFixed(1));
          totalNutrition.carbs += parseFloat((food.carbs * quantity).toFixed(1));
          totalNutrition.fat += parseFloat((food.fat * quantity).toFixed(1));
        });
      }
      
      // Get user goals if available
      const user = await storage.getUser(userId);
      const goals = user?.goal || { calories: 2000, protein: 80, carbs: 250, fat: 65 };
      
      return res.status(200).json({
        current: totalNutrition,
        goals: goals
      });
    } catch (err) {
      return handleError(err, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
