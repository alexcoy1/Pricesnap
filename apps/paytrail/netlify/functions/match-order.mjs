import { matchOrderWithClaude, DEFAULT_MODEL } from './lib/claudeMatcher.mjs';

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
          details:
            'Local: add ANTHROPIC_API_KEY to apps/paytrail/.env and run npm run dev:api. Netlify: Site settings → Environment variables.',
        }),
        { status: 503, headers: JSON_HEADERS }
      );
    }

    const body = await req.json();
    const orderText = body.orderText || body.userInput || body.input || '';
    const { priceList } = body;

    if (!orderText.trim()) {
      return new Response(JSON.stringify({ error: 'Missing order text' }), {
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

    const result = await matchOrderWithClaude(orderText, priceList, apiKey);
    const model = result.model || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

    return new Response(
      JSON.stringify({
        lines: result.lines,
        matcher: 'claude',
        model,
        message: result.lines.length
          ? `AI matched ${result.lines.length} line(s) from your order`
          : 'AI could not match any lines. Try local matching or clearer text.',
      }),
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (error) {
    const message = error?.message || String(error);
    return new Response(JSON.stringify({ error: message, details: message }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
};
