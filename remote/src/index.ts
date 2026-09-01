import { McpServer } from '@modelcontextprotocol/server';
import { createMcpHandler } from 'agents/mcp/server';
import { z } from 'zod';

const BASE_URL = 'https://api.allnewsapi.com';
const VERSION = '1.0.0';
const MCP_ROUTE = '/mcp';

type Env = Record<string, never>;

function getHeaders(): Record<string, string> {
  return {
    'User-Agent': `allnewsapi-mcp/${VERSION}`,
    'X-MCP-Transport': 'remote',
  };
}

/**
 * Extract the AllNewsAPI key from an incoming request.
 * Priority: Authorization Bearer header, then `apikey` query parameter.
 * Returns null when neither is present.
 */
export function extractApiKey(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim() || null;
  }

  const apiKeyParam = new URL(request.url).searchParams.get('apikey');
  if (apiKeyParam) {
    return apiKeyParam;
  }

  return null;
}

/**
 * Build a descriptive error from a failed AllNewsAPI response, surfacing the
 * upstream error body (e.g. plan-limit details) when present. AllNewsAPI returns
 * `{ detail: { message } }`, `{ detail: "..." }`, or `{ message }`.
 */
async function readApiError(response: Response): Promise<string> {
  const base = `AllNewsAPI request failed with status ${response.status} ${response.statusText}`.trim();
  let detail = '';
  try {
    const text = await response.text();
    if (text) {
      try {
        const json = JSON.parse(text) as {
          detail?: string | { message?: string };
          message?: string;
        };
        if (typeof json.detail === 'string') {
          detail = json.detail;
        } else if (json.detail && typeof json.detail.message === 'string') {
          detail = json.detail.message;
        } else if (typeof json.message === 'string') {
          detail = json.message;
        } else {
          detail = text;
        }
      } catch {
        detail = text;
      }
    }
  } catch {
    // Body unreadable — fall back to the status line.
  }
  return detail ? `${base}: ${detail}` : base;
}

async function fetchJson(url: URL): Promise<unknown> {
  const res = await fetch(url.toString(), { headers: getHeaders() });
  if (!res.ok) {
    throw new Error(await readApiError(res));
  }
  return res.json();
}

function buildUrl(path: string, apiKey: string, params: Record<string, unknown> = {}): URL {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('apikey', apiKey);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
    }
  }
  return url;
}

function createServer(apiKey: string): McpServer {
  const server = new McpServer({ name: 'AllNewsAPI', version: VERSION });

  server.registerTool(
    'search-news',
    {
      title: 'Search News',
      description:
        'Search for news articles using various parameters including keywords, date ranges, and filters',
      inputSchema: {
        q: z.string().optional().describe('Keywords to search for in news articles'),
        startDate: z
          .string()
          .optional()
          .describe('Filter articles published on or after this date (YYYY-MM-DD)'),
        endDate: z
          .string()
          .optional()
          .describe('Filter articles published on or before this date (YYYY-MM-DD)'),
        content: z
          .boolean()
          .optional()
          .default(false)
          .describe('Whether to retrieve full article content'),
        lang: z.string().optional().describe("Language code(s) of the articles (e.g., 'en', 'fr')"),
        country: z
          .string()
          .optional()
          .describe("Country code(s) of publication (e.g., 'us', 'gb')"),
        region: z
          .string()
          .optional()
          .describe("Region(s) to filter by (e.g., 'americas', 'europe')"),
        category: z
          .string()
          .optional()
          .describe("Category/categories to filter by (e.g., 'business', 'technology')"),
        max: z.number().optional().default(5).describe('Number of articles to return (1-100)'),
        attributes: z
          .string()
          .optional()
          .describe(
            'Where to search for keywords: title, description, content (paid plans only; omitted by default)',
          ),
        page: z.number().optional().default(1).describe('Page number for pagination'),
        sortby: z
          .string()
          .optional()
          .describe(
            "Sort results by 'publishedAt' or 'relevance' (paid plans only; omitted by default)",
          ),
        publisher: z.string().optional().describe('Filter by specific publisher(s)'),
        ai_sentiment: z
          .string()
          .optional()
          .describe("Filter by AI-analyzed sentiment (e.g., 'positive', 'negative', 'neutral')"),
        ai_entity_name: z
          .string()
          .optional()
          .describe('Filter by entity name detected in articles'),
        ai_entity_type: z
          .string()
          .optional()
          .describe("Filter by entity type (e.g., 'person', 'organization', 'location')"),
      },
      annotations: { readOnlyHint: true },
    },
    async (params) => {
      const data = await fetchJson(buildUrl('/search', apiKey, params));
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.registerTool(
    'headlines',
    {
      title: 'Get Headlines',
      description: 'Get top headlines with optional filtering by country, category, and language',
      inputSchema: {
        country: z
          .string()
          .optional()
          .describe("Country code(s) of publication (e.g., 'us', 'gb')"),
        category: z
          .string()
          .optional()
          .describe("Category to filter by (e.g., 'business', 'technology')"),
        max: z.number().optional().default(5).describe('Number of articles to return (1-100)'),
        lang: z.string().optional().describe("Language code of the articles (e.g., 'en', 'fr')"),
        ai_sentiment: z
          .string()
          .optional()
          .describe("Filter by AI-analyzed sentiment (e.g., 'positive', 'negative', 'neutral')"),
        ai_entity_name: z
          .string()
          .optional()
          .describe('Filter by entity name detected in articles'),
        ai_entity_type: z
          .string()
          .optional()
          .describe("Filter by entity type (e.g., 'person', 'organization', 'location')"),
      },
      annotations: { readOnlyHint: true },
    },
    async (params) => {
      const data = await fetchJson(buildUrl('/headlines', apiKey, params));
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.registerTool(
    'usage',
    {
      title: 'API Usage',
      description: 'Check your current API plan, usage limits, and remaining quota',
      annotations: { readOnlyHint: true },
    },
    async () => {
      const data = await fetchJson(buildUrl('/usage', apiKey));
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  return server;
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Response | Promise<Response> {
    const apiKey = extractApiKey(request);
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            'Authentication required. Provide your AllNewsAPI key via an Authorization Bearer header or an apikey query parameter.',
        }),
        { status: 401, headers: { 'content-type': 'application/json' } },
      );
    }

    return createMcpHandler(() => createServer(apiKey), { route: MCP_ROUTE })(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
