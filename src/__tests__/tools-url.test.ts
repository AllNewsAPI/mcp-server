import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { buildSearchUrl, buildHeadlinesUrl, buildUsageUrl } from '../tools.js';

/**
 * Property tests for URL construction functions.
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 */

// Arbitrary for non-empty strings suitable for URL parameters
const nonEmptyParamString = fc.string({ minLength: 1 }).filter((s) => s.trim() !== '');

// Arbitrary for API keys (non-empty alphanumeric-like strings)
const apiKeyArb = fc.stringMatching(/^[a-zA-Z0-9]{1,64}$/);

// Arbitrary for generating a record of non-empty string params
const paramsArb = fc.dictionary(
  fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]{0,15}$/),
  fc.oneof(nonEmptyParamString, fc.array(nonEmptyParamString, { minLength: 1, maxLength: 3 })),
  { minKeys: 0, maxKeys: 5 },
);

describe('Property 7: URL construction correctness (search)', () => {
  it('search URL base is https://api.allnewsapi.com/search', () => {
    fc.assert(
      fc.property(apiKeyArb, paramsArb, (apiKey, params) => {
        const url = buildSearchUrl(apiKey, params);
        const parsed = new URL(url);
        expect(parsed.origin).toBe('https://api.allnewsapi.com');
        expect(parsed.pathname).toBe('/search');
      }),
    );
  });

  it('search URL always includes the apikey parameter', () => {
    fc.assert(
      fc.property(apiKeyArb, paramsArb, (apiKey, params) => {
        const url = buildSearchUrl(apiKey, params);
        const parsed = new URL(url);
        expect(parsed.searchParams.get('apikey')).toBe(apiKey);
      }),
    );
  });

  it('search URL includes all non-empty params as query parameters', () => {
    fc.assert(
      fc.property(apiKeyArb, paramsArb, (apiKey, params) => {
        const url = buildSearchUrl(apiKey, params);
        const parsed = new URL(url);

        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null && value !== '') {
            const expected = Array.isArray(value) ? value.join(',') : String(value);
            if (expected !== '') {
              expect(parsed.searchParams.get(key)).toBe(expected);
            }
          }
        }
      }),
    );
  });
});

describe('Property 8: Headlines URL construction correctness', () => {
  it('headlines URL base is https://api.allnewsapi.com/headlines', () => {
    fc.assert(
      fc.property(apiKeyArb, paramsArb, (apiKey, params) => {
        const url = buildHeadlinesUrl(apiKey, params);
        const parsed = new URL(url);
        expect(parsed.origin).toBe('https://api.allnewsapi.com');
        expect(parsed.pathname).toBe('/headlines');
      }),
    );
  });

  it('headlines URL always includes the apikey parameter', () => {
    fc.assert(
      fc.property(apiKeyArb, paramsArb, (apiKey, params) => {
        const url = buildHeadlinesUrl(apiKey, params);
        const parsed = new URL(url);
        expect(parsed.searchParams.get('apikey')).toBe(apiKey);
      }),
    );
  });

  it('headlines URL includes all non-empty params as query parameters', () => {
    fc.assert(
      fc.property(apiKeyArb, paramsArb, (apiKey, params) => {
        const url = buildHeadlinesUrl(apiKey, params);
        const parsed = new URL(url);

        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null && value !== '') {
            const expected = Array.isArray(value) ? value.join(',') : String(value);
            if (expected !== '') {
              expect(parsed.searchParams.get(key)).toBe(expected);
            }
          }
        }
      }),
    );
  });
});

describe('Property 9: Usage URL construction correctness', () => {
  it('usage URL base is https://api.allnewsapi.com/usage', () => {
    fc.assert(
      fc.property(apiKeyArb, (apiKey) => {
        const url = buildUsageUrl(apiKey);
        const parsed = new URL(url);
        expect(parsed.origin).toBe('https://api.allnewsapi.com');
        expect(parsed.pathname).toBe('/usage');
      }),
    );
  });

  it('usage URL includes the apikey parameter with the provided key value', () => {
    fc.assert(
      fc.property(apiKeyArb, (apiKey) => {
        const url = buildUsageUrl(apiKey);
        const parsed = new URL(url);
        expect(parsed.searchParams.get('apikey')).toBe(apiKey);
      }),
    );
  });

  it('usage URL has no other query parameters besides apikey', () => {
    fc.assert(
      fc.property(apiKeyArb, (apiKey) => {
        const url = buildUsageUrl(apiKey);
        const parsed = new URL(url);
        const keys = Array.from(parsed.searchParams.keys());
        expect(keys).toEqual(['apikey']);
      }),
    );
  });
});
