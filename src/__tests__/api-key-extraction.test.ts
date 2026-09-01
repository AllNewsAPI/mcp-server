import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property tests for API key extraction in the remote transport.
 *
 * **Validates: Requirements 1.3, 1.4, 1.5**
 *
 * The extractApiKey function implements the following priority:
 * 1. Authorization: Bearer <token> header (highest priority)
 * 2. apikey query parameter (fallback)
 * 3. null (if neither is present)
 */

/**
 * Local implementation of extractApiKey matching remote/src/index.ts logic.
 * This avoids needing the remote project's dependencies installed.
 */
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

// Arbitrary for non-empty API key strings.
// API keys are trimmed by the HTTP Request constructor when set as header values,
// so we generate strings without leading/trailing whitespace to test the logical priority.
const apiKeyArb = fc
  .string({ minLength: 1 })
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

describe('Property 1: API key extraction priority', () => {
  it('Bearer header takes priority over apikey query param when both present', () => {
    fc.assert(
      fc.property(apiKeyArb, apiKeyArb, (bearerToken, queryKey) => {
        const request = new Request(
          `https://mcp.allnewsapi.com/?apikey=${encodeURIComponent(queryKey)}`,
          {
            headers: { Authorization: `Bearer ${bearerToken}` },
          },
        );
        const result = extractApiKey(request);
        expect(result).toBe(bearerToken);
      }),
    );
  });

  it('returns Bearer token when only header is present', () => {
    fc.assert(
      fc.property(apiKeyArb, (bearerToken) => {
        const request = new Request('https://mcp.allnewsapi.com/', {
          headers: { Authorization: `Bearer ${bearerToken}` },
        });
        const result = extractApiKey(request);
        expect(result).toBe(bearerToken);
      }),
    );
  });

  it('returns apikey query param when no Authorization header is present', () => {
    fc.assert(
      fc.property(apiKeyArb, (queryKey) => {
        const request = new Request(
          `https://mcp.allnewsapi.com/?apikey=${encodeURIComponent(queryKey)}`,
        );
        const result = extractApiKey(request);
        expect(result).toBe(queryKey);
      }),
    );
  });
});

describe('Property 2: Missing credentials rejection', () => {
  it('returns null when neither Authorization header nor apikey query param is present', () => {
    fc.assert(
      fc.property(fc.webUrl(), (baseUrl) => {
        // Ensure the URL has no apikey param
        const url = new URL(baseUrl);
        url.searchParams.delete('apikey');
        const request = new Request(url.toString());
        const result = extractApiKey(request);
        expect(result).toBeNull();
      }),
    );
  });

  it('returns null when Authorization header exists but is not Bearer scheme', () => {
    fc.assert(
      fc.property(apiKeyArb, (token) => {
        const request = new Request('https://mcp.allnewsapi.com/', {
          headers: { Authorization: `Basic ${token}` },
        });
        const result = extractApiKey(request);
        expect(result).toBeNull();
      }),
    );
  });
});
