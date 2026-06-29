import { IdentifiedItem, PriceListItem } from '../types';

const DEFAULT_MODEL = 'gpt-4o-mini';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function buildCatalogText(priceList: PriceListItem[]) {
  return priceList.map((p, i) => `${i + 1}. ${p.Item}`).join('\n');
}

function resolveCatalogItem(name: string, priceList: PriceListItem[]): string | null {
  const trimmed = name.trim();
  const exact = priceList.find((p) => p.Item === trimmed);
  if (exact) return exact.Item;
  const lower = trimmed.toLowerCase();
  const caseInsensitive = priceList.find((p) => p.Item.toLowerCase() === lower);
  return caseInsensitive ? caseInsensitive.Item : null;
}

function parseModelItems(payload: Record<string, unknown>): Array<Record<string, unknown>> {
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.matches)) return payload.matches;
  if (Array.isArray(payload.lineItems)) return payload.lineItems;
  return [];
}

async function matchWithOpenAI(
  userInput: string,
  priceList: PriceListItem[],
  apiKey: string,
  model = DEFAULT_MODEL
): Promise<IdentifiedItem[]> {
  const catalog = buildCatalogText(priceList);

  const systemPrompt = `You are an expert sales quoting assistant. You read customer requests in natural language — including abbreviations, slang, typos, and shorthand — and map them to exact products from a catalog.

Rules:
- ONLY use product names copied exactly from the catalog (character-for-character).
- Infer quantities from the text; default quantity is 1.
- When the customer mentions multiple products, return multiple line items.
- Understand informal descriptions (e.g. abbreviations and shorthand that map to catalog product names).
- Never invent products that are not in the catalog.
- Respond with JSON only.`;

  const userPrompt = `CATALOG:
${catalog}

CUSTOMER REQUEST:
"${userInput.trim()}"

Return JSON in this shape:
{"items":[{"item":"<exact catalog product name>","quantity":<positive integer>}]}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const message = (errBody as { error?: { message?: string } }).error?.message || `AI request failed (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content as string | undefined;
  if (!content) throw new Error('AI returned an empty response. Try again.');

  const parsed = JSON.parse(content) as Record<string, unknown>;
  const rows = parseModelItems(parsed);
  const results: IdentifiedItem[] = [];
  const used = new Set<string>();

  for (const row of rows) {
    const rawName = String(row.item ?? row.Item ?? row.name ?? row.product ?? '');
    const quantity = Math.max(1, Math.floor(Number(row.quantity ?? row.Quantity ?? 1)) || 1);
    const resolved = resolveCatalogItem(rawName, priceList);
    if (resolved && !used.has(resolved)) {
      results.push({ Item: resolved, Quantity: quantity });
      used.add(resolved);
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
    throw new Error((err as { error?: string; details?: string }).error || (err as { details?: string }).details || `Backend AI request failed (${response.status})`);
  }
  const data = await response.json();
  return (data.items || []) as IdentifiedItem[];
}

export async function matchQuoteItemsWithLLM(
  userInput: string,
  priceList: PriceListItem[],
  apiKey?: string | null
): Promise<IdentifiedItem[]> {
  try {
    return await matchViaBackend(userInput, priceList);
  } catch {
    if (!apiKey) {
      throw new Error('OpenAI API key required. Add your key in Settings → Preferences, or start the backend with OPENAI_API_KEY set.');
    }
    return matchWithOpenAI(userInput, priceList, apiKey);
  }
}
