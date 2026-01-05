import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { searchFoods, type FoodItem } from '../clients/catalog-client';

/**
 * Transforma FoodItem da API para formato da tool
 */
const formatFoodItem = (food: FoodItem) => ({
  id: food.id,
  name: food.name,
  category: food.category ?? 'Sem categoria',
  portion: `${food.serving_size_g}${food.serving_unit ?? 'g'}`,
  nutrition: {
    calories: food.calorie_per_100g,
    protein_g: food.protein_g_100g ?? 0,
    carbs_g: food.carbs_g_100g ?? 0,
    fat_g: food.fat_g_100g ?? 0,
  },
});

/**
 * Tool para buscar alimentos no catálogo nutricional
 * Conecta com a Food Catalog API (FastAPI)
 */
export const searchFoodCatalogTool = createTool({
  id: 'search-food-catalog',
  description:
    'Busca alimentos no catálogo nutricional por nome ou categoria. Retorna informações nutricionais básicas.',
  inputSchema: z.object({
    query: z
      .string()
      .describe('Termo de busca (nome do alimento ou categoria)'),
    limit: z
      .number()
      .optional()
      .default(5)
      .describe('Número máximo de resultados (padrão: 5)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    foods: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        category: z.string(),
        portion: z.string(),
        nutrition: z.object({
          calories: z.number(),
          protein_g: z.number(),
          carbs_g: z.number(),
          fat_g: z.number(),
        }),
      })
    ),
    count: z.number(),
    error: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { query, limit = 5 } = context;

    console.log(`🔍 [Tool] Buscando alimentos: "${query}" (limite: ${limit})`);

    try {
      const response = await searchFoods({ query, limit });

      const foods = response.foods.map(formatFoodItem);

      console.log(`✅ [Tool] Encontrados ${foods.length} alimentos`);

      return {
        success: true,
        foods,
        count: foods.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      console.error(`❌ [Tool] Erro na busca:`, errorMessage);

      return {
        success: false,
        foods: [],
        count: 0,
        error: `Não foi possível buscar alimentos: ${errorMessage}`,
      };
    }
  },
});
