const DEFAULT_MODEL = 'claude-sonnet-4-6';

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
- Understand informal descriptions (e.g. shorthand and abbreviations that map to catalog product names).
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

async function callViaProxy(apiKey, system, userMessage, model) {
  const response = await fetch('/api/claude/match', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Anthropic-Key': apiKey,
    },
    body: JSON.stringify({ system, userMessage, model }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || err.details || `Claude proxy failed (${response.status})`);
  }
  const data = await response.json();
  return data.text || data.content;
}

async function callViaBackend(userInput, priceList) {
  const response = await fetch('http://localhost:3001/api/ai/generate-quote-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userInput, priceList }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || err.details || `Backend failed (${response.status})`);
  }
  const data = await response.json();
  return data.items || [];
}

export async function matchQuoteItemsWithClaude(userInput, priceList, apiKey, options = {}) {
  if (!apiKey?.trim()) throw new Error('Claude API key is required. Add it in Settings → Preferences.');
  if (!userInput?.trim()) throw new Error('Describe the items you need.');
  if (!priceList?.length) throw new Error('Load a price list first.');

  const { system, userMessage } = buildClaudePrompt(userInput, priceList);
  const model = options.model || DEFAULT_MODEL;

  try {
    const text = await callViaProxy(apiKey.trim(), system, userMessage, model);
    return parseClaudeItems(text, priceList);
  } catch (proxyErr) {
    try {
      return await callViaBackend(userInput, priceList);
    } catch {
      throw proxyErr;
    }
  }
}

export async function matchQuoteItemsAI(userInput, priceList, apiKey) {
  if (apiKey?.trim()) {
    return matchQuoteItemsWithClaude(userInput, priceList, apiKey);
  }
  const semantic = window.__PS_SEMANTIC;
  if (!semantic?.matchQuoteItemsAI) throw new Error('AI matcher not loaded. Refresh the page.');
  return semantic.matchQuoteItemsAI(userInput, priceList);
}
