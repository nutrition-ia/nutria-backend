import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { registerApiRoute } from '@mastra/core/server';
import { nutritionAnalystAgent } from './agents/nutrition-analyst';

export const mastra = new Mastra({
  workflows: {},
  agents: {
    nutritionAnalystAgent,
  },
  storage: new LibSQLStore({
    url: ':memory:',
  }),
  logger: new PinoLogger({
    name: 'NutriAI',
    level: 'info',
  }),
  observability: {
    default: {
      enabled: true,
    },
  },
  server: {
    apiRoutes: [
      registerApiRoute('/chat', {
        method: 'POST',
        handler: async (c) => {
          try {
            const { messages } = await c.req.json();

            if (!messages || !Array.isArray(messages)) {
              return c.json(
                { error: 'Campo "messages" é obrigatório e deve ser um array' },
                400
              );
            }

            console.log('📥 Mastra received:', JSON.stringify({
              messageCount: messages.length,
              messages: messages.map((m: { role: string; content?: { type: string; mediaType?: string; data?: string }[] }) => ({
                role: m.role,
                contentTypes: m.content?.map((c: { type: string; mediaType?: string; data?: string }) => ({
                  type: c.type,
                  mediaType: c.mediaType,
                  hasData: !!c.data,
                  dataLength: c.data?.length || 0
                }))
              }))
            }, null, 2));

            const mastra = c.get('mastra');
            const nutritionAgent = mastra.getAgent('nutritionAnalystAgent');

            if (!nutritionAgent) {
              return c.json({ error: 'Agent não encontrado' }, 500);
            }

            const agentStream = await nutritionAgent.stream(messages, {
              format: 'aisdk',
            });

            return agentStream.toUIMessageStreamResponse();
          } catch (error) {
            console.error('❌ Erro no endpoint /chat:', error);
            return c.json(
              {
                error: 'Erro ao processar a requisição',
                details: error instanceof Error ? error.message : 'Erro desconhecido',
              },
              500
            );
          }
        },
      }),
    ],
  },
});
