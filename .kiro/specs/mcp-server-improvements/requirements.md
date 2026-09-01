# Requirements Document

## Introduction

This document specifies the requirements for improving the AllNewsAPI MCP Server. The improvements include adding Streamable HTTP transport for remote deployment, refactoring shared tool logic, updating the API base URL, adding new AI-powered query parameters and response fields, adding a usage reporting tool, updating documentation, and adding release automation via release-please.

## Glossary

- **MCP_Server**: The AllNewsAPI Model Context Protocol server application that exposes news data tools to LLM clients
- **HTTP_Transport**: The Streamable HTTP transport entry point (`src/http.ts`) that enables remote MCP connections over HTTP
- **Stdio_Transport**: The existing stdio-based transport entry point (`src/index.ts`) for local MCP connections
- **Tools_Module**: The shared module (`src/tools.ts`) containing tool definitions imported by both transport entry points
- **AllNewsAPI**: The upstream news data API at `https://api.allnewsapi.com`
- **Search_Tool**: The MCP tool that searches news articles via the AllNewsAPI search endpoint
- **Headlines_Tool**: The MCP tool that retrieves top headlines via the AllNewsAPI headlines endpoint
- **Usage_Tool**: The MCP tool that retrieves API usage statistics via the AllNewsAPI usage endpoint
- **Release_Please**: The automated release management system using Google's release-please GitHub Action

## Requirements

### Requirement 1: Streamable HTTP Transport

**User Story:** As a developer, I want to connect to the MCP server remotely over HTTP, so that I can use the AllNewsAPI tools without running a local process.

#### Acceptance Criteria

1. THE HTTP_Transport SHALL listen on the port specified by the PORT environment variable.
2. WHEN the PORT environment variable is not set, THE HTTP_Transport SHALL default to port 3000.
3. WHEN a request includes an `Authorization: Bearer <token>` header, THE HTTP_Transport SHALL use the token value as the API key.
4. WHEN a request does not include an Authorization header but includes an `apikey` query parameter, THE HTTP_Transport SHALL use the query parameter value as the API key.
5. IF a request contains neither an Authorization header nor an apikey query parameter, THEN THE HTTP_Transport SHALL reject the request with an appropriate authentication error.
6. THE HTTP_Transport SHALL expose the same MCP tools as the Stdio_Transport.
7. THE HTTP_Transport SHALL be implemented in the file `src/http.ts`.

### Requirement 2: Shared Tools Module

**User Story:** As a maintainer, I want tool definitions in a single shared module, so that both transport entry points stay in sync without code duplication.

#### Acceptance Criteria

1. THE Tools_Module SHALL export a function that registers all MCP tools (search-news, headlines, usage) on a provided McpServer instance.
2. THE Stdio_Transport SHALL import and use the Tools_Module to register tools.
3. THE HTTP_Transport SHALL import and use the Tools_Module to register tools.
4. THE Tools_Module SHALL be implemented in the file `src/tools.ts`.

### Requirement 3: API Base URL Update

**User Story:** As a user, I want the server to connect to the production AllNewsAPI domain, so that requests are routed to the correct service.

#### Acceptance Criteria

1. THE MCP_Server SHALL use `https://api.allnewsapi.com` as the base URL for all API requests.
2. THE MCP_Server SHALL use `/search` as the path for search requests.
3. THE MCP_Server SHALL use `/headlines` as the path for headlines requests.
4. THE MCP_Server SHALL use `/usage` as the path for usage requests.

### Requirement 4: New AI Query Parameters

**User Story:** As a user, I want to filter news by AI-analyzed sentiment and entity data, so that I can find more relevant articles.

#### Acceptance Criteria

1. THE Search_Tool SHALL accept an optional `ai_sentiment` parameter for filtering articles by AI-analyzed sentiment.
2. THE Search_Tool SHALL accept an optional `ai_entity_name` parameter for filtering articles by entity name.
3. THE Search_Tool SHALL accept an optional `ai_entity_type` parameter for filtering articles by entity type.
4. THE Headlines_Tool SHALL accept an optional `ai_sentiment` parameter for filtering articles by AI-analyzed sentiment.
5. THE Headlines_Tool SHALL accept an optional `ai_entity_name` parameter for filtering articles by entity name.
6. THE Headlines_Tool SHALL accept an optional `ai_entity_type` parameter for filtering articles by entity type.
7. WHEN an AI query parameter is provided, THE Search_Tool SHALL include the parameter in the API request to AllNewsAPI.
8. WHEN an AI query parameter is provided, THE Headlines_Tool SHALL include the parameter in the API request to AllNewsAPI.

### Requirement 5: Updated Response Types

**User Story:** As a user, I want to see AI-enriched article data including sentiment, entities, and summaries, so that I can quickly understand article context.

#### Acceptance Criteria

1. THE MCP_Server SHALL include the `region` field in formatted article output when present in the API response.
2. THE MCP_Server SHALL include the `lang` field in formatted article output when present in the API response.
3. THE MCP_Server SHALL include the `authors` array in formatted article output when present in the API response.
4. THE MCP_Server SHALL include the `ai_sentiment` field in formatted article output when present in the API response.
5. THE MCP_Server SHALL include the `ai_sentiment_scores` object in formatted article output when present in the API response.
6. THE MCP_Server SHALL include the `ai_entities` array in formatted article output when present in the API response.
7. THE MCP_Server SHALL include the `ai_summary` field in formatted article output when present in the API response.

### Requirement 6: Usage Tool

**User Story:** As a user, I want to check my API usage and remaining quota, so that I can monitor my consumption.

#### Acceptance Criteria

1. THE Usage_Tool SHALL call `GET https://api.allnewsapi.com/usage` with the configured API key.
2. THE Usage_Tool SHALL return the `plan` field from the API response.
3. THE Usage_Tool SHALL return the `requestsUsed24Hours` field from the API response.
4. THE Usage_Tool SHALL return the `requestsLimit24Hours` field from the API response.
5. THE Usage_Tool SHALL return the `requestsRemaining24Hours` field from the API response.
6. THE Usage_Tool SHALL return the `requestsUsed30Days` field from the API response.
7. THE Usage_Tool SHALL accept no parameters beyond the API key.
8. IF the usage API request fails, THEN THE Usage_Tool SHALL return an error message describing the failure.

### Requirement 7: README Documentation Update

**User Story:** As a developer, I want up-to-date documentation covering all features, so that I can configure and use the MCP server correctly.

#### Acceptance Criteria

1. THE README SHALL document remote MCP connection instructions for the HTTP transport including the deployed URL `https://mcp.allnewsapi.com/`.
2. THE README SHALL document the Authorization Bearer header and apikey query parameter authentication methods for HTTP transport.
3. THE README SHALL document the new `ai_sentiment`, `ai_entity_name`, and `ai_entity_type` parameters for the search and headlines tools.
4. THE README SHALL document the usage tool including its response fields.
5. THE README SHALL document the updated API base URL.
6. THE README SHALL retain existing documentation for stdio transport configuration across all supported clients.

### Requirement 8: Release Automation

**User Story:** As a maintainer, I want automated release management, so that versions are tracked and changelogs are generated without manual effort.

#### Acceptance Criteria

1. THE MCP_Server repository SHALL include a GitHub Actions workflow that triggers on pushes to the `main` branch.
2. THE workflow SHALL use `actions/checkout` pinned to SHA `fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09` (v5.1.0).
3. THE workflow SHALL use `actions/create-github-app-token` pinned to SHA `fee1f7d63c2ff003460e3d139729b119787bc349` (v2.2.2) with secrets `RELEASE_APP_ID` and `RELEASE_APP_PRIVATE_KEY`.
4. THE workflow SHALL use `googleapis/release-please-action` pinned to SHA `5c625bfb5d1ff62eadeeb3772007f7f66fdcf071` (v4.4.1).
5. THE workflow SHALL have `contents: write` and `pull-requests: write` permissions.
6. THE repository SHALL include a `release-please-config.json` file with release-type `node` and package-name `allnewsapi-mcp-server`.
7. THE repository SHALL include a `.release-please-manifest.json` file tracking the current package version.
