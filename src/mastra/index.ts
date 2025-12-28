import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';

export const mastra = new Mastra({
  workflows: {},
  agents: {},
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
