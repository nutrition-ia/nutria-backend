import z from "zod";

export const userSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  agr: z.number(),
  wheight_kg: z.number().optional(),
  height_cm: z.number().optional(),
  gender: z.string().optional(),
  activity_level: z.enum(["WEIGHT_LOSS", "WEIGHT_GAIN", "MANTAIN"]),
  diet_goal: z.enum([
    "SEDENTARY",
    "LIGHT",
    "MODERATE",
    "ACTIVE",
    "VERY_ACTIVE",
  ]),
  dietary_restrictions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  disliked_foods: z.array(z.string()).optional(),
  preferred_cousines: z.array(z.string()).optional(),
});

export const mealSchema = z.object({
  user_id: z.string(),
  plan_name: z.string(),
  descriptions: z.string(),
  daily_calories: z.number(),
  daily_protein: z.number(),
  daily_fat_g: z.number(),
  created_by: z.string().default("system"),
  meals: z.array(z.record(z.any())).default([]),
});
