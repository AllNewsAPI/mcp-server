#!/usr/bin/env node
import { createRequire } from 'node:module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  apiFetch,
  buildSearchUrl,
  buildHeadlinesUrl,
  buildUsageUrl,
  formatArticle,
  formatUsageResponse,
  readApiError,
  searchNewsSchema,
  headlinesSchema,
  setClientInfo,
} from './tools.js';
import type { NewsApiResponse, UsageApiResponse } from './types.js';

// Read version from package.json at runtime
const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

// Configure identifier headers for API tracking
setClientInfo(version, 'stdio');

// Create server instance
const server = new McpServer({
  name: 'allnewsapi',
  version,
});

// Parse command line arguments for API key
let apiKey: string | undefined;

for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === '--apikey' && i + 1 < process.argv.length) {
    apiKey = process.argv[i + 1];
    i++;
  }
}

// Fall back to environment variable
if (!apiKey) {
  apiKey = process.env.ALLNEWSAPI_KEY;
}

// Register search-news tool
server.registerTool(
  'search-news',
  {
    title: 'Search News',
    description:
      'Search for news articles using various parameters including keywords, date ranges, and filters',
    inputSchema: searchNewsSchema.shape,
    annotations: { readOnlyHint: true },
  },
  async (params) => {
    if (!apiKey) {
      throw new Error(
        'API key not provided. Please provide it via --apikey argument or ALLNEWSAPI_KEY environment variable',
      );
    }

    const url = buildSearchUrl(apiKey, params);
    const response = await apiFetch(url);

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const data = (await response.json()) as NewsApiResponse;
    const formatted = data.articles.map((a, i) => formatArticle(a, i)).join('\n---\n');
    const summary = `Found ${data.totalArticles} articles. Showing ${data.articles.length} results on Page ${data.currentPage}.`;

    return {
      content: [{ type: 'text', text: `${summary}\n\n${formatted}` }],
    };
  },
);

// Register headlines tool
server.registerTool(
  'headlines',
  {
    title: 'Get Headlines',
    description: 'Get top headlines with optional filtering by country, category, and language',
    inputSchema: headlinesSchema.shape,
    annotations: { readOnlyHint: true },
  },
  async (params) => {
    if (!apiKey) {
      throw new Error(
        'API key not provided. Please provide it via --apikey argument or ALLNEWSAPI_KEY environment variable',
      );
    }

    const url = buildHeadlinesUrl(apiKey, params);
    const response = await apiFetch(url);

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const data = (await response.json()) as NewsApiResponse;
    const formatted = data.articles.map((a, i) => formatArticle(a, i, true)).join('\n---\n');
    const summary = `Top Headlines: Showing ${data.articles.length} results`;

    return {
      content: [{ type: 'text', text: `${summary}\n\n${formatted}` }],
    };
  },
);

// Register usage tool
server.registerTool(
  'usage',
  {
    title: 'API Usage',
    description: 'Check your current API plan, usage limits, and remaining quota',
    annotations: { readOnlyHint: true },
  },
  async () => {
    if (!apiKey) {
      throw new Error(
        'API key not provided. Please provide it via --apikey argument or ALLNEWSAPI_KEY environment variable',
      );
    }

    const url = buildUsageUrl(apiKey);
    const response = await apiFetch(url);

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const data = (await response.json()) as UsageApiResponse;

    return {
      content: [{ type: 'text', text: formatUsageResponse(data) }],
    };
  },
);

// Start the server with stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);

console.error('AllNewsAPI MCP Server started');

// Print usage information if no API key is provided
if (!apiKey) {
  console.error('\nError: API key not provided');
  console.error('\nUsage:');
  console.error('  allnewsapi-mcp --apikey YOUR_API_KEY');
  console.error('\nAlternatively, you can set the ALLNEWSAPI_KEY environment variable.');
  process.exit(1);
}
