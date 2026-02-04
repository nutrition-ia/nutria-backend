import { Agent } from "@mastra/core/agent";
import { getLLMModel, agentDefaults } from "../config/llm";
import { searchFoodCatalogTool } from "../tools/search-food-catalog";
import { calculateNutritionTool } from "../tools/calculate-nutrition";
import { findSimilarFoodsTool } from "../tools/find-similar-foods";
import { recommendationTool } from "../tools/recommendation";
import { logMealTool } from "../tools/log-meal";
import { getDailySummaryTool } from "../tools/get-daily-summary";
import { getWeeklyStatsTool } from "../tools/get-weekly-stats";
import { createUserProfileTool } from "../tools/create-user-profile";
import { loadNutritionAnalystInstructions } from "../utils/context-loader";
import { createNutritionMemory } from "../config/memory";

/**
 * Nutrition Analyst Agent
 * Responsável por análise de alimentos e cálculos nutricionais
 *
 * Memory configurada com:
 * - Message History: Últimas 15 mensagens
 * - Semantic Recall: Busca em histórico
 * - Working Memory: Aprendizados do agente
 */
export const nutritionAnalystAgent = new Agent({
  name: "nutrition-analyst",
  description:
    "Agente especializado em análise nutricional, identificação de alimentos em imagens e busca de alimentos",
  instructions: loadNutritionAnalystInstructions(),
  model: "github-models/openai/gpt-4.1-mini",
  memory: createNutritionMemory(),
  tools: [
    searchFoodCatalogTool,
    calculateNutritionTool,
    findSimilarFoodsTool,
    recommendationTool,
    createUserProfileTool,
    logMealTool,
    getDailySummaryTool,
    getWeeklyStatsTool,
  ],
});
