# AllNewsAPI MCP Server

This is a Model Context Protocol (MCP) server that connects to the [AllNewsAPI](https://allnewsapi.com/) and provides tools for fetching news data.

## What's Been Implemented

1. **Complete MCP Server** with TypeScript and the Model Context Protocol SDK
   - Connects to the AllNewsAPI
   - Provides tools for searching news and getting top headlines
   - Handles errors gracefully with informative messages

2. **Flexible API Key Management**
   - Command-line argument: `allnewsapi --apikey YOUR_API_KEY`
   - Environment variable: `ALLNEWSAPI_KEY`
   - Detailed error messages if no API key is provided

3. **Two Powerful Tools**:
   - `search-news`: For searching news articles with comprehensive filtering options
   - `headlines`: For fetching news headlines with advanced filtering

4. **Robust Parameter Validation**:
   - Validation for countries, regions, languages, and categories
   - Each parameter is checked against the official supported values from the AllNewsAPI
   - Helpful error messages when invalid values are provided

5. **Formatted Results**: The API responses are formatted in a clean, readable way for easy consumption by LLMs.

6. **Claude Integration**: Ready to use with Claude via the `.clauderc` configuration file.

## Installation

```bash
# Clone the repository
git clone https://github.com/AllNewsAPI/mcp-server.git
cd mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

You can provide your AllNewsAPI key in two ways:

### 1. Command-line argument

```bash
allnewsapi --apikey your_api_key_here
```

### 2. Environment variable

```bash
export ALLNEWSAPI_KEY=your_api_key_here
allnewsapi
```

## Usage

### Running the Server

You can run the server directly:

```bash
node build/index.js --apikey your_api_key_here
```

Or, after installing globally:

```bash
npm install -g .
allnewsapi --apikey your_api_key_here
```

### Available Tools

The server provides the following tools:

#### 1. search-news

Search for news articles using various parameters.

Parameters:
- `q` (optional): Keywords to search for in news articles
- `startDate` (optional): Filter articles published on or after this date (YYYY-MM-DD)
- `endDate` (optional): Filter articles published on or before this date (YYYY-MM-DD)
- `content` (optional, default: false): Whether to retrieve full article content
- `lang` (optional): Language code(s) of the articles (e.g., 'en', 'fr')
- `country` (optional): Country code(s) of publication (e.g., 'us', 'gb')
- `region` (optional): Region(s) to filter by (e.g., 'americas', 'europe')
- `category` (optional): Category/categories to filter by (e.g., 'business', 'technology')
- `max` (optional, default: 5): Number of articles to return (1-100)
- `attributes` (optional, default: "title,description"): Where to search for keywords (title, description, content)
- `page` (optional, default: 1): Page number for pagination
- `sortby` (optional, default: "publishedAt"): Sort results by 'publishedAt' or 'relevance'
- `publisher` (optional): Filter by specific publisher(s)

#### 2. headlines

Get top headlines with optional filtering.

Parameters:
- `country` (optional): Country code(s) of publication (e.g., 'us', 'gb')
- `category` (optional): Category to filter by (e.g., 'business', 'technology')
- `max` (optional, default: 5): Number of articles to return (1-100)
- `lang` (optional): Language code of the articles (e.g., 'en', 'fr')

## Example Usage with Claude

Here's how you can use this MCP server with Claude:

1. Start the server:
   ```bash
   allnewsapi --apikey your_api_key_here
   ```

2. Connect Claude to the server using the MCP integration.

3. Ask Claude to fetch news with natural language queries:
   ```
   Can you get me the latest technology news from the US?
   ```
   ```
   Find news articles about climate change from European sources
   ```
   ```
   Show me top business headlines from the past week
   ```

   Claude will use the appropriate tools with validated parameters to fetch the requested news.

## Integration with Claude

To use this MCP server with Claude, you can configure it in your `.clauderc` file:

```json
{
  "mcp": {
    "servers": {
      "allnewsapi": {
        "command": "/path/to/allnewsapi",
        "args": ["stdio"],
        "env": {
          "ALLNEWSAPI_KEY": "<YOUR_API_KEY>"
        }
      }
    }
  }
}
```

Alternatively, you can pass the API key directly:

```json
{
  "mcp": {
    "servers": {
      "allnewsapi": {
        "command": "/path/to/allnewsapi",
        "args": ["stdio", "--apikey", "<YOUR_API_KEY>"]
      }
    }
  }
}
```

## Supported Parameters

### Languages
The following language codes are supported:
ar, zh, nl, en, fr, de, el, he, hi, it, ja, ml, mr, no, pt, ro, ru, es, sv, ta, te, uk

### Categories
The following categories are supported:
adult, autos, beauty, business, communities, crime, cryptocurrency, electronics, entertainment, finance, food, games, health, hobbies, lifestyle, internet, jobs, law, literature, pets, politics, realty, science, sensitive, shopping, society, sports, technology, travel

### Regions
The following regions are supported:
africa, americas, antarctic, asia, europe, oceania

### Countries
The API supports numerous country codes including:
- US (United States)
- GB (United Kingdom)
- CA (Canada)
- AU (Australia)
- DE (Germany)
- FR (France)
- JP (Japan)
- IN (India)
- And many more...

The server validates all country codes against the official list from AllNewsAPI.

## Technical Implementation

The server is built with TypeScript and the Model Context Protocol SDK. It includes:

- ES module support with top-level await
- Comprehensive error handling
- Parameter validation against official supported values
- Clean formatting of API responses

The code is well-documented and follows best practices for MCP server implementation.

## Example Queries with Claude

Once you have connected Claude to your MCP server, you can ask natural language queries like:

- "Get me the latest technology news from the US"
- "Find news articles about climate change from European sources"
- "Show me top business headlines from the past week"

The server will validate all parameters, connect to the AllNewsAPI, and return formatted results that are easy to read and understand.