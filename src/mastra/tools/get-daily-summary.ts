/**
 * Tool para obter resumo nutricional do dia
 */

import { createTool } from "@mastra/core";
import { z } from "zod";
import { getDailySummary } from "../clients/catalog-client";

const getDailySummaryToolInput = z.object({
  user_id: z.string().describe("ID do usuário"),
  date: z
    .string()
    .optional()
    .describe("Data no formato YYYY-MM-DD (opcional, padrão: hoje)"),
});

export const getDailySummaryTool = createTool({
  id: "get_daily_summary",
  description:
    "Obtém o resumo nutricional completo do dia para um usuário, incluindo: " +
    "- Todas as refeições registradas " +
    "- Totais de calorias e macronutrientes consumidos " +
    "- Metas nutricionais do usuário " +
    "- Progresso em relação às metas (percentuais) " +
    "- Número de refeições feitas " +
    "Use quando o usuário perguntar sobre seu dia, progresso ou consumo diário. " +
    "Exemplos: 'Como está meu dia hoje?', 'Quantas calorias já consumi?', 'Estou dentro das minhas metas?'",
  inputSchema: getDailySummaryToolInput,
  outputSchema: z.object({
    date: z.string().describe("Data do resumo"),
    num_meals: z.number().describe("Número de refeições registradas"),
    totals: z.object({
      calories: z.number(),
      protein_g: z.number(),
      carbs_g: z.number(),
      fat_g: z.number(),
    }),
    targets: z.object({
      calories: z.number(),
      protein_g: z.number(),
      carbs_g: z.number(),
      fat_g: z.number(),
    }),
    progress: z.object({
      calories_pct: z.number().describe("Porcentagem da meta de calorias"),
      protein_pct: z.number().describe("Porcentagem da meta de proteína"),
      carbs_pct: z.number().describe("Porcentagem da meta de carboidratos"),
      fat_pct: z.number().describe("Porcentagem da meta de gordura"),
    }),
    meals: z.array(
      z.object({
        id: z.string(),
        meal_type: z.string(),
        total_calories: z.number(),
        total_protein_g: z.number(),
        total_carbs_g: z.number(),
        total_fat_g: z.number(),
      }),
    ),
  }),
  execute: async ({ context }) => {
    console.log(
      "📈 [Tool:getDailySummary] Obtendo resumo do dia:",
      context.user_id,
    );

    const result = await getDailySummary(context.user_id, context.date);

    return {
      date: result.date,
      num_meals: result.num_meals,
      totals: result.totals,
      targets: result.targets,
      progress: result.progress,
      meals: result.meals.map((meal) => ({
        id: meal.id,
        meal_type: meal.meal_type,
        total_calories: meal.total_calories,
        total_protein_g: meal.total_protein_g,
        total_carbs_g: meal.total_carbs_g,
        total_fat_g: meal.total_fat_g,
      })),
    };
  },
});
