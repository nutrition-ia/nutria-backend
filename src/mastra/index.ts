import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { registerApiRoute } from '@mastra/core/server';
import { nutritionAnalystAgent } from './agents/nutrition-analyst';
import { handleAuth, handleMe } from '../lib/auth-routes';
import { getUserProfileFromDB } from './utils/user-profile-loader';
import {  userProfileToContext } from "../mastra/config/memory";



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
      // Auth routes - todas as variações
      registerApiRoute('/auth/sign-up', { method: 'POST', handler: handleAuth }),
      registerApiRoute('/auth/sign-in/email', { method: 'POST', handler: handleAuth }),
      registerApiRoute('/auth/sign-out', { method: 'POST', handler: handleAuth }),
      registerApiRoute('/auth/get-session', { method: 'GET', handler: handleAuth }),
      registerApiRoute('/auth/session', { method: 'GET', handler: handleAuth }),
      registerApiRoute('/me', { method: 'GET', handler: handleMe }),

      // Rota de chat
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

            // Extrai informações do usuário dos headers
            const userId = c.req.header('X-User-Id');
            const userEmail = c.req.header('X-User-Email');
            if(!userId) {
              return c.json({ error: 'Header "X-User-Id" é obrigatório' }, 400);
            }
            // Tenta carregar perfil do usuário (opcional)
            const userProfile = await getUserProfileFromDB(userId);
            const contextMessages = [];

            if (userProfile) {
              contextMessages.push(userProfileToContext(userProfile));
            } else {
              console.log(`⚠️ [Chat] Usuário ${userId} sem perfil - continuando sem personalização`);
              // Informa a LLM que o usuário não tem perfil
              contextMessages.push({
                role: 'system' as const,
                content: `⚠️ SISTEMA: Este usuário ainda NÃO tem um perfil nutricional cadastrado. Siga as instruções da seção "USUÁRIO SEM PERFIL" das suas diretrizes.`
              });
            }

            console.log('📥 Mastra received:', JSON.stringify({
              userId,
              userEmail,
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

            // Usa resourceId para identificar o usuário (Mastra padrão)
            const agentStream = await nutritionAgent.stream(messages, {
              format: 'aisdk',
              resourceId: userId,
              threadId: `chat-${userId}`,
              context: contextMessages,
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
