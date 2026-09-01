import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { buildSearchUrl, buildHeadlinesUrl } from '../tools.js';

/**
 * Property tests for AI parameter pass-through.
 *
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8**
 */

// Arbitrary that generates non-empty strings without whitespace-only values
const nonEmptyString = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0);

describe('Property 3: AI parameter pass-through for search', () => {
  it('ai_sentiment appears in outgoing search URL when provided', () => {
    fc.assert(
      fc.property(nonEmptyString, nonEmptyString, (apiKey, sentiment) => {
        const url = buildSearchUrl(apiKey, { ai_sentiment: sentiment });
        const parsed = new URL(url);
        expect(parsed.searchParams.get('ai_sentiment')).toBe(sentiment);
      }),
    );
  });

  it('ai_entity_name appears in outgoing search URL when provided', () => {
    fc.assert(
      fc.property(nonEmptyString, nonEmptyString, (apiKey, entityName) => {
        const url = buildSearchUrl(apiKey, { ai_entity_name: entityName });
        const parsed = new URL(url);
        expect(parsed.searchParams.get('ai_entity_name')).toBe(entityName);
      }),
    );
  });

  it('ai_entity_type appears in outgoing search URL when provided', () => {
    fc.assert(
      fc.property(nonEmptyString, nonEmptyString, (apiKey, entityType) => {
        const url = buildSearchUrl(apiKey, { ai_entity_type: entityType });
        const parsed = new URL(url);
        expect(parsed.searchParams.get('ai_entity_type')).toBe(entityType);
      }),
    );
  });

  it('all AI params appear together in outgoing search URL when all provided', () => {
    fc.assert(
      fc.property(
        nonEmptyString,
        nonEmptyString,
        nonEmptyString,
        nonEmptyString,
        (apiKey, sentiment, entityName, entityType) => {
          const url = buildSearchUrl(apiKey, {
            ai_sentiment: sentiment,
            ai_entity_name: entityName,
            ai_entity_type: entityType,
          });
          const parsed = new URL(url);
          expect(parsed.searchParams.get('ai_sentiment')).toBe(sentiment);
          expect(parsed.searchParams.get('ai_entity_name')).toBe(entityName);
          expect(parsed.searchParams.get('ai_entity_type')).toBe(entityType);
        },
      ),
    );
  });
});

describe('Property 4: AI parameter pass-through for headlines', () => {
  it('ai_sentiment appears in outgoing headlines URL when provided', () => {
    fc.assert(
      fc.property(nonEmptyString, nonEmptyString, (apiKey, sentiment) => {
        const url = buildHeadlinesUrl(apiKey, { ai_sentiment: sentiment });
        const parsed = new URL(url);
        expect(parsed.searchParams.get('ai_sentiment')).toBe(sentiment);
      }),
    );
  });

  it('ai_entity_name appears in outgoing headlines URL when provided', () => {
    fc.assert(
      fc.property(nonEmptyString, nonEmptyString, (apiKey, entityName) => {
        const url = buildHeadlinesUrl(apiKey, { ai_entity_name: entityName });
        const parsed = new URL(url);
        expect(parsed.searchParams.get('ai_entity_name')).toBe(entityName);
      }),
    );
  });

  it('ai_entity_type appears in outgoing headlines URL when provided', () => {
    fc.assert(
      fc.property(nonEmptyString, nonEmptyString, (apiKey, entityType) => {
        const url = buildHeadlinesUrl(apiKey, { ai_entity_type: entityType });
        const parsed = new URL(url);
        expect(parsed.searchParams.get('ai_entity_type')).toBe(entityType);
      }),
    );
  });

  it('all AI params appear together in outgoing headlines URL when all provided', () => {
    fc.assert(
      fc.property(
        nonEmptyString,
        nonEmptyString,
        nonEmptyString,
        nonEmptyString,
        (apiKey, sentiment, entityName, entityType) => {
          const url = buildHeadlinesUrl(apiKey, {
            ai_sentiment: sentiment,
            ai_entity_name: entityName,
            ai_entity_type: entityType,
          });
          const parsed = new URL(url);
          expect(parsed.searchParams.get('ai_sentiment')).toBe(sentiment);
          expect(parsed.searchParams.get('ai_entity_name')).toBe(entityName);
          expect(parsed.searchParams.get('ai_entity_type')).toBe(entityType);
        },
      ),
    );
  });
});
