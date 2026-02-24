import { MASTRA_RESOURCE_ID_KEY } from "@mastra/core/request-context";

export interface AuthContext {
  userId: string;
  authToken: string | undefined;
}

/**
 * Extracts userId and JWT token from the Mastra execution context.
 * Returns "anonymous" and undefined if context is missing.
 */
export function extractAuthContext(executionContext: any): AuthContext {
  const userId =
    (executionContext?.requestContext?.get(MASTRA_RESOURCE_ID_KEY) as string) ||
    "anonymous";
  const authToken = executionContext?.requestContext?.get("jwt_token") as
    | string
    | undefined;

  return { userId, authToken };
}
