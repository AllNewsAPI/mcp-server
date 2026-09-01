# AllNewsAPI MCP

A Model Context Protocol (MCP) server that provides news data capabilities using [AllNewsAPI](https://allnewsapi.com/). This server enables LLMs to search for news articles, get top headlines, check API usage, and access comprehensive news data with advanced filtering options including AI-powered sentiment and entity analysis.

### Key Features

- **Comprehensive news search**. Access news articles with advanced filtering by date, language, country, category, and more.
- **Real-time headlines**. Get the latest top headlines from around the world with customizable parameters.
- **AI-powered filtering**. Filter articles by AI-analyzed sentiment, entity names, and entity types.
- **Usage monitoring**. Check your API usage, plan limits, and remaining quota.
- **LLM-optimized responses**. Clean, formatted output designed for easy consumption by language models.
- **Multiple transports**. Connect locally via stdio or remotely via the hosted HTTP endpoint.

### Requirements
- Node.js 18 or newer
- AllNewsAPI key (get one at [allnewsapi.com](https://allnewsapi.com/))
- VS Code, Cursor, Windsurf, Claude Desktop, or any other MCP client

### Getting started

First, get your API key from [AllNewsAPI](https://allnewsapi.com/) and install the AllNewsAPI MCP server with your client.

#### Remote (Hosted) Transport

Connect directly to the hosted MCP server at `https://mcp.allnewsapi.com/mcp` without running anything locally.

**Authentication methods (remote):**

1. **Authorization Bearer header** (recommended):
   Pass your API key via the `Authorization` header:
   ```
   Authorization: Bearer YOUR_API_KEY_HERE
   ```

2. **Query parameter**:
   Append `?apikey=YOUR_API_KEY_HERE` to the connection URL:
   ```
   https://mcp.allnewsapi.com/mcp?apikey=YOUR_API_KEY_HERE
   ```

When both are provided, the Authorization header takes priority.

**Remote config** for MCP clients that support HTTP transport:

```json
{
  "mcpServers": {
    "allnewsapi": {
      "type": "remote",
      "url": "https://mcp.allnewsapi.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY_HERE"
      }
    }
  }
}
```

#### Local (stdio) Transport

**Standard config** works in most of the tools:

```js
{
  "mcpServers": {
    "allnewsapi": {
      "command": "npx",
      "args": [
        "allnewsapi-mcp@latest",
        "--apikey",
        "YOUR_API_KEY_HERE"
      ]
    }
  }
}
```

<details>
<summary>Claude Desktop</summary>

Follow the MCP install [guide](https://modelcontextprotocol.io/quickstart/user), use the standard config above, or configure with environment variable:

```json
{
  "mcpServers": {
    "allnewsapi": {
      "command": "npx",
      "args": ["allnewsapi-mcp@latest"],
      "env": {
        "ALLNEWSAPI_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

</details>

<details>
<summary>Cursor</summary>

Go to `Cursor Settings` -> `MCP` -> `Add new MCP Server`. Name it "AllNewsAPI", use `command` type with the command `npx allnewsapi-mcp@latest --apikey YOUR_API_KEY_HERE`. You can also verify config or add command arguments via clicking `Edit`.

</details>

<details>
<summary>VS Code</summary>

Follow the MCP install [guide](https://code.visualstudio.com/docs/copilot/chat/mcp-servers#_add-an-mcp-server), use the standard config above. You can also install the AllNewsAPI MCP server using the VS Code CLI:

```bash
# For VS Code
code --add-mcp '{"name":"allnewsapi","command":"npx","args":["allnewsapi-mcp@latest","--apikey","YOUR_API_KEY_HERE"]}'
```

After installation, the AllNewsAPI MCP server will be available for use with your GitHub Copilot agent in VS Code.

</details>

<details>
<summary>Windsurf</summary>

Follow Windsurf MCP [documentation](https://docs.windsurf.com/windsurf/cascade/mcp). Use the standard config above.

</details>

### Configuration

The AllNewsAPI MCP server supports the following configuration options:

**API Key Configuration (stdio transport)**

You can provide your AllNewsAPI key in two ways:

1. **Command-line argument** (recommended for most setups):
```bash
npx allnewsapi-mcp@latest --apikey YOUR_API_KEY_HERE
```

2. **Environment variable**:
```bash
export ALLNEWSAPI_KEY=YOUR_API_KEY_HERE
npx allnewsapi-mcp@latest
```

**API Key Configuration (remote transport)**

For the remote hosted server at `https://mcp.allnewsapi.com/mcp`:

1. **Authorization header** (recommended):
   Include `Authorization: Bearer YOUR_API_KEY_HERE` in request headers.

2. **Query parameter**:
   Append `?apikey=YOUR_API_KEY_HERE` to the URL.

### Local Installation

If you want to install and run the server locally:

```bash
# Clone the repository
git clone https://github.com/AllNewsAPI/mcp-server.git
cd mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Run the server (stdio transport)
node build/index.js --apikey YOUR_API_KEY_HERE
```

### Tools

<details>
<summary><b>News search and headlines</b></summary>

- **search-news**
  - Title: Search news articles
  - Description: Search for news articles using various parameters including keywords, date ranges, and filters
  - Parameters:
    - `q` (string, optional): Keywords to search for in news articles
    - `startDate` (string, optional): Filter articles published on or after this date (YYYY-MM-DD format)
    - `endDate` (string, optional): Filter articles published on or before this date (YYYY-MM-DD format)
    - `content` (boolean, optional): Whether to retrieve full article content (default: false)
    - `lang` (string, optional): Language code(s) of the articles (e.g., 'en', 'fr', 'de')
    - `country` (string, optional): Country code(s) of publication (e.g., 'us', 'gb', 'ca')
    - `region` (string, optional): Region(s) to filter by (e.g., 'americas', 'europe', 'asia')
    - `category` (string, optional): Category/categories to filter by (e.g., 'business', 'technology', 'sports')
    - `max` (number, optional): Number of articles to return, 1-100 (default: 5)
    - `attributes` (string, optional): Where to search for keywords: 'title', 'description', 'content' (default: 'title,description')
    - `page` (number, optional): Page number for pagination (default: 1)
    - `sortby` (string, optional): Sort results by 'publishedAt' or 'relevance' (default: 'publishedAt')
    - `publisher` (string, optional): Filter by specific publisher(s)
    - `ai_sentiment` (string, optional): Filter by AI-analyzed sentiment (e.g., 'positive', 'negative', 'neutral')
    - `ai_entity_name` (string, optional): Filter by entity name detected in articles
    - `ai_entity_type` (string, optional): Filter by entity type (e.g., 'person', 'organization', 'location')
  - Read-only: **true**

- **headlines**
  - Title: Get top headlines
  - Description: Get top headlines with optional filtering by country, category, and language
  - Parameters:
    - `country` (string, optional): Country code(s) of publication (e.g., 'us', 'gb', 'ca')
    - `category` (string, optional): Category to filter by (e.g., 'business', 'technology', 'sports')
    - `max` (number, optional): Number of articles to return, 1-100 (default: 5)
    - `lang` (string, optional): Language code of the articles (e.g., 'en', 'fr', 'de')
    - `ai_sentiment` (string, optional): Filter by AI-analyzed sentiment (e.g., 'positive', 'negative', 'neutral')
    - `ai_entity_name` (string, optional): Filter by entity name detected in articles
    - `ai_entity_type` (string, optional): Filter by entity type (e.g., 'person', 'organization', 'location')
  - Read-only: **true**

</details>

<details>
<summary><b>Usage monitoring</b></summary>

- **usage**
  - Title: Get API usage statistics
  - Description: Check your current API plan, usage limits, and remaining quota
  - Parameters: None
  - Response fields:
    - `plan`: Your current API plan name
    - `requestsUsed24Hours`: Number of API requests used in the last 24 hours
    - `requestsLimit24Hours`: Maximum allowed requests in a 24-hour period
    - `requestsRemaining24Hours`: Remaining requests available in the current 24-hour period
    - `requestsUsed30Days`: Total API requests used in the last 30 days
  - Read-only: **true**

</details>

### AI-Powered Filtering

The `ai_sentiment`, `ai_entity_name`, and `ai_entity_type` parameters allow you to filter articles using AI-analyzed metadata:

| Parameter | Description | Example values |
|-----------|-------------|----------------|
| `ai_sentiment` | Filter by the overall sentiment of the article | `positive`, `negative`, `neutral` |
| `ai_entity_name` | Filter by a named entity found in the article | `Apple`, `United Nations`, `Tokyo` |
| `ai_entity_type` | Filter by the type of entity | `person`, `organization`, `location` |

These parameters are available on both the `search-news` and `headlines` tools.

**Response enrichment**: When articles are returned, they may include additional AI-analyzed fields:

- **AI Sentiment**: The overall sentiment classification of the article
- **AI Sentiment Scores**: Breakdown of positive, negative, and neutral confidence scores
- **AI Entities**: Named entities detected in the article with their types
- **AI Summary**: A concise AI-generated summary of the article content

### Supported Parameters

<details>
<summary><b>Languages</b></summary>

The following language codes are supported:
`ar`, `zh`, `nl`, `en`, `fr`, `de`, `el`, `he`, `hi`, `it`, `ja`, `ml`, `mr`, `no`, `pt`, `ro`, `ru`, `es`, `sv`, `ta`, `te`, `uk`

</details>

<details>
<summary><b>Categories</b></summary>

The following categories are supported:
`adult`, `autos`, `beauty`, `business`, `communities`, `crime`, `cryptocurrency`, `electronics`, `entertainment`, `finance`, `food`, `games`, `health`, `hobbies`, `lifestyle`, `internet`, `jobs`, `law`, `literature`, `pets`, `politics`, `realty`, `science`, `sensitive`, `shopping`, `society`, `sports`, `technology`, `travel`

</details>

<details>
<summary><b>Regions</b></summary>

The following regions are supported:
`africa`, `americas`, `antarctic`, `asia`, `europe`, `oceania`

</details>

<details>
<summary><b>Countries</b></summary>

The API supports numerous country codes including:
- `us` (United States)
- `gb` (United Kingdom)  
- `ca` (Canada)
- `au` (Australia)
- `de` (Germany)
- `fr` (France)
- `jp` (Japan)
- `in` (India)
- And many more...

The server validates all country codes against the official list from AllNewsAPI.

</details>

### Example Usage

Once you have connected your MCP client to the AllNewsAPI server, you can ask natural language queries like:

- "Get me the latest technology news from the US"
- "Find news articles about climate change from European sources"
- "Show me top business headlines from the past week"
- "Search for cryptocurrency news in English from the last month"
- "Get sports headlines from Canada and Australia"
- "Find positive news about renewable energy" (using AI sentiment filtering)
- "Show me articles mentioning Apple as an organization" (using AI entity filtering)
- "Check my API usage and remaining quota"

The server will validate all parameters, connect to the AllNewsAPI, and return formatted results that are easy to read and understand.

### Error Handling

The server includes comprehensive error handling:

- **API Key validation**: Clear error messages if no API key is provided
- **Authentication errors** (remote): Descriptive error when neither Authorization header nor apikey parameter is present
- **Parameter validation**: All parameters are validated against official AllNewsAPI supported values
- **Network error handling**: Graceful handling of API connection issues
- **Rate limit handling**: Proper error messages for API rate limits

### API Base URL

All API requests are sent to `https://api.allnewsapi.com`. The endpoints used are:

| Endpoint | Path |
|----------|------|
| Search | `https://api.allnewsapi.com/search` |
| Headlines | `https://api.allnewsapi.com/headlines` |
| Usage | `https://api.allnewsapi.com/usage` |

### Technical Implementation

The server is built with TypeScript and the Model Context Protocol SDK. Key features include:

- **Dual transport support**: stdio for local usage and HTTP for remote connections
- **Shared tool logic**: Common tool definitions in `src/tools.ts` used by both transports
- **ES module support** with top-level await
- **Comprehensive error handling** with informative messages
- **Parameter validation** against official supported values
- **Clean formatting** of API responses for LLM consumption
- **Flexible configuration** supporting multiple API key methods
- **AI enrichment support** in both query parameters and response formatting
