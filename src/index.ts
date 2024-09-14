#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Define supported values from the AllNewsAPI
const SUPPORTED_COUNTRIES = [
  'AF', 'AL', 'DZ', 'AS', 'AD', 'AO', 'AI', 'AG', 'AR', 'AM', 'AU', 'AT', 'AZ', 'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ',
  'BJ', 'BM', 'BT', 'BO', 'BA', 'BW', 'BR', 'IO', 'VG', 'BN', 'BG', 'BF', 'BI', 'KH', 'CM', 'CA', 'CV', 'BQ', 'KY', 'CF',
  'TD', 'CL', 'CN', 'CX', 'CO', 'KM', 'CK', 'CR', 'HR', 'CU', 'CW', 'CY', 'CZ', 'CD', 'DK', 'DJ', 'DM', 'DO', 'EC', 'EG',
  'SV', 'GQ', 'ER', 'EE', 'SZ', 'ET', 'FK', 'FO', 'FJ', 'FI', 'FR', 'GF', 'PF', 'TF', 'GA', 'GM', 'GE', 'DE', 'GH', 'GI',
  'GR', 'GL', 'GD', 'GP', 'GU', 'GT', 'GG', 'GN', 'GW', 'GY', 'HT', 'HM', 'HN', 'HK', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ',
  'IE', 'IM', 'IL', 'IT', 'CI', 'JM', 'JP', 'JE', 'JO', 'KZ', 'KE', 'KI', 'XK', 'KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR',
  'LY', 'LI', 'LT', 'LU', 'MO', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MQ', 'MR', 'MU', 'YT', 'MX', 'FM', 'MD', 'MC',
  'MN', 'ME', 'MS', 'MA', 'MZ', 'MM', 'NA', 'NR', 'NP', 'NL', 'NC', 'NZ', 'NI', 'NE', 'NG', 'NU', 'NF', 'KP', 'MK', 'MP',
  'NO', 'OM', 'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PN', 'PL', 'PT', 'PR', 'QA', 'RO', 'RU', 'RW', 'RE', 'BL',
  'SH', 'KN', 'LC', 'MF', 'PM', 'VC', 'WS', 'SM', 'SA', 'SN', 'RS', 'SC', 'SL', 'SG', 'SX', 'SK', 'SI', 'SB', 'SO', 'ZA',
  'GS', 'KR', 'SS', 'ES', 'LK', 'SD', 'SR', 'SJ', 'SE', 'CH', 'SY', 'ST', 'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TK', 'TO',
  'TT', 'TN', 'TR', 'TM', 'TC', 'TV', 'UG', 'UA', 'AE', 'GB', 'US', 'UM', 'VI', 'UY', 'UZ', 'VU', 'VA', 'VE', 'VN', 'WF',
  'EH', 'YE', 'ZM', 'ZW'
];

const SUPPORTED_CATEGORIES = [
  'adult', 'autos', 'beauty', 'business', 'communities', 'crime', 'cryptocurrency', 'electronics', 'entertainment',
  'finance', 'food', 'games', 'health', 'hobbies', 'lifestyle', 'internet', 'jobs', 'law', 'literature', 'pets',
  'politics', 'realty', 'science', 'sensitive', 'shopping', 'society', 'sports', 'technology', 'travel'
];

const SUPPORTED_REGIONS = ['africa', 'americas', 'antarctic', 'asia', 'europe', 'oceania'];

const SUPPORTED_LANGUAGES = [
  'ar', 'zh', 'nl', 'en', 'fr', 'de', 'el', 'he', 'hi', 'it', 'ja', 'ml', 'mr', 'no', 'pt', 'ro', 'ru', 'es', 'sv',
  'ta', 'te', 'uk'
];

const BASE_URL = "https://api.freenewsapi.com/v1"

// Define types for the AllNewsAPI response
interface NewsArticle {
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
  sentiment?: string;
}

interface NewsApiResponse {
  currentPage: number;
  nextPage: number;
  status: string;
  totalArticles: number;
  articles: NewsArticle[];
}

// Create server instance
const server = new McpServer({
  name: "allnewsapi",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Parse command line arguments
let apiKey: string | undefined;

// Check if API key is provided as a command-line argument
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === '--apikey' && i + 1 < process.argv.length) {
    apiKey = process.argv[i + 1];
    i++; // Skip the next argument as it's the value
  }
}

// Fall back to environment variable if no API key is provided as an argument
if (!apiKey) {
  apiKey = process.env.ALLNEWSAPI_KEY;
}

// Helper function to build the API URL with parameters
function buildApiUrl(params: Record<string, any>): string {
  if (!apiKey) {
    throw new Error("API key not provided. Please provide it via --apikey argument or ALLNEWSAPI_KEY environment variable");
  }
  
  const baseUrl = `${BASE_URL}/search`;
  const urlParams = new URLSearchParams();
  
  // Add API key
  urlParams.append("apikey", apiKey);
  
  // Add other parameters
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        urlParams.append(key, value.join(","));
      } else {
        urlParams.append(key, String(value));
      }
    }
  }
  
  return `${baseUrl}?${urlParams.toString()}`;
}

// Helper function to build the headlines API URL with parameters
function buildHeadlinesApiUrl(params: Record<string, any>): string {
  if (!apiKey) {
    throw new Error("API key not provided. Please provide it via --apikey argument or ALLNEWSAPI_KEY environment variable");
  }
  
  const baseUrl = `${BASE_URL}/headlines`;
  const urlParams = new URLSearchParams();
  
  // Add API key
  urlParams.append("apikey", apiKey);
  
  // Add other parameters
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        urlParams.append(key, value.join(","));
      } else {
        urlParams.append(key, String(value));
      }
    }
  }
  
  return `${baseUrl}?${urlParams.toString()}`;
}

// Helper function to fetch news data
async function fetchNews(params: Record<string, any>): Promise<NewsApiResponse> {
  try {
    const url = buildApiUrl(params);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }
    
    return await response.json() as NewsApiResponse;
  } catch (error) {
    console.error("Error fetching news:", error);
    throw error;
  }
}

// Helper function to fetch headlines data
async function fetchHeadlines(params: Record<string, any>): Promise<NewsApiResponse> {
  try {
    const url = buildHeadlinesApiUrl(params);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }
    
    return await response.json() as NewsApiResponse;
  } catch (error) {
    console.error("Error fetching headlines:", error);
    throw error;
  }
}

// Add a tool for searching news articles
server.tool(
  "search-news",
  {
    q: z.string().optional().describe("Keywords to search for in news articles"),
    startDate: z.string().optional().describe("Filter articles published on or after this date (YYYY-MM-DD)"),
    endDate: z.string().optional().describe("Filter articles published on or before this date (YYYY-MM-DD)"),
    content: z.boolean().optional().default(false).describe("Whether to retrieve full article content"),
    lang: z.string().optional()
      .refine(
        val => !val || val.split(',').every(code => SUPPORTED_LANGUAGES.includes(code.trim())),
        val => ({ message: `Invalid language code(s). Supported codes: ${SUPPORTED_LANGUAGES.join(', ')}` })
      )
      .describe("Language code(s) of the articles (e.g., 'en', 'fr')"),
    country: z.string().optional()
      .refine(
        val => !val || val.split(',').every(code => SUPPORTED_COUNTRIES.includes(code.trim().toUpperCase())),
        val => ({ message: `Invalid country code(s). Please use valid ISO country codes.` })
      )
      .describe("Country code(s) of publication (e.g., 'us', 'gb')"),
    region: z.string().optional()
      .refine(
        val => !val || val.split(',').every(region => SUPPORTED_REGIONS.includes(region.trim().toLowerCase())),
        val => ({ message: `Invalid region(s). Supported regions: ${SUPPORTED_REGIONS.join(', ')}` })
      )
      .describe("Region(s) to filter by (e.g., 'americas', 'europe')"),
    category: z.string().optional()
      .refine(
        val => !val || val.split(',').every(cat => SUPPORTED_CATEGORIES.includes(cat.trim().toLowerCase())),
        val => ({ message: `Invalid category/categories. Supported categories: ${SUPPORTED_CATEGORIES.join(', ')}` })
      )
      .describe("Category/categories to filter by (e.g., 'business', 'technology')"),
    max: z.number().optional().default(5).describe("Number of articles to return (1-100)"),
    attributes: z.string().optional().default("title,description").describe("Where to search for keywords (title, description, content)"),
    page: z.number().optional().default(1).describe("Page number for pagination"),
    sortby: z.string().optional().default("publishedAt").describe("Sort results by 'publishedAt' or 'relevance'"),
    publisher: z.string().optional().describe("Filter by specific publisher(s)"),
  },
  async (params) => {
    try {
      const newsData = await fetchNews(params);
      
      // Format the response in a readable way
      const formattedArticles = newsData.articles.map((article, index) => {
        return `
Article ${index + 1}:
Title: ${article.title}
Description: ${article.description}
${article.content ? `Content: ${article.content}\n` : ""}URL: ${article.url}
Published: ${article.publishedAt}
Source: ${article.source.name} (${article.source.url})
${article.category ? `Category: ${article.category}\n` : ""}${article.language ? `Language: ${article.language}\n` : ""}${article.country ? `Country: ${article.country}\n` : ""}
`;
      }).join("\n---\n");
      
      const summary = `Found ${newsData.totalArticles} articles. Showing ${newsData.articles.length} results on Page ${newsData.currentPage}. Next Page is
       ${newsData.nextPage}`;
      
      return {
        content: [{
          type: "text",
          text: `${summary}\n\n${formattedArticles}`
        }]
      };
    } catch (error) {
        throw new Error(`Error fetching news: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

// Add a tool for getting headlines
server.tool(
  "headlines",
  {
    country: z.string().optional()
      .refine(
        val => !val || val.split(',').every(code => SUPPORTED_COUNTRIES.includes(code.trim().toUpperCase())),
        val => ({ message: `Invalid country code(s). Please use valid ISO country codes.` })
      )
      .describe("Country code(s) of publication (e.g., 'us', 'gb')"),
    category: z.string().optional()
      .refine(
        val => !val || val.split(',').every(cat => SUPPORTED_CATEGORIES.includes(cat.trim().toLowerCase())),
        val => ({ message: `Invalid category/categories. Supported categories: ${SUPPORTED_CATEGORIES.join(', ')}` })
      )
      .describe("Category to filter by (e.g., 'business', 'technology')"),
    max: z.number().optional().default(5).describe("Number of articles to return (1-100)"),
    lang: z.string().optional()
      .refine(
        val => !val || val.split(',').every(code => SUPPORTED_LANGUAGES.includes(code.trim())),
        val => ({ message: `Invalid language code(s). Supported codes: ${SUPPORTED_LANGUAGES.join(', ')}` })
      )
      .describe("Language code of the articles (e.g., 'en', 'fr')"),
  },
  async (params) => {
    try {
      // Use the dedicated headlines endpoint
      const newsData = await fetchHeadlines(params);
      
      // Format the response in a readable way
      const formattedArticles = newsData.articles.map((article, index) => {
        return `
Headline ${index + 1}:
Title: ${article.title}
Description: ${article.description}
URL: ${article.url}
Published: ${article.publishedAt}
Source: ${article.source.name}
`;
      }).join("\n---\n");
      
      const summary = `Top Headlines: Showing ${newsData.articles.length} results`;
      
      return {
        content: [{
          type: "text",
          text: `${summary}\n\n${formattedArticles}`
        }]
      };
    } catch (error) {
       throw new Error(`Error fetching top headlines: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

// Start the server with stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);

console.error("AllNewsAPI MCP Server started");

// Print usage information if no API key is provided
if (!apiKey) {
  console.error("\nError: API key not provided");
  console.error("\nUsage:");
  console.error("  allnewsapi --apikey YOUR_API_KEY");
  console.error("\nAlternatively, you can set the ALLNEWSAPI_KEY environment variable.");
  process.exit(1);
}
