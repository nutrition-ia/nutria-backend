import { auth } from "./auth";

/**
 * Rotas de autenticação do Better Auth
 * Expostas no backend Mastra para uso pelo frontend Next.js
 */

// Handler principal do Better Auth
export async function handleAuth(c: any) {
  try {
    // Better Auth processa automaticamente:
    // - POST /api/auth/sign-up (registro)
    // - POST /api/auth/sign-in/email (login)
    // - POST /api/auth/sign-out (logout)
    // - GET /api/auth/get-session (obter sessão)
    // E outras rotas de autenticação

    return auth.handler(c.req.raw);
  } catch (error) {
    console.error("❌ Erro no handler de autenticação:", error);
    return c.json(
      {
        error: "Erro ao processar requisição de autenticação",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      500
    );
  }
}

// Handler para obter perfil do usuário autenticado
export async function handleMe(c: any) {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session?.user) {
      return c.json({ error: "Não autenticado" }, 401);
    }

    // Retorna dados do usuário
    return c.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        planType: session.user.planType || "free",
        avatarUrl: session.user.avatarUrl,
        createdAt: session.user.createdAt,
      },
      session: {
        expiresAt: session.session.expiresAt,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao obter perfil:", error);
    return c.json(
      {
        error: "Erro ao obter perfil do usuário",
      },
      500
    );
  }
}

// Middleware de autenticação - usar nas rotas protegidas
export async function requireAuth(c: any, next: () => Promise<void>) {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session?.user) {
      return c.json({ error: "Autenticação necessária" }, 401);
    }

    // Adiciona user ao contexto para usar nas rotas
    c.set("user", session.user);
    c.set("session", session.session);

    await next();
  } catch (error) {
    console.error("❌ Erro no middleware de autenticação:", error);
    return c.json({ error: "Erro ao validar autenticação" }, 500);
  }
}
