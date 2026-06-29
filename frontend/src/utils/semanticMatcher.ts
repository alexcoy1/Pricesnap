import { PriceListItem, IdentifiedItem } from '../types';
import {
  enrichText,
  splitSegments,
  parseQuantity,
  lexicalScore,
  mergeContext,
  contextBoost,
  combineScores,
  pickBestMatch,
  type MatchContext,
} from './matchScoring';

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type Embedder = (text: string, options: { pooling: string; normalize: boolean }) => Promise<{ data: Float32Array | number[] }>;

let extractor: Embedder | null = null;
const vectorCache = new Map<string, Float32Array>();

async function getExtractor(): Promise<Embedder> {
  if (!extractor) {
    const { pipeline } = await import('@xenova/transformers');
    extractor = await pipeline('feature-extraction', MODEL_ID) as Embedder;
  }
  return extractor;
}

async function embed(text: string): Promise<Float32Array> {
  const key = enrichText(text).toLowerCase();
  if (vectorCache.has(key)) return vectorCache.get(key)!;
  const ext = await getExtractor();
  const output = await ext(`product: ${enrichText(text)}`, { pooling: 'mean', normalize: true });
  const vec = Float32Array.from(output.data);
  vectorCache.set(key, vec);
  return vec;
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

async function matchSegment(
  segment: string,
  priceList: PriceListItem[],
  usedItems: Set<string>,
  context: MatchContext
): Promise<IdentifiedItem | null> {
  const { quantity, text } = parseQuantity(segment);
  const query = enrichText(text);
  if (!query) return null;

  const queryVec = await embed(query);
  const scored: Array<{ item: string; final: number; embedding: number; lexical: number }> = [];

  for (const product of priceList) {
    if (usedItems.has(product.Item)) continue;
    const itemVec = await embed(product.Item);
    const embedding = cosineSimilarity(queryVec, itemVec);
    const lexical = lexicalScore(query, product.Item);
    const ctxBoost = contextBoost(context, product.Item);
    const final = combineScores(embedding, lexical, 0, ctxBoost);
    scored.push({ item: product.Item, final, embedding, lexical });
  }

  const best = pickBestMatch(scored);
  if (!best) return null;
  return { Item: best.item, Quantity: quantity };
}

async function matchLocally(userInput: string, priceList: PriceListItem[]): Promise<IdentifiedItem[]> {
  const segments = splitSegments(userInput);
  const results: IdentifiedItem[] = [];
  const usedItems = new Set<string>();
  let context: MatchContext = { series: null, model: null, tier: null, line: null };

  for (const segment of segments) {
    const match = await matchSegment(segment, priceList, usedItems, context);
    if (match) {
      results.push(match);
      usedItems.add(match.Item);
      context = mergeContext(context, match.Item);
    }
  }

  return results;
}

async function matchViaBackend(userInput: string, priceList: PriceListItem[]): Promise<IdentifiedItem[]> {
  const response = await fetch(`${API_BASE}/api/ai/generate-quote-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userInput, priceList }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Backend request failed (${response.status})`);
  }
  const data = await response.json();
  return (data.items || []) as IdentifiedItem[];
}

export async function matchQuoteItemsAI(
  userInput: string,
  priceList: PriceListItem[]
): Promise<IdentifiedItem[]> {
  try {
    return await matchViaBackend(userInput, priceList);
  } catch {
    return matchLocally(userInput, priceList);
  }
}
