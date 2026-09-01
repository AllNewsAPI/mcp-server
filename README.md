# AllNewsAPI MCP

[![npm](https://img.shields.io/npm/v/allnewsapi-mcp)](https://www.npmjs.com/package/allnewsapi-mcp)

Give your AI assistant live news. This [Model Context Protocol](https://modelcontextprotocol.io/) server lets MCP clients (Claude, Cursor, VS Code, Windsurf, and others) search news articles, fetch top headlines, and check your API usage through [AllNewsAPI](https://allnewsapi.com/).

You'll need an API key — get one at [allnewsapi.com](https://allnewsapi.com/).

## Quick start

Pick one of the two ways to connect.

### Hosted (no install)

Point your client at the hosted server and pass your key as a Bearer token:

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

Prefer a URL-only setup? Use `https://mcp.allnewsapi.com/mcp?apikey=YOUR_API_KEY_HERE` instead of the header.

### Local (npx)

Runs the server on your machine via `npx` — no clone or build needed:

```json
{
  "mcpServers": {
    "allnewsapi": {
      "command": "npx",
      "args": ["allnewsapi-mcp@latest", "--apikey", "YOUR_API_KEY_HERE"]
    }
  }
}
```

You can also supply the key as an `ALLNEWSAPI_KEY` environment variable instead of `--apikey`.

### Client-specific setup

<details>
<summary>Claude Desktop</summary>

Edit your config (Settings → Developer → Edit Config) and add the local or hosted snippet above. Full guide: [modelcontextprotocol.io/quickstart/user](https://modelcontextprotocol.io/quickstart/user).

</details>

<details>
<summary>Cursor</summary>

`Cursor Settings` → `MCP` → `Add new MCP Server`. Name it "AllNewsAPI", choose the `command` type, and enter:

```
npx allnewsapi-mcp@latest --apikey YOUR_API_KEY_HERE
```

</details>

<details>
<summary>VS Code</summary>

```bash
code --add-mcp '{"name":"allnewsapi","command":"npx","args":["allnewsapi-mcp@latest","--apikey","YOUR_API_KEY_HERE"]}'
```

The server is then available to your GitHub Copilot agent. Full guide: [VS Code MCP docs](https://code.visualstudio.com/docs/copilot/chat/mcp-servers#_add-an-mcp-server).

</details>

<details>
<summary>Windsurf</summary>

Add the local or hosted snippet above to your MCP config. Full guide: [Windsurf MCP docs](https://docs.windsurf.com/windsurf/cascade/mcp).

</details>

<details>
<summary>Claude Code</summary>

Add it from the terminal — local:

```bash
claude mcp add allnewsapi -- npx allnewsapi-mcp@latest --apikey YOUR_API_KEY_HERE
```

Or the hosted server:

```bash
claude mcp add --transport http allnewsapi https://mcp.allnewsapi.com/mcp --header "Authorization: Bearer YOUR_API_KEY_HERE"
```

</details>

<details>
<summary>Claude Cowork</summary>

Cowork runs inside Claude Desktop. Add the hosted server as a custom connector — **Customize → Connectors → +** — and enter the URL with your key:

```
https://mcp.allnewsapi.com/mcp?apikey=YOUR_API_KEY_HERE
```

For a local setup, use the Claude Desktop config shown above.

</details>

<details>
<summary>OpenWork</summary>

[OpenWork](https://github.com/different-ai/openwork) is an open-source Cowork alternative with MCP support. Add AllNewsAPI using either the local command (`npx allnewsapi-mcp@latest --apikey YOUR_API_KEY_HERE`) or the hosted URL above, following OpenWork's MCP configuration.

</details>

**Any other MCP client:** point it at the hosted URL (`https://mcp.allnewsapi.com/mcp`) or run the `npx allnewsapi-mcp@latest` command with your API key.

## Tools

### `search-news`
Search articles by keyword, date, and filters.

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Keywords to search for |
| `startDate` / `endDate` | string | Date range (`YYYY-MM-DD`) |
| `content` | boolean | Include full article content (default: false) |
| `lang` | string | Language code(s), e.g. `en`, `fr` |
| `country` | string | Country code(s), e.g. `us`, `gb` |
| `region` | string | Region(s), e.g. `americas`, `europe` |
| `category` | string | Category/categories, e.g. `business` |
| `max` | number | Number of articles, 1–100 (default: 5) |
| `page` | number | Page number (default: 1) |
| `attributes` | string | Where to match keywords: `title`, `description`, `content` |
| `sortby` | string | `publishedAt` or `relevance` |
| `publisher` | string | Filter by publisher(s) |
| `ai_sentiment` | string | `positive`, `negative`, or `neutral` |
| `ai_entity_name` | string | Named entity, e.g. `Apple` |
| `ai_entity_type` | string | Entity type, e.g. `person`, `organization`, `location` |

### `headlines`
Get top headlines, optionally filtered.

| Parameter | Type | Description |
|-----------|------|-------------|
| `country` | string | Country code(s), e.g. `us`, `gb` |
| `category` | string | Category, e.g. `technology` |
| `lang` | string | Language code, e.g. `en` |
| `max` | number | Number of articles, 1–100 (default: 5) |
| `ai_sentiment` | string | `positive`, `negative`, or `neutral` |
| `ai_entity_name` | string | Named entity, e.g. `Apple` |
| `ai_entity_type` | string | Entity type, e.g. `person`, `organization`, `location` |

### `usage`
Check your plan, request limits, and remaining quota. No parameters.

> **Plan note:** Advanced filters — `country`, `region`, `category`, `publisher`, `lang`, `attributes`, and `sortby` — require a paid plan. On the free plan, use `search-news` with `q` and `max`. See [pricing](https://allnewsapi.com/pricing).

## AI filtering

`search-news` and `headlines` accept AI-analyzed filters:

- `ai_sentiment` — overall article sentiment (`positive`, `negative`, `neutral`)
- `ai_entity_name` — a named entity in the article (e.g. `United Nations`)
- `ai_entity_type` — entity category (`person`, `organization`, `location`)

Returned articles may also include AI sentiment scores, detected entities, and a short AI summary when available.

## Example prompts

- "Get me the latest technology news from the US"
- "Find articles about climate change from European sources"
- "Show me top business headlines from the past week"
- "Find positive news about renewable energy"
- "Show me articles mentioning Apple as an organization"
- "Check my API usage and remaining quota"

## Supported values

Full lists of accepted values live in the AllNewsAPI docs:

- [Countries](https://allnewsapi.com/docs/api/countries)
- [Languages](https://allnewsapi.com/docs/api/languages)
- [Categories](https://allnewsapi.com/docs/api/categories)
- [Regions](https://allnewsapi.com/docs/api/regions)
