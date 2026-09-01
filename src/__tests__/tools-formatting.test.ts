import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatArticle, formatUsageResponse } from '../tools.js';
import type { NewsArticle, UsageApiResponse } from '../types.js';

/**
 * Property tests for response formatting.
 *
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.2, 6.3, 6.4, 6.5, 6.6**
 */

// --- Arbitraries ---

const nonEmptyString = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0);

const baseArticleArb: fc.Arbitrary<NewsArticle> = fc.record({
  title: nonEmptyString,
  description: nonEmptyString,
  url: nonEmptyString,
  publishedAt: nonEmptyString,
  source: fc.record({
    name: nonEmptyString,
    url: nonEmptyString,
  }),
});

const regionArb = nonEmptyString;
const langArb = nonEmptyString;
const authorsArb = fc.array(nonEmptyString, { minLength: 1, maxLength: 5 });
const aiSentimentArb = fc.constantFrom('positive', 'negative', 'neutral');
const aiSentimentScoresArb = fc.record({
  positive: fc.float({ min: 0, max: 1, noNaN: true }),
  negative: fc.float({ min: 0, max: 1, noNaN: true }),
  neutral: fc.float({ min: 0, max: 1, noNaN: true }),
});
const aiEntitiesArb = fc.array(fc.record({ name: nonEmptyString, type: nonEmptyString }), {
  minLength: 1,
  maxLength: 5,
});
const aiSummaryArb = nonEmptyString;

const usageResponseArb: fc.Arbitrary<UsageApiResponse> = fc.record({
  plan: nonEmptyString,
  requestsUsed24Hours: fc.nat(),
  requestsLimit24Hours: fc.nat(),
  requestsRemaining24Hours: fc.nat(),
  requestsUsed30Days: fc.nat(),
});

// --- Property 5: Optional field inclusion in formatted output ---

describe('Property 5: Optional field inclusion in formatted output', () => {
  it('region field appears in formatted output when present', () => {
    fc.assert(
      fc.property(baseArticleArb, regionArb, (article, region) => {
        const enriched: NewsArticle = { ...article, region };
        const output = formatArticle(enriched, 0);
        expect(output).toContain(region);
      }),
    );
  });

  it('lang field appears in formatted output when present', () => {
    fc.assert(
      fc.property(baseArticleArb, langArb, (article, lang) => {
        const enriched: NewsArticle = { ...article, lang };
        const output = formatArticle(enriched, 0);
        expect(output).toContain(lang);
      }),
    );
  });

  it('authors array appears in formatted output when present', () => {
    fc.assert(
      fc.property(baseArticleArb, authorsArb, (article, authors) => {
        const enriched: NewsArticle = { ...article, authors };
        const output = formatArticle(enriched, 0);
        for (const author of authors) {
          expect(output).toContain(author);
        }
      }),
    );
  });

  it('ai_sentiment field appears in formatted output when present', () => {
    fc.assert(
      fc.property(baseArticleArb, aiSentimentArb, (article, ai_sentiment) => {
        const enriched: NewsArticle = { ...article, ai_sentiment };
        const output = formatArticle(enriched, 0);
        expect(output).toContain(ai_sentiment);
      }),
    );
  });

  it('ai_sentiment_scores values appear in formatted output when present', () => {
    fc.assert(
      fc.property(baseArticleArb, aiSentimentScoresArb, (article, ai_sentiment_scores) => {
        const enriched: NewsArticle = { ...article, ai_sentiment_scores };
        const output = formatArticle(enriched, 0);
        expect(output).toContain(String(ai_sentiment_scores.positive));
        expect(output).toContain(String(ai_sentiment_scores.negative));
        expect(output).toContain(String(ai_sentiment_scores.neutral));
      }),
    );
  });

  it('ai_entities appear in formatted output when present', () => {
    fc.assert(
      fc.property(baseArticleArb, aiEntitiesArb, (article, ai_entities) => {
        const enriched: NewsArticle = { ...article, ai_entities };
        const output = formatArticle(enriched, 0);
        for (const entity of ai_entities) {
          expect(output).toContain(entity.name);
          expect(output).toContain(entity.type);
        }
      }),
    );
  });

  it('ai_summary field appears in formatted output when present', () => {
    fc.assert(
      fc.property(baseArticleArb, aiSummaryArb, (article, ai_summary) => {
        const enriched: NewsArticle = { ...article, ai_summary };
        const output = formatArticle(enriched, 0);
        expect(output).toContain(ai_summary);
      }),
    );
  });

  it('all optional fields appear together when all are present', () => {
    fc.assert(
      fc.property(
        baseArticleArb,
        regionArb,
        langArb,
        authorsArb,
        aiSentimentArb,
        aiSentimentScoresArb,
        aiEntitiesArb,
        aiSummaryArb,
        (
          article,
          region,
          lang,
          authors,
          ai_sentiment,
          ai_sentiment_scores,
          ai_entities,
          ai_summary,
        ) => {
          const enriched: NewsArticle = {
            ...article,
            region,
            lang,
            authors,
            ai_sentiment,
            ai_sentiment_scores,
            ai_entities,
            ai_summary,
          };
          const output = formatArticle(enriched, 0);
          expect(output).toContain(region);
          expect(output).toContain(lang);
          for (const author of authors) {
            expect(output).toContain(author);
          }
          expect(output).toContain(ai_sentiment);
          expect(output).toContain(String(ai_sentiment_scores.positive));
          expect(output).toContain(String(ai_sentiment_scores.negative));
          expect(output).toContain(String(ai_sentiment_scores.neutral));
          for (const entity of ai_entities) {
            expect(output).toContain(entity.name);
            expect(output).toContain(entity.type);
          }
          expect(output).toContain(ai_summary);
        },
      ),
    );
  });
});

// --- Property 6: Usage response completeness ---

describe('Property 6: Usage response completeness', () => {
  it('all usage fields appear in formatted output', () => {
    fc.assert(
      fc.property(usageResponseArb, (usage) => {
        const output = formatUsageResponse(usage);
        expect(output).toContain(usage.plan);
        expect(output).toContain(String(usage.requestsUsed24Hours));
        expect(output).toContain(String(usage.requestsLimit24Hours));
        expect(output).toContain(String(usage.requestsRemaining24Hours));
        expect(output).toContain(String(usage.requestsUsed30Days));
      }),
    );
  });

  it('plan field appears in formatted output for any plan name', () => {
    fc.assert(
      fc.property(usageResponseArb, (usage) => {
        const output = formatUsageResponse(usage);
        expect(output).toContain(`Plan: ${usage.plan}`);
      }),
    );
  });

  it('requestsUsed24Hours field appears with correct label', () => {
    fc.assert(
      fc.property(usageResponseArb, (usage) => {
        const output = formatUsageResponse(usage);
        expect(output).toContain(`Requests Used (24h): ${usage.requestsUsed24Hours}`);
      }),
    );
  });

  it('requestsLimit24Hours field appears with correct label', () => {
    fc.assert(
      fc.property(usageResponseArb, (usage) => {
        const output = formatUsageResponse(usage);
        expect(output).toContain(`Requests Limit (24h): ${usage.requestsLimit24Hours}`);
      }),
    );
  });

  it('requestsRemaining24Hours field appears with correct label', () => {
    fc.assert(
      fc.property(usageResponseArb, (usage) => {
        const output = formatUsageResponse(usage);
        expect(output).toContain(`Requests Remaining (24h): ${usage.requestsRemaining24Hours}`);
      }),
    );
  });

  it('requestsUsed30Days field appears with correct label', () => {
    fc.assert(
      fc.property(usageResponseArb, (usage) => {
        const output = formatUsageResponse(usage);
        expect(output).toContain(`Requests Used (30d): ${usage.requestsUsed30Days}`);
      }),
    );
  });
});
