/**
 * Tool para criar perfil de usuário
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { invalidateUserProfileCache } from "../utils/user-profile-loader";
import { extractAuthContext } from "../utils/auth-context";
import { createUserProfile } from "../clients/catalog-client";

const createUserProfileToolInput = z.object({
  name: z.string().describe("Nome do usuário"),
  age: z.number().int().min(1).max(120).describe("Idade do usuário"),
  weight_kg: z.number().positive().optional().describe("Peso em kg (opcional)"),
  height_cm: z
    .number()
    .positive()
    .optional()
    .describe("Altura em cm (opcional)"),
  activity_level: z
    .enum(["sedentary", "light", "moderate", "active", "very_active"])
    .optional()
    .describe("Nível de atividade física"),
  diet_goal: z
    .enum(["weight_loss", "weight_gain", "maintain"])
    .optional()
    .describe("Objetivo alimentar"),
  dietary_restrictions: z
    .array(z.string())
    .optional()
    .describe(
      'Restrições alimentares (ex: ["vegetarian", "vegan", "gluten-free"])',
    ),
  allergies: z
    .array(z.string())
    .optional()
    .describe('Alergias alimentares (ex: ["peanuts", "shellfish", "lactose"])'),
  disliked_foods: z
    .array(z.string())
    .optional()
    .describe('Alimentos que não gosta (ex: ["broccoli", "liver"])'),
  preferred_cuisines: z
    .array(z.string())
    .optional()
    .describe(
      'Culinárias preferidas (ex: ["brazilian", "italian", "japanese"])',
    ),
});

export const createUserProfileTool = createTool({
  id: "create_user_profile",
  description:
    "Cria um novo perfil nutricional para o usuário com suas informações pessoais, preferências e restrições. " +
    "Use esta tool após coletar as informações do usuário através de perguntas. " +
    "O perfil será usado para personalizar recomendações de alimentos e acompanhar o progresso nutricional. " +
    "Exemplos de quando usar: 'Quero criar meu perfil', 'Preciso configurar minhas restrições alimentares', 'Quero personalizar minhas recomendações'",
  inputSchema: createUserProfileToolInput,
  outputSchema: z.object({
    success: z.boolean().describe("Se o perfil foi criado com sucesso"),
    user_id: z.string().optional().describe("ID do usuário criado"),
    message: z.string().describe("Mensagem de sucesso ou erro"),
    profile: z
      .object({
        name: z.string(),
        age: z.number(),
        weight_kg: z.number().optional(),
        height_cm: z.number().optional(),
        activity_level: z.string().optional(),
        diet_goal: z.string().optional(),
        dietary_restrictions: z.array(z.string()),
        allergies: z.array(z.string()),
        disliked_foods: z.array(z.string()),
      })
      .optional()
      .describe("Dados do perfil criado"),
  }),
  execute: async (inputData, executionContext) => {
    const {
      name,
      age,
      weight_kg,
      height_cm,
      activity_level,
      diet_goal,
      dietary_restrictions = [],
      allergies = [],
      disliked_foods = [],
      preferred_cuisines = [],
    } = inputData;

    // Get user_id and JWT from execution context
    const { userId, authToken } = extractAuthContext(executionContext);

    if (!userId || userId === "anonymous") {
      return {
        success: false,
        message:
          "Não foi possível criar o perfil: usuário não autenticado. Por favor, faça login primeiro.",
      };
    }

    console.log(
      "👤 [Tool:createUserProfile] Criando perfil para usuário:",
      userId,
    );
    console.log("Dados:", { name, age, weight_kg, height_cm });

    try {
      const profileData = await createUserProfile(
        {
          user_id: userId,
          name,
          age,
          weight_kg,
          height_cm,
          activity_level: activity_level || "moderate",
          diet_goal: diet_goal || "maintain",
          dietary_restrictions,
          allergies,
          disliked_foods,
          preferred_cuisines,
        },
        undefined,
        authToken,
      );

      console.log("✅ [Tool:createUserProfile] Perfil criado com sucesso!");

      // Invalida o cache para garantir que o próximo acesso pegue o perfil atualizado
      invalidateUserProfileCache(userId);

      return {
        success: true,
        user_id: userId,
        message: `Perfil criado com sucesso! Agora posso fornecer recomendações personalizadas baseadas em suas preferências e restrições.`,
        profile: {
          name: profileData.name,
          age: profileData.age,
          weight_kg: profileData.weight_kg,
          height_cm: profileData.height_cm,
          activity_level: profileData.activity_level,
          diet_goal: profileData.diet_goal,
          dietary_restrictions: profileData.dietary_restrictions || [],
          allergies: profileData.allergies || [],
          disliked_foods: profileData.disliked_foods || [],
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error("❌ [Tool:createUserProfile] Erro:", error);

      // Se já existe, retorna com flag especial
      if (errorMessage.includes("já existe")) {
        return {
          success: false,
          already_exists: true,
          user_id: userId,
          message:
            "❌ PERFIL JÁ EXISTE. O usuário já tem um perfil cadastrado. NÃO tente criar novamente. Se precisar atualizar dados, sugira ao usuário fazer manualmente ou use outro fluxo.",
        };
      }

      return {
        success: false,
        message: `Erro ao criar perfil: ${errorMessage}`,
      };
    }
  },
});
