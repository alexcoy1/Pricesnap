import { extractInvoiceWithClaude, DEFAULT_MODEL } from './lib/claudeMatcher.mjs';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Anthropic-Key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function resolveApiKey(req) {
  const envKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (envKey) return envKey;

  const allowDevHeader =
    process.env.PAYTRAIL_DEV === 'true' || process.env.NETLIFY_DEV === 'true';
  if (allowDevHeader) {
    return req.headers.get('x-anthropic-key')?.trim() || '';
  }
  return '';
}

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
    const apiKey = resolveApiKey(req);
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'AI not configured',
          details:
            process.env.PAYTRAIL_DEV === 'true' || process.env.NETLIFY_DEV === 'true'
              ? 'Add your Anthropic API key in PayTrail Settings → Invoice AI (local dev), or set ANTHROPIC_API_KEY in apps/paytrail/.env.'
              : 'Invoice reading requires ANTHROPIC_API_KEY in Netlify → Site settings → Environment variables.',
        }),
        { status: 503, headers: JSON_HEADERS }
      );
    }

    const body = await req.json();
    const { invoice, priceList } = body;

    if (!invoice?.fileName) {
      return new Response(JSON.stringify({ error: 'Upload an invoice file first' }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }
    if (!priceList?.length) {
      return new Response(JSON.stringify({ error: 'Upload your price list first' }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    const result = await extractInvoiceWithClaude(invoice, priceList, apiKey);
    const model = result.model || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

    return new Response(
      JSON.stringify({
        lines: result.lines,
        matcher: 'claude-vision',
        model,
        message: result.lines.length
          ? `Read ${result.lines.length} line(s) from your invoice`
          : 'No matching line items found. Try a clearer scan or photo.',
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
