import { pipeline } from '@xenova/transformers';
import {
  splitSegments,
  parseQuantity,
  ruleBasedMatch,
  mergeContext,
  scoreBoost,
  enrichEmbedText,
  enrichQueryText,
  detectSeries,
} from './categoryMatcher.js';

const SIMILARITY_THRESHOLD = 0.35;

let extractor = null;
const itemEmbedCache = new Map();

async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
}

async function embed(text) {
  const ext = await getExtractor();
  const output = await ext(text, { pooling: 'mean', normalize: true });
  return Float32Array.from(output.data);
}

function cosineSimilarity(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

async function getItemEmbeddings(priceList) {
  const cacheKey = priceList.map((p) => p.Item).join('|');
  if (itemEmbedCache.has(cacheKey)) return itemEmbedCache.get(cacheKey);

  const embeddings = [];
  for (const item of priceList) {
    const vec = await embed(enrichEmbedText(item.Item));
    embeddings.push({ item: item.Item, vec, meta: item });
  }
  itemEmbedCache.set(cacheKey, embeddings);
  return embeddings;
}

async function embeddingMatch(segment, itemEmbeddings, context, usedItems) {
  const { quantity, text } = parseQuantity(segment);
  const query = text.trim();
  if (!query) return null;

  const queryVec = await embed(enrichQueryText(query));
  const seriesHint = detectSeries(query) || context.series;

  let best = null;
  let bestScore = 0;

  for (const { item, vec } of itemEmbeddings) {
    if (usedItems.has(item)) continue;
    if (seriesHint && !item.startsWith(seriesHint + ' -')) continue;

    let score = cosineSimilarity(queryVec, vec);
    score = scoreBoost(score, item, context, query);

    if (score > bestScore) {
      bestScore = score;
      best = { Item: item, Quantity: quantity, score };
    }
  }

  // Fallback: search all series if series-filtered search found nothing
  if (!best || bestScore < SIMILARITY_THRESHOLD) {
    for (const { item, vec } of itemEmbeddings) {
      if (usedItems.has(item)) continue;
      let score = cosineSimilarity(queryVec, vec);
      score = scoreBoost(score, item, context, query);
      if (score > bestScore) {
        bestScore = score;
        best = { Item: item, Quantity: quantity, score };
      }
    }
  }

  if (best && best.score >= SIMILARITY_THRESHOLD) {
    return { Item: best.Item, Quantity: best.Quantity };
  }
  return null;
}

async function matchSegment(segment, itemEmbeddings, context, usedItems, priceList) {
  const rule = ruleBasedMatch(segment, priceList, context, usedItems);
  if (rule) return rule;
  return embeddingMatch(segment, itemEmbeddings, context, usedItems);
}

export async function matchQuoteItemsAI(userInput, priceList) {
  const itemEmbeddings = await getItemEmbeddings(priceList);
  const segments = splitSegments(userInput);
  const results = [];
  const usedItems = new Set();
  let context = { series: null, model: null, size: null, tier: null };

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
