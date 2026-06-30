import { extractInvoiceWithClaude } from '../netlify/functions/lib/claudeMatcher.mjs';

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));

const apiKey = body.apiKey || process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error(JSON.stringify({ error: 'Missing API key' }));
  process.exit(1);
}

try {
  const result = await extractInvoiceWithClaude(body.invoice, body.priceList, apiKey);
  process.stdout.write(
    JSON.stringify({
      lines: result.lines,
      matcher: 'claude-vision',
      model: result.model,
      message: result.lines.length
        ? `Claude read ${result.lines.length} line(s) from your invoice`
        : 'No line items found',
    })
  );
} catch (error) {
  console.error(JSON.stringify({ error: error.message || String(error) }));
  process.exit(1);
}
