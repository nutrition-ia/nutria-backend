import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { findSimilarFoods, type SimilarFoodItem } from '../clients/catalog-client';
import { findSimilarOutputSchema } from '../schemas/output';
import { logger } from '../../utils/logger';

/**
 * Transforma SimilarFoodItem da API para formato da tool
 */
const formatSimilarFood = (food: SimilarFoodItem) => ({
  id: food.id,
  name: food.name,
  category: food.category ?? 'Sem categoria',
  nutrition: {
    calories: food.calorie_per_100g ?? 0,
    protein_g: food.protein_g_100g ?? 0,
    carbs_g: food.carbs_g_100g ?? 0,
    fat_g: food.fat_g_100g ?? 0,
    fiber_g: food.fiber_g_100g ?? 0,
  },
  similarity_score: food.similarity_score,
  similarity_percent: Math.round(food.similarity_score * 100),
});

/**
 * Tool para encontrar alimentos similares no catálogo nutricional
 * Útil para sugerir substituições em dietas mantendo perfil nutricional
 */
export const findSimilarFoodsTool = createTool({
  id: 'find-similar-foods',
  description:
    'Encontra alimentos com perfil nutricional similar a um alimento de referência. ' +
    'Útil para sugerir substituições em dietas, encontrar alternativas mais saudáveis, ' +
    'ou descobrir opções com macronutrientes equivalentes.',
  inputSchema: z.object({
    foodId: z
      .string()
      .describe('ID do alimento de referência (UUID)'),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe('Número máximo de alimentos similares (padrão: 10)'),
    sameCategory: z
      .boolean()
      .optional()
      .default(false)
      .describe('Se true, retorna apenas alimentos da mesma categoria'),
    tolerance: z
      .number()
      .optional()
      .default(0.3)
      .describe('Tolerância de diferença nutricional (0.3 = 30% de diferença permitida)'),
  }),
  outputSchema: findSimilarOutputSchema,
  execute: async ({ context }) => {
    const { foodId, limit = 10, sameCategory = false, tolerance = 0.3 } = context;

    logger.info(`🔄 [Tool] Buscando alimentos similares ao ID: "${foodId}"`);

    try {
      const response = await findSimilarFoods({
        food_id: foodId,
        limit,
        same_category: sameCategory,
        tolerance,
      });

      const referenceFood = {
        id: response.reference_food.id,
        name: response.reference_food.name,
        category: response.reference_food.category ?? 'Sem categoria',
        nutrition: {
          calories: response.reference_food.calorie_per_100g ?? 0,
          protein_g: response.reference_food.protein_g_100g ?? 0,
          carbs_g: response.reference_food.carbs_g_100g ?? 0,
          fat_g: response.reference_food.fat_g_100g ?? 0,
        },
      };

      const similarFoods = response.similar_foods.map(formatSimilarFood);

      logger.info(`✅ [Tool] Encontrados ${similarFoods.length} alimentos similares`);

      return {
        success: true,
        referenceFood,
        similarFoods,
        count: similarFoods.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      logger.error(`❌ [Tool] Erro na busca de similares:, ${errorMessage}`);

      return {
        success: false,
        referenceFood: {
          id: foodId,
          name: 'Desconhecido',
          category: 'Desconhecido',
          nutrition: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
        },
        similarFoods: [],
        count: 0,
        error: `Não foi possível buscar alimentos similares: ${errorMessage}`,
      };
    }
  },
});
