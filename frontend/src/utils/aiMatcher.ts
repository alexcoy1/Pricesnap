import type { PriceListItem, IdentifiedItem } from '../types';
import {
  splitSegments,
  parseQuantity,
  ruleBasedMatch,
  mergeContext,
  scoreBoost,
  enrichEmbedText,
  enrichQueryText,
  detectSeries,
} from './categoryMatcher';

const SIMILARITY_THRESHOLD = 0.35;

type Embedder = (text: string, options: { pooling: string; normalize: boolean }) => Promise<{ data: Float32Array | number[] }>;

let extractor: Embedder | null = null;
const itemEmbedCache = new Map<string, { item: string; vec: Float32Array }[]>();

async function getExtractor(): Promise<Embedder> {
  if (!extractor) {
    const { pipeline } = await import('@xenova/transformers');
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2') as Embedder;
  }
  return extractor;
}

async function embed(text: string): Promise<Float32Array> {
  const ext = await getExtractor();
  const output = await ext(text, { pooling: 'mean', normalize: true });
  return Float32Array.from(output.data);
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

async function getItemEmbeddings(priceList: PriceListItem[]) {
  const cacheKey = priceList.map((p) => p.Item).join('|');
  if (itemEmbedCache.has(cacheKey)) return itemEmbedCache.get(cacheKey)!;

  const embeddings: { item: string; vec: Float32Array }[] = [];
  for (const item of priceList) {
    const vec = await embed(enrichEmbedText(item.Item));
    embeddings.push({ item: item.Item, vec });
  }
  itemEmbedCache.set(cacheKey, embeddings);
  return embeddings;
}

async function embeddingMatch(
  segment: string,
  itemEmbeddings: { item: string; vec: Float32Array }[],
  context: ReturnType<typeof mergeContext>,
  usedItems: Set<string>
): Promise<IdentifiedItem | null> {
  const { quantity, text } = parseQuantity(segment);
  const query = text.trim();
  if (!query) return null;

  const queryVec = await embed(enrichQueryText(query));
  const seriesHint = detectSeries(query) || context.series;

  let best: IdentifiedItem | null = null;
  let bestScore = 0;

  const scorePool = (filterSeries: string | null) => {
    for (const { item, vec } of itemEmbeddings) {
      if (usedItems.has(item)) continue;
      if (filterSeries && !item.startsWith(filterSeries + ' -')) continue;
      let score = cosineSimilarity(queryVec, vec);
      score = scoreBoost(score, item, context, query);
      if (score > bestScore) {
        bestScore = score;
        best = { Item: item, Quantity: quantity };
      }
    }
  };

  scorePool(seriesHint);
  if (!best || bestScore < SIMILARITY_THRESHOLD) scorePool(null);

  if (best && bestScore >= SIMILARITY_THRESHOLD) return best;
  return null;
}

async function matchSegment(
  segment: string,
  itemEmbeddings: { item: string; vec: Float32Array }[],
  context: ReturnType<typeof mergeContext>,
  usedItems: Set<string>,
  priceList: PriceListItem[]
): Promise<IdentifiedItem | null> {
  const rule = ruleBasedMatch(segment, priceList, context, usedItems);
  if (rule) return rule;
  return embeddingMatch(segment, itemEmbeddings, context, usedItems);
}

export async function matchQuoteItemsAI(
  userInput: string,
  priceList: PriceListItem[]
): Promise<IdentifiedItem[]> {
  const itemEmbeddings = await getItemEmbeddings(priceList);
  const segments = splitSegments(userInput);
  const results: IdentifiedItem[] = [];
  const usedItems = new Set<string>();
  let context = { series: null as string | null, model: null as string | null, size: null as string | null, tier: null as string | null };

  for (const segment of segments) {
    const match = await matchSegment(segment, itemEmbeddings, context, usedItems, priceList);
    if (match) {
      results.push(match);
      usedItems.add(match.Item);
      context = mergeContext(context, match.Item);
    }
  }

  if (!results.length) {
    const match = await matchSegment(userInput, itemEmbeddings, context, usedItems, priceList);
    if (match) results.push(match);
  }

  return results;
}
