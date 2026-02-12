/**
 * Tool para analisar imagens de alimentos usando visão computacional
 */

import { createTool } from "@mastra/core";
import { z } from "zod";

const analyzeFoodImageToolInput = z.object({
  additional_context: z.string().optional().describe("Contexto adicional do usuário"),
});

const analyzeFoodImageToolOutput = z.object({
  detected_foods: z.array(
    z.object({
      food_name: z.string().describe("Nome em português"),
      estimated_quantity_g: z.number().describe("Quantidade (g)"),
      confidence: z.enum(["low", "medium", "high"]).describe("Confiança"),
      preparation: z.string().optional().describe("Preparo"),
    })
  ),
  suggestions: z.array(z.string()).describe("Sugestões"),
  needs_user_confirmation: z.boolean().describe("Pedir confirmação"),
  total_visible_foods: z.number().describe("Total de alimentos"),
});

export const analyzeFoodImageTool = createTool({
  id: "analyze_food_image",
  description:
    "Analisa imagem de alimento com visão computacional. Identifica alimentos, estima quantidades (g) e detecta preparo. Use quando usuário enviar foto de comida.",
  inputSchema: analyzeFoodImageToolInput,
  outputSchema: analyzeFoodImageToolOutput,
  execute: async ({ context }) => {
    const { additional_context } = context;

    // IMPORTANTE: Este tool NÃO processa a imagem diretamente
    // O modelo GPT-4o-mini (multimodal) já vê a imagem automaticamente
    // Apenas retornamos uma estrutura - a LLM popula os campos

    console.log("📸 [Tool:analyzeFoodImage] Analisando imagem de alimento...");

    if (additional_context) {
      console.log(`   Contexto adicional: ${additional_context}`);
    }

    // Instruções internas para o modelo processar a imagem
    // (não aparece para o usuário, guia a análise)
    const _analysisGuidelines = `
INSTRUÇÕES PARA ANÁLISE DE IMAGEM:

1. IDENTIFICAÇÃO DE ALIMENTOS:
   - Liste TODOS os alimentos visíveis na imagem
   - Use nomes em português claro para apresentar ao usuário (ex: "arroz branco", "frango grelhado")
   - IMPORTANTE: Ao chamar confirm_and_log_image_meal, traduza os nomes para INGLÊS
   - Exemplos de tradução: "arroz branco" -> "white rice", "frango grelhado" -> "grilled chicken", "feijão preto" -> "black beans"
   - Se houver preparações complexas, separe ingredientes principais

2. ESTIMATIVA DE QUANTIDADE:
   - Use referências visuais (tamanho de garfo, prato, mão)
   - Pratos padrão: ~26cm de diâmetro
   - Seja conservador: melhor subestimar que superestimar
   - Exemplos de porções típicas:
     * Arroz: 100-200g (1 concha = ~100g)
     * Feijão: 80-120g (1 concha = ~80g)
     * Bife/Frango: 100-150g (palma da mão)
     * Salada: 30-80g (difícil estimar, usar "low" confidence)

3. NÍVEL DE CONFIANÇA:
   - HIGH: alimento claramente visível, quantidade estimável com referências
   - MEDIUM: alimento visível mas quantidade difícil (misturado, parcialmente visível)
   - LOW: alimento incerto ou quantidade muito difícil de estimar

4. FORMA DE PREPARO:
   - Só mencione se for óbvio visualmente: "grelhado", "frito", "cozido", "cru"
   - Exemplos: frango com marcas de grelha, batata dourada (frita)

5. SUGESTÕES:
   - Se algo está incerto, peça confirmação específica
   - Sugira melhorias: "aproxime a câmera", "mostre referência de tamanho"
   - Se há muitos alimentos misturados, peça detalhes

${additional_context ? `\nCONTEXTO DO USUÁRIO: ${additional_context}` : ""}

SEMPRE marque needs_user_confirmation=true se houver qualquer incerteza significativa.
`;

    // Este objeto é preenchido pela LLM baseado na imagem
    return {
      detected_foods: [],
      suggestions: [],
      needs_user_confirmation: true,
      total_visible_foods: 0,
      _internal_guidelines: _analysisGuidelines  // Para debug
    };
  },
});
