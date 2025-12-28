import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
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
});
