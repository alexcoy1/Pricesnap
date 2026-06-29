import { matchQuoteItemsWithClaude, DEFAULT_MODEL } from './lib/claudeMatcher.mjs';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Anthropic-Key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY || req.headers.get('x-anthropic-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'Claude API key not configured',
          details: 'Set ANTHROPIC_API_KEY in Netlify → Site settings → Environment variables',
        }),
        { status: 503, headers: JSON_HEADERS }
      );
    }

    const body = await req.json();
    const userInput = body.userInput || body.input;
    const { priceList } = body;

    if (!userInput?.trim()) {
      return new Response(JSON.stringify({ error: 'Missing input text' }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }
    if (!priceList?.length) {
      return new Response(JSON.stringify({ error: 'A valid price list is required' }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    const items = await matchQuoteItemsWithClaude(userInput, priceList, apiKey);
    const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

    return new Response(
      JSON.stringify({
        items,
        matcher: 'claude',
        model,
        message: items.length
          ? `AI matched ${items.length} item(s) from your description`
          : 'AI could not match any catalog items. Try being more specific.',
      }),
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'AI processing failed',
        details: error.message || String(error),
      }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
