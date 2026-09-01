# Design Document

## Introduction

This document describes the architecture and detailed design for improving the AllNewsAPI MCP Server. The improvements span two deployment targets (stdio and remote Cloudflare Worker), shared tool logic, new API capabilities, and release automation.

## Architecture Overview

The system follows a monorepo-style structure with two entry points sharing common tool logic:

```
mcp-server/
├── src/
│   ├── index.ts          # Stdio transport entry point (existing, refactored)
│   ├── tools.ts          # Shared tool registration module (new)
│   └── types.ts          # Shared type definitions (new)
├── remote/
│   ├── src/
│   │   └── index.ts      # Cloudflare Worker entry point (new)
│   ├── wrangler.jsonc     # Wrangler configuration
│   ├── package.json       # Remote-specific dependencies
│   ├── tsconfig.json      # Remote TypeScript config
│   └── worker-configuration.d.ts  # Generated worker types
├── .github/
│   └── workflows/
│       └── release.yml    # Release-please automation
├── release-please-config.json
├── .release-please-manifest.json
├── package.json
├── tsconfig.json
└── README.md
```

### Key Design Decisions

1. **Separate projects, shared tool logic**: The stdio server and remote Cloudflare Worker are separate entry points with different SDK dependencies, but share tool definition logic via `src/tools.ts`.
2. **SDK divergence**: The stdio server uses `@modelcontextprotocol/sdk` (v1.x), while the remote uses `@modelcontextprotocol/server` (v2) + `agents` package for Cloudflare Workers.
3. **API key resolution**: The stdio transport uses CLI args or env vars; the remote transport uses query parameter `?apikey=` (authless pattern) or `Authorization: Bearer` header.
4. **Base URL update**: All requests target `https://api.allnewsapi.com` (no `/v1` prefix).

## Components

### 1. Shared Types Module (`src/types.ts`)

Defines TypeScript interfaces and constants shared across both transports.

```typescript
// src/types.ts

export const BASE_URL = 'https://api.allnewsapi.com';

export const SUPPORTED_COUNTRIES = [
  'AF', 'AL', 'DZ', /* ... full list ... */ 'ZM', 'ZW'
] as const;

export const SUPPORTED_CATEGORIES = [
  'adult', 'autos', 'beauty', 'business', 'communities', 'crime',
  'cryptocurrency', 'electronics', 'entertainment', 'finance', 'food',
  'games', 'health', 'hobbies', 'lifestyle', 'internet', 'jobs', 'law',
  'literature', 'pets', 'politics', 'realty', 'science', 'sensitive',
  'shopping', 'society', 'sports', 'technology', 'travel'
] as const;

export const SUPPORTED_REGIONS = [
  'africa', 'americas', 'antarctic', 'asia', 'europe', 'oceania'
] as const;

export const SUPPORTED_LANGUAGES = [
  'ar', 'zh', 'nl', 'en', 'fr', 'de', 'el', 'he', 'hi', 'it', 'ja',
  'ml', 'mr', 'no', 'pt', 'ro', 'ru', 'es', 'sv', 'ta', 'te', 'uk'
] as const;

export interface NewsArticle {
  title: string;
  description: string;
  content?: string;
  url: string;
  image?: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
  category?: string[];
  language?: string;
  country?: string;
  region?: string;
  lang?: string;
  authors?: string[];
  sentiment?: string;
  ai_sentiment?: string;
  ai_sentiment_scores?: {
    positive: number;
    negative: number;
    neutral: number;
  };
  ai_entities?: Array<{
    name: string;
    type: string;
  }>;
  ai_summary?: string;
}

export interface NewsApiResponse {
  currentPage: number;
  nextPage: number;
  status: string;
  totalArticles: number;
  articles: NewsArticle[];
}

export interface UsageApiResponse {
  plan: string;
  requestsUsed24Hours: number;
  requestsLimit24Hours: number;
  requestsRemaining24Hours: number;
  requestsUsed30Days: number;
}
```

### 2. Shared Tools Module (`src/tools.ts`)

Exports functions for building API URLs, formatting responses, and registering tools on any MCP server instance.

```typescript
// src/tools.ts
import { z } from 'zod';
import {
  BASE_URL,
  SUPPORTED_COUNTRIES,
  SUPPORTED_CATEGORIES,
  SUPPORTED_REGIONS,
  SUPPORTED_LANGUAGES,
  type NewsArticle,
  type NewsApiResponse,
  type UsageApiResponse,
} from './types.js';

// --- URL Building ---

export function buildSearchUrl(apiKey: string, params: Record<string, unknown>): string {
  const url = new URL(`${BASE_URL}/search`);
  url.searchParams.set('apikey', apiKey);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
    }
  }
  return url.toString();
}

export function buildHeadlinesUrl(apiKey: string, params: Record<string, unknown>): string {
  const url = new URL(`${BASE_URL}/headlines`);
  url.searchParams.set('apikey', apiKey);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
    }
  }
  return url.toString();
}

export function buildUsageUrl(apiKey: string): string {
  const url = new URL(`${BASE_URL}/usage`);
  url.searchParams.set('apikey', apiKey);
  return url.toString();
}

// --- Response Formatting ---

export function formatArticle(article: NewsArticle, index: number, isHeadline = false): string {
  const label = isHeadline ? 'Headline' : 'Article';
  const lines: string[] = [
    `${label} ${index + 1}:`,
    `Title: ${article.title}`,
    `Description: ${article.description}`,
  ];

  if (article.content) lines.push(`Content: ${article.content}`);
  lines.push(`URL: ${article.url}`);
  lines.push(`Published: ${article.publishedAt}`);
  lines.push(`Source: ${article.source.name} (${article.source.url})`);

  if (article.category) lines.push(`Category: ${article.category}`);
  if (article.region) lines.push(`Region: ${article.region}`);
  if (article.lang) lines.push(`Language: ${article.lang}`);
  if (article.authors && article.authors.length > 0) {
    lines.push(`Authors: ${article.authors.join(', ')}`);
  }
  if (article.ai_sentiment) lines.push(`AI Sentiment: ${article.ai_sentiment}`);
  if (article.ai_sentiment_scores) {
    lines.push(`AI Sentiment Scores: positive=${article.ai_sentiment_scores.positive}, negative=${article.ai_sentiment_scores.negative}, neutral=${article.ai_sentiment_scores.neutral}`);
  }
  if (article.ai_entities && article.ai_entities.length > 0) {
    const entities = article.ai_entities.map(e => `${e.name} (${e.type})`).join(', ');
    lines.push(`AI Entities: ${entities}`);
  }
  if (article.ai_summary) lines.push(`AI Summary: ${article.ai_summary}`);

  return lines.join('\n');
}

export function formatUsageResponse(usage: UsageApiResponse): string {
  return [
    `Plan: ${usage.plan}`,
    `Requests Used (24h): ${usage.requestsUsed24Hours}`,
    `Requests Limit (24h): ${usage.requestsLimit24Hours}`,
    `Requests Remaining (24h): ${usage.requestsRemaining24Hours}`,
    `Requests Used (30d): ${usage.requestsUsed30Days}`,
  ].join('\n');
}

// --- Zod Schemas (reusable across transports) ---

export const searchNewsSchema = z.object({
  q: z.string().optional().describe('Keywords to search for in news articles'),
  startDate: z.string().optional().describe('Filter articles published on or after this date (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('Filter articles published on or before this date (YYYY-MM-DD)'),
  content: z.boolean().optional().default(false).describe('Whether to retrieve full article content'),
  lang: z.string().optional().describe("Language code(s) of the articles (e.g., 'en', 'fr')"),
  country: z.string().optional().describe("Country code(s) of publication (e.g., 'us', 'gb')"),
  region: z.string().optional().describe("Region(s) to filter by (e.g., 'americas', 'europe')"),
  category: z.string().optional().describe("Category/categories to filter by (e.g., 'business', 'technology')"),
  max: z.number().optional().default(5).describe('Number of articles to return (1-100)'),
  attributes: z.string().optional().default('title,description').describe('Where to search for keywords (title, description, content)'),
  page: z.number().optional().default(1).describe('Page number for pagination'),
  sortby: z.string().optional().default('publishedAt').describe("Sort results by 'publishedAt' or 'relevance'"),
  publisher: z.string().optional().describe('Filter by specific publisher(s)'),
  ai_sentiment: z.string().optional().describe("Filter by AI-analyzed sentiment (e.g., 'positive', 'negative', 'neutral')"),
  ai_entity_name: z.string().optional().describe('Filter by entity name detected in articles'),
  ai_entity_type: z.string().optional().describe("Filter by entity type (e.g., 'person', 'organization', 'location')"),
});

export const headlinesSchema = z.object({
  country: z.string().optional().describe("Country code(s) of publication (e.g., 'us', 'gb')"),
  category: z.string().optional().describe("Category to filter by (e.g., 'business', 'technology')"),
  max: z.number().optional().default(5).describe('Number of articles to return (1-100)'),
  lang: z.string().optional().describe("Language code of the articles (e.g., 'en', 'fr')"),
  ai_sentiment: z.string().optional().describe("Filter by AI-analyzed sentiment (e.g., 'positive', 'negative', 'neutral')"),
  ai_entity_name: z.string().optional().describe('Filter by entity name detected in articles'),
  ai_entity_type: z.string().optional().describe("Filter by entity type (e.g., 'person', 'organization', 'location')"),
});
```

### 3. Stdio Transport (`src/index.ts`) — Refactored

The existing entry point is refactored to import shared logic from `src/tools.ts` and `src/types.ts`.

```typescript
// src/index.ts
#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  buildSearchUrl,
  buildHeadlinesUrl,
  buildUsageUrl,
  formatArticle,
  formatUsageResponse,
  searchNewsSchema,
  headlinesSchema,
} from './tools.js';
import type { NewsApiResponse, UsageApiResponse } from './types.js';

const server = new McpServer({
  name: 'allnewsapi',
  version: '1.0.0',
  capabilities: { resources: {}, tools: {} },
});

// Parse API key from CLI args or env
let apiKey: string | undefined;
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--apikey' && i + 1 < process.argv.length) {
    apiKey = process.argv[++i];
  }
}
if (!apiKey) apiKey = process.env.ALLNEWSAPI_KEY;

// Register tools using shared schemas and helpers
server.tool('search-news', searchNewsSchema.shape, async (params) => {
  if (!apiKey) throw new Error('API key not provided.');
  const url = buildSearchUrl(apiKey, params);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as NewsApiResponse;
  const formatted = data.articles.map((a, i) => formatArticle(a, i)).join('\n---\n');
  const summary = `Found ${data.totalArticles} articles. Showing ${data.articles.length} on page ${data.currentPage}.`;
  return { content: [{ type: 'text', text: `${summary}\n\n${formatted}` }] };
});

server.tool('headlines', headlinesSchema.shape, async (params) => {
  if (!apiKey) throw new Error('API key not provided.');
  const url = buildHeadlinesUrl(apiKey, params);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as NewsApiResponse;
  const formatted = data.articles.map((a, i) => formatArticle(a, i, true)).join('\n---\n');
  const summary = `Top Headlines: Showing ${data.articles.length} results`;
  return { content: [{ type: 'text', text: `${summary}\n\n${formatted}` }] };
});

server.tool('usage', {}, async () => {
  if (!apiKey) throw new Error('API key not provided.');
  const url = buildUsageUrl(apiKey);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Usage API request failed: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as UsageApiResponse;
  return { content: [{ type: 'text', text: formatUsageResponse(data) }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);

if (!apiKey) {
  console.error('Error: API key not provided.');
  console.error('Usage: allnewsapi --apikey YOUR_API_KEY');
  process.exit(1);
}
```

### 4. Remote Cloudflare Worker (`remote/src/index.ts`)

A separate project using the Cloudflare Workers MCP pattern.

```typescript
// remote/src/index.ts
import { McpServer } from '@modelcontextprotocol/server';
import { createMcpHandler } from 'agents/mcp/server';
import { z } from 'zod';

const BASE_URL = 'https://api.allnewsapi.com';

interface Env {
  // No bound env vars needed — API key comes from request
}

function extractApiKey(request: Request): string | null {
  // Priority 1: Authorization Bearer header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Priority 2: apikey query parameter
  const url = new URL(request.url);
  const apiKeyParam = url.searchParams.get('apikey');
  if (apiKeyParam) {
    return apiKeyParam;
  }

  return null;
}

function createServer(apiKey: string) {
  const server = new McpServer({ name: 'AllNewsAPI', version: '1.0.0' });

  server.registerTool('search-news', {
    inputSchema: z.object({
      q: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      content: z.boolean().optional().default(false),
      lang: z.string().optional(),
      country: z.string().optional(),
      region: z.string().optional(),
      category: z.string().optional(),
      max: z.number().optional().default(5),
      attributes: z.string().optional().default('title,description'),
      page: z.number().optional().default(1),
      sortby: z.string().optional().default('publishedAt'),
      publisher: z.string().optional(),
      ai_sentiment: z.string().optional(),
      ai_entity_name: z.string().optional(),
      ai_entity_type: z.string().optional(),
    }),
  }, async (params) => {
    const url = new URL(`${BASE_URL}/search`);
    url.searchParams.set('apikey', apiKey);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    // Format and return articles
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool('headlines', {
    inputSchema: z.object({
      country: z.string().optional(),
      category: z.string().optional(),
      max: z.number().optional().default(5),
      lang: z.string().optional(),
      ai_sentiment: z.string().optional(),
      ai_entity_name: z.string().optional(),
      ai_entity_type: z.string().optional(),
    }),
  }, async (params) => {
    const url = new URL(`${BASE_URL}/headlines`);
    url.searchParams.set('apikey', apiKey);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool('usage', { inputSchema: z.object({}) }, async () => {
    const url = new URL(`${BASE_URL}/usage`);
    url.searchParams.set('apikey', apiKey);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Usage API error: ${res.status}`);
    const data = await res.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  });

  return server;
}

const handler = createMcpHandler((request: Request) => {
  const apiKey = extractApiKey(request);
  if (!apiKey) {
    throw new Error('Authentication required. Provide apikey query parameter or Authorization Bearer header.');
  }
  return createServer(apiKey);
});

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return handler(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
```

### 5. Release Automation

#### `.github/workflows/release.yml`

```yaml
name: Release Please

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5.1.0

      - name: Generate GitHub App token
        id: app-token
        uses: actions/create-github-app-token@fee1f7d63c2ff003460e3d139729b119787bc349 # v2.2.2
        with:
          app-id: ${{ secrets.RELEASE_APP_ID }}
          private-key: ${{ secrets.RELEASE_APP_PRIVATE_KEY }}

      - uses: googleapis/release-please-action@5c625bfb5d1ff62eadeeb3772007f7f66fdcf071 # v4.4.1
        with:
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json
          token: ${{ steps.app-token.outputs.token }}
```

#### `release-please-config.json`

```json
{
  "packages": {
    ".": {
      "release-type": "node",
      "package-name": "allnewsapi-mcp-server"
    }
  }
}
```

#### `.release-please-manifest.json`

```json
{
  ".": "1.0.0"
}
```

## Data Models

### API Request Flow

```
┌──────────────┐     ┌─────────────┐     ┌──────────────────────┐
│  MCP Client  │────►│ Transport   │────►│  AllNewsAPI Backend   │
│  (LLM/IDE)   │     │ (stdio/HTTP)│     │ api.allnewsapi.com   │
└──────────────┘     └─────────────┘     └──────────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  tools.ts   │
                    │ (shared)    │
                    └─────────────┘
```

### API Key Resolution (Remote Transport)

| Priority | Source | Format |
|----------|--------|--------|
| 1 | `Authorization` header | `Bearer <token>` |
| 2 | `apikey` query parameter | `?apikey=<key>` |
| — | Neither present | Reject with 401 |

### API Key Resolution (Stdio Transport)

| Priority | Source | Format |
|----------|--------|--------|
| 1 | CLI argument | `--apikey <key>` |
| 2 | Environment variable | `ALLNEWSAPI_KEY=<key>` |
| — | Neither present | Exit with error |

## Interfaces

### Tool Registration Pattern

The shared `src/tools.ts` module exports:

| Export | Type | Purpose |
|--------|------|---------|
| `buildSearchUrl` | `(apiKey: string, params: Record<string, unknown>) => string` | Construct search API URL |
| `buildHeadlinesUrl` | `(apiKey: string, params: Record<string, unknown>) => string` | Construct headlines API URL |
| `buildUsageUrl` | `(apiKey: string) => string` | Construct usage API URL |
| `formatArticle` | `(article: NewsArticle, index: number, isHeadline?: boolean) => string` | Format single article |
| `formatUsageResponse` | `(usage: UsageApiResponse) => string` | Format usage data |
| `searchNewsSchema` | `z.ZodObject` | Zod schema for search parameters |
| `headlinesSchema` | `z.ZodObject` | Zod schema for headlines parameters |

### Remote Worker Configuration (`wrangler.jsonc`)

```jsonc
{
  "name": "allnewsapi-mcp",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-01",
  "compatibility_flags": ["nodejs_compat"]
}
```

## Error Handling

### API Key Missing

- **Stdio**: Log error to stderr, exit with code 1.
- **Remote**: Return MCP error response with message "Authentication required. Provide apikey query parameter or Authorization Bearer header."

### API Request Failures

- All tools catch fetch errors and HTTP non-2xx responses.
- Error messages include the HTTP status code and status text.
- The usage tool specifically returns a descriptive error message on failure (Req 6.8).

### Parameter Validation

- Zod schemas validate input parameters at the tool layer.
- Invalid parameters are rejected before the API call is made.
- Validation errors include the list of supported values.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: API key extraction priority

*For any* HTTP request to the remote transport that contains both an `Authorization: Bearer <token>` header and an `apikey` query parameter, the system SHALL use the Bearer token value as the API key (header takes priority over query param).

**Validates: Requirements 1.3, 1.4**

### Property 2: Missing credentials rejection

*For any* HTTP request to the remote transport that contains neither an `Authorization` header nor an `apikey` query parameter, the system SHALL reject the request with an authentication error and never forward a request to AllNewsAPI.

**Validates: Requirements 1.5**

### Property 3: AI parameter pass-through for search

*For any* combination of `ai_sentiment`, `ai_entity_name`, and `ai_entity_type` parameters provided to the search tool, each provided parameter SHALL appear as a query parameter in the outgoing API request URL to AllNewsAPI.

**Validates: Requirements 4.1, 4.2, 4.3, 4.7**

### Property 4: AI parameter pass-through for headlines

*For any* combination of `ai_sentiment`, `ai_entity_name`, and `ai_entity_type` parameters provided to the headlines tool, each provided parameter SHALL appear as a query parameter in the outgoing API request URL to AllNewsAPI.

**Validates: Requirements 4.4, 4.5, 4.6, 4.8**

### Property 5: Optional field inclusion in formatted output

*For any* article object returned by the API that contains optional enrichment fields (`region`, `lang`, `authors`, `ai_sentiment`, `ai_sentiment_scores`, `ai_entities`, `ai_summary`), the formatted article output string SHALL contain a representation of each present field's value.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7**

### Property 6: Usage response completeness

*For any* successful usage API response containing `plan`, `requestsUsed24Hours`, `requestsLimit24Hours`, `requestsRemaining24Hours`, and `requestsUsed30Days` fields, the formatted usage tool output SHALL include a representation of each field's value.

**Validates: Requirements 6.2, 6.3, 6.4, 6.5, 6.6**

### Property 7: URL construction correctness

*For any* set of non-empty search parameters, the constructed API URL SHALL have base `https://api.allnewsapi.com/search`, include the `apikey` parameter, and include every non-empty parameter as a query string key-value pair.

**Validates: Requirements 3.1, 3.2**

### Property 8: Headlines URL construction correctness

*For any* set of non-empty headlines parameters, the constructed API URL SHALL have base `https://api.allnewsapi.com/headlines`, include the `apikey` parameter, and include every non-empty parameter as a query string key-value pair.

**Validates: Requirements 3.1, 3.3**

### Property 9: Usage URL construction correctness

*For any* API key string, the constructed usage URL SHALL have base `https://api.allnewsapi.com/usage` and include the `apikey` parameter with the provided key value.

**Validates: Requirements 3.1, 3.4**
