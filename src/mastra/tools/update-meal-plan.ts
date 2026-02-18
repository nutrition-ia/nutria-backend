import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { updateMealPlan } from "../clients/catalog-client";
import { MASTRA_RESOURCE_ID_KEY } from "@mastra/core/request-context";

const updateMealPlanToolInput = z.object({
  plan_id: z.string().describe("ID do plano a atualizar"),
  plan_name: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe("Novo nome do plano"),
  description: z
    .string()
    .max(500)
    .optional()
    .describe("Nova descrição"),
  daily_calories: z
    .number()
    .positive()
    .optional()
    .describe("Nova meta de calorias"),
  daily_protein_g: z
    .number()
    .positive()
    .optional()
    .describe("Nova meta de proteína"),
  daily_fat_g: z
    .number()
    .positive()
    .optional()
    .describe("Nova meta de gordura"),
  daily_carbs_g: z
    .number()
    .positive()
    .optional()
    .describe("Nova meta de carboidratos"),
  meals: z
    .array(z.record(z.unknown()))
    .optional()
    .describe("Novas refeições"),
});

const updateMealPlanToolOutput = z.object({
  id: z.string(),
  plan_name: z.string(),
  daily_calories: z.number(),
  message: z.string(),
});

export const updateMealPlanTool = createTool({
  id: "update_meal_plan",
  description:
    "Atualiza um plano alimentar existente. " +
    "Use quando o usuário pedir para editar, modificar, ajustar um plano. " +
    "Exemplos: 'Ajusta a dieta para 1800 calorias', 'Muda o nome do plano', 'Adiciona mais proteína'",
  inputSchema: updateMealPlanToolInput,
  outputSchema: updateMealPlanToolOutput,
  execute: async (inputData, executionContext) => {
    const { plan_id, ...updates } = inputData;

    // Resolve user ID from execution context
    const userId = (executionContext?.requestContext?.get(MASTRA_RESOURCE_ID_KEY) as string) || 'anonymous';

    if (userId === "anonymous") {
      throw new Error(
        "Usuário não autenticado. Por favor, faça login para editar planos.",
      );
    }

    console.log(
      `📋 [Tool:updateMealPlan] Atualizando plano ${plan_id} para usuário: ${userId}`,
    );

    try {
      const result = await updateMealPlan(plan_id, userId, updates);

      console.log(
        `✅ [Tool:updateMealPlan] Plano atualizado: "${result.plan_name}"`,
      );

      return {
        id: result.id,
        plan_name: result.plan_name,
        daily_calories: result.daily_calories,
        message: `Plano "${result.plan_name}" atualizado com sucesso!`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error(`❌ [Tool:updateMealPlan] Erro: ${errorMessage}`);

      throw new Error(
        `Erro ao atualizar plano: ${errorMessage}. Verifique se o ID está correto e se você tem permissão para editar este plano.`,
      );
    }
  },
});
