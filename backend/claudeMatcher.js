const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

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
    throw new Error(message);
  }

  const data = await response.json();
  const text = data.content?.find((b) => b.type === 'text')?.text;
  if (!text) throw new Error('Claude returned an empty response.');
  return text;
}

export async function matchQuoteItemsWithClaude(userInput, priceList, apiKey, options = {}) {
  if (!apiKey?.trim()) throw new Error('Claude API key is required.');
  if (!userInput?.trim()) throw new Error('Describe the items you need.');
  if (!priceList?.length) throw new Error('Load a price list first.');

  const { system, userMessage } = buildClaudePrompt(userInput, priceList);
  const model = options.model || DEFAULT_MODEL;
  const text = await callClaudeMessages(apiKey.trim(), system, userMessage, model);
  return parseClaudeItems(text, priceList);
}

export { DEFAULT_MODEL };
