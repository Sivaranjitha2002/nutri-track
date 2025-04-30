import { pgTable, text, serial, integer, boolean, timestamp, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  goal: json("goal").$type<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const foods = pgTable("foods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  calories: integer("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
  servingSize: real("serving_size").notNull(),
  servingUnit: text("serving_unit").notNull(),
  userId: integer("user_id").references(() => users.id),
  isCustom: boolean("is_custom").default(false),
});

export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  date: timestamp("date").notNull(),
  time: text("time").notNull(),
});

export const mealFoods = pgTable("meal_foods", {
  id: serial("id").primaryKey(),
  mealId: integer("meal_id").notNull().references(() => meals.id),
  foodId: integer("food_id").notNull().references(() => foods.id),
  quantity: real("quantity").notNull(),
});

export const waterIntake = pgTable("water_intake", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  cups: integer("cups").notNull(),
});

export const weightLog = pgTable("weight_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  weight: real("weight").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  goal: true,
});

export const insertFoodSchema = createInsertSchema(foods).pick({
  name: true,
  calories: true,
  protein: true,
  carbs: true,
  fat: true,
  servingSize: true,
  servingUnit: true,
  userId: true,
  isCustom: true,
});

export const insertMealSchema = createInsertSchema(meals).pick({
  userId: true,
  name: true,
  date: true,
  time: true,
});

export const insertMealFoodSchema = createInsertSchema(mealFoods).pick({
  mealId: true,
  foodId: true,
  quantity: true,
});

export const insertWaterIntakeSchema = createInsertSchema(waterIntake).pick({
  userId: true,
  date: true,
  cups: true,
});

export const insertWeightLogSchema = createInsertSchema(weightLog).pick({
  userId: true,
  date: true,
  weight: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Food = typeof foods.$inferSelect;
export type InsertFood = z.infer<typeof insertFoodSchema>;

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;

export type MealFood = typeof mealFoods.$inferSelect;
export type InsertMealFood = z.infer<typeof insertMealFoodSchema>;

export type WaterIntake = typeof waterIntake.$inferSelect;
export type InsertWaterIntake = z.infer<typeof insertWaterIntakeSchema>;

export type WeightLog = typeof weightLog.$inferSelect;
export type InsertWeightLog = z.infer<typeof insertWeightLogSchema>;
