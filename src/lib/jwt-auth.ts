import { jwtVerify, createRemoteJWKSet, type JWTPayload } from 'jose';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const JWKS_URL = `${FRONTEND_URL}/api/auth/jwks`;

const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

export interface NutriaJwtPayload extends JWTPayload {
  sub: string;
  email: string;
  name?: string;
}

/**
 * Verifica e decodifica um JWT usando as chaves públicas do JWKS do frontend.
 * A chave privada nunca sai do Next.js — aqui só validamos a assinatura.
 */
export async function verifyJwt(token: string): Promise<NutriaJwtPayload> {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: FRONTEND_URL,
    audience: 'nutria',
  });

  if (!payload.sub) {
    throw new Error('JWT missing sub claim');
  }

  return payload as NutriaJwtPayload;
}

/**
 * Extrai o Bearer token do header Authorization.
 * Retorna null se o header não existir ou não for Bearer.
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
