/**
 * Local hybrid AI matcher — embeddings + lexical understanding. No API key.
 */
import {
  enrichText,
  splitSegments,
  parseQuantity,
  lexicalScore,
  mergeContext,
  contextBoost,
  combineScores,
  pickBestMatch,
} from './matchScoring.js';

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

let extractor = null;
let modelLoading = null;
const vectorCache = new Map();

async function getExtractor() {
  if (extractor) return extractor;
  if (!modelLoading) {
    modelLoading = (async () => {
      const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
      env.allowLocalModels = false;
      extractor = await pipeline('feature-extraction', MODEL_ID);
      return extractor;
    })();
  }
  return modelLoading;
}

async function embed(text) {
  const key = enrichText(text).toLowerCase();
  if (vectorCache.has(key)) return vectorCache.get(key);
  const ext = await getExtractor();
  const out = await ext(`product: ${enrichText(text)}`, { pooling: 'mean', normalize: true });
  const vec = Float32Array.from(out.data);
  vectorCache.set(key, vec);
  return vec;
}

function cosineSimilarity(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

async function matchSegment(segment, priceList, usedItems, context) {
  const { quantity, text } = parseQuantity(segment);
  const query = enrichText(text);
  if (!query) return null;

  const queryVec = await embed(query);
  const scored = [];

  for (const product of priceList) {
    if (usedItems.has(product.Item)) continue;
    const itemVec = await embed(product.Item);
    const embedding = cosineSimilarity(queryVec, itemVec);
    const lexical = lexicalScore(query, product.Item);
    const ctxBoost = contextBoost(context, product.Item);
    const final = combineScores(embedding, lexical, 0, ctxBoost);
    scored.push({ item: product.Item, final, embedding, lexical, quantity });
  }

  const best = pickBestMatch(scored);
  if (!best) return null;
  return { Item: best.item, Quantity: quantity, score: best.final };
}

export async function matchQuoteItemsAI(userInput, priceList) {
  if (!userInput?.trim()) throw new Error('Describe the items you need.');
  if (!priceList?.length) throw new Error('Load a price list first.');

  await getExtractor();

  const segments = splitSegments(userInput);
  const results = [];
  const usedItems = new Set();
  let context = { series: null, model: null, tier: null, line: null };

  for (const segment of segments) {
    const match = await matchSegment(segment, priceList, usedItems, context);
    if (match) {
      results.push({ Item: match.Item, Quantity: match.Quantity });
      usedItems.add(match.Item);
      context = mergeContext(context, match.Item);
    }
  }

  return results;
}

export async function preloadModel() {
  await getExtractor();
}

export function isModelLoaded() {
  return !!extractor;
}
