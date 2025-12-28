import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Tool para buscar alimentos no catálogo nutricional
 * VERSÃO MOCK - Retorna dados simulados enquanto a API real não está disponível
 */
export const searchFoodCatalogTool = createTool({
  id: 'search-food-catalog',
  description: 'Busca alimentos no catálogo nutricional por nome ou categoria. Retorna informações nutricionais básicas.',
  inputSchema: z.object({
    query: z.string().describe('Termo de busca (nome do alimento ou categoria)'),
    limit: z.number().optional().default(5).describe('Número máximo de resultados (padrão: 5)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    foods: z.array(z.object({
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
    })),
    count: z.number(),
  }),
  execute: async ({ context }) => {
    const { query, limit = 5 } = context;

    console.log(`🔍 Buscando alimentos: "${query}" (limite: ${limit})`);

    // MOCK DATA - Dados simulados de alimentos comuns
    const mockDatabase = [
      {
        id: 'food-001',
        name: 'Banana',
        category: 'Frutas',
        portion: '100g',
        nutrition: { calories: 89, protein_g: 1.1, carbs_g: 22.8, fat_g: 0.3 },
      },
      {
        id: 'food-002',
        name: 'Arroz Branco Cozido',
        category: 'Cereais',
        portion: '100g',
        nutrition: { calories: 130, protein_g: 2.7, carbs_g: 28.2, fat_g: 0.3 },
      },
      {
        id: 'food-003',
        name: 'Peito de Frango Grelhado',
        category: 'Proteínas',
        portion: '100g',
        nutrition: { calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
      },
      {
        id: 'food-004',
        name: 'Brócolis Cozido',
        category: 'Vegetais',
        portion: '100g',
        nutrition: { calories: 35, protein_g: 2.4, carbs_g: 7.2, fat_g: 0.4 },
      },
      {
        id: 'food-005',
        name: 'Ovo Cozido',
        category: 'Proteínas',
        portion: '1 unidade (50g)',
        nutrition: { calories: 78, protein_g: 6.3, carbs_g: 0.6, fat_g: 5.3 },
      },
      {
        id: 'food-006',
        name: 'Maçã',
        category: 'Frutas',
        portion: '100g',
        nutrition: { calories: 52, protein_g: 0.3, carbs_g: 13.8, fat_g: 0.2 },
      },
      {
        id: 'food-007',
        name: 'Batata Doce Cozida',
        category: 'Tubérculos',
        portion: '100g',
        nutrition: { calories: 86, protein_g: 1.6, carbs_g: 20.1, fat_g: 0.1 },
      },
      {
        id: 'food-008',
        name: 'Aveia',
        category: 'Cereais',
        portion: '100g',
        nutrition: { calories: 389, protein_g: 16.9, carbs_g: 66.3, fat_g: 6.9 },
      },
    ];

    // Filtrar alimentos baseado na query (case-insensitive)
    const queryLower = query.toLowerCase();
    const results = mockDatabase
      .filter(food =>
        food.name.toLowerCase().includes(queryLower) ||
        food.category.toLowerCase().includes(queryLower)
      )
      .slice(0, limit);

    console.log(`✅ Encontrados ${results.length} alimentos`);

    return {
      success: true,
      foods: results,
      count: results.length,
    };
  },
});
