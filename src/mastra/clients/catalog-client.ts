/**
 * CatalogClient - Cliente HTTP para comunicação com a Food Catalog API
 *
 * Implementado com programação funcional:
 * - Funções puras
 * - Composição de funções
 * - Imutabilidade
 * - Sem classes
 */

import { env } from '../config/env';

// ============================================
// TIPOS
// ============================================

export interface SearchFilters {
  category?: string;
  min_protein?: number;
  max_calories?: number;
  source?: 'usda' | 'taco' | 'custom';
  verified_only?: boolean;
}

export interface SearchFoodsRequest {
  query: string;
  limit?: number;
  filters?: SearchFilters;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string | null;
  serving_size_g: number;
  serving_unit: string | null;
  calorie_per_100g: number;
  source: string;
  is_verified: boolean;
  protein_g_100g: number | null;
  carbs_g_100g: number | null;
  fat_g_100g: number | null;
}

export interface SearchFoodsResponse {
  success: boolean;
  foods: FoodItem[];
  count: number;
}

export interface NutritionItem {
  food_id: string;
  quantity: number;
}

export interface NutritionTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  saturated_fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  calcium_mg: number;
  iron_mg: number;
  vitamin_c_mg: number;
}

export interface NutritionDetail {
  food_id: string;
  food_name: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface CalculateNutritionResponse {
  success: boolean;
  total: NutritionTotals;
  details: NutritionDetail[];
}

export interface SimilarFoodRequest {
  food_id: string;
  limit?: number;
  same_category?: boolean;
  tolerance?: number;
}

export interface SimilarFoodItem {
  id: string;
  name: string;
  category: string | null;
  calorie_per_100g: number | null;
  protein_g_100g: number | null;
  carbs_g_100g: number | null;
  fat_g_100g: number | null;
  fiber_g_100g: number | null;
  similarity_score: number;
  source: string;
  is_verified: boolean;
}

export interface SimilarFoodsResponse {
  success: boolean;
  reference_food: FoodItem;
  similar_foods: SimilarFoodItem[];
  count: number;
}

export interface ClientConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  isRetryable: boolean;
}

// ============================================
// CONFIGURAÇÃO
// ============================================

/**
 * Cria configuração do client com valores default
 */
export const createConfig = (overrides?: Partial<ClientConfig>): ClientConfig => ({
  baseUrl: env.CATALOG_API_URL,
  timeout: env.CATALOG_API_TIMEOUT,
  maxRetries: env.CATALOG_API_RETRY_ATTEMPTS,
  retryDelay: env.CATALOG_API_RETRY_DELAY,
  ...overrides,
});

/**
 * Configuração padrão
 */
export const defaultConfig = createConfig();

// ============================================
// HELPERS PUROS
// ============================================

/**
 * Verifica se status HTTP é retryable
 */
const isRetryableStatus = (status: number): boolean =>
  [429, 500, 502, 503, 504].includes(status);

/**
 * Verifica se erro é retryable
 */
const isRetryableError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;

  const retryablePatterns = [
    'AbortError',
    'TimeoutError',
    'fetch failed',
    'network',
    'ECONNREFUSED',
  ];

  return retryablePatterns.some(
    pattern =>
      error.name.includes(pattern) || error.message.includes(pattern)
  );
};

/**
 * Cria erro de API padronizado
 */
const createApiError = (
  message: string,
  statusCode?: number,
  isRetryable = false
): ApiError => ({
  message,
  statusCode,
  isRetryable,
});

/**
 * Delay assíncrono
 */
const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calcula delay com exponential backoff
 */
const calculateBackoff = (attempt: number, baseDelay: number): number =>
  baseDelay * Math.pow(2, attempt - 1);

// ============================================
// FUNÇÕES DE REQUEST
// ============================================

/**
 * Executa uma única tentativa de request
 */
const executeRequest = async <T>(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<{ success: true; data: T } | { success: false; error: ApiError }> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        success: false,
        error: createApiError(
          `API retornou status ${response.status}: ${errorBody}`,
          response.status,
          isRetryableStatus(response.status)
        ),
      };
    }

    const data = (await response.json()) as T;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: createApiError(
        error instanceof Error ? error.message : 'Erro desconhecido',
        undefined,
        isRetryableError(error)
      ),
    };
  }
};

/**
 * Executa request com retry automático (recursivo)
 */
const executeWithRetry = async <T>(
  url: string,
  options: RequestInit,
  config: ClientConfig,
  attempt = 1
): Promise<T> => {
  const result = await executeRequest<T>(url, options, config.timeout);

  if (result.success) {
    return result.data;
  }

  const { error } = result;
  const isLastAttempt = attempt >= config.maxRetries;

  console.warn(
    `⚠️ [CatalogClient] Tentativa ${attempt}/${config.maxRetries} falhou:`,
    error.message
  );

  if (isLastAttempt || !error.isRetryable) {
    throw new Error(
      `Falha ao conectar com Catalog API após ${attempt} tentativa(s): ${error.message}`
    );
  }

  const delay = calculateBackoff(attempt, config.retryDelay);
  console.log(`⏳ [CatalogClient] Aguardando ${delay}ms antes de retry...`);
  await sleep(delay);

  // Recursão para próxima tentativa
  return executeWithRetry(url, options, config, attempt + 1);
};

/**
 * Faz request POST para a API
 */
const postRequest = <T>(
  endpoint: string,
  body: unknown,
  config: ClientConfig
): Promise<T> => {
  const url = `${config.baseUrl}${endpoint}`;

  return executeWithRetry<T>(
    url,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    config
  );
};

// ============================================
// API PÚBLICA - Funções principais
// ============================================

/**
 * Busca alimentos no catálogo
 *
 * @example
 * const result = await searchFoods({ query: 'frango', limit: 5 });
 */
export const searchFoods = async (
  request: SearchFoodsRequest,
  config = defaultConfig
): Promise<SearchFoodsResponse> => {
  console.log(`🔍 [CatalogClient] Buscando alimentos: "${request.query}"`);

  const response = await postRequest<SearchFoodsResponse>(
    '/api/v1/foods/search',
    {
      query: request.query,
      limit: request.limit ?? 10,
      filters: request.filters ?? {},
    },
    config
  );

  console.log(`✅ [CatalogClient] Encontrados ${response.count} alimentos`);

  return response;
};

/**
 * Calcula valores nutricionais totais
 *
 * @example
 * const result = await calculateNutrition([
 *   { food_id: 'uuid-1', quantity: 100 },
 *   { food_id: 'uuid-2', quantity: 150 },
 * ]);
 */
export const calculateNutrition = async (
  foods: NutritionItem[],
  config = defaultConfig
): Promise<CalculateNutritionResponse> => {
  console.log(
    `🧮 [CatalogClient] Calculando nutrição para ${foods.length} alimentos`
  );

  const response = await postRequest<CalculateNutritionResponse>(
    '/api/v1/nutrition/calculate',
    { foods },
    config
  );

  console.log(
    `✅ [CatalogClient] Total calculado: ${response.total.calories} kcal`
  );

  return response;
};

/**
 * Busca alimentos com perfil nutricional similar
 *
 * @example
 * const result = await findSimilarFoods({
 *   food_id: 'uuid-here',
 *   limit: 10,
 *   same_category: false,
 *   tolerance: 0.3,
 * });
 */
export const findSimilarFoods = async (
  request: SimilarFoodRequest,
  config = defaultConfig
): Promise<SimilarFoodsResponse> => {
  console.log(
    `🔄 [CatalogClient] Buscando alimentos similares para: "${request.food_id}"`
  );

  const response = await postRequest<SimilarFoodsResponse>(
    '/api/v1/foods/similar',
    {
      food_id: request.food_id,
      limit: request.limit ?? 10,
      same_category: request.same_category ?? false,
      tolerance: request.tolerance ?? 0.3,
    },
    config
  );

  console.log(
    `✅ [CatalogClient] Encontrados ${response.count} alimentos similares`
  );

  return response;
};

/**
 * Verifica se a API está disponível
 */
export const healthCheck = async (config = defaultConfig): Promise<boolean> => {
  try {
    const response = await fetch(`${config.baseUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(config.timeout),
    });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Cria funções do client com configuração customizada
 * (currying para injeção de dependência)
 *
 * @example
 * const client = createClient({ baseUrl: 'http://api.example.com' });
 * const result = await client.searchFoods({ query: 'banana' });
 */
export const createClient = (customConfig?: Partial<ClientConfig>) => {
  const config = createConfig(customConfig);

  return {
    searchFoods: (request: SearchFoodsRequest) => searchFoods(request, config),
    calculateNutrition: (foods: NutritionItem[]) => calculateNutrition(foods, config),
    findSimilarFoods: (request: SimilarFoodRequest) => findSimilarFoods(request, config),
    healthCheck: () => healthCheck(config),
    config,
  };
};
