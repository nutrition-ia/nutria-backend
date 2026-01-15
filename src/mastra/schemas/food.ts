import z from "zod"
import { nutritionSchema, nutritionWithFiber } from "./nutrition"

export const foodBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
})

export const foodWithNutritionSchema = foodBaseSchema.extend({
  nutrition: nutritionSchema,
})

export const foodWithPortionSchema = foodWithNutritionSchema.extend({
  portion: z.string(),
})

export const similarFoodSchema = foodBaseSchema.extend({
  nutrition: nutritionWithFiber,
  similarity_score: z.number(),
  similarity_percent: z.number(),
})