const DEFAULT_MODEL = 'claude-sonnet-4-6';
const MODEL_FALLBACKS = [
  'claude-sonnet-4-6',
  'claude-sonnet-4-5-20250929',
  'claude-3-5-haiku-20241022',
];
const MAX_CATALOG_FOR_PROMPT = 80;

function normalizePriceList(priceList) {
  return priceList
    .map((row) => {
      if (typeof row === 'string') return { Item: row };
      const item = row?.Item ?? row?.item ?? row?.name;
      if (!item) return null;
      return {
        Item: String(item).trim(),
        Price: Number(row.Price ?? row.price) || 0,
        Cost: Number(row.Cost ?? row.cost) || 0,
      };
    })
    .filter(Boolean);
}

function expandTokens(text) {
  const words = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  const tokens = new Set(words);
  for (const w of words) {
    if (w === 'sig' || w.startsWith('sig')) tokens.add('signature');
    if (w === 'prem' || w.startsWith('prem')) tokens.add('prestige');
    if (w === 'inst') tokens.add('installation');
  }
  return [...tokens];
}

function scoreCatalogItem(itemName, tokens) {
  const lower = itemName.toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (lower.includes(t)) score += t.length >= 4 ? 3 : 2;
  }
  return score;
}

function narrowCatalogForPrompt(orderText, priceList) {
  if (priceList.length <= MAX_CATALOG_FOR_PROMPT) return priceList;
  const tokens = expandTokens(orderText);
  const scored = priceList
    .map((row) => ({ row, score: scoreCatalogItem(row.Item, tokens) }))
    .sort((a, b) => b.score - a.score);
  const relevant = scored.filter((s) => s.score > 0).slice(0, MAX_CATALOG_FOR_PROMPT);
  if (relevant.length >= 8) return relevant.map((s) => s.row);
  return priceList.slice(0, MAX_CATALOG_FOR_PROMPT);
}

function buildCatalogText(priceList) {
  return priceList
    .map((p, i) => `${i + 1}. ${p.Item} (sell ${p.Price}, cost ${p.Cost})`)
    .join('\n');
}

function resolveCatalogItem(name, priceList) {
  if (!name) return null;
  const trimmed = String(name).trim();
  const exact = priceList.find((p) => p.Item === trimmed);
  if (exact) return exact;
  const lower = trimmed.toLowerCase();
  return priceList.find((p) => p.Item.toLowerCase() === lower) || null;
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

export function buildInvoiceExtractionPrompt(priceList) {
  const catalog = buildCatalogText(priceList);
  const system = `You are PayTrail, a commission calculator for field sales reps.
You read uploaded invoices, quotes, sales orders, and handwritten order photos.
Extract every product line, match each to the dealer price list, and return JSON.

Rules:
- ONLY use catalog Item names copied exactly (character-for-character).
- Infer quantity from the document; default 1.
- If a sell/line price appears on the invoice, include statedPrice (number, no $).
- Include rawLine: the text as it appeared on the invoice (short).
- Skip headers, subtotals, tax, shipping totals, and payment terms unless they are catalog line items.
- Never invent catalog items.
- JSON only, no markdown.`;

  const instructions = `DEALER PRICE LIST:
${catalog}

Read the attached invoice/quote image or PDF. Extract line items and match to the catalog.

Return JSON:
{"lines":[{"item":"<exact catalog Item>","quantity":<int>,"statedPrice":<number or omit>,"rawLine":"<text from invoice>"}]}`;

  return { system, instructions };
}

export function buildOrderMatchPrompt(orderText, priceList) {
  const catalog = buildCatalogText(priceList);
  const system = `You are PayTrail, a commission calculator for field sales reps.
You read messy order text from quotes, invoices, sales orders, emails, or handwritten notes (already typed).
Extract each line item, match it to the dealer price list, and return structured JSON.

Rules:
- ONLY use catalog Item names copied exactly (character-for-character).
- Infer quantity from text; default 1.
- If a sell price appears on the order line, include statedPrice (number, no $).
- Skip headers, totals, tax lines, and subtotals.
- Never invent catalog items.
- JSON only, no markdown.`;

  const userMessage = `PRICE LIST:
${catalog}

ORDER TEXT:
"""
${orderText.trim()}
"""

Return JSON:
{"lines":[{"item":"<exact catalog Item>","quantity":<int>,"statedPrice":<number or omit>}]}`;

  return { system, userMessage };
}

export function parseOrderMatchResponse(responseText, priceList) {
  const parsed = extractJson(responseText);
  if (!parsed) throw new Error('Claude returned invalid JSON. Try again.');

  const rows = Array.isArray(parsed.lines)
    ? parsed.lines
    : Array.isArray(parsed.items)
      ? parsed.items
      : [];

  const results = [];
  const used = new Set();

  for (const row of rows) {
    const rawName = row.item ?? row.Item ?? row.name ?? row.product;
    const quantity = Math.max(1, Math.floor(Number(row.quantity ?? row.Quantity ?? 1)) || 1);
    const statedRaw = row.statedPrice ?? row.price ?? row.Price;
    const statedPrice =
      statedRaw !== undefined && statedRaw !== null && statedRaw !== ''
        ? Number(String(statedRaw).replace(/[$,]/g, ''))
        : undefined;

    const catalogRow = resolveCatalogItem(rawName, priceList);
    if (!catalogRow || used.has(catalogRow.Item)) continue;

    results.push({
      Item: catalogRow.Item,
      Quantity: quantity,
      statedPrice: Number.isFinite(statedPrice) ? statedPrice : undefined,
      rawLine: String(row.rawLine ?? row.raw ?? row.description ?? rawName ?? '').trim() || undefined,
    });
    used.add(catalogRow.Item);
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

async function callClaudeMessages(apiKey, system, userContent, model, options = {}) {
  const content =
    typeof userContent === 'string'
      ? userContent
      : userContent;

  const hasDocument = Array.isArray(content)
    && content.some((block) => block?.type === 'document');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    ...(hasDocument ? { 'anthropic-beta': 'pdfs-2024-09-25' } : {}),
    ...options.extraHeaders,
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system,
      messages: [
        {
          role: 'user',
          content: typeof content === 'string' ? content : content,
        },
      ],
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

async function callClaudeWithFallback(apiKey, system, userContent, preferredModel) {
  const models = resolveModelCandidates(preferredModel);
  let lastError = null;
  for (const model of models) {
    try {
      const text = await callClaudeMessages(apiKey, system, userContent, model);
      return { text, model };
    } catch (error) {
      lastError = error;
      if (!isModelError(error.message)) throw error;
    }
  }
  throw lastError || new Error('No Claude model available.');
}

function buildDocumentContentBlocks(invoice, instructions) {
  const blocks = [{ type: 'text', text: instructions }];

  if (invoice.extractedText?.trim()) {
    blocks.push({
      type: 'text',
      text: `SPREADSHEET / ORDER TEXT:\n"""\n${invoice.extractedText.trim()}\n"""`,
    });
    return blocks;
  }

  if (!invoice.base64 || !invoice.mediaType) {
    throw new Error('Invoice file data is missing.');
  }

  if (invoice.mediaType === 'application/pdf') {
    blocks.push({
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: invoice.base64,
      },
    });
  } else if (invoice.mediaType.startsWith('image/')) {
    blocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: invoice.mediaType,
        data: invoice.base64,
      },
    });
  } else {
    throw new Error(`Unsupported invoice type: ${invoice.mediaType}`);
  }

  return blocks;
}

export async function extractInvoiceWithClaude(invoice, priceList, apiKey, options = {}) {
  if (!apiKey?.trim()) throw new Error('Claude API key is not configured.');
  if (!priceList?.length) throw new Error('Upload a price list first.');
  if (!invoice?.fileName) throw new Error('Upload an invoice first.');

  const normalized = normalizePriceList(priceList);
  if (!normalized.length) throw new Error('Price list has no valid items.');

  const hintText = invoice.extractedText || invoice.fileName || '';
  const promptCatalog = narrowCatalogForPrompt(hintText, normalized);
  const { system, instructions } = buildInvoiceExtractionPrompt(promptCatalog);
  const content = buildDocumentContentBlocks(invoice, instructions);
  const preferredModel = options.model || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const { text, model } = await callClaudeWithFallback(apiKey.trim(), system, content, preferredModel);
  const lines = parseOrderMatchResponse(text, normalized);
  return { lines, model };
}

export async function matchOrderWithClaude(orderText, priceList, apiKey, options = {}) {
  if (!apiKey?.trim()) throw new Error('Claude API key is not configured.');
  if (!orderText?.trim()) throw new Error('Paste or upload order text first.');
  if (!priceList?.length) throw new Error('Upload a price list first.');

  const normalized = normalizePriceList(priceList);
  if (!normalized.length) throw new Error('Price list has no valid items.');

  const promptCatalog = narrowCatalogForPrompt(orderText, normalized);
  const { system, userMessage } = buildOrderMatchPrompt(orderText, promptCatalog);
  const preferredModel = options.model || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const { text, model } = await callClaudeWithFallback(apiKey.trim(), system, userMessage, preferredModel);
  const lines = parseOrderMatchResponse(text, normalized);
  return { lines, model };
}

export { DEFAULT_MODEL };
