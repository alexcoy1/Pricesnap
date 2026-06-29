import { IdentifiedItem, PriceListItem } from '../types';
import { matchQuoteItemsAI as matchSemantic } from './semanticMatcher';

function getApiBase(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // Production (Netlify): same origin — /api routes to Netlify Functions
  if (import.meta.env.PROD) return '';
  return 'http://localhost:3001';
}

async function matchViaServer(
  userInput: string,
  priceList: PriceListItem[],
  anthropicApiKey?: string | null
): Promise<IdentifiedItem[]> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (anthropicApiKey?.trim()) {
    headers['X-Anthropic-Key'] = anthropicApiKey.trim();
  }

  const response = await fetch(`${getApiBase()}/api/ai/generate-quote-items`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userInput, priceList }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string; details?: string }).error
        || (err as { details?: string }).details
        || `AI request failed (${response.status})`
    );
  }

  const data = await response.json();
  return (data.items || []) as IdentifiedItem[];
}

/** Production: calls Netlify Function (server holds API key). Dev: local backend or semantic fallback. */
export async function matchQuoteItemsAI(
  userInput: string,
  priceList: PriceListItem[],
  anthropicApiKey?: string | null
): Promise<IdentifiedItem[]> {
  try {
    return await matchViaServer(userInput, priceList, anthropicApiKey);
  } catch (err) {
    if (import.meta.env.PROD) {
      throw err;
    }
    console.warn('Server AI unavailable, using local fallback:', err);
    return matchSemantic(userInput, priceList);
  }
}
