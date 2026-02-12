/**
 * Tool para confirmar e registrar refeição após análise de imagem
 */

import { createTool } from "@mastra/core";
import { z } from "zod";
import { searchFoodsByEmbedding, logMeal } from "../clients/catalog-client";

const confirmAndLogImageMealToolInput = z.object({
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]).describe("Tipo"),
  detected_foods: z.array(
    z.object({
      food_name: z.string().describe("Nome"),
      quantity_g: z.number().describe("Gramas"),
      user_confirmed: z.boolean().default(true).describe("Confirmado"),
      user_adjusted_quantity_g: z.number().optional().describe("Ajustado"),
    })
  ).min(1).describe("Alimentos"),
  notes: z.string().optional().describe("Notas"),
});

const confirmAndLogImageMealToolOutput = z.object({
  meal_log_id: z.string().describe("ID"),
  total_calories: z.number().describe("Calorias"),
  total_protein_g: z.number().describe("Proteína"),
  total_carbs_g: z.number().describe("Carbos"),
  total_fat_g: z.number().describe("Gordura"),
  foods_logged: z.number().describe("Qtd"),
  catalog_matches: z.array(
    z.object({
      detected_name: z.string(),
      catalog_food: z.object({
        id: z.string(),
        name: z.string(),
        similarity: z.number(),
      }),
    })
  ).describe("Matches"),
});

export const confirmAndLogImageMealTool = createTool({
  id: "confirm_and_log_image_meal",
  description:
    "Registra refeição após análise de imagem. Use APÓS analyze_food_image quando usuário confirmar. Busca alimentos com embeddings (semântica).",
  inputSchema: confirmAndLogImageMealToolInput,
  outputSchema: confirmAndLogImageMealToolOutput,
  execute: async ({ context, resourceId: toolResourceId }) => {
    const { meal_type, detected_foods, notes } = context;

    // Resolve user ID (seguir padrão dos outros tools)
    const userId =
      toolResourceId ||
      (context as any).resourceId ||
      (context as any).metadata?.resourceId ||
      "anonymous";

    if (userId === "anonymous") {
      throw new Error(
        "Usuário não autenticado. Por favor, faça login para registrar refeições."
      );
    }

    console.log(
      `🍽️ [Tool:confirmAndLogImageMeal] Registrando refeição de imagem para: ${userId}`
    );
    console.log(`   Tipo: ${meal_type}, Alimentos: ${detected_foods.length}`);

    const catalogMatches = [];
    const foodsToLog = [];

    // Para cada alimento detectado, busca no catálogo
    for (const food of detected_foods) {
      if (!food.user_confirmed) {
        console.log(`   ⊘ Pulando '${food.food_name}' (não confirmado pelo usuário)`);
        continue;
      }

      const quantity = food.user_adjusted_quantity_g || food.quantity_g;

      console.log(`   🔎 Buscando '${food.food_name}' no catálogo (busca semântica)...`);

      try {
        // Busca semântica usando embeddings + cosine similarity
        const searchResult = await searchFoodsByEmbedding({
          query: food.food_name,
          limit: 1,  // Pega apenas o melhor match
        });

        if (searchResult.similar_foods && searchResult.similar_foods.length > 0) {
          const catalogFood = searchResult.similar_foods[0];

          console.log(
            `   ✓ Match: '${catalogFood.name}' (ID: ${catalogFood.id}, score: ${catalogFood.similarity_score})`
          );

          catalogMatches.push({
            detected_name: food.food_name,
            catalog_food: {
              id: catalogFood.id,
              name: catalogFood.name,
              similarity: catalogFood.similarity_score,
            },
          });

          foodsToLog.push({
            food_id: catalogFood.id,
            quantity_g: quantity,
            name: catalogFood.name,
          });
        } else {
          console.warn(`   ⚠️ Nenhum match encontrado para '${food.food_name}'`);
        }
      } catch (error) {
        console.error(
          `   ❌ Erro ao buscar '${food.food_name}': ${error instanceof Error ? error.message : "Erro desconhecido"}`
        );
      }
    }

    if (foodsToLog.length === 0) {
      throw new Error(
        "Nenhum alimento foi encontrado no catálogo. Tente ser mais específico com os nomes."
      );
    }

    // Registra a refeição completa
    console.log(`   💾 Registrando ${foodsToLog.length} alimento(s)...`);

    const mealLog = await logMeal({
      user_id: userId,
      meal_type,
      foods: foodsToLog,
      notes: notes || "Registrado via análise de imagem 📸",
    });

    console.log(
      `   ✅ Refeição registrada! ID: ${mealLog.id}, Calorias: ${mealLog.total_calories} kcal`
    );

    return {
      meal_log_id: mealLog.id,
      total_calories: mealLog.total_calories,
      total_protein_g: mealLog.total_protein_g,
      total_carbs_g: mealLog.total_carbs_g,
      total_fat_g: mealLog.total_fat_g,
      foods_logged: foodsToLog.length,
      catalog_matches: catalogMatches,
    };
  },
});
