import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Tool para calcular valores nutricionais totais
 * VERSÃO MOCK - Calcula baseado em dados simulados
 */
export const calculateNutritionTool = createTool({
  id: 'calculate-nutrition',
  description: 'Calcula valores nutricionais totais para uma lista de alimentos com quantidades específicas',
  inputSchema: z.object({
    foods: z.array(z.object({
      foodId: z.string().describe('ID do alimento no catálogo'),
      quantity_g: z.number().describe('Quantidade em gramas'),
    })).describe('Lista de alimentos com quantidades'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    total: z.object({
      calories: z.number(),
      protein_g: z.number(),
      carbs_g: z.number(),
      fat_g: z.number(),
    }),
    details: z.array(z.object({
      foodId: z.string(),
      foodName: z.string(),
      quantity_g: z.number(),
      calories: z.number(),
      protein_g: z.number(),
      carbs_g: z.number(),
      fat_g: z.number(),
    })),
  }),
  execute: async ({ context }) => {
    const { foods } = context;

    console.log(`🧮 Calculando nutrição para ${foods.length} alimentos`);

    // MOCK DATABASE (mesmo da search-food-catalog)
    const mockNutritionData: Record<string, any> = {
      'food-001': { name: 'Banana', per100g: { calories: 89, protein_g: 1.1, carbs_g: 22.8, fat_g: 0.3 } },
      'food-002': { name: 'Arroz Branco Cozido', per100g: { calories: 130, protein_g: 2.7, carbs_g: 28.2, fat_g: 0.3 } },
      'food-003': { name: 'Peito de Frango Grelhado', per100g: { calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 } },
      'food-004': { name: 'Brócolis Cozido', per100g: { calories: 35, protein_g: 2.4, carbs_g: 7.2, fat_g: 0.4 } },
      'food-005': { name: 'Ovo Cozido', per100g: { calories: 156, protein_g: 12.6, carbs_g: 1.2, fat_g: 10.6 } },
      'food-006': { name: 'Maçã', per100g: { calories: 52, protein_g: 0.3, carbs_g: 13.8, fat_g: 0.2 } },
      'food-007': { name: 'Batata Doce Cozida', per100g: { calories: 86, protein_g: 1.6, carbs_g: 20.1, fat_g: 0.1 } },
      'food-008': { name: 'Aveia', per100g: { calories: 389, protein_g: 16.9, carbs_g: 66.3, fat_g: 6.9 } },
    };

    const details: any[] = [];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    for (const food of foods) {
      const nutritionData = mockNutritionData[food.foodId];

      if (!nutritionData) {
        console.warn(`⚠️ Alimento ${food.foodId} não encontrado no catálogo mock`);
        continue;
      }

      // Calcular valores proporcionais baseado na quantidade
      const multiplier = food.quantity_g / 100;
      const itemCalories = nutritionData.per100g.calories * multiplier;
      const itemProtein = nutritionData.per100g.protein_g * multiplier;
      const itemCarbs = nutritionData.per100g.carbs_g * multiplier;
      const itemFat = nutritionData.per100g.fat_g * multiplier;

      details.push({
        foodId: food.foodId,
        foodName: nutritionData.name,
        quantity_g: food.quantity_g,
        calories: Math.round(itemCalories * 10) / 10,
        protein_g: Math.round(itemProtein * 10) / 10,
        carbs_g: Math.round(itemCarbs * 10) / 10,
        fat_g: Math.round(itemFat * 10) / 10,
      });

      totalCalories += itemCalories;
      totalProtein += itemProtein;
      totalCarbs += itemCarbs;
      totalFat += itemFat;
    }

    const result = {
      success: true,
      total: {
        calories: Math.round(totalCalories * 10) / 10,
        protein_g: Math.round(totalProtein * 10) / 10,
        carbs_g: Math.round(totalCarbs * 10) / 10,
        fat_g: Math.round(totalFat * 10) / 10,
      },
      details,
    };

    console.log(`✅ Total calculado: ${result.total.calories} kcal`);

    return result;
  },
});
