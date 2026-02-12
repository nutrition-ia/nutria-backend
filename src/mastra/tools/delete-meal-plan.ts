import { createTool } from "@mastra/core";
import { z } from "zod";
import { deleteMealPlan } from "../clients/catalog-client";

const deleteMealPlanToolInput = z.object({
  plan_id: z.string().describe("ID do plano a deletar"),
});

const deleteMealPlanToolOutput = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const deleteMealPlanTool = createTool({
  id: "delete_meal_plan",
  description:
    "Deleta um plano alimentar. " +
    "Use quando o usuário pedir para excluir, remover, deletar um plano. " +
    "Exemplos: 'Delete minha dieta antiga', 'Remove o plano X', 'Apaga essa dieta'",
  inputSchema: deleteMealPlanToolInput,
  outputSchema: deleteMealPlanToolOutput,
  execute: async ({ context, resourceId: toolResourceId }) => {
    const { plan_id } = context;

    // Resolve user ID from context
    const userId =
      toolResourceId ||
      (context as any).resourceId ||
      (context as any).metadata?.resourceId ||
      "anonymous";

    if (userId === "anonymous") {
      throw new Error(
        "Usuário não autenticado. Por favor, faça login para deletar planos.",
      );
    }

    console.log(
      `📋 [Tool:deleteMealPlan] Deletando plano ${plan_id} para usuário: ${userId}`,
    );

    try {
      await deleteMealPlan(plan_id, userId);

      console.log(`✅ [Tool:deleteMealPlan] Plano deletado com sucesso`);

      return {
        success: true,
        message: "Plano alimentar deletado com sucesso!",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error(`❌ [Tool:deleteMealPlan] Erro: ${errorMessage}`);

      throw new Error(
        `Erro ao deletar plano: ${errorMessage}. Verifique se o ID está correto e se você tem permissão para deletar este plano.`,
      );
    }
  },
});
