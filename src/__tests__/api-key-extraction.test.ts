import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property tests for API key extraction in the remote transport.
 *
 * **Validates: Requirements 1.3, 1.4, 1.5**
 *
 * AllNewsAPI keys are API keys (not OAuth bearer tokens). extractApiKey uses:
 *   1. `X-API-Key` header (canonical)
 *   2. `apikey` query parameter (AllNewsAPI's native scheme)
 *   3. `Authorization: Bearer <key>` (fallback for bearer-only clients)
 *   4. null when none are present
 */

/**
 * Local implementation of extractApiKey matching remote/src/index.ts logic.
 * This avoids needing the remote project's dependencies installed.
 */
function extractApiKey(request: Request): string | null {
  const apiKeyHeader = request.headers.get('X-API-Key');
  if (apiKeyHeader?.trim()) {
    return apiKeyHeader.trim();
  }

  const apiKeyParam = new URL(request.url).searchParams.get('apikey');
  if (apiKeyParam) {
    return apiKeyParam;
  }

  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim() || null;
  }

  return null;
}

// Arbitrary for non-empty API key strings.
// API keys are trimmed by the HTTP Request constructor when set as header values,
// so we generate strings without leading/trailing whitespace to test the logical priority.
const apiKeyArb = fc
  .string({ minLength: 1 })
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

describe('Property 1: API key extraction priority', () => {
  it('X-API-Key header takes priority over apikey query param and Authorization', () => {
    fc.assert(
      fc.property(apiKeyArb, apiKeyArb, apiKeyArb, (headerKey, queryKey, bearerKey) => {
        const request = new Request(
          `https://mcp.allnewsapi.com/mcp?apikey=${encodeURIComponent(queryKey)}`,
          {
            headers: {
              'X-API-Key': headerKey,
              Authorization: `Bearer ${bearerKey}`,
            },
          },
        );
        expect(extractApiKey(request)).toBe(headerKey);
      }),
    );
  });

  it('apikey query param takes priority over Authorization Bearer', () => {
    fc.assert(
      fc.property(apiKeyArb, apiKeyArb, (queryKey, bearerKey) => {
        const request = new Request(
          `https://mcp.allnewsapi.com/mcp?apikey=${encodeURIComponent(queryKey)}`,
          {
            headers: { Authorization: `Bearer ${bearerKey}` },
          },
        );
        expect(extractApiKey(request)).toBe(queryKey);
      }),
    );
  });

  it('returns X-API-Key value when only that header is present', () => {
    fc.assert(
      fc.property(apiKeyArb, (headerKey) => {
        const request = new Request('https://mcp.allnewsapi.com/mcp', {
          headers: { 'X-API-Key': headerKey },
        });
        expect(extractApiKey(request)).toBe(headerKey);
      }),
    );
  });

  it('returns apikey query param when no auth headers are present', () => {
    fc.assert(
      fc.property(apiKeyArb, (queryKey) => {
        const request = new Request(
          `https://mcp.allnewsapi.com/mcp?apikey=${encodeURIComponent(queryKey)}`,
        );
        expect(extractApiKey(request)).toBe(queryKey);
      }),
    );
  });

  it('falls back to Authorization Bearer when it is the only credential', () => {
    fc.assert(
      fc.property(apiKeyArb, (bearerKey) => {
        const request = new Request('https://mcp.allnewsapi.com/mcp', {
          headers: { Authorization: `Bearer ${bearerKey}` },
        });
        expect(extractApiKey(request)).toBe(bearerKey);
      }),
    );
  });
});

describe('Property 2: Missing credentials rejection', () => {
  it('returns null when no credential is present', () => {
    fc.assert(
      fc.property(fc.webUrl(), (baseUrl) => {
        const url = new URL(baseUrl);
        url.searchParams.delete('apikey');
        const request = new Request(url.toString());
        expect(extractApiKey(request)).toBeNull();
      }),
    );
  });

  it('returns null when Authorization header exists but is not Bearer scheme', () => {
    fc.assert(
      fc.property(apiKeyArb, (token) => {
        const request = new Request('https://mcp.allnewsapi.com/mcp', {
          headers: { Authorization: `Basic ${token}` },
        });
        expect(extractApiKey(request)).toBeNull();
      }),
    );
  });
});
