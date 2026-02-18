import { Mastra } from '@mastra/core/mastra';
import { registerApiRoute } from '@mastra/core/server';
import { MASTRA_RESOURCE_ID_KEY } from '@mastra/core/request-context';
import { toAISdkStream } from '@mastra/ai-sdk';
import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { PinoLogger } from '@mastra/loggers';
import { nutritionAnalystAgent } from './agents/nutrition-analyst';
import { handleAuth, handleMe } from '../lib/auth-routes';
import { getUserProfileFromDB } from './utils/user-profile-loader';
import { userProfileToContext } from "../mastra/config/memory";
import { sharedStorage } from './config/storage';
import { getObservabilityConfig } from './config/observabilityOptions';



export const mastra = new Mastra({
  storage: sharedStorage,
  workflows: {},
  agents: {
    nutritionAnalystAgent,
  },
  logger: new PinoLogger({
    name: 'NutriAI',
    level: 'info',
  }),
  observability: getObservabilityConfig(),
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
              console.log(`✅ [Chat] Usuário ${userId} com perfil carregado`);
            } else {
              console.log(`⚠️ [Chat] Usuário ${userId} sem perfil - continuando sem personalização`);
              contextMessages.push({
                role: 'system' as const,
                content: 'SISTEMA: Este usuario ainda nao tem um perfil nutricional cadastrado.'
              });
            }

            console.log('📥 Mastra received:', JSON.stringify({
              userId,
              userEmail,
              messageCount: messages.length,
            }, null, 2));

            // Configura o resourceId no requestContext para que as tools possam acessá-lo
            const requestContext = c.get('requestContext');
            requestContext.set(MASTRA_RESOURCE_ID_KEY, userId);

            // Usa o agente Mastra (que já funciona com GitHub Models)
            const mastra = c.get('mastra');
            const nutritionAgent = mastra.getAgent('nutritionAnalystAgent');

            if (!nutritionAgent) {
              return c.json({ error: 'Agent não encontrado' }, 500);
            }

            // Stream do Mastra Agent
            const result = await nutritionAgent.stream(messages, {
              context: contextMessages,
            });

            // Converte para formato AI SDK
            const uiMessageStream = createUIMessageStream({
              originalMessages: messages,
              execute: async ({ writer }) => {
                for await (const part of toAISdkStream(result, { from: 'agent' })) {
                  await writer.write(part);
                }
              },
            });

            // Retorna como response compatível com useChat
            return createUIMessageStreamResponse({
              stream: uiMessageStream,
            });

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