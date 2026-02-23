import { vi } from "vitest";

/**
 * Creates a fake Mastra execution context with resourceId and jwt_token.
 */
export function createMockExecutionContext(
  userId = "test-user-123",
  token = "mock-jwt-token",
) {
  const contextMap = new Map<string, string>();
  contextMap.set("__mastra_resource_id", userId);
  contextMap.set("jwt_token", token);

  return {
    requestContext: contextMap,
  };
}
