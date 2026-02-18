import { ToolSearchProcessor } from "@mastra/core/processors";
import { searchFoodCatalogTool } from "../tools/search-food-catalog";
import { calculateNutritionTool } from "../tools/calculate-nutrition";
import { findSimilarFoodsTool } from "../tools/find-similar-foods";
import { recommendationTool } from "../tools/recommendation";
import { logMealTool } from "../tools/log-meal";
import { getDailySummaryTool } from "../tools/get-daily-summary";
import { getWeeklyStatsTool } from "../tools/get-weekly-stats";
import { createMealPlanTool } from "../tools/create-meal-plan";
import { listMealPlansTool } from "../tools/list-meal-plans";
import { getMealPlanTool } from "../tools/get-meal-plan";
import { updateMealPlanTool } from "../tools/update-meal-plan";
import { deleteMealPlanTool } from "../tools/delete-meal-plan";
import { analyzeFoodImageTool } from "../tools/analyze-food-image";
import { confirmAndLogImageMealTool } from "../tools/confirm-and-log-image-meal";

export const toolSearch = new ToolSearchProcessor({
  tools: {
    searchFoodCatalogTool,
    calculateNutritionTool,
    findSimilarFoodsTool,
    recommendationTool,
    logMealTool,
    getDailySummaryTool,
    getWeeklyStatsTool,
    createMealPlanTool,
    listMealPlansTool,
    getMealPlanTool,
    updateMealPlanTool,
    deleteMealPlanTool,
    analyzeFoodImageTool,
    confirmAndLogImageMealTool,
  },
  search: {
    topK: 5,
    minScore: 0.1,
  },
});