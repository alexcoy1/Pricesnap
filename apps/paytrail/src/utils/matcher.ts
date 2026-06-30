import type { CatalogItem, MatchConfidence } from '../types';

const STOP = new Set(['a', 'an', 'the', 'with', 'and', 'or', 'for', 'to', 'of', 'in', 'on', 'at']);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((w) => w.length > 1 && !STOP.has(w));
}

function expandToken(t: string): string[] {
  const set = new Set([t]);
  if (t.length > 4 && t.endsWith('s')) set.add(t.slice(0, -1));
  if (t === 'sig' || t.startsWith('sig')) set.add('signature');
  if (t === 'prem' || t.startsWith('prem')) set.add('prestige');
  if (t === 'inst') set.add('installation');
  return [...set];
}

function tokenSet(text: string): Set<string> {
  const out = new Set<string>();
  for (const t of tokens(text)) expandToken(t).forEach((x) => out.add(x));
  return out;
}

export function scoreMatch(query: string, catalogName: string): number {
  const q = normalize(query);
  const c = normalize(catalogName);
  if (!q || !c) return 0;
  if (c === q || c.includes(q) || q.includes(c)) return 1;

  const qTokens = tokenSet(query);
  const cTokens = tokenSet(catalogName);
  if (!qTokens.size || !cTokens.size) return 0;

  let overlap = 0;
  for (const t of qTokens) {
    if (cTokens.has(t)) overlap += 1;
  }

  const recall = overlap / qTokens.size;
  const precision = overlap / cTokens.size;
  const f1 = recall + precision > 0 ? (2 * recall * precision) / (recall + precision) : 0;

  const qFirst = [...qTokens][0];
  const startsBonus = qFirst && c.startsWith(qFirst) ? 0.12 : 0;
  return Math.min(1, f1 + startsBonus);
}

function confidenceFromScore(score: number): MatchConfidence {
  if (score >= 0.72) return 'high';
  if (score >= 0.45) return 'medium';
  if (score >= 0.28) return 'low';
  return 'none';
}

export interface MatchResult {
  item: CatalogItem | null;
  score: number;
  confidence: MatchConfidence;
}

export function matchToCatalog(
  description: string,
  catalog: CatalogItem[],
  usedItems: Set<string> = new Set()
): MatchResult {
  let best: CatalogItem | null = null;
  let bestScore = 0;

  for (const item of catalog) {
    if (usedItems.has(item.Item)) continue;
    const score = scoreMatch(description, item.Item);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return {
    item: bestScore >= 0.28 ? best : null,
    score: bestScore,
    confidence: confidenceFromScore(bestScore),
  };
}
