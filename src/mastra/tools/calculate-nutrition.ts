import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  calculateNutrition,
  type NutritionDetail,
} from '../clients/catalog-client';
import { calculateNutritionOutputSchema } from '../schemas/output';
import { logger } from '../../utils/logger';

/**
 * Transforma NutritionDetail da API para formato da tool
 */
const formatNutritionDetail = (detail: NutritionDetail) => ({
  foodId: detail.food_id,
  foodName: detail.food_name,
  quantity_g: detail.quantity_g,
  calories: detail.calories,
  protein_g: detail.protein_g,
  carbs_g: detail.carbs_g,
  fat_g: detail.fat_g,
});

/**
 * Tool para calcular valores nutricionais totais
 * Conecta com a Food Catalog API (FastAPI)
 */
export const calculateNutritionTool = createTool({
  id: 'calculate-nutrition',
  description:
    'Calcula valores nutricionais totais para uma lista de alimentos com quantidades específicas',
  inputSchema: z.object({
    foods: z
      .array(
        z.object({
          foodId: z.string().describe('ID do alimento no catálogo'),
          quantity_g: z.number().describe('Quantidade em gramas'),
        })
      )
      .describe('Lista de alimentos com quantidades'),
  }),
  outputSchema: calculateNutritionOutputSchema,
  execute: async (inputData) => {
    const { foods } = inputData;

    logger.info(`🧮 [Tool] Calculando nutrição para ${foods.length} alimentos`);

    try {
      // Transforma formato da tool para formato da API
      const apiRequest = foods.map(f => ({
        food_id: f.foodId,
        quantity: f.quantity_g,
      }));

      const response = await calculateNutrition(apiRequest);

      const details = response.details.map(formatNutritionDetail);

      logger.info(`✅ [Tool] Total calculado: ${response.total.calories} kcal`);

      return {
        success: true,
        total: {
          calories: response.total.calories,
          protein_g: response.total.protein_g,
          carbs_g: response.total.carbs_g,
          fat_g: response.total.fat_g,
        },
        details,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      logger.error(`❌ [Tool] Erro no cálculo:, ${errorMessage}`);

      return {
        success: false,
        total: {
          calories: 0,
          protein_g: 0,
          carbs_g: 0,
          fat_g: 0,
        },
        details: [],
        error: `Não foi possível calcular nutrição: ${errorMessage}`,
      };
    }
  },
});
