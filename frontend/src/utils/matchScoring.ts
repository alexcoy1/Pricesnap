/**
 * Hybrid scoring: neural embeddings + lexical understanding + series context.
 */
export const ALIASES = {
  pres: ['prestige'],
  prestige: ['prestige'],
  sig: ['signature'],
  signature: ['signature'],
  cub: ['cub'],
  fox: ['fox', 'arctic'],
  summit: ['summit'],
  spa: ['spa', 'spaboy'],
  boy: ['boy', 'spaboy'],
  spaboy: ['spaboy', 'spa', 'boy'],
  onzen: ['onzen'],
  light: ['lighting', 'light'],
  lights: ['lighting', 'light'],
  lighting: ['lighting', 'light'],
  family: ['family'],
  cover: ['cover'],
  del: ['delivery'],
  delivery: ['delivery'],
  inst: ['installation'],
  install: ['installation'],
  installation: ['installation'],
};

const STOP_WORDS = new Set(['a', 'an', 'the', 'with', 'and', 'or', 'for', 'to', 'of', 'in', 'on', 'at']);

export function enrichText(text: string): string {
  return String(text)
    .replace(/\bsig\b/gi, 'signature')
    .replace(/\bpres\b/gi, 'prestige')
    .replace(/\bdel\b/gi, 'delivery')
    .replace(/\binst\b/gi, 'installation')
    .replace(/\blights\b/gi, 'lighting')
    .replace(/\bspa\s*boy\b/gi, 'spaboy')
    .replace(/\bfamily\s+lights\b/gi, 'family lighting')
    .trim();
}

export function splitSegments(userInput: string): string[] {
  const normalized = enrichText(userInput)
    .replace(/\s+(?:and|with|plus|also|including|along with|as well as|&)\s+/gi, ', ')
    .replace(/,\s*/g, ',');
  const segments = normalized.split(',').map((s) => s.trim()).filter(Boolean);
  return segments.length ? segments : [userInput.trim()];
}

export function parseQuantity(segment: string) {
  const numMatch = segment.match(/(\d+(?:\.\d+)?)\s*(?:x|×)?/i);
  if (numMatch) {
    return {
      quantity: Math.max(1, Math.round(parseFloat(numMatch[1]))),
      text: segment.replace(numMatch[0], ' ').trim(),
    };
  }
  return { quantity: 1, text: segment.trim() };
}

function normalizeForMatch(text: string): string {
  return enrichText(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function expandToken(token: string): string[] {
  const set = new Set([token]);
  if (token.length > 4 && token.endsWith('s')) set.add(token.slice(0, -1));
  const aliases = ALIASES[token as keyof typeof ALIASES];
  if (aliases) aliases.forEach((a) => set.add(a));
  if (token.startsWith('pres')) set.add('prestige');
  return [...set];
}

export function queryTokens(query: string): string[] {
  const words = normalizeForMatch(query).split(' ').filter((w) => w && !STOP_WORDS.has(w));
  const expanded = new Set<string>();
  for (const w of words) expandToken(w).forEach((t) => expanded.add(t));
  if (/\bspa\s*boy\b/i.test(query) || /\bspaboy\b/i.test(query)) {
    expanded.add('spaboy');
    expanded.add('spa');
    expanded.add('boy');
  }
  if (/\bcub\b/i.test(query) && /\bprestige\b/i.test(query)) {
    expanded.add('cub');
    expanded.add('prestige');
  }
  return [...expanded];
}

function itemTokens(itemName: string): string[] {
  const words = normalizeForMatch(itemName).split(' ').filter(Boolean);
  const expanded = new Set<string>();
  for (const w of words) expandToken(w).forEach((t) => expanded.add(t));
  if (/spa\s*boy|spaboy/i.test(itemName)) {
    expanded.add('spaboy');
    expanded.add('spa');
    expanded.add('boy');
  }
  return [...expanded];
}

export function lexicalScore(query: string, itemName: string): number {
  const qTokens = queryTokens(query);
  if (!qTokens.length) return 0;
  const iTokens = itemTokens(itemName);
  const iJoined = normalizeForMatch(itemName);

  let hits = 0;
  let weight = 0;
  for (const qt of qTokens) {
    const tokenWeight = qt.length >= 5 ? 2 : qt.length >= 3 ? 1.5 : 1;
    weight += tokenWeight;
    const direct = iTokens.some((it) => it === qt || it.includes(qt) || qt.includes(it));
    const substring = qt.length >= 3 && iJoined.includes(qt);
    if (direct || substring) hits += tokenWeight;
  }

  let score = weight > 0 ? hits / weight : 0;
  const qNorm = normalizeForMatch(query);

  if (/\bcub\b/.test(qNorm) && /\bprestige\b/.test(qNorm) && /\bcub\b/.test(iJoined) && /\bprestige\b/.test(iJoined)) {
    score = Math.min(1, score + 0.35);
  }
  if ((/\bspaboy\b/.test(qNorm) || /\bspa boy\b/.test(qNorm)) && /spa\s*boy|spaboy/i.test(itemName)) {
    score = Math.min(1, score + 0.35);
  }
  if (/\bonzen\b/.test(qNorm) && /\bonzen\b/.test(iJoined)) {
    score = Math.min(1, score + 0.25);
  }
  if (/\bfamily\b/.test(qNorm) && /\blight/.test(qNorm) && /\bfamily\b/.test(iJoined) && /\blight/.test(iJoined)) {
    score = Math.min(1, score + 0.3);
  }

  return Math.min(1, score);
}

export interface MatchContext {
  series: string | null;
  model: string | null;
  tier: string | null;
  line: string | null;
}

export function extractContext(itemName: string): MatchContext {
  const lower = itemName.toLowerCase();
  const ctx: MatchContext = { series: null, model: null, tier: null, line: null };

  if (/^cub\b|\bcub\s+prestige|\bcub\s+signature/i.test(itemName)) {
    ctx.series = 'cub';
    ctx.line = 'Custom';
  } else if (lower.startsWith('custom -')) {
    ctx.line = 'Custom';
    if (/arctic\s*fox|\bfox\b/i.test(itemName)) ctx.model = 'fox';
    else if (/summit/i.test(itemName)) ctx.model = 'summit';
  } else if (lower.startsWith('classic -')) ctx.line = 'Classic';
  else if (lower.startsWith('core -')) ctx.line = 'Core';
  else if (lower.startsWith('awp -')) ctx.line = 'AWP';

  if (/prestige/i.test(itemName)) ctx.tier = 'prestige';
  else if (/signature/i.test(itemName)) ctx.tier = 'signature';

  return ctx;
}

export function mergeContext(existing: MatchContext, itemName: string): MatchContext {
  const next = extractContext(itemName);
  return {
    series: existing.series || next.series,
    model: existing.model || next.model,
    tier: existing.tier || next.tier,
    line: existing.line || next.line,
  };
}

export function contextBoost(context: MatchContext, itemName: string): number {
  if (!context.line && !context.series) return 0;
  let boost = 0;
  const lower = itemName.toLowerCase();

  if (context.series === 'cub' && /\bcub\b/i.test(itemName)) boost += 0.2;
  if (context.line === 'Custom' && lower.startsWith('custom -')) boost += 0.12;
  if (context.line === 'Classic' && lower.startsWith('classic -')) boost += 0.12;
  if (context.line === 'Custom' && lower.startsWith('classic -')) boost -= 0.15;
  if (context.series === 'cub' && lower.startsWith('awp -')) boost -= 0.25;
  if (context.model === 'fox' && /\bfox\b/i.test(itemName)) boost += 0.1;

  return boost;
}

export function combineScores(embedding: number, lexical: number, phraseBoost: number, ctxBoost: number): number {
  return 0.3 * embedding + 0.55 * lexical + phraseBoost + ctxBoost;
}

export const MIN_FINAL_SCORE = 0.38;

export function pickBestMatch(
  scored: Array<{ item: string; final: number; embedding: number; lexical: number }>
) {
  if (!scored.length) return null;
  scored.sort((a, b) => b.final - a.final);
  const best = scored[0];
  const second = scored[1];

  if (best.final < MIN_FINAL_SCORE) return null;
  if (best.lexical < 0.2 && best.embedding < 0.42) return null;
  if (second && best.final - second.final < 0.06 && best.lexical < 0.45) return null;
  return best;
}
