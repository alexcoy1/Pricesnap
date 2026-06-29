const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function buildCatalogText(priceList) {
  return priceList.map((p, i) => `${i + 1}. ${p.Item}`).join('\n');
}

function resolveCatalogItem(name, priceList) {
  if (!name) return null;
  const trimmed = String(name).trim();
  const exact = priceList.find((p) => p.Item === trimmed);
  if (exact) return exact.Item;
  const lower = trimmed.toLowerCase();
  const caseInsensitive = priceList.find((p) => p.Item.toLowerCase() === lower);
  return caseInsensitive ? caseInsensitive.Item : null;
}

function parseModelItems(payload) {
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.matches)) return payload.matches;
  if (Array.isArray(payload.lineItems)) return payload.lineItems;
  return [];
}

export async function matchQuoteItemsWithLLM(userInput, priceList, options = {}) {
  const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is required. Add OPENAI_API_KEY to the backend environment or enter your key in Settings.');
  }
  if (!userInput?.trim()) {
    throw new Error('Describe the items you need.');
  }
  if (!priceList?.length) {
    throw new Error('Load a price list first.');
  }

  const model = options.model || DEFAULT_MODEL;
  const catalog = buildCatalogText(priceList);

  const systemPrompt = `You are an expert sales quoting assistant. You read customer requests in natural language — including abbreviations, slang, typos, and shorthand — and map them to exact products from a catalog.

Rules:
- ONLY use product names copied exactly from the catalog (character-for-character).
- Infer quantities from the text; default quantity is 1.
- When the customer mentions multiple products, return multiple line items.
- Understand informal descriptions (e.g. "cub sig" → the Cub Signature product in the catalog).
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
    const message = errBody.error?.message || `AI request failed (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI returned an empty response. Try again.');
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('AI returned invalid JSON. Try again.');
  }

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
