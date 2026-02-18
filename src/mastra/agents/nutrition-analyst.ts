import { Agent } from "@mastra/core/agent";
import { getLLMModel, agentDefaults } from "../config/llm";
import { loadNutritionAnalystInstructions } from "../utils/context-loader";
import { createNutritionMemory } from "../config/memory";
import { createUserProfileTool } from "../tools/create-user-profile";
import { toolSearch } from "../config/toolProcessor";

/**
 * Nutrition Analyst Agent
 * Responsável por análise de alimentos e cálculos nutricionais
 *
 * Memory configurada com:
 * - Message History: Últimas 15 mensagens
 * - Semantic Recall: Busca em histórico
 * - Working Memory: Aprendizados do agente
 * - Tools: Carregadas dinamicamente via ToolSearchProcessor
 */
export const nutritionAnalystAgent = new Agent({
  id: "nutrition-analyst",
  name: "nutrition-analyst",
  description:
    "Agente especializado em análise nutricional, identificação de alimentos em imagens e busca de alimentos",
  instructions: loadNutritionAnalystInstructions(),
  model: "github-models/openai/gpt-4o-mini",
  memory: createNutritionMemory(),
  inputProcessors: [toolSearch],
  tools: {createUserProfileTool},
});
