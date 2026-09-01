# Implementation Plan: MCP Server Improvements

## Overview

Refactor the AllNewsAPI MCP Server into a shared-module architecture supporting both stdio and remote Cloudflare Worker transports, add new AI query parameters and response fields, implement a usage tool, update documentation, and add release automation.

## Tasks

- [x] 1. Create shared types module
  - [x] 1.1 Create `src/types.ts` with constants and interfaces
    - Define `BASE_URL` constant as `https://api.allnewsapi.com`
    - Export `SUPPORTED_COUNTRIES`, `SUPPORTED_CATEGORIES`, `SUPPORTED_REGIONS`, `SUPPORTED_LANGUAGES` arrays
    - Define `NewsArticle` interface with all fields including `region`, `lang`, `authors`, `ai_sentiment`, `ai_sentiment_scores`, `ai_entities`, `ai_summary`
    - Define `NewsApiResponse` and `UsageApiResponse` interfaces
    - _Requirements: 3.1, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 2. Create shared tools module
  - [x] 2.1 Create `src/tools.ts` with URL building functions
    - Implement `buildSearchUrl(apiKey, params)` targeting `https://api.allnewsapi.com/search`
    - Implement `buildHeadlinesUrl(apiKey, params)` targeting `https://api.allnewsapi.com/headlines`
    - Implement `buildUsageUrl(apiKey)` targeting `https://api.allnewsapi.com/usage`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 2.2 Add response formatting functions to `src/tools.ts`
    - Implement `formatArticle(article, index, isHeadline?)` including all optional fields (region, lang, authors, ai_sentiment, ai_sentiment_scores, ai_entities, ai_summary)
    - Implement `formatUsageResponse(usage)` returning plan, requestsUsed24Hours, requestsLimit24Hours, requestsRemaining24Hours, requestsUsed30Days
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 2.3 Add Zod schemas to `src/tools.ts`
    - Define `searchNewsSchema` with existing params plus `ai_sentiment`, `ai_entity_name`, `ai_entity_type`
    - Define `headlinesSchema` with existing params plus `ai_sentiment`, `ai_entity_name`, `ai_entity_type`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 2.4 Write property tests for URL construction functions
    - **Property 7: URL construction correctness** — verify search URL base is `https://api.allnewsapi.com/search`, includes apikey, and includes all non-empty params
    - **Property 8: Headlines URL construction correctness** — verify headlines URL base is `https://api.allnewsapi.com/headlines`, includes apikey, and includes all non-empty params
    - **Property 9: Usage URL construction correctness** — verify usage URL base is `https://api.allnewsapi.com/usage` and includes apikey
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

  - [x] 2.5 Write property tests for AI parameter pass-through
    - **Property 3: AI parameter pass-through for search** — verify ai_sentiment, ai_entity_name, ai_entity_type appear in outgoing URL
    - **Property 4: AI parameter pass-through for headlines** — verify ai_sentiment, ai_entity_name, ai_entity_type appear in outgoing URL
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8**

  - [x] 2.6 Write property tests for response formatting
    - **Property 5: Optional field inclusion in formatted output** — verify all present optional fields appear in formatted string
    - **Property 6: Usage response completeness** — verify all usage fields appear in formatted output
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.2, 6.3, 6.4, 6.5, 6.6**

- [x] 3. Refactor stdio transport entry point
  - [x] 3.1 Refactor `src/index.ts` to use shared modules
    - Import `buildSearchUrl`, `buildHeadlinesUrl`, `buildUsageUrl`, `formatArticle`, `formatUsageResponse`, `searchNewsSchema`, `headlinesSchema` from `./tools.js`
    - Import types from `./types.js`
    - Register `search-news` tool using `searchNewsSchema.shape` and shared URL/formatting functions
    - Register `headlines` tool using `headlinesSchema.shape` and shared URL/formatting functions
    - Register `usage` tool that calls `buildUsageUrl` and formats response with `formatUsageResponse`
    - Retain existing API key resolution (CLI arg → env var)
    - _Requirements: 2.1, 2.2, 2.4, 4.7, 4.8, 6.1, 6.7, 6.8_

- [x] 4. Checkpoint - Verify shared modules and stdio transport
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create remote Cloudflare Worker project
  - [x] 5.1 Set up `remote/` directory structure
    - Create `remote/package.json` with dependencies (`@modelcontextprotocol/server`, `agents`, `zod`, `wrangler`)
    - Create `remote/tsconfig.json` for Cloudflare Worker TypeScript config
    - Create `remote/wrangler.jsonc` with name `allnewsapi-mcp`, compatibility date, and `nodejs_compat` flag
    - Create `remote/worker-configuration.d.ts` for generated worker types
    - _Requirements: 1.7_

  - [x] 5.2 Implement `remote/src/index.ts` Cloudflare Worker entry point
    - Implement `extractApiKey(request)` with priority: Authorization Bearer header → apikey query param → reject
    - Implement `createServer(apiKey)` registering search-news, headlines, and usage tools
    - Include `ai_sentiment`, `ai_entity_name`, `ai_entity_type` parameters in search and headlines tools
    - Wire up MCP handler using `agents/mcp/server` pattern
    - Export default fetch handler
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.3_

  - [x] 5.3 Write property tests for API key extraction
    - **Property 1: API key extraction priority** — verify Bearer header takes priority over query param
    - **Property 2: Missing credentials rejection** — verify requests without credentials are rejected
    - **Validates: Requirements 1.3, 1.4, 1.5**

- [x] 6. Update README documentation
  - [x] 6.1 Update `README.md` with remote transport documentation
    - Document remote MCP connection instructions including deployed URL `https://mcp.allnewsapi.com/`
    - Document Authorization Bearer header and apikey query parameter authentication methods
    - Document new `ai_sentiment`, `ai_entity_name`, `ai_entity_type` parameters for search and headlines tools
    - Document the usage tool and its response fields
    - Document the updated API base URL (`https://api.allnewsapi.com`)
    - Retain existing stdio transport configuration for all supported clients
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 7. Add release automation
  - [x] 7.1 Create GitHub Actions workflow and release-please config
    - Create `.github/workflows/release.yml` triggered on pushes to `main`
    - Use `actions/checkout` pinned to SHA `fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09` (v5.1.0)
    - Use `actions/create-github-app-token` pinned to SHA `fee1f7d63c2ff003460e3d139729b119787bc349` (v2.2.2) with `RELEASE_APP_ID` and `RELEASE_APP_PRIVATE_KEY` secrets
    - Use `googleapis/release-please-action` pinned to SHA `5c625bfb5d1ff62eadeeb3772007f7f66fdcf071` (v4.4.1)
    - Set `contents: write` and `pull-requests: write` permissions
    - Create `release-please-config.json` with release-type `node` and package-name `allnewsapi-mcp-server`
    - Create `.release-please-manifest.json` tracking version `1.0.0`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 7.2 Create GitHub Actions workflow for npm publishing
    - Create `.github/workflows/publish.yml` triggered on push to tags matching `v*` and `workflow_dispatch` with a `tag` input for manual re-publishing
    - Use `actions/checkout` pinned to SHA `fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09` (v5.1.0) with `ref: ${{ inputs.tag || github.ref }}`
    - Use `actions/setup-node` pinned to SHA `49933ea5288caeca8642d1e84afbd3f7d6820020` (v4.4.0) with `node-version: '20'`, `registry-url: 'https://registry.npmjs.org'`, and `cache: 'npm'`
    - Run `npm ci`, `npm run build`, `npm publish --access public`
    - Use `NPM_TOKEN` secret via `NODE_AUTH_TOKEN` env var for authentication
    - Set `permissions: contents: read`
    - _Requirements: 8.1_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The remote Cloudflare Worker uses a different SDK (`@modelcontextprotocol/server` v2 + `agents`) than the stdio transport (`@modelcontextprotocol/sdk` v1.x)
- All API requests target `https://api.allnewsapi.com` without a `/v1` prefix

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["2.4", "2.5", "2.6", "3.1", "5.1"] },
    { "id": 3, "tasks": ["5.2", "5.3"] },
    { "id": 4, "tasks": ["6.1", "7.1", "7.2"] }
  ]
}
```
