/**
 * Nutrition Analyst Agent - AI SDK Version
 *
 * Versão migrada usando ToolLoopAgent do Vercel AI SDK
 * para compatibilidade com createAgentUIStreamResponse e useChat no frontend.
 */

import { ToolLoopAgent, tool, InferAgentUIMessage } from 'ai';
import { z } from 'zod';
import { loadNutritionAnalystInstructions } from '../utils/context-loader';

// Importar todas as tools do Mastra
import { searchFoodCatalogTool } from '../tools/search-food-catalog';
import { calculateNutritionTool } from '../tools/calculate-nutrition';
import { findSimilarFoodsTool } from '../tools/find-similar-foods';
import { recommendationTool } from '../tools/recommendation';
import { logMealTool } from '../tools/log-meal';
import { getDailySummaryTool } from '../tools/get-daily-summary';
import { getWeeklyStatsTool } from '../tools/get-weekly-stats';
import { createUserProfileTool } from '../tools/create-user-profile';
import { createMealPlanTool } from '../tools/create-meal-plan';
import { listMealPlansTool } from '../tools/list-meal-plans';
import { getMealPlanTool } from '../tools/get-meal-plan';
import { updateMealPlanTool } from '../tools/update-meal-plan';
import { deleteMealPlanTool } from '../tools/delete-meal-plan';
import { analyzeFoodImageTool } from '../tools/analyze-food-image';
import { confirmAndLogImageMealTool } from '../tools/confirm-and-log-image-meal';

/**
 * Helper para converter ferramentas do Mastra para o formato AI SDK
 * Mastra tools esperam um objeto com { context, resourceId, runId, threadId }
 * AI SDK tools recebem apenas os parâmetros de input
 *
 * Usa agentContext.userId para passar o userId para as tools que precisam
 */
function convertMastraToolToAISDK<TInput extends z.ZodTypeAny>(
  mastraTool: any
) {
  return tool({
    description: mastraTool.description,
    inputSchema: mastraTool.inputSchema as TInput,
    execute: async (input: z.infer<TInput>, options?: any) => {
      // Mastra tools esperam { context, resourceId, runId, threadId }
      try {
        const result = await mastraTool.execute({
          context: input,
          // Usa o userId do contexto global
          resourceId: agentContext.userId,
          runId: `run-${Date.now()}`,
          threadId: `thread-${agentContext.userId}`,
        });
        return result;
      } catch (error) {
        console.error(`❌ Error executing tool ${mastraTool.id}:`, error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  });
}

/**
 * Storage global temporário para userId
 * TODO: Implementar usando AsyncLocalStorage ou context proper do AI SDK
 */
export const agentContext = {
  userId: 'unknown',
};

/**
 * Helper para criar agente com contexto de usuário
 * Permite passar o userId para as tools que precisam
 */
export function createNutritionAnalystAgent(userId: string) {
  // Atualiza o contexto global (temporário)
  agentContext.userId = userId;

  return new ToolLoopAgent({
    model: 'github-models/openai/gpt-4o-mini',
    instructions: loadNutritionAnalystInstructions(),

    tools: {
      searchFoodCatalog: convertMastraToolToAISDK(searchFoodCatalogTool),
      calculateNutrition: convertMastraToolToAISDK(calculateNutritionTool),
      findSimilarFoods: convertMastraToolToAISDK(findSimilarFoodsTool),
      recommendation: convertMastraToolToAISDK(recommendationTool),
      logMeal: convertMastraToolToAISDK(logMealTool),
      getDailySummary: convertMastraToolToAISDK(getDailySummaryTool),
      getWeeklyStats: convertMastraToolToAISDK(getWeeklyStatsTool),
      createUserProfile: convertMastraToolToAISDK(createUserProfileTool),
      createMealPlan: convertMastraToolToAISDK(createMealPlanTool),
      listMealPlans: convertMastraToolToAISDK(listMealPlansTool),
      getMealPlan: convertMastraToolToAISDK(getMealPlanTool),
      updateMealPlan: convertMastraToolToAISDK(updateMealPlanTool),
      deleteMealPlan: convertMastraToolToAISDK(deleteMealPlanTool),
      analyzeFoodImage: convertMastraToolToAISDK(analyzeFoodImageTool),
      confirmAndLogImageMeal: convertMastraToolToAISDK(confirmAndLogImageMealTool),
    },
  });
}

/**
 * Agente padrão para uso quando não há userId disponível
 */
export const nutritionAnalystAgentAISDK = createNutritionAnalystAgent('default');

/**
 * Tipo inferido do agente para usar no frontend com useChat
 *
 * @example
 * ```tsx
 * import { useChat } from '@ai-sdk/react';
 * import type { NutritionAnalystUIMessage } from '@/mastra/agents/nutrition-analyst-ai-sdk';
 *
 * const { messages } = useChat<NutritionAnalystUIMessage>();
 * ```
 */
export type NutritionAnalystUIMessage = InferAgentUIMessage<ReturnType<typeof createNutritionAnalystAgent>>;
