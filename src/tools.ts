import { z } from 'zod';
import { BASE_URL, type NewsArticle, type UsageApiResponse } from './types.js';

// --- Identifier Headers for API Tracking ---

let _version = '1.0.0';
let _transport = 'stdio';

export function setClientInfo(version: string, transport: 'stdio' | 'remote'): void {
  _version = version;
  _transport = transport;
}

function getHeaders(): Record<string, string> {
  return {
    'User-Agent': `allnewsapi-mcp/${_version}`,
    'X-MCP-Transport': _transport,
  };
}

// --- API Fetch Helper ---

export async function apiFetch(url: string): Promise<Response> {
  return fetch(url, { headers: getHeaders() });
}

/**
 * Build a descriptive error message from a failed AllNewsAPI response,
 * surfacing the upstream error body (e.g. plan-limit details) when present.
 * AllNewsAPI returns errors as `{ detail: { message } }`, `{ detail: "..." }`,
 * or `{ message }`; falls back to the raw body, then to the status line.
 */
export async function readApiError(response: Response): Promise<string> {
  const base =
    `AllNewsAPI request failed with status ${response.status} ${response.statusText}`.trim();
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
    // Body already consumed or unreadable — fall back to the status line.
  }
  return detail ? `${base}: ${detail}` : base;
}

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
    lines.push(
      `AI Sentiment Scores: positive=${article.ai_sentiment_scores.positive}, negative=${article.ai_sentiment_scores.negative}, neutral=${article.ai_sentiment_scores.neutral}`,
    );
  }
  if (article.ai_entities && article.ai_entities.length > 0) {
    const entities = article.ai_entities.map((e) => `${e.name} (${e.type})`).join(', ');
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

// --- Zod Schemas ---

export const searchNewsSchema = z.object({
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
  country: z.string().optional().describe("Country code(s) of publication (e.g., 'us', 'gb')"),
  region: z.string().optional().describe("Region(s) to filter by (e.g., 'americas', 'europe')"),
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
    .describe("Sort results by 'publishedAt' or 'relevance' (paid plans only; omitted by default)"),
  publisher: z.string().optional().describe('Filter by specific publisher(s)'),
  ai_sentiment: z
    .string()
    .optional()
    .describe("Filter by AI-analyzed sentiment (e.g., 'positive', 'negative', 'neutral')"),
  ai_entity_name: z.string().optional().describe('Filter by entity name detected in articles'),
  ai_entity_type: z
    .string()
    .optional()
    .describe("Filter by entity type (e.g., 'person', 'organization', 'location')"),
});

export const headlinesSchema = z.object({
  country: z.string().optional().describe("Country code(s) of publication (e.g., 'us', 'gb')"),
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
  ai_entity_name: z.string().optional().describe('Filter by entity name detected in articles'),
  ai_entity_type: z
    .string()
    .optional()
    .describe("Filter by entity type (e.g., 'person', 'organization', 'location')"),
});
