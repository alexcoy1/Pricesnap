const DEFAULT_MODEL = 'claude-sonnet-4-6';
const MODEL_FALLBACKS = [
  'claude-sonnet-4-6',
  'claude-sonnet-4-5-20250929',
  'claude-3-5-haiku-20241022',
];
const MAX_CATALOG_FOR_PROMPT = 60;

const ALIASES = {
  pres: ['prestige'],
  sig: ['signature'],
  cub: ['cub'],
  spaboy: ['spaboy', 'spa', 'boy'],
  spa: ['spa', 'spaboy'],
  boy: ['boy', 'spaboy'],
  onzen: ['onzen'],
  light: ['lighting', 'light'],
  lights: ['lighting', 'light'],
  family: ['family'],
  cover: ['cover'],
  fox: ['fox', 'arctic'],
  summit: ['summit'],
};

function normalizePriceList(priceList) {
  return priceList.map((row) => {
    if (typeof row === 'string') return { Item: row };
    const item = row?.Item ?? row?.item ?? row?.name;
    return item ? { Item: String(item).trim() } : null;
  }).filter(Boolean);
}

function expandTokens(text) {
  const words = String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 2);
  const tokens = new Set(words);
  for (const w of words) {
    const aliases = ALIASES[w];
    if (aliases) aliases.forEach((a) => tokens.add(a));
    if (w === 'pres') tokens.add('prestige');
    if (w === 'sig') tokens.add('signature');
  }
  if (/\bspa\s*boy\b/i.test(text) || /\bspaboy\b/i.test(text)) {
    tokens.add('spaboy');
    tokens.add('spa');
    tokens.add('boy');
  }
  return [...tokens];
}

function scoreCatalogItem(itemName, tokens) {
  const lower = itemName.toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (lower.includes(t)) score += t.length >= 4 ? 3 : 2;
  }
  if (tokens.includes('cub') && tokens.includes('prestige') && lower.includes('cub') && lower.includes('prestige')) score += 5;
  if (tokens.includes('spaboy') && /spa\s*boy|spaboy/i.test(itemName)) score += 5;
  if (tokens.includes('onzen') && lower.includes('onzen')) score += 4;
  if (tokens.includes('family') && tokens.some((t) => t.startsWith('light')) && lower.includes('family') && /light/.test(lower)) score += 4;
  return score;
}

function narrowCatalogForPrompt(userInput, priceList) {
  if (priceList.length <= MAX_CATALOG_FOR_PROMPT) return priceList;
  const tokens = expandTokens(userInput);
  const scored = priceList
    .map((row) => ({ row, score: scoreCatalogItem(row.Item, tokens) }))
    .sort((a, b) => b.score - a.score);
  const relevant = scored.filter((s) => s.score > 0).slice(0, MAX_CATALOG_FOR_PROMPT);
  if (relevant.length >= 8) return relevant.map((s) => s.row);
  return priceList.slice(0, MAX_CATALOG_FOR_PROMPT);
}

function buildCatalogText(priceList) {
  return priceList.map((p, i) => `${i + 1}. ${p.Item}`).join('\n');
}

function resolveCatalogItem(name, priceList) {
  if (!name) return null;
  const trimmed = String(name).trim();
  const exact = priceList.find((p) => p.Item === trimmed);
  if (exact) return exact.Item;
  const lower = trimmed.toLowerCase();
  const ci = priceList.find((p) => p.Item.toLowerCase() === lower);
  return ci ? ci.Item : null;
}

function parseModelItems(payload) {
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.matches)) return payload.matches;
  if (Array.isArray(payload.lineItems)) return payload.lineItems;
  return [];
}

function extractJson(text) {
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1].trim() : text.trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function buildClaudePrompt(userInput, priceList) {
  const catalog = buildCatalogText(priceList);
  const system = `You are an expert sales quoting assistant. You read customer requests in natural language — including abbreviations, slang, typos, and shorthand — and map them to exact products from a catalog.

Rules:
- ONLY use product names copied exactly from the catalog (character-for-character).
- Infer quantities from the text; default quantity is 1.
- When the customer mentions multiple products, return multiple line items.
- Understand informal descriptions (e.g. "cub pres" → Cub Prestige, "spa boy" → SpaBoy).
- Never invent products that are not in the catalog.
- Respond with JSON only, no markdown.`;

  const userMessage = `CATALOG:
${catalog}

CUSTOMER REQUEST:
"${userInput.trim()}"

Return JSON in this shape:
{"items":[{"item":"<exact catalog product name>","quantity":<positive integer>}]}`;

  return { system, userMessage };
}

export function parseClaudeItems(responseText, priceList) {
  const parsed = extractJson(responseText);
  if (!parsed) throw new Error('Claude returned invalid JSON. Try again.');

  const rows = parseModelItems(parsed);
  const results = [];
  const used = new Set();

  for (const row of rows) {
    const rawName = row.item ?? row.Item ?? row.name ?? row.product;
    const quantity = Math.max(1, Math.floor(Number(row.quantity ?? row.Quantity ?? 1)) || 1);
    const resolved = resolveCatalogItem(rawName, priceList);
    if (resolved && !used.has(resolved)) {
      results.push({ Item: resolved, Quantity: quantity });
      used.add(resolved);
    }
  }

  return results;
}

function resolveModelCandidates(preferred) {
  const seen = new Set();
  const models = [];
  for (const m of [preferred, DEFAULT_MODEL, ...MODEL_FALLBACKS]) {
    if (m && !seen.has(m)) {
      seen.add(m);
      models.push(m);
    }
  }
  return models;
}

function isModelError(message) {
  return /model|not[_\s-]?found|deprecated|retired|invalid/i.test(message || '');
}

export async function callClaudeMessages(apiKey, system, userMessage, model = DEFAULT_MODEL) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const message = errBody.error?.message || `Claude API request failed (${response.status})`;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  const text = data.content?.find((b) => b.type === 'text')?.text;
  if (!text) throw new Error('Claude returned an empty response.');
  return text;
}

async function callClaudeWithFallback(apiKey, system, userMessage, preferredModel) {
  const models = resolveModelCandidates(preferredModel);
  let lastError = null;
  for (const model of models) {
    try {
      const text = await callClaudeMessages(apiKey, system, userMessage, model);
      return { text, model };
    } catch (error) {
      lastError = error;
      if (!isModelError(error.message)) throw error;
    }
  }
  throw lastError || new Error('No Claude model available.');
}

export async function matchQuoteItemsWithClaude(userInput, priceList, apiKey, options = {}) {
  if (!apiKey?.trim()) throw new Error('Claude API key is not configured on the server.');
  if (!userInput?.trim()) throw new Error('Describe the items you need.');
  if (!priceList?.length) throw new Error('Load a price list first.');

  const normalized = normalizePriceList(priceList);
  if (!normalized.length) throw new Error('Price list has no valid items.');

  const promptCatalog = narrowCatalogForPrompt(userInput, normalized);
  const { system, userMessage } = buildClaudePrompt(userInput, promptCatalog);
  const preferredModel = options.model || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const { text, model } = await callClaudeWithFallback(apiKey.trim(), system, userMessage, preferredModel);
  const items = parseClaudeItems(text, normalized);
  return { items, model };
}

export { DEFAULT_MODEL };
