import { betterAuth } from "better-auth";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

// Garante que o diretório data existe
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Cria instância do banco de dados SQLite
const dbPath = path.join(dataDir, "auth.db");
const db = new Database(dbPath);

/**
 * Configuração do Better Auth seguindo melhores práticas 2026:
 * - Session-based authentication (cookies) para segurança
 * - Cookie caching para performance
 * - Database sessions para controle completo (logout, revogação)
 * - Integrado ao backend existente (não serviço separado)
 */
export const auth = betterAuth({
  // Base URL do backend
  baseURL: process.env.BETTER_AUTH_BASE_URL || "http://localhost:4113",

  // Database configuration usando better-sqlite3
  database: db,

  // Email and Password authentication
  emailAndPassword: {
    enabled: true,
    // Desabilitado para MVP, habilitar em produção
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  // Session configuration
  session: {
    // Sessões duram 7 dias
    expiresIn: 60 * 60 * 24 * 7, // 7 dias em segundos
    // Atualiza sessão a cada 24h
    updateAge: 60 * 60 * 24, // 1 dia

    // Cookie caching: evita consultas frequentes ao DB
    // Armazena dados da sessão em cookie assinado de curta duração
    cookieCache: {
      enabled: true,
      // Cache dura 5 minutos
      maxAge: 60 * 5,
    },
  },

  // User model com campos customizados
  user: {
    additionalFields: {
      // Tipo de plano: free, premium
      planType: {
        type: "string",
        required: false,
        defaultValue: "free",
        input: true,
      },
      // URL do avatar do usuário
      avatarUrl: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },

  // Configuração avançada de segurança
  advanced: {
    // HttpOnly cookies (não acessível via JavaScript)
    useSecureCookies: process.env.NODE_ENV === "production",

    // Cookie options
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },

    // CORS: permitir frontend Next.js
    trustedOrigins: [
      "http://localhost:3000", // Desenvolvimento
      process.env.FRONTEND_URL || "", // Produção
    ].filter(Boolean),

    // CSRF Protection
    crossSubDomainCookies: {
      enabled: false,
    },
  },

  // Rate limiting (proteção contra brute force)
  rateLimit: {
    enabled: true,
    window: 60, // 1 minuto
    max: 10, // 10 tentativas por minuto
  },
});

// Export tipos para TypeScript
export type Auth = typeof auth;

// Helper para validar sessão (usado nas rotas protegidas)
export async function getSession(request: Request) {
  const sessionToken = getCookieFromRequest(request, "better-auth.session_token");

  if (!sessionToken) {
    return null;
  }

  // Valida sessão no banco de dados
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  return session;
}

// Helper para extrair cookie do request
function getCookieFromRequest(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const cookie = cookies.find((c) => c.startsWith(`${name}=`));

  return cookie ? cookie.split("=")[1] : null;
}
