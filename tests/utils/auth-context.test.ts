import { describe, it, expect } from "vitest";
import { extractAuthContext } from "../../src/mastra/utils/auth-context";

function mockContext(userId?: string, token?: string) {
  const map = new Map<string, string>();
  if (userId) map.set("mastra__resourceId", userId);
  if (token) map.set("jwt_token", token);
  return { requestContext: map };
}

describe("extractAuthContext", () => {
  it("extracts userId and authToken from context", () => {
    const { userId, authToken } = extractAuthContext(mockContext("u1", "tok1"));
    expect(userId).toBe("u1");
    expect(authToken).toBe("tok1");
  });

  it("returns anonymous and undefined token when context is undefined", () => {
    const { userId, authToken } = extractAuthContext(undefined);
    expect(userId).toBe("anonymous");
    expect(authToken).toBeUndefined();
  });

  it("returns anonymous when resourceId not set", () => {
    const { userId } = extractAuthContext(mockContext(undefined, "tok"));
    expect(userId).toBe("anonymous");
  });

  it("returns undefined token when jwt_token not set", () => {
    const { authToken } = extractAuthContext(mockContext("u1"));
    expect(authToken).toBeUndefined();
  });
});
